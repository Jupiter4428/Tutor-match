# ตารางการชำระเงิน (Payment)
PAYMENT_TABLE = {
    "payment_id": "INT PRIMARY KEY AUTO_INCREMENT",
    "app_id": "INT (FK -> Application)", 
    "amount": "DECIMAL(10,2) (CHECK > 0)", 
    "platform_fee": "DECIMAL(10,2)", # คำนวณจาก amount * 0.10 [cite: 275, 448]
    "status": "ENUM('pending', 'completed') DEFAULT 'pending'", 
    "payment_date": "DATETIME DEFAULT NOW()"
}