document.addEventListener('DOMContentLoaded', () => {


    // ── Auth Check ──
    const token = localStorage.getItem('tempus_token');
    const storedUser = localStorage.getItem('tempus_user') ? JSON.parse(localStorage.getItem('tempus_user')) : null;

    if (!token || !storedUser) {
        window.location.href = '/';
        return;
    }

    // ── Blob Animation ──
    function randomizeBlobs() {
        const blobs = document.querySelectorAll('.blob');
        blobs.forEach(blob => {
            const rx = Math.random() * 20 - 10;
            const ry = Math.random() * 20 - 10;
            const rs = 0.8 + Math.random() * 0.4;
            blob.style.transform = `translate(${rx}%, ${ry}%) scale(${rs})`;
        });
    }
    setInterval(randomizeBlobs, 2500);
    randomizeBlobs();

    // ── Data Store ──
    const data = {
        user: {
            name: storedUser.name || 'Worker',
            role: 'Worker',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(storedUser.name || 'W')}&background=3b82f6&color=fff`
        },
        meetings: [],
        events: [],
        collisions: [],
        certificates: [],
        posters: [],
        reports: []
    };

    // ── Section Navigation ──
    const navLinks = document.querySelectorAll('.nav-links li a[data-section]');
    const sections = document.querySelectorAll('.section-content');

    function switchSection(sectionName) {
        sections.forEach(s => s.classList.add('hidden'));
        const target = document.getElementById(`section-${sectionName}`);
        if (target) target.classList.remove('hidden');

        navLinks.forEach(link => link.parentElement.classList.remove('active'));
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) activeLink.parentElement.classList.add('active');

        // Update header title
        const titles = {
            overview: 'Dashboard', calendar: 'My Calendar', meetings: 'My Meetings',
            events: 'Upcoming Events', collisions: 'Collision Alerts', certificates: 'My Certificates',
            posters: 'Event Posters', reports: 'My Reports', settings: 'Profile & Settings'
        };
        const h1 = document.querySelector('.welcome-text h1');
        if (h1) h1.textContent = titles[sectionName] || 'Dashboard';
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection(link.dataset.section);
        });
    });

    // View All links
    document.querySelectorAll('[data-goto]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection(el.dataset.goto);
        });
    });

    // ── Logout ──
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('tempus_token');
        localStorage.removeItem('tempus_user');
        localStorage.removeItem('selectedRole');
        window.location.href = '/';
    });

    // ── Render Profile ──
    function renderProfile() {
        const el = (id) => document.getElementById(id);
        const welcomeP = document.querySelector('.welcome-text p');
        if (welcomeP) welcomeP.innerHTML = `Welcome back,<br>${data.user.name.split(' ')[0].toUpperCase()}`;
        if (el('user-name')) el('user-name').textContent = data.user.name;
        if (el('profile-name')) el('profile-name').textContent = data.user.name.toUpperCase();
        if (el('user-avatar')) el('user-avatar').src = data.user.avatar;

        // Settings
        if (el('settings-avatar')) el('settings-avatar').src = data.user.avatar;
        if (el('settings-name')) el('settings-name').value = data.user.name;
        if (el('settings-email')) el('settings-email').value = storedUser.email || '';
        if (el('settings-role')) el('settings-role').value = 'Worker';
    }

    // ── Render Stats ──
    function renderStats() {
        const el = (id) => document.getElementById(id);
        if (el('stat-meetings')) el('stat-meetings').textContent = data.meetings.length;
        if (el('stat-events')) el('stat-events').textContent = data.events.length;
        if (el('stat-hours')) el('stat-hours').textContent = `${(data.meetings.length * 1.5).toFixed(1)}h`;
        if (el('stat-collisions')) el('stat-collisions').textContent = data.collisions.length;
        if (el('alert-badge')) el('alert-badge').textContent = data.collisions.length;
    }

    // ── Render Calendar ──
    function renderCalendar(targetGrid, targetLabel, dateObj) {
        if (!targetGrid) return;
        const now = dateObj || new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        if (targetLabel) {
            targetLabel.textContent = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }

        targetGrid.innerHTML = '';
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.classList.add('calendar-date', 'empty');
            targetGrid.appendChild(empty);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateEl = document.createElement('div');
            dateEl.classList.add('calendar-date');
            dateEl.textContent = day;

            const hasMeeting = data.meetings.some(m => {
                const d = new Date(m.date);
                return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
            });
            if (hasMeeting) {
                const dot = document.createElement('div');
                dot.className = 'event-dot meeting-dot';
                dateEl.appendChild(dot);
            }

            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dateEl.classList.add('today');
            }

            targetGrid.appendChild(dateEl);
        }
    }

    // ── Calendar Navigation ──
    let calMonth = new Date();
    let calFullMonth = new Date();

    function setupCalNav(prevId, nextId, gridId, labelId, monthRef, setter) {
        const prev = document.getElementById(prevId);
        const next = document.getElementById(nextId);
        const grid = document.getElementById(gridId);
        const label = document.getElementById(labelId);

        if (prev) prev.addEventListener('click', () => {
            monthRef.setMonth(monthRef.getMonth() - 1);
            renderCalendar(grid, label, new Date(monthRef));
        });
        if (next) next.addEventListener('click', () => {
            monthRef.setMonth(monthRef.getMonth() + 1);
            renderCalendar(grid, label, new Date(monthRef));
        });
        renderCalendar(grid, label, monthRef);
    }

    setupCalNav('cal-prev', 'cal-next', 'calendar-dates', 'calendar-month', calMonth);
    setupCalNav('cal-full-prev', 'cal-full-next', 'calendar-full-dates', 'calendar-full-month', calFullMonth);

    // ── Render Upcoming Meetings ──
    function renderUpcoming() {
        const list = document.getElementById('upcoming-list');
        if (!list) return;
        list.innerHTML = '';

        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const upcoming = data.meetings.filter(m => new Date(m.date) >= todayStart).slice(0, 5);

        if (upcoming.length === 0) {
            list.innerHTML = '<div class="empty-state"><i class="fa-regular fa-calendar"></i><p>No upcoming meetings</p></div>';
            return;
        }

        upcoming.forEach(m => {
            const item = document.createElement('div');
            item.className = 'meeting-item';
            const statusLabel = m.status.charAt(0).toUpperCase() + m.status.slice(1);
            item.innerHTML = `
                <div class="time-box">
                    <span class="time">${m.time}</span>
                </div>
                <div class="meeting-info">
                    <h4>${m.title}</h4>
                    <p>${m.organizer || m.participants}</p>
                </div>
                <div class="status-pill ${m.status}">${statusLabel}</div>
            `;
            list.appendChild(item);
        });
    }

    // ── Render Full Meetings List ──
    let currentTab = 'upcoming';

    function renderFullMeetings() {
        const list = document.getElementById('meetings-full-list');
        if (!list) return;
        list.innerHTML = '';

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const filtered = currentTab === 'upcoming'
            ? data.meetings.filter(m => new Date(m.date) >= todayStart)
            : data.meetings.filter(m => new Date(m.date) < todayStart);

        if (filtered.length === 0) {
            list.innerHTML = `<div class="empty-state"><i class="fa-regular fa-calendar-xmark"></i><p>No ${currentTab} meetings</p></div>`;
            return;
        }

        filtered.forEach(m => {
            const item = document.createElement('div');
            item.className = 'meeting-item';
            const statusLabel = m.status.charAt(0).toUpperCase() + m.status.slice(1);
            const dateStr = new Date(m.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            item.innerHTML = `
                <div class="time-box">
                    <span class="time">${m.time}</span>
                    <span class="ampm">${dateStr}</span>
                </div>
                <div class="meeting-info">
                    <h4>${m.title}</h4>
                    <p>${m.organizer || m.participants}</p>
                </div>
                <div class="status-pill ${m.status}">${statusLabel}</div>
                <button class="download-btn"><i class="fa-solid fa-download"></i> Report</button>
            `;
            list.appendChild(item);
        });
    }

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            renderFullMeetings();
        });
    });

    // ── Render Collisions ──
    function renderCollisions(targetId) {
        const list = document.getElementById(targetId);
        if (!list) return;
        list.innerHTML = '';

        if (data.collisions.length === 0) {
            list.innerHTML = '<div class="empty-state"><i class="fa-regular fa-circle-check"></i><p>No scheduling conflicts</p></div>';
            return;
        }

        data.collisions.forEach(c => {
            const item = document.createElement('div');
            item.className = 'collision-item';
            item.innerHTML = `
                <div class="collision-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
                <div class="collision-info">
                    <h4>${c.meeting1} ↔ ${c.meeting2}</h4>
                    <p>${c.time}</p>
                </div>
            `;
            list.appendChild(item);
        });
    }

    // ── Render Certificates ──
    function renderCertificates() {
        const list = document.getElementById('certificates-list');
        if (!list) return;
        list.innerHTML = '';

        data.certificates.forEach(cert => {
            const card = document.createElement('div');
            card.className = 'grid-card';
            card.innerHTML = `
                <div class="grid-card-icon cert"><i class="fa-solid fa-certificate"></i></div>
                <span class="badge-status ${cert.status}">${cert.status === 'generated' ? '✓ Generated' : '⏳ Pending'}</span>
                <h4>${cert.name}</h4>
                <p>${cert.event} · ${cert.date}</p>
                <div class="grid-card-actions">
                    <button class="download-btn"><i class="fa-solid fa-eye"></i> View</button>
                    ${cert.status === 'generated' ? '<button class="download-btn"><i class="fa-solid fa-download"></i> PDF</button>' : ''}
                </div>
            `;
            list.appendChild(card);
        });
    }

    // ── Render Cert Previews ──
    function renderCertPreviews() {
        const list = document.getElementById('certs-preview');
        if (!list) return;
        list.innerHTML = '';

        data.certificates.slice(0, 3).forEach(cert => {
            const item = document.createElement('div');
            item.className = 'cert-preview-item';
            item.innerHTML = `
                <div class="cert-preview-icon"><i class="fa-solid fa-certificate"></i></div>
                <div class="cert-preview-info">
                    <h4>${cert.name}</h4>
                    <span class="badge-status ${cert.status}">${cert.status === 'generated' ? '✓ Ready' : '⏳ Pending'}</span>
                </div>
            `;
            list.appendChild(item);
        });
    }

    // ── Render Posters ──
    function renderPosters() {
        const list = document.getElementById('posters-list');
        if (!list) return;
        list.innerHTML = '';

        data.posters.forEach(poster => {
            const card = document.createElement('div');
            card.className = 'grid-card';
            card.innerHTML = `
                <div class="grid-card-icon poster"><i class="fa-solid fa-image"></i></div>
                <h4>${poster.name}</h4>
                <p>${poster.event} · ${poster.date}</p>
                <div class="grid-card-actions">
                    <button class="download-btn"><i class="fa-solid fa-eye"></i> View</button>
                    <button class="download-btn"><i class="fa-solid fa-download"></i> Download</button>
                </div>
            `;
            list.appendChild(card);
        });
    }

    // ── Render Reports ──
    function renderReports() {
        const list = document.getElementById('reports-list');
        if (!list) return;
        list.innerHTML = '';

        data.reports.forEach(r => {
            const item = document.createElement('div');
            item.className = 'report-item';
            item.innerHTML = `
                <div class="file-icon"><i class="fa-solid fa-file-pdf"></i></div>
                <div class="report-info">
                    <h4>${r.name}</h4>
                    <p>${r.size} · ${r.date}</p>
                </div>
                <button class="download-btn"><i class="fa-solid fa-eye"></i> View</button>
                <button class="download-btn"><i class="fa-solid fa-download"></i></button>
            `;
            list.appendChild(item);
        });
    }

    // ── Fetch Real Data ──
    async function fetchData() {
        try {
            const meetingRes = await fetch('/api/calendar/meetings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const meetings = await meetingRes.json();

            if (Array.isArray(meetings)) {
                data.meetings = meetings.map(m => ({
                    id: m.meeting_id,
                    title: m.title,
                    time: new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    participants: m.participants.length > 0 ? `${m.participants.length} Participants` : 'No Participants',
                    organizer: `Organized by ${m.creator ? m.creator.name : 'Admin'}`,
                    status: m.status,
                    date: new Date(m.start_time)
                }));
            }

            const eventRes = await fetch('/api/events');
            const events = await eventRes.json();
            if (Array.isArray(events)) {
                data.events = events.map(e => ({
                    id: e.event_id,
                    title: e.title,
                    description: e.description || '',
                    type: e.event_type,
                    location: e.location || '',
                    start_date: new Date(e.start_date),
                    end_date: new Date(e.end_date),
                    creator: e.creator ? e.creator.name : 'Admin',
                    status: 'upcoming'
                }));
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        }

        // Re-render everything
        renderAll();
    }

    // ── Render All ──
    function renderAll() {
        renderProfile();
        renderStats();
        renderCalendar(document.getElementById('calendar-dates'), document.getElementById('calendar-month'), calMonth);
        renderCalendar(document.getElementById('calendar-full-dates'), document.getElementById('calendar-full-month'), calFullMonth);
        renderUpcoming();
        renderFullMeetings();
        renderCollisions('collision-list');
        renderCollisions('collisions-full-list');
        renderCertificates();
        renderCertPreviews();
        renderPosters();
        renderReports();
        renderEvents();
    }

    // ── Render Events ──
    const joinedEvents = new Set(JSON.parse(localStorage.getItem('tempus_joined_events') || '[]'));

    function renderEvents() {
        const list = document.getElementById('events-list');
        if (!list) return;
        list.innerHTML = '';

        if (data.events.length === 0) {
            list.innerHTML = '<div class="empty-state"><i class="fa-regular fa-calendar"></i><p>No events available yet</p></div>';
            return;
        }

        data.events.forEach(ev => {
            const card = document.createElement('div');
            card.className = 'event-card';
            const isJoined = joinedEvents.has(ev.id);
            const dateStr = ev.start_date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = ev.start_date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            card.innerHTML = `
                <div class="event-card-top">
                    <h4>${ev.title}</h4>
                    <span class="event-type-badge">${ev.type}</span>
                </div>
                ${ev.description ? `<p class="event-card-desc">${ev.description}</p>` : ''}
                <div class="event-card-meta">
                    <div class="event-meta-item"><i class="fa-regular fa-calendar"></i> ${dateStr}</div>
                    <div class="event-meta-item"><i class="fa-regular fa-clock"></i> ${timeStr}</div>
                    ${ev.location ? `<div class="event-meta-item"><i class="fa-solid fa-location-dot"></i> ${ev.location}</div>` : ''}
                    <div class="event-meta-item"><i class="fa-solid fa-user"></i> Organized by ${ev.creator}</div>
                </div>
                <button class="btn-join ${isJoined ? 'registered' : ''}" data-id="${ev.id}">
                    ${isJoined
                    ? '<i class="fa-solid fa-circle-check"></i> Registered'
                    : '<i class="fa-solid fa-calendar-plus"></i> Join Event'
                }
                </button>
            `;
            if (!isJoined) {
                card.querySelector('.btn-join').addEventListener('click', () => openRegModal(ev));
            }
            list.appendChild(card);
        });
    }

    // ── Registration Modal ──
    const regModal = document.getElementById('reg-modal');
    const regForm = document.getElementById('reg-form');
    const modalClose = document.getElementById('reg-modal-close');

    function openRegModal(ev) {
        document.getElementById('reg-event-id').value = ev.id;
        document.getElementById('reg-name').value = storedUser.name || '';
        document.getElementById('reg-email').value = storedUser.email || '';
        document.getElementById('reg-note').value = '';

        const dateStr = ev.start_date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        document.getElementById('modal-event-info').innerHTML = `
            <h4>${ev.title}</h4>
            <p><i class="fa-regular fa-calendar"></i> ${dateStr}</p>
            ${ev.location ? `<p><i class="fa-solid fa-location-dot"></i> ${ev.location}</p>` : ''}
        `;
        regModal.classList.remove('hidden');
    }

    function closeRegModal() {
        regModal.classList.add('hidden');
    }

    if (modalClose) modalClose.addEventListener('click', closeRegModal);
    regModal?.addEventListener('click', (e) => { if (e.target === regModal) closeRegModal(); });

    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const eventId = document.getElementById('reg-event-id').value;
            const submitBtn = document.getElementById('reg-submit-btn');

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registering...';

            try {
                const res = await fetch('/api/events/join', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ event_id: eventId })
                });
                const result = await res.json();

                if (res.ok) {
                    joinedEvents.add(parseInt(eventId));
                    localStorage.setItem('tempus_joined_events', JSON.stringify([...joinedEvents]));
                    closeRegModal();
                    renderEvents();
                } else {
                    alert(result.error || 'Registration failed');
                }
            } catch (err) {
                console.error(err);
                alert('Connection error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Confirm Registration';
            }
        });
    }

    // ── Settings Handlers ──
    document.getElementById('save-profile-btn')?.addEventListener('click', () => {
        alert('Profile changes saved! (Placeholder — no backend endpoint yet)');
    });
    document.getElementById('change-password-btn')?.addEventListener('click', () => {
        const newPw = document.getElementById('new-password')?.value;
        const confirmPw = document.getElementById('confirm-password')?.value;
        if (!newPw || newPw !== confirmPw) {
            alert('Passwords do not match!');
            return;
        }
        alert('Password updated! (Placeholder — no backend endpoint yet)');
    });

    // ── Initial Render + Fetch ──
    renderAll();
    fetchData();
});

// ═══════════════════════════════════════════════════════
// NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════════════
function initNotifications() {
    const token = localStorage.getItem('tempus_token');
    if (!token) return;

    const bellBtn = document.getElementById('notif-bell-btn');
    const dropdown = document.getElementById('notif-dropdown');
    const badge = document.getElementById('notif-badge');
    const list = document.getElementById('notif-list');
    const markAllBtn = document.getElementById('notif-mark-all-btn');
    const clearBtn = document.getElementById('notif-clear-btn');

    if (!bellBtn) return;

    const TYPE_ICONS = {
        event_created: { icon: 'fa-calendar-plus', cls: 'event_created' },
        event_joined: { icon: 'fa-user-check', cls: 'event_joined' },
        meeting_invite: { icon: 'fa-handshake', cls: 'meeting_invite' },
        system: { icon: 'fa-info-circle', cls: 'system' }
    };

    function relativeTime(dateStr) {
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
        return Math.floor(diff / 86400) + 'd ago';
    }

    function renderNotifications(notifications) {
        list.innerHTML = '';
        if (!notifications.length) {
            list.innerHTML = '<li class="notif-empty">You\'re all caught up! &#127881;</li>';
            return;
        }
        notifications.forEach(function (n) {
            var ti = TYPE_ICONS[n.type] || TYPE_ICONS.system;
            var li = document.createElement('li');
            li.className = 'notif-item' + (n.is_read ? '' : ' unread');
            li.dataset.id = n.id;
            li.innerHTML =
                '<div class="notif-icon ' + ti.cls + '"><i class="fa-solid ' + ti.icon + '"></i></div>' +
                '<div class="notif-body">' +
                '<div class="notif-title">' + n.title + '</div>' +
                '<div class="notif-msg">' + n.message + '</div>' +
                '<div class="notif-time">' + relativeTime(n.created_at) + '</div>' +
                '</div>' +
                '<button class="notif-dismiss" title="Dismiss"><i class="fa-solid fa-xmark"></i></button>';

            li.addEventListener('click', function (e) {
                if (e.target.closest('.notif-dismiss')) return;
                if (!n.is_read) doMarkRead(n.id, li);
                if (n.link) window.location.href = n.link;
            });

            li.querySelector('.notif-dismiss').addEventListener('click', function (e) {
                e.stopPropagation();
                doMarkRead(n.id, li);
                li.remove();
                if (!list.children.length) list.innerHTML = '<li class="notif-empty">You\'re all caught up! &#127881;</li>';
            });

            list.appendChild(li);
        });
    }

    function doMarkRead(id, li) {
        fetch('/api/notifications/' + id + '/read', {
            method: 'PATCH',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('tempus_token') }
        }).catch(function () { });
        if (li) li.classList.remove('unread');
    }

    function fetchNotifications() {
        fetch('/api/notifications', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('tempus_token') }
        }).then(function (res) {
            if (!res.ok) return;
            return res.json();
        }).then(function (data) {
            if (!data) return;
            renderNotifications(data.notifications);
            var prev = parseInt(badge.textContent) || 0;
            if (data.unreadCount > 0) {
                badge.textContent = data.unreadCount > 99 ? '99+' : data.unreadCount;
                badge.classList.remove('hidden');
                if (data.unreadCount > prev) {
                    bellBtn.classList.add('ringing');
                    setTimeout(function () { bellBtn.classList.remove('ringing'); }, 700);
                }
            } else {
                badge.classList.add('hidden');
            }
        }).catch(function () { });
    }

    bellBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = !dropdown.classList.contains('hidden');
        dropdown.classList.toggle('hidden', open);
        bellBtn.classList.toggle('active', !open);
    });

    document.addEventListener('click', function (e) {
        if (!e.target.closest('#notif-wrapper')) {
            dropdown.classList.add('hidden');
            bellBtn.classList.remove('active');
        }
    });

    if (markAllBtn) {
        markAllBtn.addEventListener('click', function () {
            fetch('/api/notifications/read-all', {
                method: 'PATCH',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('tempus_token') }
            }).then(function () {
                document.querySelectorAll('.notif-item.unread').forEach(function (el) { el.classList.remove('unread'); });
                badge.classList.add('hidden');
            }).catch(function () { });
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            fetch('/api/notifications', {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('tempus_token') }
            }).then(function () { fetchNotifications(); }).catch(function () { });
        });
    }

    fetchNotifications();
    setInterval(fetchNotifications, 30000);
}

// Auto-init notifications when DOM is ready
document.addEventListener('DOMContentLoaded', function () { initNotifications(); });
