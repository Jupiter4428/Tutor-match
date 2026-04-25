REPORT_TABLE = {
    "report_id": "INT PRIMARY KEY AUTO_INCREMENT",
    "reporter_id": "INT NOT NULL (FK -> users)",
    "target_type": "ENUM('user', 'post', 'review', 'other') NOT NULL",
    "target_id": "INT NULL",
    "title": "VARCHAR(255) NOT NULL",
    "description": "TEXT NOT NULL",
    "status": "ENUM('pending', 'investigating', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending'",
    "created_at": "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"
}
