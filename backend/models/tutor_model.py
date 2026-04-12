# ตารางโปรไฟล์ติวเตอร์ [cite: 432]
TUTOR_PROFILE_TABLE = {
    "tutor_id": "INT PRIMARY KEY AUTO_INCREMENT",
    "user_id": "INT UNIQUE (FK -> User)",
    "bio": "TEXT",
    "verification_status": "ENUM('pending', 'verified', 'rejected') DEFAULT 'pending'",
    "hourly_rate": "DECIMAL(10,2) (CHECK > 0)" # จุดที่เคยติด Error [cite: 433]
}

# ตารางประสบการณ์สอน (4NF) [cite: 422, 435]
TUTOR_EXPERIENCE_TABLE = {
    "experience_id": "INT PRIMARY KEY AUTO_INCREMENT",
    "tutor_id": "INT (FK -> Tutor_Profile)",
    "experience_detail": "TEXT NOT NULL"
}

# ตารางวิชาที่สอน (BCNF) [cite: 402, 437]
TUTOR_SUBJECT_TABLE = {
    "tutor_id": "INT (FK -> Tutor_Profile)",
    "subject": "VARCHAR(100)",
    "composite_pk": "(tutor_id, subject)"
}