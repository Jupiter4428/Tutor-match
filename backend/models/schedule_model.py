# ตารางช่วงเวลาว่างของติวเตอร์ (Tutor Availability)
TUTOR_SCHEDULE_TABLE = {
    "schedule_id": "INT PRIMARY KEY AUTO_INCREMENT",
    "tutor_id": "INT (FK -> Tutor_Profile)",
    "day_of_week": "ENUM('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')",
    "start_time": "TIME NOT NULL",
    "end_time": "TIME NOT NULL (CHECK end_time > start_time)"
}

# ตารางบันทึกการจองเวลาเรียน (Schedule Booking)
SCHEDULE_BOOKING_TABLE = {
    "booking_id": "INT PRIMARY KEY AUTO_INCREMENT",
    "schedule_id": "INT (FK -> Tutor_Schedule)",
    "app_id": "INT (FK -> Application)",
    "booking_date": "DATE NOT NULL"
}