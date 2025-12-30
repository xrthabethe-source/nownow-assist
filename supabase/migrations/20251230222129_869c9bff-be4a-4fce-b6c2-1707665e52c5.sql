-- Update the handle_new_user function to respect the account_type from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  account_type text;
  user_role app_role;
BEGIN
  -- Get the account type from user metadata, default to 'customer'
  account_type := COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'customer');
  
  -- Map account type to role
  IF account_type = 'driver' THEN
    user_role := 'driver';
  ELSE
    user_role := 'customer';
  END IF;
  
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  -- Assign role based on account type
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;