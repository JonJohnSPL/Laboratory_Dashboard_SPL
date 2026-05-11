import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const SALESFORCE_API_VERSION = "v60.0";

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

type Env = {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  salesforceLoginUrl: string;
  salesforceClientId: string;
  salesforceClientSecret: string;
  salesforceInstanceUrl: string;
};

type SalesforceSession = {
  accessToken: string;
  instanceUrl: string;
};

type FieldJob = Record<string, unknown>;
type FieldContext = {
  job: FieldJob;
  client: Record<string, unknown> | null;
  project: Record<string, unknown> | null;
  site: Record<string, unknown> | null;
  assignments: Array<Record<string, unknown>>;
  resources: Record<string, Record<string, unknown>>;
};

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let jobId = "";
  let env: Env | null = null;

  try {
    if (request.method !== "POST") {
      throw new HttpError(405, "Use POST to sync a Salesforce Case.");
    }

    env = readEnv();
    await requireAuthenticatedUser(request, env);

    const body = await request.json().catch(() => ({}));
    jobId = String(body?.jobId || "").trim();
    if (!jobId) {
      throw new HttpError(400, "jobId is required.");
    }

    const context = await loadFieldContext(env, jobId);
    const salesforce = await getSalesforceSession(env);
    const existingCaseId = stringValue(context.job.salesforce_case_id);
    const payload = buildCasePayload(context);

    let caseId = existingCaseId;
    let action = "updated";
    if (caseId) {
      await salesforceRequest(salesforce, `/services/data/${SALESFORCE_API_VERSION}/sobjects/Case/${encodeURIComponent(caseId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      const created = await salesforceRequest(salesforce, `/services/data/${SALESFORCE_API_VERSION}/sobjects/Case`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      caseId = stringValue(created?.id);
      action = "created";
      if (!caseId) {
        throw new HttpError(502, "Salesforce did not return a Case ID.");
      }
    }

    const caseRecord = await salesforceRequest(
      salesforce,
      `/services/data/${SALESFORCE_API_VERSION}/sobjects/Case/${encodeURIComponent(caseId)}?fields=Id,CaseNumber`,
    );
    const caseNumber = stringValue(caseRecord?.CaseNumber);
    const caseUrl = buildSalesforceCaseUrl(salesforce.instanceUrl, caseId);

    await updateJobSync(env, jobId, {
      fieldfx_ticket_id: caseNumber || caseId,
      salesforce_case_id: caseId,
      salesforce_case_number: caseNumber,
      salesforce_case_url: caseUrl,
      salesforce_synced_at: new Date().toISOString(),
      salesforce_sync_status: "Synced",
      salesforce_sync_error: "",
    });

    return jsonResponse({ action, caseId, caseNumber, caseUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sync the Salesforce Case.";
    const status = error instanceof HttpError ? error.status : 500;
    if (env && jobId) {
      await updateJobSync(env, jobId, {
        salesforce_sync_status: "Error",
        salesforce_sync_error: message,
      }).catch(() => {});
    }
    return jsonResponse({ error: message }, status);
  }
});

function readEnv(): Env {
  const env = {
    supabaseUrl: requiredEnv("SUPABASE_URL").replace(/\/+$/, ""),
    supabaseServiceRoleKey: requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    salesforceLoginUrl: (Deno.env.get("SALESFORCE_LOGIN_URL") || "https://login.salesforce.com").replace(/\/+$/, ""),
    salesforceClientId: requiredEnv("SALESFORCE_CLIENT_ID"),
    salesforceClientSecret: requiredEnv("SALESFORCE_CLIENT_SECRET"),
    salesforceInstanceUrl: requiredEnv("SALESFORCE_INSTANCE_URL").replace(/\/+$/, ""),
  };
  return env;
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new HttpError(500, `${name} is not configured.`);
  }
  return value;
}

async function requireAuthenticatedUser(request: Request, env: Env): Promise<void> {
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    throw new HttpError(401, "Sign in before syncing Salesforce.");
  }

  const response = await fetch(`${env.supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: env.supabaseServiceRoleKey,
      Authorization: authorization,
    },
  });

  if (!response.ok) {
    throw new HttpError(401, "Sign in before syncing Salesforce.");
  }
}

async function getSalesforceSession(env: Env): Promise<SalesforceSession> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: env.salesforceClientId,
    client_secret: env.salesforceClientSecret,
  });

  const response = await fetch(`${env.salesforceLoginUrl}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new HttpError(502, salesforceErrorMessage(payload) || "Salesforce authentication failed.");
  }

  const accessToken = stringValue(payload.access_token);
  const instanceUrl = stringValue(payload.instance_url) || env.salesforceInstanceUrl;
  if (!accessToken || !instanceUrl) {
    throw new HttpError(502, "Salesforce did not return an access token and instance URL.");
  }
  return { accessToken, instanceUrl: instanceUrl.replace(/\/+$/, "") };
}

async function loadFieldContext(env: Env, jobId: string): Promise<FieldContext> {
  const jobs = await supabaseSelect(env, `field_jobs?id=eq.${encodeURIComponent(jobId)}&select=*&limit=1`);
  const job = jobs[0];
  if (!job) {
    throw new HttpError(404, "Field job was not found.");
  }

  const [clients, projects, sites, assignments] = await Promise.all([
    stringValue(job.client_id) ? supabaseSelect(env, `field_clients?id=eq.${encodeURIComponent(stringValue(job.client_id))}&select=*&limit=1`) : Promise.resolve([]),
    stringValue(job.project_id) ? supabaseSelect(env, `field_projects?id=eq.${encodeURIComponent(stringValue(job.project_id))}&select=*&limit=1`) : Promise.resolve([]),
    stringValue(job.site_id) ? supabaseSelect(env, `field_sites?id=eq.${encodeURIComponent(stringValue(job.site_id))}&select=*&limit=1`) : Promise.resolve([]),
    supabaseSelect(env, `field_job_assignments?job_id=eq.${encodeURIComponent(jobId)}&select=*&order=assignment_type.asc`),
  ]);

  const resources = await loadAssignmentResources(env, assignments);
  return {
    job,
    client: clients[0] || null,
    project: projects[0] || null,
    site: sites[0] || null,
    assignments,
    resources,
  };
}

async function loadAssignmentResources(env: Env, assignments: Array<Record<string, unknown>>): Promise<Record<string, Record<string, unknown>>> {
  const resources: Record<string, Record<string, unknown>> = {};
  const groups = new Map<string, Set<string>>();
  for (const assignment of assignments) {
    const type = stringValue(assignment.assignment_type);
    const id = stringValue(assignment.resource_id);
    const table = assignmentResourceTable(type);
    if (!table || !id) continue;
    if (!groups.has(table)) groups.set(table, new Set());
    groups.get(table)?.add(id);
  }

  await Promise.all([...groups.entries()].map(async ([table, ids]) => {
    const rows = await supabaseSelect(env, `${table}?id=in.(${[...ids].map(encodeURIComponent).join(",")})&select=*`);
    for (const row of rows) {
      resources[`${table}:${stringValue(row.id)}`] = row;
    }
  }));
  return resources;
}

function assignmentResourceTable(type: string): string {
  if (type === "Technician") return "employees";
  if (type === "Truck") return "field_trucks";
  if (type === "Trailer") return "field_trailers";
  if (type === "Equipment") return "field_equipment";
  return "";
}

function buildCasePayload(context: FieldContext): Record<string, unknown> {
  const subject = [
    stringValue(context.job.job_type) || "Field Job",
    stringValue(context.site?.site_name),
    stringValue(context.client?.client_name),
  ].filter(Boolean).join(" | ").slice(0, 255);

  const payload: Record<string, unknown> = {
    Subject: subject || `Field Job ${stringValue(context.job.id)}`,
    Description: buildCaseDescription(context),
    Priority: salesforcePriority(stringValue(context.job.priority)),
    Status: "New",
    Origin: "Dashboard",
  };

  const accountId = stringValue(context.client?.salesforce_account_id);
  if (accountId) {
    payload.AccountId = accountId;
  }

  return payload;
}

function buildCaseDescription(context: FieldContext): string {
  const lines = [
    "Created from SPL Field Ops Dashboard",
    "",
    `Dashboard Job ID: ${stringValue(context.job.id) || "Not set"}`,
    `Client: ${stringValue(context.client?.client_name) || "Not set"}`,
    `Project: ${stringValue(context.project?.project_name) || "Not set"}`,
    `Site: ${stringValue(context.site?.site_name) || "Not set"}`,
    `Site Address: ${stringValue(context.site?.physical_address) || "Not set"}`,
    `Job Type: ${stringValue(context.job.job_type) || "Not set"}`,
    `Priority: ${stringValue(context.job.priority) || "Normal"}`,
    `Scheduled Start: ${formatDateTime(context.job.scheduled_start)}`,
    `Scheduled End: ${formatDateTime(context.job.scheduled_end)}`,
    `Client Contact: ${stringValue(context.job.client_contact_for_job) || "Not set"}`,
    "",
    "Scope Summary:",
    stringValue(context.job.scope_summary) || "Not set",
    "",
    "Work Instructions:",
    stringValue(context.job.work_instructions) || "Not set",
    "",
    "Dispatch Notes:",
    stringValue(context.job.dispatch_notes) || "Not set",
    "",
    "Assignments:",
    ...assignmentLines(context),
  ];
  return lines.join("\n").slice(0, 32000);
}

function assignmentLines(context: FieldContext): string[] {
  if (!context.assignments.length) return ["None"];
  return context.assignments.map((assignment) => {
    const type = stringValue(assignment.assignment_type);
    const table = assignmentResourceTable(type);
    const resource = context.resources[`${table}:${stringValue(assignment.resource_id)}`];
    return `- ${type || "Resource"}: ${resourceLabel(type, resource)}`;
  });
}

function resourceLabel(type: string, resource: Record<string, unknown> | undefined): string {
  if (!resource) return "Unknown resource";
  if (type === "Technician") return [resource.employee_first_name, resource.employee_last_name].map(stringValue).filter(Boolean).join(" ") || stringValue(resource.employee_name) || "Unnamed employee";
  if (type === "Truck") return stringValue(resource.unit_number) || "Unnamed truck";
  if (type === "Trailer") return stringValue(resource.trailer_number) || "Unnamed trailer";
  if (type === "Equipment") return stringValue(resource.equipment_name) || stringValue(resource.serial_number) || "Unnamed equipment";
  return stringValue(resource.id) || "Unknown resource";
}

function salesforcePriority(priority: string): string {
  if (priority === "Urgent") return "High";
  if (priority === "High") return "High";
  if (priority === "Low") return "Low";
  return "Medium";
}

function formatDateTime(value: unknown): string {
  const raw = stringValue(value);
  if (!raw) return "Not scheduled";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : date.toLocaleString("en-US", { timeZone: "America/New_York" });
}

async function supabaseSelect(env: Env, path: string): Promise<Array<Record<string, unknown>>> {
  const response = await fetch(`${env.supabaseUrl}/rest/v1/${path}`, {
    headers: serviceHeaders(env),
  });
  const payload = await response.json().catch(() => []);
  if (!response.ok) {
    throw new HttpError(response.status, stringValue(payload?.message) || "Unable to load Supabase data.");
  }
  return Array.isArray(payload) ? payload : [];
}

async function updateJobSync(env: Env, jobId: string, payload: Record<string, unknown>): Promise<void> {
  const response = await fetch(`${env.supabaseUrl}/rest/v1/field_jobs?id=eq.${encodeURIComponent(jobId)}`, {
    method: "PATCH",
    headers: {
      ...serviceHeaders(env),
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new HttpError(response.status, stringValue(body?.message) || "Unable to update Salesforce sync fields.");
  }
}

function serviceHeaders(env: Env): Record<string, string> {
  return {
    apikey: env.supabaseServiceRoleKey,
    Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
    Accept: "application/json",
  };
}

async function salesforceRequest(session: SalesforceSession, path: string, init: RequestInit = {}): Promise<Record<string, unknown>> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${session.accessToken}`);
  headers.set("Accept", "application/json");
  const response = await fetch(`${session.instanceUrl}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 204) return {};
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new HttpError(response.status >= 500 ? 502 : response.status, salesforceErrorMessage(payload) || `Salesforce request failed (${response.status}).`);
  }
  return payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
}

function salesforceErrorMessage(payload: unknown): string {
  if (Array.isArray(payload)) {
    return payload.map((item) => {
      return item && typeof item === "object" ? stringValue((item as Record<string, unknown>).message) : "";
    }).filter(Boolean).join(" ");
  }
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    return stringValue(record.error_description) || stringValue(record.message) || stringValue(record.error);
  }
  return "";
}

function buildSalesforceCaseUrl(instanceUrl: string, caseId: string): string {
  return `${instanceUrl.replace(/\/+$/, "")}/lightning/r/Case/${encodeURIComponent(caseId)}/view`;
}

function stringValue(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

function jsonResponse(payload: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
