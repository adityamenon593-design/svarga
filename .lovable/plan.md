# Plan: Update public pages with official Udyam/MSME details

1. **Confirm registration details with Aditya**
   - Official business name as on the Udyam certificate (e.g., “Svarga Digital” or “Svarga AI”).
   - Udyam registration number and date (if available and desired on the site).
   - Primary NIC 2-digit code: **62** (Computer programming, consultancy and related activities).
   - Optional secondary NIC 2-digit code: **63** (Information service activities), if applicable.
   - Registered/official business address in Kochi.
   - Owner name and PAN (for internal records; only display name on public pages).

2. **Update homepage footer (`src/routes/index.tsx`)**
   - Replace the current Udyam line with the official business name and NIC code(s).
   - Keep the existing “All rights reserved. Owned exclusively by Aditya Mohan Menon.” and “Made in Bharat” lines.
   - Example line: `Svarga Digital — Udyam-registered MSME, Government of India | NIC: 62 (Computer programming, consultancy and related activities)`.

3. **Update Terms page (`src/routes/terms.tsx`)**
   - Add or update the “Ownership / Company information” section with the official business name, address, Udyam registration, and NIC code.
   - Retain all existing IP ownership, anti-scraping, and limitation language.

4. **Update Contact page (`src/routes/contact.tsx`)**
   - Add an official business address block if the page supports it; otherwise add it to the footer and Terms.
   - Keep phone/WhatsApp 8139012237, email adityamenon593@gmail.com, and LinkedIn link as-is unless instructed otherwise.

5. **Verify and publish**
   - Run lint, typecheck, and build after edits.
   - Publish to `svarga.digital` only after Aditya approves the exact wording.

**Note:** This is not legal/CA advice. An Indian CA or advocate should still review the final Terms and Udyam display text.
