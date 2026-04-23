
const form = document.getElementById('registerForm');
const messageBox = document.getElementById('message');
const registerBtn = document.getElementById('registerBtn');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    messageBox.textContent = '';
    messageBox.className = '';

    const firstName = document.getElementById('first_name').value.trim();
    const lastName = document.getElementById('last_name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const role = document.getElementById('role').value;
    const agree = document.getElementById('agree').checked;

    if (!agree) {
        messageBox.textContent = 'กรุณายอมรับเงื่อนไขก่อนสมัครสมาชิก';
        messageBox.className = 'error';
        return;
    }

    if (password !== confirmPassword) {
        messageBox.textContent = 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน';
        messageBox.className = 'error';
        return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = 'Creating account...';

    const data = {
        name: firstName + " " + lastName,   // รวมชื่อ
        email: email,
        password: password,
        role: role
    };

    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && (result.status === 'success' || result.message)) {
            messageBox.textContent = result.message || 'สมัครสมาชิกสำเร็จ';
            messageBox.className = 'success';

            setTimeout(() => {
                window.location.href = '/login';
            }, 1200);
        } else {
            messageBox.textContent = result.message || 'สมัครสมาชิกไม่สำเร็จ';
            messageBox.className = 'error';
        }
    } catch (error) {
        messageBox.textContent = 'Error: ' + error.message;
        messageBox.className = 'error';
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Create account';
    }
});