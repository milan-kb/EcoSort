-- Validate meaningful phone content as well as allowed formatting characters.
-- NOT VALID preserves pre-existing profiles until their owners correct them;
-- PostgreSQL still enforces this constraint on new or updated rows.
alter table public.profiles add constraint phone_has_digits
  check (length(regexp_replace(phone, '[^0-9]', '', 'g')) >= 7) not valid;
