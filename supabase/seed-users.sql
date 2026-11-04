-- Local test users. Loaded by `supabase db reset` after seed.sql (see [db.seed] in config.toml).
-- LOCAL ONLY: never run this against the hosted project.
--
--   admin@test.com / admin     -> app_metadata.role = "admin"
--   user@test.com  / user      -> regular user
--
-- Email/password sign-in works locally; Google sign-in needs provider credentials in
-- [auth.external.google] of config.toml, which are not set up for local.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
values
  (
    '00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000001',
    'authenticated', 'authenticated', 'admin@test.com',
    extensions.crypt('admin', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"],"role":"admin"}', '{}', now(), now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000002',
    'authenticated', 'authenticated', 'user@test.com',
    extensions.crypt('user', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(),
    '', '', '', '', '', '', '', ''
  )
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       now(), now(), now()
from auth.users u
where u.id in ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002')
on conflict (provider_id, provider) do nothing;

-- handle_new_user() normally creates these, but seeds may run with triggers disabled.
insert into public.user_preferences (user_id, user_email, email_notifications_enabled)
select u.id, u.email, true
from auth.users u
where u.id in ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002')
on conflict (user_id) do nothing;
