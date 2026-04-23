const withdrawButtons = document.querySelectorAll('.withdraw-btn');
const filterPills = document.querySelectorAll('.filter-pill');

const withdrawAmountInput = document.getElementById('withdrawAmount');
const summaryWithdraw = document.getElementById('summaryWithdraw');
const summaryBalanceAfterWithdraw = document.getElementById('summaryBalanceAfterWithdraw');
const currentWalletBalance = document.getElementById('currentWalletBalance');

const bankName = document.getElementById('bankName');
const accountName = document.getElementById('accountName');
const accountNumber = document.getElementById('accountNumber');
const confirmWithdrawBtn = document.getElementById('confirmWithdrawBtn');

const baseBalance = 8450;

function formatCurrency(amount) {
  return `฿${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function updateWithdrawSummary(amount) {
  const withdraw = Number(amount) || 0;
  let balanceAfter = baseBalance - withdraw;

  if (balanceAfter < 0) {
    balanceAfter = 0;
  }

  summaryWithdraw.textContent = formatCurrency(withdraw);
  summaryBalanceAfterWithdraw.textContent = formatCurrency(balanceAfter);
}

withdrawButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    withdrawButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const amountText = btn.textContent.replace('฿', '').replace(',', '').trim();
    withdrawAmountInput.value = amountText;
    updateWithdrawSummary(amountText);
  });
});

filterPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    filterPills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
  });
});

withdrawAmountInput.addEventListener('input', () => {
  updateWithdrawSummary(withdrawAmountInput.value);
});

confirmWithdrawBtn.addEventListener('click', () => {
  const amount = Number(withdrawAmountInput.value);

  if (!amount || amount <= 0) {
    alert('กรุณากรอกจำนวนเงินถอนให้ถูกต้อง');
    return;
  }

  if (amount > baseBalance) {
    alert('ยอดเงินรายได้ใน Wallet ไม่เพียงพอสำหรับการถอน');
    return;
  }

  if (bankName.value === '') {
    alert('กรุณาเลือกธนาคารปลายทาง');
    return;
  }

  if (accountName.value.trim() === '') {
    alert('กรุณากรอกชื่อบัญชี');
    return;
  }

  if (accountNumber.value.trim() === '') {
    alert('กรุณากรอกเลขบัญชีปลายทาง');
    return;
  }

  alert(
    `ยืนยันการถอนเงินสำเร็จ\n` +
    `จำนวนเงิน: ${formatCurrency(amount)}\n` +
    `ธนาคาร: ${bankName.value}\n` +
    `ชื่อบัญชี: ${accountName.value}\n` +
    `เลขบัญชี: ${accountNumber.value}\n` +
    `ยอดคงเหลือหลังถอน: ${formatCurrency(baseBalance - amount)}`
  );
});

currentWalletBalance.textContent = formatCurrency(baseBalance);
withdrawAmountInput.value = 500;
updateWithdrawSummary(500);