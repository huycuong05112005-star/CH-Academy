-- ====================================================================
-- V21: Create Notification Reads Table for Per-User Read Tracking
-- ====================================================================

CREATE TABLE IF NOT EXISTS notification_reads (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_id BIGINT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_notification_read UNIQUE (user_id, notification_id)
);

CREATE INDEX IF NOT EXISTS idx_notif_reads_user ON notification_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_reads_notif ON notification_reads(notification_id);

