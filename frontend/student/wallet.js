// 1. ตรวจสอบการเข้าสู่ระบบ
const TOKEN = localStorage.getItem('token');
if (!TOKEN) {
  alert("กรุณาเข้าสู่ระบบก่อนใช้งาน Wallet");
  window.location.href = '/login';
}

function goToStuHome() {
  window.location.href = "/home/student";
}

function scrollToSection(id) {
  const el = document.getElementById(id); // ระบบจะไปหา element ตาม ID ที่ส่งมา
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    console.error("หา Element ที่มี ID: " + id + " ไม่เจอครับ!");
  }
}

const apiHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`
};

// ตัวแปรเก็บข้อมูลจาก Database
let baseBalance = 0;
let walletId = "";

// อ้างอิง Elements ในหน้า HTML
const currentWalletBalance = document.getElementById('currentWalletBalance');
const depositAmountInput = document.getElementById('depositAmount');
const withdrawAmountInput = document.getElementById('withdrawAmount');
const summaryDeposit = document.getElementById('summaryDeposit');
const summaryBalance = document.getElementById('summaryBalance');
const summaryWithdraw = document.getElementById('summaryWithdraw');
const summaryWithdrawBalance = document.getElementById('summaryWithdrawBalance');
const confirmDepositBtn = document.getElementById('confirmDepositBtn');
const confirmWithdrawBtn = document.getElementById('confirmWithdrawBtn');
const bankName = document.getElementById('bankName');
const accountNumber = document.getElementById('accountNumber');

// ฟังก์ชันจัดรูปแบบตัวเลขให้เป็นสกุลเงิน (฿ x,xxx.xx)
function formatCurrency(amount) {
  return `฿${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ==========================================
// ส่วนที่ 1: ดึงข้อมูลยอดเงิน (Balance) จาก DB
// ==========================================
async function fetchWalletData() {
  try {
    const res = await fetch('/student/api/wallet', { headers: apiHeaders });
    const data = await res.json();

    if (data.status === 'success') {
      baseBalance = parseFloat(data.data.balance);
      walletId = data.data.wallet_id;

      // อัปเดตตัวเลขบนหน้าเว็บ
      currentWalletBalance.textContent = formatCurrency(baseBalance);

      // อัปเดต Wallet ID ตรงป้ายบอกสถานะ
      const pillElements = document.querySelectorAll('.pill');
      if (pillElements.length > 1) {
        pillElements[1].textContent = `Wallet ID: #WLT-${walletId}`;
      }

      // รีเซ็ตค่าเริ่มต้นในช่องกรอกเงิน
      updateDepositSummary(depositAmountInput.value || 500);
      updateWithdrawSummary(withdrawAmountInput.value || 100);
    }
  } catch (error) {
    console.error("Error fetching wallet:", error);
  }
}

// ==========================================
// ส่วนที่ 2: ดึงประวัติทำรายการ (Transactions) จาก DB
// ==========================================
async function fetchTransactions() {
  try {
    const res = await fetch('/student/api/wallet/transactions', { headers: apiHeaders });
    const data = await res.json();
    const listContainer = document.querySelector('.transaction-list');

    if (data.status === 'success' && data.data.length > 0) {
      listContainer.innerHTML = data.data.map(t => {
        // กำหนดรูปแบบ Icon, สี และเครื่องหมาย (+/-) ตามประเภทธุรกรรม
        let icon = '💸'; let typeClass = 'completed'; let moneyClass = 'in'; let sign = '+';

        if (t.transaction_type === 'withdrawal') {
          icon = '🏦'; typeClass = 'completed'; moneyClass = 'out'; sign = '-';
        } else if (t.transaction_type === 'payment') {
          icon = '📚'; typeClass = 'pending'; moneyClass = 'out'; sign = '-';
        } else if (t.transaction_type === 'refund') {
          icon = '↩️'; typeClass = 'completed'; moneyClass = 'in'; sign = '+';
        }

        // แยกวันที่และเวลาออกจากกัน
        const dateParts = t.formatted_date.split(' ');
        const dateText = `${dateParts[0]} ${dateParts[1]} ${dateParts[2]}`;
        const timeText = dateParts[3];

        return `
                <div class="transaction-item">
                  <div class="transaction-icon">${icon}</div>
                  <div class="transaction-main">
                    <h4>${t.description || t.transaction_type}</h4>
                    <p>อ้างอิง: TXN-${t.transaction_id}</p>
                  </div>
                  <div class="transaction-type">
                    <div class="status-chip ${typeClass}">${t.transaction_type}</div>
                  </div>
                  <div class="transaction-balance">
                    <div class="money ${moneyClass}">${sign} ${formatCurrency(t.amount)}</div>
                    <div style="color:var(--text-fade); font-size:.86rem;">Balance After: ${formatCurrency(t.balance_after)}</div>
                  </div>
                  <div class="transaction-date">
                    ${dateText}<br>
                    <span style="color:var(--text-fade); font-size:.86rem;">${timeText} น.</span>
                  </div>
                </div>`;
      }).join('');
    } else {
      listContainer.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-fade);">ไม่มีประวัติการทำรายการในระบบ</div>`;
    }
  } catch (error) {
    console.error("Error fetching transactions:", error);
  }
}

// ==========================================
// ส่วนที่ 3: ส่ง API บันทึกการฝากเงิน (Deposit)
// ==========================================
confirmDepositBtn.addEventListener('click', async () => {
  const amount = Number(depositAmountInput.value);
  const note = document.getElementById('depositNote').value;

  if (!amount || amount <= 0) return alert('กรุณากรอกจำนวนเงินฝากให้ถูกต้อง');

  confirmDepositBtn.disabled = true;
  confirmDepositBtn.textContent = 'กำลังดำเนินการ...';

  try {
    const res = await fetch('/student/api/wallet/deposit', {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({ amount, note })
    });
    const data = await res.json();

    if (data.status === 'success') {
      alert('ฝากเงินสำเร็จ! ยอดเงินอัปเดตเข้ากระเป๋าเรียบร้อย');
      document.getElementById('depositNote').value = '';

      // โหลดข้อมูลใหม่เพื่ออัปเดตหน้าจอทันที
      fetchWalletData();
      fetchTransactions();
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
  }
  confirmDepositBtn.disabled = false;
  confirmDepositBtn.textContent = '💸 Confirm Deposit';
});

// ==========================================
// ส่วนที่ 4: ส่ง API บันทึกการถอนเงิน (Withdraw)
// ==========================================
confirmWithdrawBtn.addEventListener('click', async () => {
  const amount = Number(withdrawAmountInput.value);
  const note = document.getElementById('withdrawNote').value;

  if (!amount || amount <= 0) return alert('กรุณากรอกจำนวนเงินถอนให้ถูกต้อง');
  if (amount > baseBalance) return alert('ยอดเงินใน Wallet ของคุณไม่เพียงพอสำหรับการถอน');
  if (bankName.value === '' || accountNumber.value.trim() === '') return alert('กรุณากรอกข้อมูลธนาคารและเลขบัญชีให้ครบถ้วน');

  confirmWithdrawBtn.disabled = true;
  confirmWithdrawBtn.textContent = 'กำลังดำเนินการ...';

  try {
    const res = await fetch('/student/api/wallet/withdraw', {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({
        amount,
        bank_name: bankName.value,
        account_number: accountNumber.value,
        note
      })
    });
    const data = await res.json();

    if (data.status === 'success') {
      alert('แจ้งถอนเงินสำเร็จ! ระบบได้ตัดยอดเงินในกระเป๋าของคุณแล้ว');
      document.getElementById('withdrawNote').value = '';
      accountNumber.value = '';
      bankName.value = '';

      // โหลดข้อมูลใหม่เพื่ออัปเดตหน้าจอทันที
      fetchWalletData();
      fetchTransactions();
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
  }
  confirmWithdrawBtn.disabled = false;
  confirmWithdrawBtn.textContent = '🏦 Confirm Withdraw';
});

// ==========================================
// ส่วนที่ 5: การคำนวณและตอบสนองของ UI (ปุ่มต่างๆ)
// ==========================================

function updateDepositSummary(amount) {
  const deposit = Number(amount) || 0;
  summaryDeposit.textContent = formatCurrency(deposit);
  summaryBalance.textContent = formatCurrency(baseBalance + deposit);
}

function updateWithdrawSummary(amount) {
  const withdraw = Number(amount) || 0;
  let newBalance = baseBalance - withdraw;
  if (newBalance < 0) newBalance = 0;
  summaryWithdraw.textContent = formatCurrency(withdraw);
  summaryWithdrawBalance.textContent = formatCurrency(newBalance);
}

// ปุ่มกดเลือกจำนวนเงินฝากด่วน
document.querySelectorAll('.amount-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const val = btn.textContent.replace('฿', '').replace(',', '').trim();
    depositAmountInput.value = val;
    updateDepositSummary(val);
  });
});

// ปุ่มกดเลือกจำนวนเงินถอนด่วน
document.querySelectorAll('.withdraw-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.withdraw-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const val = btn.textContent.replace('฿', '').replace(',', '').trim();
    withdrawAmountInput.value = val;
    updateWithdrawSummary(val);
  });
});

// คำนวณแบบ Real-time เวลาพิมพ์ตัวเลขในช่องกรอก
depositAmountInput.addEventListener('input', () => updateDepositSummary(depositAmountInput.value));
withdrawAmountInput.addEventListener('input', () => updateWithdrawSummary(withdrawAmountInput.value));

// ดึงข้อมูลเมื่อโหลดไฟล์ JS เสร็จสิ้น
fetchWalletData();
fetchTransactions();