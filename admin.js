document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    const { data: profile, error: profileErr } = await supabaseClient.from('profiles').select('*').eq('id', session.user.id).single();
    if (profileErr || !profile || profile.role !== 'admin') {
        alert("Access Denied: You are either not an admin, or your profile wasn't found.");
        window.location.href = 'login.html';
        return;
    }

    document.querySelector('.user-name').textContent = profile.full_name || 'Admin';

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

    const btnLogout = document.getElementById('btn-logout');
    btnLogout.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html';
    });

    // Tab Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.page-section');
    const pageTitle = document.getElementById('page-title');

    function switchSection(targetId, title) {
        sections.forEach(sec => sec.classList.remove('active'));
        sections.forEach(sec => sec.classList.add('hidden'));
        navItems.forEach(nav => nav.classList.remove('active'));
        
        document.getElementById(`section-${targetId}`).classList.remove('hidden');
        document.getElementById(`section-${targetId}`).classList.add('active');
        document.getElementById(`nav-${targetId}`).classList.add('active');
        pageTitle.textContent = title;
    }

    navItems.forEach(nav => {
        nav.addEventListener('click', (e) => {
            e.preventDefault();
            const a = nav.closest('a');
            if(a.id) {
                const id = a.id.replace('nav-', '');
                let title = id === 'pending' ? 'Pending Approvals' : 'Approval History';
                switchSection(id, title);
            }
        });
    });

    const subjects = ['AAD', 'DATA ANALYTICS', 'Compiler Design', 'Computer Graphics', 'IEFT'];
    const leavesList = document.getElementById('admin-leaves-list');
    const historyList = document.getElementById('history-leaves-list');

    async function fetchAllLeaves() {
        const { data, error } = await supabaseClient
            .from('leaves')
            .select('*, profiles(full_name)')
            .order('created_at', { ascending: false });
        return data || [];
    }

    async function renderLeaves() {
        const allLeaves = await fetchAllLeaves();
        
        // Oldest pending first
        const pendingLeaves = allLeaves.filter(l => l.status === 'Pending').sort((a,b) => new Date(a.created_at) - new Date(b.created_at)); 
        // Newest history first (already sorted by descending)
        const historyLeaves = allLeaves.filter(l => l.status !== 'Pending');

        leavesList.innerHTML = '';
        historyList.innerHTML = '';
        
        if (pendingLeaves.length === 0) {
            leavesList.innerHTML = '<div class="glass-panel" style="padding: 40px; text-align: center; color: var(--text-secondary);"><i class="fa-solid fa-mug-hot"></i> No pending approvals! You are all caught up.</div>';
        }

        if (historyLeaves.length === 0) {
            historyList.innerHTML = '<div class="glass-panel" style="padding: 40px; text-align: center; color: var(--text-secondary);"><i class="fa-solid fa-clock-rotate-left"></i> No history available.</div>';
        }

        const buildCard = (leave, isHistory) => {
            const card = document.createElement('div');
            card.className = `admin-leave-card glass-panel ${isHistory ? 'history-card' : ''}`;
            if (isHistory) card.style.opacity = '0.7'; // visually distinguish history

            const studentName = leave.profiles ? leave.profiles.full_name : 'Unknown Student';
            const statusClass = leave.status === 'Approved' ? 'status-approved' : 
                               (leave.status === 'Rejected' ? 'status-rejected' : 'status-pending');
            
            let actionHTML = '';
            
            if (!isHistory) {
                if (leave.type === 'single') {
                    actionHTML = `<div class="subject-toggles">
                        <p style="margin-bottom: 12px; font-weight: 500; font-size: 0.95rem; color: var(--text-secondary);">Subject Approvals Needed (1-Day Leave):</p>
                        <div class="subject-chips">`;
                    
                    subjects.forEach(sub => {
                        const isApproved = leave.subject_approvals && leave.subject_approvals[sub];
                        actionHTML += `<button class="subject-chip ${isApproved ? 'approved' : 'pending'}" onclick="toggleSubjectApproval('${leave.id}', '${sub}')">
                            ${sub} ${isApproved ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-clock"></i>'}
                        </button>`;
                    });
                    actionHTML += `</div></div>`;
                } else {
                    actionHTML = `
                        <div class="action-buttons">
                            <button class="btn-primary" onclick="approveLeave('${leave.id}')"><i class="fa-solid fa-check"></i> Approve Entire Leave</button>
                            <button class="btn-danger-outline" onclick="rejectLeave('${leave.id}')"><i class="fa-solid fa-xmark"></i> Reject</button>
                        </div>
                    `;
                }
            } else {
                actionHTML = `<div style="padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); color: var(--text-secondary); font-size: 0.9rem;"><i class="fa-solid fa-circle-check"></i> Decision Finalized</div>`;
            }

            const reasonHTML = leave.reason 
                ? `<div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 6px; margin-bottom: 15px; font-size: 0.95rem; color: var(--text-secondary); border-left: 3px solid var(--primary);"><strong style="color:white; font-size:0.85rem; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:5px;">Reason for Leave</strong>"${leave.reason}"</div>`
                : '';

            card.innerHTML = `
                <div class="admin-card-header">
                    <div>
                        <h3>${leave.event} <span style="font-size: 0.9rem; font-weight: 400; color: var(--text-secondary); margin-left: 10px;">👤 ${studentName}</span></h3>
                        <p class="admin-card-meta"><i class="fa-regular fa-calendar"></i> ${leave.date}</p>
                    </div>
                    <span class="status-badge ${statusClass}">${leave.status}</span>
                </div>
                <div class="admin-card-body">
                    ${reasonHTML}
                    ${actionHTML}
                </div>
            `;
            return card;
        };

        pendingLeaves.forEach(leave => leavesList.appendChild(buildCard(leave, false)));
        historyLeaves.forEach(leave => historyList.appendChild(buildCard(leave, true)));
    }

    window.toggleSubjectApproval = async function(id, subject) {
        try {
            const { data: currentLeave } = await supabaseClient.from('leaves').select('*').eq('id', id).single();
            if (currentLeave && currentLeave.type === 'single') {
                const newApprovals = { ...currentLeave.subject_approvals };
                newApprovals[subject] = !newApprovals[subject];
                
                const allApproved = subjects.every(sub => newApprovals[sub]);
                const newStatus = allApproved ? 'Approved' : 'Pending';
                
                const { error } = await supabaseClient.from('leaves').update({
                    subject_approvals: newApprovals,
                    status: newStatus
                }).eq('id', id);

                if (error) throw error;

                if (allApproved) {
                    alert(`All subjects approved! Leave Request for ${currentLeave.event} has been APPROVED.`);
                }
                renderLeaves(); // Force update manually
            }
        } catch (e) {
            console.error("Subject Approval Error:", e);
            alert("Failed to update approval: " + e.message + "\nAre you sure you have permission to approve leaves?");
        }
    };

    window.approveLeave = async function(id) {
        if(confirm("Are you sure you want to approve this multi-day leave?")) {
            await supabaseClient.from('leaves').update({ status: 'Approved' }).eq('id', id);
            renderLeaves();
        }
    };
    
    window.rejectLeave = async function(id) {
        if(confirm("Are you sure you want to reject this leave?")) {
            await supabaseClient.from('leaves').update({ status: 'Rejected' }).eq('id', id);
            renderLeaves();
        }
    };

    renderLeaves();

    // Listen to real-time changes
    supabaseClient
      .channel('public:leaves:admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaves' }, payload => {
        renderLeaves();
      })
      .subscribe();
});
