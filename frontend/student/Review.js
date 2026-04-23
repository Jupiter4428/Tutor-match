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