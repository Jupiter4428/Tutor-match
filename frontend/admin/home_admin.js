let users = [];
let filteredUsers = [];
let reports = [];

const token = localStorage.getItem("token");
const apiHeaders = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
};

document.getElementById("logout").addEventListener("click", function () {
  if (!confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) return;
  localStorage.removeItem("token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_id");
  window.location.href = "/login";
});

async function fetchStats() {
  try {
    const response = await fetch("/admin/stats", { headers: apiHeaders });
    const result = await response.json();

    if (result.status === "success") {
      const data = result.data;

      document.getElementById("totalStudents").textContent = data.students || 0;
      document.getElementById("totalTutors").textContent = data.tutors || 0;
      document.getElementById("totalPosts").textContent = data.posts || 0;
      document.getElementById("totalReports").textContent = data.reports || 0;

      document.getElementById("heroUsers").textContent = data.total_users || 0;
      document.getElementById("heroTutors").textContent = data.tutors || 0;
      document.getElementById("heroPosts").textContent = data.posts || 0;
      document.getElementById("heroReports").textContent = data.reports || 0;

      document.getElementById("pendingBadgeCount").textContent = `${data.pending || 0} รายการ`;
      document.getElementById("bannedBadgeCount").textContent = `${data.banned || 0} รายการ`;
    }
  } catch (error) {
    console.error("Error fetching stats:", error);
  }
}

async function fetchUsers() {
  try {
    const response = await fetch("/admin/users", { headers: apiHeaders });
    const result = await response.json();

    if (result.status === "success") {
      users = result.data || [];
      filterUsers();
    }
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

async function fetchReports() {
  try {
    const response = await fetch("/admin/reports", { headers: apiHeaders });
    const result = await response.json();

    if (result.status === "success") {
      reports = result.data || [];
      renderReports();
    }
  } catch (error) {
    console.error("Error fetching reports:", error);
  }
}

async function approveUser(id) {
  const user = users.find((u) => u.id === id);
  if (!user) return;

  try {
    const response = await fetch("/admin/users/status", {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({ user_id: id, status: "approved" }),
    });

    const result = await response.json();

    if (result.status === "success") {
      alert(`อนุมัติผู้ใช้ ${user.name} เรียบร้อยแล้ว`);
      refreshData();
    } else {
      alert(result.message || "อนุมัติไม่สำเร็จ");
    }
  } catch (error) {
    alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
  }
}

async function banUser(id) {
  const user = users.find((u) => u.id === id);
  if (!user) return;

  if (!confirm(`ต้องการระงับผู้ใช้ ${user.name} ใช่หรือไม่?`)) return;

  try {
    const response = await fetch("/admin/users/status", {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({
        user_id: id,
        status: "banned",
        reason: "ถูกระงับโดยผู้ดูแลระบบ",
      }),
    });

    const result = await response.json();

    if (result.status === "success") {
      alert(`ระงับผู้ใช้ ${user.name} เรียบร้อยแล้ว`);
      refreshData();
    } else {
      alert(result.message || "ระงับไม่สำเร็จ");
    }
  } catch (error) {
    alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
  }
}

function getRoleText(role) {
  if (role === "student") return "นักเรียน";
  if (role === "tutor") return "ติวเตอร์";
  return "แอดมิน";
}

function getStatusBadge(status) {
  if (status === "active" || status === "approved") {
    return `<span class="badge badge-approved">ใช้งานปกติ</span>`;
  }

  if (status === "pending") {
    return `<span class="badge badge-pending">รออนุมัติ</span>`;
  }

  return `<span class="badge badge-banned">ถูกระงับ</span>`;
}

function filterUsers() {
  const search = document.getElementById("searchInput").value.toLowerCase().trim();
  const role = document.getElementById("roleFilter").value;
  const status = document.getElementById("statusFilter").value;

  filteredUsers = users.filter((user) => {
    const uName = (user.name || "").toLowerCase();
    const uEmail = (user.email || "").toLowerCase();

    const matchSearch = uName.includes(search) || uEmail.includes(search);
    const matchRole = role === "all" || user.role === role;

    let matchStatus = true;

    if (status === "approved") {
      matchStatus = user.status === "active" || user.status === "approved";
    } else if (status === "banned") {
      matchStatus = user.status === "ban" || user.status === "suspended" || user.status === "banned";
    } else if (status === "pending") {
      matchStatus = user.status === "pending";
    }

    return matchSearch && matchRole && matchStatus;
  });

  renderUsers();
}

function renderUsers() {
  const tbody = document.getElementById("userTableBody");

  if (filteredUsers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#aab3dd; padding:20px;">ไม่พบข้อมูลผู้ใช้</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredUsers.map((user) => `
    <tr>
      <td>${user.name || "-"}</td>
      <td>${user.email || "-"}</td>
      <td>${getRoleText(user.role)}</td>
      <td>${getStatusBadge(user.status)}</td>
      <td>${user.createdAt || user.created_at || "-"}</td>
      <td>
        <div class="action-buttons">
          <button class="small-btn view-btn" onclick="viewUser(${user.id})">ดู</button>
<button class="small-btn approve-btn" onclick="approveUser(${user.id})">อนุมัติ</button>
<button class="small-btn reject-btn" onclick="rejectUser(${user.id})">ไม่อนุมัติ</button>
<button class="small-btn ban-btn" onclick="banUser(${user.id})">ระงับ</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderReports() {
  const reportList = document.getElementById("reportList");

  if (reports.length === 0) {
    reportList.innerHTML = `<div style="text-align:center; padding:20px; color:#aab3dd;">ไม่มีรายงานปัญหาใหม่ 🎉</div>`;
    return;
  }

  const statusBadge = {
    pending: `<span class="badge badge-pending">รอตรวจสอบ</span>`,
    investigating: `<span class="badge badge-pending">กำลังตรวจสอบ</span>`,
    resolved: `<span class="badge badge-approved">แก้ไขแล้ว</span>`,
    dismissed: `<span class="badge badge-banned">ยกเลิก</span>`,
  };

  const targetLabel = {
    user: "ผู้ใช้",
    post: "โพสต์",
    review: "รีวิว",
    other: "อื่นๆ",
  };

  reportList.innerHTML = reports.map((item) => `
    <div class="report-card">
      <div class="report-top">
        <div>
          <div class="report-title">${item.title || "-"}</div>
          <div class="report-meta">
            รายงานโดย: ${item.reporter_name || "-"} (${item.reporter_email || "-"}) •
            เป้าหมาย: ${targetLabel[item.target_type] || item.target_type || "-"} #${item.target_id || "-"} •
            ${item.created_at || ""}
          </div>
        </div>
        ${statusBadge[item.status] || statusBadge.pending}
      </div>
      <div class="report-desc">${item.description || ""}</div>
    </div>
  `).join("");
}

function viewUser(id) {
  const user = users.find((u) => u.id === id);
  if (!user) return;

  alert(
    `[ข้อมูลผู้ใช้]\n` +
    `ชื่อ: ${user.name}\n` +
    `อีเมล: ${user.email}\n` +
    `บทบาท: ${getRoleText(user.role)}\n` +
    `สถานะ: ${user.status}`
  );
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function refreshDashboard() {
  refreshData();
  refreshAdminReviews();
  alert("รีเฟรชข้อมูลล่าสุดเรียบร้อย");
}

function refreshData() {
  fetchStats();
  fetchUsers();
  fetchReports();
}

const activities = [
  {
    title: "ระบบเชื่อมต่อสำเร็จ",
    meta: "เมื่อสักครู่",
    desc: "Admin Dashboard ทำการดึงข้อมูลจาก Database เรียบร้อยแล้ว",
  },
  {
    title: "เพิ่มกล่องจัดการรีวิว",
    meta: "วันนี้",
    desc: "ส่วน Student Review ถูกเพิ่มเข้ามาใน Admin Dashboard แล้ว",
  },
];

function renderActivities() {
  const activityList = document.getElementById("activityList");

  activityList.innerHTML = activities.map((item) => `
    <div class="activity-card">
      <div class="activity-top">
        <div>
          <div class="activity-title">${item.title}</div>
          <div class="activity-meta">${item.meta}</div>
        </div>
        <span class="badge badge-approved">SYSTEM</span>
      </div>
      <div class="activity-desc">${item.desc}</div>
    </div>
  `).join("");
}

let adminReviews = [
  {
    review_id: 1,
    student_name: "พิมพ์ชนก ส.",
    tutor_name: "อาจารย์เมย์",
    subject: "คณิตศาสตร์",
    rating: 5,
    comment: "สอนดีมากค่ะ อธิบายละเอียดและค่อย ๆ พาเข้าใจทีละจุด ติวเตอร์ใจเย็นมากและมีเทคนิคการจำที่ช่วยได้จริงก่อนสอบ",
    created_at: "2026-04-15",
    status: "visible"
  },
  {
    review_id: 2,
    student_name: "ณัฐวุฒิ ท.",
    tutor_name: "ครูพลอย",
    subject: "ภาษาอังกฤษ",
    rating: 5,
    comment: "ประทับใจมากครับ สอน speaking กับ grammar แบบไม่กดดันเลย ทำให้กล้าพูดมากขึ้นจริง ๆ",
    created_at: "2026-04-18",
    status: "visible"
  },
  {
    review_id: 3,
    student_name: "กวางพร ด.",
    tutor_name: "พี่ต้น",
    subject: "ฟิสิกส์",
    rating: 4,
    comment: "ติวเตอร์อธิบายเรื่องแรงและการเคลื่อนที่ได้เข้าใจง่ายมากค่ะ มีสรุปสูตรและตัวอย่างโจทย์ให้ครบ",
    created_at: "2026-04-10",
    status: "visible"
  },
  {
    review_id: 4,
    student_name: "เบญญาภา ค.",
    tutor_name: "พี่ฟ้า",
    subject: "เคมี",
    rating: 5,
    comment: "ก่อนเรียนงงเคมีมาก แต่หลังจากเรียนกับพี่ฟ้ารู้สึกเข้าใจเนื้อหาเป็นระบบขึ้นมาก",
    created_at: "2026-04-08",
    status: "visible"
  },
  {
    review_id: 5,
    student_name: "ศุภชัย ว.",
    tutor_name: "ครูมิน",
    subject: "ชีววิทยา",
    rating: 5,
    comment: "สอนสนุกและมีเทคนิคจำเยอะมากครับ เนื้อหาชีวะที่เยอะ ๆ ดูง่ายขึ้นอย่างไม่น่าเชื่อ",
    created_at: "2026-04-04",
    status: "visible"
  },
  {
    review_id: 6,
    student_name: "ธนภัทร ย.",
    tutor_name: "พี่เกม",
    subject: "Programming",
    rating: 4,
    comment: "ชอบมากครับ เพราะติวเตอร์สอนโค้ดแบบมีตัวอย่างจริง ทำให้คนพื้นฐานน้อยตามทันได้",
    created_at: "2026-04-01",
    status: "visible"
  }
];

function renderStars(rating) {
  const value = Math.max(0, Math.min(5, Number(rating || 0)));
  return "★".repeat(value) + "☆".repeat(5 - value);
}

function getAvatarLetter(name) {
  return String(name || "U").trim().charAt(0).toUpperCase();
}

function formatThaiDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function updateAdminReviewSummary(list = adminReviews) {
  const total = list.length;
  const avg = total ? list.reduce((sum, r) => sum + Number(r.rating || 0), 0) / total : 0;

  document.getElementById("adminAvgRating").textContent = avg.toFixed(1);
  document.getElementById("adminAvgStars").textContent = renderStars(Math.round(avg));
  document.getElementById("adminTotalReviews").textContent = `จากทั้งหมด ${total} รีวิว`;

  for (let i = 1; i <= 5; i++) {
    const count = list.filter(r => Number(r.rating) === i).length;
    const percent = total ? (count / total) * 100 : 0;

    document.getElementById(`adminBar${i}`).style.width = `${percent}%`;
    document.getElementById(`adminCount${i}`).textContent = `${count} รีวิว`;
  }
}

function getFilteredAdminReviews() {
  const search = document.getElementById("adminReviewSearch").value.trim().toLowerCase();
  const subject = document.getElementById("adminReviewSubject").value;
  const rating = document.getElementById("adminReviewRating").value;
  const sort = document.getElementById("adminReviewSort").value;

  let list = adminReviews.filter(review => review.status !== "deleted");

  list = list.filter(review => {
    const text = `
      ${review.student_name}
      ${review.tutor_name}
      ${review.subject}
      ${review.comment}
    `.toLowerCase();

    const matchSearch = text.includes(search);
    const matchSubject = subject === "all" || review.subject === subject;
    const matchRating = rating === "all" || Number(review.rating) >= Number(rating);

    return matchSearch && matchSubject && matchRating;
  });

  list.sort((a, b) => {
    if (sort === "highest") return Number(b.rating) - Number(a.rating);
    if (sort === "lowest") return Number(a.rating) - Number(b.rating);
    if (sort === "student") return String(a.student_name).localeCompare(String(b.student_name), "th");
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return list;
}

function renderAdminReviews() {
  const grid = document.getElementById("adminReviewGrid");
  const list = getFilteredAdminReviews();

  updateAdminReviewSummary(list);

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state">ไม่พบรีวิวที่ตรงกับเงื่อนไข</div>`;
    return;
  }

  grid.innerHTML = list.map(review => `
    <div class="admin-review-card ${Number(review.rating) === 5 ? "featured" : ""}">
      <div class="review-card-top">
        <div class="review-user">
          <div class="review-avatar">${getAvatarLetter(review.student_name)}</div>
          <div>
            <h4>${review.student_name}</h4>
            <p>${review.subject}</p>
          </div>
        </div>
        <div class="review-rating-pill">${renderStars(review.rating)}</div>
      </div>

      <div class="review-tutor">ติวเตอร์ที่เรียน: <span>${review.tutor_name}</span></div>
      <div class="review-comment">${review.comment}</div>

      <div class="review-admin-actions">
        <span class="review-date">📅 ${formatThaiDate(review.created_at)}</span>
        <div class="action-buttons">
          <button class="small-btn view-btn" onclick="viewReview(${review.review_id})">ดู</button>
          <button class="small-btn approve-btn" onclick="hideReview(${review.review_id})">ซ่อน</button>
          <button class="small-btn review-delete-btn" onclick="deleteReviewAdmin(${review.review_id})">ลบ</button>
        </div>
      </div>
    </div>
  `).join("");
}

function viewReview(id) {
  const review = adminReviews.find(r => r.review_id === id);
  if (!review) return;

  alert(
    `[รายละเอียดรีวิว]\n` +
    `นักเรียน: ${review.student_name}\n` +
    `ติวเตอร์: ${review.tutor_name}\n` +
    `วิชา: ${review.subject}\n` +
    `คะแนน: ${review.rating} ดาว\n` +
    `ข้อความ: ${review.comment}`
  );
}

function hideReview(id) {
  const review = adminReviews.find(r => r.review_id === id);
  if (!review) return;

  if (!confirm(`ต้องการซ่อนรีวิวของ ${review.student_name} ใช่ไหม?`)) return;

  review.status = "hidden";
  alert("ซ่อนรีวิวเรียบร้อยแล้ว");
  renderAdminReviews();
}

function deleteReviewAdmin(id) {
  const review = adminReviews.find(r => r.review_id === id);
  if (!review) return;

  if (!confirm(`ต้องการลบรีวิวของ ${review.student_name} ใช่ไหม?`)) return;

  review.status = "deleted";
  alert("ลบรีวิวเรียบร้อยแล้ว");
  renderAdminReviews();
}

async function refreshAdminReviews() {
  renderAdminReviews();

  // ถ้า backend พร้อม ค่อยเปลี่ยนเป็น:
  // const res = await fetch("/admin/reviews", { headers: apiHeaders });
  // const result = await res.json();
  // if (result.status === "success") {
  //   adminReviews = result.data;
  //   renderAdminReviews();
  // }
}

document.getElementById("adminReviewSearch").addEventListener("input", renderAdminReviews);
document.getElementById("adminReviewSubject").addEventListener("change", renderAdminReviews);
document.getElementById("adminReviewRating").addEventListener("change", renderAdminReviews);
document.getElementById("adminReviewSort").addEventListener("change", renderAdminReviews);

document.getElementById("logout").addEventListener("click", function () {
  if (!confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) return;
  localStorage.clear();

  // Live Server
  window.location.href = "../auth/login.html";

  // Flask จริง ใช้อันนี้แทน
  // window.location.href = "/login";
});

renderActivities();
refreshData();
renderAdminReviews();
async function rejectUser(id) {
  const user = users.find((u) => u.id === id);
  if (!user) return;

  if (!confirm(`ต้องการไม่อนุมัติ ${user.name} ใช่หรือไม่?`)) return;

  try {
    const response = await fetch("/admin/users/status", {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({
        user_id: id,
        status: "rejected"
      }),
    });

    const result = await response.json();

    if (result.status === "success") {
      alert(`ไม่อนุมัติ ${user.name} เรียบร้อย`);
      refreshData();
    } else {
      alert(result.message || "ไม่สำเร็จ");
    }
  } catch (error) {
    alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
  }
}