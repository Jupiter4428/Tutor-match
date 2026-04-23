// ============================================================
//  ดึง user_id จาก localStorage (ตั้งค่าตอน login)
//  ถ้ายังไม่มีระบบ login จริง ให้เปลี่ยนค่านี้
// ============================================================
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

const postMessage = document.getElementById("post-message");
const myPostsList = document.getElementById("myPostsList");

let myPosts = [];

// ---- Utility -----------------------------------------------
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

// ---- Render โพสต์ ------------------------------------------
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

  myPostsList.innerHTML = myPosts.map(post => `
        <div class="request-card">
          <div class="item-top">
            <div>
              <div class="item-title">${post.subject}</div>
              <div class="item-meta">
                ระดับ: ${post.grade_level || "-"}<br>
                งบ: ${post.budget || 0} บาท/ชม. | รูปแบบ: ${post.learning_format || "-"}<br>
                เวลา: ${post.preferred_time || "-"}<br>
                📍 ${post.location || "-"}
                ${post.applicant_count > 0
      ? `<br>👥 ผู้สมัคร <strong>${post.applicant_count}</strong> คน`
      : ""}
              </div>
            </div>
            ${getStatusLabel(post.status)}
          </div>

          <div class="item-desc">
            ${post.description || "ไม่มีรายละเอียดเพิ่มเติม"}
          </div>

          <div class="item-actions">
            ${post.applicant_count > 0
      ? `<button class="small-btn match-btn" onclick="viewApplicants(${post.post_id})">👥 ดูผู้สมัคร</button>`
      : ""}
            <button class="small-btn delete-btn" onclick="deletePost(${post.post_id})">ลบ</button>
          </div>
        </div>
      `).join("");

  updateStats();
}

// ---- Stats -------------------------------------------------
function updateStats() {
  const total = myPosts.length;
  const open = myPosts.filter(p => p.status === "open").length;
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

// ---- Submit โพสต์ใหม่ → POST /student/post ----------------
function submitPost() {
  const subject = document.getElementById("subject").value.trim();
  const grade_level = document.getElementById("level").value;
  const budget = document.getElementById("budget").value.trim();
  const modeEl = document.getElementById("mode").value;
  const location = document.getElementById("location").value.trim();
  const preferred_time = document.getElementById("studyTime").value.trim();
  const description = document.getElementById("description").value.trim();

  if (!subject || !grade_level || !budget || !modeEl || !location) {
    showMessage("กรุณากรอกข้อมูลสำคัญให้ครบ (วิชา ระดับ งบ รูปแบบ สถานที่)", "error");
    return;
  }

  // แปลง label ไทย → ENUM value ใน DB
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

// ---- โหลดโพสต์ → GET /student/posts -----------------------
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
      updateMatchedTutors();
    })
    .catch(err => {
      console.error(err);
      showMessage("โหลดข้อมูลไม่สำเร็จ", "error");
    });
}

// ---- ลบโพสต์ (soft-hide ผ่าน admin route หรือ DELETE ถ้ามี)
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
      // fallback: ลบออกจาก UI ก่อน (กรณียังไม่มี DELETE route)
      myPosts = myPosts.filter(p => p.post_id !== post_id);
      renderPosts();
      showMessage("ลบประกาศเรียบร้อยแล้ว", "success");
    });
}

// ---- ดูผู้สมัคร → GET /student/applications/<post_id> -----
function viewApplicants(post_id) {
  fetch(`/student/applications/${post_id}`, { headers: authHeader() })
    .then(res => res.json())
    .then(data => {
      if (data.status !== "success" || data.data.length === 0) {
        alert("ยังไม่มีผู้สมัครสำหรับโพสต์นี้");
        return;
      }
      showApplicantsModal(post_id, data.data);
    })
    .catch(() => alert("โหลดข้อมูลผู้สมัครไม่สำเร็จ"));
}

// ---- Modal แสดงรายชื่อผู้สมัคร ----------------------------
function showApplicantsModal(post_id, applicants) {
  let existing = document.getElementById("applicantsModal");
  if (existing) existing.remove();

  const rows = applicants.map(a => `
        <div style="background:rgba(255,255,255,0.07);border-radius:14px;padding:16px;margin-bottom:12px;border:1px solid rgba(255,255,255,0.1)">
          <div style="font-weight:700;font-size:1rem">${a.tutor_name}</div>
          <div style="color:#aeb8e8;font-size:0.9rem;margin:6px 0">ค่าสอน: ${a.hourly_rate || "-"} บาท/ชม.</div>
          <div style="color:#d7dcff;font-size:0.92rem;margin-bottom:12px">${a.bio || "ไม่มีข้อมูลเพิ่มเติม"}</div>
          ${a.application_status === "pending" ? `
            <div style="display:flex;gap:10px">
              <button onclick="respondApp(${a.app_id},'accept')"
                style="background:linear-gradient(135deg,#35e0a1,#4da8ff);color:#fff;border:none;padding:8px 18px;border-radius:10px;cursor:pointer;font-weight:600">
                ✅ ยอมรับ
              </button>
              <button onclick="respondApp(${a.app_id},'reject')"
                style="background:linear-gradient(135deg,#ff5f7a,#ff2e63);color:#fff;border:none;padding:8px 18px;border-radius:10px;cursor:pointer;font-weight:600">
                ❌ ปฏิเสธ
              </button>
            </div>
          ` : `<span style="color:${a.application_status === 'accepted' ? '#35e0a1' : '#ff5f7a'};font-weight:700">
            ${a.application_status === 'accepted' ? '✅ ยอมรับแล้ว' : '❌ ปฏิเสธแล้ว'}
          </span>`}
        </div>
      `).join("");

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

// ---- ยอมรับ/ปฏิเสธใบสมัคร → POST /student/respond ---------
function respondApp(app_id, action) {
  fetch("/student/respond", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ app_id, action })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("applicantsModal")?.remove();
      showMessage(data.message || "ดำเนินการเรียบร้อย",
        data.status === "success" ? "success" : "error");
      loadMyPosts();
    })
    .catch(() => showMessage("เกิดข้อผิดพลาด", "error"));
}
// ============================================================
//  ติวเตอร์ที่แนะนำ
// ============================================================
let allTutors = [];

const TOY_TUTORS = [
  {
    tutor_id: 1,
    name: "พี่มิน",
    subjects: ["คณิตศาสตร์", "ฟิสิกส์"],
    format: "สอนออนไลน์",
    experience_years: 3,
    avg_rating: 4.9,
    review_count: 12,
    hourly_rate: 350,
    bio: "เชี่ยวชาญเนื้อหา ม.ปลาย และสอบเข้าหาวิทยาลัย อธิบายละเอียด ใจเย็น และมีเอกสารสรุปให้"
  },
  {
    tutor_id: 2,
    name: "พี่บอส",
    subjects: ["Java", "Python", "Web Dev"],
    format: "ออนไลน์ / ออนไซต์",
    experience_years: 2,
    avg_rating: 5.0,
    review_count: 8,
    hourly_rate: 400,
    bio: "เหมาะกับนักศึกษาที่ต้องการปูพื้นฐานเขียนโปรแกรม ทำโปรเจกต์ และเตรียมสอบวิชาเขียนโค้ด"
  },
  {
    tutor_id: 3,
    name: "พี่นิ้ง",
    subjects: ["ภาษาอังกฤษ", "IELTS"],
    format: "สอนออนไลน์",
    experience_years: 5,
    avg_rating: 4.7,
    review_count: 20,
    hourly_rate: 300,
    bio: "ติวสอบ IELTS และพูดคุยได้ทุกเรื่อง เน้นการสื่อสารจริง ไม่ใช่แค่ไวยากรณ์"
  },
  {
    tutor_id: 4,
    name: "พี่เจมส์",
    subjects: ["เคมี", "ชีววิทยา"],
    format: "ออนไซต์ (กรุงเทพ)",
    experience_years: 4,
    avg_rating: 4.8,
    review_count: 15,
    hourly_rate: 380,
    bio: "ผ่านประสบการณ์สอน PAT2 มาหลายรุ่น มีชีทสรุปและโจทย์ข้อสอบเก่าครบครัน"
  }
];

function loadTutors() {
  fetch("/tutor/list", {
    method: "GET",
    headers: authHeader()
  })
    .then(res => {
      if (handleAuthError(res)) return null;
      return res.json();
    })
    .then(data => {
      if (!data) return;

      if (data.status === "success") {
        allTutors = data.data || [];
      } else {
        allTutors = [];
      }

      populateSubjectFilter();
      updateMatchedTutors();
    })
    .catch(err => {
      console.error("โหลด tutor ไม่สำเร็จ:", err);

      document.getElementById("tutorsList").innerHTML = `
        <div class="empty-state">
          โหลดข้อมูลติวเตอร์ไม่สำเร็จ
        </div>
      `;
    });
}

const SUBJECT_GROUPS = [
  {
    label: "🔢 คณิตศาสตร์และสถิติ", subjects: [
      "คณิตศาสตร์", "แคลคูลัส", "พีชคณิตเชิงเส้น", "สถิติ", "คณิตศาสตร์ไม่ต่อเนื่อง",
      "ความน่าจะเป็น", "คณิตศาสตร์วิศวกรรม"
    ]
  },
  {
    label: "⚗️ วิทยาศาสตร์", subjects: [
      "ฟิสิกส์", "เคมี", "ชีววิทยา", "เคมีอินทรีย์", "ชีวเคมี",
      "จุลชีววิทยา", "กายวิภาคศาสตร์", "สรีรวิทยา", "พันธุศาสตร์"
    ]
  },
  {
    label: "💻 คอมพิวเตอร์และเทคโนโลยี", subjects: [
      "การเขียนโปรแกรม", "Python", "Java", "C / C++", "JavaScript",
      "Web Development", "Database", "Data Science", "AI / Machine Learning",
      "Cybersecurity", "Cloud Computing", "Mobile App Development",
      "โครงสร้างข้อมูลและอัลกอริทึม", "วิศวกรรมซอฟต์แวร์"
    ]
  },
  {
    label: "⚙️ วิศวกรรมศาสตร์", subjects: [
      "วิศวกรรมไฟฟ้า", "วิศวกรรมโยธา", "วิศวกรรมเครื่องกล",
      "วิศวกรรมอุตสาหการ", "วิศวกรรมเคมี", "วิศวกรรมสิ่งแวดล้อม",
      "อิเล็กทรอนิกส์", "วงจรไฟฟ้า", "ระบบควบคุม"
    ]
  },
  {
    label: "💼 บริหารธุรกิจและเศรษฐศาสตร์", subjects: [
      "การบัญชี", "การเงิน", "การตลาด", "เศรษฐศาสตร์จุลภาค",
      "เศรษฐศาสตร์มหภาค", "การจัดการ", "การบัญชีต้นทุน",
      "การเงินองค์กร", "การลงทุน", "ธุรกิจระหว่างประเทศ"
    ]
  },
  {
    label: "⚖️ นิติศาสตร์และรัฐศาสตร์", subjects: [
      "กฎหมายแพ่งและพาณิชย์", "กฎหมายอาญา", "กฎหมายมหาชน",
      "รัฐศาสตร์", "ความสัมพันธ์ระหว่างประเทศ", "รัฐประศาสนศาสตร์"
    ]
  },
  {
    label: "🌐 ภาษาและการสื่อสาร", subjects: [
      "ภาษาอังกฤษ", "IELTS", "TOEFL", "TOEIC", "ภาษาญี่ปุ่น", "ภาษาจีน",
      "ภาษาเกาหลี", "ภาษาฝรั่งเศส", "ภาษาเยอรมัน", "ภาษาไทย",
      "การเขียนเชิงวิชาการ", "การนำเสนอ"
    ]
  },
  {
    label: "🏥 วิทยาศาสตร์สุขภาพ", subjects: [
      "เภสัชวิทยา", "พยาธิวิทยา", "โภชนาการ", "สาธารณสุข",
      "กายภาพบำบัด", "วิทยาศาสตร์การแพทย์"
    ]
  },
  {
    label: "🎨 ศิลปะและมนุษยศาสตร์", subjects: [
      "ประวัติศาสตร์", "ปรัชญา", "จิตวิทยา", "สังคมวิทยา",
      "มานุษยวิทยา", "ศิลปะ", "ดนตรี", "นิเทศศาสตร์"
    ]
  },
  {
    label: "🏗️ สถาปัตยกรรมและออกแบบ", subjects: [
      "สถาปัตยกรรม", "การออกแบบภายใน", "ผังเมือง", "การออกแบบกราฟิก"
    ]
  },
];

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

// ---- กรองติวเตอร์ตาม subject ของโพสต์ที่ open ----------------
function updateMatchedTutors() {
  if (!allTutors.length) return;

  const openSubjects = [
    ...new Set(
      myPosts
        .filter(p => p.status === "open")
        .map(p => p.subject.trim().toLowerCase())
    )
  ];

  if (!openSubjects.length) {
    // ยังไม่มีโพสต์ open — แสดงติวเตอร์ทั้งหมด
    document.getElementById("tutorSectionLabel").textContent = "ติวเตอร์ที่แนะนำ";
    renderTutors(allTutors, []);
    return;
  }

  const matched = allTutors.filter(t =>
    (t.subjects || []).some(s =>
      openSubjects.some(os =>
        s.toLowerCase().includes(os) || os.includes(s.toLowerCase())
      )
    )
  );

  document.getElementById("tutorSectionLabel").textContent =
    matched.length
      ? `ติวเตอร์ที่ตรงกับโพสต์ของคุณ (${matched.length} คน)`
      : "ติวเตอร์ที่แนะนำ";

  renderTutors(matched.length ? matched : allTutors, openSubjects);
}

function filterTutors() {
  const subj = document.getElementById("tutorSubjectFilter").value;
  const filtered = !subj
    ? allTutors
    : allTutors.filter(t => (t.subjects || []).includes(subj));
  renderTutors(filtered, []);
}

function renderTutors(tutors, matchedSubjects = []) {
  const list = document.getElementById("tutorsList");
  if (!tutors.length) {
    list.innerHTML = `<div class="empty-state">ไม่พบติวเตอร์ที่ตรงกับเงื่อนไข</div>`;
    return;
  }

  list.innerHTML = tutors.map(t => {
    const rating = t.avg_rating ? parseFloat(t.avg_rating).toFixed(1) : null;
    const ratingHtml = rating ? `⭐ ${rating}` : `⭐ ใหม่`;
    const expHtml = t.experience_years
      ? `ประสบการณ์ ${t.experience_years} ปี`
      : (t.experiences?.length ? `ประสบการณ์ ${t.experiences.length} รายการ` : "");
    const formatHtml = t.format || "";
    const rate = t.hourly_rate ? `฿${Number(t.hourly_rate).toLocaleString()}/ชม.` : "";
    const metaParts = [ratingHtml, formatHtml, expHtml, rate].filter(Boolean);

    // subject pills — highlight ที่ตรงกับโพสต์
    const subjectPills = (t.subjects || []).map(s => {
      const isMatch = matchedSubjects.some(os =>
        s.toLowerCase().includes(os) || os.includes(s.toLowerCase())
      );
      return isMatch
        ? `<span style="background:rgba(99,185,255,0.25);color:#63b9ff;border:1px solid rgba(99,185,255,0.4);
                border-radius:6px;padding:2px 8px;font-size:0.78rem;font-weight:600">${s}</span>`
        : `<span style="background:rgba(255,255,255,0.07);color:#aeb8e8;
                border-radius:6px;padding:2px 8px;font-size:0.78rem">${s}</span>`;
    }).join(" ");

    // badge
    const badge = (t.avg_rating >= 4.8 && t.review_count > 2)
      ? `<span class="badge badge-progress">🔥 Popular</span>`
      : `<span class="badge badge-open">Available</span>`;

    // match tag
    const matchTag = matchedSubjects.length &&
      (t.subjects || []).some(s => matchedSubjects.some(os =>
        s.toLowerCase().includes(os) || os.includes(s.toLowerCase())
      ))
      ? `<span style="font-size:0.75rem;color:#63b9ff;margin-left:6px">✦ ตรงกับโพสต์ของคุณ</span>`
      : "";

    const safeName = t.name.replace(/'/g, "\\'");

    return `
        <div class="tutor-card">
          <div class="item-top">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin-bottom:6px">
                <span class="item-title" style="margin:0">${t.name}</span>
                ${matchTag}
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">
                ${subjectPills || "<span style='color:#aeb8e8;font-size:0.8rem'>ไม่ระบุวิชา</span>"}
              </div>
              <div class="item-meta">${metaParts.join(" | ")}</div>
            </div>
            ${badge}
          </div>
          <div class="item-desc">${t.bio || "ยังไม่มีข้อมูลแนะนำตัว"}</div>
          <div class="item-actions">
            <button class="small-btn view-btn" onclick="showTutorProfile(${t.tutor_id})">👤 ดูโปรไฟล์</button>
            <button class="small-btn match-btn" onclick="contactTutor(${t.tutor_id}, '${safeName}')">💬 ติดต่อทันที</button>
          </div>
        </div>`;
  }).join("");
}

// ---- Modal ดูโปรไฟล์ติวเตอร์ --------------------------------
function showTutorProfile(tutor_id) {
  fetch(`/tutor/profile/${tutor_id}`, { headers: authHeader() })
    .then(res => res.json())
    .then(data => {
      if (data.status !== "success") { alert("ไม่สามารถโหลดโปรไฟล์ได้"); return; }
      const t = data.data;
      openTutorModal(t);
    })
    .catch(() => alert("เกิดข้อผิดพลาดในการโหลดโปรไฟล์"));
}

function openTutorModal(t) {
  document.getElementById("tutorProfileModal")?.remove();

  const subjects = (t.subjects || []).join(", ") || "-";
  const rating = t.avg_rating ? parseFloat(t.avg_rating).toFixed(1) : "N/A";
  const rate = t.hourly_rate ? `฿${Number(t.hourly_rate).toLocaleString()}/ชม.` : "-";
  const experiences = (t.experiences || []);

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

          <!-- Header -->
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:22px;">
            <div style="display:flex;align-items:center;gap:16px;">
              <div style="width:64px;height:64px;border-radius:18px;
                background:linear-gradient(135deg,#ff4fd8,#7b61ff);
                display:flex;align-items:center;justify-content:center;
                font-size:1.8rem;font-weight:800;flex-shrink:0;">
                ${t.name ? t.name[0].toUpperCase() : "T"}
              </div>
              <div>
                <div style="font-size:1.25rem;font-weight:800;">${t.name}</div>
                <div style="color:#aeb8e8;font-size:0.92rem;margin-top:4px;">
                  ⭐ ${rating} &nbsp;|&nbsp; ${rate}
                </div>
              </div>
            </div>
            <button onclick="document.getElementById('tutorProfileModal').remove()"
              style="background:rgba(255,255,255,0.1);border:none;color:white;
                     padding:8px 14px;border-radius:10px;cursor:pointer;font-size:0.9rem;">✕</button>
          </div>

          <!-- วิชา -->
          <div style="margin-bottom:18px;">
            <div style="font-weight:700;margin-bottom:8px;color:#fff;">📚 วิชาที่สอน</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
              ${(t.subjects || []).map(s =>
    `<span style="background:rgba(77,168,255,0.16);color:#bfe1ff;
                  border:1px solid rgba(77,168,255,0.25);padding:6px 12px;
                  border-radius:999px;font-size:0.88rem;">${s}</span>`
  ).join("") || "<span style='color:#aeb8e8;'>ยังไม่ระบุ</span>"}
            </div>
          </div>

          <!-- Bio -->
          <div style="margin-bottom:18px;">
            <div style="font-weight:700;margin-bottom:8px;color:#fff;">📝 แนะนำตัว</div>
            <div style="color:#d7dcff;line-height:1.75;font-size:0.95rem;">
              ${t.bio || "ยังไม่มีข้อมูลแนะนำตัว"}
            </div>
          </div>

          <!-- ประสบการณ์ -->
          ${experiences.length ? `
          <div style="margin-bottom:22px;">
            <div style="font-weight:700;margin-bottom:10px;color:#fff;">🏆 ประสบการณ์</div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${experiences.map(e =>
    `<div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
                  border-radius:12px;padding:12px 14px;color:#d7dcff;font-size:0.93rem;">
                  ${e}
                </div>`
  ).join("")}
            </div>
          </div>` : ""}

          <!-- ปุ่มติดต่อ -->
          <button onclick="contactTutor(${t.tutor_id}, '${(t.name || "").replace(/'/g, "\\'")}');document.getElementById('tutorProfileModal').remove();"
            style="width:100%;background:linear-gradient(135deg,#ff4fd8,#7b61ff);
              color:white;border:none;padding:14px;border-radius:16px;
              font-weight:700;font-size:1rem;cursor:pointer;transition:0.2s ease;"
            onmouseover="this.style.transform='translateY(-2px)'" 
            onmouseout="this.style.transform='none'">
            💬 ติดต่อทันที
          </button>
        </div>
      `;
  document.body.appendChild(modal);
}

// ---- ติดต่อติวเตอร์ (scroll ไปฟอร์มสร้างโพสต์) -----------
function contactTutor(tutor_id, name) {
  showMessage(`เลือกติวเตอร์ "${name}" แล้ว — สร้างโพสต์เพื่อส่งคำเชิญ 🎉`, "success");
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

// โหลดโพสต์และติวเตอร์ตอนเปิดหน้า
loadMyPosts();
loadTutors();
function goToWallet() {
  window.location.href = "/student/wallet";
}
