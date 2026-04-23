const amountButtons = document.querySelectorAll('.amount-btn');
const methodCards = document.querySelectorAll('.method-card');
const filterPills = document.querySelectorAll('.filter-pill');

const depositAmountInput = document.getElementById('depositAmount');
const summaryDeposit = document.getElementById('summaryDeposit');
const summaryBalance = document.getElementById('summaryBalance');
const confirmDepositBtn = document.getElementById('confirmDepositBtn');

const baseBalance = 2450;

function formatCurrency(amount) {
  return `฿${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function updateSummary(amount) {
  const deposit = Number(amount) || 0;
  const newBalance = baseBalance + deposit;

  summaryDeposit.textContent = formatCurrency(deposit);
  summaryBalance.textContent = formatCurrency(newBalance);
}

amountButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    amountButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const amountText = btn.textContent.replace('฿', '').replace(',', '').trim();
    depositAmountInput.value = amountText;
    updateSummary(amountText);
  });
});

methodCards.forEach((card) => {
  card.addEventListener('click', () => {
    methodCards.forEach((c) => c.classList.remove('active'));
    card.classList.add('active');
  });
});

filterPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    filterPills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
  });
});

depositAmountInput.addEventListener('input', () => {
  updateSummary(depositAmountInput.value);
});

confirmDepositBtn.addEventListener('click', () => {
  const amount = Number(depositAmountInput.value);

  if (!amount || amount <= 0) {
    alert('กรุณากรอกจำนวนเงินฝากให้ถูกต้อง');
    return;
  }

  alert(`ยืนยันการฝากเงินจำนวน ${formatCurrency(amount)} เรียบร้อย`);
});

updateSummary(500);
depositAmountInput.value = 500;