const TOKEN = localStorage.getItem('token');
const ROLE  = localStorage.getItem('user_role');

if (!TOKEN || ROLE !== 'tutor') {
  localStorage.clear();
  window.location.href = '/login';
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

async function loadProfile() {
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

  if (data.status === 'success') {
    const p = data.data;

    document.getElementById('tutorName').innerText  = p.name;
    document.getElementById('hourlyRate').innerText =
      p.hourly_rate ? `฿${p.hourly_rate}/hr` : 'ยังไม่ได้กำหนดราคา';
    document.getElementById('tutorId').innerText   = p.tutor_id;
    document.getElementById('tutorBio').innerText  = p.bio || '-';

    const statusEl  = document.getElementById('verifyStatus');
    const statusMap = {
      pending:  '<div class="status-badge status-pending">⏳ Pending</div>',
      verified: '<div class="status-badge status-verified">✅ Verified</div>',
      rejected: '<div class="status-badge status-rejected">❌ Rejected</div>',
    };
    statusEl.innerHTML = statusMap[p.verification_status] || p.verification_status;

    const img = document.querySelector('.profile-image');
    img.src = p.profile_picture_url
      ? `/${p.profile_picture_url}`
      : '/static/uploads/default_profile.jpg';
  }
}

document.getElementById('profileUpload').addEventListener('change', async function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const profileRes  = await fetch('/tutor/profile', { headers: { 'Authorization': `Bearer ${TOKEN}` } });
  const profileData = await profileRes.json();

  if (profileData.status !== 'success') {
    showToast('โหลดข้อมูลโปรไฟล์ไม่สำเร็จ', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('bio',             profileData.data.bio);
  formData.append('hourly_rate',     profileData.data.hourly_rate);
  formData.append('profile_picture', file);

  const res  = await fetch('/tutor/profile', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${TOKEN}` },
    body: formData
  });
  const data = await res.json();

  if (data.status === 'success') {
    showToast('เปลี่ยนรูปสำเร็จ', 'success');
    setTimeout(() => location.reload(), 1200);
  } else {
    showToast(data.message || 'เปลี่ยนรูปไม่สำเร็จ', 'error');
  }
});

loadProfile();
