# pettranslator.ai

Coming-soon waitlist landing page for PetTranslator.ai — a veterinary-behaviorist-style AI for pet owners.

Single-file static site. Tailwind via CDN. No build step.

## Local preview

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy

Auto-deploys to Vercel on every push to `main`. Live at https://pettranslator.ai.

## Waitlist form

Form posts to `/api/waitlist`, a Vercel serverless function (see `api/waitlist.js`).
Every signup is logged to Vercel's runtime logs and is the source of truth.

To also receive signups by email, set one of these env vars in
Vercel → Project → Settings → Environment Variables:

- `WEB3FORMS_KEY` — free 250 submissions/mo, sign up at https://web3forms.com
- `RESEND_API_KEY` — better long-term, free tier at https://resend.com

To view signups now: Vercel dashboard → pettranslator project → Logs → filter by `/api/waitlist`.
