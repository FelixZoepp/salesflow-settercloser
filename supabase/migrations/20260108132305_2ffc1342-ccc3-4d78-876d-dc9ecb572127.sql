-- Make account_id nullable in invitations table since users create their own accounts
ALTER TABLE public.invitations ALTER COLUMN account_id DROP NOT NULL;