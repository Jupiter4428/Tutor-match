const USER_ID = localStorage.getItem('user_id');
const TOKEN = localStorage.getItem('token');
const ROLE = localStorage.getItem('user_role');

if (!TOKEN || ROLE !== 'student') {
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

const postMessage = document.getElementById("post-message");
const myPostsList = document.getElementById("myPostsList");

let myPosts = [];
let appliedTutorIds = new Set();

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showMessage(message, type = "success") {
  postMessage.className = "post-message " + type;
  postMessage.textContent = message;
}

function clearForm() {
  ["subject", "level", "budget", "mode", "location", "studyTime", "description"]
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
}

function getStatusLabel(status) {
  if (status === "open") return '<span class="badge badge-open">เปิดรับ</span>';
  if (status === "closed") return '<span class="badge badge-closed">ปิดแล้ว</span>';
  return '<span class="badge badge-progress">กำลังดำเนินการ</span>';
}

function renderPosts() {
  if (myPosts.length === 0) {
    myPostsList.innerHTML = `
      <div class="empty-state">
        ยังไม่มีประกาศของคุณในตอนนี้<br>
        เริ่มสร้างโพสต์แรกได้เลย ✨
      </div>`;
    updateStats();
    return;
  }

  myPostsList.innerHTML = myPosts.map(post => {
    const safeSubject = escapeHtml(post.subject);
    const safeGrade   = escapeHtml(post.grade_level || '-');
    const safeBudget  = escapeHtml(post.budget || 0);
    const safeFormat  = escapeHtml(post.learning_format || '-');
    const safeTime    = escapeHtml(post.preferred_time || '-');
    const safeLocation = escapeHtml(post.location || '-');
    const safeDesc    = escapeHtml(post.description || 'ไม่มีรายละเอียดเพิ่มเติม');

    return `
      <div class="request-card">
        <div class="item-top">
          <div>
            <div class="item-title">${safeSubject}</div>
            <div class="item-meta">
              ระดับ: ${safeGrade}<br>
              งบ: ${safeBudget} บาท/ชม. | รูปแบบ: ${safeFormat}<br>
              เวลา: ${safeTime}<br>
              📍 ${safeLocation}
              ${post.applicant_count > 0
                ? `<br>👥 ผู้สมัคร <strong>${post.applicant_count}</strong> คน`
                : ""}
            </div>
          </div>
          ${getStatusLabel(post.status)}
        </div>
        <div class="item-desc">${safeDesc}</div>
        <div class="item-actions">
          ${post.applicant_count > 0
            ? `<button class="small-btn match-btn" onclick="viewApplicants(${post.post_id})">👥 ดูผู้สมัคร</button>`
            : ""}
          <button class="small-btn delete-btn" onclick="deletePost(${post.post_id})">ลบ</button>
        </div>
      </div>
    `;
  }).join("");

  updateStats();
}

function updateStats() {
  const total   = myPosts.length;
  const open    = myPosts.filter(p => p.status === "open").length;
  const matched = myPosts.filter(p => p.status === "closed").length;
  const pending = total - open - matched;

  document.getElementById("totalPosts").textContent = total;
  document.getElementById("openPosts").textContent = open;
  document.getElementById("matchedTutors").textContent = matched;

  document.getElementById("statTotalPosts").textContent = total;
  document.getElementById("statOpenPosts").textContent = open;
  document.getElementById("statPendingPosts").textContent = pending;
  document.getElementById("statMatchedPosts").textContent = matched;
}

function submitPost() {
  const subject        = document.getElementById("subject").value.trim();
  const grade_level    = document.getElementById("level").value;
  const budget         = document.getElementById("budget").value.trim();
  const modeEl         = document.getElementById("mode").value;
  const location       = document.getElementById("location").value.trim();
  const preferred_time = document.getElementById("studyTime").value.trim();
  const description    = document.getElementById("description").value.trim();

  if (!subject || !grade_level || !budget || !modeEl || !location) {
    showMessage("กรุณากรอกข้อมูลสำคัญให้ครบ (วิชา ระดับ งบ รูปแบบ สถานที่)", "error");
    return;
  }

  const formatMap = { "ออนไลน์": "online", "ออนไซต์": "onsite", "ได้ทั้งสองแบบ": "both" };
  const learning_format = formatMap[modeEl] || "both";

  fetch("/student/post", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({
      subject, grade_level, learning_format,
      location, preferred_time, description,
      budget: parseFloat(budget)
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        showMessage("ลงประกาศสำเร็จแล้ว! 🎉", "success");
        clearForm();
        loadMyPosts();
        scrollToSection("my-posts-section");
      } else {
        showMessage(data.message || "เกิดข้อผิดพลาด", "error");
      }
    })
    .catch(() => showMessage("ไม่สามารถติดต่อ server ได้", "error"));
}

function loadMyPosts() {
  fetch(`/student/posts`, { headers: authHeader() })
    .then(res => {
      if (handleAuthError(res)) return null;
      return res.json();
    })
    .then(data => {
      if (!data) return;
      myPosts = data.data || [];
      renderPosts();
      loadAppliedTutorIds().then(() => updateMatchedTutors());
    })
    .catch(err => {
      console.error(err);
      showMessage("โหลดข้อมูลไม่สำเร็จ", "error");
    });
}

function deletePost(post_id) {
  if (!confirm("คุณต้องการลบประกาศนี้ใช่หรือไม่?")) return;

  fetch(`/student/post/${post_id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({})
  })
    .then(res => res.json())
    .then(data => {
      showMessage(data.message || "ลบเรียบร้อย", data.status === "success" ? "success" : "error");
      if (data.status === "success") loadMyPosts();
    })
    .catch(() => {
      myPosts = myPosts.filter(p => p.post_id !== post_id);
      renderPosts();
      showMessage("ลบประกาศเรียบร้อยแล้ว", "success");
    });
}

function viewApplicants(post_id) {
  fetch(`/student/applications/${post_id}`, { headers: authHeader() })
    .then(res => res.json())
    .then(data => {
      if (data.status !== "success" || data.data.length === 0) {
        showMessage("ยังไม่มีผู้สมัครสำหรับโพสต์นี้", "error");
        return;
      }
      showApplicantsModal(post_id, data.data);
    })
    .catch(() => showMessage("โหลดข้อมูลผู้สมัครไม่สำเร็จ", "error"));
}

function showApplicantsModal(post_id, applicants) {
  document.getElementById("applicantsModal")?.remove();

  const rows = applicants.map(a => {
    const safeName = escapeHtml(a.tutor_name);
    const safeRate = escapeHtml(a.hourly_rate || '-');
    const safeBio  = escapeHtml(a.bio || 'ไม่มีข้อมูลเพิ่มเติม');
    return `
      <div style="background:rgba(255,255,255,0.07);border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid rgba(255,255,255,0.1)">
        <div style="font-weight:700;font-size:1rem">${safeName}</div>
        <div style="color:#aeb8e8;font-size:0.9rem;margin:6px 0">ค่าสอน: ${safeRate} บาท/ชม.</div>
        <div style="color:#d7dcff;font-size:0.92rem;margin-bottom:12px">${safeBio}</div>
        ${buildAppActions(a)}
      </div>
    `;
  }).join("");

  const modal = document.createElement('div');
  modal.id = "applicantsModal";
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9999;
    display:flex;align-items:center;justify-content:center;padding:20px
  `;
  modal.innerHTML = `
    <div style="background:linear-gradient(135deg,#181b3a,#221d4e);border:1px solid rgba(255,255,255,0.15);
      border-radius:24px;padding:28px;max-width:560px;width:100%;max-height:80vh;overflow-y:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <h3 style="font-size:1.3rem;font-weight:800">👥 รายชื่อผู้สมัคร</h3>
        <button onclick="document.getElementById('applicantsModal').remove()"
          style="background:rgba(255,255,255,0.1);border:none;color:white;padding:8px 14px;border-radius:10px;cursor:pointer">✕ ปิด</button>
      </div>
      ${rows}
    </div>
  `;
  document.body.appendChild(modal);
}

function buildAppActions(a) {
  const s  = a.application_status;
  const ts = a.teaching_status || 'not_started';
  const ps = a.payment_status  || null;
  const id = a.app_id;
  const btn = (label, onclick, bg) =>
    `<button onclick="${onclick}" style="background:${bg};color:#fff;border:none;padding:8px 18px;
      border-radius:10px;cursor:pointer;font-weight:600;font-size:0.9rem">${label}</button>`;

  if (s === 'pending') {
    return `<div style="display:flex;gap:10px">
      ${btn('✅ ยอมรับ', `respondApp(${id},'accept')`, 'linear-gradient(135deg,#35e0a1,#4da8ff)')}
      ${btn('❌ ปฏิเสธ', `respondApp(${id},'reject')`, 'linear-gradient(135deg,#ff5f7a,#ff2e63)')}
    </div>`;
  }

  if (s === 'rejected') return `<span style="color:#ff5f7a;font-weight:700">❌ ปฏิเสธแล้ว</span>`;

  if (s === 'accepted') {
    if (ts === 'not_started' && !ps) {
      return `<div style="display:flex;gap:10px;flex-wrap:wrap">
        ${btn('💳 ชำระเงิน (Escrow)', `payForApp(${id})`, 'linear-gradient(135deg,#8b6bff,#4da8ff)')}
        ${btn('🚫 ยกเลิก', `cancelBooking(${id})`, 'linear-gradient(135deg,#ff5f7a,#ff2e63)')}
      </div>`;
    }
    if (ts === 'not_started' && ps === 'pending') {
      return `<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <span style="color:#ffd75c;font-weight:700">⏳ รอติวเตอร์เริ่มคลาส</span>
        ${btn('🚫 ยกเลิก (คืน 97%)', `cancelBooking(${id})`, 'linear-gradient(135deg,#ff5f7a,#ff2e63)')}
      </div>`;
    }
    if (ts === 'ongoing') return `<span style="color:#42d8ff;font-weight:700">📖 ติวเตอร์กำลังสอน...</span>`;
    if (ts === 'completed' && ps !== 'completed') {
      return `<div style="display:flex;gap:10px">
        ${btn('✅ ยืนยันการเรียน (Confirm)', `confirmClass(${id})`, 'linear-gradient(135deg,#35e0a1,#4da8ff)')}
      </div>`;
    }
    if (ts === 'completed' && ps === 'completed') {
      return `<span style="color:#35e0a1;font-weight:700">🎉 เรียนเสร็จสมบูรณ์</span>`;
    }
    return `<span style="color:#35e0a1;font-weight:700">✅ ยอมรับแล้ว</span>`;
  }

  return '';
}

async function payForApp(app_id) {
  const res = await fetch('/student/api/pay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ app_id })
  }).then(r => r.json()).catch(() => ({ status: 'error', message: 'เชื่อมต่อไม่สำเร็จ' }));

  document.getElementById('applicantsModal')?.remove();
  showMessage(res.message || 'เกิดข้อผิดพลาด', res.status === 'success' ? 'success' : 'error');
  if (res.status === 'success') {
    clearAppliedCache(); // payment เปลี่ยน payment_status → invalidate
    loadMyPosts();
  }
}

async function confirmClass(app_id) {
  if (!confirm('ยืนยันว่าเรียนครบตามเวลาจริงใช่หรือไม่?\nระบบจะโอนเงินให้ติวเตอร์ทันที')) return;
  const res = await fetch('/student/api/confirm-class', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ app_id })
  }).then(r => r.json()).catch(() => ({ status: 'error', message: 'เชื่อมต่อไม่สำเร็จ' }));

  document.getElementById('applicantsModal')?.remove();
  showMessage(res.message || 'เกิดข้อผิดพลาด', res.status === 'success' ? 'success' : 'error');
  if (res.status === 'success') {
    clearAppliedCache(); // confirm เปลี่ยน teaching_status → invalidate
    loadMyPosts();
  }
}

async function cancelBooking(app_id) {
  if (!confirm('ยกเลิกการจองนี้?\nถ้ายังไม่เรียนจะได้รับเงินคืน 97% (หัก Gateway Fee 3%)')) return;
  const res = await fetch('/student/api/cancel-booking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ app_id })
  }).then(r => r.json()).catch(() => ({ status: 'error', message: 'เชื่อมต่อไม่สำเร็จ' }));

  document.getElementById('applicantsModal')?.remove();
  showMessage(res.message || 'เกิดข้อผิดพลาด', res.status === 'success' ? 'success' : 'error');
  if (res.status === 'success') {
    clearAppliedCache(); // cancel เปลี่ยน application status → invalidate
    loadMyPosts();
  }
}

function respondApp(app_id, action) {
  fetch("/student/respond", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ app_id, action })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("applicantsModal")?.remove();
      showMessage(data.message || "ดำเนินการเรียบร้อย", data.status === "success" ? "success" : "error");
      if (data.status === "success") clearAppliedCache(); // accept/reject เปลี่ยน status → invalidate
      loadMyPosts();
    })
    .catch(() => showMessage("เกิดข้อผิดพลาด", "error"));
}

let allTutors = [];

function loadTutors() {
  fetch("/tutor/list", { method: "GET", headers: authHeader() })
    .then(res => {
      if (handleAuthError(res)) return null;
      return res.json();
    })
    .then(data => {
      if (!data) return;
      allTutors = data.status === "success" ? (data.data || []) : [];
      populateSubjectFilter();
      updateMatchedTutors();
    })
    .catch(err => {
      console.error("โหลด tutor ไม่สำเร็จ:", err);
      document.getElementById("tutorsList").innerHTML = `
        <div class="empty-state">โหลดข้อมูลติวเตอร์ไม่สำเร็จ</div>`;
    });
}

const SUBJECT_GROUPS = [
  { label: "🔢 คณิตศาสตร์และสถิติ", subjects: ["คณิตศาสตร์", "แคลคูลัส", "พีชคณิตเชิงเส้น", "สถิติ", "คณิตศาสตร์ไม่ต่อเนื่อง", "ความน่าจะเป็น", "คณิตศาสตร์วิศวกรรม"] },
  { label: "⚗️ วิทยาศาสตร์", subjects: ["ฟิสิกส์", "เคมี", "ชีววิทยา", "เคมีอินทรีย์", "ชีวเคมี", "จุลชีววิทยา", "กายวิภาคศาสตร์", "สรีรวิทยา", "พันธุศาสตร์"] },
  { label: "💻 คอมพิวเตอร์และเทคโนโลยี", subjects: ["การเขียนโปรแกรม", "Python", "Java", "C / C++", "JavaScript", "Web Development", "Database", "Data Science", "AI / Machine Learning", "Cybersecurity", "Cloud Computing", "Mobile App Development", "โครงสร้างข้อมูลและอัลกอริทึม", "วิศวกรรมซอฟต์แวร์"] },
  { label: "⚙️ วิศวกรรมศาสตร์", subjects: ["วิศวกรรมไฟฟ้า", "วิศวกรรมโยธา", "วิศวกรรมเครื่องกล", "วิศวกรรมอุตสาหการ", "วิศวกรรมเคมี", "วิศวกรรมสิ่งแวดล้อม", "อิเล็กทรอนิกส์", "วงจรไฟฟ้า", "ระบบควบคุม"] },
  { label: "💼 บริหารธุรกิจและเศรษฐศาสตร์", subjects: ["การบัญชี", "การเงิน", "การตลาด", "เศรษฐศาสตร์จุลภาค", "เศรษฐศาสตร์มหภาค", "การจัดการ", "การบัญชีต้นทุน", "การเงินองค์กร", "การลงทุน", "ธุรกิจระหว่างประเทศ"] },
  { label: "⚖️ นิติศาสตร์และรัฐศาสตร์", subjects: ["กฎหมายแพ่งและพาณิชย์", "กฎหมายอาญา", "กฎหมายมหาชน", "รัฐศาสตร์", "ความสัมพันธ์ระหว่างประเทศ", "รัฐประศาสนศาสตร์"] },
  { label: "🌐 ภาษาและการสื่อสาร", subjects: ["ภาษาอังกฤษ", "IELTS", "TOEFL", "TOEIC", "ภาษาญี่ปุ่น", "ภาษาจีน", "ภาษาเกาหลี", "ภาษาฝรั่งเศส", "ภาษาเยอรมัน", "ภาษาไทย", "การเขียนเชิงวิชาการ", "การนำเสนอ"] },
  { label: "🏥 วิทยาศาสตร์สุขภาพ", subjects: ["เภสัชวิทยา", "พยาธิวิทยา", "โภชนาการ", "สาธารณสุข", "กายภาพบำบัด", "วิทยาศาสตร์การแพทย์"] },
  { label: "🎨 ศิลปะและมนุษยศาสตร์", subjects: ["ประวัติศาสตร์", "ปรัชญา", "จิตวิทยา", "สังคมวิทยา", "มานุษยวิทยา", "ศิลปะ", "ดนตรี", "นิเทศศาสตร์"] },
  { label: "🏗️ สถาปัตยกรรมและออกแบบ", subjects: ["สถาปัตยกรรม", "การออกแบบภายใน", "ผังเมือง", "การออกแบบกราฟิก"] },
];

function goToWallet() { window.location.href = "/student/wallet"; }

function populateSubjectFilter() {
  const sel = document.getElementById("tutorSubjectFilter");
  sel.innerHTML = `<option value="">📚 ทุกวิชา</option>`;
  SUBJECT_GROUPS.forEach(group => {
    const og = document.createElement("optgroup");
    og.label = group.label;
    group.subjects.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      og.appendChild(opt);
    });
    sel.appendChild(og);
  });
}

function updateMatchedTutors() {
  if (!allTutors.length) return;

  const openSubjects = [
    ...new Set(myPosts.filter(p => p.status === "open").map(p => p.subject.trim().toLowerCase()))
  ];

  if (!openSubjects.length) {
    document.getElementById("tutorSectionLabel").textContent = "ติวเตอร์ที่แนะนำ";
    renderTutors(allTutors, []);
    return;
  }

  const matched = allTutors.filter(t =>
    (t.subjects || []).some(s =>
      openSubjects.some(os => s.toLowerCase().includes(os) || os.includes(s.toLowerCase()))
    )
  );

  const display = matched.length ? matched : allTutors;
  document.getElementById("tutorSectionLabel").textContent =
    matched.length ? `ติวเตอร์ที่ตรงกับโพสต์ของคุณ (${matched.length} คน)` : "ติวเตอร์ที่แนะนำ";

  renderTutors(sortByApplied(display), openSubjects);
}

const APPLIED_CACHE_KEY = 'appliedTutorIds';

// อ่าน cache ก่อน — ถ้ามีให้ใช้เลย ไม่ยิง API
// invalidate cache ด้วย clearAppliedCache() หลัง action สำคัญ
async function loadAppliedTutorIds() {
  const cached = sessionStorage.getItem(APPLIED_CACHE_KEY);
  if (cached) {
    appliedTutorIds = new Set(JSON.parse(cached));
    return;
  }

  // ยังไม่มี cache → fetch จริง (N+1 ตามเดิม แต่เกิดเฉพาะครั้งแรก)
  appliedTutorIds.clear();
  const openWithApplicants = myPosts.filter(p => p.status === "open" && p.applicant_count > 0);
  await Promise.all(openWithApplicants.map(async post => {
    try {
      const res  = await fetch(`/student/applications/${post.post_id}`, { headers: authHeader() });
      const data = await res.json();
      if (data.status === "success") {
        data.data.forEach(a => { if (a.tutor_id) appliedTutorIds.add(Number(a.tutor_id)); });
      }
    } catch (err) {
      console.error("loadAppliedTutorIds error:", err);
    }
  }));

  // เก็บ cache ไว้ใช้ครั้งต่อไปใน session นี้
  sessionStorage.setItem(APPLIED_CACHE_KEY, JSON.stringify([...appliedTutorIds]));
}

// เรียกหลังทุก action ที่เปลี่ยนสถานะ application → บังคับ fetch ใหม่ครั้งหน้า
function clearAppliedCache() {
  sessionStorage.removeItem(APPLIED_CACHE_KEY);
}

function sortByApplied(tutors) {
  return [...tutors].sort((a, b) => {
    const aApplied = appliedTutorIds.has(Number(a.tutor_id)) ? 0 : 1;
    const bApplied = appliedTutorIds.has(Number(b.tutor_id)) ? 0 : 1;
    return aApplied - bApplied;
  });
}

function filterTutors() {
  const subj = document.getElementById("tutorSubjectFilter").value;
  const fmt  = document.getElementById("tutorFormatFilter").value;

  const filtered = allTutors.filter(t => {
    const matchSubj = !subj || (t.subjects || []).includes(subj);
    const matchFmt  = !fmt  || !t.format || t.format === fmt;
    return matchSubj && matchFmt;
  });

  renderTutors(sortByApplied(filtered), []);
}

function renderTutors(tutors, matchedSubjects = []) {
  const list = document.getElementById("tutorsList");
  if (!tutors.length) {
    list.innerHTML = `<div class="empty-state">ไม่พบติวเตอร์ที่ตรงกับเงื่อนไข</div>`;
    return;
  }

  list.innerHTML = tutors.map(t => {
    const safeName = escapeHtml(t.name || '-');
    const safeBio  = escapeHtml(t.bio || 'ยังไม่มีข้อมูลแนะนำตัว');
    const rating   = t.avg_rating ? parseFloat(t.avg_rating).toFixed(1) : null;
    const ratingHtml = rating ? `⭐ ${rating}` : `⭐ ใหม่`;
    const expHtml  = t.experience_years
      ? `ประสบการณ์ ${t.experience_years} ปี`
      : (t.experiences?.length ? `ประสบการณ์ ${t.experiences.length} รายการ` : "");
    const rate     = t.hourly_rate ? `฿${Number(t.hourly_rate).toLocaleString()}/ชม.` : "";
    const metaParts = [ratingHtml, t.format || "", expHtml, rate].filter(Boolean);

    const subjectPills = (t.subjects || []).map(s => {
      const safeS = escapeHtml(s);
      const isMatch = matchedSubjects.some(os =>
        s.toLowerCase().includes(os) || os.includes(s.toLowerCase())
      );
      return isMatch
        ? `<span style="background:rgba(99,185,255,0.25);color:#63b9ff;border:1px solid rgba(99,185,255,0.4);border-radius:6px;padding:2px 8px;font-size:0.78rem;font-weight:600">${safeS}</span>`
        : `<span style="background:rgba(255,255,255,0.07);color:#aeb8e8;border-radius:6px;padding:2px 8px;font-size:0.78rem">${safeS}</span>`;
    }).join(" ");

    const isApplied = appliedTutorIds.has(Number(t.tutor_id));
    const badge = isApplied
      ? `<span class="badge badge-progress">📩 สมัครแล้ว</span>`
      : (t.avg_rating >= 4.8 && t.review_count > 2)
        ? `<span class="badge badge-progress">🔥 Popular</span>`
        : `<span class="badge badge-open">Available</span>`;

    const matchTag = matchedSubjects.length &&
      (t.subjects || []).some(s => matchedSubjects.some(os =>
        s.toLowerCase().includes(os) || os.includes(s.toLowerCase())
      ))
      ? `<span style="font-size:0.75rem;color:#63b9ff;margin-left:6px">✦ ตรงกับโพสต์ของคุณ</span>`
      : "";

    return `
      <div class="tutor-card">
        <div class="item-top">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin-bottom:6px">
              <span class="item-title" style="margin:0">${safeName}</span>
              ${matchTag}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">
              ${subjectPills || "<span style='color:#aeb8e8;font-size:0.8rem'>ไม่ระบุวิชา</span>"}
            </div>
            <div class="item-meta">${metaParts.map(escapeHtml).join(" | ")}</div>
          </div>
          ${badge}
        </div>
        <div class="item-desc">${safeBio}</div>
        <div class="item-actions">
          <button class="small-btn view-btn" onclick="showTutorProfile(${t.tutor_id})">👤 ดูโปรไฟล์</button>
          <button class="small-btn match-btn" onclick="contactTutor(${t.tutor_id}, ${JSON.stringify(t.name || '')})">💬 ติดต่อทันที</button>
        </div>
      </div>`;
  }).join("");
}

function showTutorProfile(tutor_id) {
  fetch(`/tutor/profile/${tutor_id}`, { headers: authHeader() })
    .then(res => res.json())
    .then(data => {
      if (data.status !== "success") { showToast("ไม่สามารถโหลดโปรไฟล์ได้", "error"); return; }
      openTutorModal(data.data);
    })
    .catch(() => showToast("เกิดข้อผิดพลาดในการโหลดโปรไฟล์", "error"));
}

function openTutorModal(t) {
  document.getElementById("tutorProfileModal")?.remove();

  const safeName  = escapeHtml(t.name || '-');
  const safeBio   = escapeHtml(t.bio || 'ยังไม่มีข้อมูลแนะนำตัว');
  const rating    = t.avg_rating ? parseFloat(t.avg_rating).toFixed(1) : "N/A";
  const rate      = t.hourly_rate ? `฿${Number(t.hourly_rate).toLocaleString()}/ชม.` : "-";
  const initial   = (t.name || 'T')[0].toUpperCase();

  const modal = document.createElement("div");
  modal.id = "tutorProfileModal";
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;
    display:flex;align-items:center;justify-content:center;padding:20px;
  `;
  modal.innerHTML = `
    <div style="background:linear-gradient(135deg,#181b3a,#221d4e);
      border:1px solid rgba(255,255,255,0.15);border-radius:24px;
      padding:32px;max-width:560px;width:100%;max-height:85vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:22px;">
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="width:64px;height:64px;border-radius:18px;
            background:linear-gradient(135deg,#ff4fd8,#7b61ff);
            display:flex;align-items:center;justify-content:center;
            font-size:1.8rem;font-weight:800;flex-shrink:0;">${initial}</div>
          <div>
            <div style="font-size:1.25rem;font-weight:800;">${safeName}</div>
            <div style="color:#aeb8e8;font-size:0.92rem;margin-top:4px;">⭐ ${rating} &nbsp;|&nbsp; ${escapeHtml(rate)}</div>
          </div>
        </div>
        <button onclick="document.getElementById('tutorProfileModal').remove()"
          style="background:rgba(255,255,255,0.1);border:none;color:white;
                 padding:8px 14px;border-radius:10px;cursor:pointer;font-size:0.9rem;">✕</button>
      </div>

      <div style="margin-bottom:18px;">
        <div style="font-weight:700;margin-bottom:8px;color:#fff;">📚 วิชาที่สอน</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${(t.subjects || []).map(s =>
            `<span style="background:rgba(77,168,255,0.16);color:#bfe1ff;
              border:1px solid rgba(77,168,255,0.25);padding:6px 12px;
              border-radius:999px;font-size:0.88rem;">${escapeHtml(s)}</span>`
          ).join("") || "<span style='color:#aeb8e8;'>ยังไม่ระบุ</span>"}
        </div>
      </div>

      <div style="margin-bottom:18px;">
        <div style="font-weight:700;margin-bottom:8px;color:#fff;">📝 แนะนำตัว</div>
        <div style="color:#d7dcff;line-height:1.75;font-size:0.95rem;">${safeBio}</div>
      </div>

      ${(t.experiences || []).length ? `
      <div style="margin-bottom:22px;">
        <div style="font-weight:700;margin-bottom:10px;color:#fff;">🏆 ประสบการณ์</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${(t.experiences || []).map(e =>
            `<div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
              border-radius:12px;padding:12px 14px;color:#d7dcff;font-size:0.93rem;">${escapeHtml(e)}</div>`
          ).join("")}
        </div>
      </div>` : ""}

      <button onclick="contactTutor(${t.tutor_id}, ${JSON.stringify(t.name || '')});document.getElementById('tutorProfileModal').remove();"
        style="width:100%;background:linear-gradient(135deg,#ff4fd8,#7b61ff);
          color:white;border:none;padding:14px;border-radius:16px;
          font-weight:700;font-size:1rem;cursor:pointer;transition:0.2s ease;">
        💬 ติดต่อทันที
      </button>
    </div>
  `;
  document.body.appendChild(modal);
}

function contactTutor(tutor_id, name) {
  showMessage(`เลือกติวเตอร์ "${escapeHtml(name)}" แล้ว — สร้างโพสต์เพื่อส่งคำเชิญ 🎉`, "success");
  scrollToSection("create-post-section");
}

function refreshDashboard() {
  loadMyPosts();
  showMessage("รีเฟรชข้อมูลหน้า Dashboard เรียบร้อย", "success");
}

document.getElementById("logout").addEventListener("click", function () {
  if (!confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) return;
  localStorage.removeItem("token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_id");
  window.location.href = "/login";
});

loadMyPosts();
loadTutors();
