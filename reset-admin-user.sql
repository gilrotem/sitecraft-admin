-- ניקוי ויצירה מחדש של משתמש אדמין
-- הסיסמה הנכונה: #!@#!@G525192Ani

-- שלב 1: מחיקת משתמש קיים
DELETE FROM auth.users WHERE email = 'gpr@gilrotem.com';

-- שלב 2: יצירה מחדש עם הסיסמה הנכונה
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
    crypt('#!@#!@G525192Ani', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    ''
  );
  
  RAISE NOTICE '✅ משתמש נוצר מחדש!';
  RAISE NOTICE 'Email: gpr@gilrotem.com';
  RAISE NOTICE 'Password: #!@#!@G525192Ani';
  RAISE NOTICE 'User ID: %', v_user_id;
END $$;
