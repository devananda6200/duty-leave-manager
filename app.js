document.addEventListener('DOMContentLoaded', async () => {
    const state = {
        leaves: [],
        session: null,
        profile: null
    };

    // Auth Check
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    state.session = session;

    // Fetch Profile
    const { data: profile, error: profileErr } = await supabaseClient.from('profiles').select('*').eq('id', session.user.id).single();
    if (profileErr || !profile || profile.role !== 'student') {
        alert("Access Denied: You are either not a student, or your profile wasn't found.");
        window.location.href = 'login.html';
        return;
    }
    state.profile = profile;

    // Set User Name
    document.getElementById('user-display-name').textContent = profile.full_name || 'Student';

    // Sidebar Toggle Logic
    const sidebar = document.getElementById('sidebar');
    const btnSidebarToggle = document.getElementById('btn-sidebar-toggle');
    
    if (localStorage.getItem('sidebarState') === 'collapsed') {
        sidebar.classList.add('collapsed');
    }
    
    if (btnSidebarToggle) {
        btnSidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarState', sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded');
        });
    }

    // Logout
    document.getElementById('btn-logout').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html';
    });

    const subjects = ['AAD', 'DATA ANALYTICS', 'Compiler Design', 'Computer Graphics', 'IEFT'];

    async function fetchLeaves() {
        const { data, error } = await supabaseClient.from('leaves').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
        if (!error && data) state.leaves = data;
    }

    // DOM Elements
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.page-section');
    const pageTitle = document.getElementById('page-title');
    const btnNewRequest = document.getElementById('btn-new-request');
    const btnViewAll = document.getElementById('btn-view-all');
    const btnNotifications = document.getElementById('btn-notifications');
    
    const recentLeaveList = document.getElementById('recent-leave-list');
    const documentsGridList = document.getElementById('documents-grid-list');
    const vaultGrid = document.getElementById('vault-grid');
    
    const statApproved = document.getElementById('stat-approved');
    const statPending = document.getElementById('stat-pending');
    const statReminders = document.getElementById('stat-reminders');
    const notificationBadge = document.getElementById('notification-badge');

    async function updateDashboard() {
        await fetchLeaves();
        
        const approvedLeaves = state.leaves.filter(l => l.status === 'Approved');
        const pendingCount = state.leaves.filter(l => l.status === 'Pending').length;
        const missingCertificates = approvedLeaves.filter(l => !l.certificate_url);
        
        statApproved.textContent = approvedLeaves.length;
        statPending.textContent = pendingCount;
        statReminders.textContent = missingCertificates.length;
        notificationBadge.textContent = missingCertificates.length;

        if (missingCertificates.length === 0) {
            notificationBadge.style.display = 'none';
        } else {
            notificationBadge.style.display = 'flex';
        }

        // Render Leaves
        recentLeaveList.innerHTML = '';
        state.leaves.forEach(leave => {
            const statusClass = leave.status === 'Approved' ? 'status-approved' : 
                               (leave.status === 'Pending' ? 'status-pending' : 'status-rejected');
            
            let extraInfo = '';
            if (leave.type === 'single') {
                extraInfo = '<div class="student-subject-tracker">';
                let approvedSubj = 0;
                subjects.forEach(sub => {
                    if (leave.subject_approvals && leave.subject_approvals[sub]) approvedSubj++;
                });
                extraInfo += `<p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 8px;">Subject Approvals: <strong>${approvedSubj}/${subjects.length}</strong></p>`;
                extraInfo += `<div class="progress-bar"><div class="progress-fill" style="width: ${(approvedSubj/subjects.length)*100}%"></div></div></div>`;
            }

            recentLeaveList.innerHTML += `
                <div class="leave-item" style="flex-direction: column; align-items: stretch;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div class="leave-info">
                            <h4>${leave.event}</h4>
                            <p>${leave.date}</p>
                        </div>
                        <div class="status-badge ${statusClass}">
                            ${leave.status}
                        </div>
                    </div>
                    ${extraInfo}
                </div>
            `;
        });

        // Render Documents & Vault Section
        documentsGridList.innerHTML = '';
        vaultGrid.innerHTML = '';
        
        if (missingCertificates.length === 0) {
            documentsGridList.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">No pending documents! 🎉</div>';
        } else {
            missingCertificates.forEach(leave => {
                const cardHTML = `
                    <div class="document-card">
                        <div class="doc-icon"><i class="fa-solid fa-file-circle-exclamation" style="color: var(--warning)"></i></div>
                        <div class="doc-content">
                            <h4>Participation Certificate Needed</h4>
                            <p>${leave.event}</p>
                            <span class="doc-due">Status: Approved</span>
                        </div>
                        <label for="cert-upload-${leave.id}" class="btn-upload-icon" style="cursor:pointer;"><i class="fa-solid fa-cloud-arrow-up"></i></label>
                        <input type="file" id="cert-upload-${leave.id}" accept=".pdf,.png,.jpg" hidden onchange="uploadCertificate('${leave.id}', this)">
                    </div>
                `;
                documentsGridList.innerHTML += cardHTML;
                vaultGrid.innerHTML += cardHTML;
            });
        }

        // Add uploaded slips & certificates to Vault
        state.leaves.forEach(leave => {
            if (leave.permission_slip_url) {
                vaultGrid.innerHTML += `
                    <div class="document-card doc-completed">
                        <div class="doc-icon" style="color: var(--secondary)"><i class="fa-solid fa-file-pdf"></i></div>
                        <div class="doc-content">
                            <h4>Permission Slip</h4>
                            <p>${leave.event}</p>
                            <span class="doc-due" style="color: var(--secondary)">Uploaded</span>
                        </div>
                        <a href="${leave.permission_slip_url}" target="_blank" class="btn-upload-icon" style="opacity: 0.8"><i class="fa-solid fa-eye"></i></a>
                    </div>
                `;
            }
            if (leave.certificate_url) {
                vaultGrid.innerHTML += `
                    <div class="document-card doc-completed">
                        <div class="doc-icon" style="color: var(--primary)"><i class="fa-solid fa-medal"></i></div>
                        <div class="doc-content">
                            <h4>Participation Certificate</h4>
                            <p>${leave.event}</p>
                            <span class="doc-due" style="color: var(--secondary)">Uploaded</span>
                        </div>
                        <a href="${leave.certificate_url}" target="_blank" class="btn-upload-icon" style="opacity: 0.8"><i class="fa-solid fa-eye"></i></a>
                    </div>
                `;
            }
        });

        // Render Student Leave Record Table
        const studentHistoryTbody = document.getElementById('student-history-tbody');
        if (studentHistoryTbody) {
            studentHistoryTbody.innerHTML = '';
            state.leaves.forEach(leave => {
                const statusColor = leave.status === 'Approved' ? 'var(--secondary)' : (leave.status === 'Rejected' ? 'var(--warning)' : 'var(--primary)');
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                tr.innerHTML = `
                    <td style="padding: 12px;"><strong>${leave.event}</strong></td>
                    <td style="padding: 12px;">${leave.date}</td>
                    <td style="padding: 12px; color: var(--text-secondary); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${leave.reason || ''}">${leave.reason || '-'}</td>
                    <td style="padding: 12px;"><span style="color: ${statusColor}; font-weight: 500;">${leave.status}</span></td>
                `;
                studentHistoryTbody.appendChild(tr);
            });
            if (state.leaves.length === 0) {
                studentHistoryTbody.innerHTML = '<tr><td colspan="4" style="padding: 15px; text-align: center; color: var(--text-secondary);">No leave records found.</td></tr>';
            }
        }
    }

    function switchSection(targetId, title) {
        sections.forEach(sec => sec.classList.remove('active'));
        navItems.forEach(nav => nav.classList.remove('active'));
        
        document.getElementById(`section-${targetId}`).classList.add('active');
        document.getElementById(`nav-${targetId}`).classList.add('active');
        pageTitle.textContent = title;
    }

    navItems.forEach(nav => {
        nav.addEventListener('click', (e) => {
            e.preventDefault();
            const a = nav.closest('a');
            if (a && a.id) {
                const id = a.id.replace('nav-', '');
                let title = 'Dashboard Overview';
                if (id === 'apply') title = 'Apply for Duty-Leave';
                if (id === 'documents') title = 'My Documents Vault';
                if (id === 'history') title = 'Duty Leaves Record';
                switchSection(id, title);
            }
        });
    });

    btnNewRequest.addEventListener('click', () => {
        switchSection('apply', 'Apply for Duty-Leave');
    });

    if (btnViewAll) {
        btnViewAll.addEventListener('click', () => {
            switchSection('history', 'Duty Leaves Record');
        });
    }

    if (btnNotifications) {
        btnNotifications.addEventListener('click', () => {
            switchSection('documents', 'My Documents Vault');
        });
    }

    const leaveForm = document.getElementById('leave-form');
    leaveForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submit-leave-btn');
        const origText = submitBtn.textContent;
        submitBtn.textContent = 'Uploading & Submitting...';
        submitBtn.disabled = true;

        const eventName = document.getElementById('event-name').value;
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const reasonText = document.getElementById('reason').value;
        const fileInput = document.getElementById('permission-slip');
        
        const file = fileInput.files[0];
        if (!file) {
            alert("Please select a Permission Slip/Brochure to upload.");
            submitBtn.textContent = origText;
            submitBtn.disabled = false;
            return;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${state.session.user.id}/${Date.now()}_slip.${fileExt}`;
        
        const { error: uploadError } = await supabaseClient.storage.from('documents').upload(fileName, file);
        if (uploadError) {
            alert(`File upload failed: ${uploadError.message}`);
            submitBtn.textContent = origText;
            submitBtn.disabled = false;
            return;
        }

        const { data: publicUrlData } = supabaseClient.storage.from('documents').getPublicUrl(fileName);

        const isSingleDay = (startDate === endDate);
        const newLeave = {
            user_id: state.session.user.id,
            event: eventName,
            date: isSingleDay ? `${startDate} to ${startDate}` : `${startDate} to ${endDate}`,
            status: 'Pending',
            type: isSingleDay ? 'single' : 'multi',
            subject_approvals: {},
            reason: reasonText,
            permission_slip_url: publicUrlData.publicUrl
        };

        if (isSingleDay) {
            subjects.forEach(sub => newLeave.subject_approvals[sub] = false);
        }

        const { error } = await supabaseClient.from('leaves').insert([newLeave]);
        
        if (error) {
            console.error(error);
            alert('Failed to submit leave application.');
        } else {
            // Attempt to send email to Faculty Advisor via EmailJS
            try {
                // These keys map directly to variables in your EmailJS Email Template: {{student_name}} etc.
                const templateParams = {
                    student_name: state.profile.full_name,
                    student_email: state.session.user.email,
                    event_name: eventName,
                    dates: isSingleDay ? `${startDate}` : `${startDate} to ${endDate}`,
                    reason: reasonText,
                    type: isSingleDay ? '1-Day Leave' : 'Multi-Day Leave',
                    // Note: You can change this to a dynamic advisor email from your database later
                    to_email: 'advisor@example.com' 
                };

                // Replace YOUR_SERVICE_ID and YOUR_TEMPLATE_ID with actual keys from your EmailJS account
                await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams);
                console.log("Email Notification Sent Successfully!");
            } catch (emailErr) {
                console.error("Failed to send email notification (Check API Keys):", emailErr);
            }

            leaveForm.reset();
            await updateDashboard();
            switchSection('dashboard', 'Dashboard Overview');
            alert(`Leave Application Submitted Successfully! (${isSingleDay ? '1-Day Leave - Requires Approvals' : 'Multi-Day Leave'})`);
        }
        
        submitBtn.textContent = origText;
        submitBtn.disabled = false;
    });

    window.uploadCertificate = async function(leaveId, inputElement) {
        const file = inputElement.files[0];
        if (!file) return;

        inputElement.disabled = true;
        const fileExt = file.name.split('.').pop();
        const fileName = `${state.session.user.id}/${Date.now()}_cert.${fileExt}`;

        alert("Uploading Certificate... Please wait.");

        const { error: uploadError } = await supabaseClient.storage.from('documents').upload(fileName, file);
        if (uploadError) {
            alert(`Upload failed: ${uploadError.message}`);
            inputElement.disabled = false;
            return;
        }

        const { data: publicUrlData } = supabaseClient.storage.from('documents').getPublicUrl(fileName);
        
        const { error: updateError } = await supabaseClient.from('leaves').update({
            certificate_url: publicUrlData.publicUrl
        }).eq('id', leaveId);

        if (updateError) {
            alert("Failed to link certificate to leave: " + updateError.message);
        } else {
            alert("Participation Certificate uploaded successfully!");
            updateDashboard();
        }
    }

    updateDashboard();

    supabaseClient
      .channel('public:leaves')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaves' }, payload => {
        updateDashboard();
      })
      .subscribe();
});
