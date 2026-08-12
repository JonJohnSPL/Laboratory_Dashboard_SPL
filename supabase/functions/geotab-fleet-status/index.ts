import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

class GeotabError extends Error {
  type: string;

  constructor(type: string, message: string) {
    super(message);
    this.type = type;
  }
}

type Env = {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  geotabServer: string;
  geotabDatabase: string;
  geotabUsername: string;
  geotabPassword: string;
};

type GeotabCredentials = {
  database: string;
  userName: string;
  sessionId: string;
};

type GeotabSession = {
  host: string;
  credentials: GeotabCredentials;
};

type RecordValue = Record<string, unknown>;

let cachedSession: GeotabSession | null = null;

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (request.method !== "POST") {
      throw new HttpError(405, "Use POST to refresh Geotab fleet status.");
    }

    const env = readEnv();
    await requireAppAdmin(request, env);
    const body = await request.json().catch(() => ({}));
    if (stringValue(body?.action || "sync") !== "sync") {
      throw new HttpError(400, "Unsupported Geotab fleet action.");
    }

    const result = await syncFleetStatus(env);
    return jsonResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to refresh Geotab fleet status.";
    const status = error instanceof HttpError ? error.status : 500;
    return jsonResponse({ error: message }, status);
  }
});

function readEnv(): Env {
  return {
    supabaseUrl: requiredEnv("SUPABASE_URL").replace(/\/+$/, ""),
    supabaseServiceRoleKey: requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    geotabServer: normalizeHost(Deno.env.get("GEOTAB_SERVER") || "my.geotab.com"),
    geotabDatabase: requiredEnv("GEOTAB_DATABASE"),
    geotabUsername: requiredEnv("GEOTAB_USERNAME"),
    geotabPassword: requiredEnv("GEOTAB_PASSWORD"),
  };
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new HttpError(500, `${name} is not configured.`);
  return value;
}

async function requireAppAdmin(request: Request, env: Env): Promise<void> {
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    throw new HttpError(401, "Sign in before refreshing Geotab fleet status.");
  }

  const userResponse = await fetch(`${env.supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: env.supabaseServiceRoleKey,
      Authorization: authorization,
    },
  });
  const user = await userResponse.json().catch(() => ({}));
  const userId = stringValue(user?.id);
  if (!userResponse.ok || !userId) {
    throw new HttpError(401, "Sign in before refreshing Geotab fleet status.");
  }

  const profileResponse = await fetch(
    `${env.supabaseUrl}/rest/v1/app_user_profiles?user_id=eq.${encodeURIComponent(userId)}&access_role=eq.admin&is_active=eq.true&select=user_id&limit=1`,
    { headers: serviceHeaders(env) },
  );
  const profiles = await profileResponse.json().catch(() => []);
  if (!profileResponse.ok || !Array.isArray(profiles) || !profiles.length) {
    throw new HttpError(403, "Administrator access is required to refresh Geotab fleet status.");
  }
}

async function syncFleetStatus(env: Env): Promise<RecordValue> {
  const [trucks, trailers] = await Promise.all([
    supabaseSelect(env, "field_trucks?select=id,unit_number,vin,license_plate_number,geotab_device_id"),
    supabaseSelect(env, "field_trailers?select=id,trailer_number,geotab_device_id"),
  ]);
  const devices = await geotabGet(env, "Device", {
    search: { fromDate: new Date().toISOString() },
    resultsLimit: 5000,
  });
  const deviceIds = devices.map((device) => stringValue(valueOf(device, "id"))).filter(Boolean);
  const statuses = deviceIds.length
    ? await geotabGet(env, "DeviceStatusInfo", {
      search: { deviceSearch: { deviceIds } },
      resultsLimit: 50000,
    })
    : [];

  const deviceById = new Map(devices.map((device) => [stringValue(valueOf(device, "id")), device]));
  const statusByDeviceId = new Map(statuses.map((status) => [referenceId(valueOf(status, "device")), status]));
  const deviceIndexes = buildDeviceIndexes(devices);
  const checkedAt = new Date().toISOString();
  const claimedDeviceIds = new Set<string>();
  const truckUpdates = trucks.map((truck) => buildFleetAssetUpdate(
    truck,
    deviceById,
    statusByDeviceId,
    [
      { value: truck.vin, index: deviceIndexes.byVin, method: "VIN" },
      { value: truck.license_plate_number, index: deviceIndexes.byPlate, method: "License Plate" },
      { value: truck.unit_number, index: deviceIndexes.byName, method: "Unit Number" },
    ],
    checkedAt,
    claimedDeviceIds,
  ));
  const trailerUpdates = trailers.map((trailer) => buildFleetAssetUpdate(
    trailer,
    deviceById,
    statusByDeviceId,
    [{ value: trailer.trailer_number, index: deviceIndexes.byName, method: "Trailer Number" }],
    checkedAt,
    claimedDeviceIds,
  ));

  for (const update of truckUpdates) {
    await updateFleetAsset(env, "field_trucks", stringValue(update.id), update.payload as RecordValue);
  }
  for (const update of trailerUpdates) {
    await updateFleetAsset(env, "field_trailers", stringValue(update.id), update.payload as RecordValue);
  }

  const updates = [...truckUpdates, ...trailerUpdates];
  return {
    ok: true,
    checkedAt,
    assets: updates.length,
    trucks: truckUpdates.length,
    trailers: trailerUpdates.length,
    linked: updates.filter((update) => update.payload.geotab_link_status === "Linked").length,
    notCommunicating: updates.filter((update) => update.payload.geotab_is_communicating === false).length,
    unlinked: updates.filter((update) => update.payload.geotab_link_status !== "Linked").length,
    truckStatus: summarizeUpdates(truckUpdates),
    trailerStatus: summarizeUpdates(trailerUpdates),
  };
}

function buildFleetAssetUpdate(
  asset: RecordValue,
  deviceById: Map<string, RecordValue>,
  statusByDeviceId: Map<string, RecordValue>,
  matchCandidates: Array<{ value: unknown; index: Map<string, RecordValue[]>; method: string }>,
  checkedAt: string,
  claimedDeviceIds: Set<string>,
): { id: string; payload: RecordValue } {
  const explicitDeviceId = stringValue(asset.geotab_device_id);
  let device = explicitDeviceId ? deviceById.get(explicitDeviceId) || null : null;
  let linkMethod = explicitDeviceId ? "Device ID" : "";
  let linkStatus = "Unlinked";

  if (!device && !explicitDeviceId) {
    const match = findAutomaticDeviceMatch(matchCandidates);
    device = match.device;
    linkMethod = match.method;
    linkStatus = match.status;
  } else if (device) {
    linkStatus = "Linked";
  } else if (explicitDeviceId) {
    linkStatus = "Not Found";
  }

  const matchedDeviceId = device ? stringValue(valueOf(device, "id")) : "";
  if (matchedDeviceId && claimedDeviceIds.has(matchedDeviceId)) {
    device = null;
    linkStatus = "Ambiguous";
    linkMethod = linkMethod || "Duplicate fleet match";
  } else if (matchedDeviceId) {
    claimedDeviceIds.add(matchedDeviceId);
  }

  if (!device) {
    return {
      id: stringValue(asset.id),
      payload: {
        geotab_device_id: linkStatus === "Ambiguous" ? "" : explicitDeviceId,
        geotab_device_name: "",
        geotab_serial_number: "",
        geotab_is_communicating: null,
        geotab_last_contact_at: null,
        geotab_status_checked_at: checkedAt,
        geotab_link_status: linkStatus,
        geotab_link_method: linkMethod,
      },
    };
  }

  const deviceId = stringValue(valueOf(device, "id"));
  const status = statusByDeviceId.get(deviceId) || null;
  return {
    id: stringValue(asset.id),
    payload: {
      geotab_device_id: deviceId,
      geotab_device_name: stringValue(valueOf(device, "name")),
      geotab_serial_number: stringValue(valueOf(device, "serialNumber")),
      geotab_is_communicating: status ? booleanValue(valueOf(status, "isDeviceCommunicating")) : null,
      geotab_last_contact_at: status ? nullableDateTime(valueOf(status, "dateTime")) : null,
      geotab_status_checked_at: checkedAt,
      geotab_link_status: "Linked",
      geotab_link_method: linkMethod,
    },
  };
}

function findAutomaticDeviceMatch(
  candidates: Array<{ value: unknown; index: Map<string, RecordValue[]>; method: string }>,
): { device: RecordValue | null; method: string; status: string } {
  for (const candidate of candidates) {
    const key = normalizedIdentifier(candidate.value);
    if (!key) continue;
    const matches = candidate.index.get(key) || [];
    if (matches.length === 1) return { device: matches[0], method: candidate.method, status: "Linked" };
    if (matches.length > 1) return { device: null, method: candidate.method, status: "Ambiguous" };
  }
  return { device: null, method: "", status: "Not Found" };
}

function summarizeUpdates(updates: Array<{ id: string; payload: RecordValue }>): RecordValue {
  return {
    total: updates.length,
    linked: updates.filter((update) => update.payload.geotab_link_status === "Linked").length,
    notCommunicating: updates.filter((update) => update.payload.geotab_is_communicating === false).length,
    unlinked: updates.filter((update) => update.payload.geotab_link_status !== "Linked").length,
  };
}

function buildDeviceIndexes(devices: RecordValue[]) {
  const byVin = new Map<string, RecordValue[]>();
  const byPlate = new Map<string, RecordValue[]>();
  const byName = new Map<string, RecordValue[]>();
  for (const device of devices) {
    addToIndex(byVin, valueOf(device, "vehicleIdentificationNumber"), device);
    addToIndex(byPlate, valueOf(device, "licensePlate"), device);
    addToIndex(byName, valueOf(device, "name"), device);
  }
  return { byVin, byPlate, byName };
}

function addToIndex(index: Map<string, RecordValue[]>, rawKey: unknown, device: RecordValue): void {
  const key = normalizedIdentifier(rawKey);
  if (!key) return;
  const matches = index.get(key) || [];
  matches.push(device);
  index.set(key, matches);
}

async function geotabGet(env: Env, typeName: string, params: RecordValue): Promise<RecordValue[]> {
  const result = await withGeotabSession(env, (session) => geotabCall(session.host, "Get", {
    typeName,
    ...params,
    credentials: session.credentials,
  }));
  return Array.isArray(result) ? result.filter(isRecord) : [];
}

async function withGeotabSession(env: Env, call: (session: GeotabSession) => Promise<unknown>): Promise<unknown> {
  let session = cachedSession || await authenticateGeotab(env);
  cachedSession = session;
  try {
    return await call(session);
  } catch (error) {
    if (!(error instanceof GeotabError) || !isSessionError(error.type, error.message)) throw error;
    cachedSession = null;
    session = await authenticateGeotab(env);
    cachedSession = session;
    return call(session);
  }
}

async function authenticateGeotab(env: Env): Promise<GeotabSession> {
  const result = await geotabCall(env.geotabServer, "Authenticate", {
    database: env.geotabDatabase,
    userName: env.geotabUsername,
    password: env.geotabPassword,
  });
  if (!isRecord(result) || !isRecord(valueOf(result, "credentials"))) {
    throw new HttpError(502, "Geotab authentication did not return credentials.");
  }
  const credentialsValue = valueOf(result, "credentials") as RecordValue;
  const credentials: GeotabCredentials = {
    database: stringValue(valueOf(credentialsValue, "database")),
    userName: stringValue(valueOf(credentialsValue, "userName")),
    sessionId: stringValue(valueOf(credentialsValue, "sessionId")),
  };
  if (!credentials.database || !credentials.userName || !credentials.sessionId) {
    throw new HttpError(502, "Geotab authentication returned incomplete credentials.");
  }
  const path = stringValue(valueOf(result, "path"));
  return { host: path && path !== "ThisServer" ? normalizeHost(path) : env.geotabServer, credentials };
}

async function geotabCall(host: string, method: string, params: RecordValue): Promise<unknown> {
  const response = await fetch(`https://${normalizeHost(host)}/apiv1`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ method, params }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new HttpError(502, `Geotab returned HTTP ${response.status}.`);
  if (payload?.error) {
    const type = stringValue(payload.error?.data?.type) || "GeotabApiError";
    throw new GeotabError(type, stringValue(payload.error?.message) || `Geotab ${method} failed.`);
  }
  return payload?.result;
}

function isSessionError(type: string, message: string): boolean {
  const value = `${type} ${message}`.toLowerCase();
  return value.includes("invaliduser") || value.includes("session") || value.includes("credential");
}

async function supabaseSelect(env: Env, path: string): Promise<RecordValue[]> {
  const response = await fetch(`${env.supabaseUrl}/rest/v1/${path}`, { headers: serviceHeaders(env) });
  const payload = await response.json().catch(() => []);
  if (!response.ok) throw new HttpError(response.status, stringValue(payload?.message) || "Unable to load fleet records.");
  return Array.isArray(payload) ? payload.filter(isRecord) : [];
}

async function updateFleetAsset(env: Env, table: "field_trucks" | "field_trailers", assetId: string, payload: RecordValue): Promise<void> {
  const response = await fetch(`${env.supabaseUrl}/rest/v1/${table}?id=eq.${encodeURIComponent(assetId)}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new HttpError(response.status, stringValue(body?.message) || "Unable to save Geotab fleet status.");
  }
}

function serviceHeaders(env: Env): Record<string, string> {
  return {
    apikey: env.supabaseServiceRoleKey,
    Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
    Accept: "application/json",
  };
}

function valueOf(record: RecordValue, key: string): unknown {
  if (key in record) return record[key];
  const alternate = `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  return record[alternate];
}

function referenceId(value: unknown): string {
  return isRecord(value) ? stringValue(valueOf(value, "id")) : stringValue(value);
}

function normalizedIdentifier(value: unknown): string {
  return stringValue(value).replace(/[\s-]+/g, "").toUpperCase();
}

function booleanValue(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function nullableDateTime(value: unknown): string | null {
  const raw = stringValue(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeHost(value: string): string {
  return value.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").replace(/\/+$/, "");
}

function isRecord(value: unknown): value is RecordValue {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
