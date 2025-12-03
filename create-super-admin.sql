-- ============================================
-- Create Super Admin User
-- ============================================
-- Email: gpr@gilrotem.com
-- Password: #!@#!@G525192Ani
-- Role: super_admin
-- 
-- Execute this in Supabase SQL Editor
-- ============================================

-- Step 1: Insert user into auth.users
-- Note: Supabase handles password hashing automatically via auth.users
-- We'll use a different approach - create via auth API or manually set encrypted password

DO $$
DECLARE
  new_user_id UUID;
  encrypted_password TEXT;
BEGIN
  -- Generate a UUID for the new user
  new_user_id := gen_random_uuid();
  
  -- Hash the password using crypt
  -- Password: #!@#!@G525192Ani
  encrypted_password := crypt('#!@#!@G525192Ani', gen_salt('bf'));
  
  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'gpr@gilrotem.com',
    encrypted_password,
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider":"email","providers":["email"]}',
    '{}',
    NULL,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    false,
    NULL
  )
  ON CONFLICT (email) DO NOTHING;
  
  -- Step 2: Create profile in public.profiles
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new_user_id,
    'Gil Rotem - Super Admin',
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Step 3: Assign super_admin role in public.user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new_user_id,
    'super_admin'
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Output success message
  RAISE NOTICE 'Super admin user created successfully!';
  RAISE NOTICE 'User ID: %', new_user_id;
  RAISE NOTICE 'Email: gpr@gilrotem.com';
  RAISE NOTICE 'You can now login with the provided credentials.';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating user: %', SQLERRM;
END $$;

-- ============================================
-- ALTERNATIVE METHOD (RECOMMENDED)
-- ============================================
-- If the above doesn't work due to auth schema restrictions,
-- use this simpler approach:
-- 
-- 1. Sign up normally through your app at:
--    https://sitecraft-admin.onrender.com
--    Email: gpr@gilrotem.com
--    Password: #!@#!@6525192Ani
-- 
-- 2. Then run this SQL to promote to super_admin:

/*
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Find the user by email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'gpr@gilrotem.com'
  LIMIT 1;
  
  -- If user exists, assign super_admin role
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Super admin role assigned to user: %', admin_user_id;
  ELSE
    RAISE NOTICE 'User not found. Please sign up first.';
  END IF;
END $$;
*/
