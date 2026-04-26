const TOKEN = localStorage.getItem('token');
const ROLE  = localStorage.getItem('user_role');

if (!TOKEN || ROLE !== 'tutor') {
  localStorage.clear();
  window.location.href = '/login';
}

const hourlyRateInput = document.getElementById('hourly_rate');
const previewRate     = document.getElementById('previewRate');
const form            = document.getElementById('editTutorForm');

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

function getSelectedSubjects() {
  return Array.from(document.querySelectorAll('input[name="subjects"]:checked'))
    .map(input => input.value);
}

function setSelectedSubjects(subjects) {
  const subjectArray = Array.isArray(subjects)
    ? subjects
    : String(subjects || '').split(',').map(s => s.trim()).filter(Boolean);
  document.querySelectorAll('input[name="subjects"]').forEach(input => {
    input.checked = subjectArray.includes(input.value);
  });
}

hourlyRateInput.addEventListener('input', function () {
  previewRate.textContent = this.value.trim()
    ? `฿${this.value.trim()} / hr`
    : '฿0 / hr';
});

function previewProfileImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => { document.getElementById('previewImage').src = e.target.result; };
  reader.readAsDataURL(file);
}

function goToProfile() { window.location.href = '/profile/tutor'; }

function resetPreview() {
  setTimeout(async () => {
    previewRate.textContent = hourlyRateInput.value.trim()
      ? `฿${hourlyRateInput.value.trim()} / hr`
      : '฿0 / hr';
    document.getElementById('profilePicture').value = '';
    await loadCurrentProfile();
  }, 0);
}

async function loadCurrentProfile() {
  const res = await fetch('/tutor/profile', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });

  if (res.status === 401 || res.status === 403) {
    localStorage.clear();
    window.location.href = '/login';
    return;
  }

  const data = await res.json();

  if (data.status !== 'success') {
    showToast(data.message || 'โหลดโปรไฟล์ไม่สำเร็จ', 'error');
    return;
  }

  const p = data.data;
  document.getElementById('tutorName').innerText     = p.name;
  document.getElementById('tutorSubtitle').innerText = p.email;
  document.getElementById('hourly_rate').value       = p.hourly_rate || '';
  document.getElementById('bio').value               = p.bio || '';
  document.getElementById('previewTutorId').innerText = p.tutor_id;

  previewRate.innerText = p.hourly_rate ? `฿${p.hourly_rate} / hr` : '฿0 / hr';
  setSelectedSubjects(p.subjects || p.subject || []);

  const previewImage = document.getElementById('previewImage');
  previewImage.src = p.profile_picture_url
    ? `/${p.profile_picture_url}?t=${new Date().getTime()}`
    : '/static/uploads/default_profile.jpg';

  // แสดง Verification Status จาก database
  const statusMap = {
    pending:  '<div class="status-badge pending">⏳ Pending</div>',
    verified: '<div class="status-badge verified">✅ Verified</div>',
    rejected: '<div class="status-badge rejected">❌ Rejected</div>',
  };
  document.getElementById('editVerifyStatus').innerHTML =
    statusMap[p.verification_status] || p.verification_status || '';

  const verifiedBox = document.getElementById('editVerifiedReason');
  const rejectBox   = document.getElementById('editRejectReason');

  if (p.verification_status === 'verified') {
    verifiedBox.style.display = '';
    rejectBox.style.display   = 'none';
  } else if (p.verification_status === 'rejected') {
    verifiedBox.style.display = 'none';
    rejectBox.style.display   = '';
    document.getElementById('editRejectReasonText').textContent =
      p.reject_reason || 'ไม่มีเหตุผลเพิ่มเติม';
  } else {
    verifiedBox.style.display = 'none';
    rejectBox.style.display   = 'none';
  }
}

loadCurrentProfile();

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append('bio',         document.getElementById('bio').value.trim());
  formData.append('hourly_rate', hourlyRateInput.value.trim());
  formData.append('subjects',    JSON.stringify(getSelectedSubjects()));

  const fileInput = document.getElementById('profilePicture');
  if (fileInput.files.length > 0) {
    formData.append('profile_picture', fileInput.files[0]);
  }

  const res  = await fetch('/tutor/profile', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${TOKEN}` },
    body: formData
  });
  const data = await res.json();

  if (data.status === 'success') {
    showToast('อัปเดตโปรไฟล์สำเร็จ', 'success');
    setTimeout(() => { window.location.href = '/profile/tutor'; }, 1200);
  } else {
    showToast(data.message || 'อัปเดตไม่สำเร็จ', 'error');
    loadCurrentProfile();
  }
});
