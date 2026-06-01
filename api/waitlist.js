// PetTranslator.ai waitlist intake.
//
// Receives POST { email, source } from the landing-page forms.
// Logs every signup to Vercel logs (always visible in the Vercel dashboard).
// If env vars are configured, ALSO forwards to:
//   - Web3Forms (set WEB3FORMS_KEY)  → email delivery to khabir.neelum@gmail.com
//   - Resend     (set RESEND_API_KEY) → richer email delivery, recommended later
//
// Until at least one delivery channel is configured, signups still arrive
// reliably in the Vercel function logs — they're never lost.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS).end();
    return;
  }
  if (req.method !== "POST") {
    res.writeHead(405, CORS_HEADERS).end(JSON.stringify({ ok: false, error: "method_not_allowed" }));
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const email = String(body.email || "").trim().toLowerCase();
  const source = String(body.source || "unknown").slice(0, 32);

  if (!EMAIL_RE.test(email) || email.length > 254) {
    res.writeHead(400, { "Content-Type": "application/json", ...CORS_HEADERS })
       .end(JSON.stringify({ ok: false, error: "invalid_email" }));
    return;
  }

  const ts = new Date().toISOString();
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
  const ua = String(req.headers["user-agent"] || "").slice(0, 200);

  // 1. Always log — primary persistence at MVP scale.
  console.log(JSON.stringify({ event: "waitlist_signup", ts, email, source, ip, ua }));

  // 2. Optional fan-out to Web3Forms (no signup required by the visitor,
  //    only by you the operator — paste the key into Vercel env vars).
  const w3fKey = process.env.WEB3FORMS_KEY;
  if (w3fKey) {
    try {
      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          access_key: w3fKey,
          subject: `PetTranslator.ai waitlist signup (${source})`,
          from_name: "PetTranslator.ai",
          email,
          source,
          ts,
        }),
      });
    } catch (err) {
      console.error("web3forms_failed", err?.message);
    }
  }

  // 3. Optional fan-out to Resend (richer email control). Wire this up later.
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "PetTranslator <onboarding@resend.dev>",
          to: ["khabir.neelum@gmail.com"],
          subject: `New PetTranslator.ai waitlist signup (${source})`,
          text: `Email: ${email}\nSource: ${source}\nTimestamp: ${ts}\nIP: ${ip}`,
        }),
      });
    } catch (err) {
      console.error("resend_failed", err?.message);
    }
  }

  res.writeHead(200, { "Content-Type": "application/json", ...CORS_HEADERS })
     .end(JSON.stringify({ ok: true }));
}
