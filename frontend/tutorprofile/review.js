const token = localStorage.getItem('token') || '';
const currentUserId = Number(localStorage.getItem('user_id') || 0);

const params = new URLSearchParams(window.location.search);
const tutorId = params.get('tutor_id') ? Number(params.get('tutor_id')) : null;

const modal = document.getElementById('reviewModal');
const modalForm = document.getElementById('modalReviewForm');
const modalAppSelect = document.getElementById('modalAppSelect');
const modalTutorName = document.getElementById('modalTutorName');
const modalSubjectName = document.getElementById('modalSubjectName');
const modalRatingValue = document.getElementById('modalRatingValue');
const modalComment = document.getElementById('modalComment');
const modalSubmitBtn = document.getElementById('modalSubmitBtn');
const modalMessage = document.getElementById('modalMessage');
const reviewList = document.getElementById('reviewList');
const searchInput = document.getElementById('searchInput');
const subjectFilter = document.getElementById('subjectFilter');
const ratingFilter = document.getElementById('ratingFilter');
const applyFilterBtn = document.getElementById('applyFilterBtn');

let allReviews = [];
let currentSort = 'latest';
let modalOptions = [];
let selectedModalRating = 0;

function openModal() { modal.classList.add('active'); loadModalOptions(); }
function closeModal() {
    modal.classList.remove('active');
    if (modalForm) modalForm.reset();
    selectModalRating(0);
    if (modalTutorName) modalTutorName.value = '';
    if (modalSubjectName) modalSubjectName.value = '';
    hideModalMessage();
}

window.addEventListener('click', e => { if (e.target === modal) closeModal(); });

function showModalMessage(text, type = 'success') {
    modalMessage.textContent = text;
    modalMessage.style.display = 'block';
    modalMessage.style.background = type === 'success' ? '#d4edda' : '#f8d7da';
    modalMessage.style.color = type === 'success' ? '#155724' : '#721c24';
}

function hideModalMessage() {
    modalMessage.style.display = 'none';
    modalMessage.textContent = '';
}

function selectModalRating(value) {
    selectedModalRating = value;
    if (modalRatingValue) modalRatingValue.value = value || '';
    document.querySelectorAll('#modalStarPicker .star-option').forEach(opt => {
        opt.classList.toggle('active', Number(opt.dataset.value) === value);
    });
}

document.querySelectorAll('#modalStarPicker .star-option').forEach(opt => {
    opt.addEventListener('click', () => selectModalRating(Number(opt.dataset.value)));
});

async function fetchJson(url, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(url, { ...options, headers });
    const result = await response.json();
    return { response, result };
}

function escapeHtml(text) {
    return String(text || '')
        .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
}

function renderStarString(rating) {
    const n = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));
    return '<span class="on">★</span>'.repeat(n) + '<span class="off">★</span>'.repeat(5 - n);
}

function getInitials(name) {
    if (!name) return 'U';
    const parts = String(name).trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : parts[0].substring(0, 2).toUpperCase();
}

async function loadSummary() {
    try {
        const url = tutorId ? `/reviews/tutor/${tutorId}/summary` : '/reviews/summary';
        const { result } = await fetchJson(url);
        if (result.status !== 'success') return;

        const data = result.data || {};
        const avg = Number(data.avg_rating || 0);
        const total = Number(data.total_reviews || 0);
        const stars = data.stars || {};

        const heroTotal = document.getElementById('heroTotal');
        const heroAvg = document.getElementById('heroAvg');
        const heroFiveStar = document.getElementById('heroFiveStar');
        const summaryAvg = document.getElementById('summaryAvg');
        const summaryStars = document.getElementById('summaryStars');
        const summarySubtitle = document.getElementById('summarySubtitle');

        if (heroTotal) heroTotal.textContent = total.toLocaleString('th-TH');
        if (heroAvg) heroAvg.textContent = avg.toFixed(1);
        if (heroFiveStar) heroFiveStar.textContent = `${Number(stars["5"]?.percent || 0).toFixed(0)}%`;
        if (summaryAvg) summaryAvg.textContent = avg.toFixed(1);
        if (summaryStars) summaryStars.innerHTML = renderStarString(Math.round(avg));
        if (summarySubtitle) summarySubtitle.textContent = `จากผู้เรียนทั้งหมด ${total.toLocaleString('th-TH')} รีวิว`;

        for (let i = 1; i <= 5; i++) {
            const item = stars[String(i)] || { count: 0, percent: 0 };
            const starsEl = document.getElementById(`stars${i}`);
            const countEl = document.getElementById(`count${i}`);
            if (starsEl) starsEl.innerHTML = renderStarString(i);
            if (countEl) countEl.textContent = `${Number(item.count || 0).toLocaleString('th-TH')} รีวิว (${Number(item.percent || 0).toFixed(0)}%)`;
        }
    } catch (error) {
        console.error('loadSummary error:', error);
    }
}

function reviewCardTemplate(review) {
    const safeStudentName = escapeHtml(review.student_name || 'ไม่ระบุชื่อ');
    const safeSubject = escapeHtml(review.subject || '-');
    const safeComment = escapeHtml(review.comment || 'ไม่มีความคิดเห็นเพิ่มเติม');
    const rating = Number(review.rating || 0);
    const isOwner = Number(review.student_user_id) === currentUserId;

    return `
        <div class="review-card">
            <div class="review-top">
                <div class="user-box">
                    <div class="avatar">${getInitials(safeStudentName)}</div>
                    <div class="user-meta">
                        <h4>${safeStudentName}</h4>
                        <p>วิชา${safeSubject}</p>
                    </div>
                </div>
                <div class="review-rating">
                    <div class="score-number">${rating.toFixed(1)}</div>
                    <div class="score-stars">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</div>
                </div>
            </div>
            <div class="review-body">${safeComment}</div>
            <div class="review-footer">
                <div class="review-date">รีวิวเมื่อ ${formatDate(review.created_at)}</div>
                ${isOwner ? `<button type="button" class="react-btn delete-review-btn" data-review-id="${review.review_id}" style="color:#e74c3c;">🗑 ลบรีวิว</button>` : ''}
            </div>
        </div>
    `;
}

function sortReviews(reviews) {
    return [...reviews].sort((a, b) => {
        if (currentSort === 'highest') return Number(b.rating) - Number(a.rating);
        if (currentSort === 'name') return (a.student_name || '').localeCompare(b.student_name || '', 'th');
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
}

function renderReviews() {
    if (!allReviews.length) {
        reviewList.innerHTML = `<div style="padding:40px;text-align:center;color:#888;">ยังไม่มีรีวิวสำหรับติวเตอร์นี้</div>`;
        return;
    }
    const sorted = sortReviews(allReviews);
    reviewList.innerHTML = sorted.map(reviewCardTemplate).join('');

    reviewList.querySelectorAll('.delete-review-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm('ต้องการลบรีวิวนี้ใช่ไหม')) return;
            const reviewId = btn.dataset.reviewId;
            try {
                const { response, result } = await fetchJson(`/reviews/${reviewId}`, { method: 'DELETE' });
                if (response.ok && result.status === 'success') {
                    await Promise.all([loadReviews(), loadSummary()]);
                } else {
                    alert(result.message || 'ลบรีวิวไม่สำเร็จ');
                }
            } catch {
                alert('เกิดข้อผิดพลาดในการลบรีวิว');
            }
        });
    });
}

async function loadReviews() {
    reviewList.innerHTML = `<div style="padding:40px;text-align:center;color:#888;">กำลังโหลดรีวิว...</div>`;
    try {
        const urlParams = new URLSearchParams();
        if (tutorId) urlParams.set('tutor_id', tutorId);
        if (searchInput && searchInput.value.trim()) urlParams.set('search', searchInput.value.trim());
        if (subjectFilter && subjectFilter.value) urlParams.set('subject', subjectFilter.value);
        if (ratingFilter && ratingFilter.value) urlParams.set('rating', ratingFilter.value);

        const query = urlParams.toString() ? `?${urlParams.toString()}` : '';
        const { result } = await fetchJson(`/reviews${query}`);

        if (result.status !== 'success') {
            reviewList.innerHTML = `<div style="padding:40px;text-align:center;color:#888;">โหลดรีวิวไม่สำเร็จ</div>`;
            return;
        }

        allReviews = result.data || [];
        renderReviews();
    } catch (error) {
        reviewList.innerHTML = `<div style="padding:40px;text-align:center;color:#888;">เกิดข้อผิดพลาด</div>`;
        console.error('loadReviews error:', error);
    }
}

async function loadModalOptions() {
    if (!token) {
        modalAppSelect.innerHTML = `<option value="">กรุณา login ก่อนเขียนรีวิว</option>`;
        return;
    }
    try {
        const { response, result } = await fetchJson('/reviews/my-options');
        if (!response.ok || result.status !== 'success') {
            modalAppSelect.innerHTML = `<option value="">โหลดรายการไม่สำเร็จ</option>`;
            return;
        }

        let options = result.data || [];
        if (tutorId) options = options.filter(item => Number(item.tutor_id) === tutorId);
        modalOptions = options;

        if (!options.length) {
            modalAppSelect.innerHTML = `<option value="">ไม่มีงานที่รีวิวได้สำหรับติวเตอร์นี้</option>`;
            return;
        }

        modalAppSelect.innerHTML = `
            <option value="">-- เลือกงานที่รีวิวได้ --</option>
            ${options.map(item => `
                <option value="${item.app_id}">
                    #${item.app_id} - ${escapeHtml(item.tutor_name)} (${escapeHtml(item.subject)})
                </option>
            `).join('')}
        `;
    } catch (error) {
        modalAppSelect.innerHTML = `<option value="">เกิดข้อผิดพลาด</option>`;
        console.error('loadModalOptions error:', error);
    }
}

modalAppSelect.addEventListener('change', () => {
    const selectedId = Number(modalAppSelect.value);
    const selected = modalOptions.find(item => Number(item.app_id) === selectedId);
    if (!selected) {
        modalTutorName.value = '';
        modalSubjectName.value = '';
        return;
    }
    modalTutorName.value = selected.tutor_name || '';
    modalSubjectName.value = selected.subject || '';
});

modalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideModalMessage();

    const appId = Number(modalAppSelect.value);
    const rating = selectedModalRating;
    const comment = modalComment.value.trim();

    if (!token) { showModalMessage('กรุณา login ก่อนส่งรีวิว', 'error'); return; }
    if (!appId) { showModalMessage('กรุณาเลือกงานที่ต้องการรีวิว', 'error'); return; }
    if (!rating || rating < 1 || rating > 5) { showModalMessage('กรุณาเลือกคะแนน 1-5 ดาว', 'error'); return; }

    modalSubmitBtn.disabled = true;
    modalSubmitBtn.textContent = 'กำลังส่ง...';

    try {
        const { response, result } = await fetchJson('/reviews', {
            method: 'POST',
            body: JSON.stringify({ app_id: appId, rating, comment })
        });

        if (response.ok && result.status === 'success') {
            showModalMessage('ส่งรีวิวสำเร็จ!', 'success');
            setTimeout(async () => {
                closeModal();
                await Promise.all([loadReviews(), loadSummary()]);
            }, 1500);
        } else {
            showModalMessage(result.message || 'ส่งรีวิวไม่สำเร็จ', 'error');
        }
    } catch (error) {
        showModalMessage(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
    } finally {
        modalSubmitBtn.disabled = false;
        modalSubmitBtn.textContent = '🚀 ส่งรีวิว';
    }
});

document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSort = btn.dataset.sort;
        renderReviews();
    });
});

if (applyFilterBtn) applyFilterBtn.addEventListener('click', loadReviews);

if (searchInput) {
    let searchTimer = null;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(loadReviews, 300);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([loadSummary(), loadReviews()]);
});
