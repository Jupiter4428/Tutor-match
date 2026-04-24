
const stars = document.querySelectorAll("#starBox span");
const selectedRating = document.getElementById("selectedRating");
const reviewForm = document.getElementById("reviewForm");

const searchInput = document.getElementById("searchInput");
const subjectFilter = document.getElementById("subjectFilter");
const ratingFilter = document.getElementById("ratingFilter");
const sortFilter = document.getElementById("sortFilter");
const reviewGrid = document.getElementById("reviewGrid");

function updateStarDisplay(value) {
  stars.forEach((star, index) => {
    if (index < value) {
      star.classList.add("active");
    } else {
      star.classList.remove("active");
    }
  });
}

function goTo() {
  window.location.href = "/student/courses";
}


stars.forEach((star) => {
  star.addEventListener("click", () => {
    const value = Number(star.dataset.value);
    selectedRating.value = value;
    updateStarDisplay(value);
  });
});

function getVisibleCards() {
  return Array.from(document.querySelectorAll(".review-card"));
}

function filterReviews() {
  const keyword = searchInput.value.trim().toLowerCase();
  const subject = subjectFilter.value;
  const minRating = ratingFilter.value;

  const cards = getVisibleCards();

  cards.forEach((card) => {
    const text = card.innerText.toLowerCase();
    const cardSubject = card.dataset.subject;
    const cardRating = Number(card.dataset.rating);

    const matchKeyword = text.includes(keyword);
    const matchSubject = subject === "all" || cardSubject === subject;
    const matchRating = minRating === "all" || cardRating >= Number(minRating);

    if (matchKeyword && matchSubject && matchRating) {
      card.style.display = "";
    } else {
      card.style.display = "none";
    }
  });

  showNoResults();
}

function sortReviews() {
  const cards = getVisibleCards();

  cards.sort((a, b) => {
    const sortType = sortFilter.value;

    if (sortType === "highest") {
      return Number(b.dataset.rating) - Number(a.dataset.rating);
    }

    if (sortType === "name") {
      return a.dataset.student.localeCompare(b.dataset.student, "th");
    }

    return new Date(b.dataset.date) - new Date(a.dataset.date);
  });

  cards.forEach((card) => reviewGrid.appendChild(card));
}

function showNoResults() {
  const oldMessage = document.querySelector(".no-results");
  if (oldMessage) oldMessage.remove();

  const visibleCards = getVisibleCards().filter((card) => card.style.display !== "none");

  if (visibleCards.length === 0) {
    const message = document.createElement("div");
    message.className = "no-results";
    message.textContent = "ไม่พบรีวิวที่ตรงกับเงื่อนไขที่ค้นหา";
    reviewGrid.appendChild(message);
  }
}

[searchInput, subjectFilter, ratingFilter].forEach((element) => {
  element.addEventListener("input", filterReviews);
  element.addEventListener("change", filterReviews);
});

sortFilter.addEventListener("change", () => {
  sortReviews();
  filterReviews();
});

document.querySelectorAll(".more-btn").forEach((button) => {
  button.addEventListener("click", () => {
    alert("ตรงนี้สามารถเชื่อมไปหน้าแสดงรายละเอียดรีวิวเต็ม หรือเปิด modal ได้");
  });
});

reviewForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const tutorName = document.getElementById("tutorName").value.trim();
  const subjectValue = document.getElementById("subjectSelect").value;
  const reviewText = document.getElementById("reviewText").value.trim();
  const ratingValue = Number(selectedRating.value);

  if (!tutorName || !reviewText || ratingValue === 0 || subjectValue === "เลือกวิชา") {
    alert("กรุณากรอกข้อมูลให้ครบ และเลือกคะแนนรีวิวก่อนส่ง");
    return;
  }

  alert(
    `ส่งรีวิวเรียบร้อย\n` +
    `ติวเตอร์: ${tutorName}\n` +
    `วิชา: ${subjectValue}\n` +
    `คะแนน: ${ratingValue} ดาว`
  );

  reviewForm.reset();
  selectedRating.value = 0;
  updateStarDisplay(0);
});

updateStarDisplay(0);
sortReviews();
filterReviews();
<<<<<<< Updated upstream
=====
=======
>>>>>>> Stashed changes
const token = localStorage.getItem('token') || '';
const currentUserId = Number(localStorage.getItem('user_id') || 0);
const userRole = localStorage.getItem('user_role') || 'student';
const savedUser = JSON.parse(localStorage.getItem('userData') || '{}');
const currentUserName = savedUser.name || 'Student User';

const reviewGrid = document.getElementById('reviewGrid');
const reviewForm = document.getElementById('reviewForm');
const reviewMessage = document.getElementById('reviewMessage');
const appSelect = document.getElementById('appSelect');
const tutorNameInput = document.getElementById('tutorName');
const subjectNameInput = document.getElementById('subjectName');
const commentInput = document.getElementById('comment');
const ratingValueInput = document.getElementById('ratingValue');
const ratingTextInput = document.getElementById('ratingText');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const starBox = document.getElementById('starBox');
const starEls = starBox ? [...starBox.querySelectorAll('span')] : [];
const profileName = document.getElementById('profileName');
const profileRole = document.getElementById('profileRole');
const searchInput = document.getElementById('searchInput');
const subjectFilter = document.getElementById('subjectFilter');
const ratingFilter = document.getElementById('ratingFilter');

let reviewOptions = [];

if (profileName) {
    profileName.textContent = currentUserName;
}

if (profileRole) {
    profileRole.textContent = userRole;
}

function showMessage(message, type = 'success') {
    reviewMessage.textContent = message;
    reviewMessage.className = `message-box ${type}`;
}

function clearMessage() {
    reviewMessage.textContent = '';
    reviewMessage.className = 'message-box';
}

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function renderStars(rating) {
    const value = Math.max(0, Math.min(5, Number(rating || 0)));
    return '★'.repeat(value) + '☆'.repeat(5 - value);
}

function updateStarInput(value) {
    const numericValue = Number(value || 0);
    ratingValueInput.value = numericValue ? String(numericValue) : '';
    if (ratingTextInput) {
        ratingTextInput.value = numericValue ? `${numericValue} ดาว` : '';
    }

    starEls.forEach((star) => {
        const starValue = Number(star.dataset.value);
        star.classList.toggle('active', starValue <= numericValue);
    });
}

function escapeHtml(text) {
    return String(text || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function getAvatarLetter(name) {
    if (!name) return 'U';
    return String(name).trim().charAt(0).toUpperCase();
}

async function fetchJson(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    const result = await response.json();
    return { response, result };
}

async function loadSummary() {
    try {
        const { result } = await fetchJson('/reviews/summary');
        if (result.status !== 'success') return;

        const data = result.data || {};
        const avg = Number(data.avg_rating || 0);
        const total = Number(data.total_reviews || 0);
        const stars = data.stars || {};

        document.getElementById('avgRating').textContent = avg.toFixed(1);
        document.getElementById('avgStars').textContent = renderStars(Math.round(avg));
        document.getElementById('totalReviewsText').textContent = `จากทั้งหมด ${total} รีวิว`;

        document.getElementById('heroAvgRating').textContent = `${avg.toFixed(1)}/5`;
        document.getElementById('heroTotalReviews').textContent = total.toLocaleString('th-TH');
        document.getElementById('heroFiveStarPercent').textContent = `${Number(stars["5"]?.percent || 0).toFixed(1)}%`;

        for (let i = 1; i <= 5; i++) {
            const item = stars[String(i)] || { count: 0, percent: 0 };
            document.getElementById(`bar${i}`).style.width = `${Number(item.percent || 0)}%`;
            document.getElementById(`count${i}`).textContent = `${Number(item.count || 0).toLocaleString('th-TH')} รีวิว`;
        }
    } catch (error) {
        console.error('loadSummary error:', error);
    }
}

function reviewCardTemplate(review) {
    const isOwner = Number(review.student_user_id) === currentUserId;
    const safeStudentName = escapeHtml(review.student_name || 'ไม่ระบุชื่อ');
    const safeTutorName = escapeHtml(review.tutor_name || '-');
    const safeSubject = escapeHtml(review.subject || '-');
    const safeComment = escapeHtml(review.comment || 'ไม่มีความคิดเห็นเพิ่มเติม');
    const rating = Number(review.rating || 0);

    return `
        <div class="review-card ${rating === 5 ? 'featured' : ''}">
            ${rating === 5 ? '<div class="featured-badge">รีวิวเด่น</div>' : ''}
            <div class="review-head">
                <div class="student">
                    <div class="student-avatar">${getAvatarLetter(safeStudentName)}</div>
                    <div>
                        <h4>${safeStudentName}</h4>
                        <p>${safeSubject}</p>
                    </div>
                </div>
                <div class="rating-pill">${renderStars(rating)}</div>
            </div>

            <div class="tutor-name">ติวเตอร์ที่เรียน: <span>${safeTutorName}</span></div>

            <div class="review-text">${safeComment}</div>

            <div class="review-foot">
                <span>📅 ${formatDate(review.created_at)}</span>
                ${isOwner ? `<button type="button" class="delete-btn" data-review-id="${review.review_id}">ลบรีวิว</button>` : ''}
            </div>
        </div>
    `;
}

async function loadReviews() {
    reviewGrid.innerHTML = `<div class="empty-state">กำลังโหลดรีวิว...</div>`;

    try {
        const params = new URLSearchParams();

        if (searchInput && searchInput.value.trim()) {
            params.set('search', searchInput.value.trim());
        }

        if (subjectFilter && subjectFilter.value) {
            params.set('subject', subjectFilter.value);
        }

        if (ratingFilter && ratingFilter.value) {
            params.set('rating', ratingFilter.value);
        }

        const query = params.toString() ? `?${params.toString()}` : '';
        const { result } = await fetchJson(`/reviews${query}`);

        if (result.status !== 'success') {
            reviewGrid.innerHTML = `<div class="empty-state">โหลดรีวิวไม่สำเร็จ</div>`;
            return;
        }

        const reviews = result.data || [];

        if (!reviews.length) {
            reviewGrid.innerHTML = `<div class="empty-state">ยังไม่มีรีวิว</div>`;
            return;
        }

        reviewGrid.innerHTML = reviews.map(reviewCardTemplate).join('');

        reviewGrid.querySelectorAll('.delete-btn').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const reviewId = btn.dataset.reviewId;
                const confirmed = confirm('ต้องการลบรีวิวนี้ใช่ไหม');
                if (!confirmed) return;

                try {
                    const { response, result } = await fetchJson(`/reviews/${reviewId}`, {
                        method: 'DELETE'
                    });

                    if (response.ok && result.status === 'success') {
                        await Promise.all([loadReviews(), loadSummary(), loadReviewOptions()]);
                        showMessage('ลบรีวิวสำเร็จ', 'success');
                    } else {
                        showMessage(result.message || 'ลบรีวิวไม่สำเร็จ', 'error');
                    }
                } catch (error) {
                    showMessage('เกิดข้อผิดพลาดในการลบรีวิว', 'error');
                }
            });
        });
    } catch (error) {
        reviewGrid.innerHTML = `<div class="empty-state">เกิดข้อผิดพลาดในการโหลดรีวิว</div>`;
        console.error('loadReviews error:', error);
    }
}

async function loadReviewOptions() {
    if (!token) {
        appSelect.innerHTML = `<option value="">กรุณา login ก่อน</option>`;
        return;
    }

    try {
        const { response, result } = await fetchJson('/reviews/my-options');

        if (!response.ok || result.status !== 'success') {
            appSelect.innerHTML = `<option value="">โหลดรายการงานไม่สำเร็จ</option>`;
            return;
        }

        reviewOptions = result.data || [];

        if (!reviewOptions.length) {
            appSelect.innerHTML = `<option value="">ไม่มีงานที่รีวิวได้ในตอนนี้</option>`;
            tutorNameInput.value = '';
            subjectNameInput.value = '';
            return;
        }

        appSelect.innerHTML = `
            <option value="">-- เลือกงานที่รีวิวได้ --</option>
            ${reviewOptions.map(item => `
                <option value="${item.app_id}">
                    #${item.app_id} - ${item.tutor_name} (${item.subject})
                </option>
            `).join('')}
        `;
    } catch (error) {
        appSelect.innerHTML = `<option value="">เกิดข้อผิดพลาดในการโหลดข้อมูล</option>`;
        console.error('loadReviewOptions error:', error);
    }
}

appSelect.addEventListener('change', () => {
    const selectedId = Number(appSelect.value);
    const selected = reviewOptions.find(item => Number(item.app_id) === selectedId);

    if (!selected) {
        tutorNameInput.value = '';
        subjectNameInput.value = '';
        return;
    }

    tutorNameInput.value = selected.tutor_name || '';
    subjectNameInput.value = selected.subject || '';
});

starEls.forEach((star) => {
    star.addEventListener('click', () => {
        updateStarInput(Number(star.dataset.value));
    });
});

resetBtn.addEventListener('click', () => {
    clearMessage();
    updateStarInput(0);
    tutorNameInput.value = '';
    subjectNameInput.value = '';
    appSelect.value = '';
});

reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage();

    const appId = Number(appSelect.value);
    const rating = Number(ratingValueInput.value);
    const comment = commentInput.value.trim();

    if (!token) {
        showMessage('กรุณา login ก่อนส่งรีวิว', 'error');
        return;
    }

    if (!appId) {
        showMessage('กรุณาเลือกงานที่ต้องการรีวิว', 'error');
        return;
    }

    if (!rating || rating < 1 || rating > 5) {
        showMessage('กรุณาเลือกคะแนน 1-5 ดาว', 'error');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'กำลังส่ง...';

    try {
        const { response, result } = await fetchJson('/reviews', {
            method: 'POST',
            body: JSON.stringify({
                app_id: appId,
                rating,
                comment
            })
        });

        if (response.ok && result.status === 'success') {
            showMessage('ส่งรีวิวสำเร็จ', 'success');
            reviewForm.reset();
            updateStarInput(0);
            tutorNameInput.value = '';
            subjectNameInput.value = '';
            await Promise.all([loadReviews(), loadSummary(), loadReviewOptions()]);
        } else {
            showMessage(result.message || 'ส่งรีวิวไม่สำเร็จ', 'error');
        }
    } catch (error) {
        showMessage(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'ส่งรีวิว';
    }
});

let searchTimer = null;

if (searchInput) {
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            loadReviews();
        }, 300);
    });
}

if (subjectFilter) {
    subjectFilter.addEventListener('change', loadReviews);
}

if (ratingFilter) {
    ratingFilter.addEventListener('change', loadReviews);
}

document.addEventListener('DOMContentLoaded', async () => {
    updateStarInput(0);
    await Promise.all([
        loadSummary(),
        loadReviews(),
        loadReviewOptions()
    ]);
});
