// Supabase Edge Function: b2-sign
// Membuat presigned URL untuk Backblaze B2 (S3-compatible). Aman:
// secret B2 hanya ada di server (Supabase Secrets), tidak pernah ke browser.
// mode "write" -> presigned PUT (upload). mode "read" -> presigned GET (tampilkan, bucket privat).
//
// Deploy:  supabase functions deploy b2-sign
// Set secrets (sekali):
//   supabase secrets set B2_KEY_ID=xxx B2_APP_KEY=xxx B2_BUCKET=materi-kedokteran \
//     B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com B2_REGION=us-west-004
//
// Hanya user login (JWT valid) yang boleh minta URL.

import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { key, contentType, mode } = await req.json();
    if (!key) return json({ error: "key wajib" }, 400);
    const m = mode === "read" ? "read" : "write";

    const bucket = Deno.env.get("B2_BUCKET")!;
    const endpoint = Deno.env.get("B2_ENDPOINT")!;   // https://s3.<region>.backblazeb2.com
    const region = Deno.env.get("B2_REGION")!;        // mis. us-west-004

    const client = new AwsClient({
      accessKeyId: Deno.env.get("B2_KEY_ID")!,
      secretAccessKey: Deno.env.get("B2_APP_KEY")!,
      service: "s3",
      region,
    });

    const url = `${endpoint}/${bucket}/${key}`;
    const method = m === "read" ? "GET" : "PUT";
    const headers = m === "read" ? {} : { "content-type": contentType || "image/jpeg" };
    const signed = await client.sign(
      new Request(url, { method, headers }),
      { aws: { signQuery: true }, expiresIn: m === "read" ? 3600 : 300 } as any
    );

    return json({ url: signed.url }, 200);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
