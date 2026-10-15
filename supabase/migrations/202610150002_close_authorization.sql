-- Fail closed for authenticated identities whose application profile is absent.
-- SQL NULL is not false: NOT(NULL) previously skipped the rejection branch.
begin;
create or replace function public.close_request(p_request uuid, p_status text, p_reason text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare actor uuid := public.my_profile_id(); r public.waste_requests;
begin
  select * into r from public.waste_requests where id = p_request for update;
  if auth.uid() is null or actor is null or not found or
    (public.my_role() = 'admin' or (public.my_role() = 'resident' and r.resident_id = actor and r.status = 'Pending' and p_status = 'Cancelled')) is not true
  then raise exception 'Not authorized' using errcode = '42501'; end if;
  if p_status is null or p_status not in ('Cancelled','Rejected') then raise exception 'Invalid closing status'; end if;
  if not ((r.status = 'Pending' and p_status in ('Cancelled','Rejected')) or (r.status = 'Assigned' and p_status in ('Cancelled','Rejected')) or (r.status = 'In Progress' and p_status = 'Rejected')) then raise exception 'Invalid status transition: request cannot be closed from %', r.status; end if;
  if p_reason is null or length(btrim(p_reason)) not between 5 and 500 then raise exception 'Provide a reason (5–500 characters)'; end if;
  perform set_config('ecosort.close_reason',btrim(p_reason),true);
  update public.waste_requests set status = p_status where id = p_request;
  update public.assignments set status = 'cancelled' where request_id = p_request and status = 'active';
end $$;
revoke all on function public.close_request(uuid,text,text) from public, anon;
grant execute on function public.close_request(uuid,text,text) to authenticated;
commit;
