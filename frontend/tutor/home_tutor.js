const TOKEN = localStorage.getItem('token');
const USER_ID = localStorage.getItem('user_id');
const ROLE = localStorage.getItem('user_role');

if (!TOKEN || ROLE !== 'tutor') {
  localStorage.clear();
  window.location.href = '/login';
}

function authHeader() {
  return { 'Authorization': `Bearer ${TOKEN}` };
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

let reviews = [
  { title: "รีวิวจากนักเรียน A", meta: "⭐ 5.0 คะแนน", desc: "ติวเตอร์สอนเข้าใจง่ายมาก ใจเย็น และอธิบายละเอียดสุด ๆ" },
  { title: "รีวิวจากนักเรียน B", meta: "⭐ 4.8 คะแนน", desc: "สอนสนุก เป็นกันเอง มีเทคนิคจำที่ช่วยให้ทำโจทย์ได้เร็วขึ้น" }
];

function goToEditProfile() {
  window.location.href = '/profile/tutor/edit';
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatMap(val) {
  return { online: 'ออนไลน์', onsite: 'ออนไซต์', both: 'ออนไลน์ / ออนไซต์' }[val] || val;
}

function getJobBadge(status) {
  if (status === 'open') return '<span class="badge badge-open">เหมาะกับคุณ</span>';
  if (status === 'warning') return '<span class="badge badge-warning">ด่วน</span>';
  return '<span class="badge badge-done">ปิดแล้ว</span>';
}

function renderJobs() {
  const jobList = document.getElementById('jobList');
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
    </div>`;
  }).join('');
}

function renderSchedules() {
  const list = document.getElementById('scheduleList');
  if (schedules.length === 0) {
    list.innerHTML = '<div class="empty-state">ยังไม่มีตารางสอน<br>รอนักเรียน accept ใบสมัครของคุณ 🎯</div>';
    return;
  }
  const fmtMode = v => ({ online: 'ออนไลน์', onsite: 'ออนไซต์', both: 'ออนไลน์ / ออนไซต์' }[v] || v);
  list.innerHTML = schedules.map(item => `
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
        <span class="badge badge-open">Confirmed</span>
      </div>
      <div class="item-desc">💰 ${item.budget} บาท/ชม.</div>
    </div>
  `).join('');
}

function renderReviews() {
  const reviewList = document.getElementById('reviewList');
  if (!reviewList) return;
  if (reviews.length === 0) {
    reviewList.innerHTML = '<div class="empty-state">ยังไม่มีรีวิว</div>';
    return;
  }
  reviewList.innerHTML = reviews.map((item, i) => `
    <div class="review-card">
      <div class="item-top">
        <div>
          <div class="item-title">${item.title}</div>
          <div class="item-meta">${item.meta}</div>
        </div>
        <span class="badge badge-done">Review</span>
      </div>
      <div class="item-desc">${item.desc}</div>
      <div class="item-actions">
        <button class="small-btn view-btn"   onclick="editReview(${i})">✏️ Edit</button>
        <button class="small-btn delete-btn" onclick="deleteReview(${i})">🗑️ Delete</button>
      </div>
    </div>
  `).join('');
}

function addReview() {
  const title = prompt('กรอกหัวข้อรีวิว'); if (!title) return;
  const meta = prompt('กรอกคะแนน เช่น ⭐ 5.0'); if (!meta) return;
  const desc = prompt('กรอกรายละเอียด'); if (!desc) return;
  reviews.unshift({ title, meta, desc });
  renderReviews();
}

function editReview(i) {
  const r = reviews[i];
  const t = prompt('แก้ไขหัวข้อ', r.title); if (t === null) return;
  const m = prompt('แก้ไขคะแนน', r.meta); if (m === null) return;
  const d = prompt('แก้ไขรายละเอียด', r.desc); if (d === null) return;
  reviews[i] = { title: t, meta: m, desc: d };
  renderReviews();
}

function deleteReview(i) {
  if (!confirm('ลบรีวิวนี้?')) return;
  reviews.splice(i, 1);
  renderReviews();
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
    .then(res => { if (handleAuthError(res)) return null; return res.json(); })
    .then(data => {
      if (!data) return;
      jobs = data.data || [];
      renderJobs();
    })
    .catch(() => { document.getElementById('jobList').innerHTML = '<div class="empty-state">โหลดข้อมูลไม่สำเร็จ</div>'; });
}

function loadMyApplications() {
  return fetch('/tutor/my-applications', { headers: authHeader() })
    .then(res => { if (handleAuthError(res)) return null; return res.json(); })
    .then(data => { if (data) myApplications = data.data || []; })
    .catch(() => { myApplications = []; });
}

function loadDashboard() {
  return fetch('/tutor/dashboard', { headers: authHeader() })
    .then(res => { if (handleAuthError(res)) return null; return res.json(); })
    .then(data => { if (data) updateStats(data.data || {}); })
    .catch(() => updateStats({}));
}

function loadSchedule() {
  return fetch('/tutor/schedule', { headers: authHeader() })
    .then(res => { if (handleAuthError(res)) return null; return res.json(); })
    .then(data => {
      if (!data) return;
      schedules = data.data || [];
      renderSchedules();
      document.getElementById('statTeachingNow').textContent = schedules.length;
      document.getElementById('heroClasses').textContent = schedules.length;
    })
    .catch(() => { document.getElementById('scheduleList').innerHTML = '<div class="empty-state">โหลดตารางสอนไม่สำเร็จ</div>'; });
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
      alert(data.message || 'สมัครเรียบร้อย');
      if (data.status === 'success') {
        loadMyApplications().then(() => renderJobs());
        loadDashboard();
      }
    })
    .catch(() => alert('เกิดข้อผิดพลาด ไม่สามารถสมัครได้'));
}

function refreshDashboard() {
  Promise.allSettled([loadMyApplications(), loadDashboard(), loadSchedule()])
    .then(() => loadJobs())
    .then(() => renderReviews());
}

document.getElementById('logout').addEventListener('click', function () {
  if (!confirm('ออกจากระบบ?')) return;
  localStorage.clear();
  window.location.href = '/login';
});

document.addEventListener('DOMContentLoaded', function () {
  renderReviews();
  refreshDashboard();
});
