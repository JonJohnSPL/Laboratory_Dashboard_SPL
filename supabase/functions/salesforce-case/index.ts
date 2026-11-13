import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Retained temporarily so stale clients receive a safe, explicit response.
// This endpoint intentionally makes no Salesforce or database calls.
serve((request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  return new Response(JSON.stringify({
    error: "This write-capable Salesforce endpoint is retired. Use the read-only salesforce-ticket-sync integration.",
    retired: true,
  }), {
    status: 410,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
