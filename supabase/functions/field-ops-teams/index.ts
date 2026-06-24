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

type Env = {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  fieldOpsTeamsWebhookUrl: string;
};

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (request.method !== "POST") {
      throw new HttpError(405, "Use POST to send a Field Ops Teams message.");
    }

    const env = readEnv();
    await requireAuthenticatedUser(request, env);

    const body = await request.json().catch(() => ({}));
    const payload = normalizeTeamsPayload(body);
    const response = await fetch(env.fieldOpsTeamsWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new HttpError(502, detail || `Teams webhook failed with HTTP ${response.status}.`);
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send the Teams message.";
    const status = error instanceof HttpError ? error.status : 500;
    return jsonResponse({ error: message }, status);
  }
});

function readEnv(): Env {
  return {
    supabaseUrl: requiredEnv("SUPABASE_URL").replace(/\/+$/, ""),
    supabaseServiceRoleKey: requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    fieldOpsTeamsWebhookUrl: requiredEnv("FIELD_OPS_TEAMS_WEBHOOK_URL"),
  };
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
    throw new HttpError(401, "Sign in before sending a Teams message.");
  }

  const response = await fetch(`${env.supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: env.supabaseServiceRoleKey,
      Authorization: authorization,
    },
  });

  if (!response.ok) {
    throw new HttpError(401, "Sign in before sending a Teams message.");
  }
}

function normalizeTeamsPayload(body: unknown): Record<string, string> {
  const input = isRecord(body) ? body : {};
  const title = stringValue(input.title) || "Field Ops Alert";
  const message = stringValue(input.message) || "Field Ops dashboard notification.";

  return {
    title,
    message,
    job: stringValue(input.job),
    client: stringValue(input.client),
    site: stringValue(input.site),
    schedule: stringValue(input.schedule),
    missing: stringValue(input.missing),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
