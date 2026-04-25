STUDENT_PROFILE_TABLE = {
    "student_id": "INT PRIMARY KEY AUTO_INCREMENT",
    "user_id": "INT UNIQUE NOT NULL (FK -> users)",
    "grade_level": "VARCHAR(100) NULL",
    "school_name": "VARCHAR(255) NULL",
    "education_level": "VARCHAR(100) NULL"
}

STUDENT_POST_TABLE = {
    "post_id": "INT PRIMARY KEY AUTO_INCREMENT",
    "student_id": "INT NOT NULL (FK -> student_profiles)",
    "subject": "VARCHAR(100) NOT NULL",
    "grade_level": "VARCHAR(100) NOT NULL",
    "learning_format": "ENUM('online', 'onsite', 'both') NOT NULL",
    "location": "VARCHAR(255) NOT NULL",
    "preferred_time": "VARCHAR(255) NOT NULL",
    "description": "TEXT NULL",
    "budget": "DOUBLE NOT NULL (CHECK >= 0)",
    "status": "ENUM('open', 'closed') NOT NULL DEFAULT 'open'",
    "created_at": "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "is_hidden": "BOOLEAN NOT NULL DEFAULT FALSE",
    "moderation_reason": "TEXT NULL"
}
