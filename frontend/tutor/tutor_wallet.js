// tutor_wallet.js

// ดึงข้อมูลจาก LocalStorage
const TOKEN = localStorage.getItem('token');

function authHeader() {
  return { Authorization: `Bearer ${TOKEN}` };
}

// ตัวแปรเก็บยอดเงินจริงจาก DB (เริ่มต้นเป็น 0)
let currentBalance = 0;

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

// --- 1. ฟังก์ชันโหลดข้อมูลจริงจาก Backend ---
async function loadWalletData() {
  try {
    const res = await fetch('/tutor/api/wallet', {
      headers: authHeader()
    });
    const result = await res.json();

    if (result.status === 'success') {
      currentBalance = result.data.balance;
      // แสดงยอดเงินจริงบนหน้าเว็บ
      currentWalletBalance.textContent = formatCurrency(currentBalance);
      // รีเซ็ตการคำนวณสรุปด้านล่าง
      updateWithdrawSummary(withdrawAmountInput.value);
      
      // (Option) ถ้ามีส่วนแสดงประวัติธุรกรรม สามารถเพิ่มการ render ตรงนี้ได้
      // renderTransactions(result.data.transactions);
    }
  } catch (err) {
    console.error("Load wallet failed", err);
  }
}

function formatCurrency(amount) {
  return `฿${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function updateWithdrawSummary(amount) {
  const withdraw = Number(amount) || 0;
  let balanceAfter = currentBalance - withdraw; // ใช้ค่าจาก DB

  if (balanceAfter < 0) balanceAfter = 0;

  summaryWithdraw.textContent = formatCurrency(withdraw);
  summaryBalanceAfterWithdraw.textContent = formatCurrency(balanceAfter);
}

// --- 2. ฟังก์ชันส่งคำขอถอนเงินไปยัง Backend ---
confirmWithdrawBtn.addEventListener('click', async () => {
  const amount = Number(withdrawAmountInput.value);

  // Validation ฝั่ง Frontend
  if (!amount || amount <= 0) {
    alert('กรุณากรอกจำนวนเงินถอนให้ถูกต้อง');
    return;
  }
  if (amount > currentBalance) {
    alert('ยอดเงินรายได้ไม่เพียงพอ');
    return;
  }
  if (!bankName.value || !accountName.value.trim() || !accountNumber.value.trim()) {
    alert('กรุณากรอกข้อมูลบัญชีธนาคารให้ครบถ้วน');
    return;
  }

  if (!confirm(`คุณต้องการยืนยันการถอนเงินจำนวน ${formatCurrency(amount)} ใช่หรือไม่?`)) return;

  try {
    const res = await fetch('/tutor/api/wallet/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      },
      body: JSON.stringify({
        amount: amount,
        bank_name: bankName.value,
        account_name: accountName.value.trim(),
        account_number: accountNumber.value.trim()
      })
    });

    const result = await res.json();

    if (result.status === 'success') {
      alert('คำขอถอนเงินสำเร็จ! ระบบจะดำเนินการภายใน 1-3 วันทำการ');
      location.reload(); // โหลดหน้าใหม่เพื่ออัปเดตยอดเงินล่าสุด
    } else {
      alert('เกิดข้อผิดพลาด: ' + result.message);
    }
  } catch (err) {
    alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
  }
});

// Event Listeners อื่นๆ คงเดิม
withdrawButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const amountText = btn.textContent.replace('฿', '').replace(',', '').trim();
    withdrawAmountInput.value = amountText;
    updateWithdrawSummary(amountText);
  });
});

withdrawAmountInput.addEventListener('input', () => {
  updateWithdrawSummary(withdrawAmountInput.value);
});

// เรียกใช้งานเมื่อโหลดหน้าเสร็จ
document.addEventListener('DOMContentLoaded', () => {
  loadWalletData();
  withdrawAmountInput.value = 500;
});