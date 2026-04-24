let courses = [];

const courseGrid = document.getElementById("courseGrid");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const refreshBtn = document.getElementById("refreshBtn");

let selectedReviewCourseId = null;

function goToStuHome() {
  window.location.href = "/home/student";
}

function goToStuWallet() {
  window.location.href = "/student/wallet";
}

function formatMoney(amount) {
  return `฿${Number(amount || 0).toLocaleString("th-TH")}`;
}

function getAuthToken() {
  return localStorage.getItem("token") || localStorage.getItem("access_token");
}

function renderStars(rating) {
  if (!rating) return "";
  return "⭐".repeat(Number(rating));
}

function mapCourseFromDB(item) {
  return {
    id: item.course_id || item.id || item.app_id,
    app_id: item.app_id,
    subject: item.subject || "-",
    title: item.title || item.course_title || item.description || "-",
    status: item.status || "pending",
    statusText: getStatusText(item.status),
    price: item.price || item.budget || 0,
    schedule: item.schedule || item.schedule_time || "-",
    format: item.format || item.learning_format || "Online",
    progress: item.progress || getProgressByStatus(item.status),
    tutor: {
      name: item.tutor_name || item.name || "-",
      email: item.tutor_email || item.email || "-",
      bio: item.tutor_bio || item.bio || "-",
      pic: item.tutor_pic || item.user_profile || "https://cdn-icons-png.flaticon.com/512/4140/4140047.png"
    },
    rating: item.rating || null,
    review: item.review || item.comment || ""
  };
}

function getStatusText(status) {
  if (status === "active") return "กำลังเรียน";
  if (status === "completed") return "เรียนจบแล้ว";
  if (status === "pending") return "รอยืนยัน";
  if (status === "pending_payment") return "รอชำระเงิน";
  if (status === "cancelled") return "ยกเลิก";
  return "รอยืนยัน";
}

function getProgressByStatus(status) {
  if (status === "completed") return 100;
  if (status === "active") return 50;
  if (status === "pending") return 10;
  if (status === "pending_payment") return 0;
  return 0;
}

async function loadCoursesFromDB() {
  const token = getAuthToken();

  if (!token) {
    alert("กรุณาเข้าสู่ระบบก่อนดูคอร์สของฉัน");
    window.location.href = "/login";
    return;
  }

  try {
    courseGrid.innerHTML = `<div class="empty-state">กำลังโหลดคอร์สจาก database...</div>`;

    const response = await fetch("/student/my-courses", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (!response.ok || result.status !== "success") {
      courseGrid.innerHTML = `<div class="empty-state">โหลดข้อมูลคอร์สไม่สำเร็จ</div>`;
      alert(result.message || "โหลดข้อมูลคอร์สไม่สำเร็จ");
      return;
    }

    const data = result.data || result.courses || [];

    courses = data.map(mapCourseFromDB);

    renderCourses();

  } catch (error) {
    console.error(error);
    courseGrid.innerHTML = `<div class="empty-state">เชื่อมต่อ backend ไม่สำเร็จ</div>`;
    alert("เชื่อมต่อ backend ไม่สำเร็จ");
  }
}

function renderCourses() {
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

  if (filtered.length === 0) {
    courseGrid.innerHTML = `<div class="empty-state">ไม่พบคอร์สที่ตรงกับเงื่อนไขที่ค้นหา</div>`;
    updateStats();
    return;
  }

  courseGrid.innerHTML = filtered.map(course => `
    <div class="course-card">
      <div class="course-top">
        <div class="course-title">
          <h4>${course.subject}</h4>
          <p>${course.title}</p>
        </div>
        <div class="status-badge ${course.status}">${course.statusText}</div>
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

  ${course.status === "pending_payment" ? `
    <button class="btn pay-btn" onclick="payCourse(${course.id})">
      💳 จ่ายเงิน
    </button>
  ` : ""}

  <button 
    class="btn review-btn" 
    onclick="reviewCourse(${course.id})"
    ${course.status !== "completed" ? "disabled" : ""}
  >
    ${course.review ? "✏️ แก้ไขรีวิว" : "⭐ Review"}
  </button>

  <button class="btn detail-btn" onclick="viewDetail(${course.id})">
    ดูรายละเอียด
  </button>

  `).join("");

  updateStats();
}

function updateStats() {
  document.getElementById("totalCourses").textContent = courses.length;
  document.getElementById("activeCourses").textContent = courses.filter(c => c.status === "active").length;
  document.getElementById("completedCourses").textContent = courses.filter(c => c.status === "completed").length;
  document.getElementById("reviewedCourses").textContent = courses.filter(c => c.review).length;

  localStorage.setItem("student_course_count", courses.length);
  localStorage.setItem("student_active_course_count", courses.filter(c => c.status === "active").length);
  localStorage.setItem("student_completed_course_count", courses.filter(c => c.status === "completed").length);
}

function reviewCourse(id) {
  const course = courses.find(c => Number(c.id) === Number(id));
  if (!course) return;

  if (course.status !== "completed") {
    alert("รีวิวได้เฉพาะคอร์สที่เรียนจบแล้ว");
    return;
  }

  selectedReviewCourseId = id;

  document.getElementById("reviewCourseTitle").textContent =
    `${course.subject} - ${course.tutor.name}`;

  document.getElementById("reviewRating").value = course.rating || "5";
  document.getElementById("reviewComment").value = course.review || "";

  document.getElementById("reviewModal").style.display = "flex";
}

function closeReviewModal() {
  selectedReviewCourseId = null;
  document.getElementById("reviewModal").style.display = "none";
}

async function submitReview() {
  const course = courses.find(c => Number(c.id) === Number(selectedReviewCourseId));

  if (!course) {
    alert("ไม่พบคอร์สที่ต้องการรีวิว");
    return;
  }

  const token = getAuthToken();

  if (!token) {
    alert("กรุณาเข้าสู่ระบบก่อนรีวิว");
    window.location.href = "/login";
    return;
  }

  const rating = Number(document.getElementById("reviewRating").value);
  const comment = document.getElementById("reviewComment").value.trim();

  if (!rating || rating < 1 || rating > 5) {
    alert("กรุณาเลือกคะแนน 1-5 ดาว");
    return;
  }

  if (!comment) {
    alert("กรุณาเขียนข้อความรีวิว");
    return;
  }

  if (!course.app_id) {
    alert("คอร์สนี้ยังไม่มี app_id จึงยังบันทึกรีวิวลงฐานข้อมูลไม่ได้");
    return;
  }

  try {
    const response = await fetch("/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        app_id: course.app_id,
        rating: rating,
        comment: comment
      })
    });

    const result = await response.json();

    if (!response.ok || result.status !== "success") {
      alert(result.message || "บันทึกรีวิวไม่สำเร็จ");
      return;
    }

    course.rating = rating;
    course.review = comment;

    closeReviewModal();
    renderCourses();

    alert("บันทึกรีวิวลง database สำเร็จ");

  } catch (error) {
    console.error(error);
    alert("เชื่อมต่อ backend ไม่สำเร็จ");
  }
}

function viewDetail(id) {
  const course = courses.find(c => Number(c.id) === Number(id));
  if (!course) return;

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
  loadCoursesFromDB();
});

document.addEventListener("DOMContentLoaded", loadCoursesFromDB);
async function payCourse(id) {
  const course = courses.find(c => Number(c.id) === Number(id));
  if (!course) return;

  if (!course.app_id) {
    alert("ไม่พบ app_id ของคอร์สนี้");
    return;
  }

  const token = getAuthToken();
  if (!token) {
    alert("กรุณาเข้าสู่ระบบก่อน");
    window.location.href = "/login";
    return;
  }

  if (!confirm(`ยืนยันการชำระเงิน ${formatMoney(course.price)} สำหรับวิชา ${course.subject}?`)) return;

  try {
    const response = await fetch("/student/api/pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ app_id: course.app_id })
    });

    const result = await response.json();

    if (!response.ok || result.status !== "success") {
      alert(result.message || "ชำระเงินไม่สำเร็จ");
      return;
    }

    alert(`ชำระเงินสำเร็จ!\nยอดเงินคงเหลือ: ฿${Number(result.new_balance || 0).toLocaleString("th-TH")}`);
    loadCoursesFromDB();

  } catch (error) {
    console.error(error);
    alert("เชื่อมต่อ backend ไม่สำเร็จ");
  }
}
