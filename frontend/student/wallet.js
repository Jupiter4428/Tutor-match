const amountButtons = document.querySelectorAll('.amount-btn');
const withdrawButtons = document.querySelectorAll('.withdraw-btn');
const methodCards = document.querySelectorAll('.method-card');
const filterPills = document.querySelectorAll('.filter-pill');

const depositAmountInput = document.getElementById('depositAmount');
const withdrawAmountInput = document.getElementById('withdrawAmount');

const summaryDeposit = document.getElementById('summaryDeposit');
const summaryBalance = document.getElementById('summaryBalance');
const summaryWithdraw = document.getElementById('summaryWithdraw');
const summaryWithdrawBalance = document.getElementById('summaryWithdrawBalance');

const confirmDepositBtn = document.getElementById('confirmDepositBtn');
const confirmWithdrawBtn = document.getElementById('confirmWithdrawBtn');

const currentWalletBalance = document.getElementById('currentWalletBalance');
const bankName = document.getElementById('bankName');
const accountNumber = document.getElementById('accountNumber');

const baseBalance = 2450;

function formatCurrency(amount) {
  return `฿${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function updateDepositSummary(amount) {
  const deposit = Number(amount) || 0;
  const newBalance = baseBalance + deposit;

  summaryDeposit.textContent = formatCurrency(deposit);
  summaryBalance.textContent = formatCurrency(newBalance);
}

function updateWithdrawSummary(amount) {
  const withdraw = Number(amount) || 0;
  let newBalance = baseBalance - withdraw;

  if (newBalance < 0) {
    newBalance = 0;
  }

  summaryWithdraw.textContent = formatCurrency(withdraw);
  summaryWithdrawBalance.textContent = formatCurrency(newBalance);
}

amountButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    amountButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const amountText = btn.textContent.replace('฿', '').replace(',', '').trim();
    depositAmountInput.value = amountText;
    updateDepositSummary(amountText);
  });
});

withdrawButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    withdrawButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const amountText = btn.textContent.replace('฿', '').replace(',', '').trim();
    withdrawAmountInput.value = amountText;
    updateWithdrawSummary(amountText);
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
  updateDepositSummary(depositAmountInput.value);
});

withdrawAmountInput.addEventListener('input', () => {
  updateWithdrawSummary(withdrawAmountInput.value);
});

confirmDepositBtn.addEventListener('click', () => {
  const amount = Number(depositAmountInput.value);

  if (!amount || amount <= 0) {
    alert('กรุณากรอกจำนวนเงินฝากให้ถูกต้อง');
    return;
  }

  alert(`ยืนยันการฝากเงินจำนวน ${formatCurrency(amount)} เรียบร้อย`);
});

confirmWithdrawBtn.addEventListener('click', () => {
  const amount = Number(withdrawAmountInput.value);

  if (!amount || amount <= 0) {
    alert('กรุณากรอกจำนวนเงินถอนให้ถูกต้อง');
    return;
  }

  if (amount > baseBalance) {
    alert('ยอดเงินใน Wallet ไม่เพียงพอสำหรับการถอน');
    return;
  }

  if (bankName.value === '') {
    alert('กรุณาเลือกธนาคาร');
    return;
  }

  if (accountNumber.value.trim() === '') {
    alert('กรุณากรอกเลขบัญชีปลายทาง');
    return;
  }

  alert(
    `ยืนยันการถอนเงินจำนวน ${formatCurrency(amount)} เรียบร้อย\n` +
    `ธนาคาร: ${bankName.value}\n` +
    `เลขบัญชี: ${accountNumber.value}`
  );
});

currentWalletBalance.textContent = formatCurrency(baseBalance);
updateDepositSummary(500);
updateWithdrawSummary(100);

depositAmountInput.value = 500;
withdrawAmountInput.value = 100;