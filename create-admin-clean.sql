-- יצירת משתמש אדמין - רק auth.users
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    'gpr@gilrotem.com',
    crypt('SuperAdmin2025!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    ''
  );
  
  RAISE NOTICE 'משתמש נוצר בהצלחה!';
  RAISE NOTICE 'Email: gpr@gilrotem.com';
  RAISE NOTICE 'Password: SuperAdmin2025!';
END $$;
