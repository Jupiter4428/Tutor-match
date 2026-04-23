
const form = document.getElementById('loginForm');
const messageBox = document.getElementById('message');
const loginBtn = document.getElementById('loginBtn');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    messageBox.textContent = '';
    messageBox.className = '';
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';

    const data = {
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value
    };

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user_id', String(result.user.user_id));
            localStorage.setItem('user_role', result.user.role);
            localStorage.setItem('userData', JSON.stringify(result.user));

            messageBox.textContent = 'Login successful...';
            messageBox.className = 'success';

            const role = result.user.role;

            setTimeout(() => {
                if (role === 'admin') {
                    window.location.href = '/home/admin';
                } else if (role === 'tutor') {
                    window.location.href = '/home/tutor';
                } else {
                    window.location.href = '/home/student';
                }
            }, 500);
        } else {
            messageBox.textContent = result.message || 'Login failed. Please try again.';
            messageBox.className = 'error';
        }
    } catch (error) {
        messageBox.textContent = 'Error: ' + error.message;
        messageBox.className = 'error';
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
});