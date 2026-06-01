// PetTranslator.ai waitlist intake.
//
// Receives POST { email, source } from the landing-page forms.
// Logs every signup to Vercel logs (always-on, free, never lost).
//
// When RESEND_API_KEY is set, ALSO:
//   1. Notifies the owner (OWNER_EMAIL or khabir.neelum@gmail.com).
//   2. Sends an instant welcome auto-responder to the signup,
//      with reply-to set to the owner so the recipient can write back.
//
// When WEB3FORMS_KEY is set, fan-out to Web3Forms instead (notify-only).
// Both env vars optional and independent — you can run with neither, either,
// or both. Until at least one is configured, signups still land in Vercel logs.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Resend sender + reply-to. Until pettranslator.ai is verified in Resend, we
// send from their default sandbox domain (works for any recipient, no setup).
// When you verify the domain, swap RESEND_FROM to "PetTranslator <hello@pettranslator.ai>".
const RESEND_FROM = process.env.RESEND_FROM || "PetTranslator <onboarding@resend.dev>";
const OWNER_EMAIL = process.env.OWNER_EMAIL || "khabir.neelum@gmail.com";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS).end();
    return;
  }
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json", ...CORS_HEADERS })
       .end(JSON.stringify({ ok: false, error: "method_not_allowed" }));
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

  // 1. Always log — primary persistence.
  console.log(JSON.stringify({ event: "waitlist_signup", ts, email, source, ip, ua }));

  // 2. Fan-out to Resend if configured.
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const headers = {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    };

    // 2a. Notify owner — sent in parallel with welcome email.
    const ownerEmail = fetch("https://api.resend.com/emails", {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [OWNER_EMAIL],
        subject: `New PetTranslator.ai waitlist signup — ${email}`,
        text:
          `New signup\n\n` +
          `Email:     ${email}\n` +
          `Source:    ${source}\n` +
          `Timestamp: ${ts}\n` +
          `IP:        ${ip}\n` +
          `UA:        ${ua}`,
      }),
    }).catch((err) => console.error("resend_owner_failed", err?.message));

    // 2b. Welcome auto-responder. Reply-to is the owner so the recipient
    //     can write back and reach a real human inbox.
    const welcomeEmail = fetch("https://api.resend.com/emails", {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [email],
        reply_to: OWNER_EMAIL,
        subject: "You're in — here's what's coming",
        text: welcomeText(),
        html: welcomeHtml(),
      }),
    }).catch((err) => console.error("resend_welcome_failed", err?.message));

    // Don't block the response on email delivery — fire and forget.
    Promise.allSettled([ownerEmail, welcomeEmail]).then((results) => {
      results.forEach((r, i) => {
        if (r.status === "rejected") console.error("resend_settled_failed", i, r.reason?.message);
      });
    });
  }

  // 3. Optional Web3Forms fan-out (kept as a backup channel).
  const w3fKey = process.env.WEB3FORMS_KEY;
  if (w3fKey) {
    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: w3fKey,
        subject: `PetTranslator.ai waitlist signup (${source})`,
        from_name: "PetTranslator.ai",
        email,
        source,
        ts,
      }),
    }).catch((err) => console.error("web3forms_failed", err?.message));
  }

  res.writeHead(200, { "Content-Type": "application/json", ...CORS_HEADERS })
     .end(JSON.stringify({ ok: true }));
}

// ---------- Welcome email content ----------

function welcomeText() {
  return [
    "Welcome to PetTranslator.ai.",
    "",
    "You're officially on the early-access list. Two things to know:",
    "",
    "1. You'll hear from us about two weeks before the public launch so you can claim your spot first.",
    "",
    "2. If you're in the first 500 signups, you get three months of Pro free at launch — no card required.",
    "",
    "While we finish building, the most useful thing you can do is reply to this email and tell me about your pet. What's the one behavior you wish you understood better? I read every reply, and the most-common questions become product features.",
    "",
    "— Khabir",
    "Founder, PetTranslator.ai",
    "",
    "---",
    "PetTranslator.ai provides behavioral analysis for educational purposes. It is not a substitute for professional veterinary care. If you believe your pet may be ill or injured, contact a licensed veterinarian.",
  ].join("\n");
}

function welcomeHtml() {
  // Inline styles only — many clients strip <style> blocks.
  // Echoes the landing page's editorial palette: alabaster, charcoal,
  // terracotta accent. Serif headline + sans body.
  return `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F5F3E9;font-family:-apple-system,BlinkMacSystemFont,'Plus Jakarta Sans',Segoe UI,Roboto,sans-serif;color:#1A1A1A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3E9;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FBFAF2;border:1px solid #D8D2BF;border-radius:4px;">
          <tr>
            <td style="padding:28px 32px 8px;border-bottom:2px solid #1A1A1A;">
              <div style="font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#606060;">PetTranslator.ai · Issue №01</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px;">
              <h1 style="margin:0;font-family:'Newsreader',Georgia,serif;font-weight:500;font-size:32px;line-height:1.1;letter-spacing:-0.015em;color:#1A1A1A;">
                You're <em style="font-style:italic;color:#C46A45;">in</em>.
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 16px;font-size:15px;line-height:1.6;color:#1A1A1A;">
              <p style="margin:12px 0;">You're officially on the early-access list. Two things to know:</p>
              <p style="margin:12px 0;"><strong>1.</strong> You'll hear from us about two weeks before the public launch so you can claim your spot first.</p>
              <p style="margin:12px 0;"><strong>2.</strong> If you're in the first 500 signups, you get <strong>three months of Pro free</strong> at launch — no card required.</p>
              <p style="margin:18px 0 12px;">While we finish building, the most useful thing you can do is <strong>reply to this email and tell me about your pet</strong>. What's the one behavior you wish you understood better? I read every reply, and the most-common questions become product features.</p>
              <p style="margin:20px 0 4px;">— Khabir</p>
              <p style="margin:0;color:#606060;font-size:14px;">Founder, PetTranslator.ai</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #E8E2CD;">
              <p style="margin:0;font-size:11px;line-height:1.55;color:#606060;">
                PetTranslator.ai provides behavioral analysis for educational purposes. It is not a substitute for professional veterinary care. If you believe your pet may be ill or injured, contact a licensed veterinarian.
              </p>
            </td>
          </tr>
        </table>
        <div style="max-width:560px;margin-top:14px;font-size:11px;color:#8A8A8A;">
          You signed up at <a href="https://pettranslator.ai" style="color:#8A8A8A;">pettranslator.ai</a>. Reply to unsubscribe and I'll remove you immediately.
        </div>
      </td>
    </tr>
  </table>
</body></html>`.trim();
}
