
INSERT INTO public.custom_domains (account_id, domain, verified, ssl_active, status, verified_at, ssl_activated_at)
VALUES ('2fc5b05f-0ac4-47a0-bbb8-adf0be151204', 'wolf-of-recruiting.de', true, true, 'ssl_active', now(), now())
ON CONFLICT (domain) DO UPDATE SET verified = true, ssl_active = true, status = 'ssl_active';
