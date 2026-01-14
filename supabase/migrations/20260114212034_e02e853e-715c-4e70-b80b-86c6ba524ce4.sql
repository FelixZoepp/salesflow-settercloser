-- Temporarily disable the trigger to allow account reassignment
ALTER TABLE public.profiles DISABLE TRIGGER prevent_privilege_escalation_trigger;

-- Update felix-zoepp@gmx.de profile to use the new separate account
UPDATE profiles 
SET account_id = '58ec4992-3ddd-449d-b08a-754c0af55113'
WHERE email = 'felix-zoepp@gmx.de';

-- Re-enable the trigger
ALTER TABLE public.profiles ENABLE TRIGGER prevent_privilege_escalation_trigger;