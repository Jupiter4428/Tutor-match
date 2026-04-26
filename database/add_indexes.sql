-- =========================================================
-- Performance Indexes — Tutor Match System
-- รัน 1 ครั้งหลัง schema.sql เพื่อเพิ่ม index บน columns
-- ที่ถูก filter/sort บ่อย (ลด full table scan)
-- =========================================================

USE tutor_match;

-- ---- student_posts ----------------------------------------
-- WHERE status = 'open' AND is_hidden = FALSE (ใช้ทุกหน้า)
ALTER TABLE student_posts
    ADD INDEX idx_posts_status_hidden (status, is_hidden);

-- ---- tutor_profiles ----------------------------------------
-- WHERE verification_status = 'verified' (tutor list, dashboard)
ALTER TABLE tutor_profiles
    ADD INDEX idx_tutor_verification (verification_status);

-- ---- users -------------------------------------------------
-- WHERE account_status = 'active' (tutor list + auth middleware)
ALTER TABLE users
    ADD INDEX idx_users_account_status (account_status);

-- ---- applications ------------------------------------------
-- WHERE tutor_id = ? AND status = 'accepted' (schedule, dashboard)
ALTER TABLE applications
    ADD INDEX idx_app_tutor_status (tutor_id, status);

-- WHERE post_id = ? (student ดูผู้สมัครต่อโพสต์)
ALTER TABLE applications
    ADD INDEX idx_app_post (post_id);

-- ---- reviews -----------------------------------------------
-- WHERE is_hidden = FALSE (tutor list avg rating)
ALTER TABLE reviews
    ADD INDEX idx_reviews_hidden (is_hidden);

-- ---- transaction_logs --------------------------------------
-- WHERE wallet_id = ? ORDER BY transaction_date DESC
ALTER TABLE transaction_logs
    ADD INDEX idx_txn_wallet_date (wallet_id, transaction_date DESC);

-- ---- wallets -----------------------------------------------
-- WHERE user_id = ? (ทุก wallet lookup)
-- NOTE: user_id มี UNIQUE constraint แล้ว → มี index อยู่แล้ว (ไม่ต้องเพิ่ม)

-- ---- reports -----------------------------------------------
-- WHERE status = 'pending' (admin dashboard)
ALTER TABLE reports
    ADD INDEX idx_reports_status (status);
