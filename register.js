document.addEventListener('DOMContentLoaded', () => {
    let currentMode = 'student';
    const btnStudent = document.getElementById('btn-student-register');
    const btnAdmin = document.getElementById('btn-admin-register');
    const registerForm = document.getElementById('register-form');
    const submitBtn = document.getElementById('btn-submit-register');

    btnStudent.addEventListener('click', () => {
        currentMode = 'student';
        btnStudent.classList.add('active');
        btnAdmin.classList.remove('active');
    });

    btnAdmin.addEventListener('click', () => {
        currentMode = 'admin';
        btnAdmin.classList.add('active');
        btnStudent.classList.remove('active');
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value.trim();
        const pass = document.getElementById('password').value;
        const errorMsg = document.getElementById('error-msg');
        
        const showError = (msg) => {
            errorMsg.textContent = msg;
            errorMsg.style.display = 'block';
        };
        errorMsg.style.display = 'none';

        if (!user) {
            showError("Username/Email is required.");
            return;
        }
        
        if (user.includes(' ')) {
            showError("Username/Email cannot contain spaces.");
            return;
        }

        if (pass.length < 6) {
            showError("Password must be at least 6 characters.");
            return;
        }
        
        if (!/[A-Z]/.test(pass) || !/\d/.test(pass)) {
            showError("Password must contain at least one uppercase letter and one number.");
            return;
        }

        const email = user.includes('@') ? user : `${user}@example.com`;
        
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating Account...';
        submitBtn.disabled = true;

        if (!window.supabaseClient) {
            showError("Supabase client failed to load! Check console.");
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: pass,
                options: {
                    data: { 
                        full_name: user.split('@')[0],
                        role: currentMode
                    }
                }
            });

            if (error) {
                showError(`Registration failed: ${error.message}`);
            } else {
                alert('Account created successfully! Redirecting to login...');
                window.location.href = 'login.html';
            }
        } catch (err) {
            console.error(err);
            showError("Unexpected error during registration.");
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
});
