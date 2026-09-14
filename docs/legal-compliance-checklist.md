# Legal compliance checklist — Svarga.ai

**Purpose:** Review the site’s Terms, Privacy, Refund, and Contact pages before Udyam submission and a CA/advocate review.

**Business:** Svarga Digital  
**Udyam:** UDYAM-KL-02-0169185  
**NIC:** 62 — Computer programming, consultancy and related activities  
**Owner:** Aditya Mohan Menon  
**Domain:** https://svarga.digital  
**Contact:** adityamenon593@gmail.com, +91 81390 12237

---

## Current status

| Area | Status | Notes |
|------|--------|-------|
| Terms & Conditions | Done | Includes ownership, Udyam info, AI/model disclosure, acceptable use, payments, IP, restrictions, disclaimer, governing law, changes. |
| Privacy Policy | Done | Covers data collected, use, AI training opt-in, storage, cookies, user rights, children, changes. |
| Refund / Cancellation Policy | Done | 7-day refund window, process, exceptions. |
| Contact page | Done | Email, phone/WhatsApp, LinkedIn, business address (city/state). |
| AI / model ownership disclaimer | Done | Terms and homepage clearly state Svarga orchestrates third-party frontier models and does not own or independently train the base LLM. |
| Udyam/MSME details | Done | Footer and Terms show Svarga Digital, Udyam number, NIC 62. |

---

## What to fix before Udyam submission (if a CA/advocate wants it stricter)

1. **Add a Grievance Officer designation**
   - Required under the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 for many Indian platforms.
   - Fix: Add a section in Terms/Privacy naming Aditya Mohan Menon as the Grievance Officer with email and 15-working-day response target.

2. **Add a Data Protection Officer / contact (optional but recommended)**
   - If you collect personal data at scale or process sensitive data, name a DPO/contact.
   - Fix: Add one line in the Privacy Policy: “Questions or data requests: adityamenon593@gmail.com.” (Already present — expand if needed.)

3. **Specify third-party processors and sub-processors**
   - Current text says “secure cloud providers.”
   - Fix: List actual providers used for auth, database, payments, AI inference (e.g., Lovable Cloud / Supabase, Razorpay, Lovable AI Gateway / configured frontier model providers). This is important for DPDP Act readiness.

4. **Add data-retention periods**
   - Current Privacy Policy does not say how long accounts, chats, or uploaded documents are kept.
   - Fix: Add a sentence like “Account and chat data are retained until you delete your account or request deletion. Uploaded documents are retained until you remove them.”

5. **Add a Cookie / tracking disclosure**
   - Current text is brief.
   - Fix: If you use Google Analytics or any non-essential tracker, name it and explain how to disable it. If only essential auth cookies are used, state that explicitly.

6. **Add precise pricing and tax disclosures**
   - If you display prices, clarify whether GST is included or extra, and mention the payment processor.
   - Fix: Add “Prices are in INR. Applicable GST will be charged at checkout. Payments processed by Razorpay.”

7. **Add an official street address (only if Udyam certificate or GST requires it)**
   - The user chose not to publish a full street address. This is fine for the website, but keep the actual Udyam-registered address in your records and share it with your CA for filings.

8. **Add an explicit user-consent mechanism for Terms/Privacy**
   - Fix: On the auth/sign-up screen, require users to check “I agree to the Terms & Conditions and Privacy Policy” with clickable links before creating an account.

9. **Add a limitation-of-liability cap and indemnity clause**
   - Current Disclaimer is short. A CA/advocate may want a clearer cap and user indemnity.
   - Fix: Add standard language limiting liability to fees paid in the last 12 months and requiring users to indemnify Svarga Digital for misuse.

10. **Add a force-majeure and service-availability clause**
    - Fix: State that AI/LLM services may experience outages, rate limits, or errors and Svarga Digital is not liable for unavailability caused by upstream providers.

11. **Add a dispute-resolution / arbitration clause (optional)**
    - Fix: If you want to avoid courts for small disputes, add an arbitration clause seated in Kochi or Bengaluru under Indian law. Requires CA/advocate input.

12. **Review the “Parameshvara 2.0” and benchmark claims**
    - Already footnoted as illustrative placeholders. Make sure no social media post or investor material removes that qualifier.

---

## Suggested order of action

1. Send this pack and the current Terms/Privacy/Refund pages to your CA/advocate.
2. Ask them to flag only the clauses that are risky for an early-stage MSME — do not over-lawyer the site before launch.
3. Implement the Grievance Officer, third-party processor list, retention, and consent checkbox first (high impact, low effort).
4. Add the remaining clauses after launch based on actual user volume and payment data.
5. Keep a changelog of legal-page updates with dates.
