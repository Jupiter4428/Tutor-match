# นิยามตาราง User สำหรับจัดการข้อมูลบัญชีหลัก [cite: 427]
USERs_TABLE = {
    "user_id": "INT PRIMARY KEY AUTO_INCREMENT",
    "name": "VARCHAR(50) NOT NULL",
    "email": "VARCHAR(100) UNIQUE NOT NULL",
    "password_hash": "VARCHAR(255) NOT NULL",
    "user_profile": "VARCHAR(512) NULL", # เก็บ URL รูปภาพ [cite: 248]
    "created_at": "DATETIME DEFAULT NOW()"
}

# นิยามตาราง User_Role ตามหลัก 4NF (1 User สามารถมีได้หลาย Role) [cite: 417, 429]
USER_ROLEs_TABLE = {
    "user_id": "INT NOT NULL (FK -> User)",
    "role": "ENUM('admin', 'student', 'tutor') NOT NULL",
    "composite_pk": "(user_id, role)"
}