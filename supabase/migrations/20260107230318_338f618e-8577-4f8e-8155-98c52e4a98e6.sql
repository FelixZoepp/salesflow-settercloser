-- Drop the old auto_create_deal trigger that was creating deals on contact insert
DROP TRIGGER IF EXISTS trigger_auto_create_deal_for_contact ON contacts;
DROP FUNCTION IF EXISTS auto_create_deal_for_contact() CASCADE;