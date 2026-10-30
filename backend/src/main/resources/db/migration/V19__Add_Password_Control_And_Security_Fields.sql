-- ====================================================================
-- V19: Add Password Control, Security Audit & Account Lock Fields
-- ====================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_changed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_source VARCHAR(50) DEFAULT 'USER_SELF';
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token_expiry TIMESTAMP WITH TIME ZONE;

-- Initialize last_password_changed_at with created_at for existing users
UPDATE users SET last_password_changed_at = created_at WHERE last_password_changed_at IS NULL;

