# ตารางรีวิว (Review)
REVIEW_TABLE = {
    "review_id": "INT PRIMARY KEY AUTO_INCREMENT", 
    "app_id": "INT UNIQUE (FK -> Application)", # 1 งานรีวิวได้ 1 ครั้ง
    "rating": "INT (CHECK 1-5 ดาว)", 
    "comment": "TEXT", 
    "created_at": "DATETIME DEFAULT NOW()" 
}