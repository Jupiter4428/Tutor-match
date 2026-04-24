const TOKEN = localStorage.getItem('token');

if (!TOKEN) {
  alert("กรุณาเข้าสู่ระบบก่อนใช้งาน Wallet");
  window.location.href = '/login';
}

function goToStuHome() {
  window.location.href = "/home/student";
}

function goToMyCourses() {
  window.location.href = "/student/courses";
}

function scrollToSection(id) {
  const el = document.getElementById(id);
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

let baseBalance = 0;
let walletId = "";

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
    const res = await fetch('/student/api/wallet', { headers: apiHeaders });
    const data = await res.json();

    if (data.status === 'success') {
      baseBalance = parseFloat(data.data.balance || 0);
      walletId = data.data.wallet_id || "";

      currentWalletBalance.textContent = formatCurrency(baseBalance);
      setText('heroBalance', formatCurrency(baseBalance));
      setText('heroWalletStatus', data.data.status || 'active');

      const pillElements = document.querySelectorAll('.wallet-meta .pill');
      if (pillElements.length > 1) {
        pillElements[1].textContent = `Wallet ID: #WLT-${walletId}`;
      }
      if (pillElements.length > 2) {
        pillElements[2].textContent = `Updated: ${data.data.updated_at || '-'}`;
      }

      updateDepositSummary(depositAmountInput.value || 500);
      updateWithdrawSummary(withdrawAmountInput.value || 100);
    } else {
      console.warn(data.message || "โหลด wallet ไม่สำเร็จ");
    }
  } catch (error) {
    console.error("Error fetching wallet:", error);
  }
}

async function fetchTransactions() {
  const listContainer = document.querySelector('.transaction-list');

  try {
    const res = await fetch('/student/api/wallet/transactions', { headers: apiHeaders });
    const data = await res.json();

    if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
      setText('heroTxCount', `${data.data.length} รายการ`);

      const lastDeposit = data.data.find(t => t.transaction_type === 'deposit');
      const lastPayment = data.data.find(t => t.transaction_type === 'payment');
      const lastRefund = data.data.find(t => t.transaction_type === 'refund');
      const lastTx = data.data[0];

      if (lastDeposit) setText('miniLastDeposit', `+ ${formatCurrency(lastDeposit.amount)}`);
      if (lastPayment) setText('miniLastPayment', `- ${formatCurrency(lastPayment.amount)}`);
      if (lastRefund) setText('miniLastRefund', `+ ${formatCurrency(lastRefund.amount)}`);
      if (lastTx) setText('miniLastType', lastTx.transaction_type);

      const titleMap = {
        deposit: 'ฝากเงินเข้า Wallet',
        withdrawal: 'ถอนเงินคงเหลือกลับบัญชี',
        payment: 'ชำระค่าเรียน',
        refund: 'รับเงินคืน',
        tutor_earnings: 'รายได้จากการสอน',
        platform_fee: 'ค่าธรรมเนียมแพลตฟอร์ม',
      };

      const iconMap = {
        deposit: '💸',
        withdrawal: '🏦',
        payment: '📚',
        refund: '↩️',
        tutor_earnings: '💼',
        platform_fee: '💠',
      };

      const iconBgMap = {
        deposit: 'linear-gradient(135deg,rgba(255,95,210,.35),rgba(139,107,255,.25))',
        withdrawal: 'linear-gradient(135deg,rgba(255,123,146,.3),rgba(255,215,92,.2))',
        payment: 'linear-gradient(135deg,rgba(66,216,255,.3),rgba(139,107,255,.25))',
        refund: 'linear-gradient(135deg,rgba(46,230,166,.3),rgba(66,216,255,.25))',
        tutor_earnings: 'linear-gradient(135deg,rgba(46,230,166,.3),rgba(139,107,255,.2))',
        platform_fee: 'linear-gradient(135deg,rgba(255,215,92,.3),rgba(255,95,210,.2))',
      };

      const chipMap = {
        deposit: 'completed',
        withdrawal: 'completed',
        refund: 'completed',
        payment: 'pending',
        platform_fee: 'pending',
        tutor_earnings: 'completed',
      };

      const isInMap = {
        deposit: true,
        refund: true,
        tutor_earnings: true
      };

      const refPrefixMap = {
        deposit_slip: 'DPS',
        withdrawal_request: 'WDR',
        application: 'APP',
        deposit_slip_manual: 'DPS',
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
            <div class="transaction-icon" style="background:${iconBgMap[type] || iconBgMap.deposit}">
              ${iconMap[type] || '💳'}
            </div>

            <div class="transaction-main">
              <h4>${titleMap[type] || type}</h4>
              <p>อ้างอิง: ${refLine}</p>
            </div>

            <div class="transaction-type">
              <div class="status-chip ${chipMap[type] || 'completed'}">${type}</div>
            </div>

            <div class="transaction-balance">
              <div class="money ${moneyClass}">${sign} ${formatCurrency(t.amount)}</div>
              <div style="color:var(--muted);font-size:.86rem;">
                Balance After: ${formatCurrency(t.balance_after)}
              </div>
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
    console.error("Error fetching transactions:", error);
    listContainer.innerHTML = `
      <div style="text-align:center;padding:20px;color:var(--muted);">
        โหลดประวัติธุรกรรมไม่สำเร็จ
      </div>
    `;
  }
}

confirmDepositBtn.addEventListener('click', async () => {
  const amount = Number(depositAmountInput.value);
  const note = document.getElementById('depositNote').value;

  if (!amount || amount <= 0) {
    alert('กรุณากรอกจำนวนเงินฝากให้ถูกต้อง');
    return;
  }

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
      await fetchWalletData();
      await fetchTransactions();
    } else {
      alert(data.message || 'ฝากเงินไม่สำเร็จ');
    }
  } catch (err) {
    console.error(err);
    alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
  }

  confirmDepositBtn.disabled = false;
  confirmDepositBtn.textContent = '💸 Confirm Deposit';
});

confirmWithdrawBtn.addEventListener('click', async () => {
  const amount = Number(withdrawAmountInput.value);
  const note = document.getElementById('withdrawNote').value;

  if (!amount || amount <= 0) {
    alert('กรุณากรอกจำนวนเงินถอนให้ถูกต้อง');
    return;
  }

  if (amount > baseBalance) {
    alert('ยอดเงินใน Wallet ของคุณไม่เพียงพอสำหรับการถอน');
    return;
  }

  if (bankName.value === '' || accountNumber.value.trim() === '') {
    alert('กรุณากรอกข้อมูลธนาคารและเลขบัญชีให้ครบถ้วน');
    return;
  }

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

document.querySelectorAll('.amount-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const val = btn.textContent.replace('฿', '').replace(',', '').trim();
    depositAmountInput.value = val;
    updateDepositSummary(val);
  });
});

document.querySelectorAll('.withdraw-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.withdraw-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const val = btn.textContent.replace('฿', '').replace(',', '').trim();
    withdrawAmountInput.value = val;
    updateWithdrawSummary(val);
  });
});

document.querySelectorAll('.method-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.method-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
  });
});

document.querySelectorAll('.filter-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  });
});

depositAmountInput.addEventListener('input', () => updateDepositSummary(depositAmountInput.value));
withdrawAmountInput.addEventListener('input', () => updateWithdrawSummary(withdrawAmountInput.value));

depositAmountInput.value = 500;
withdrawAmountInput.value = 100;

fetchWalletData();
fetchTransactions();