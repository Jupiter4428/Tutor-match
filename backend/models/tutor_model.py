TUTOR_PROFILE_TABLE = {
    "tutor_id": "INT PRIMARY KEY AUTO_INCREMENT",
    "user_id": "INT UNIQUE NOT NULL (FK -> users)",
    "bio": "TEXT NULL",
    "hourly_rate": "DECIMAL(10,2) NOT NULL (CHECK >= 0)",
    "verification_status": "ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending'",
    "profile_picture_url": "VARCHAR(512) NOT NULL",
    "verification_submitted_at": "DATETIME NULL",
    "verified_by": "INT NULL (FK -> users)",
    "verified_at": "DATETIME NULL",
    "reject_reason": "TEXT NULL"
}

# 4NF: separated from tutor_profiles
TUTOR_EXPERIENCE_TABLE = {
    "experience_id": "INT PRIMARY KEY AUTO_INCREMENT",
    "tutor_id": "INT NOT NULL (FK -> tutor_profiles)",
    "experience_detail": "TEXT NOT NULL"
}

# BCNF: composite PK prevents duplicate subjects per tutor
TUTOR_SUBJECT_TABLE = {
    "composite_pk": "(tutor_id, subject)",
    "tutor_id": "INT NOT NULL (FK -> tutor_profiles)",
    "subject": "VARCHAR(100) NOT NULL"
}
