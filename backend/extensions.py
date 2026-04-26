import pymysql
from backend.config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME


class _WrappedConnection:
    """
    Wraps a pymysql connection และทำให้ close() เป็น no-op
    เพื่อให้ service files ที่เรียก connection.close() ไม่ได้ปิด
    connection จริง — connection จะถูกปิดจริงเมื่อจบ request
    ผ่าน teardown_appcontext ที่ลงทะเบียนใน app.py
    """

    def __init__(self, conn):
        self._conn = conn

    def close(self):
        # no-op: ป้องกัน service files ปิด connection ก่อนกำหนด
        pass

    def force_close(self):
        # ใช้เฉพาะ teardown_appcontext เพื่อปิดจริง
        try:
            self._conn.close()
        except Exception:
            pass

    def __getattr__(self, name):
        return getattr(self._conn, name)


class Database:
    def _create_raw_conn(self):
        return pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            cursorclass=pymysql.cursors.DictCursor,
            charset='utf8mb4',
        )

    def get_connection(self):
        """
        คืน connection ที่ reuse ภายใน Flask request เดียวกัน
        แทนที่จะเปิด connection ใหม่ทุก service call

        - ภายใน request context → ใช้ g._db_wrapped (1 conn ต่อ request)
        - นอก request context (เช่น testing) → สร้าง connection จริง
        """
        try:
            from flask import g

            if not hasattr(g, '_db_wrapped') or g._db_wrapped is None:
                g._db_wrapped = _WrappedConnection(self._create_raw_conn())
            else:
                # ping เพื่อ reconnect ถ้า connection หลุด
                try:
                    g._db_wrapped._conn.ping(reconnect=True)
                except Exception:
                    g._db_wrapped = _WrappedConnection(self._create_raw_conn())

            return g._db_wrapped

        except RuntimeError:
            # ไม่มี Flask app context → คืน real connection ตรงๆ
            return self._create_raw_conn()


db = Database()
