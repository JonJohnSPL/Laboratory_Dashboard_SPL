import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type JsonRecord = Record<string, unknown>;
type MappingEntry = { field: string; label?: string; relationshipName?: string };
type FieldMapping = Record<string, MappingEntry>;

type Env = {
  supabaseUrl: string;
  supabaseSecretKey: string;
  salesforceMyDomainUrl: string;
  salesforceClientId: string;
  salesforceClientSecret: string;
  apiVersion: string;
};

type SalesforceSession = { accessToken: string; instanceUrl: string };

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
    if (request.method !== "POST") throw new HttpError(405, "Use POST for Salesforce ticket administration.");
    env = readEnv();
    const userId = await requireAppAdmin(request, env);
    const body = await request.json().catch(() => ({})) as JsonRecord;
    const action = stringValue(body.action || "test").toLowerCase();
    if (!["test", "discover", "save_config", "search_accounts", "preview", "sync"].includes(action)) {
      throw new HttpError(400, "Unsupported Salesforce ticket action.");
    }

    const session = await authenticateSalesforce(env);
    if (action === "test") {
      await salesforceGet(env, session, `/services/data/${env.apiVersion}/limits`);
      return jsonResponse({ ok: true, action, myDomain: safeOrigin(env.salesforceMyDomainUrl), instanceUrl: safeOrigin(session.instanceUrl) });
    }
    if (action === "discover") return jsonResponse(await discover(env, session, stringValue(body.objectApiName)));
    if (action === "save_config") return jsonResponse(await saveConfig(env, session, userId, body));
    if (action === "search_accounts") return jsonResponse(await searchAccounts(env, session, stringValue(body.query)));

    const config = await loadConfig(env);
    if (!config || !booleanValue(config.enabled)) throw new HttpError(409, "Configure and enable Salesforce ticket import first.");
    if (action === "preview") return jsonResponse(await preview(env, session, config));

    runId = await createSyncRun(env, userId, config);
    const result = await syncTickets(env, session, config);
    await finishSyncRun(env, runId, "complete", Number(result.received || 0), Number(result.saved || 0), "", result);
    return jsonResponse({ ok: true, ...result });
  } catch (error) {
    const message = safeErrorMessage(error);
    if (env && runId) await finishSyncRun(env, runId, "error", 0, 0, message, {}).catch(() => undefined);
    return jsonResponse({ error: message }, error instanceof HttpError ? error.status : 500);
  }
});

function readEnv(): Env {
  const myDomain = (Deno.env.get("SALESFORCE_MY_DOMAIN_URL") || Deno.env.get("SALESFORCE_LOGIN_URL") || "https://spl.my.salesforce.com").trim().replace(/\/+$/, "");
  let url: URL;
  try { url = new URL(myDomain); } catch { throw new HttpError(500, "SALESFORCE_MY_DOMAIN_URL is invalid."); }
  if (url.protocol !== "https:" || !url.hostname.toLowerCase().endsWith(".salesforce.com") || url.hostname.toLowerCase() === "login.salesforce.com") {
    throw new HttpError(500, "SALESFORCE_MY_DOMAIN_URL must be an HTTPS Salesforce My Domain URL.");
  }
  const version = (Deno.env.get("SALESFORCE_API_VERSION") || "v68.0").trim();
  if (!/^v\d+\.\d+$/.test(version)) throw new HttpError(500, "SALESFORCE_API_VERSION is invalid.");
  return {
    supabaseUrl: requiredEnv("SUPABASE_URL").replace(/\/+$/, ""),
    supabaseSecretKey: readSupabaseSecretKey(),
    salesforceMyDomainUrl: myDomain,
    salesforceClientId: requiredOneOf("SALESFORCE_CONNECTED_APP_CONSUMER_KEY", "SALESFORCE_CLIENT_ID"),
    salesforceClientSecret: requiredOneOf("SALESFORCE_CONNECTED_APP_CONSUMER_SECRET", "SALESFORCE_CLIENT_SECRET"),
    apiVersion: version,
  };
}

function readSupabaseSecretKey(): string {
  const direct = Deno.env.get("SUPABASE_SECRET_KEY")?.trim();
  if (direct) return direct;
  const collection = Deno.env.get("SUPABASE_SECRET_KEYS")?.trim();
  if (collection) {
    try {
      const parsed = JSON.parse(collection);
      const values = Array.isArray(parsed) ? parsed : typeof parsed === "object" && parsed ? Object.values(parsed) : [];
      const key = values.map(stringValue).find(Boolean);
      if (key) return key;
    } catch {
      const key = collection.split(",").map((item) => item.trim()).find(Boolean);
      if (key) return key;
    }
  }
  return requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new HttpError(500, `${name} is not configured.`);
  return value;
}

function requiredOneOf(primary: string, fallback: string): string {
  const value = Deno.env.get(primary)?.trim() || Deno.env.get(fallback)?.trim();
  if (!value) throw new HttpError(500, `${primary} or ${fallback} is not configured.`);
  return value;
}

async function requireAppAdmin(request: Request, env: Env): Promise<string> {
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) throw new HttpError(401, "Sign in before managing Salesforce tickets.");
  const userResponse = await fetch(`${env.supabaseUrl}/auth/v1/user`, {
    headers: { apikey: env.supabaseSecretKey, Authorization: authorization },
  });
  const user = await userResponse.json().catch(() => ({})) as JsonRecord;
  const userId = stringValue(user.id);
  if (!userResponse.ok || !userId) throw new HttpError(401, "Sign in before managing Salesforce tickets.");
  const profiles = await supabaseRequest(env, `app_user_profiles?user_id=eq.${encodeURIComponent(userId)}&access_role=eq.admin&is_active=eq.true&select=user_id&limit=1`);
  if (!Array.isArray(profiles) || !profiles.length) throw new HttpError(403, "Administrator access is required to manage Salesforce tickets.");
  return userId;
}

async function authenticateSalesforce(env: Env): Promise<SalesforceSession> {
  const form = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: env.salesforceClientId,
    client_secret: env.salesforceClientSecret,
  });
  const response = await fetch(`${env.salesforceMyDomainUrl}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: form,
  });
  const payload = await response.json().catch(() => ({})) as JsonRecord;
  if (!response.ok) throw new HttpError(502, salesforceError(payload, "Salesforce authentication failed."));
  const accessToken = stringValue(payload.access_token);
  const instanceUrl = stringValue(payload.instance_url).replace(/\/+$/, "");
  if (!accessToken || !instanceUrl) throw new HttpError(502, "Salesforce authentication did not return a usable session.");
  return { accessToken, instanceUrl };
}

async function salesforceGet(env: Env, session: SalesforceSession, path: string): Promise<unknown> {
  const target = path.startsWith("http") ? path : `${session.instanceUrl}${path}`;
  const targetUrl = new URL(target);
  if (targetUrl.origin !== new URL(session.instanceUrl).origin) throw new HttpError(502, "Salesforce returned an unexpected pagination host.");
  const response = await fetch(targetUrl, { method: "GET", headers: { Authorization: `Bearer ${session.accessToken}`, Accept: "application/json" } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new HttpError(502, salesforceError(payload, "Salesforce could not complete the read request."));
  return payload;
}

async function discover(env: Env, session: SalesforceSession, objectApiName: string): Promise<JsonRecord> {
  const global = asRecord(await salesforceGet(env, session, `/services/data/${env.apiVersion}/sobjects`));
  const allObjects = arrayValue(global.sobjects).filter(isRecord);
  const likely = allObjects.filter((item) => booleanValue(item.queryable) && isTicketLike(item)).map(sanitizeObject);
  const result: JsonRecord = { ok: true, objects: likely, allQueryableCount: allObjects.filter((item) => booleanValue(item.queryable)).length };
  if (!objectApiName) return result;
  const selected = allObjects.find((item) => stringValue(item.name) === objectApiName && booleanValue(item.queryable));
  if (!selected) throw new HttpError(400, "The selected Salesforce object is not queryable or is not accessible.");
  const [description, views] = await Promise.all([
    salesforceGet(env, session, `/services/data/${env.apiVersion}/sobjects/${encodeURIComponent(objectApiName)}/describe`),
    salesforceGet(env, session, `/services/data/${env.apiVersion}/sobjects/${encodeURIComponent(objectApiName)}/listviews`),
  ]);
  result.selectedObject = sanitizeObject(selected);
  result.fields = arrayValue(asRecord(description).fields).filter(isRecord).filter((field) => !booleanValue(field.deprecatedAndHidden)).map(sanitizeField);
  result.listViews = arrayValue(asRecord(views).listviews).filter(isRecord).map((view) => ({ id: stringValue(view.id), label: stringValue(view.label), developerName: stringValue(view.developerName) }));
  return result;
}

function isTicketLike(item: JsonRecord): boolean {
  const value = `${stringValue(item.name)} ${stringValue(item.label)} ${stringValue(item.labelPlural)}`.toLowerCase();
  return ["case", "ticket", "work order", "workorder", "fieldfx", "service request"].some((term) => value.includes(term));
}

function sanitizeObject(item: JsonRecord): JsonRecord {
  return { name: stringValue(item.name), label: stringValue(item.label), labelPlural: stringValue(item.labelPlural), custom: booleanValue(item.custom), queryable: booleanValue(item.queryable) };
}

function sanitizeField(field: JsonRecord): JsonRecord {
  return {
    name: stringValue(field.name), label: stringValue(field.label), type: stringValue(field.type),
    referenceTo: arrayValue(field.referenceTo).map(stringValue), relationshipName: stringValue(field.relationshipName),
    sortable: booleanValue(field.sortable), filterable: booleanValue(field.filterable),
  };
}

async function saveConfig(env: Env, session: SalesforceSession, userId: string, body: JsonRecord): Promise<JsonRecord> {
  const objectApiName = stringValue(body.objectApiName);
  const listViewId = stringValue(body.listViewId);
  const suppliedMapping = isRecord(body.fieldMapping) ? body.fieldMapping : {};
  if (!objectApiName || !listViewId) throw new HttpError(400, "Select a Salesforce object and Pittsburgh Field Ops list view.");
  const discovery = await discover(env, session, objectApiName);
  const fields = arrayValue(discovery.fields).filter(isRecord);
  const fieldByName = new Map(fields.map((field) => [stringValue(field.name), field]));
  const mapping: FieldMapping = {};
  for (const key of ["number", "subject", "status", "account", "modified"]) {
    const raw = isRecord(suppliedMapping[key]) ? suppliedMapping[key] : { field: suppliedMapping[key] };
    const name = stringValue(raw.field);
    const described = fieldByName.get(name);
    if (!name || !described) throw new HttpError(400, `Select a valid Salesforce field for ${key}.`);
    mapping[key] = { field: name, label: stringValue(described.label), relationshipName: stringValue(described.relationshipName) };
  }
  const accountField = fieldByName.get(mapping.account.field)!;
  if (!arrayValue(accountField.referenceTo).map(stringValue).includes("Account")) throw new HttpError(400, "The Account mapping must reference the Salesforce Account object.");
  for (const key of ["owner", "recordType", "created"]) {
    const raw = isRecord(suppliedMapping[key]) ? suppliedMapping[key] : { field: suppliedMapping[key] };
    const name = stringValue(raw.field);
    if (!name) continue;
    const described = fieldByName.get(name);
    if (!described) throw new HttpError(400, `The optional ${key} field is invalid.`);
    mapping[key] = { field: name, label: stringValue(described.label), relationshipName: stringValue(described.relationshipName) };
  }
  const views = arrayValue(discovery.listViews).filter(isRecord);
  const view = views.find((item) => stringValue(item.id) === listViewId);
  if (!view) throw new HttpError(400, "The selected Salesforce list view is not accessible for this integration user.");
  const selectedObject = asRecord(discovery.selectedObject);
  const now = new Date().toISOString();
  const row = {
    id: "default", enabled: body.enabled !== false, object_api_name: objectApiName,
    object_label: stringValue(selectedObject.label), list_view_id: listViewId,
    list_view_name: stringValue(view.label), field_mapping: mapping, configured_at: now,
    configured_by: userId, last_discovered_at: now,
  };
  await supabaseRequest(env, "salesforce_integration_settings?on_conflict=id", { method: "POST", body: [row], prefer: "resolution=merge-duplicates,return=representation" });
  return { ok: true, config: row };
}

async function searchAccounts(env: Env, session: SalesforceSession, query: string): Promise<JsonRecord> {
  const term = query.trim();
  if (term.length < 2) throw new HttpError(400, "Enter at least two characters to search Salesforce Accounts.");
  const escaped = escapeSoqlLiteral(term);
  const soql = `SELECT Id, Name, SystemModstamp FROM Account WHERE Name LIKE '%${escaped}%' ORDER BY Name LIMIT 25`;
  const records = await queryAll(env, session, soql);
  const now = new Date().toISOString();
  const accounts = records.map((record) => ({
    salesforce_record_id: stringValue(record.Id), account_name: stringValue(record.Name),
    source_url: `${session.instanceUrl}/lightning/r/Account/${encodeURIComponent(stringValue(record.Id))}/view`, last_synced_at: now,
  })).filter((row) => row.salesforce_record_id);
  if (accounts.length) await supabaseRequest(env, "salesforce_accounts?on_conflict=salesforce_record_id", { method: "POST", body: accounts, prefer: "resolution=merge-duplicates,return=minimal" });
  return { ok: true, accounts };
}

async function preview(env: Env, session: SalesforceSession, config: JsonRecord): Promise<JsonRecord> {
  const memberIds = await loadListViewMemberIds(env, session, config);
  const records = await fetchMappedRecords(env, session, config, memberIds.slice(0, 20));
  return { ok: true, eligibleCount: memberIds.length, sample: records.map((record) => normalizeTicket(session, config, record, new Set(memberIds), new Date().toISOString())) };
}

async function syncTickets(env: Env, session: SalesforceSession, config: JsonRecord): Promise<JsonRecord> {
  const objectApiName = stringValue(config.object_api_name);
  const memberIds = await loadListViewMemberIds(env, session, config);
  const existing = await supabaseRequest(env, `salesforce_tickets?object_api_name=eq.${encodeURIComponent(objectApiName)}&select=id,salesforce_record_id`);
  const existingRows = Array.isArray(existing) ? existing.filter(isRecord) : [];
  const links = await supabaseRequest(env, "salesforce_job_ticket_links?select=ticket_id");
  const linkedTicketIds = new Set((Array.isArray(links) ? links : []).filter(isRecord).map((row) => stringValue(row.ticket_id)));
  const linkedExternalIds = existingRows.filter((row) => linkedTicketIds.has(stringValue(row.id))).map((row) => stringValue(row.salesforce_record_id));
  const allIds = [...new Set([...memberIds, ...linkedExternalIds])];
  const records = await fetchMappedRecords(env, session, config, allIds);
  const memberSet = new Set(memberIds);
  const syncedAt = new Date().toISOString();
  const rows = records.map((record) => normalizeTicket(session, config, record, memberSet, syncedAt));

  await supabaseRequest(env, `salesforce_tickets?object_api_name=eq.${encodeURIComponent(objectApiName)}`, {
    method: "PATCH", body: { is_active: false, is_linkable: false, last_synced_at: syncedAt }, prefer: "return=minimal",
  });
  if (rows.length) await supabaseRequest(env, "salesforce_tickets?on_conflict=object_api_name,salesforce_record_id", {
    method: "POST", body: rows, prefer: "resolution=merge-duplicates,return=minimal",
  });
  const accounts = uniqueAccounts(session, rows, syncedAt);
  if (accounts.length) await supabaseRequest(env, "salesforce_accounts?on_conflict=salesforce_record_id", {
    method: "POST", body: accounts, prefer: "resolution=merge-duplicates,return=minimal",
  });
  return { received: memberIds.length, saved: rows.length, linkedRefreshed: linkedExternalIds.length, inactive: Math.max(0, existingRows.length - memberIds.length), syncedAt };
}

async function loadListViewMemberIds(env: Env, session: SalesforceSession, config: JsonRecord): Promise<string[]> {
  const objectName = stringValue(config.object_api_name);
  const viewId = stringValue(config.list_view_id);
  const base = `/services/data/${env.apiVersion}/sobjects/${encodeURIComponent(objectName)}/listviews/${encodeURIComponent(viewId)}`;
  const described = asRecord(await salesforceGet(env, session, `${base}/describe`));
  const query = stringValue(described.query);
  if (query) {
    const records = await queryAll(env, session, query);
    return [...new Set(records.map((record) => stringValue(record.Id)).filter(Boolean))];
  }
  const result = asRecord(await salesforceGet(env, session, `${base}/results`));
  const ids: string[] = [];
  for (const row of arrayValue(result.records)) {
    if (!isRecord(row)) continue;
    const direct = stringValue(row.Id || row.id);
    if (direct) { ids.push(direct); continue; }
    const columns = arrayValue(row.columns).filter(isRecord);
    const id = columns.map((column) => stringValue(column.value || column.recordId)).find((value) => /^[a-zA-Z0-9]{15,18}$/.test(value));
    if (id) ids.push(id);
  }
  return [...new Set(ids)];
}

async function fetchMappedRecords(env: Env, session: SalesforceSession, config: JsonRecord, ids: string[]): Promise<JsonRecord[]> {
  if (!ids.length) return [];
  const mapping = mappingValue(config.field_mapping);
  const fields = new Set<string>(["Id"]);
  for (const entry of Object.values(mapping)) {
    if (!entry.field) continue;
    validateIdentifier(entry.field);
    fields.add(entry.field);
    if (entry.relationshipName) {
      validateIdentifier(entry.relationshipName);
      fields.add(`${entry.relationshipName}.Name`);
    }
  }
  const objectName = stringValue(config.object_api_name);
  validateIdentifier(objectName);
  const records: JsonRecord[] = [];
  for (let index = 0; index < ids.length; index += 200) {
    const batch = ids.slice(index, index + 200).map((id) => `'${escapeSoqlLiteral(id)}'`).join(",");
    records.push(...await queryAll(env, session, `SELECT ${[...fields].join(",")} FROM ${objectName} WHERE Id IN (${batch})`));
  }
  return records;
}

async function queryAll(env: Env, session: SalesforceSession, soql: string): Promise<JsonRecord[]> {
  const records: JsonRecord[] = [];
  let path = `/services/data/${env.apiVersion}/query?q=${encodeURIComponent(soql)}`;
  for (let page = 0; path && page < 1000; page += 1) {
    const payload = asRecord(await salesforceGet(env, session, path));
    records.push(...arrayValue(payload.records).filter(isRecord));
    path = booleanValue(payload.done) ? "" : stringValue(payload.nextRecordsUrl);
    if (page === 999 && path) throw new HttpError(502, "Salesforce query pagination exceeded the safety limit.");
  }
  return records;
}

function normalizeTicket(session: SalesforceSession, config: JsonRecord, record: JsonRecord, memberIds: Set<string>, syncedAt: string): JsonRecord {
  const mapping = mappingValue(config.field_mapping);
  const id = stringValue(record.Id);
  const accountId = mappedValue(record, mapping.account);
  return {
    object_api_name: stringValue(config.object_api_name), salesforce_record_id: id,
    ticket_number: mappedValue(record, mapping.number), subject: mappedValue(record, mapping.subject),
    ticket_status: mappedValue(record, mapping.status), account_record_id: accountId,
    account_name: relatedName(record, mapping.account), owner_name: relatedName(record, mapping.owner),
    record_type_name: relatedName(record, mapping.recordType),
    source_url: `${session.instanceUrl}/lightning/r/${encodeURIComponent(stringValue(config.object_api_name))}/${encodeURIComponent(id)}/view`,
    source_created_at: nullableDate(mappedValue(record, mapping.created)), source_modified_at: nullableDate(mappedValue(record, mapping.modified)),
    is_active: memberIds.has(id), is_linkable: memberIds.has(id), last_synced_at: syncedAt,
  };
}

function uniqueAccounts(session: SalesforceSession, rows: JsonRecord[], syncedAt: string): JsonRecord[] {
  const byId = new Map<string, JsonRecord>();
  for (const row of rows) {
    const id = stringValue(row.account_record_id);
    if (!id) continue;
    byId.set(id, { salesforce_record_id: id, account_name: stringValue(row.account_name), source_url: `${session.instanceUrl}/lightning/r/Account/${encodeURIComponent(id)}/view`, last_synced_at: syncedAt });
  }
  return [...byId.values()];
}

async function loadConfig(env: Env): Promise<JsonRecord | null> {
  const rows = await supabaseRequest(env, "salesforce_integration_settings?id=eq.default&select=*&limit=1");
  return Array.isArray(rows) && isRecord(rows[0]) ? rows[0] : null;
}

async function createSyncRun(env: Env, userId: string, config: JsonRecord): Promise<string> {
  const result = await supabaseRequest(env, "salesforce_sync_runs", {
    method: "POST", body: [{ action: "sync", status: "running", requested_by: userId, details: { objectApiName: stringValue(config.object_api_name), listViewId: stringValue(config.list_view_id) } }], prefer: "return=representation",
  });
  const id = Array.isArray(result) && isRecord(result[0]) ? stringValue(result[0].id) : "";
  if (!id) throw new HttpError(502, "Could not create the Salesforce sync audit record.");
  return id;
}

async function finishSyncRun(env: Env, id: string, status: string, received: number, saved: number, errorMessage: string, details: JsonRecord): Promise<void> {
  await supabaseRequest(env, `salesforce_sync_runs?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH", body: { status, completed_at: new Date().toISOString(), records_received: received, records_saved: saved, error_message: errorMessage.slice(0, 500), details }, prefer: "return=minimal",
  });
}

async function supabaseRequest(env: Env, path: string, options: { method?: string; body?: unknown; prefer?: string } = {}): Promise<unknown> {
  const headers: Record<string, string> = { apikey: env.supabaseSecretKey, "Content-Type": "application/json" };
  if (!env.supabaseSecretKey.startsWith("sb_secret_")) headers.Authorization = `Bearer ${env.supabaseSecretKey}`;
  if (options.prefer) headers.Prefer = options.prefer;
  const response = await fetch(`${env.supabaseUrl}/rest/v1/${path}`, { method: options.method || "GET", headers, body: options.body === undefined ? undefined : JSON.stringify(options.body) });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new HttpError(502, `The Salesforce cache operation failed (${response.status}).`);
  return payload;
}

function mappingValue(value: unknown): FieldMapping {
  const source = isRecord(value) ? value : {};
  const result: FieldMapping = {};
  for (const [key, raw] of Object.entries(source)) {
    if (isRecord(raw)) result[key] = { field: stringValue(raw.field), label: stringValue(raw.label), relationshipName: stringValue(raw.relationshipName) };
    else result[key] = { field: stringValue(raw) };
  }
  return result;
}

function mappedValue(record: JsonRecord, entry?: MappingEntry): string {
  return entry?.field ? stringValue(record[entry.field]) : "";
}

function relatedName(record: JsonRecord, entry?: MappingEntry): string {
  if (!entry?.relationshipName) return "";
  return stringValue(asRecord(record[entry.relationshipName]).Name);
}

function validateIdentifier(value: string): void {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) throw new HttpError(400, "Salesforce metadata contained an invalid API identifier.");
}

function escapeSoqlLiteral(value: string): string { return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'"); }
function nullableDate(value: string): string | null { return value && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : null; }
function safeOrigin(value: string): string { try { return new URL(value).origin; } catch { return ""; } }
function isRecord(value: unknown): value is JsonRecord { return !!value && typeof value === "object" && !Array.isArray(value); }
function asRecord(value: unknown): JsonRecord { return isRecord(value) ? value : {}; }
function arrayValue(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function stringValue(value: unknown): string { return value === null || value === undefined ? "" : String(value).trim(); }
function booleanValue(value: unknown): boolean { return value === true || value === "true"; }

function salesforceError(payload: unknown, fallback: string): string {
  const rows = Array.isArray(payload) ? payload : [payload];
  const first = rows.find(isRecord) as JsonRecord | undefined;
  const code = stringValue(first?.errorCode || first?.error);
  const message = stringValue(first?.message || first?.error_description);
  return [fallback, code, message].filter(Boolean).join(" ").replace(/https?:\/\/\S+/g, "[Salesforce URL]").slice(0, 500);
}

function safeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : "Salesforce ticket synchronization failed.";
  return raw.replace(/Bearer\s+\S+/gi, "Bearer [redacted]").replace(/client_secret=[^&\s]+/gi, "client_secret=[redacted]").replace(/https?:\/\/[^\s/]+/g, "[remote host]").slice(0, 500);
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
