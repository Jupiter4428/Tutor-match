import pymysql
from backend.config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

class Database:
    def get_connection(self):
        return pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            cursorclass=pymysql.cursors.DictCursor,
            charset='utf8mb4'
        )

db = Database()