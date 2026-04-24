const TOKEN = localStorage.getItem('token');
if (!TOKEN) {
  localStorage.clear();
  window.location.href = '/login';
}

function authHeader() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`
  };
}

let currentBalance = 0;

const withdrawAmountInput          = document.getElementById('withdrawAmount');
const summaryWithdraw              = document.getElementById('summaryWithdraw');
const summaryBalanceAfterWithdraw  = document.getElementById('summaryBalanceAfterWithdraw');
const currentWalletBalance         = document.getElementById('currentWalletBalance');
const bankName                     = document.getElementById('bankName');
const accountName                  = document.getElementById('accountName');
const accountNumber                = document.getElementById('accountNumber');
const confirmWithdrawBtn           = document.getElementById('confirmWithdrawBtn');

function formatCurrency(amount) {
  return `฿${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function updateWithdrawSummary(amount) {
  const withdraw = Number(amount) || 0;
  let balanceAfter = currentBalance - withdraw;
  if (balanceAfter < 0) balanceAfter = 0;
  summaryWithdraw.textContent = formatCurrency(withdraw);
  summaryBalanceAfterWithdraw.textContent = formatCurrency(balanceAfter);
}

// ==========================================
// 1. โหลดข้อมูล Wallet จาก Backend
// ==========================================
async function loadWalletData() {
  try {
    const res = await fetch('/tutor/api/wallet', { headers: authHeader() });
    const result = await res.json();

    if (result.status === 'success') {
      const w = result.data;
      currentBalance = parseFloat(w.balance);

      currentWalletBalance.textContent = formatCurrency(currentBalance);
      document.getElementById('heroBalance').textContent = formatCurrency(currentBalance);
      document.getElementById('miniWalletStatus').textContent = w.status || 'active';
      document.getElementById('walletIdPill').textContent = `Wallet ID: #WLT-${w.wallet_id}`;

      if (w.updated_at) {
        const d = new Date(w.updated_at);
        document.getElementById('walletUpdatedPill').textContent =
          `Updated: ${d.getDate()} ${d.toLocaleString('th-TH', { month: 'short' })} ${d.getFullYear()}`;
      }

      updateWithdrawSummary(withdrawAmountInput.value);
    }
  } catch (err) {
    console.error('Load wallet failed', err);
  }
}

// ==========================================
// 2. โหลดประวัติธุรกรรม
// ==========================================
async function fetchTransactions() {
  try {
    const res = await fetch('/tutor/api/wallet/transactions', { headers: authHeader() });
    const result = await res.json();
    const listContainer = document.querySelector('.transaction-list');

    if (result.status === 'success' && result.data.length > 0) {
      document.getElementById('heroTxCount').textContent = `${result.data.length} รายการ`;

      const lastEarnings = result.data.find(t => t.transaction_type === 'tutor_earnings');
      const lastWithdraw = result.data.find(t => t.transaction_type === 'withdrawal');
      const lastTx       = result.data[0];

      if (lastEarnings) document.getElementById('miniLastEarnings').textContent = `+ ${formatCurrency(lastEarnings.amount)}`;
      if (lastWithdraw) document.getElementById('miniLastWithdraw').textContent = `- ${formatCurrency(lastWithdraw.amount)}`;
      if (lastTx)       document.getElementById('miniLastTxType').textContent   = lastTx.transaction_type;

      listContainer.innerHTML = result.data.map(t => {
        const isIn = ['tutor_earnings', 'refund', 'deposit'].includes(t.transaction_type);
        const iconMap = {
          tutor_earnings: '💼',
          withdrawal:     '🏦',
          platform_fee:   '💠',
          refund:         '↩️',
          deposit:        '💸',
        };
        const chipMap = {
          tutor_earnings: 'success',
          withdrawal:     'danger',
          platform_fee:   'warning',
          refund:         'completed',
          deposit:        'completed',
        };
        const icon      = iconMap[t.transaction_type] || '💰';
        const chipClass = chipMap[t.transaction_type] || 'completed';
        const sign      = isIn ? '+' : '-';
        const moneyClass = isIn ? 'in' : 'out';

        const dateParts = (t.formatted_date || '').split(' ');
        const dateText  = `${dateParts[0] || ''} ${dateParts[1] || ''} ${dateParts[2] || ''}`;
        const timeText  = dateParts[3] || '';

        return `
          <div class="transaction-item">
            <div class="transaction-icon ${t.transaction_type}">${icon}</div>
            <div class="transaction-main">
              <h4>${t.description || t.transaction_type}</h4>
              <p>อ้างอิง: TXN-${t.transaction_id}</p>
            </div>
            <div class="transaction-type">
              <span class="status-chip ${chipClass}">${t.transaction_type}</span>
            </div>
            <div class="transaction-money">
              <div class="money ${moneyClass}">${sign} ${formatCurrency(t.amount)}</div>
              <div class="money-sub">Balance After: ${formatCurrency(t.balance_after)}</div>
            </div>
            <div class="transaction-date">
              ${dateText}<br><span>${timeText} น.</span>
            </div>
          </div>`;
      }).join('');
    } else {
      listContainer.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-fade);">ไม่มีประวัติการทำรายการในระบบ</div>`;
    }
  } catch (err) {
    console.error('Load transactions failed', err);
  }
}

// ==========================================
// 3. ยืนยันการถอนเงิน
// ==========================================
confirmWithdrawBtn.addEventListener('click', async () => {
  const amount = Number(withdrawAmountInput.value);

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

  confirmWithdrawBtn.disabled = true;
  confirmWithdrawBtn.textContent = 'กำลังดำเนินการ...';

  try {
    const res = await fetch('/tutor/api/wallet/withdraw', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({
        amount,
        bank_name:      bankName.value,
        account_name:   accountName.value.trim(),
        account_number: accountNumber.value.trim()
      })
    });
    const result = await res.json();

    if (result.status === 'success') {
      alert('คำขอถอนเงินสำเร็จ! ระบบจะดำเนินการภายใน 1-3 วันทำการ');
      bankName.value = '';
      accountName.value = '';
      accountNumber.value = '';
      withdrawAmountInput.value = 500;
      await loadWalletData();
      await fetchTransactions();
    } else {
      alert('เกิดข้อผิดพลาด: ' + result.message);
    }
  } catch (err) {
    alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
  }

  confirmWithdrawBtn.disabled = false;
  confirmWithdrawBtn.textContent = '🏦 Confirm Withdraw';
});

// ==========================================
// 4. ปุ่มเลือกจำนวนเงินด่วน
// ==========================================
document.querySelectorAll('.withdraw-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const val = btn.textContent.replace('฿', '').replace(',', '').trim();
    withdrawAmountInput.value = val;
    updateWithdrawSummary(val);
  });
});

withdrawAmountInput.addEventListener('input', () => updateWithdrawSummary(withdrawAmountInput.value));

// ==========================================
// 5. Filter pills (UI only)
// ==========================================
document.querySelectorAll('.filter-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  });
});

// เรียกใช้งานเมื่อโหลดหน้าเสร็จ
withdrawAmountInput.value = 500;
loadWalletData();
fetchTransactions();
