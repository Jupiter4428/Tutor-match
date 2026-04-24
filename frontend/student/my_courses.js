const courses = [
  {
    id: 1,
    subject: "คณิตศาสตร์ ม.6",
    title: "ติวเข้มแคลคูลัสและโจทย์สอบ",
    status: "active",
    statusText: "กำลังเรียน",
    price: 900,
    schedule: "จันทร์ / พุธ 18:00 - 19:30",
    format: "Online",
    progress: 65,
    tutor: {
      name: "ครูเมย์ อภิญญา",
      email: "may.tutor@email.com",
      bio: "ติวเตอร์คณิตศาสตร์ ประสบการณ์ 5 ปี เน้นอธิบายเป็นขั้นตอนและสรุปสูตรจำง่าย",
      pic: "https://cdn-icons-png.flaticon.com/512/4140/4140047.png"
    },
    review: ""
  },
  {
    id: 2,
    subject: "ภาษาอังกฤษ",
    title: "Speaking & Grammar สำหรับนักศึกษา",
    status: "completed",
    statusText: "เรียนจบแล้ว",
    price: 1200,
    schedule: "เสาร์ 10:00 - 12:00",
    format: "Online",
    progress: 100,
    tutor: {
      name: "Teacher Ploy",
      email: "ploy.english@email.com",
      bio: "สอนภาษาอังกฤษแบบเป็นกันเอง เน้นพูดจริง ใช้จริง พร้อมแก้จุดอ่อนรายบุคคล",
      pic: "https://cdn-icons-png.flaticon.com/512/6997/6997662.png"
    },
    review: "สอนดีมาก เข้าใจง่าย กล้าพูดภาษาอังกฤษมากขึ้น"
  },
  {
    id: 3,
    subject: "ฟิสิกส์ ม.5",
    title: "แรง การเคลื่อนที่ และพลังงาน",
    status: "pending",
    statusText: "รอยืนยัน",
    price: 750,
    schedule: "ศุกร์ 19:00 - 20:30",
    format: "Onsite",
    progress: 10,
    tutor: {
      name: "พี่ต้น ฟิสิกส์",
      email: "ton.physics@email.com",
      bio: "ถนัดสอนฟิสิกส์แบบเข้าใจภาพรวมก่อนลงโจทย์ เหมาะกับนักเรียนที่พื้นฐานยังไม่แน่น",
      pic: "https://cdn-icons-png.flaticon.com/512/921/921071.png"
    },
    review: ""
  },
  {
    id: 4,
    subject: "Programming",
    title: "พื้นฐาน Python สำหรับผู้เริ่มต้น",
    status: "completed",
    statusText: "เรียนจบแล้ว",
    price: 1500,
    schedule: "อาทิตย์ 13:00 - 15:00",
    format: "Online",
    progress: 100,
    tutor: {
      name: "พี่เกม Developer",
      email: "game.dev@email.com",
      bio: "สอนเขียนโค้ดแบบจับมือทำ เหมาะกับผู้เริ่มต้นและคนที่อยากเข้าใจพื้นฐานจริง ๆ",
      pic: "https://cdn-icons-png.flaticon.com/512/236/236831.png"
    },
    review: ""
  }
];

const courseGrid = document.getElementById("courseGrid");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const refreshBtn = document.getElementById("refreshBtn");

function goToStuHome() {
  window.location.href = "/home/student";
}

function goToStuWallet() {
  window.location.href = "/student/wallet";
}

function formatMoney(amount){
  return `฿${Number(amount).toLocaleString("th-TH")}`;
}

function renderCourses(){
  const keyword = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;

  const filtered = courses.filter(course => {
    const text = `
      ${course.subject}
      ${course.title}
      ${course.statusText}
      ${course.tutor.name}
      ${course.tutor.email}
      ${course.tutor.bio}
    `.toLowerCase();

    const matchKeyword = text.includes(keyword);
    const matchStatus = status === "all" || course.status === status;

    return matchKeyword && matchStatus;
  });

  if(filtered.length === 0){
    courseGrid.innerHTML = `<div class="empty-state">ไม่พบคอร์สที่ตรงกับเงื่อนไขที่ค้นหา</div>`;
    updateStats();
    return;
  }

  courseGrid.innerHTML = filtered.map((course, index) => `
    <div class="course-card">
      <div class="course-top">
        <div class="course-title">
          <h4>${course.subject}</h4>
          <p>${course.title}</p>
        </div>
        <div class="status ${course.status}">${course.statusText}</div>
      </div>

      <div class="course-info">
        <div class="info-box">
          <span>ราคา</span>
          <strong>${formatMoney(course.price)}</strong>
        </div>
        <div class="info-box">
          <span>รูปแบบ</span>
          <strong>${course.format}</strong>
        </div>
        <div class="info-box">
          <span>เวลาเรียน</span>
          <strong>${course.schedule}</strong>
        </div>
      </div>

      <div class="tutor-box">
        <img src="${course.tutor.pic}" alt="${course.tutor.name}">
        <div class="tutor-detail">
          <h4>${course.tutor.name}</h4>
          <div class="email">${course.tutor.email}</div>
          <p>${course.tutor.bio}</p>
        </div>
      </div>

      <div class="progress-wrap">
        <div class="progress-top">
          <span>ความคืบหน้าคอร์ส</span>
          <strong>${course.progress}%</strong>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${course.progress}%"></div>
        </div>
      </div>

      <div class="course-actions">
        <button class="btn review-btn" onclick="reviewCourse(${course.id})">
          ${course.review ? "✏️ แก้ไขรีวิว" : "⭐ Review"}
        </button>
        <button class="btn detail-btn" onclick="viewDetail(${course.id})">ดูรายละเอียด</button>
      </div>

      ${course.review ? `<div class="review-text"><strong>รีวิวของคุณ:</strong> ${course.review}</div>` : ""}
    </div>
  `).join("");

  updateStats();
}

function updateStats(){
  document.getElementById("totalCourses").textContent = courses.length;
  document.getElementById("activeCourses").textContent = courses.filter(c => c.status === "active").length;
  document.getElementById("completedCourses").textContent = courses.filter(c => c.status === "completed").length;
  document.getElementById("reviewedCourses").textContent = courses.filter(c => c.review).length;

  localStorage.setItem("student_course_count", courses.length);
  localStorage.setItem("student_active_course_count", courses.filter(c => c.status === "active").length);
  localStorage.setItem("student_completed_course_count", courses.filter(c => c.status === "completed").length);
}

function reviewCourse(id){
  const course = courses.find(c => c.id === id);
  if(!course) return;

  const text = prompt("เขียนหรือแก้ไขรีวิวของคุณ", course.review || "");
  if(text === null) return;

  course.review = text.trim();
  renderCourses();
}

function viewDetail(id){
  const course = courses.find(c => c.id === id);
  if(!course) return;

  alert(
    `รายละเอียดคอร์ส\n` +
    `วิชา: ${course.subject}\n` +
    `ชื่อคอร์ส: ${course.title}\n` +
    `ติวเตอร์: ${course.tutor.name}\n` +
    `อีเมล: ${course.tutor.email}\n` +
    `ราคา: ${formatMoney(course.price)}\n` +
    `สถานะ: ${course.statusText}`
  );
}

searchInput.addEventListener("input", renderCourses);
statusFilter.addEventListener("change", renderCourses);

refreshBtn.addEventListener("click", () => {
  renderCourses();
  alert("รีเฟรชรายการคอร์สแล้ว");
});

document.addEventListener("DOMContentLoaded", renderCourses);