from backend.extensions import db

PLATFORM_FEE_RATE = 0.10
GATEWAY_FEE_RATE  = 0.03  # หักเมื่อยกเลิกก่อนเรียน


def pay_for_application(user_id, app_id):
    """Phase 1: นักเรียนชำระเงิน Full Escrow"""
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            student = cursor.fetchone()
            if not student:
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียน"}

            cursor.execute("""
                SELECT a.app_id, a.status, a.teaching_status,
                       sp.budget, sp.subject, sp.student_id
                FROM applications a
                JOIN student_posts sp ON a.post_id = sp.post_id
                WHERE a.app_id = %s AND sp.student_id = %s
            """, (app_id, student['student_id']))
            app = cursor.fetchone()

            if not app:
                return {"status": "error", "message": "ไม่พบการจองนี้ หรือคุณไม่มีสิทธิ์"}
            if app['status'] != 'accepted':
                return {"status": "error", "message": "การจองนี้ยังไม่ได้รับการยืนยัน"}
            if app['teaching_status'] != 'not_started':
                return {"status": "error", "message": "ไม่สามารถชำระเงินได้ในสถานะนี้"}

            cursor.execute("SELECT payment_id FROM payments WHERE app_id = %s", (app_id,))
            if cursor.fetchone():
                return {"status": "error", "message": "ชำระเงินสำหรับการจองนี้แล้ว"}

            amount       = float(app['budget'])
            platform_fee = round(amount * PLATFORM_FEE_RATE, 2)

            cursor.execute("SELECT wallet_id, balance FROM wallets WHERE user_id = %s FOR UPDATE", (user_id,))
            wallet = cursor.fetchone()
            if not wallet:
                return {"status": "error", "message": "ไม่พบกระเป๋าเงิน"}
            if float(wallet['balance']) < amount:
                return {"status": "error", "message": f"ยอดเงินไม่เพียงพอ ต้องการ ฿{amount:.2f} มีอยู่ ฿{float(wallet['balance']):.2f}"}

            new_balance = float(wallet['balance']) - amount

            cursor.execute("UPDATE wallets SET balance = %s WHERE wallet_id = %s",
                           (new_balance, wallet['wallet_id']))
            cursor.execute("""
                INSERT INTO payments (app_id, amount, platform_fee, status)
                VALUES (%s, %s, %s, 'pending')
            """, (app_id, amount, platform_fee))
            cursor.execute("""
                INSERT INTO transaction_logs
                    (wallet_id, transaction_type, amount, balance_after,
                     reference_type, reference_id, description)
                VALUES (%s, 'payment', %s, %s, 'application', %s, %s)
            """, (wallet['wallet_id'], amount, new_balance, app_id,
                  f"ชำระค่าเรียน{app['subject']} (Escrow)"))

            connection.commit()
            return {"status": "success", "message": "ชำระเงินสำเร็จ ระบบถือเงินไว้เป็น Escrow",
                    "new_balance": new_balance}

    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


def start_class(user_id, app_id):
    """Phase 2a: ติวเตอร์กด Start Class"""
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT tutor_id FROM tutor_profiles WHERE user_id = %s", (user_id,))
            tutor = cursor.fetchone()
            if not tutor:
                return {"status": "error", "message": "ไม่พบโปรไฟล์ติวเตอร์"}

            cursor.execute("""
                SELECT a.app_id, a.teaching_status, p.payment_id
                FROM applications a
                LEFT JOIN payments p ON a.app_id = p.app_id
                WHERE a.app_id = %s AND a.tutor_id = %s AND a.status = 'accepted'
            """, (app_id, tutor['tutor_id']))
            app = cursor.fetchone()

            if not app:
                return {"status": "error", "message": "ไม่พบการจองนี้"}
            if app['teaching_status'] != 'not_started':
                return {"status": "error", "message": "คลาสนี้เริ่มไปแล้ว หรืออยู่ในสถานะที่ไม่สามารถเริ่มได้"}
            if not app['payment_id']:
                return {"status": "error", "message": "นักเรียนยังไม่ได้ชำระเงิน กรุณารอก่อน"}

            cursor.execute(
                "UPDATE applications SET teaching_status = 'ongoing' WHERE app_id = %s", (app_id,)
            )
            connection.commit()
            return {"status": "success", "message": "เริ่มคลาสเรียบร้อยแล้ว"}

    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


def end_class(user_id, app_id):
    """Phase 2b: ติวเตอร์กด End Class"""
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT tutor_id FROM tutor_profiles WHERE user_id = %s", (user_id,))
            tutor = cursor.fetchone()
            if not tutor:
                return {"status": "error", "message": "ไม่พบโปรไฟล์ติวเตอร์"}

            cursor.execute("""
                SELECT app_id, teaching_status
                FROM applications
                WHERE app_id = %s AND tutor_id = %s AND status = 'accepted'
            """, (app_id, tutor['tutor_id']))
            app = cursor.fetchone()

            if not app:
                return {"status": "error", "message": "ไม่พบการจองนี้"}
            if app['teaching_status'] != 'ongoing':
                return {"status": "error", "message": "คลาสยังไม่ได้เริ่ม หรือสิ้นสุดไปแล้ว"}

            cursor.execute(
                "UPDATE applications SET teaching_status = 'completed' WHERE app_id = %s", (app_id,)
            )
            connection.commit()
            return {"status": "success", "message": "จบคลาสเรียบร้อยแล้ว รอการยืนยันจากนักเรียน"}

    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


def confirm_class(user_id, app_id):
    """Phase 3: นักเรียน Confirm → Payout ติวเตอร์ 90% + platform 10%"""
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            student = cursor.fetchone()
            if not student:
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียน"}

            cursor.execute("""
                SELECT a.app_id, a.teaching_status, a.tutor_id,
                       p.payment_id, p.amount, p.platform_fee,
                       p.status AS payment_status,
                       tp.user_id AS tutor_user_id,
                       sp.subject
                FROM applications a
                JOIN student_posts sp  ON a.post_id   = sp.post_id
                JOIN payments p        ON a.app_id    = p.app_id
                JOIN tutor_profiles tp ON a.tutor_id  = tp.tutor_id
                WHERE a.app_id = %s AND sp.student_id = %s
            """, (app_id, student['student_id']))
            app = cursor.fetchone()

            if not app:
                return {"status": "error", "message": "ไม่พบการจองนี้ หรือยังไม่ได้ชำระเงิน"}
            if app['teaching_status'] != 'completed':
                return {"status": "error", "message": "การสอนยังไม่เสร็จสิ้น"}
            if app['payment_status'] == 'completed':
                return {"status": "error", "message": "โอนเงินให้ติวเตอร์แล้ว"}

            amount       = float(app['amount'])
            platform_fee = float(app['platform_fee'])
            tutor_gets   = round(amount - platform_fee, 2)
            subject      = app['subject']

            # โอนเงินให้ติวเตอร์
            cursor.execute("SELECT wallet_id, balance FROM wallets WHERE user_id = %s FOR UPDATE",
                           (app['tutor_user_id'],))
            tutor_wallet = cursor.fetchone()
            if not tutor_wallet:
                cursor.execute("INSERT INTO wallets (user_id, balance) VALUES (%s, 0.00)",
                               (app['tutor_user_id'],))
                cursor.execute("SELECT wallet_id, balance FROM wallets WHERE user_id = %s FOR UPDATE",
                               (app['tutor_user_id'],))
                tutor_wallet = cursor.fetchone()

            new_tutor_balance = float(tutor_wallet['balance']) + tutor_gets
            cursor.execute("UPDATE wallets SET balance = %s WHERE wallet_id = %s",
                           (new_tutor_balance, tutor_wallet['wallet_id']))
            cursor.execute("""
                INSERT INTO transaction_logs
                    (wallet_id, transaction_type, amount, balance_after,
                     reference_type, reference_id, description)
                VALUES (%s, 'tutor_earnings', %s, %s, 'application', %s, %s)
            """, (tutor_wallet['wallet_id'], tutor_gets, new_tutor_balance, app_id,
                  f"รายได้จากการสอน{subject} (หัก GP {int(PLATFORM_FEE_RATE*100)}%)"))

            # Platform fee → admin wallet (user_id = 1)
            cursor.execute("SELECT wallet_id, balance FROM wallets WHERE user_id = 1 FOR UPDATE")
            admin_wallet = cursor.fetchone()
            if admin_wallet:
                new_admin_balance = float(admin_wallet['balance']) + platform_fee
                cursor.execute("UPDATE wallets SET balance = %s WHERE wallet_id = %s",
                               (new_admin_balance, admin_wallet['wallet_id']))
                cursor.execute("""
                    INSERT INTO transaction_logs
                        (wallet_id, transaction_type, amount, balance_after,
                         reference_type, reference_id, description)
                    VALUES (%s, 'platform_fee', %s, %s, 'application', %s, %s)
                """, (admin_wallet['wallet_id'], platform_fee, new_admin_balance, app_id,
                      f"ค่าธรรมเนียม GP {int(PLATFORM_FEE_RATE*100)}% จาก{subject}"))

            cursor.execute("UPDATE payments SET status = 'completed' WHERE app_id = %s", (app_id,))
            connection.commit()

            return {
                "status":         "success",
                "message":        f"ยืนยันการเรียนสำเร็จ ติวเตอร์ได้รับ ฿{tutor_gets:.2f}",
                "tutor_earnings": tutor_gets,
                "platform_fee":   platform_fee
            }

    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()


def cancel_booking(user_id, app_id):
    """ยกเลิกก่อนเรียน → คืนเงิน 97% (หัก Gateway Fee 3%)"""
    connection = db.get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT student_id FROM student_profiles WHERE user_id = %s", (user_id,))
            student = cursor.fetchone()
            if not student:
                return {"status": "error", "message": "ไม่พบโปรไฟล์นักเรียน"}

            cursor.execute("""
                SELECT a.app_id, a.teaching_status,
                       p.payment_id, p.amount, p.status AS payment_status,
                       sp.subject
                FROM applications a
                JOIN student_posts sp ON a.post_id = sp.post_id
                LEFT JOIN payments p  ON a.app_id  = p.app_id
                WHERE a.app_id = %s AND sp.student_id = %s AND a.status = 'accepted'
            """, (app_id, student['student_id']))
            app = cursor.fetchone()

            if not app:
                return {"status": "error", "message": "ไม่พบการจองนี้"}
            if app['teaching_status'] != 'not_started':
                return {"status": "error", "message": "ไม่สามารถยกเลิกได้หลังจากเริ่มเรียนแล้ว"}

            if not app['payment_id']:
                cursor.execute(
                    "UPDATE applications SET status = 'rejected' WHERE app_id = %s", (app_id,)
                )
                connection.commit()
                return {"status": "success", "message": "ยกเลิกการจองเรียบร้อย (ยังไม่มีการชำระเงิน)"}

            if app['payment_status'] == 'completed':
                return {"status": "error", "message": "โอนเงินให้ติวเตอร์แล้ว ไม่สามารถยกเลิกได้"}

            amount        = float(app['amount'])
            gateway_fee   = round(amount * GATEWAY_FEE_RATE, 2)
            refund_amount = round(amount - gateway_fee, 2)

            cursor.execute("SELECT wallet_id, balance FROM wallets WHERE user_id = %s FOR UPDATE", (user_id,))
            wallet = cursor.fetchone()
            if not wallet:
                return {"status": "error", "message": "ไม่พบกระเป๋าเงิน"}

            new_balance = float(wallet['balance']) + refund_amount
            cursor.execute("UPDATE wallets SET balance = %s WHERE wallet_id = %s",
                           (new_balance, wallet['wallet_id']))
            cursor.execute("""
                INSERT INTO transaction_logs
                    (wallet_id, transaction_type, amount, balance_after,
                     reference_type, reference_id, description)
                VALUES (%s, 'refund', %s, %s, 'application', %s, %s)
            """, (wallet['wallet_id'], refund_amount, new_balance, app_id,
                  f"คืนเงินยกเลิกคอร์ส{app['subject']} (หัก Gateway Fee 3%)"))

            cursor.execute(
                "UPDATE applications SET status = 'rejected' WHERE app_id = %s", (app_id,)
            )
            # คืน post กลับเป็น open เพื่อให้นักเรียนหาติวเตอร์คนใหม่ได้
            cursor.execute("""
                UPDATE student_posts SET status = 'open'
                WHERE post_id = (
                    SELECT post_id FROM applications WHERE app_id = %s
                )
            """, (app_id,))
            connection.commit()

            return {
                "status":        "success",
                "message":       f"ยกเลิกสำเร็จ คืนเงิน ฿{refund_amount:.2f} (หัก Gateway Fee ฿{gateway_fee:.2f})",
                "refund_amount": refund_amount,
                "gateway_fee":   gateway_fee
            }

    except Exception as e:
        connection.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        connection.close()
