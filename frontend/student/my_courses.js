let courses = [];

const courseGrid = document.getElementById("courseGrid");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const refreshBtn = document.getElementById("refreshBtn");

let selectedReviewCourseId = null;

const DEFAULT_AVATAR = '/static/uploads/default_profile.jpg';

function goToStuHome() { window.location.href = "/home/student"; }
function goToStuWallet() { window.location.href = "/student/wallet"; }

function formatMoney(amount) {
  return `฿${Number(amount || 0).toLocaleString("th-TH")}`;
}

function getAuthToken() {
  return localStorage.getItem("token");
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg, type = 'success') {
  const bg = type === 'success' ? 'rgba(53,224,161,0.95)' : 'rgba(255,95,122,0.95)';
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    padding:14px 20px;border-radius:12px;
    font-size:0.95rem;font-weight:600;color:#fff;
    background:${bg};backdrop-filter:blur(8px);
    box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:opacity 0.4s;
  `;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 2800);
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
      pic: item.tutor_pic || item.user_profile || DEFAULT_AVATAR
    },
    rating: item.rating || null,
    review: item.review || item.comment || ""
  };
}

function getStatusText(status) {
  const map = {
    active: "กำลังเรียน",
    completed: "เรียนจบแล้ว",
    pending: "รอยืนยัน",
    pending_payment: "รอชำระเงิน",
    cancelled: "ยกเลิก"
  };
  return map[status] || "รอยืนยัน";
}

function getProgressByStatus(status) {
  if (status === "completed") return 100;
  if (status === "active") return 50;
  if (status === "pending") return 10;
  return 0;
}

async function loadCoursesFromDB() {
  const token = getAuthToken();
  if (!token) {
    window.location.href = "/login";
    return;
  }

  courseGrid.innerHTML = `<div class="empty-state">กำลังโหลดคอร์สจาก database...</div>`;

  try {
    const response = await fetch("/student/my-courses", {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await response.json();

    if (!response.ok || result.status !== "success") {
      courseGrid.innerHTML = `<div class="empty-state">โหลดข้อมูลคอร์สไม่สำเร็จ</div>`;
      showToast(result.message || "โหลดข้อมูลคอร์สไม่สำเร็จ", "error");
      return;
    }

    courses = (result.data || result.courses || []).map(mapCourseFromDB);
    renderCourses();
  } catch (error) {
    console.error(error);
    courseGrid.innerHTML = `<div class="empty-state">เชื่อมต่อ backend ไม่สำเร็จ</div>`;
    showToast("เชื่อมต่อ backend ไม่สำเร็จ", "error");
  }
}

function renderCourses() {
  const keyword = searchInput.value.trim().toLowerCase();
  const status  = statusFilter.value;

  const filtered = courses.filter(course => {
    const text = `${course.subject} ${course.title} ${course.statusText} ${course.tutor.name} ${course.tutor.email} ${course.tutor.bio}`.toLowerCase();
    return text.includes(keyword) && (status === "all" || course.status === status);
  });

  if (filtered.length === 0) {
    courseGrid.innerHTML = `<div class="empty-state">ไม่พบคอร์สที่ตรงกับเงื่อนไขที่ค้นหา</div>`;
    updateStats();
    return;
  }

  courseGrid.innerHTML = filtered.map(course => {
    const safeSubject = escapeHtml(course.subject);
    const safeTitle   = escapeHtml(course.title);
    const safeName    = escapeHtml(course.tutor.name);
    const safeEmail   = escapeHtml(course.tutor.email);
    const safeBio     = escapeHtml(course.tutor.bio);
    const safeFormat  = escapeHtml(course.format);
    const safeSchedule = escapeHtml(course.schedule);

    return `
    <div class="course-card">
      <div class="course-top">
        <div class="course-title">
          <h4>${safeSubject}</h4>
          <p>${safeTitle}</p>
        </div>
        <div class="status-badge ${course.status}">${course.statusText}</div>
      </div>

      <div class="course-info">
        <div class="info-box"><span>ราคา</span><strong>${formatMoney(course.price)}</strong></div>
        <div class="info-box"><span>รูปแบบ</span><strong>${safeFormat}</strong></div>
        <div class="info-box"><span>เวลาเรียน</span><strong>${safeSchedule}</strong></div>
      </div>

      <div class="tutor-box">
        <img src="${escapeHtml(course.tutor.pic)}" alt="${safeName}"
          onerror="this.src='${DEFAULT_AVATAR}'">
        <div class="tutor-detail">
          <h4>${safeName}</h4>
          <div class="email">${safeEmail}</div>
          <p>${safeBio}</p>
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
          <button class="btn pay-btn" onclick="payCourse(${course.id})">💳 จ่ายเงิน</button>
        ` : ""}
        <button class="btn review-btn" onclick="reviewCourse(${course.id})"
          ${course.status !== "completed" ? "disabled" : ""}>
          ${course.review ? "✏️ แก้ไขรีวิว" : "⭐ Review"}
        </button>
        <button class="btn detail-btn" onclick="viewDetail(${course.id})">ดูรายละเอียด</button>
      </div>
    </div>`;
  }).join("");

  updateStats();
}

function updateStats() {
  document.getElementById("totalCourses").textContent = courses.length;
  document.getElementById("activeCourses").textContent = courses.filter(c => c.status === "active").length;
  document.getElementById("completedCourses").textContent = courses.filter(c => c.status === "completed").length;
  document.getElementById("reviewedCourses").textContent = courses.filter(c => c.review).length;
}

function reviewCourse(id) {
  const course = courses.find(c => Number(c.id) === Number(id));
  if (!course) return;

  if (course.status !== "completed") {
    showToast("รีวิวได้เฉพาะคอร์สที่เรียนจบแล้ว", "error");
    return;
  }

  selectedReviewCourseId = id;
  document.getElementById("reviewCourseTitle").textContent = `${course.subject} - ${course.tutor.name}`;
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
  if (!course) { showToast("ไม่พบคอร์สที่ต้องการรีวิว", "error"); return; }

  const token = getAuthToken();
  if (!token) { window.location.href = "/login"; return; }

  const rating  = Number(document.getElementById("reviewRating").value);
  const comment = document.getElementById("reviewComment").value.trim();

  if (!rating || rating < 1 || rating > 5) { showToast("กรุณาเลือกคะแนน 1-5 ดาว", "error"); return; }
  if (!comment) { showToast("กรุณาเขียนข้อความรีวิว", "error"); return; }
  if (!course.app_id) { showToast("คอร์สนี้ยังไม่มี app_id จึงยังบันทึกรีวิวไม่ได้", "error"); return; }

  try {
    const response = await fetch("/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ app_id: course.app_id, rating, comment })
    });
    const result = await response.json();

    if (!response.ok || result.status !== "success") {
      showToast(result.message || "บันทึกรีวิวไม่สำเร็จ", "error");
      return;
    }

    course.rating = rating;
    course.review = comment;
    closeReviewModal();
    renderCourses();
    showToast("บันทึกรีวิวสำเร็จ", "success");
  } catch (error) {
    console.error(error);
    showToast("เชื่อมต่อ backend ไม่สำเร็จ", "error");
  }
}

function viewDetail(id) {
  const course = courses.find(c => Number(c.id) === Number(id));
  if (!course) return;

  document.getElementById("detailModal")?.remove();

  const modal = document.createElement("div");
  modal.id = "detailModal";
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9999;
    display:flex;align-items:center;justify-content:center;padding:20px;
  `;
  modal.innerHTML = `
    <div style="background:linear-gradient(135deg,#181b3a,#221d4e);
      border:1px solid rgba(255,255,255,0.15);border-radius:24px;
      padding:28px;max-width:480px;width:100%;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <h3 style="font-weight:800;">📋 รายละเอียดคอร์ส</h3>
        <button onclick="document.getElementById('detailModal').remove()"
          style="background:rgba(255,255,255,0.1);border:none;color:white;padding:8px 14px;border-radius:10px;cursor:pointer">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;color:#d7dcff;font-size:0.95rem;line-height:1.8;">
        <div><strong>วิชา:</strong> ${escapeHtml(course.subject)}</div>
        <div><strong>ชื่อคอร์ส:</strong> ${escapeHtml(course.title)}</div>
        <div><strong>ติวเตอร์:</strong> ${escapeHtml(course.tutor.name)}</div>
        <div><strong>อีเมล:</strong> ${escapeHtml(course.tutor.email)}</div>
        <div><strong>ราคา:</strong> ${formatMoney(course.price)}</div>
        <div><strong>สถานะ:</strong> ${escapeHtml(course.statusText)}</div>
      </div>
    </div>
  `;
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

async function payCourse(id) {
  const course = courses.find(c => Number(c.id) === Number(id));
  if (!course) return;
  if (!course.app_id) { showToast("ไม่พบ app_id ของคอร์สนี้", "error"); return; }

  const token = getAuthToken();
  if (!token) { window.location.href = "/login"; return; }

  if (!confirm(`ยืนยันการชำระเงิน ${formatMoney(course.price)} สำหรับวิชา ${course.subject}?`)) return;

  try {
    const response = await fetch("/student/api/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ app_id: course.app_id })
    });
    const result = await response.json();

    if (!response.ok || result.status !== "success") {
      showToast(result.message || "ชำระเงินไม่สำเร็จ", "error");
      return;
    }

    showToast(`ชำระเงินสำเร็จ! ยอดเงินคงเหลือ: ฿${Number(result.new_balance || 0).toLocaleString("th-TH")}`, "success");
    loadCoursesFromDB();
  } catch (error) {
    console.error(error);
    showToast("เชื่อมต่อ backend ไม่สำเร็จ", "error");
  }
}

searchInput.addEventListener("input", renderCourses);
statusFilter.addEventListener("change", renderCourses);
refreshBtn.addEventListener("click", loadCoursesFromDB);
document.addEventListener("DOMContentLoaded", loadCoursesFromDB);
