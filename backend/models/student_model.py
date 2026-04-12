# ตารางโปรไฟล์นักเรียน [cite: 430]
STUDENT_PROFILE_TABLE = {
    "student_id": "INT PRIMARY KEY AUTO_INCREMENT",
    "user_id": "INT UNIQUE (FK -> User)",
    "grade_level": "VARCHAR(50)",
    "school_name": "VARCHAR(100)"
}

# ตารางโพสต์ประกาศหาติวเตอร์ [cite: 441]
STUDENT_POST_TABLE = {
    "post_id": "INT PRIMARY KEY AUTO_INCREMENT",
    "student_id": "INT (FK -> Student_Profile)",
    "subject": "VARCHAR(100) NOT NULL",
    "description": "TEXT",
    "budget": "DECIMAL(10,2) (CHECK > 0)",
    "status": "ENUM('open', 'closed') DEFAULT 'open'",
    "created_at": "DATETIME DEFAULT NOW()"
}