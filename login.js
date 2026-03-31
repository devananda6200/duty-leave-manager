document.addEventListener('DOMContentLoaded', () => {
    let currentMode = 'student';
    const btnStudent = document.getElementById('btn-student-login');
    const btnAdmin = document.getElementById('btn-admin-login');
    const loginForm = document.getElementById('login-form');

    // If already logged in, redirect (done async without blocking)
    if (window.supabaseClient) {
        supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
            if (session) {
                const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', session.user.id).single();
                if (profile) {
                    if (profile.role === 'admin') window.location.href = 'admin.html';
                    else window.location.href = 'index.html';
                }
            }
        }).catch(err => console.error("Session check error:", err));
    } else {
        alert("Supabase client failed to load! Check console.");
    }

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

    loginForm.addEventListener('submit', async (e) => {
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

        if (!pass) {
            showError("Password is required.");
            return;
        }

        // Display loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Signing In...';
        submitBtn.disabled = true;

        try {
            const email = user.includes('@') ? user : `${user}@example.com`;

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: pass
            });

            if (error) {
                showError(`Login Failed: ${error.message}`);
                return;
            }

            // Fetch role to redirect correctly
            const { data: profile, error: profileErr } = await supabaseClient.from('profiles').select('role').eq('id', data.session.user.id).single();
            
            if (profileErr) {
                showError(`Profile Error: ${profileErr.message} - The database trigger might have failed to create your profile.`);
                console.error(profileErr);
                return;
            }

            if (profile) {
                if (profile.role === 'admin' && currentMode !== 'admin') {
                    alert('You are logging in with an admin account but selected student mode.');
                }
                
                if (profile.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                showError("No profile found for your user. Please check your Supabase 'profiles' table.");
            }
        } catch (err) {
            console.error(err);
            showError("An unexpected error occurred during login.");
        } finally {
            if (!submitBtn.disabled) return; // In case of redirect
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
});

