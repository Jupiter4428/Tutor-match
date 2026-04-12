# ตารางการสมัครงานสอน (Job Application)
APPLICATION_TABLE = {
    "app_id": "INT PRIMARY KEY AUTO_INCREMENT",
    "post_id": "INT (FK -> Student_Post)",
    "tutor_id": "INT (FK -> Tutor_Profile)",
    "status": "ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending'",
    "applied_at": "DATETIME DEFAULT NOW()",
    "constraints": "UNIQUE (post_id, tutor_id)" # ป้องกันสมัครโพสต์เดิมซ้ำ
}