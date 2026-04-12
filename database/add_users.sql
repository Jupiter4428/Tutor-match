USE tutor_match;
SET NAMES utf8mb4;

-- สร้างข้อมูลสมชาย (นักเรียน)
INSERT INTO users (user_id, name, email, password_hash) 
VALUES (2, 'สมชาย', 'somchai@test.com', '1234');

INSERT INTO user_roles (user_id, role) 
VALUES (2, 'student');

INSERT INTO student_profiles (student_id, user_id, grade_level, school_name) 
VALUES (1, 2, 'ม.4', 'โรงเรียนมัธยมวิทยา');

-- สร้างข้อมูลมานี (ติวเตอร์)
INSERT INTO users (user_id, name, email, password_hash) 
VALUES (3, 'มานี', 'manee@test.com', '5678');

INSERT INTO user_roles (user_id, role) 
VALUES (3, 'tutor');

INSERT INTO tutor_profiles (tutor_id, user_id, bio, hourly_rate) 
VALUES (1, 3, 'สอนฟิสิกส์เข้าใจง่าย สไตล์พี่สาว', 250.00);