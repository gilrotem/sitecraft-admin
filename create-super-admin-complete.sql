-- ============================================
-- COMPLETE SUPER ADMIN CREATION SCRIPT
-- ============================================
-- Email: gpr@gilrotem.com
-- Password: SuperAdmin2025!
-- 
-- This script is idempotent and safe to run multiple times
-- Execute in Supabase SQL Editor
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Main script
DO $$
DECLARE
  new_user_id UUID;
  user_exists BOOLEAN;
  profiles_exists BOOLEAN;
  user_roles_exists BOOLEAN;
BEGIN
  -- Check if user already exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'gpr@gilrotem.com'
  ) INTO user_exists;
  
  IF user_exists THEN
    RAISE NOTICE '❌ User already exists with email: gpr@gilrotem.com';
    
    -- Get existing user ID for later steps
    SELECT id INTO new_user_id 
    FROM auth.users 
    WHERE email = 'gpr@gilrotem.com';
    
  ELSE
    -- Generate new UUID
    new_user_id := gen_random_uuid();
    
    RAISE NOTICE '✅ Creating new user with ID: %', new_user_id;
    
    -- Insert into auth.users with all required fields
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'gpr@gilrotem.com',
      crypt('SuperAdmin2025!', gen_salt('bf')),  -- bcrypt hash
      NOW(),  -- email already confirmed
      NULL,
      NULL,
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Gil Rotem - Super Admin"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
    
    RAISE NOTICE '✅ User created in auth.users';
  END IF;
  
  -- Check if public.profiles table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) INTO profiles_exists;
  
  IF profiles_exists THEN
    -- Insert into profiles if not exists
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
      new_user_id,
      'Gil Rotem - Super Admin',
      NULL
    )
    ON CONFLICT (id) DO UPDATE 
    SET full_name = 'Gil Rotem - Super Admin';
    
    RAISE NOTICE '✅ Profile created/updated in public.profiles';
  ELSE
    RAISE NOTICE '⚠️  public.profiles table does not exist - skipped';
  END IF;
  
  -- Check if public.user_roles table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
  ) INTO user_roles_exists;
  
  IF user_roles_exists THEN
    -- Insert super_admin role if not exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
      new_user_id,
      'super_admin'
    )
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE '✅ Super admin role assigned in public.user_roles';
  ELSE
    RAISE NOTICE '⚠️  public.user_roles table does not exist - skipped';
  END IF;
  
  -- Final success message
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ SUPER ADMIN SETUP COMPLETE';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Email: gpr@gilrotem.com';
  RAISE NOTICE 'Password: SuperAdmin2025!';
  RAISE NOTICE 'User ID: %', new_user_id;
  RAISE NOTICE '';
  RAISE NOTICE 'You can now login at:';
  RAISE NOTICE 'https://sitecraft-admin.onrender.com';
  RAISE NOTICE '====================================';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '';
    RAISE NOTICE '❌ ERROR OCCURRED:';
    RAISE NOTICE 'Error message: %', SQLERRM;
    RAISE NOTICE 'Error detail: %', SQLSTATE;
    RAISE NOTICE '';
END $$;

-- Verify the user was created
DO $$
DECLARE
  user_count INTEGER;
  user_info RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'VERIFICATION';
  RAISE NOTICE '====================================';
  
  -- Check auth.users
  SELECT COUNT(*) INTO user_count 
  FROM auth.users 
  WHERE email = 'gpr@gilrotem.com';
  
  IF user_count > 0 THEN
    SELECT id, email, email_confirmed_at, created_at 
    INTO user_info
    FROM auth.users 
    WHERE email = 'gpr@gilrotem.com';
    
    RAISE NOTICE '✅ User found in auth.users';
    RAISE NOTICE '   ID: %', user_info.id;
    RAISE NOTICE '   Email: %', user_info.email;
    RAISE NOTICE '   Confirmed: %', user_info.email_confirmed_at IS NOT NULL;
    RAISE NOTICE '   Created: %', user_info.created_at;
  ELSE
    RAISE NOTICE '❌ User NOT found in auth.users';
  END IF;
  
  RAISE NOTICE '====================================';
END $$;
