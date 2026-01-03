-- Secure API keys with hashing

-- 1. Add token_hash column and token_prefix for display
ALTER TABLE api_keys 
ADD COLUMN IF NOT EXISTS token_hash TEXT,
ADD COLUMN IF NOT EXISTS token_prefix TEXT;

-- 2. For existing tokens, store hash and prefix (we'll regenerate tokens for security)
-- Note: We can't hash existing tokens without knowing them, so we'll keep them temporarily
-- Users should regenerate their API keys for full security

-- 3. Create a function to hash tokens using pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 4. Create a helper function for token validation
CREATE OR REPLACE FUNCTION public.validate_api_key(p_token TEXT)
RETURNS TABLE(user_id UUID, key_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_hash TEXT;
  v_result RECORD;
BEGIN
  -- Hash the provided token
  v_token_hash := encode(digest(p_token, 'sha256'), 'hex');
  
  -- First try to find by hash (new secure method)
  SELECT ak.user_id, ak.id INTO v_result
  FROM api_keys ak
  WHERE ak.token_hash = v_token_hash
    AND ak.active = true;
  
  IF FOUND THEN
    -- Update last_used_at
    UPDATE api_keys SET last_used_at = now() WHERE id = v_result.id;
    RETURN QUERY SELECT v_result.user_id, v_result.id;
    RETURN;
  END IF;
  
  -- Fallback: try legacy plain-text token (for backward compatibility during migration)
  SELECT ak.user_id, ak.id INTO v_result
  FROM api_keys ak
  WHERE ak.token = p_token
    AND ak.active = true;
  
  IF FOUND THEN
    -- Migrate this key to hashed storage
    UPDATE api_keys 
    SET 
      token_hash = encode(digest(p_token, 'sha256'), 'hex'),
      token_prefix = left(p_token, 8) || '...',
      token = NULL -- Clear plaintext token after migration
    WHERE id = v_result.id;
    
    UPDATE api_keys SET last_used_at = now() WHERE id = v_result.id;
    RETURN QUERY SELECT v_result.user_id, v_result.id;
    RETURN;
  END IF;
  
  -- No valid key found
  RETURN;
END;
$$;

-- 5. Migrate existing tokens to hashed format
UPDATE api_keys
SET 
  token_hash = encode(digest(token, 'sha256'), 'hex'),
  token_prefix = left(token, 8) || '...'
WHERE token IS NOT NULL 
  AND token_hash IS NULL;

-- 6. Now clear plaintext tokens (after hash migration)
UPDATE api_keys
SET token = NULL
WHERE token_hash IS NOT NULL;

-- 7. Make token_hash required for new keys and token optional (legacy)
ALTER TABLE api_keys 
ALTER COLUMN token DROP NOT NULL;