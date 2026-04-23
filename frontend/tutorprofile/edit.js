const TOKEN = localStorage.getItem('token');
const ROLE = localStorage.getItem('user_role');

if (!TOKEN || ROLE !== 'tutor') {
  localStorage.clear();
  window.location.href = '/login';
}

const hourlyRateInput = document.getElementById('hourly_rate');
const previewRate = document.getElementById('previewRate');
const form = document.getElementById('editTutorForm');
const defaultImage = 'static/uploads/default_profile.jpg';

hourlyRateInput.addEventListener('input', function () {
  previewRate.textContent = this.value.trim() ? `฿${this.value.trim()} / hr` : '฿0 / hr';
});

function previewProfileImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => { document.getElementById('previewImage').src = e.target.result; };
  reader.readAsDataURL(file);
}

function goToProfile() {
  window.location.href = '/home/tutor';
}

function resetPreview() {
  setTimeout(() => {
    previewRate.textContent = hourlyRateInput.value.trim()
      ? `฿${hourlyRateInput.value.trim()} / hr` : '฿0 / hr';
    document.getElementById('previewImage').src = defaultImage;
    document.getElementById('profilePicture').value = '';
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
  console.log(data);

  if (data.status === 'success') {
    alert('อัปเดตโปรไฟล์สำเร็จ');
    window.location.href = '/profile/tutor';
  } else {
    alert(data.message || 'อัปเดตไม่สำเร็จ');
  }

  const p = data.data;
  document.getElementById('tutorName').innerText = p.name;
  document.getElementById('tutorSubtitle').innerText = p.email;
  document.getElementById('hourly_rate').value = p.hourly_rate;
  document.getElementById('bio').value = p.bio;
  document.getElementById('previewTutorId').innerText = p.tutor_id;
  document.getElementById('previewRate').innerText = `฿${p.hourly_rate} / hr`;

  if (p.profile_picture_url) {
    document.getElementById('previewImage').src = `/${p.profile_picture_url}`;
  }
}

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append('bio', document.getElementById('bio').value.trim());
  formData.append('hourly_rate', hourlyRateInput.value.trim());

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
  console.log("UPDATE RESPONSE:", data);

  if (data.status === 'success') {
    alert('อัปเดตโปรไฟล์สำเร็จ');

    // force reload profile page
    window.location.href = '/profile/tutor';
  } else {
    alert(data.message || 'อัปเดตไม่สำเร็จ');
  }

  loadCurrentProfile();
});
