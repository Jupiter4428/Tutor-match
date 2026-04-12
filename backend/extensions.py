import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    def get_connection(self):
        return pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'tutor_match'),
            cursorclass=pymysql.cursors.DictCursor,
            charset='utf8mb4'
        )

# ตรวจสอบบรรทัดนี้ให้ดี ต้องชิดซ้ายสุด และสะกด db ตัวเล็กครับ!
db = Database()