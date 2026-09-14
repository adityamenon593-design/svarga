# Hosting clarity + Google Colab integration

## What is actually happening with hosting

The app is **not hosted on Vercel**. It is built on Lovable and deployed to Cloudflare Workers edge functions. Your domain `svarga.digital` is registered/bought on Hostinger, and Hostinger DNS points it to Lovable's hosting IP. That is the intended setup.

## Part 1 — Hostinger / domain hosting

1. Verify the current domain status for `svarga.digital` and `www.svarga.digital`.
2. Confirm the Hostinger DNS records still point to Lovable's required values.
3. Decide the path:
   - **Recommended (fast, keeps everything working):** keep Lovable as the host and Hostinger as the domain registrar/DNS only.
   - **Alternative (large project):** move actual hosting to a Hostinger VPS. This means rebuilding the backend, moving the database, and ongoing server maintenance. We will only do this if you explicitly choose it.

## Part 2 — Google Colab integration

Build one ready-to-run Google Colab notebook at `notebooks/svarga-colab-starter.ipynb`.

The notebook will include:
- Python setup and required packages.
- How to call Svarga's chat endpoint from Colab (guest-mode with rate limits).
- How to generate images through the Svarga API.
- A starter fine-tuning pipeline for an open-source model (Unsloth / PEFT) using exported conversation data.
- A section on exporting anonymized chat data for training.
- Rate-limit handling and retry logic.
- Clear instructions so users can run it without writing code.

## Part 3 — Link it on the site

Add a small "Run in Colab" / "Developer notebook" link in the footer or docs so visitors can find it.

## Security & IP

- The notebook will never embed secrets or API keys.
- All generated materials stay under your exclusive ownership.

## Deliverables

- [ ] Hosting report (Vercel vs Lovable vs Hostinger explained).
- [ ] Domain/DNS verification for `svarga.digital`.
- [ ] `notebooks/svarga-colab-starter.ipynb` committed to the repo.
- [ ] Link added to the site footer or docs page.
- [ ] Build/lint remains clean.
