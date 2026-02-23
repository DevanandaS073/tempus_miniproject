document.addEventListener('DOMContentLoaded', () => {


    // ── Auth Check ──
    const token = localStorage.getItem('tempus_token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    function randomizeBlobs() {
        const blobs = document.querySelectorAll('.blob');

        blobs.forEach(blob => {
            const randomX = Math.random() * 20 - 10;
            const randomY = Math.random() * 20 - 10;
            const randomScale = 0.8 + Math.random() * 0.4;

            blob.style.transform = `translate(${randomX}%, ${randomY}%) scale(${randomScale})`;
        });
    }

    setInterval(randomizeBlobs, 2500);
    randomizeBlobs();

    const storedUser = localStorage.getItem('tempus_user') ? JSON.parse(localStorage.getItem('tempus_user')) : null;

    const mockData = {
        user: {
            name: storedUser ? storedUser.name : "User",
            role: storedUser ? storedUser.role : "user",
            avatar: "https://ui-avatars.com/api/?name=" + (storedUser ? storedUser.name : "User") + "&background=3b82f6&color=fff"
        },
        stats: { meetings: 0, events: 0, hours: 0 },
        meetings: [],
        events: [],
        automation: [],
        reports: []
    };

    async function fetchDashboardData() {
        try {
            // 1. Fetch Personal Meetings (JWT provides user identity)
            const meetingRes = await fetch('/api/calendar/meetings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const meetings = await meetingRes.json();

            // 2. Fetch Public Events
            const eventRes = await fetch('/api/events');
            const events = await eventRes.json();

            // 3. Update Data Store
            if (Array.isArray(meetings)) {
                mockData.meetings = meetings.map(m => ({
                    id: m.meeting_id,
                    title: m.title,
                    time: new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    ampm: '',
                    participants: m.participants.length > 0 ? `${m.participants.length} Participants` : 'No Participants',
                    status: m.status,
                    date: new Date(m.start_time)
                }));
                mockData.stats.meetings = meetings.length;
            }

            if (Array.isArray(events)) {
                mockData.events = events.map(e => ({
                    id: e.event_id,
                    title: e.title,
                    description: e.description || '',
                    type: e.event_type,
                    location: e.location || '',
                    start_date: new Date(e.start_date),
                    end_date: new Date(e.end_date),
                    created_by: e.creator ? e.creator.id : null,
                    creator_name: e.creator ? e.creator.name : 'Admin',
                    participant_count: e.participants ? e.participants.length : 0,
                    status: 'upcoming'
                }));
                mockData.stats.events = events.length;
            }

            // Update Stats
            mockData.stats.hours = mockData.meetings.length * 1.5;

            // Re-render
            renderProfile();
            renderStats();
            renderUpcomings();
            renderCalendar();
            renderAdminEvents();

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        }
    }

    function renderProfile() {
        const welcomeName = document.querySelector('.welcome-text p');
        const profileName = document.querySelector('.profile-info .name');
        const profileRole = document.querySelector('.profile-info .role');
        const profileImg = document.querySelector('.user-profile img');

        if (mockData.user) {
            if (welcomeName) welcomeName.innerHTML = `Welcome back,<br>${mockData.user.name.split(' ')[0].toUpperCase()}`;
            if (profileName) profileName.innerText = mockData.user.name.toUpperCase();
            if (profileRole) profileRole.innerText = mockData.user.role.charAt(0).toUpperCase() + mockData.user.role.slice(1);
            if (profileImg) profileImg.src = mockData.user.avatar;
        }
    }

    function renderStats() {
        const pCount = document.getElementById('stat-participants');
        const eCount = document.getElementById('stat-events');
        const hCount = document.getElementById('stat-hours');

        if (pCount) pCount.innerText = mockData.stats.meetings;
        if (eCount) eCount.innerText = mockData.stats.events;
        if (hCount) hCount.innerText = `${mockData.stats.hours}h`;
    }

    function renderReports() {
        const list = document.getElementById('reports-list');
        if (!list) return;
        list.innerHTML = '';

        mockData.reports.forEach(r => {
            const item = document.createElement('div');
            item.className = 'report-item';

            item.innerHTML = `
                <div class="file-icon">
                    <i class="fa-solid fa-file-pdf"></i>
                </div>
                <div class="report-info">
                    <h4>${r.name}</h4>
                    <p>${r.size}</p>
                </div>
                <button class="download-btn"><i class="fa-solid fa-download"></i></button>
            `;
            list.appendChild(item);
        });
    }


    function renderAutomation() {
        const list = document.getElementById('automation-list');
        if (!list) return;
        list.innerHTML = '';

        mockData.automation.forEach(job => {
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

    function renderUpcomings() {
        const list = document.getElementById('upcoming-list');
        if (!list) return;
        list.innerHTML = '';

        mockData.meetings.forEach(m => {
            const item = document.createElement('div');
            item.className = 'meeting-item';
            const statusDisplay = m.status.charAt(0).toUpperCase() + m.status.slice(1);

            item.innerHTML = `
                <div class="time-box">
                    <span class="time">${m.time}</span>
                    <span class="ampm">${m.ampm}</span>
                </div>
                <div class="meeting-info">
                    <h4>${m.title}</h4>
                    <p>${m.participants}</p>
                </div>
                <div class="status-pill ${m.status}">${statusDisplay}</div>
            `;
            list.appendChild(item);
        });
    }

    // State
    let currentViewDate = new Date();

    function renderCalendar() {
        const calendarGrid = document.getElementById('calendar-dates');
        const monthLabel = document.getElementById('calendar-month');
        if (!calendarGrid || !monthLabel) return;

        const year = currentViewDate.getFullYear();
        const month = currentViewDate.getMonth();

        monthLabel.innerText = currentViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        calendarGrid.innerHTML = '';

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            const empty = document.createElement('div');
            empty.classList.add('calendar-date', 'empty');
            calendarGrid.appendChild(empty);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateEl = document.createElement('div');
            dateEl.classList.add('calendar-date');

            let html = `<span class="date-num">${day}</span>`;

            const checkItemDate = (dateObj) => {
                return dateObj && dateObj.getDate() === day && dateObj.getMonth() === month && dateObj.getFullYear() === year;
            }

            const hasMeeting = mockData.meetings.some(m => checkItemDate(m.date));
            const hasEvent = mockData.events.some(e => checkItemDate(e.date));

            if (hasMeeting || hasEvent) {
                html += `<div class="dot-container">`;
                if (hasMeeting) html += `<div class="event-dot meeting-dot"></div>`;
                if (hasEvent) html += `<div class="event-dot event-dot-org"></div>`;
                html += `</div>`;
            }

            dateEl.innerHTML = html;

            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dateEl.classList.add('today');
            }

            calendarGrid.appendChild(dateEl);
        }
    }

    // --- Navigation ---
    const prevBtn = document.querySelector('.calendar-nav .btn-icon:first-child');
    const nextBtn = document.querySelector('.calendar-nav .btn-icon:last-child');

    if (prevBtn) {
        prevBtn.onclick = () => {
            currentViewDate.setMonth(currentViewDate.getMonth() - 1);
            renderCalendar();
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            currentViewDate.setMonth(currentViewDate.getMonth() + 1);
            renderCalendar();
        };
    }

    // ── Logout ──
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('tempus_token');
            localStorage.removeItem('tempus_user');
            localStorage.removeItem('selectedRole');
            window.location.href = '/';
        });
    }

    // ── Populate Event Dropdowns ──
    function populateEventDropdowns() {
        const events = mockData.events;
        ['poster-event-select', 'cert-event-select'].forEach(id => {
            const sel = document.getElementById(id);
            if (!sel) return;
            // Keep the placeholder option
            sel.innerHTML = '<option value="">-- Select Event --</option>';
            if (events.length === 0) {
                sel.innerHTML += '<option disabled>No events available</option>';
            }
            events.forEach(e => {
                const opt = document.createElement('option');
                opt.value = e.id;
                opt.textContent = e.title.replace('[Event] ', '');
                sel.appendChild(opt);
            });
        });
    }

    // ── Poster Preview Modal ──
    const posterPreviewModal = document.getElementById('poster-preview-modal');
    const posterCanvas = document.getElementById('poster-canvas');
    const posterPreviewClose = document.getElementById('poster-preview-close');
    const posterPrintBtn = document.getElementById('poster-print-btn');

    function closePosterPreview() {
        posterPreviewModal?.classList.add('hidden');
    }

    posterPreviewClose?.addEventListener('click', closePosterPreview);
    posterPreviewModal?.addEventListener('click', (e) => {
        if (e.target === posterPreviewModal) closePosterPreview();
    });

    // Build FISAT header HTML (top-left corner of every poster)
    function buildFisatHeader() {
        return `
        <div class="fisat-header">
            <div class="fisat-emblem">
                <div class="fisat-gear-outer">
                    <div class="fisat-book">
                        <div class="fisat-flame"></div>
                    </div>
                </div>
                <span class="fisat-ribbon">FISAT</span>
            </div>
            <div class="fisat-text">
                <span class="fisat-name">FISAT<sup>&reg;</sup></span>
                <span class="fisat-fullname">FEDERAL INSTITUTE OF<br>SCIENCE AND TECHNOLOGY</span>
                <span class="fisat-autonomous">(AUTONOMOUS)</span>
                <span class="fisat-tagline">Focus on Excellence</span>
            </div>
        </div>`;
    }

    // Build real poster HTML for a given template
    function buildPosterHTML(event, template) {
        const title = event.title;
        const desc = event.description || 'Join us for this exciting event organized by FISAT.';
        const type = event.type || 'Event';
        const location = event.location || 'FISAT Campus, Angamaly';
        const dateStr = event.start_date
            ? event.start_date.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : 'TBD';
        const timeStr = event.start_date
            ? event.start_date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'TBD';
        const year = new Date().getFullYear();
        const fisat = buildFisatHeader();

        if (template === 'modern') {
            return `
            <div class="poster-modern">
                ${fisat}
                <div class="poster-body">
                    <div class="poster-accent-line"></div>
                    <span class="poster-tag">${type}</span>
                    <div class="poster-title">${title}</div>
                    <div class="poster-desc">${desc}</div>
                    <div class="poster-divider"></div>
                    <div class="poster-meta-grid">
                        <div class="poster-meta-box">
                            <div class="label">Date</div>
                            <div class="value">${dateStr}</div>
                        </div>
                        <div class="poster-meta-box">
                            <div class="label">Time</div>
                            <div class="value">${timeStr}</div>
                        </div>
                        <div class="poster-meta-box">
                            <div class="label">Venue</div>
                            <div class="value">${location}</div>
                        </div>
                        <div class="poster-meta-box">
                            <div class="label">Organized by</div>
                            <div class="value">FISAT</div>
                        </div>
                    </div>
                </div>
                <div class="poster-footer">
                    <span>FISAT &copy; ${year}</span>
                    <span>Federal Institute of Science and Technology</span>
                </div>
            </div>`;
        }

        if (template === 'classic') {
            return `
            <div class="poster-classic">
                ${fisat}
                <div class="poster-body">
                    <div class="poster-gold-bar"></div>
                    <div class="poster-tag">&mdash; ${type} &mdash;</div>
                    <div class="poster-title">${title}</div>
                    <div class="poster-desc">${desc}</div>
                    <table class="poster-meta-table">
                        <tr><td class="meta-label">Date</td><td>${dateStr}</td></tr>
                        <tr><td class="meta-label">Time</td><td>${timeStr}</td></tr>
                        <tr><td class="meta-label">Venue</td><td>${location}</td></tr>
                        <tr><td class="meta-label">Organised by</td><td>Federal Institute of Science and Technology (FISAT)</td></tr>
                    </table>
                    <div class="poster-gold-bar"></div>
                </div>
                <div class="poster-footer">
                    <span>Federal Institute of Science and Technology (Autonomous)</span>
                    <span>&copy; ${year}</span>
                </div>
            </div>`;
        }

        // minimal
        return `
        <div class="poster-minimal">
            ${fisat}
            <div class="poster-body">
                <div class="poster-tag">${type}</div>
                <div class="poster-title">${title}</div>
                <div class="poster-accent"></div>
                <div class="poster-desc">${desc}</div>
                <ul class="poster-meta-list">
                    <li><span class="meta-icon">&#128197;</span> ${dateStr}</li>
                    <li><span class="meta-icon">&#128336;</span> ${timeStr}</li>
                    <li><span class="meta-icon">&#128205;</span> ${location}</li>
                    <li><span class="meta-icon">&#127979;</span> Federal Institute of Science and Technology (FISAT)</li>
                </ul>
            </div>
            <div class="poster-footer">
                <span>fisat.ac.in</span>
                <span>&copy; FISAT ${year}</span>
            </div>
        </div>`;
    }

    function openPosterPreview(event, template, eventName) {
        document.getElementById('poster-preview-label').textContent = `${eventName} — ${template.charAt(0).toUpperCase() + template.slice(1)} Template`;
        posterCanvas.innerHTML = buildPosterHTML(event, template);
        posterPreviewModal.classList.remove('hidden');

        // Download button: print poster canvas as image
        posterPrintBtn.onclick = () => {
            const poster = posterCanvas.firstElementChild;
            if (!poster) return;
            const w = window.open('', '_blank');
            w.document.write(`
                <html><head><title>${eventName}</title>
                <style>
                    body { margin: 0; background: #fff; }
                    @page { size: A4; margin: 0; }
                </style></head>
                <body>${poster.outerHTML}
                <script>window.onload=()=>{window.print();window.close();}<\/script>
                </body></html>`);
            w.document.close();
        };
    }

    // ── Poster & Certificate Generation Handler ──
    function setupGenerators() {
        const posterBtn = document.getElementById('generate-poster-btn');
        const certBtn = document.getElementById('generate-cert-btn');

        if (posterBtn) {
            posterBtn.addEventListener('click', () => {
                const eventId = document.getElementById('poster-event-select').value;
                const template = document.getElementById('poster-template-select').value;
                const results = document.getElementById('poster-results');

                if (!eventId) {
                    results.innerHTML = '<div class="gen-status-msg error">⚠️ Please select an event first.</div>';
                    return;
                }

                const event = mockData.events.find(e => e.id == eventId);
                const eventName = event ? event.title : 'Event';

                posterBtn.disabled = true;
                posterBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
                results.innerHTML = '<div class="gen-status-msg processing">⏳ Generating poster...</div>';

                setTimeout(() => {
                    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    results.innerHTML = `
                        <div class="gen-result-item">
                            <div class="gen-result-icon purple"><i class="fa-solid fa-image"></i></div>
                            <div class="gen-result-info">
                                <h4>${eventName}</h4>
                                <span>${template.charAt(0).toUpperCase() + template.slice(1)} Template &middot; Generated at ${timestamp}</span>
                            </div>
                            <div class="gen-result-actions">
                                <button class="gen-dl-btn" id="view-poster-btn"><i class="fa-solid fa-eye"></i> View</button>
                            </div>
                        </div>
                        <div class="gen-status-msg success">✓ Poster generated successfully!</div>
                    `;
                    document.getElementById('view-poster-btn')?.addEventListener('click', () => {
                        openPosterPreview(event, template, eventName);
                    });
                    posterBtn.disabled = false;
                    posterBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Poster';
                }, 1800);
            });
        }

        if (certBtn) {
            certBtn.addEventListener('click', () => {
                const eventId = document.getElementById('cert-event-select').value;
                const certType = document.getElementById('cert-type-select').value;
                const results = document.getElementById('cert-results');

                if (!eventId) {
                    results.innerHTML = '<div class="gen-status-msg error">⚠️ Please select an event first.</div>';
                    return;
                }

                const event = mockData.events.find(e => e.id == eventId);
                const eventName = event ? event.title : 'Event';

                certBtn.disabled = true;
                certBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
                results.innerHTML = '<div class="gen-status-msg processing">⏳ Generating certificates for all participants...</div>';

                setTimeout(() => {
                    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const certLabel = certType.charAt(0).toUpperCase() + certType.slice(1);
                    results.innerHTML = `
                        <div class="gen-result-item">
                            <div class="gen-result-icon green"><i class="fa-solid fa-certificate"></i></div>
                            <div class="gen-result-info">
                                <h4>${certLabel} &mdash; ${eventName}</h4>
                                <span>Issued for all participants &middot; ${timestamp}</span>
                            </div>
                            <div class="gen-result-actions">
                                <button class="gen-dl-btn"><i class="fa-solid fa-download"></i> Download All</button>
                            </div>
                        </div>
                        <div class="gen-status-msg success">✓ Certificates generated successfully!</div>
                    `;
                    certBtn.disabled = false;
                    certBtn.innerHTML = '<i class="fa-solid fa-file-circle-check"></i> Generate Certificates';
                }, 2000);
            });
        }
    }

    // ── My Events (Admin) ──
    function renderAdminEvents() {
        const list = document.getElementById('admin-events-list');
        const countEl = document.getElementById('admin-event-count');
        if (!list) return;
        list.innerHTML = '';

        const myUserId = storedUser ? storedUser.id : null;
        const myEvents = myUserId
            ? mockData.events.filter(e => e.created_by === myUserId)
            : mockData.events; // fallback: show all

        if (countEl) countEl.textContent = `${myEvents.length} event${myEvents.length !== 1 ? 's' : ''}`;

        if (myEvents.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>No events created yet</p></div>';
            return;
        }

        myEvents.forEach(ev => {
            const dateStr = ev.start_date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const item = document.createElement('div');
            item.className = 'admin-event-row';
            item.innerHTML = `
                <div class="admin-event-info">
                    <span class="admin-event-type">${ev.type}</span>
                    <h4>${ev.title}</h4>
                    <p><i class="fa-regular fa-calendar"></i> ${dateStr}${ev.location ? ` · ${ev.location}` : ''}</p>
                </div>
                <div class="admin-event-actions">
                    <span class="participant-count-pill">${ev.participant_count} participant${ev.participant_count !== 1 ? 's' : ''}</span>
                    <button class="btn-view-participants" data-id="${ev.id}" data-title="${ev.title}">
                        <i class="fa-solid fa-users"></i> View List
                    </button>
                </div>
            `;
            item.querySelector('.btn-view-participants').addEventListener('click', () => viewParticipants(ev.id, ev.title));
            list.appendChild(item);
        });
    }

    // ── Participants Modal ──
    const pModal = document.getElementById('participants-modal');
    const pModalClose = document.getElementById('pmodal-close');

    async function viewParticipants(eventId, eventTitle) {
        document.getElementById('pmodal-title').textContent = eventTitle;
        document.getElementById('pmodal-list').innerHTML = '<div class="empty-state"><p>Loading...</p></div>';
        document.getElementById('pmodal-summary').innerHTML = '';
        pModal.classList.remove('hidden');

        try {
            const res = await fetch(`/api/events/${eventId}/participants`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            document.getElementById('pmodal-summary').innerHTML = `
                <div class="pmodal-stat">
                    <i class="fa-solid fa-users"></i> ${data.participant_count} registered participant${data.participant_count !== 1 ? 's' : ''}
                </div>
            `;

            const list = document.getElementById('pmodal-list');
            if (data.participants.length === 0) {
                list.innerHTML = '<div class="empty-state"><p>No participants yet</p></div>';
                return;
            }

            list.innerHTML = data.participants.map((p, i) => `
                <div class="participant-row">
                    <div class="p-index">${i + 1}</div>
                    <img class="p-avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=3b82f6&color=fff" alt="${p.name}">
                    <div class="p-info">
                        <h4>${p.name}</h4>
                        <span>${p.email}</span>
                    </div>
                    <span class="p-status ${p.status}">${p.status}</span>
                </div>
            `).join('');
        } catch (err) {
            document.getElementById('pmodal-list').innerHTML = `<div class="empty-state"><p>Failed to load participants: ${err.message}</p></div>`;
        }
    }

    function closePModal() { pModal?.classList.add('hidden'); }
    if (pModalClose) pModalClose.addEventListener('click', closePModal);
    pModal?.addEventListener('click', (e) => { if (e.target === pModal) closePModal(); });

    renderProfile();
    renderStats();
    renderUpcomings();
    renderCalendar();
    renderAutomation();
    renderReports();
    renderAdminEvents();
    setupGenerators();

    // Fetch real data then update dropdowns
    fetchDashboardData().then(() => populateEventDropdowns());
});



// ═══════════════════════════════════════════════════════
// NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════════════
function initNotifications() {
    const token = localStorage.getItem('tempus_token');
    if (!token) return;

    const bellBtn     = document.getElementById('notif-bell-btn');
    const dropdown    = document.getElementById('notif-dropdown');
    const badge       = document.getElementById('notif-badge');
    const list        = document.getElementById('notif-list');
    const markAllBtn  = document.getElementById('notif-mark-all-btn');
    const clearBtn    = document.getElementById('notif-clear-btn');

    if (!bellBtn) return;

    const TYPE_ICONS = {
        event_created:  { icon: 'fa-calendar-plus',   cls: 'event_created'  },
        event_joined:   { icon: 'fa-user-check',       cls: 'event_joined'   },
        meeting_invite: { icon: 'fa-handshake',        cls: 'meeting_invite' },
        system:         { icon: 'fa-info-circle',      cls: 'system'         }
    };

    function relativeTime(dateStr) {
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
        if (diff < 60)   return 'Just now';
        if (diff < 3600) return Math.floor(diff/60) + 'm ago';
        if (diff < 86400)return Math.floor(diff/3600) + 'h ago';
        return Math.floor(diff/86400) + 'd ago';
    }

    function renderNotifications(notifications) {
        list.innerHTML = '';
        if (!notifications.length) {
            list.innerHTML = '<li class="notif-empty">You\'re all caught up! &#127881;</li>';
            return;
        }
        notifications.forEach(function(n) {
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

            li.addEventListener('click', function(e) {
                if (e.target.closest('.notif-dismiss')) return;
                if (!n.is_read) doMarkRead(n.id, li);
                if (n.link) window.location.href = n.link;
            });

            li.querySelector('.notif-dismiss').addEventListener('click', function(e) {
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
        }).catch(function(){});
        if (li) li.classList.remove('unread');
    }

    function fetchNotifications() {
        fetch('/api/notifications', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('tempus_token') }
        }).then(function(res) {
            if (!res.ok) return;
            return res.json();
        }).then(function(data) {
            if (!data) return;
            renderNotifications(data.notifications);
            var prev = parseInt(badge.textContent) || 0;
            if (data.unreadCount > 0) {
                badge.textContent = data.unreadCount > 99 ? '99+' : data.unreadCount;
                badge.classList.remove('hidden');
                if (data.unreadCount > prev) {
                    bellBtn.classList.add('ringing');
                    setTimeout(function() { bellBtn.classList.remove('ringing'); }, 700);
                }
            } else {
                badge.classList.add('hidden');
            }
        }).catch(function(){});
    }

    bellBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var open = !dropdown.classList.contains('hidden');
        dropdown.classList.toggle('hidden', open);
        bellBtn.classList.toggle('active', !open);
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('#notif-wrapper')) {
            dropdown.classList.add('hidden');
            bellBtn.classList.remove('active');
        }
    });

    if (markAllBtn) {
        markAllBtn.addEventListener('click', function() {
            fetch('/api/notifications/read-all', {
                method: 'PATCH',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('tempus_token') }
            }).then(function() {
                document.querySelectorAll('.notif-item.unread').forEach(function(el) { el.classList.remove('unread'); });
                badge.classList.add('hidden');
            }).catch(function(){});
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            fetch('/api/notifications', {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('tempus_token') }
            }).then(function() { fetchNotifications(); }).catch(function(){});
        });
    }

    fetchNotifications();
    setInterval(fetchNotifications, 30000);
}

// Auto-init notifications when DOM is ready
document.addEventListener('DOMContentLoaded', function() { initNotifications(); });
