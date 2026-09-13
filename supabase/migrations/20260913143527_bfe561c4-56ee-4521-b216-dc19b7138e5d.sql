-- Payments: only the server may write; users keep read-only access to their own rows
CREATE POLICY "payments_block_user_writes" ON public.payments AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "payments_block_user_updates" ON public.payments AS RESTRICTIVE FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "payments_block_user_deletes" ON public.payments AS RESTRICTIVE FOR DELETE TO authenticated USING (false);

-- Donations: same lockdown
CREATE POLICY "donations_block_user_writes" ON public.donations AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "donations_block_user_updates" ON public.donations AS RESTRICTIVE FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "donations_block_user_deletes" ON public.donations AS RESTRICTIVE FOR DELETE TO authenticated USING (false);

-- Usage events: read-only for users; only the server records usage
CREATE POLICY "usage_events_block_user_writes" ON public.usage_events AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "usage_events_block_user_updates" ON public.usage_events AS RESTRICTIVE FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "usage_events_block_user_deletes" ON public.usage_events AS RESTRICTIVE FOR DELETE TO authenticated USING (false);

-- Referrals: read-only for participants; only the server creates them
CREATE POLICY "referrals_block_user_writes" ON public.referrals AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "referrals_block_user_updates" ON public.referrals AS RESTRICTIVE FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "referrals_block_user_deletes" ON public.referrals AS RESTRICTIVE FOR DELETE TO authenticated USING (false);