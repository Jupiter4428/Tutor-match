const TOKEN = localStorage.getItem('token');
const USER_ID = localStorage.getItem('user_id');
const ROLE = localStorage.getItem('user_role');

if (!TOKEN || ROLE !== 'tutor') {
  localStorage.clear();
  window.location.href = '/login';
}

function authHeader() {
  return { Authorization: `Bearer ${TOKEN}` };
}

function handleAuthError(res) {
  if (res.status === 401 || res.status === 403) {
    localStorage.clear();
    window.location.href = '/login';
    return true;
  }
  return false;
}

let jobs = [];
let myApplications = [];
let schedules = [];
let reviews = [];
let tutorId = null;

function goToEditProfile() {
  window.location.href = '/profile/tutor/edit';
}

function goToWallet() {
  window.location.href = '/tutor/wallet';
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatMap(val) {
  return {
    online: 'ออนไลน์',
    onsite: 'ออนไซต์',
    both: 'ออนไลน์ / ออนไซต์'
  }[val] || val;
}

function getJobBadge(status) {
  if (status === 'open') return '<span class="badge badge-open">เหมาะกับคุณ</span>';
  if (status === 'warning') return '<span class="badge badge-warning">ด่วน</span>';
  return '<span class="badge badge-done">ปิดแล้ว</span>';
}

function renderJobs() {
  const jobList = document.getElementById('jobList');
  if (!jobList) return;

  if (jobs.length === 0) {
    jobList.innerHTML = '<div class="empty-state">ไม่มีงานสอนในขณะนี้ ลองอัปเดตรายการใหม่</div>';
    return;
  }

  jobList.innerHTML = jobs.map(job => {
    const applied = myApplications.some(a => a.post_id === job.post_id);
    return `
      <div class="job-card">
        <div class="item-top">
          <div>
            <div class="item-title">${job.subject}</div>
            <div class="item-meta">
              นักเรียน: ${job.student_name}<br>
              ระดับ: ${job.grade_level || '-'} | งบ: ${job.budget} บาท/ชม.<br>
              รูปแบบ: ${formatMap(job.learning_format)} | 📍 ${job.location}<br>
              เวลา: ${job.preferred_time || '-'}
            </div>
          </div>
          ${getJobBadge(job.status || 'open')}
        </div>
        <div class="item-desc">${job.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</div>
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

function renderSchedules() {
  const list = document.getElementById('scheduleList');
  if (!list) return;

  if (schedules.length === 0) {
    list.innerHTML = '<div class="empty-state">ยังไม่มีตารางสอน<br>รอนักเรียน accept ใบสมัครของคุณ 🎯</div>';
    return;
  }

  const fmtMode = v => ({
    online: 'ออนไลน์',
    onsite: 'ออนไซต์',
    both: 'ออนไลน์ / ออนไซต์'
  }[v] || v);

  list.innerHTML = schedules.map(item => {
    const ts = item.teaching_status || 'not_started';
    const ps = item.payment_status  || null;

    let statusBadge = '<span class="badge badge-open">Confirmed</span>';
    if (ts === 'ongoing')   statusBadge = '<span class="badge badge-warning">กำลังสอน</span>';
    if (ts === 'completed') statusBadge = '<span class="badge badge-done">สอนเสร็จแล้ว</span>';

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
          <div class="item-title">${item.subject} ${item.grade_level ? '(' + item.grade_level + ')' : ''}</div>
          <div class="item-meta">
            🕐 ${item.preferred_time || 'ยังไม่ระบุเวลา'}<br>
            📍 ${item.location || '-'} | ${fmtMode(item.learning_format)}<br>
            👤 นักเรียน: ${item.student_name}
          </div>
        </div>
        ${statusBadge}
      </div>
      <div class="item-desc">💰 ${item.budget} บาท/ชม.</div>
      <div class="item-actions">${actions}</div>
    </div>`;
  }).join('');
}

function renderReviews() {
  const reviewList = document.getElementById('reviewList');
  if (!reviewList) return;

  if (!reviews.length) {
    reviewList.innerHTML = '<div class="empty-state">ยังไม่มีรีวิว</div>';
    return;
  }

  reviewList.innerHTML = reviews.map(r => {
    const rating = Number(r.rating || 0);
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    const safeName = String(r.student_name || 'นักเรียน').replace(/</g, '&lt;');
    const safeComment = String(r.comment || 'ไม่มีความคิดเห็น').replace(/</g, '&lt;');
    const safeSubject = String(r.subject || '-').replace(/</g, '&lt;');
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

async function loadReviews() {
  try {
    if (!tutorId) {
      const res = await fetch('/tutor/profile', { headers: authHeader() });
      const data = await res.json();
      if (data.status === 'success') tutorId = data.data.tutor_id;
    }
    if (!tutorId) return;

    const res = await fetch(`/reviews/tutor/${tutorId}`, { headers: authHeader() });
    const data = await res.json();
    reviews = data.data || [];
    renderReviews();
  } catch (err) {
    console.error('loadReviews error:', err);
    document.getElementById('reviewList').innerHTML =
      '<div class="empty-state">โหลดรีวิวไม่สำเร็จ</div>';
  }
}

function updateStats(dashData) {
  const availableJobs = dashData?.available_jobs ?? jobs.length;
  const teachingNow = dashData?.teaching_now ?? 0;
  const avgRating = dashData?.avg_rating ?? 0.0;
  const monthlyIncome = dashData?.monthly_income ?? 0;
  const incomeDisplay = monthlyIncome > 0 ? monthlyIncome.toLocaleString('th-TH') + ' ฿' : '-';

  document.getElementById('heroJobs').textContent = availableJobs;
  document.getElementById('heroClasses').textContent = teachingNow;
  document.getElementById('heroIncome').textContent = incomeDisplay;
  document.getElementById('heroRating').textContent = avgRating || '-';

  document.getElementById('statAvailableJobs').textContent = availableJobs;
  document.getElementById('statTeachingNow').textContent = teachingNow;
  document.getElementById('statIncome').textContent = incomeDisplay;
  document.getElementById('statRating').textContent = avgRating || '-';
}

function loadJobs(subjectFilter) {
  let url = '/tutor/posts';
  if (subjectFilter) url += `?subject=${encodeURIComponent(subjectFilter)}`;

  fetch(url, { headers: authHeader() })
    .then(res => {
      if (handleAuthError(res)) return null;
      return res.json();
    })
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

async function loadMyApplications() {
  try {
    const res = await fetch('/tutor/my-applications', { headers: authHeader() });
    if (handleAuthError(res)) return;
    const data = await res.json();
    myApplications = data.data || [];
  } catch {
    myApplications = [];
  }
}

async function loadDashboard() {
  try {
    const res = await fetch('/tutor/dashboard', { headers: authHeader() });
    if (handleAuthError(res)) return;
    const data = await res.json();
    updateStats(data.data || {});
  } catch {
    updateStats({});
  }
}

async function loadSchedule() {
  try {
    const res = await fetch('/tutor/schedule', { headers: authHeader() });
    if (handleAuthError(res)) return;
    const data = await res.json();
    schedules = data.data || [];
    renderSchedules();
    document.getElementById('statTeachingNow').textContent = schedules.length;
    document.getElementById('heroClasses').textContent = schedules.length;
  } catch {
    document.getElementById('scheduleList').innerHTML =
      '<div class="empty-state">โหลดตารางสอนไม่สำเร็จ</div>';
  }
}

async function startClass(app_id) {
  if (!confirm('เริ่มคลาสเรียนนี้เลยใช่หรือไม่?')) return;
  const res = await fetch('/tutor/api/class/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ app_id })
  }).then(r => r.json()).catch(() => ({ status: 'error', message: 'เชื่อมต่อไม่สำเร็จ' }));

  alert(res.message || 'เกิดข้อผิดพลาด');
  if (res.status === 'success') loadSchedule();
}

async function endClass(app_id) {
  if (!confirm('จบคลาสนี้แล้วใช่หรือไม่? ระบบจะแจ้งให้นักเรียน Confirm')) return;
  const res = await fetch('/tutor/api/class/end', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ app_id })
  }).then(r => r.json()).catch(() => ({ status: 'error', message: 'เชื่อมต่อไม่สำเร็จ' }));

  alert(res.message || 'เกิดข้อผิดพลาด');
  if (res.status === 'success') loadSchedule();
}

function acceptJob(post_id) {
  if (!confirm('ยืนยันการสมัครรับงานสอนนี้?')) return;

  fetch('/tutor/apply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader()
    },
    body: JSON.stringify({ post_id })
  })
    .then(res => {
      if (handleAuthError(res)) return null;
      return res.json();
    })
    .then(data => {
      if (!data) return;
      alert(data.message || 'สมัครเรียบร้อย');

      if (data.status === 'success') {
        loadMyApplications().then(() => renderJobs());
        loadDashboard();
      }
    })
    .catch(() => alert('เกิดข้อผิดพลาด ไม่สามารถสมัครได้'));
}

async function refreshDashboard() {
  await Promise.allSettled([loadMyApplications(), loadDashboard(), loadSchedule()]);
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