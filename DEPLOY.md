# Deploy PetTranslator.ai Landing Page — under 60 minutes

You have one file: `index.html`. It's self-contained (Tailwind via CDN, no build step). You can have it live at **pettranslator.ai** in under an hour by following this guide top-to-bottom.

---

## STEP 1 — Wire up the email form (5 min)

The page uses **Formspree** to collect emails without a backend. Free tier handles 50 submissions/month (enough for early validation; upgrade to $10/mo for 1,000).

### Create your Formspree form

1. Go to **https://formspree.io** → sign up with your email
2. Click **+ New Form** → name it `PetTranslator Waitlist`
3. Copy the form endpoint URL — it looks like `https://formspree.io/f/abc123xyz`
4. Open `index.html` and **find/replace** `YOUR_FORM_ID` (appears 2 times) with the ID portion (e.g., `abc123xyz`)
5. In Formspree settings → **Notifications** → add your email so you get notified on every signup
6. **Optional but recommended:** in Formspree → **Integrations** → connect to ConvertKit / Mailchimp / your CRM so emails auto-add to your list

### Alternative: Tally.so (also free, unlimited submissions)

If you'd rather not use Formspree:
1. Create a form at https://tally.so (free unlimited)
2. Tally provides an embed code. Replace the entire `<form>` block in the HTML with their embed.
3. Or use Tally's webhook to a Zapier/Make automation into your email tool.

---

## STEP 2 — Deploy the file (pick ONE option)

### Option A — Cloudflare Pages (RECOMMENDED) · 20 min

Best long-term: free, fast, integrates with your DNS, easy to iterate on.

1. Create a Cloudflare account at https://dash.cloudflare.com (if you don't have one)
2. **Add pettranslator.ai as a site:**
   - Dashboard → **+ Add a Site** → enter `pettranslator.ai`
   - Choose **Free** plan
   - At your domain registrar (wherever you bought pettranslator.ai), change nameservers to the two Cloudflare gave you. Propagation: 5 min – 24 hr (usually <1 hr).
3. Once Cloudflare confirms your DNS is active, go to **Workers & Pages** → **Create application** → **Pages** tab → **Upload assets**
4. Drag the entire `site/` folder (the one containing `index.html`) into the uploader
5. Name the project `pettranslator` → **Create and deploy**
6. After deploy, you'll get a URL like `pettranslator.pages.dev`
7. **Connect your domain:** Project → **Custom domains** → **Set up a custom domain** → enter `pettranslator.ai`
8. Cloudflare automatically creates the DNS records. Done. Page is live at https://pettranslator.ai

To update the page later: edit `index.html` → drag-drop the folder again. Done in 30 seconds.

### Option B — Netlify Drop · 5 min (fastest, but harder to iterate)

If you want it live in 5 minutes and you'll worry about iteration later:

1. Go to https://app.netlify.com/drop
2. Drag the entire `site/` folder onto the page
3. Instantly live at a URL like `https://random-name-12345.netlify.app`
4. **Claim the deploy** by signing up (free)
5. Site settings → **Domain management** → **Add custom domain** → `pettranslator.ai`
6. Netlify gives you DNS instructions. Either:
   - Change nameservers to Netlify's (full DNS management), OR
   - Add a CNAME record at your current DNS provider pointing `pettranslator.ai` → Netlify URL

### Option C — Vercel · 10 min

Good if you plan to migrate the static page into a Next.js project later (per the architecture doc).

1. Install the Vercel CLI: `npm i -g vercel`
2. In Terminal, navigate to the `site/` folder
3. Run `vercel` → follow prompts (link to your Vercel account, project name, etc.)
4. After deploy, go to https://vercel.com/dashboard → your project → **Settings** → **Domains** → add `pettranslator.ai`
5. Follow Vercel's DNS instructions

---

## STEP 3 — Verify everything works (5 min)

After deploy, open https://pettranslator.ai in **incognito mode** and check:

- [ ] Page loads in under 2 seconds
- [ ] Hero, sample analysis, pricing, FAQ all render correctly
- [ ] Both email forms (hero + footer) accept an email
- [ ] After submitting, you see "You're on the list" inline confirmation (not a Formspree redirect)
- [ ] You receive the test email in your Formspree dashboard / inbox
- [ ] Footer links to `/terms`, `/privacy`, `/refund-policy` — they'll 404 for now, that's OK, we publish them before paid launch
- [ ] Open the site on your phone — looks good on mobile
- [ ] Check page source: `<title>` and meta description are correct
- [ ] Run https://pagespeed.web.dev on the URL — aim for 90+ scores

---

## STEP 4 — Submit to Google for indexing (5 min)

Don't wait for Google to find you. Speed up by 1–2 weeks:

1. Create **Google Search Console** account at https://search.google.com/search-console
2. Add property → `https://pettranslator.ai`
3. Verify ownership (easiest: HTML meta tag — add to `<head>` of `index.html`, redeploy, verify)
4. Submit your URL: Search Console → **URL Inspection** → paste `https://pettranslator.ai` → **Request indexing**
5. **Optional but recommended for SEO speed:** also submit to Bing Webmaster Tools (https://www.bing.com/webmasters) — Bing powers ChatGPT search results

---

## STEP 5 — Add analytics (5 min)

You need to know how many people land vs. sign up.

### Easiest: Cloudflare Web Analytics (free, no cookie banner needed)

1. Cloudflare Dashboard → **Analytics & Logs** → **Web Analytics** → **Add a site**
2. Enter `pettranslator.ai`
3. Cloudflare gives you a `<script>` tag with your token
4. In `index.html`, uncomment the Cloudflare line near the top of `<head>` and paste in your token
5. Redeploy

### Better long-term: PostHog (free up to 1M events/mo)

PostHog gives you funnel analysis (landing page view → form submit → email confirm) which Cloudflare doesn't.

1. Sign up at https://posthog.com → free Cloud tier
2. Copy the JS snippet they give you
3. Paste it just before `</head>` in `index.html`
4. Redeploy

---

## STEP 6 — Set up the launch email auto-responder (10 min)

Right now, when someone signs up, they get nothing. Wasted opportunity. Fix it:

### Easiest: ConvertKit free tier

1. Sign up at https://convertkit.com (free up to 1,000 subscribers)
2. Create a **Form** → "Inline Form" → copy the embed code OR get the API endpoint
3. In Formspree: **Integrations** → **ConvertKit** → connect
4. In ConvertKit: build a 1-email auto-responder triggered on form signup:

   > **Subject:** You're in. Here's what to expect.
   >
   > Hey [first name if available],
   >
   > Thanks for joining the PetTranslator.ai early access list. You're now one of the first to know when we launch — and if you're among the first 500 signups, you get 3 months of Pro free.
   >
   > While we finish building, here's what's coming:
   >
   > **What it does:** upload a 10-second video of your pet, and our AI gives you a behavioral analysis grounded in veterinary science — not a cartoon "Woof, feed me" translation.
   >
   > **When:** late summer 2026.
   >
   > **What you can do today:** reply to this email and tell me about your pet. I read every reply, and the most-common questions become product features.
   >
   > — [Your name]
   > Founder, PetTranslator.ai

5. This single email transforms a 1-time signup into the start of a relationship.

---

## STEP 7 — Tell the world (the same day you deploy)

The page only works if people see it. Same-day promotion checklist:

- [ ] **Tweet/Threads:** "I built pettranslator.ai — premium AI pet behaviorist, web-first. Launching summer. First 500 get 3 months free. [link]"
- [ ] **LinkedIn:** longer-form "why I built this" post — drives quality early signups
- [ ] **Reddit:** r/dogs and r/cats — DO NOT spam links. Instead, post a thoughtful comment on a relevant thread, mention your tool only if asked. Reddit auto-bans link-droppers.
- [ ] **Your existing Facebook audience (Rusty Restoration):** mention it in a Stories post — "side project I'm building." Casual, not salesy.
- [ ] **Indie Hackers:** post in the "Launches" section after first 50 signups
- [ ] **Product Hunt:** save for actual product launch, not the waitlist
- [ ] **TikTok Day 1 video** — record the "I built this because..." founder origin video and post it. Per content playbook.

---

## TROUBLESHOOTING

**Form submits but I never get an email:**
Check Formspree dashboard → did the submission arrive? If yes, check your inbox spam folder. If no, the form action URL is wrong — re-check `YOUR_FORM_ID`.

**Page loads on `xxx.pages.dev` but not `pettranslator.ai`:**
DNS propagation. Wait 30 min, then try again. If still broken after 24 hr, the DNS records aren't pointing right — re-check at https://dnschecker.org.

**Tailwind classes not working:**
Your browser blocked the CDN. Check the browser console. Most often: an aggressive ad-blocker. Test in incognito with extensions disabled.

**Looks fine on desktop, broken on mobile:**
Open the broken page in Chrome DevTools → toggle device toolbar → reproduce. 99% of the time it's a custom class that doesn't have a mobile variant — easy fix.

---

## WHEN TO REPLACE THIS PAGE

This is a **coming-soon waitlist page**, not the final product site. Replace or upgrade when:

| Trigger | Upgrade to |
|---|---|
| You have the working product ready | Replace `index.html` with the Next.js app (see `mvp_architecture.md`). The current page becomes `/(marketing)/page.tsx`. |
| Waitlist hits 500 | Add a `/about` and `/blog` to start ranking for long-tail SEO keywords |
| First TikTok hits 100K views | Add testimonials/quote section (use audience comments as social proof) |
| You partner with a vet/behaviorist | Add a `/methodology` page detailing the science — biggest credibility boost available |
