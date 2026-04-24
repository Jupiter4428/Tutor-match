const TOKEN = localStorage.getItem('token');
const ROLE = localStorage.getItem('user_role');

if (!TOKEN || ROLE !== 'tutor') {
  localStorage.clear();
  window.location.href = '/login';
}

const hourlyRateInput = document.getElementById('hourly_rate');
const previewRate = document.getElementById('previewRate');
const form = document.getElementById('editTutorForm');

// ===== ⭐ SUBJECT FUNCTIONS =====
function getSelectedSubjects() {
  return Array.from(document.querySelectorAll('input[name="subjects"]:checked'))
    .map(input => input.value);
}

function setSelectedSubjects(subjects) {
  const subjectArray = Array.isArray(subjects)
    ? subjects
    : String(subjects || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

  document.querySelectorAll('input[name="subjects"]').forEach(input => {
    input.checked = subjectArray.includes(input.value);
  });
}
// ===== END SUBJECT =====


// ===== 💰 RATE PREVIEW =====
hourlyRateInput.addEventListener('input', function () {
  previewRate.textContent = this.value.trim()
    ? `฿${this.value.trim()} / hr`
    : '฿0 / hr';
});

// ===== 🖼 PREVIEW IMAGE =====
function previewProfileImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('previewImage').src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ===== 🔙 NAVIGATION =====
function goToProfile() {
  window.location.href = '/profile/tutor';
}

// ===== 🔄 RESET =====
function resetPreview() {
  setTimeout(async () => {
    previewRate.textContent = hourlyRateInput.value.trim()
      ? `฿${hourlyRateInput.value.trim()} / hr`
      : '฿0 / hr';

    document.getElementById('profilePicture').value = '';

    await loadCurrentProfile();
  }, 0);
}

// ===== 📥 LOAD PROFILE =====
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
    alert(data.message || 'โหลดโปรไฟล์ไม่สำเร็จ');
    return;
  }

  const p = data.data;

  document.getElementById('tutorName').innerText = p.name;
  document.getElementById('tutorSubtitle').innerText = p.email;
  document.getElementById('hourly_rate').value = p.hourly_rate || '';
  document.getElementById('bio').value = p.bio || '';
  document.getElementById('previewTutorId').innerText = p.tutor_id;

  previewRate.innerText = p.hourly_rate
    ? `฿${p.hourly_rate} / hr`
    : '฿0 / hr';

  // ⭐ SET SUBJECTS
  setSelectedSubjects(p.subjects || p.subject || []);

  const previewImage = document.getElementById('previewImage');

  if (p.profile_picture_url) {
    previewImage.src = `/${p.profile_picture_url}?t=${new Date().getTime()}`;
  } else {
    previewImage.src = '/static/uploads/default_profile.jpg';
  }
}

loadCurrentProfile();


// ===== 📤 SUBMIT =====
form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append('bio', document.getElementById('bio').value.trim());
  formData.append('hourly_rate', hourlyRateInput.value.trim());

  // ⭐ ADD SUBJECTS
  formData.append('subjects', JSON.stringify(getSelectedSubjects()));

  const fileInput = document.getElementById('profilePicture');
  if (fileInput.files.length > 0) {
    formData.append('profile_picture', fileInput.files[0]);
  }

  const res = await fetch('/tutor/profile', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${TOKEN}` },
    body: formData
  });

  const data = await res.json();

  if (data.status === 'success') {
    alert('อัปเดตโปรไฟล์สำเร็จ');
    window.location.href = '/profile/tutor';
  } else {
    alert(data.message || 'อัปเดตไม่สำเร็จ');
  }

  loadCurrentProfile();
});