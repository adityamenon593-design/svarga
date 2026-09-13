create policy "Users can update their own documents"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.validate_user_settings_referred_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.referred_by is not null then
    if NEW.referred_by = NEW.user_id then
      raise exception 'referred_by cannot be the same user';
    end if;
    if not exists (select 1 from public.user_settings s where s.user_id = NEW.referred_by) then
      raise exception 'referred_by must reference an existing user with settings';
    end if;
  end if;

  if TG_OP = 'UPDATE' and OLD.referred_by is not null and NEW.referred_by is distinct from OLD.referred_by then
    raise exception 'referred_by cannot be changed once set';
  end if;

  return NEW;
end;
$$;

drop trigger if exists user_settings_validate_referred_by on public.user_settings;
create trigger user_settings_validate_referred_by
  before insert or update on public.user_settings
  for each row execute function public.validate_user_settings_referred_by();