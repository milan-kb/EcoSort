-- EcoSort: apply to a fresh Supabase project through the SQL editor or CLI.
-- No demo records or privileged accounts are inserted into a connected project.
begin;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) between 2 and 80),
  phone text not null check (phone ~ '^\+?[0-9 ()-]{7,20}$'),
  ward text not null check (length(btrim(ward)) between 1 and 40),
  role text not null default 'resident' check (role in ('resident','collector','admin')),
  created_at timestamptz not null default now()
);
create table public.waste_requests (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references public.profiles(id),
  request_type text not null check (request_type in ('pickup','dumping')),
  waste_category text not null check (waste_category in ('Organic','Plastic','Paper & cardboard','Glass','Metal','E-waste & hazardous','Mixed','Unknown')),
  quantity text not null default '' check (length(quantity) <= 100),
  ward text not null check (length(btrim(ward)) between 1 and 40),
  address text not null check (length(btrim(address)) between 5 and 300),
  latitude double precision, longitude double precision,
  description text not null default '' check (length(description) <= 2000),
  image_path text check (length(image_path) <= 300),
  preferred_date date,
  is_segregated boolean not null default false,
  status text not null default 'Pending' check (status in ('Pending','Assigned','In Progress','Collected','Cancelled','Rejected')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((latitude is null and longitude is null) or (latitude is not null and longitude is not null and latitude between -90 and 90 and longitude between -180 and 180)),
  check (request_type <> 'pickup' or (is_segregated and length(btrim(quantity)) > 0 and waste_category not in ('Mixed','Unknown'))),
  check (request_type <> 'dumping' or length(btrim(description)) >= 10)
);
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.waste_requests(id) on delete cascade,
  collector_id uuid not null references public.profiles(id),
  assigned_by uuid not null references public.profiles(id),
  assigned_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active','completed','replaced','cancelled'))
);
create unique index one_active_assignment on public.assignments(request_id) where status = 'active';
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.waste_requests(id) on delete cascade,
  collector_id uuid not null references public.profiles(id), collected_at timestamptz not null default now(),
  proof_image_path text check (length(proof_image_path) <= 300),
  notes text not null default '' check (length(notes) <= 2000),
  destination_type text not null check (destination_type in ('composting','sorting','authorized_hazardous','other')),
  destination_name text not null check (length(btrim(destination_name)) between 3 and 200),
  destination_status text not null check (destination_status in ('intended','handed_over'))
);
create table public.request_status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.waste_requests(id) on delete cascade,
  previous_status text check (previous_status in ('Pending','Assigned','In Progress','Collected','Cancelled','Rejected')),
  new_status text not null check (new_status in ('Pending','Assigned','In Progress','Collected','Cancelled','Rejected')),
  changed_by uuid references public.profiles(id), changed_at timestamptz not null default now(),
  reason text check (length(reason) <= 500)
);
create index requests_resident_created on public.waste_requests(resident_id, created_at desc);
create index requests_status_ward on public.waste_requests(status, ward);
create index requests_category on public.waste_requests(waste_category);
create index requests_type_created on public.waste_requests(request_type, created_at desc);
create index assignments_collector_status on public.assignments(collector_id,status);
create index history_request_time on public.request_status_history(request_id,changed_at);
create index collections_collector on public.collections(collector_id);
create index assignments_assigned_by on public.assignments(assigned_by);
create index history_changed_by on public.request_status_history(changed_by);

-- Internal helpers run as the migration owner, avoiding recursive RLS lookups.
create function public.my_profile_id() returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select id from public.profiles where auth_user_id = auth.uid()
$$;
create function public.my_role() returns text language sql stable security definer set search_path = public, pg_temp as $$
  select role from public.profiles where auth_user_id = auth.uid()
$$;
create function public.require_role(p_role text) returns uuid language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or public.my_role() is distinct from p_role then raise exception 'Not authorized' using errcode = '42501'; end if;
  return public.my_profile_id();
end $$;
create function public.can_read_request(p_request uuid) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and exists (
    select 1 from public.waste_requests r where r.id = p_request and (
      public.my_role() = 'admin'
      or (public.my_role() = 'resident' and r.resident_id = public.my_profile_id())
      or (public.my_role() = 'collector' and exists (select 1 from public.assignments a where a.request_id = r.id and a.collector_id = public.my_profile_id() and a.status in ('active','completed')))
    )
  )
$$;
create function public.owns_image_path(p_path text, p_request uuid) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select p_path is null or (
    length(p_path) <= 300 and p_path like auth.uid()::text || '/' || p_request::text || '/%'
    and p_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
    and exists(select 1 from storage.objects where bucket_id = 'waste-images' and name = p_path)
  )
$$;

-- Signup always creates a resident. Never trust role claims in user_metadata.
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.profiles(id,auth_user_id,name,phone,ward,role)
  values (new.id,new.id,btrim(coalesce(new.raw_user_meta_data->>'name','')),btrim(coalesce(new.raw_user_meta_data->>'phone','')),btrim(coalesce(new.raw_user_meta_data->>'ward','')),'resident');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Status audit is generated by the database, not supplied by clients.
create function public.audit_request() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'Pending' then raise exception 'Requests must start Pending'; end if;
    insert into public.request_status_history(request_id,new_status,changed_by) values(new.id,'Pending',public.my_profile_id());
  elsif new.status is distinct from old.status then
    if not (
      (old.status = 'Pending' and new.status in ('Assigned','Cancelled','Rejected')) or
      (old.status = 'Assigned' and new.status in ('In Progress','Cancelled','Rejected')) or
      (old.status = 'In Progress' and new.status in ('Collected','Rejected'))
    ) then raise exception 'Invalid status transition: % to %', old.status,new.status; end if;
    insert into public.request_status_history(request_id,previous_status,new_status,changed_by,reason)
    values(new.id,old.status,new.status,public.my_profile_id(),nullif(current_setting('ecosort.close_reason',true),''));
  end if;
  return new;
end $$;
create trigger request_audit after insert or update on public.waste_requests for each row execute function public.audit_request();
create function public.touch_request() returns trigger language plpgsql set search_path = public, pg_temp as $$ begin new.updated_at = now(); return new; end $$;
create trigger request_updated before update on public.waste_requests for each row execute function public.touch_request();

-- Every mutation uses an atomic RPC. Lock the request before checking its state.
create function public.create_request(p_id uuid, p_payload jsonb) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare actor uuid := public.require_role('resident'); path text := p_payload->>'image_path';
begin
  if not public.owns_image_path(path,p_id) then raise exception 'Invalid or unauthorized image path'; end if;
  insert into public.waste_requests(id,resident_id,request_type,waste_category,quantity,ward,address,latitude,longitude,description,image_path,preferred_date,is_segregated)
  values(p_id,actor,p_payload->>'request_type',p_payload->>'waste_category',btrim(coalesce(p_payload->>'quantity','')),btrim(p_payload->>'ward'),btrim(p_payload->>'address'),(p_payload->>'latitude')::double precision,(p_payload->>'longitude')::double precision,btrim(coalesce(p_payload->>'description','')),path,(p_payload->>'preferred_date')::date,coalesce((p_payload->>'is_segregated')::boolean,false));
  return p_id;
end $$;
create function public.assign_request(p_request uuid, p_collector uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare actor uuid := public.require_role('admin'); r public.waste_requests;
begin
  select * into r from public.waste_requests where id = p_request for update;
  if not found then raise exception 'Request not found'; end if;
  if r.status not in ('Pending','Assigned') then raise exception 'Invalid status transition: assignment is locked once collection begins'; end if;
  if not exists(select 1 from public.profiles where id = p_collector and role = 'collector') then raise exception 'Choose an authorized collector'; end if;
  update public.assignments set status = 'replaced' where request_id = p_request and status = 'active';
  insert into public.assignments(request_id,collector_id,assigned_by) values(p_request,p_collector,actor);
  update public.waste_requests set status = 'Assigned' where id = p_request;
end $$;
create function public.start_collection(p_request uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare actor uuid := public.require_role('collector'); r public.waste_requests;
begin
  select * into r from public.waste_requests where id = p_request for update;
  if not found or not exists(select 1 from public.assignments where request_id = p_request and collector_id = actor and status = 'active') then raise exception 'Request not found or not authorized' using errcode = '42501'; end if;
  if r.status <> 'Assigned' then raise exception 'Invalid status transition: start requires Assigned'; end if;
  update public.waste_requests set status = 'In Progress' where id = p_request;
end $$;
create function public.complete_collection(p_request uuid, p_payload jsonb) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare actor uuid := public.require_role('collector'); r public.waste_requests; path text := p_payload->>'proof_image_path';
begin
  select * into r from public.waste_requests where id = p_request for update;
  if not found or not exists(select 1 from public.assignments where request_id = p_request and collector_id = actor and status = 'active') then raise exception 'Request not found or not authorized' using errcode = '42501'; end if;
  if r.status <> 'In Progress' then raise exception 'Invalid status transition: confirmation requires In Progress'; end if;
  if coalesce((p_payload->>'confirmed')::boolean,false) is not true then raise exception 'Explicit physical collection confirmation is required'; end if;
  if r.waste_category = 'E-waste & hazardous' and (p_payload->>'destination_type') is distinct from 'authorized_hazardous' then raise exception 'Hazardous waste requires an authorized handling destination'; end if;
  if not public.owns_image_path(path,p_request) then raise exception 'Invalid or unauthorized image path'; end if;
  insert into public.collections(request_id,collector_id,proof_image_path,notes,destination_type,destination_name,destination_status)
  values(p_request,actor,path,btrim(coalesce(p_payload->>'notes','')),p_payload->>'destination_type',btrim(p_payload->>'destination_name'),p_payload->>'destination_status');
  update public.assignments set status = 'completed' where request_id = p_request and status = 'active';
  update public.waste_requests set status = 'Collected' where id = p_request;
end $$;
create function public.close_request(p_request uuid, p_status text, p_reason text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare actor uuid := public.my_profile_id(); r public.waste_requests;
begin
  select * into r from public.waste_requests where id = p_request for update;
  if auth.uid() is null or not found or not (public.my_role() = 'admin' or (public.my_role() = 'resident' and r.resident_id = actor and r.status = 'Pending' and p_status = 'Cancelled')) then raise exception 'Not authorized' using errcode = '42501'; end if;
  if p_status not in ('Cancelled','Rejected') then raise exception 'Invalid closing status'; end if;
  if not ((r.status = 'Pending' and p_status in ('Cancelled','Rejected')) or (r.status = 'Assigned' and p_status in ('Cancelled','Rejected')) or (r.status = 'In Progress' and p_status = 'Rejected')) then raise exception 'Invalid status transition: request cannot be closed from %', r.status; end if;
  if p_reason is null or length(btrim(p_reason)) not between 5 and 500 then raise exception 'Provide a reason (5–500 characters)'; end if;
  perform set_config('ecosort.close_reason',btrim(p_reason),true);
  update public.waste_requests set status = p_status where id = p_request;
  update public.assignments set status = 'cancelled' where request_id = p_request and status = 'active';
end $$;
create function public.update_my_profile(p_name text,p_phone text,p_ward text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare result public.profiles;
begin
  if auth.uid() is null then raise exception 'Not authorized' using errcode = '42501'; end if;
  update public.profiles set name = btrim(p_name), phone = btrim(p_phone), ward = btrim(p_ward) where auth_user_id = auth.uid() returning * into result;
  if not found then raise exception 'Profile not found'; end if;
  return to_jsonb(result);
end $$;

alter table public.profiles enable row level security;
alter table public.waste_requests enable row level security;
alter table public.assignments enable row level security;
alter table public.collections enable row level security;
alter table public.request_status_history enable row level security;
create policy profiles_read on public.profiles for select to authenticated using (
  auth_user_id = auth.uid() or public.my_role() = 'admin' or (
    public.my_role() = 'resident' and role = 'collector' and exists (
      select 1 from public.assignments a join public.waste_requests r on r.id = a.request_id
      where a.collector_id = profiles.id and r.resident_id = public.my_profile_id() and a.status in ('active','completed')
    )
  )
);
create policy requests_read on public.waste_requests for select to authenticated using(public.can_read_request(id));
create policy assignments_read on public.assignments for select to authenticated using(public.can_read_request(request_id));
create policy collections_read on public.collections for select to authenticated using(public.can_read_request(request_id));
create policy history_read on public.request_status_history for select to authenticated using(public.can_read_request(request_id));

-- Typed views preserve a distinct database contract for the two journeys.
create view public.household_pickups with (security_invoker = true) as select * from public.waste_requests where request_type = 'pickup';
create view public.dumping_reports with (security_invoker = true) as select * from public.waste_requests where request_type = 'dumping';

-- Invoker security preserves every RLS policy. One statement supplies a
-- consistent snapshot without silently truncating any relation to 1,000 rows.
create function public.workspace_snapshot() returns jsonb language plpgsql stable security invoker set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'Not authorized' using errcode = '42501'; end if;
  return jsonb_build_object(
    'profiles',coalesce((select jsonb_agg(p) from public.profiles p),'[]'::jsonb),
    'requests',coalesce((select jsonb_agg(r order by r.created_at desc) from public.waste_requests r),'[]'::jsonb),
    'assignments',coalesce((select jsonb_agg(a) from public.assignments a),'[]'::jsonb),
    'collections',coalesce((select jsonb_agg(c) from public.collections c),'[]'::jsonb),
    'history',coalesce((select jsonb_agg(h order by h.changed_at) from public.request_status_history h),'[]'::jsonb)
  );
end $$;
revoke all on function public.workspace_snapshot() from public, anon, authenticated;
grant execute on function public.workspace_snapshot() to authenticated;

revoke all on public.profiles, public.waste_requests, public.assignments, public.collections, public.request_status_history, public.household_pickups, public.dumping_reports from anon, authenticated;
grant select on public.profiles, public.waste_requests, public.assignments, public.collections, public.request_status_history, public.household_pickups, public.dumping_reports to authenticated;
revoke all on function public.my_profile_id(), public.my_role(), public.require_role(text), public.can_read_request(uuid), public.owns_image_path(text,uuid), public.handle_new_user(), public.audit_request(), public.touch_request(), public.create_request(uuid,jsonb), public.assign_request(uuid,uuid), public.start_collection(uuid), public.complete_collection(uuid,jsonb), public.close_request(uuid,text,text), public.update_my_profile(text,text,text) from public, anon, authenticated;
grant execute on function public.my_profile_id(), public.my_role(), public.can_read_request(uuid), public.create_request(uuid,jsonb), public.assign_request(uuid,uuid), public.start_collection(uuid), public.complete_collection(uuid,jsonb), public.close_request(uuid,text,text), public.update_my_profile(text,text,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('waste-images','waste-images',false,2097152,array['image/jpeg','image/png','image/webp']);
create policy waste_image_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'waste-images' and (storage.foldername(name))[1] = auth.uid()::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
  and (
    public.my_role() = 'resident' or (
      public.my_role() = 'collector' and exists (select 1 from public.assignments a where a.request_id::text = (storage.foldername(name))[2] and a.collector_id = public.my_profile_id() and a.status = 'active')
    )
  )
);
create policy waste_image_read on storage.objects for select to authenticated using (
  bucket_id = 'waste-images' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists(select 1 from public.waste_requests r where r.image_path = name and public.can_read_request(r.id))
    or exists(select 1 from public.collections c where c.proof_image_path = name and public.can_read_request(c.request_id))
  )
);
-- Only unreferenced uploads can be removed by their uploader (failed RPC cleanup).
-- The reference check must bypass row visibility; a demoted uploader must not
-- delete a still-referenced proof simply because they can no longer read its job.
create function public.image_is_referenced(p_path text) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists(select 1 from public.waste_requests where image_path = p_path)
    or exists(select 1 from public.collections where proof_image_path = p_path)
$$;
revoke all on function public.image_is_referenced(text) from public, anon, authenticated;
grant execute on function public.image_is_referenced(text) to authenticated;
create policy waste_image_cleanup on storage.objects for delete to authenticated using (
  bucket_id = 'waste-images' and (storage.foldername(name))[1] = auth.uid()::text
  and not public.image_is_referenced(name)
);
commit;
