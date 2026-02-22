document.addEventListener('DOMContentLoaded', () => {

    // ── Auth Check ──
    const token = localStorage.getItem('tempus_token');
    const storedUser = localStorage.getItem('tempus_user') ? JSON.parse(localStorage.getItem('tempus_user')) : null;

    if (!token || !storedUser) {
        window.location.href = '/';
        return;
    }

    // ── RBAC: Only admins can access this dashboard ──
    if (storedUser.role && storedUser.role !== 'admin') {
        window.location.href = '/worker-dashboard';
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
            name: storedUser.name || 'Admin',
            role: storedUser.role || 'admin',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(storedUser.name || 'A')}&background=3b82f6&color=fff`
        },
        stats: { participants: 0, events: 0, hours: 0 },
        meetings: [],
        events: [],
        collisions: [],
        certificates: [],
        posters: [],
        reports: [],
        automation: []
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
            overview: 'Dashboard', calendar: 'My Calendar', meetings: 'All Meetings',
            collisions: 'Collision Alerts', certificates: 'Certificates',
            posters: 'Event Posters', reports: 'Reports',
            automation: 'Automation Status', settings: 'Profile & Settings'
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
        if (el('settings-role')) el('settings-role').value = data.user.role.charAt(0).toUpperCase() + data.user.role.slice(1);
    }

    // ── Render Stats ──
    function renderStats() {
        const el = (id) => document.getElementById(id);
        if (el('stat-participants')) el('stat-participants').textContent = data.stats.participants;
        if (el('stat-events')) el('stat-events').textContent = data.stats.events;
        if (el('stat-hours')) el('stat-hours').textContent = `${data.stats.hours}h`;
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

            const checkItemDate = (dateObj) => {
                return dateObj && dateObj.getDate() === day && dateObj.getMonth() === month && dateObj.getFullYear() === year;
            };

            const hasMeeting = data.meetings.some(m => checkItemDate(m.date));
            const hasEvent = data.events.some(e => checkItemDate(e.date));

            let html = `<span class="date-num">${day}</span>`;
            if (hasMeeting || hasEvent) {
                html += `<div class="dot-container">`;
                if (hasMeeting) html += `<div class="event-dot meeting-dot"></div>`;
                if (hasEvent) html += `<div class="event-dot event-dot-org"></div>`;
                html += `</div>`;
            }
            dateEl.innerHTML = html;

            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dateEl.classList.add('today');
            }

            // Click to show day's events/meetings
            dateEl.addEventListener('click', () => {
                showDayDetail(year, month, day);
            });

            targetGrid.appendChild(dateEl);
        }
    }

    // ── Day Detail Popup ──
    function showDayDetail(year, month, day) {
        const panel = document.getElementById('day-detail');
        if (!panel) return;

        const clickedDate = new Date(year, month, day);
        const dateStr = clickedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

        const dayEvents = data.events.filter(e => e.date.getDate() === day && e.date.getMonth() === month && e.date.getFullYear() === year);
        const dayMeetings = data.meetings.filter(m => m.date.getDate() === day && m.date.getMonth() === month && m.date.getFullYear() === year);

        let html = `<div class="day-detail-header">
            <h4>${dateStr}</h4>
            <button class="btn-icon mini day-detail-close" onclick="this.closest('.day-detail-panel').innerHTML='<h4>Select a date to view details</h4>'"><i class="fa-solid fa-xmark"></i></button>
        </div>`;

        if (dayEvents.length === 0 && dayMeetings.length === 0) {
            html += `<div class="empty-state"><i class="fa-regular fa-calendar"></i><p>No events or meetings on this day</p></div>`;
        } else {
            dayEvents.forEach(e => {
                html += `<div class="day-detail-item event-item">
                    <div class="event-dot event-dot-org" style="display:inline-block;margin-right:8px;"></div>
                    <div>
                        <strong>${e.title}</strong>
                        <p style="color:var(--text-muted);font-size:0.85rem;margin:2px 0;">${e.type || 'Event'}${e.location ? ' · ' + e.location : ''}</p>
                        ${e.description ? '<p style="color:var(--text-muted);font-size:0.8rem;margin:2px 0;">' + e.description + '</p>' : ''}
                        <p style="color:var(--text-muted);font-size:0.8rem;">${e.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${e.endDate ? ' – ' + e.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                    </div>
                </div>`;
            });
            dayMeetings.forEach(m => {
                html += `<div class="day-detail-item meeting-item-detail">
                    <div class="event-dot meeting-dot" style="display:inline-block;margin-right:8px;"></div>
                    <div>
                        <strong>${m.title}</strong>
                        <p style="color:var(--text-muted);font-size:0.85rem;margin:2px 0;">${m.time} · ${m.participants}</p>
                    </div>
                </div>`;
            });
        }

        panel.innerHTML = html;
    }

    // ── Calendar Navigation ──
    let calMonth = new Date();
    let calFullMonth = new Date();

    function setupCalNav(prevId, nextId, gridId, labelId, monthRef) {
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

        const upcoming = data.meetings.filter(m => new Date(m.date) >= new Date()).slice(0, 5);

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
        const filtered = currentTab === 'upcoming'
            ? data.meetings.filter(m => new Date(m.date) >= now)
            : data.meetings.filter(m => new Date(m.date) < now);

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

    // ── Render Automation (Admin Exclusive) ──
    function renderAutomation(targetId) {
        const list = document.getElementById(targetId);
        if (!list) return;
        list.innerHTML = '';

        if (data.automation.length === 0) {
            list.innerHTML = '<div class="empty-state"><i class="fa-solid fa-robot"></i><p>No automation jobs</p></div>';
            return;
        }

        data.automation.forEach(job => {
            const item = document.createElement('div');
            item.className = 'auto-item';

            let iconClass = 'fa-solid fa-check';
            if (job.status === 'processing') iconClass = 'fa-solid fa-spinner fa-spin';
            else if (job.status === 'failed') iconClass = 'fa-solid fa-triangle-exclamation';

            item.innerHTML = `
                <div class="auto-icon ${job.status}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="auto-info">
                    <h4>${job.type}: ${job.name}</h4>
                    <span class="meta">${job.date}</span>
                </div>
            `;
            list.appendChild(item);
        });
    }

    // ── Fetch Real Data ──
    async function fetchData() {
        try {
            // 1. Fetch Personal Meetings
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
                    organizer: `Organized by ${m.organizer || 'Admin'}`,
                    status: m.status,
                    date: new Date(m.start_time)
                }));
                data.stats.participants = meetings.reduce((sum, m) => sum + (m.participants ? m.participants.length : 0), 0);
            }

            // 2. Fetch Public Events
            const eventRes = await fetch('/api/events');
            const events = await eventRes.json();
            if (Array.isArray(events)) {
                data.events = events.map(e => ({
                    id: e.event_id,
                    title: e.title,
                    type: e.event_type,
                    description: e.description || '',
                    location: e.location || '',
                    date: new Date(e.start_date),
                    endDate: new Date(e.end_date),
                    status: 'upcoming'
                }));
                data.stats.events = events.length;
            }

            // Update Stats
            data.stats.hours = (data.meetings.length * 1.5).toFixed(1);

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
        renderPosters();
        renderReports();
        renderAutomation('automation-list');
        renderAutomation('automation-full-list');
    }

    // ── Modal Helpers ──
    function openModal(id) {
        document.getElementById(id).style.display = 'flex';
    }
    function closeModal(id) {
        document.getElementById(id).style.display = 'none';
        if (id === 'event-modal') {
            document.getElementById('event-step-form')?.classList.remove('hidden');
            document.getElementById('event-step-success')?.classList.add('hidden');
        }
    }

    // Close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.modal));
    });

    // Click outside to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal.id);
        });
    });

    // ── Meeting Modal ──
    const meetingBtn = document.getElementById('add-meeting-btn');
    const meetingForm = document.getElementById('meeting-form');

    if (meetingBtn) {
        meetingBtn.onclick = () => {
            openModal('meeting-modal');
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            document.getElementById('m-date').value = now.toISOString().split('T')[0];
            document.getElementById('m-time').value = now.toISOString().split('T')[1].slice(0, 5);
        };
    }

    if (meetingForm) {
        meetingForm.onsubmit = async (e) => {
            e.preventDefault();
            const title = document.getElementById('m-title').value;
            const dateStr = document.getElementById('m-date').value;
            const timeStr = document.getElementById('m-time').value;
            const duration = parseFloat(document.getElementById('m-duration').value);

            const start = new Date(`${dateStr}T${timeStr}`);
            const end = new Date(start.getTime() + duration * 3600000);

            try {
                const res = await fetch('/api/calendar/meetings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ title, start_time: start, end_time: end })
                });

                if (res.ok) {
                    closeModal('meeting-modal');
                    meetingForm.reset();
                    alert('Meeting Added!');
                    fetchData();
                } else {
                    const result = await res.json();
                    alert(result.error || 'Error creating meeting');
                }
            } catch (err) {
                console.error(err);
                alert('Network Error');
            }
        };
    }

    // ── Event Modal ──
    const eventBtn = document.getElementById('add-event-btn');
    const eventForm = document.getElementById('event-form');
    let lastCreatedEvent = null;

    const eStartEl = document.getElementById('e-start-date');
    const eEndEl = document.getElementById('e-end-date');

    // Auto-adjust: if start changes and is >= end, push end to start + 2h
    if (eStartEl && eEndEl) {
        eStartEl.addEventListener('change', () => {
            const start = new Date(eStartEl.value);
            const end = new Date(eEndEl.value);
            if (!eEndEl.value || start >= end) {
                const newEnd = new Date(start.getTime() + 2 * 3600000);
                const offset = newEnd.getTimezoneOffset();
                const local = new Date(newEnd.getTime() - offset * 60000);
                eEndEl.value = local.toISOString().slice(0, 16);
            }
        });
    }

    if (eventBtn) {
        eventBtn.onclick = () => {
            openModal('event-modal');
            const now = new Date();
            const later = new Date(now.getTime() + 2 * 3600000);
            const toLocal = (d) => {
                const offset = d.getTimezoneOffset();
                const local = new Date(d.getTime() - offset * 60000);
                return local.toISOString().slice(0, 16);
            };
            document.getElementById('e-start-date').value = toLocal(now);
            document.getElementById('e-end-date').value = toLocal(later);
        };
    }

    if (eventForm) {
        eventForm.onsubmit = async (e) => {
            e.preventDefault();
            const eventData = {
                title: document.getElementById('e-title').value,
                description: document.getElementById('e-description').value,
                event_type: document.getElementById('e-type').value,
                start_date: document.getElementById('e-start-date').value,
                end_date: document.getElementById('e-end-date').value,
                location: document.getElementById('e-location').value
            };

            async function submitEvent(force = false) {
                const url = force ? '/api/events?force=true' : '/api/events';
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(eventData)
                });
                return res;
            }

            try {
                let res = await submitEvent(false);

                if (res.status === 409) {
                    const conflict = await res.json();
                    const proceed = confirm(`⚠️ ${conflict.error}\n\nDo you want to create this event anyway?`);
                    if (proceed) {
                        res = await submitEvent(true);
                    } else {
                        return;
                    }
                }

                if (res.ok) {
                    lastCreatedEvent = { ...eventData };
                    const result = await res.json();
                    lastCreatedEvent.id = result.event_id;

                    document.getElementById('event-step-form').classList.add('hidden');
                    document.getElementById('event-step-success').classList.remove('hidden');
                    document.getElementById('success-event-title').textContent = eventData.title;

                    eventForm.reset();
                    fetchData();
                } else {
                    const result = await res.json();
                    alert(result.error || 'Error creating event');
                }
            } catch (err) {
                console.error(err);
                alert('Network Error');
            }
        };
    }

    // ── Poster Button ──
    document.getElementById('btn-create-poster')?.addEventListener('click', () => {
        if (!lastCreatedEvent) return;
        const params = new URLSearchParams({
            title: lastCreatedEvent.title || '',
            date: lastCreatedEvent.start_date || '',
            location: lastCreatedEvent.location || '',
            description: lastCreatedEvent.description || ''
        });
        window.location.href = `/poster-gen?${params.toString()}`;
    });

    // ── Certificate Button (Placeholder) ──
    document.getElementById('btn-generate-cert')?.addEventListener('click', () => {
        alert('Certificate generation coming soon! This feature is under development.');
    });

    // ── Close Success ──
    document.getElementById('btn-close-success')?.addEventListener('click', () => {
        closeModal('event-modal');
    });

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
