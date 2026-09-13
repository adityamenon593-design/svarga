alter function public.match_document_chunks(vector(3072), int, uuid) security invoker;

revoke execute on function public.match_document_chunks(vector(3072), int, uuid) from public;
revoke execute on function public.match_document_chunks(vector(3072), int, uuid) from anon;

grant execute on function public.match_document_chunks(vector(3072), int, uuid) to authenticated;
grant execute on function public.match_document_chunks(vector(3072), int, uuid) to service_role;