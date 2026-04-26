// ============================================================
//  home_tutor.js — Tutor Dashboard
//  ดึง token/role จาก localStorage แล้วตรวจสิทธิ์ทันที
//  ถ้าไม่ใช่ tutor → redirect /login
// ============================================================

const TOKEN   = localStorage.getItem('token');
const USER_ID = localStorage.getItem('user_id');
const ROLE    = localStorage.getItem('user_role');

if (!TOKEN || ROLE !== 'tutor') {
  localStorage.clear();
  window.location.href = '/login';
}

// ---- Auth helpers ----------------------------------------
function authHeader() {
  return { Authorization: `Bearer ${TOKEN}` };
}

// ตรวจ 401/403 → logout อัตโนมัติ
function handleAuthError(res) {
  if (res.status === 401 || res.status === 403) {
    localStorage.clear();
    window.location.href = '/login';
    return true;
  }
  return false;
}

// ---- Utility: ป้องกัน XSS -----------------------------------
// escape ทุก string ที่นำไปแทรก innerHTML เพื่อกัน injection
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// แสดง toast แทน alert() เพื่อไม่ block UI
function showToast(msg, type = 'success') {
  const bg = type === 'success'
    ? 'rgba(53,224,161,0.95)'
    : 'rgba(255,123,146,0.95)';
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
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 2800);
}

// ---- State -----------------------------------------------
let jobs = [];           // งานสอนที่ยังเปิดรับสมัคร
let myApplications = []; // งานที่ tutor สมัครไปแล้ว (ใช้เช็ค "สมัครแล้ว")
let schedules = [];      // ตารางสอนที่ได้รับ accept
let reviews = [];        // รีวิวที่ tutor ได้รับ
let tutorId = null;      // ดึงจาก /tutor/profile ครั้งแรก

// ---- Navigation ------------------------------------------
function goToProfile()     { window.location.href = '/profile/tutor'; }
function goToEditProfile() { window.location.href = '/profile/tutor/edit'; }
function goToWallet()      { window.location.href = '/tutor/wallet'; }

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---- Format helpers --------------------------------------
function formatMap(val) {
  return { online: 'ออนไลน์', onsite: 'ออนไซต์', both: 'ออนไลน์ / ออนไซต์' }[val] || val;
}

function getJobBadge(status) {
  if (status === 'open')    return '<span class="badge badge-open">เหมาะกับคุณ</span>';
  if (status === 'warning') return '<span class="badge badge-warning">ด่วน</span>';
  return '<span class="badge badge-done">ปิดแล้ว</span>';
}

// ============================================================
//  RENDER — วาด UI จาก state ปัจจุบัน
// ============================================================

// วาดรายการงานสอนที่เปิดรับ — ใช้ escapeHtml ทุก field
function renderJobs() {
  const jobList = document.getElementById('jobList');
  if (!jobList) return;

  if (jobs.length === 0) {
    jobList.innerHTML = '<div class="empty-state">ไม่มีงานสอนในขณะนี้ ลองอัปเดตรายการใหม่</div>';
    return;
  }

  jobList.innerHTML = jobs.map(job => {
    const applied = myApplications.some(a => a.post_id === job.post_id);
    const safeSubject   = escapeHtml(job.subject);
    const safeName      = escapeHtml(job.student_name);
    const safeGrade     = escapeHtml(job.grade_level || '-');
    const safeBudget    = escapeHtml(job.budget);
    const safeFormat    = escapeHtml(formatMap(job.learning_format));
    const safeLocation  = escapeHtml(job.location);
    const safeTime      = escapeHtml(job.preferred_time || '-');
    const safeDesc      = escapeHtml(job.description || 'ไม่มีรายละเอียดเพิ่มเติม');

    return `
      <div class="job-card">
        <div class="item-top">
          <div>
            <div class="item-title">${safeSubject}</div>
            <div class="item-meta">
              นักเรียน: ${safeName}<br>
              ระดับ: ${safeGrade} | งบ: ${safeBudget} บาท/ชม.<br>
              รูปแบบ: ${safeFormat} | 📍 ${safeLocation}<br>
              เวลา: ${safeTime}
            </div>
          </div>
          ${getJobBadge(job.status || 'open')}
        </div>
        <div class="item-desc">${safeDesc}</div>
        <div class="item-actions">
          ${applied
            ? '<span style="color:#35e0a1;font-weight:700">✅ สมัครแล้ว</span>'
            : `<button class="small-btn accept-btn" onclick="acceptJob(${job.post_id})">รับงานนี้</button>`
          }
        </div>
      </div>
    `;
  }).join('');
}

// วาดตารางสอน — แสดง action ตาม teaching_status + payment_status
function renderSchedules() {
  const list = document.getElementById('scheduleList');
  if (!list) return;

  if (schedules.length === 0) {
    list.innerHTML = '<div class="empty-state">ยังไม่มีตารางสอน<br>รอนักเรียน accept ใบสมัครของคุณ 🎯</div>';
    return;
  }

  const fmtMode = v => ({ online: 'ออนไลน์', onsite: 'ออนไซต์', both: 'ออนไลน์ / ออนไซต์' }[v] || v);

  list.innerHTML = schedules.map(item => {
    const ts = item.teaching_status || 'not_started';
    const ps = item.payment_status  || null;

    const safeSubject  = escapeHtml(item.subject);
    const safeGrade    = escapeHtml(item.grade_level || '');
    const safeTime     = escapeHtml(item.preferred_time || 'ยังไม่ระบุเวลา');
    const safeLocation = escapeHtml(item.location || '-');
    const safeMode     = escapeHtml(fmtMode(item.learning_format));
    const safeName     = escapeHtml(item.student_name);
    const safeBudget   = escapeHtml(item.budget);

    // badge ตาม teaching_status
    let statusBadge = '<span class="badge badge-open">Confirmed</span>';
    if (ts === 'ongoing')   statusBadge = '<span class="badge badge-warning">กำลังสอน</span>';
    if (ts === 'completed') statusBadge = '<span class="badge badge-done">สอนเสร็จแล้ว</span>';

    // action buttons — ลำดับตาม flow: not_started → ongoing → completed
    let actions = '';
    if (ts === 'not_started' && !ps) {
      actions = `<div style="color:#ffd75c;font-size:0.88rem;margin-top:8px">⏳ รอนักเรียนชำระเงิน</div>`;
    } else if (ts === 'not_started' && ps === 'pending') {
      actions = `<button class="small-btn accept-btn" onclick="startClass(${item.app_id})">▶ Start Class</button>`;
    } else if (ts === 'ongoing') {
      actions = `<button class="small-btn delete-btn" onclick="endClass(${item.app_id})">⏹ End Class</button>`;
    } else if (ts === 'completed' && ps !== 'completed') {
      actions = `<div style="color:#42d8ff;font-size:0.88rem;margin-top:8px">✅ รอนักเรียน Confirm</div>`;
    } else if (ts === 'completed' && ps === 'completed') {
      actions = `<div style="color:#35e0a1;font-size:0.88rem;margin-top:8px">🎉 เสร็จสมบูรณ์ รับเงินแล้ว</div>`;
    }

    return `
    <div class="schedule-card">
      <div class="item-top">
        <div>
          <div class="item-title">${safeSubject}${safeGrade ? ' (' + safeGrade + ')' : ''}</div>
          <div class="item-meta">
            🕐 ${safeTime}<br>
            📍 ${safeLocation} | ${safeMode}<br>
            👤 นักเรียน: ${safeName}
          </div>
        </div>
        ${statusBadge}
      </div>
      <div class="item-desc">💰 ${safeBudget} บาท/ชม.</div>
      <div class="item-actions">${actions}</div>
    </div>`;
  }).join('');
}

// วาดรีวิว — escapeHtml ป้องกัน XSS ทุก field
function renderReviews() {
  const reviewList = document.getElementById('reviewList');
  if (!reviewList) return;

  if (!reviews.length) {
    reviewList.innerHTML = '<div class="empty-state">ยังไม่มีรีวิว</div>';
    return;
  }

  reviewList.innerHTML = reviews.map(r => {
    const rating      = Number(r.rating || 0);
    const stars       = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    const safeName    = escapeHtml(r.student_name || 'นักเรียน');
    const safeComment = escapeHtml(r.comment || 'ไม่มีความคิดเห็น');
    const safeSubject = escapeHtml(r.subject || '-');
    return `
      <div class="review-card">
        <div class="item-top">
          <div>
            <div class="item-title">${safeName}</div>
            <div class="item-meta">${stars} ${rating}.0 | วิชา${safeSubject}</div>
          </div>
          <span class="badge badge-done">Review</span>
        </div>
        <div class="item-desc">${safeComment}</div>
      </div>
    `;
  }).join('');
}

// ============================================================
//  LOAD DATA — ดึงข้อมูลจาก API
// ============================================================

// ดึงรีวิว — ต้องรู้ tutorId ก่อน (ดึงจาก /tutor/profile ถ้ายังไม่มี)
async function loadReviews() {
  try {
    if (!tutorId) {
      const res  = await fetch('/tutor/profile', { headers: authHeader() });
      const data = await res.json();
      if (data.status === 'success') tutorId = data.data.tutor_id;
    }
    if (!tutorId) return;

    const res  = await fetch(`/reviews/tutor/${tutorId}`, { headers: authHeader() });
    const data = await res.json();
    reviews = data.data || [];
    renderReviews();
  } catch (err) {
    console.error('loadReviews error:', err);
    document.getElementById('reviewList').innerHTML =
      '<div class="empty-state">โหลดรีวิวไม่สำเร็จ</div>';
  }
}

// อัปเดต stats cards จาก dashboard API
function updateStats(dashData) {
  const availableJobs  = dashData?.available_jobs ?? jobs.length;
  const teachingNow    = dashData?.teaching_now   ?? 0;
  const avgRating      = dashData?.avg_rating     ?? 0.0;
  const monthlyIncome  = dashData?.monthly_income ?? 0;
  const incomeDisplay  = monthlyIncome > 0
    ? monthlyIncome.toLocaleString('th-TH') + ' ฿' : '-';

  document.getElementById('heroJobs').textContent        = availableJobs;
  document.getElementById('heroClasses').textContent     = teachingNow;
  document.getElementById('heroIncome').textContent      = incomeDisplay;
  document.getElementById('heroRating').textContent      = avgRating || '-';
  document.getElementById('statAvailableJobs').textContent = availableJobs;
  document.getElementById('statTeachingNow').textContent   = teachingNow;
  document.getElementById('statIncome').textContent        = incomeDisplay;
  document.getElementById('statRating').textContent        = avgRating || '-';
}

// ดึงรายการงาน — รองรับ filter วิชา
function loadJobs(subjectFilter) {
  let url = '/tutor/posts';
  if (subjectFilter) url += `?subject=${encodeURIComponent(subjectFilter)}`;

  fetch(url, { headers: authHeader() })
    .then(res => { if (handleAuthError(res)) return null; return res.json(); })
    .then(data => {
      if (!data) return;
      jobs = data.data || [];
      renderJobs();
    })
    .catch(() => {
      document.getElementById('jobList').innerHTML =
        '<div class="empty-state">โหลดข้อมูลไม่สำเร็จ</div>';
    });
}

// ดึงใบสมัครของตัวเอง — ใช้เช็คว่าปุ่มควรเป็น "สมัครแล้ว" หรือเปล่า
async function loadMyApplications() {
  try {
    const res  = await fetch('/tutor/my-applications', { headers: authHeader() });
    if (handleAuthError(res)) return;
    const data = await res.json();
    myApplications = data.data || [];
  } catch {
    myApplications = [];
  }
}

async function loadDashboard() {
  try {
    const res  = await fetch('/tutor/dashboard', { headers: authHeader() });
    if (handleAuthError(res)) return;
    const data = await res.json();
    updateStats(data.data || {});
  } catch {
    updateStats({});
  }
}

// ดึงตารางสอน — อัปเดต statTeachingNow ด้วย
async function loadSchedule() {
  try {
    const res  = await fetch('/tutor/schedule', { headers: authHeader() });
    if (handleAuthError(res)) return;
    const data = await res.json();
    schedules = data.data || [];
    renderSchedules();
    document.getElementById('statTeachingNow').textContent = schedules.length;
    document.getElementById('heroClasses').textContent     = schedules.length;
  } catch {
    document.getElementById('scheduleList').innerHTML =
      '<div class="empty-state">โหลดตารางสอนไม่สำเร็จ</div>';
  }
}

// ============================================================
//  ACTIONS — ส่ง POST ไป backend แล้วอัปเดต UI
// ============================================================

async function startClass(app_id) {
  if (!confirm('เริ่มคลาสเรียนนี้เลยใช่หรือไม่?')) return;
  try {
    const res  = await fetch('/tutor/api/class/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ app_id })
    });
    const data = await res.json();
    showToast(data.message || 'เกิดข้อผิดพลาด', data.status === 'success' ? 'success' : 'error');
    if (data.status === 'success') loadSchedule();
  } catch {
    showToast('เชื่อมต่อไม่สำเร็จ', 'error');
  }
}

async function endClass(app_id) {
  if (!confirm('จบคลาสนี้แล้วใช่หรือไม่? ระบบจะแจ้งให้นักเรียน Confirm')) return;
  try {
    const res  = await fetch('/tutor/api/class/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ app_id })
    });
    const data = await res.json();
    showToast(data.message || 'เกิดข้อผิดพลาด', data.status === 'success' ? 'success' : 'error');
    if (data.status === 'success') loadSchedule();
  } catch {
    showToast('เชื่อมต่อไม่สำเร็จ', 'error');
  }
}

function acceptJob(post_id) {
  if (!confirm('ยืนยันการสมัครรับงานสอนนี้?')) return;

  fetch('/tutor/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ post_id })
  })
    .then(res => { if (handleAuthError(res)) return null; return res.json(); })
    .then(data => {
      if (!data) return;
      showToast(
        data.message || 'สมัครเรียบร้อย',
        data.status === 'success' ? 'success' : 'error'
      );
      if (data.status === 'success') {
        // โหลด applications ใหม่แล้ว re-render job list
        loadMyApplications().then(() => renderJobs());
        loadDashboard();
      }
    })
    .catch(() => showToast('เกิดข้อผิดพลาด ไม่สามารถสมัครได้', 'error'));
}

// ============================================================
//  DASHBOARD INIT — โหลดทุกอย่างพร้อมกัน
// ============================================================

// ใช้ allSettled แทน all เพื่อไม่ให้ error หนึ่งหยุดทุกอย่าง
async function refreshDashboard() {
  const results = await Promise.allSettled([
    loadMyApplications(),
    loadDashboard(),
    loadSchedule()
  ]);
  results.forEach(r => {
    if (r.status === 'rejected') console.error('Dashboard load error:', r.reason);
  });
  loadJobs();
  loadReviews();
}

document.getElementById('logout').addEventListener('click', function () {
  if (!confirm('ออกจากระบบ?')) return;
  localStorage.clear();
  window.location.href = '/login';
});

document.addEventListener('DOMContentLoaded', function () {
  refreshDashboard();
});
