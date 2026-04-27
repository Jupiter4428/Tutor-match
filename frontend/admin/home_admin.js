let users = [];
let filteredUsers = [];
let reports = [];

const token = localStorage.getItem("token");
const apiHeaders = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
};

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
    position:fixed;bottom:24px;right:24px;z-index:99999;
    padding:14px 22px;border-radius:12px;
    font-size:0.95rem;font-weight:600;color:#fff;
    background:${bg};backdrop-filter:blur(8px);
    box-shadow:0 4px 20px rgba(0,0,0,0.35);transition:opacity 0.4s;
  `;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 2800);
}

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
      document.getElementById("totalTutors").textContent   = data.tutors   || 0;
      document.getElementById("totalPosts").textContent    = data.posts    || 0;
      document.getElementById("totalReports").textContent  = data.reports  || 0;
      document.getElementById("heroUsers").textContent     = data.total_users || 0;
      document.getElementById("heroTutors").textContent    = data.tutors   || 0;
      document.getElementById("heroPosts").textContent     = data.posts    || 0;
      document.getElementById("heroReports").textContent   = data.reports  || 0;
      document.getElementById("pendingBadgeCount").textContent = `${data.pending || 0} รายการ`;
      document.getElementById("bannedBadgeCount").textContent  = `${data.banned  || 0} รายการ`;
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
    const isBannedOrSuspended = user.status === "ban" || user.status === "suspended";
    const isTutorPending = user.role === "tutor" && user.verification_status === "pending";

    if (isBannedOrSuspended) {
      // คืนสถานะบัญชีกลับเป็น active (ทั้ง tutor และ student)
      const res = await fetch("/admin/users/status", {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ user_id: id, status: "active" }),
      });
      const result = await res.json();
      if (result.status !== "success") {
        showToast(result.message || "อนุมัติไม่สำเร็จ", 'error');
        return;
      }
    } else if (isTutorPending) {
      // อนุมัติการยืนยันตัวตนของ tutor
      const res = await fetch("/admin/tutors/verify", {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ tutor_id: id, action: "verified" }),
      });
      const result = await res.json();
      if (result.status !== "success") {
        showToast(result.message || "อนุมัติไม่สำเร็จ", 'error');
        return;
      }
    } else {
      // active + verified อยู่แล้ว ไม่ต้องทำอะไร
      showToast(`${user.name} ใช้งานปกติอยู่แล้ว`, 'error');
      return;
    }

    showToast(`อนุมัติผู้ใช้ ${user.name} เรียบร้อยแล้ว`, 'success');
    refreshData();
  } catch {
    showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", 'error');
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
      body: JSON.stringify({ user_id: id, status: "ban" }),
    });
    const result = await response.json();
    if (result.status === "success") {
      showToast(`ระงับผู้ใช้ ${user.name} เรียบร้อยแล้ว`, 'success');
      refreshData();
    } else {
      showToast(result.message || "ระงับไม่สำเร็จ", 'error');
    }
  } catch {
    showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", 'error');
  }
}

async function rejectUser(id) {
  const user = users.find((u) => u.id === id);
  if (!user) return;
  if (!confirm(`ต้องการพักบัญชี ${user.name} ใช่หรือไม่?`)) return;

  try {
    const response = await fetch("/admin/users/status", {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({ user_id: id, status: "suspended" }),
    });
    const result = await response.json();
    if (result.status === "success") {
      showToast(`พักบัญชี ${user.name} เรียบร้อย`, 'success');
      refreshData();
    } else {
      showToast(result.message || "ไม่สำเร็จ", 'error');
    }
  } catch {
    showToast("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้", 'error');
  }
}

function getRoleText(role) {
  if (role === "student") return "นักเรียน";
  if (role === "tutor")   return "ติวเตอร์";
  return "แอดมิน";
}

function getStatusBadge(status) {
  if (status === "active")    return `<span class="badge badge-approved">ใช้งานปกติ</span>`;
  if (status === "suspended") return `<span class="badge badge-pending">พักบัญชี</span>`;
  return `<span class="badge badge-banned">ถูกระงับ</span>`;
}

function getTutorVerifyBadge(verifyStatus, accountStatus) {
  if (accountStatus === "suspended") return `<span class="badge badge-pending">พักบัญชี</span>`;
  if (accountStatus === "ban")       return `<span class="badge badge-banned">ถูกระงับ</span>`;
  if (verifyStatus === "verified")   return `<span class="badge badge-approved">ยืนยันแล้ว</span>`;
  if (verifyStatus === "rejected")   return `<span class="badge badge-banned">ปฏิเสธ</span>`;
  return `<span class="badge badge-pending">รอยืนยัน</span>`;
}

function filterUsers() {
  const search = document.getElementById("searchInput").value.toLowerCase().trim();
  const role   = document.getElementById("roleFilter").value;
  const status = document.getElementById("statusFilter").value;

  filteredUsers = users.filter((user) => {
    const uName  = (user.name  || "").toLowerCase();
    const uEmail = (user.email || "").toLowerCase();
    const matchSearch = uName.includes(search) || uEmail.includes(search);
    const matchRole   = role === "all" || user.role === role;

    let matchStatus = true;
    if (status === "approved") {
      if (user.role === "tutor") {
        matchStatus = user.verification_status === "verified" && user.status === "active";
      } else {
        matchStatus = user.status === "active";
      }
    } else if (status === "pending") {
      matchStatus = user.role === "tutor" && user.verification_status === "pending";
    } else if (status === "banned") {
      matchStatus = user.status === "ban" || user.status === "suspended";
    }

    return matchSearch && matchRole && matchStatus;
  });

  // admin อยู่บนสุดเสมอ
  filteredUsers.sort((a, b) => {
    if (a.role === "admin" && b.role !== "admin") return -1;
    if (a.role !== "admin" && b.role === "admin") return 1;
    return 0;
  });

  renderUsers();
}

function renderUsers() {
  const tbody = document.getElementById("userTableBody");

  if (filteredUsers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#aab3dd; padding:20px;">ไม่พบข้อมูลผู้ใช้</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredUsers.map((user) => {
    const safeName  = escapeHtml(user.name  || '-');
    const safeEmail = escapeHtml(user.email || '-');
    const safeDate  = escapeHtml(user.createdAt || user.created_at || '-');
    return `
      <tr>
        <td>${safeName}</td>
        <td>${safeEmail}</td>
        <td>${getRoleText(user.role)}</td>
        <td>${user.role === "tutor" ? getTutorVerifyBadge(user.verification_status, user.status) : getStatusBadge(user.status)}</td>
        <td>${safeDate}</td>
        <td>
          <div class="action-buttons">
            <button class="small-btn view-btn"    onclick="viewUser(${user.id})">ดู</button>
            <button class="small-btn approve-btn" onclick="approveUser(${user.id})">อนุมัติ</button>
            <button class="small-btn reject-btn"  onclick="rejectUser(${user.id})">พักบัญชี</button>
            <button class="small-btn ban-btn"     onclick="banUser(${user.id})">ระงับ</button>
          </div>
        </td>
      </tr>`;
  }).join("");
}

function renderReports() {
  const reportList = document.getElementById("reportList");

  if (reports.length === 0) {
    reportList.innerHTML = `<div style="text-align:center; padding:20px; color:#aab3dd;">ไม่มีรายงานปัญหาใหม่ 🎉</div>`;
    return;
  }

  const statusBadge = {
    pending:      `<span class="badge badge-pending">รอตรวจสอบ</span>`,
    investigating:`<span class="badge badge-pending">กำลังตรวจสอบ</span>`,
    resolved:     `<span class="badge badge-approved">แก้ไขแล้ว</span>`,
    dismissed:    `<span class="badge badge-banned">ยกเลิก</span>`,
  };
  const targetLabel = { user: "ผู้ใช้", post: "โพสต์", review: "รีวิว", other: "อื่นๆ" };

  reportList.innerHTML = reports.map((item) => `
    <div class="report-card">
      <div class="report-top">
        <div>
          <div class="report-title">${escapeHtml(item.title || '-')}</div>
          <div class="report-meta">
            รายงานโดย: ${escapeHtml(item.reporter_name || '-')} (${escapeHtml(item.reporter_email || '-')}) •
            เป้าหมาย: ${escapeHtml(targetLabel[item.target_type] || item.target_type || '-')} #${escapeHtml(String(item.target_id || '-'))} •
            ${escapeHtml(item.created_at || '')}
          </div>
        </div>
        ${statusBadge[item.status] || statusBadge.pending}
      </div>
      <div class="report-desc">${escapeHtml(item.description || '')}</div>
    </div>
  `).join("");
}

function viewUser(id) {
  const user = users.find((u) => u.id === id);
  if (!user) return;

  const verifyStatusText  = { pending: "รอยืนยัน", verified: "ยืนยันแล้ว", rejected: "ปฏิเสธ" };
  const accountStatusText = { active: "ใช้งานปกติ", suspended: "พักบัญชี", ban: "ระงับแล้ว" };
  const picUrl = user.profile_picture_url || null;

  let rows = `
    <div><span style="color:#8899cc;">ชื่อ:</span> <strong>${escapeHtml(user.name || '-')}</strong></div>
    <div><span style="color:#8899cc;">อีเมล:</span> ${escapeHtml(user.email || '-')}</div>
    <div><span style="color:#8899cc;">บทบาท:</span> ${getRoleText(user.role)}</div>
    <div><span style="color:#8899cc;">สถานะบัญชี:</span> ${escapeHtml(accountStatusText[user.status] || user.status || '-')}</div>
  `;

  if (user.role === "tutor") {
    rows += `<div><span style="color:#8899cc;">สถานะ Verify:</span> ${escapeHtml(verifyStatusText[user.verification_status] || user.verification_status || '-')}</div>`;
    if (picUrl) {
      const safePic = escapeHtml(picUrl);
      rows += `
        <div>
          <span style="color:#8899cc;">รูปโปรไฟล์:</span><br>
          <a href="/${safePic}" target="_blank" rel="noopener"
             style="color:#60a5fa; word-break:break-all; font-size:0.85rem;">/${safePic}</a>
        </div>`;
    } else {
      rows += `<div><span style="color:#8899cc;">รูปโปรไฟล์:</span> <span style="color:#f87171;">ยังไม่ได้อัปโหลด</span></div>`;
    }
  }

  document.getElementById("userModalBody").innerHTML = rows;
  document.getElementById("userModal").style.display = "flex";
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function refreshDashboard() {
  refreshData();
  refreshAdminReviews();
  showToast("รีเฟรชข้อมูลล่าสุดเรียบร้อย", 'success');
}

function refreshData() {
  fetchStats();
  fetchUsers();
  fetchReports();
}

const activities = [
  { title: "ระบบเชื่อมต่อสำเร็จ", meta: "เมื่อสักครู่", desc: "Admin Dashboard ทำการดึงข้อมูลจาก Database เรียบร้อยแล้ว" },
  { title: "เพิ่มกล่องจัดการรีวิว", meta: "วันนี้", desc: "ส่วน Student Review ถูกเพิ่มเข้ามาใน Admin Dashboard แล้ว" },
];

function renderActivities() {
  document.getElementById("activityList").innerHTML = activities.map((item) => `
    <div class="activity-card">
      <div class="activity-top">
        <div>
          <div class="activity-title">${escapeHtml(item.title)}</div>
          <div class="activity-meta">${escapeHtml(item.meta)}</div>
        </div>
        <span class="badge badge-approved">SYSTEM</span>
      </div>
      <div class="activity-desc">${escapeHtml(item.desc)}</div>
    </div>
  `).join("");
}

let adminReviews = [];

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
    year: "numeric", month: "long", day: "numeric",
  });
}

function updateAdminReviewSummary(list = adminReviews) {
  const total = list.length;
  const avg   = total ? list.reduce((sum, r) => sum + Number(r.rating || 0), 0) / total : 0;

  document.getElementById("adminAvgRating").textContent   = avg.toFixed(1);
  document.getElementById("adminAvgStars").textContent    = renderStars(Math.round(avg));
  document.getElementById("adminTotalReviews").textContent = `จากทั้งหมด ${total} รีวิว`;

  for (let i = 1; i <= 5; i++) {
    const count   = list.filter(r => Number(r.rating) === i).length;
    const percent = total ? (count / total) * 100 : 0;
    document.getElementById(`adminBar${i}`).style.width   = `${percent}%`;
    document.getElementById(`adminCount${i}`).textContent = `${count} รีวิว`;
  }
}

function getFilteredAdminReviews() {
  const search  = document.getElementById("adminReviewSearch").value.trim().toLowerCase();
  const subject = document.getElementById("adminReviewSubject").value;
  const rating  = document.getElementById("adminReviewRating").value;
  const sort    = document.getElementById("adminReviewSort").value;

  let list = adminReviews.filter(r => r.is_hidden !== true && r.status !== "deleted");

  list = list.filter(r => {
    const text = `${r.student_name} ${r.tutor_name} ${r.subject} ${r.comment}`.toLowerCase();
    return text.includes(search)
      && (subject === "all" || r.subject === subject)
      && (rating  === "all" || Number(r.rating) >= Number(rating));
  });

  list.sort((a, b) => {
    if (sort === "highest") return Number(b.rating) - Number(a.rating);
    if (sort === "lowest")  return Number(a.rating) - Number(b.rating);
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
            <h4>${escapeHtml(review.student_name || '-')}</h4>
            <p>${escapeHtml(review.subject || '-')}</p>
          </div>
        </div>
        <div class="review-rating-pill">${renderStars(review.rating)}</div>
      </div>
      <div class="review-tutor">ติวเตอร์ที่เรียน: <span>${escapeHtml(review.tutor_name || '-')}</span></div>
      <div class="review-comment">${escapeHtml(review.comment || '')}</div>
      <div class="review-admin-actions">
        <span class="review-date">📅 ${formatThaiDate(review.created_at)}</span>
        <div class="action-buttons">
          <button class="small-btn view-btn"          onclick="viewReview(${review.review_id})">ดู</button>
          <button class="small-btn approve-btn"       onclick="hideReview(${review.review_id})">ซ่อน</button>
          <button class="small-btn review-delete-btn" onclick="deleteReviewAdmin(${review.review_id})">ลบ</button>
        </div>
      </div>
    </div>
  `).join("");
}

function viewReview(id) {
  const review = adminReviews.find(r => r.review_id === id);
  if (!review) return;

  document.getElementById("reviewDetailBody").innerHTML = `
    <div><span style="color:#8899cc;">นักเรียน:</span> <strong>${escapeHtml(review.student_name || '-')}</strong></div>
    <div><span style="color:#8899cc;">ติวเตอร์:</span> ${escapeHtml(review.tutor_name || '-')}</div>
    <div><span style="color:#8899cc;">วิชา:</span> ${escapeHtml(review.subject || '-')}</div>
    <div><span style="color:#8899cc;">คะแนน:</span> ${renderStars(review.rating)} (${review.rating} ดาว)</div>
    <div><span style="color:#8899cc;">วันที่รีวิว:</span> ${formatThaiDate(review.created_at)}</div>
    <div style="margin-top:6px;">
      <span style="color:#8899cc;">ข้อความรีวิว:</span>
      <div style="background:rgba(255,255,255,0.06);border-radius:10px;padding:12px;margin-top:6px;line-height:1.75;color:#d7dcff;">
        ${escapeHtml(review.comment || 'ไม่มีข้อความรีวิว')}
      </div>
    </div>
  `;
  document.getElementById("reviewDetailModal").style.display = "flex";
}

async function hideReview(id) {
  const review = adminReviews.find(r => r.review_id === id);
  if (!review) return;
  if (!confirm(`ต้องการซ่อนรีวิวของ ${review.student_name} ใช่ไหม?`)) return;

  try {
    const res    = await fetch("/admin/reviews/hide", {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({ review_id: id }),
    });
    const result = await res.json();

    if (result.status === "success") {
      review.is_hidden = true;
      showToast("ซ่อนรีวิวเรียบร้อยแล้ว", 'success');
      renderAdminReviews();
    } else {
      showToast(result.message || "ซ่อนรีวิวไม่สำเร็จ", 'error');
    }
  } catch {
    showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", 'error');
  }
}

async function deleteReviewAdmin(id) {
  const review = adminReviews.find(r => r.review_id === id);
  if (!review) return;
  if (!confirm(`ต้องการลบรีวิวของ ${review.student_name} ใช่ไหม? การลบไม่สามารถย้อนกลับได้`)) return;

  try {
    const res    = await fetch(`/admin/reviews/${id}`, {
      method: "DELETE",
      headers: apiHeaders,
    });
    const result = await res.json();

    if (result.status === "success") {
      adminReviews = adminReviews.filter(r => r.review_id !== id);
      showToast("ลบรีวิวเรียบร้อยแล้ว", 'success');
      renderAdminReviews();
    } else {
      showToast(result.message || "ลบรีวิวไม่สำเร็จ", 'error');
    }
  } catch {
    showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", 'error');
  }
}

async function refreshAdminReviews() {
  try {
    const res    = await fetch("/reviews", { headers: apiHeaders });
    const result = await res.json();
    if (result.status === "success") {
      adminReviews = result.data || [];
    }
  } catch (e) {
    console.error("Error fetching reviews:", e);
  }
  renderAdminReviews();
}

document.getElementById("adminReviewSearch").addEventListener("input",  renderAdminReviews);
document.getElementById("adminReviewSubject").addEventListener("change", renderAdminReviews);
document.getElementById("adminReviewRating").addEventListener("change",  renderAdminReviews);
document.getElementById("adminReviewSort").addEventListener("change",    renderAdminReviews);

renderActivities();
refreshData();
refreshAdminReviews();
