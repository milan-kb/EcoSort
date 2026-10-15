// Real embedded PostgreSQL, with minimal Supabase auth/storage schema stand-ins.
// This verifies SQL/RLS/RPC behavior, NOT the hosted Auth or Storage HTTP services.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
await db.exec(`
  create role anon;
  create role authenticated;
  create schema auth;
  create schema storage;
  create table auth.users(id uuid primary key, raw_user_meta_data jsonb not null default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
  create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text not null,unique(bucket_id,name));
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name,'/') $$;
  alter table storage.objects enable row level security;
  grant usage on schema public,auth,storage to anon,authenticated;
  grant execute on function auth.uid(),storage.foldername(text) to anon,authenticated;
  grant select,insert,delete on storage.objects to authenticated;
`);
const migrations = new URL('../../supabase/migrations/', import.meta.url);
for (const file of (await readdir(migrations)).filter((name) => name.endsWith('.sql')).sort()) {
  await db.exec(await readFile(new URL(file, migrations), 'utf8'));
}
const resident = '00000000-0000-4000-8000-000000000001';
const other = '00000000-0000-4000-8000-000000000002';
const collector = '00000000-0000-4000-8000-000000000003';
const collector2 = '00000000-0000-4000-8000-000000000004';
const admin = '00000000-0000-4000-8000-000000000005';
const request = '10000000-0000-4000-8000-000000000001';
const request2 = '10000000-0000-4000-8000-000000000002';
const request3 = '10000000-0000-4000-8000-000000000003';
for (const [i, id] of [resident, other, collector, collector2, admin].entries()) {
  await db.query('insert into auth.users(id,raw_user_meta_data) values ($1,$2)', [
    id,
    JSON.stringify({
      name: `Test person ${i}`,
      phone: '9999900000',
      ward: 'Ward 1',
      role: 'admin',
    }),
  ]);
}
assert.equal(
  (await db.query('select role from public.profiles where id=$1', [resident])).rows[0].role,
  'resident',
);
await db.query("update public.profiles set role='collector' where id=any($1::uuid[])", [
  [collector, collector2],
]);
await db.query("update public.profiles set role='admin' where id=$1", [admin]);

async function asUser(id) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec('set role authenticated');
}
const scalar = async (sql, params = []) => Object.values((await db.query(sql, params)).rows[0])[0];
const denied = (sql, params = []) => assert.rejects(() => db.query(sql, params));
const payload = {
  request_type: 'pickup',
  waste_category: 'Plastic',
  quantity: '2 bags',
  ward: 'Ward 1',
  address: 'Fictional test address',
  latitude: null,
  longitude: null,
  description: '',
  image_path: null,
  preferred_date: null,
  is_segregated: true,
  status: 'Collected',
  resident_id: other,
};
const destination = {
  confirmed: true,
  notes: 'SQL workflow check',
  destination_name: 'Synthetic sorting point',
  destination_type: 'sorting',
  destination_status: 'intended',
  proof_image_path: null,
};
let checks = 0;
async function check(label, fn) {
  await fn();
  checks++;
  console.log(`PASS ${label}`);
}

await check('resident signup ignores privileged user metadata', async () => {
  await asUser(resident);
  assert.equal(await scalar('select public.my_role()'), 'resident');
});
await check(
  'resident creation owns actor, starts Pending, audits, and rejects invalid fields',
  async () => {
    await db.query('select public.create_request($1,$2)', [request, payload]);
    assert.equal(
      await scalar('select status from public.waste_requests where id=$1', [request]),
      'Pending',
    );
    assert.equal(
      await scalar('select resident_id from public.waste_requests where id=$1', [request]),
      resident,
    );
    assert.equal(await scalar('select count(*)::int from public.request_status_history'), 1);
    await denied('select public.create_request($1,$2)', [
      request2,
      { ...payload, address: '', is_segregated: false },
    ]);
  },
);
await check('direct writes, profile role escalation and forged history are denied', async () => {
  await denied('select public.update_my_profile($1,$2,$3)', [
    'Resident renamed',
    '-------',
    'Ward 2',
  ]);
  await denied("update public.profiles set role='admin' where id=$1", [resident]);
  await denied("update public.waste_requests set status='Collected' where id=$1", [request]);
  await denied(
    "insert into public.request_status_history(request_id,new_status) values($1,'Collected')",
    [request],
  );
  await denied('select public.assign_request($1,$2)', [request, collector]);
  const updated = await scalar('select public.update_my_profile($1,$2,$3)', [
    'Resident renamed',
    '9999900000',
    'Ward 2',
  ]);
  assert.equal(updated.id, resident);
  assert.equal(updated.role, 'resident');
  assert.equal(updated.name, 'Resident renamed');
});
await check(
  'other residents and unassigned collectors cannot read or mutate private requests',
  async () => {
    await asUser(other);
    assert.equal(await scalar('select count(*)::int from public.waste_requests'), 0);
    await denied('select public.close_request($1,$2,$3)', [request, 'Cancelled', 'Not my request']);
    await asUser(collector);
    assert.equal(await scalar('select count(*)::int from public.waste_requests'), 0);
    await denied('select public.start_collection($1)', [request]);
    await denied('select public.create_request($1,$2)', [request2, payload]);
  },
);
await check('administrator assigns only an authorized collector', async () => {
  await asUser(admin);
  await denied('select public.assign_request($1,$2)', [request, resident]);
  await db.query('select public.assign_request($1,$2)', [request, collector]);
  assert.equal(
    await scalar("select count(*)::int from public.assignments where status='active'"),
    1,
  );
});
await check(
  'collector sees own assigned job but not resident profiles or another collector jobs',
  async () => {
    await asUser(collector2);
    assert.equal(await scalar('select count(*)::int from public.waste_requests'), 0);
    await denied('select public.start_collection($1)', [request]);
    await asUser(collector);
    assert.equal(await scalar('select count(*)::int from public.waste_requests'), 1);
    assert.equal(await scalar('select count(*)::int from public.profiles'), 1);
  },
);
await check('invalid transitions are rejected before changing records', async () => {
  await denied('select public.complete_collection($1,$2)', [request, destination]);
  assert.equal(
    await scalar('select status from public.waste_requests where id=$1', [request]),
    'Assigned',
  );
  await db.query('select public.start_collection($1)', [request]);
  await denied('select public.start_collection($1)', [request]);
  await asUser(admin);
  await denied('select public.assign_request($1,$2)', [request, collector2]);
});
await check('unconfirmed and invalid destination updates roll back atomically', async () => {
  await asUser(collector);
  await denied('select public.complete_collection($1,$2)', [
    request,
    { ...destination, confirmed: false },
  ]);
  await denied('select public.complete_collection($1,$2)', [
    request,
    { ...destination, destination_name: '' },
  ]);
  assert.equal(await scalar('select count(*)::int from public.collections'), 0);
  assert.equal(
    await scalar('select status from public.waste_requests where id=$1', [request]),
    'In Progress',
  );
});
await check(
  'collection creates destination, completes assignment, history and resident visibility',
  async () => {
    await db.query('select public.complete_collection($1,$2)', [request, destination]);
    await denied('select public.complete_collection($1,$2)', [request, destination]);
    await asUser(resident);
    assert.equal(
      await scalar('select status from public.waste_requests where id=$1', [request]),
      'Collected',
    );
    assert.equal(
      await scalar('select destination_status from public.collections where request_id=$1', [
        request,
      ]),
      'intended',
    );
    assert.equal(
      await scalar('select count(*)::int from public.request_status_history where request_id=$1', [
        request,
      ]),
      4,
    );
    assert.equal(
      await scalar('select status from public.assignments where request_id=$1', [request]),
      'completed',
    );
    const snapshot = await scalar('select public.workspace_snapshot()');
    assert.equal(snapshot.requests.length, 1);
    assert.equal(snapshot.collections[0].destination_status, 'intended');
    await asUser(admin);
    await denied('select public.close_request($1,$2,$3)', [
      request,
      'Rejected',
      'Cannot rewrite a collection',
    ]);
  },
);
await check('reassignment revokes the old collector and preserves assignment history', async () => {
  await asUser(resident);
  await db.query('select public.create_request($1,$2)', [request2, payload]);
  await asUser(admin);
  await db.query('select public.assign_request($1,$2)', [request2, collector]);
  await db.query('select public.assign_request($1,$2)', [request2, collector2]);
  assert.equal(
    await scalar(
      "select count(*)::int from public.assignments where request_id=$1 and status='replaced'",
      [request2],
    ),
    1,
  );
  await asUser(collector);
  assert.equal(
    await scalar('select count(*)::int from public.waste_requests where id=$1', [request2]),
    0,
  );
  await asUser(collector2);
  assert.equal(
    await scalar('select count(*)::int from public.waste_requests where id=$1', [request2]),
    1,
  );
});
await check('closure requires reason, ownership and a legal state transition', async () => {
  await asUser(resident);
  await denied('select public.close_request($1,$2,$3)', [
    request2,
    'Cancelled',
    'Already assigned',
  ]);
  await db.query('select public.create_request($1,$2)', [request3, payload]);
  await denied('select public.close_request($1,$2,$3)', [request3, 'Cancelled', '']);
  await db.query('select public.close_request($1,$2,$3)', [
    request3,
    'Cancelled',
    'No longer needed',
  ]);
  await asUser(admin);
  await denied('select public.close_request($1,$2,$3)', [request3, 'Cancelled', 'Already closed']);
  await db.query('select public.close_request($1,$2,$3)', [
    request2,
    'Rejected',
    'Synthetic capacity limit',
  ]);
});
await check('private image paths cannot be attached across residents or requests', async () => {
  const imageRequest = '20000000-0000-4000-8000-000000000001';
  const path = `${resident}/${imageRequest}/30000000-0000-4000-8000-000000000001.png`;
  await asUser(other);
  await denied('insert into storage.objects(bucket_id,name) values($1,$2)', ['waste-images', path]);
  await asUser(resident);
  await db.query('insert into storage.objects(bucket_id,name) values($1,$2)', [
    'waste-images',
    path,
  ]);
  await db.query('select public.create_request($1,$2)', [
    imageRequest,
    { ...payload, image_path: path },
  ]);
  await asUser(other);
  assert.equal(await scalar('select count(*)::int from storage.objects where name=$1', [path]), 0);
  await denied('select public.create_request($1,$2)', [
    '20000000-0000-4000-8000-000000000002',
    { ...payload, image_path: path },
  ]);
  await asUser(admin);
  await db.query('select public.assign_request($1,$2)', [imageRequest, collector]);
  await asUser(collector);
  assert.equal(await scalar('select count(*)::int from storage.objects where name=$1', [path]), 1);
  await asUser(admin);
  await db.query('select public.assign_request($1,$2)', [imageRequest, collector2]);
  await asUser(collector);
  assert.equal(await scalar('select count(*)::int from storage.objects where name=$1', [path]), 0);
});
await check(
  'hazardous collection requires an authorized destination and confirmed physical collection',
  async () => {
    const id = '50000000-0000-4000-8000-000000000001';
    await asUser(resident);
    await db.query('select public.create_request($1,$2)', [
      id,
      { ...payload, waste_category: 'E-waste & hazardous' },
    ]);
    await asUser(admin);
    await db.query('select public.assign_request($1,$2)', [id, collector]);
    await asUser(collector);
    await db.query('select public.start_collection($1)', [id]);
    await denied('select public.complete_collection($1,$2)', [id, destination]);
    assert.equal(
      await scalar('select status from public.waste_requests where id=$1', [id]),
      'In Progress',
    );
    await db.query('select public.complete_collection($1,$2)', [
      id,
      { ...destination, destination_type: 'authorized_hazardous' },
    ]);
  },
);
await check('referenced proof survives uploader demotion and an attempted delete', async () => {
  const id = '60000000-0000-4000-8000-000000000001';
  const path = `${collector}/${id}/70000000-0000-4000-8000-000000000001.png`;
  await asUser(resident);
  await db.query('select public.create_request($1,$2)', [id, payload]);
  await asUser(admin);
  await db.query('select public.assign_request($1,$2)', [id, collector]);
  await asUser(collector);
  await db.query('select public.start_collection($1)', [id]);
  await db.query('insert into storage.objects(bucket_id,name) values($1,$2)', [
    'waste-images',
    path,
  ]);
  await db.query('select public.complete_collection($1,$2)', [
    id,
    { ...destination, proof_image_path: path },
  ]);
  await db.exec('reset role');
  await db.query("update public.profiles set role='resident' where id=$1", [collector]);
  await asUser(collector);
  assert.equal(
    await scalar('select count(*)::int from public.collections where request_id=$1', [id]),
    0,
  );
  await db.query('delete from storage.objects where name=$1', [path]);
  assert.equal(await scalar('select count(*)::int from storage.objects where name=$1', [path]), 1);
});
await check(
  'authenticated identity without a profile cannot close someone else’s request',
  async () => {
    await db.exec('reset role');
    await db.query('delete from public.profiles where id=$1', [other]);
    await asUser(other);
    await denied('select public.close_request($1,$2,$3)', [
      '20000000-0000-4000-8000-000000000001',
      'Rejected',
      'Unauthorized missing-profile attempt',
    ]);
  },
);
await check('anonymous users have neither table access nor mutation RPCs', async () => {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub','',false)");
  await db.exec('set role anon');
  await denied('select * from public.waste_requests');
  await denied('select public.create_request($1,$2)', [
    '40000000-0000-4000-8000-000000000001',
    payload,
  ]);
});
console.log(
  `\n${checks} SQL checks passed (embedded PostgreSQL; hosted Supabase integration still requires credentials).`,
);
await db.close();
