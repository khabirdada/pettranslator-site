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

## Form

Waitlist emails are collected via [formsubmit.co](https://formsubmit.co) and forwarded to `khabir.neelum@gmail.com`. To swap providers later (Formspree, ConvertKit, etc.), update the two `<form action="...">` URLs and the matching hidden fields.
