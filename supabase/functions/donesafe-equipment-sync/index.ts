import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RecordValue = Record<string, unknown>;

type Env = {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  tenant: string;
  apiBaseUrl: string;
  clientSubdomain: string;
  username: string;
  password: string;
  moduleName: string;
  moduleId: string;
  recordUrlTemplate: string;
};

type DonesafeSession = {
  accessToken: string;
  apiBaseUrl: string;
  clientSubdomain: string;
};

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let env: Env | null = null;
  let runId = "";
  try {
    if (request.method !== "POST") throw new HttpError(405, "Use POST for Donesafe equipment synchronization.");
    env = readEnv();
    const userId = await requireAppAdmin(request, env);
    const body = await request.json().catch(() => ({}));
    const action = stringValue(body?.action || "sync").toLowerCase();
    if (!['test', 'discover', 'sync'].includes(action)) throw new HttpError(400, "Unsupported Donesafe equipment action.");

    const session = await authenticateDonesafe(env);
    const module = await findEquipmentModule(env, session);
    if (action === "test" || action === "discover") {
      return jsonResponse({
        ok: true,
        action,
        tenant: env.tenant,
        module: sanitizeModule(module),
        message: `Connected to Donesafe and found ${env.moduleName}.`,
      });
    }

    runId = await createSyncRun(env, userId, module);
    const records = await loadAllModuleRecords(env, session, module);
    const syncToken = crypto.randomUUID();
    const syncedAt = new Date().toISOString();
    const rows = records.map((record) => normalizeEquipmentRecord(env!, module, record, syncToken, syncedAt));
    await upsertEquipmentRows(env, rows);
    await deactivateMissingRows(env, syncToken, stringValue(valueOf(module, "id")));
    await completeSyncRun(env, runId, records.length, rows.length);

    return jsonResponse({
      ok: true,
      tenant: env.tenant,
      module: sanitizeModule(module),
      received: records.length,
      saved: rows.length,
      syncedAt,
    });
  } catch (error) {
    const message = safeErrorMessage(error);
    if (env && runId) await failSyncRun(env, runId, message).catch(() => undefined);
    const status = error instanceof HttpError ? error.status : 500;
    return jsonResponse({ error: message }, status);
  }
});

function readEnv(): Env {
  const tenant = (Deno.env.get("DONESAFE_TENANT") || "splinc").trim();
  return {
    supabaseUrl: requiredEnv("SUPABASE_URL").replace(/\/+$/, ""),
    supabaseServiceRoleKey: requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    tenant,
    apiBaseUrl: (Deno.env.get("DONESAFE_API_URL") || `https://${tenant}.na.hsiplatform.com`).replace(/\/+$/, ""),
    clientSubdomain: (Deno.env.get("DONESAFE_CLIENT_SUBDOMAIN") || "").trim(),
    username: requiredEnv("DONESAFE_USERNAME"),
    password: requiredEnv("DONESAFE_PASSWORD"),
    moduleName: (Deno.env.get("DONESAFE_EQUIPMENT_MODULE_NAME") || "Equipment Tracker").trim(),
    moduleId: (Deno.env.get("DONESAFE_EQUIPMENT_MODULE_ID") || "30").trim(),
    recordUrlTemplate: (Deno.env.get("DONESAFE_RECORD_URL_TEMPLATE") || "").trim(),
  };
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new HttpError(500, `${name} is not configured.`);
  return value;
}

async function requireAppAdmin(request: Request, env: Env): Promise<string> {
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) throw new HttpError(401, "Sign in before synchronizing Donesafe equipment.");
  const userResponse = await fetch(`${env.supabaseUrl}/auth/v1/user`, {
    headers: { apikey: env.supabaseServiceRoleKey, Authorization: authorization },
  });
  const user = await userResponse.json().catch(() => ({}));
  const userId = stringValue(user?.id);
  if (!userResponse.ok || !userId) throw new HttpError(401, "Sign in before synchronizing Donesafe equipment.");

  const profileResponse = await fetch(
    `${env.supabaseUrl}/rest/v1/app_user_profiles?user_id=eq.${encodeURIComponent(userId)}&access_role=eq.admin&is_active=eq.true&select=user_id&limit=1`,
    { headers: serviceHeaders(env) },
  );
  const profiles = await profileResponse.json().catch(() => []);
  if (!profileResponse.ok || !Array.isArray(profiles) || !profiles.length) {
    throw new HttpError(403, "Administrator access is required to synchronize Donesafe equipment.");
  }
  return userId;
}

async function authenticateDonesafe(env: Env): Promise<DonesafeSession> {
  console.log("[donesafe-equipment-sync] authentication started", {
    tenant: env.tenant,
    apiHost: safeHost(env.apiBaseUrl),
    clientSubdomain: env.clientSubdomain,
    usernameConfigured: !!env.username,
  });
  const form = new URLSearchParams({ email: env.username, password: env.password, endpoint: "v1" });
  const response = await donesafeFetchRaw(env.apiBaseUrl, env.clientSubdomain, "/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: form.toString(),
  });
  const payload = await parseJson(response);
  const responseHost = response.headers.get("X-Donesafe-Api-Base") || env.apiBaseUrl;
  const responseSubdomain = response.headers.get("X-Donesafe-Client-Subdomain") || env.clientSubdomain;
  console.log("[donesafe-equipment-sync] authentication response", {
    status: response.status,
    apiHost: safeHost(responseHost),
    clientSubdomain: responseSubdomain,
  });
  if (!response.ok) {
    throw new HttpError(
      502,
      donesafeError(payload, response.status, "authentication", responseHost, responseSubdomain),
    );
  }
  const accessToken = stringValue(valueOf(payload, "authentication_token")) ||
    stringValue(valueOf(payload, "access_token")) ||
    stringValue(valueOf(valueOf(payload, "data"), "authentication_token"));
  if (!accessToken) throw new HttpError(502, "Donesafe authentication succeeded but did not return an access token.");
  return {
    accessToken,
    apiBaseUrl: responseHost,
    clientSubdomain: responseSubdomain,
  };
}

async function findEquipmentModule(env: Env, session: DonesafeSession): Promise<RecordValue> {
  if (env.moduleId) {
    const configuredModule = await donesafeGet(session, `/api/module_names/${encodeURIComponent(env.moduleId)}`);
    if (!isRecord(configuredModule)) {
      throw new HttpError(404, `Donesafe module ID ${env.moduleId} did not return module metadata.`);
    }
    console.log("[donesafe-equipment-sync] equipment module found by configured ID", sanitizeModule(configuredModule));
    return configuredModule;
  }

  const modules = await donesafeList(session, "/api/module_names?per_page=-1");
  const target = normalizeText(env.moduleName);
  const module = modules.find((item) => moduleLabels(item).some((label) => normalizeText(label) === target));
  if (!module) {
    const available = modules.map((item) => moduleLabels(item)[0]).filter(Boolean).slice(0, 20);
    throw new HttpError(404, `${env.moduleName} was not found in Donesafe.${available.length ? ` Available modules include: ${available.join(", ")}.` : ""}`);
  }
  console.log("[donesafe-equipment-sync] equipment module found", sanitizeModule(module));
  return module;
}

async function loadAllModuleRecords(env: Env, session: DonesafeSession, module: RecordValue): Promise<RecordValue[]> {
  const moduleId = stringValue(valueOf(module, "id"));
  if (!moduleId) throw new HttpError(502, "The Donesafe equipment module did not include an ID.");
  const records: RecordValue[] = [];
  const perPage = 100;
  for (let page = 1; page <= 200; page += 1) {
    const query = new URLSearchParams({
      "filters[module_name_id]": moduleId,
      include: "sub_form_completion",
      per_page: String(perPage),
      page: String(page),
    });
    const response = await donesafeGet(session, `/api/module_records?${query.toString()}`);
    const batch = extractList(response);
    records.push(...batch);
    const totalPages = numberValue(valueOf(valueOf(response, "meta"), "total_pages"));
    if ((totalPages && page >= totalPages) || batch.length < perPage) break;
    if (page === 200) throw new HttpError(502, "Donesafe returned more than 20,000 equipment records; synchronization stopped safely.");
  }
  console.log("[donesafe-equipment-sync] equipment records loaded", { moduleId, count: records.length });
  return records;
}

async function donesafeList(session: DonesafeSession, path: string): Promise<RecordValue[]> {
  return extractList(await donesafeGet(session, path));
}

async function donesafeGet(session: DonesafeSession, path: string): Promise<unknown> {
  const response = await donesafeFetchRaw(session.apiBaseUrl, session.clientSubdomain, path, {
    method: "GET",
    headers: { Accept: "application/json", "Access-Token": session.accessToken },
  });
  const payload = await parseJson(response);
  if (!response.ok) throw new HttpError(502, donesafeError(payload, response.status, path));
  return payload;
}

async function donesafeFetchRaw(baseUrl: string, clientSubdomain: string, path: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers || {});
  if (clientSubdomain) headers.set("X-Client-Subdomain", clientSubdomain);
  let response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  if (response.status !== 403) return response;

  const clonedPayload = await parseJson(response.clone());
  const restriction = stringValue(valueOf(clonedPayload, "error"));
  const urlMatch = restriction.match(/https:\/\/[^\s'\"]+/i);
  const subdomainMatch = restriction.match(/X-Client-Subdomain[^=]*=\s*['\"]([^'\"]+)['\"]/i);
  if (!urlMatch) return response;
  const redirected = new URL(urlMatch[0]);
  const redirectedBase = redirected.origin;
  const redirectedSubdomain = subdomainMatch?.[1] || clientSubdomain;
  console.log("[donesafe-equipment-sync] following Donesafe regional routing", {
    fromHost: safeHost(baseUrl),
    toHost: safeHost(redirectedBase),
    clientSubdomain: redirectedSubdomain,
  });
  const redirectedHeaders = new Headers(init.headers || {});
  redirectedHeaders.set("X-Client-Subdomain", redirectedSubdomain);
  response = await fetch(`${redirectedBase}${path}`, { ...init, headers: redirectedHeaders });
  const outputHeaders = new Headers(response.headers);
  outputHeaders.set("X-Donesafe-Api-Base", redirectedBase);
  outputHeaders.set("X-Donesafe-Client-Subdomain", redirectedSubdomain);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: outputHeaders });
}

function normalizeEquipmentRecord(env: Env, module: RecordValue, record: RecordValue, syncToken: string, syncedAt: string): RecordValue {
  const recordId = stringValue(valueOf(record, "id"));
  if (!recordId) throw new HttpError(502, "A Donesafe equipment record did not include an ID.");
  const completion = asRecord(valueOf(record, "sub_form_completion"));
  const responses = extractList(valueOf(completion, "sub_form_responses"));
  const fields: RecordValue = {};
  for (const item of responses) {
    const code = stringValue(valueOf(item, "sub_form_question_code"));
    const label = stringValue(valueOf(item, "question_text"));
    const key = code || normalizeFieldKey(label) || `question_${stringValue(valueOf(item, "sub_form_question_id"))}`;
    fields[key] = valueOf(item, "response");
    if (label) fields[`label:${label}`] = valueOf(item, "response");
  }
  const title = stringValue(valueOf(completion, "title")) || stringValue(valueOf(record, "title"));
  return {
    donesafe_record_id: recordId,
    donesafe_module_id: stringValue(valueOf(module, "id")),
    donesafe_module_name: moduleLabels(module)[0] || env.moduleName,
    record_title: title,
    asset_name: pickField(fields, ["eqt_mf_description", "equipment_name", "asset_name", "equipment_title", "asset_title", "name"]) || title,
    asset_type: pickField(fields, ["eqt_mf_equipment_group", "equipment_type", "asset_type", "category", "type"]),
    manufacturer: pickField(fields, ["eqt_mf_manufacturer", "manufacturer", "make", "equipment_manufacturer"]),
    model: pickField(fields, ["eqt_mf_model", "model", "model_number", "equipment_model"]),
    serial_number: pickField(fields, ["eqt_mf_serial_no", "serial_number", "serial_no", "serial", "equipment_serial_number"]),
    inventory_barcode: pickField(fields, ["uniq_id", "inventory_barcode", "barcode", "asset_id", "equipment_id", "equipment_number"]),
    asset_status: pickField(fields, ["status", "equipment_status", "asset_status", "service_status"]),
    asset_location: pickField(fields, ["location", "equipment_location", "storage_location", "site"]),
    last_inspection_date: nullableDate(pickField(fields, ["last_inspection_date", "inspection_date", "last_inspection"])),
    next_inspection_due: nullableDate(pickField(fields, ["next_inspection_due", "inspection_due_date", "next_inspection_date"])),
    source_created_at: nullableDateTime(valueOf(record, "created_at")),
    source_updated_at: nullableDateTime(valueOf(record, "updated_at")),
    source_url: buildRecordUrl(env.recordUrlTemplate, recordId),
    field_values: fields,
    raw_record: record,
    is_active: true,
    sync_token: syncToken,
    last_synced_at: syncedAt,
  };
}

function pickField(fields: RecordValue, aliases: string[]): string {
  const entries = Object.entries(fields);
  for (const alias of aliases) {
    const exact = entries.find(([key]) => normalizeFieldKey(key.replace(/^label:/, "")) === alias);
    const value = responseDisplayValue(exact?.[1]);
    if (value) return value;
  }
  return "";
}

function responseDisplayValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(responseDisplayValue).filter(Boolean).join(", ");
  if (!isRecord(value)) return stringValue(value);
  for (const key of ["display_value", "display", "label", "name", "text", "value"]) {
    const candidate = responseDisplayValue(valueOf(value, key));
    if (candidate) return candidate;
  }
  return "";
}

async function upsertEquipmentRows(env: Env, rows: RecordValue[]): Promise<void> {
  for (let start = 0; start < rows.length; start += 100) {
    const response = await fetch(`${env.supabaseUrl}/rest/v1/donesafe_equipment_assets?on_conflict=donesafe_record_id`, {
      method: "POST",
      headers: { ...serviceHeaders(env), "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows.slice(start, start + 100)),
    });
    if (!response.ok) throw new HttpError(response.status, await supabaseError(response, "Unable to save Donesafe equipment records."));
  }
}

async function deactivateMissingRows(env: Env, syncToken: string, moduleId: string): Promise<void> {
  const query = `donesafe_module_id=eq.${encodeURIComponent(moduleId)}&sync_token=neq.${encodeURIComponent(syncToken)}`;
  const response = await fetch(`${env.supabaseUrl}/rest/v1/donesafe_equipment_assets?${query}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ is_active: false }),
  });
  if (!response.ok) throw new HttpError(response.status, await supabaseError(response, "Unable to retire missing Donesafe equipment records."));
}

async function createSyncRun(env: Env, userId: string, module: RecordValue): Promise<string> {
  const response = await fetch(`${env.supabaseUrl}/rest/v1/donesafe_sync_runs?select=id`, {
    method: "POST",
    headers: { ...serviceHeaders(env), "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ requested_by: userId, details: { tenant: env.tenant, module: sanitizeModule(module) } }),
  });
  const payload = await response.json().catch(() => []);
  if (!response.ok) throw new HttpError(response.status, "Unable to start the Donesafe sync audit record.");
  return stringValue(Array.isArray(payload) ? payload[0]?.id : payload?.id);
}

async function completeSyncRun(env: Env, runId: string, received: number, saved: number): Promise<void> {
  await patchSyncRun(env, runId, { status: "complete", completed_at: new Date().toISOString(), records_received: received, records_saved: saved });
}

async function failSyncRun(env: Env, runId: string, message: string): Promise<void> {
  await patchSyncRun(env, runId, { status: "error", completed_at: new Date().toISOString(), error_message: message.slice(0, 2000) });
}

async function patchSyncRun(env: Env, runId: string, payload: RecordValue): Promise<void> {
  const response = await fetch(`${env.supabaseUrl}/rest/v1/donesafe_sync_runs?id=eq.${encodeURIComponent(runId)}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new HttpError(response.status, "Unable to update the Donesafe sync audit record.");
}

function extractList(payload: unknown): RecordValue[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];
  const data = valueOf(payload, "data");
  if (Array.isArray(data)) return data.filter(isRecord).map(unwrapJsonApiRecord);
  const records = valueOf(payload, "records") || valueOf(payload, "items");
  return Array.isArray(records) ? records.filter(isRecord) : [];
}

function unwrapJsonApiRecord(record: RecordValue): RecordValue {
  const attributes = asRecord(valueOf(record, "attributes"));
  return Object.keys(attributes).length ? { id: valueOf(record, "id"), ...attributes } : record;
}

function moduleLabels(module: RecordValue): string[] {
  return ["plural_display", "display", "name", "module_name", "display_name", "default", "title", "label"]
    .map((key) => stringValue(valueOf(module, key))).filter(Boolean);
}

function sanitizeModule(module: RecordValue): RecordValue {
  return { id: stringValue(valueOf(module, "id")), name: moduleLabels(module)[0] || "" };
}

function buildRecordUrl(template: string, recordId: string): string {
  return template ? template.replaceAll("{record_id}", encodeURIComponent(recordId)) : "";
}

function normalizeText(value: unknown): string {
  return stringValue(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeFieldKey(value: unknown): string {
  return normalizeText(value).replace(/\s+/g, "_");
}

function nullableDate(value: unknown): string | null {
  const raw = stringValue(value);
  if (!raw) return null;
  const iso = raw.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (iso) return iso;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function nullableDateTime(value: unknown): string | null {
  const raw = stringValue(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

async function parseJson(response: Response): Promise<unknown> {
  return response.json().catch(() => ({}));
}

function donesafeError(payload: unknown, status: number, operation: string, apiBaseUrl = "", clientSubdomain = ""): string {
  const message = stringValue(valueOf(payload, "error")) || stringValue(valueOf(payload, "message"));
  const route = apiBaseUrl
    ? ` via ${safeHost(apiBaseUrl)}${clientSubdomain ? ` with client subdomain ${clientSubdomain}` : ""}`
    : "";
  if (status === 401) {
    return `Donesafe ${operation} returned HTTP 401 Unauthorized${route}. Confirm DONESAFE_USERNAME is the account's full email address, re-enter DONESAFE_PASSWORD, and verify that the account is permitted to use the API without interactive SSO or MFA.`;
  }
  if (status === 403) {
    return `Donesafe ${operation} returned HTTP 403 Forbidden${route}. The account or tenant does not have permission for this API operation.`;
  }
  return message ? `Donesafe ${operation} failed: ${message}` : `Donesafe ${operation} returned HTTP ${status}.`;
}

function safeHost(value: string): string {
  try {
    return new URL(value).host;
  } catch {
    return value.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
  }
}

async function supabaseError(response: Response, fallback: string): Promise<string> {
  const payload = await response.json().catch(() => ({}));
  return stringValue(valueOf(payload, "message")) || fallback;
}

function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unable to synchronize Donesafe equipment.";
  return message.replace(/password=[^&\s]+/gi, "password=[redacted]").replace(/[A-Za-z0-9_-]{20,}/g, "[redacted]");
}

function serviceHeaders(env: Env): Record<string, string> {
  return { apikey: env.supabaseServiceRoleKey, Authorization: `Bearer ${env.supabaseServiceRoleKey}`, Accept: "application/json" };
}

function asRecord(value: unknown): RecordValue {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is RecordValue {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function valueOf(value: unknown, key: string): unknown {
  if (!isRecord(value)) return undefined;
  return value[key] ?? value[`${key.charAt(0).toUpperCase()}${key.slice(1)}`];
}

function stringValue(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
