begin;

create or replace function public.register_user_with_password(p_email text, p_password text)
returns table (user_id uuid, email text)
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid := gen_random_uuid();
  v_email text := lower(trim(p_email));
begin
  if v_email is null or v_email = '' then
    raise exception 'email_required';
  end if;

  if p_password is null or char_length(p_password) < 6 then
    raise exception 'weak_password';
  end if;

  if exists (
    select 1
    from auth.users u
    where lower(u.email) = v_email
      and u.deleted_at is null
  ) then
    raise exception 'email_exists';
  end if;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    phone_change,
    phone_change_token,
    reauthentication_token,
    raw_app_meta_data,
    raw_user_meta_data,
    is_sso_user,
    is_anonymous,
    created_at,
    updated_at
  )
  values (
    '00000000-0000-0000-0000-000000000000'::uuid,
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'email', v_email,
      'email_verified', true,
      'phone_verified', false,
      'sub', v_user_id::text
    ),
    false,
    false,
    now(),
    now()
  );

  insert into auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    created_at,
    updated_at
  )
  values (
    gen_random_uuid(),
    v_user_id::text,
    v_user_id,
    jsonb_build_object(
      'email', v_email,
      'email_verified', true,
      'phone_verified', false,
      'sub', v_user_id::text
    ),
    'email',
    now(),
    now()
  );

  user_id := v_user_id;
  email := v_email;
  return next;
end;
$$;

revoke all on function public.register_user_with_password(text, text) from public;
grant execute on function public.register_user_with_password(text, text) to anon, authenticated;

commit;
