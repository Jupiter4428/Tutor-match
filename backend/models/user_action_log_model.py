USER_ACTION_LOG_TABLE = {
    "log_id": "INT PRIMARY KEY AUTO_INCREMENT",
    "user_id": "INT NULL (FK -> users)",
    "action_type": "VARCHAR(100) NOT NULL",
    "target_type": "ENUM('user', 'tutor_profile', 'post', 'review', 'payment') NOT NULL",
    "target_id": "INT NOT NULL",
    "reason": "TEXT NULL",
    "performed_by": "INT NOT NULL (FK -> users, ON DELETE RESTRICT)",
    "created_at": "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"
}
