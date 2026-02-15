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
                    title: `[Event] ${e.title}`,
                    type: e.event_type,
                    date: new Date(e.start_date),
                    status: 'upcoming'
                }));
                mockData.stats.events = events.length;
            }

            // Update Stats
            mockData.stats.hours = mockData.meetings.length * 1.5; // Approx duration



            // Re-render
            renderProfile();
            renderStats();
            renderUpcomings();
            renderCalendar();

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

    renderProfile();
    renderStats();
    renderUpcomings();
    renderCalendar();
    renderAutomation();
    renderReports();

    // Fetch real data
    fetchDashboardData();
});
