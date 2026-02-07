document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard Loaded');

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
            name: storedUser ? storedUser.name : "John Doe",
            role: "Administrator",
            avatar: "https://ui-avatars.com/api/?name=" + (storedUser ? storedUser.name : "User") + "&background=3b82f6&color=fff"
        },
        stats: {
            participants: 1240,
            events: 8,
            hours: 42
        },
        meetings: [
            { id: 1, title: "Project Kickoff", time: "10:00", ampm: "AM", participants: "Team Alpha", status: "confirmed" },
            { id: 2, title: "Design Review", time: "02:30", ampm: "PM", participants: "Sarah, Mike", status: "pending" },
            { id: 3, title: "Client Sync", time: "04:00", ampm: "PM", participants: "Acme Corp", status: "confirmed" }
        ],
        automation: [
            { id: 1, type: "Poster Gen", name: "Tech Talk 2025", status: "completed", date: "2 mins ago" },
            { id: 2, type: "Cert Gen", name: "Workshop X", status: "processing", date: "45% done" },
            { id: 3, type: "Report", name: "Monthly Sync", status: "failed", date: "Retry needed" }
        ],
        reports: [
            { id: 1, name: "Weekly_Summary_Oct.pdf", size: "1.2 MB" },
            { id: 2, name: "Event_Q3_Stats.pdf", size: "3.4 MB" },
            { id: 3, name: "Project_Alpha_Log.pdf", size: "850 KB" }
        ]
    };

    function renderProfile() {
        const welcomeName = document.querySelector('.welcome-text p');
        const profileName = document.querySelector('.profile-info .name');
        const profileRole = document.querySelector('.profile-info .role');
        const profileImg = document.querySelector('.user-profile img');

        if (mockData.user) {
            if (welcomeName) welcomeName.innerHTML = `Welcome back,<br>${mockData.user.name.split(' ')[0].toUpperCase()}`;
            if (profileName) profileName.innerText = mockData.user.name.toUpperCase();
            if (profileRole) profileRole.innerText = mockData.user.role;
            if (profileImg) profileImg.src = mockData.user.avatar;
        }
    }

    function renderStats() {
        const pCount = document.getElementById('stat-participants');
        const eCount = document.getElementById('stat-events');
        const hCount = document.getElementById('stat-hours');

        if (pCount) pCount.innerText = mockData.stats.participants.toLocaleString();
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

    function renderCalendar() {
        const calendarGrid = document.getElementById('calendar-dates');
        const monthLabel = document.getElementById('calendar-month');
        if (!calendarGrid) return;

        const startDay = 3;
        const daysInMonth = 31;

        calendarGrid.innerHTML = '';

        for (let i = 0; i < startDay; i++) {
            const empty = document.createElement('div');
            empty.classList.add('calendar-date', 'empty');
            calendarGrid.appendChild(empty);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateEl = document.createElement('div');
            dateEl.classList.add('calendar-date');
            dateEl.innerText = day;

            if (day === 24) {
                dateEl.classList.add('today');
            }

            calendarGrid.appendChild(dateEl);
        }
    }

    renderProfile();
    renderStats();
    renderCalendar();
    renderUpcomings();
    renderAutomation();
    renderReports();
});
