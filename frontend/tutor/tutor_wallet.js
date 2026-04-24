const TOKEN = localStorage.getItem('token');

if (!TOKEN) {
  alert("กรุณาเข้าสู่ระบบก่อนใช้งาน Wallet");
  window.location.href = '/login';
}

function goToTutorHome() {

  window.location.href = "/home/tutor";

}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const apiHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`
};

let baseBalance = 0;
let walletId = "";

const currentWalletBalance = document.getElementById('currentWalletBalance');
const withdrawAmountInput = document.getElementById('withdrawAmount');
const summaryWithdraw = document.getElementById('summaryWithdraw');
const summaryBalanceAfterWithdraw = document.getElementById('summaryBalanceAfterWithdraw');
const confirmWithdrawBtn = document.getElementById('confirmWithdrawBtn');
const bankName = document.getElementById('bankName');
const accountName = document.getElementById('accountName');
const accountNumber = document.getElementById('accountNumber');

accountNumber.addEventListener('input', () => {
  accountNumber.value = accountNumber.value.replace(/\D/g, '').slice(0, 10);
});

function formatCurrency(amount) {
  return `฿${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

async function fetchWalletData() {
  try {
    const res = await fetch('/tutor/api/wallet', { headers: apiHeaders });
    const data = await res.json();

    if (data.status === 'success') {
      baseBalance = parseFloat(data.data.balance || 0);
      walletId = data.data.wallet_id || "";

      currentWalletBalance.textContent = formatCurrency(baseBalance);
      setText('heroBalance', formatCurrency(baseBalance));
      setText('heroWalletStatus', data.data.status || 'active');

      const pillElements = document.querySelectorAll('.wallet-meta .pill');

      if (pillElements.length > 1) {
        pillElements[1].textContent = `Wallet ID: #TWT-${walletId}`;
      }

      if (pillElements.length > 2) {
        pillElements[2].textContent = `Updated: ${data.data.updated_at || '-'}`;
      }

      updateWithdrawSummary(withdrawAmountInput.value || 500);
    } else {
      console.warn(data.message || "โหลด Tutor Wallet ไม่สำเร็จ");
    }
  } catch (error) {
    console.error("Error fetching tutor wallet:", error);
  }
}

async function fetchTransactions() {
  const listContainer = document.querySelector('.transaction-list');

  try {
    const res = await fetch('/tutor/api/wallet/transactions', { headers: apiHeaders });
    const data = await res.json();

    if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
      setText('heroTxCount', `${data.data.length} รายการ`);

      const lastEarning = data.data.find(t => t.transaction_type === 'tutor_earnings');
      const lastWithdraw = data.data.find(t => t.transaction_type === 'withdrawal');
      const lastFee = data.data.find(t => t.transaction_type === 'platform_fee');
      const lastTx = data.data[0];

      if (lastEarning) setText('miniLastEarning', `+ ${formatCurrency(lastEarning.amount)}`);
      if (lastWithdraw) setText('miniLastWithdraw', `- ${formatCurrency(lastWithdraw.amount)}`);
      if (lastFee) setText('miniLastFee', `- ${formatCurrency(lastFee.amount)}`);
      if (lastTx) setText('miniLastType', lastTx.transaction_type);

      const titleMap = {
        tutor_earnings: 'รายได้จากการสอน',
        withdrawal: 'ถอนเงินเข้าบัญชี',
        platform_fee: 'ค่าธรรมเนียมแพลตฟอร์ม',
        payment: 'รายการจ่ายเงิน',
        refund: 'รายการคืนเงิน'
      };

      const iconMap = {
        tutor_earnings: '💼',
        withdrawal: '🏦',
        platform_fee: '💠',
        payment: '📚',
        refund: '↩️'
      };

      const iconBgMap = {
        tutor_earnings: 'linear-gradient(135deg,rgba(46,230,166,.3),rgba(139,107,255,.2))',
        withdrawal: 'linear-gradient(135deg,rgba(255,123,146,.3),rgba(255,215,92,.2))',
        platform_fee: 'linear-gradient(135deg,rgba(255,215,92,.3),rgba(255,95,210,.2))',
        payment: 'linear-gradient(135deg,rgba(66,216,255,.3),rgba(139,107,255,.25))',
        refund: 'linear-gradient(135deg,rgba(46,230,166,.3),rgba(66,216,255,.25))'
      };

      const chipMap = {
        tutor_earnings: 'success',
        withdrawal: 'danger',
        platform_fee: 'warning',
        payment: 'warning',
        refund: 'success'
      };

      const isInMap = {
        tutor_earnings: true,
        refund: true
      };

      const refPrefixMap = {
        application: 'APP',
        withdrawal_request: 'WDR'
      };

      listContainer.innerHTML = data.data.map(t => {
        const type = t.transaction_type;
        const isIn = !!isInMap[type];
        const sign = isIn ? '+' : '-';
        const moneyClass = isIn ? 'in' : 'out';

        const dateText = t.formatted_date || t.transaction_date || '-';

        let refText = '';
        if (t.reference_type) {
          const prefix = refPrefixMap[t.reference_type] || t.reference_type.toUpperCase().slice(0, 3);
          const refId = t.reference_id ? t.reference_id : t.transaction_id;
          refText = `${t.reference_type} #${prefix}-${refId}`;
        } else {
          refText = `TXN-${t.transaction_id}`;
        }

        const noteText = t.description || '';
        const refLine = noteText ? `${refText} • ${noteText}` : refText;

        return `
          <div class="transaction-item">
            <div class="transaction-icon" style="background:${iconBgMap[type] || iconBgMap.tutor_earnings}">
              ${iconMap[type] || '💳'}
            </div>

            <div class="transaction-main">
              <h4>${titleMap[type] || type}</h4>
              <p>อ้างอิง: ${refLine}</p>
            </div>

            <div class="transaction-type">
              <span class="status-chip ${chipMap[type] || 'success'}">${type}</span>
            </div>

            <div class="transaction-money">
              <div class="money ${moneyClass}">${sign} ${formatCurrency(t.amount)}</div>
              <div class="money-sub">Balance After: ${formatCurrency(t.balance_after)}</div>
            </div>

            <div class="transaction-date">
              ${dateText}
            </div>
          </div>`;
      }).join('');
    } else {
      setText('heroTxCount', '0 รายการ');
      listContainer.innerHTML = `
        <div style="text-align:center;padding:20px;color:var(--muted);">
          ไม่มีประวัติการทำรายการในระบบ
        </div>
      `;
    }
  } catch (error) {
    console.error("Error fetching tutor transactions:", error);
    listContainer.innerHTML = `
      <div style="text-align:center;padding:20px;color:var(--muted);">
        โหลดประวัติธุรกรรมไม่สำเร็จ
      </div>
    `;
  }
}

confirmWithdrawBtn.addEventListener('click', async () => {
  const amount = Number(withdrawAmountInput.value);
  const note = document.getElementById('withdrawNote').value;

  if (!amount || amount <= 0) {
    alert('กรุณากรอกจำนวนเงินถอนให้ถูกต้อง');
    return;
  }

  if (amount > baseBalance) {
    alert('ยอดเงินรายได้ใน Wallet ไม่เพียงพอสำหรับการถอน');
    return;
  }

  if (bankName.value === '' || accountName.value.trim() === '' || accountNumber.value.trim() === '') {
    alert('กรุณากรอกข้อมูลธนาคาร ชื่อบัญชี และเลขบัญชีให้ครบถ้วน');
    return;
  }

  confirmWithdrawBtn.disabled = true;
  confirmWithdrawBtn.textContent = 'กำลังดำเนินการ...';

  try {
    const res = await fetch('/tutor/api/wallet/withdraw', {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({
        amount,
        bank_name: bankName.value,
        account_name: accountName.value,
        account_number: accountNumber.value,
        note
      })
    });

    const data = await res.json();

    if (data.status === 'success') {
      alert('แจ้งถอนเงินสำเร็จ! ระบบได้ตัดยอดเงินในกระเป๋าของคุณแล้ว');

      document.getElementById('withdrawNote').value = '';
      accountName.value = '';
      accountNumber.value = '';
      bankName.value = '';

      await fetchWalletData();
      await fetchTransactions();
    } else {
      alert(data.message || 'ถอนเงินไม่สำเร็จ');
    }
  } catch (err) {
    console.error(err);
    alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
  }

  confirmWithdrawBtn.disabled = false;
  confirmWithdrawBtn.textContent = '🏦 Confirm Withdraw';
});

function updateWithdrawSummary(amount) {
  const withdraw = Number(amount) || 0;
  let balanceAfter = baseBalance - withdraw;

  if (balanceAfter < 0) balanceAfter = 0;

  summaryWithdraw.textContent = formatCurrency(withdraw);
  summaryBalanceAfterWithdraw.textContent = formatCurrency(balanceAfter);
}

document.querySelectorAll('.withdraw-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.withdraw-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const val = btn.textContent.replace('฿', '').replace(',', '').trim();
    withdrawAmountInput.value = val;
    updateWithdrawSummary(val);
  });
});

document.querySelectorAll('.filter-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  });
});

withdrawAmountInput.addEventListener('input', () => {
  updateWithdrawSummary(withdrawAmountInput.value);
});

withdrawAmountInput.value = 500;

fetchWalletData();
fetchTransactions();