# Connected projects intentionally start empty

Never load local demo people, fabricated locations or fictional jobs into a connected project. The local seed is `src/data/seed.ts` and is used only in demo mode.

## Secure privileged-role provisioning

1. Apply all files in `supabase/migrations/` in filename order to a fresh Supabase project. Existing projects should apply only migrations they have not yet run.
2. Create a user through resident signup (name, phone, ward, email, password). Confirm email if enabled. Alternatively invite the user through the Supabase dashboard, supplying valid name, phone and ward metadata.
3. In the trusted Supabase SQL editor, after independently verifying the intended user, run ONE of these with that user's real UUID:

```sql
update public.profiles set role = 'collector'
where auth_user_id = 'REPLACE_WITH_VERIFIED_AUTH_USER_UUID'::uuid;

-- Provision an administrator separately, only for a trusted operator:
update public.profiles set role = 'admin'
where auth_user_id = 'REPLACE_WITH_VERIFIED_AUTH_USER_UUID'::uuid;
```

There is no browser role-update API, no default admin password and no trust in user-editable role metadata. Sign out and sign back in after provisioning. Never place a service-role key in any `VITE_` variable.

Before demoting or deleting a collector, resolve their active assignments. No operational certification is implied by the software role; operators must independently verify waste-specific training and authorized destinations.
