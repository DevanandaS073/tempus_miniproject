document.addEventListener('DOMContentLoaded', () => {


    // ── Auth Check ──
    const token = localStorage.getItem('tempus_token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    const storedUser = localStorage.getItem('tempus_user') ? JSON.parse(localStorage.getItem('tempus_user')) : null;

    // Profile
    const profileName = document.querySelector('.profile-info .name');
    const profileRole = document.querySelector('.profile-info .role');
    const profileImg = document.querySelector('.user-profile img');
    if (storedUser) {
        if (profileName) profileName.textContent = storedUser.name || 'User';
        if (profileRole) profileRole.textContent = (storedUser.role || 'user').charAt(0).toUpperCase() + (storedUser.role || 'user').slice(1);
        if (profileImg) profileImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(storedUser.name || 'U')}&background=3b82f6&color=fff`;
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

    // ── Data Store ──
    const appData = {
        meetings: [],
        events: []
    };

    let currentViewDate = new Date();

    // ── Fetch Data ──
    async function fetchCalendarData() {
        try {
            const [meetingsRes, eventsRes] = await Promise.all([
                fetch('/api/calendar/meetings', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('/api/events')
            ]);

            const meetings = await meetingsRes.json();
            const events = await eventsRes.json();

            if (Array.isArray(meetings)) appData.meetings = meetings;
            if (Array.isArray(events)) appData.events = events;

            renderFullCalendar();
            renderUpcomingSidePanel();

        } catch (error) {
            console.error('Failed to fetch calendar data:', error);
        }
    }

    // ── Render Calendar ──
    function renderFullCalendar() {
        const grid = document.getElementById('calendar-dates');
        const monthLabel = document.getElementById('calendar-month');
        if (!grid || !monthLabel) return;

        grid.innerHTML = '';

        const year = currentViewDate.getFullYear();
        const month = currentViewDate.getMonth();

        monthLabel.innerText = currentViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-date empty';
            grid.appendChild(empty);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateEl = document.createElement('div');
            dateEl.className = 'calendar-date';

            const checkDate = (dString) => {
                const d = new Date(dString);
                return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
            };

            const dayMeetings = appData.meetings.filter(m => checkDate(m.start_time));
            const dayEvents = appData.events.filter(e => checkDate(e.start_date));

            let html = `<span class="date-num">${day}</span>`;

            if (dayMeetings.length > 0 || dayEvents.length > 0) {
                html += `<div class="dot-container">`;
                dayMeetings.forEach(() => html += `<div class="event-dot meeting-dot"></div>`);
                dayEvents.forEach(() => html += `<div class="event-dot event-dot-org"></div>`);
                html += `</div>`;
            }

            dateEl.innerHTML = html;

            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dateEl.classList.add('today');
            }

            grid.appendChild(dateEl);
        }
    }

    // ── Render Upcoming ──
    function renderUpcomingSidePanel() {
        const list = document.getElementById('upcoming-list');
        if (!list) return;
        list.innerHTML = '';

        const allItems = [
            ...appData.meetings.map(m => ({ ...m, type: 'meeting', dateObj: new Date(m.start_time) })),
            ...appData.events.map(e => ({ ...e, type: 'event', dateObj: new Date(e.start_date) }))
        ].sort((a, b) => a.dateObj - b.dateObj);

        const now = new Date();
        const upcomingItems = allItems.filter(item => item.dateObj >= now).slice(0, 10);

        if (upcomingItems.length === 0) {
            list.innerHTML = '<div class="empty-state"><i class="fa-regular fa-calendar"></i><p>No upcoming items</p></div>';
            return;
        }

        upcomingItems.forEach(item => {
            const el = document.createElement('div');
            el.className = 'meeting-item';

            const timeStr = item.dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const isMeeting = item.type === 'meeting';

            el.innerHTML = `
                <div class="time-box" style="background: ${isMeeting ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 159, 67, 0.2)'}">
                    <span class="time">${timeStr}</span>
                    <span class="ampm">${item.dateObj.getDate()}/${item.dateObj.getMonth() + 1}</span>
                </div>
                <div class="meeting-info">
                    <h4>${item.title}</h4>
                    <p>${isMeeting ? 'Personal Meeting' : 'Org Event: ' + item.event_type}</p>
                </div>
            `;
            list.appendChild(el);
        });
    }

    // ── Calendar Navigation ──
    const prevBtn = document.querySelector('.calendar-nav .btn-icon:first-child');
    const nextBtn = document.querySelector('.calendar-nav .btn-icon:last-child');

    if (prevBtn) {
        prevBtn.onclick = () => {
            currentViewDate.setMonth(currentViewDate.getMonth() - 1);
            renderFullCalendar();
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            currentViewDate.setMonth(currentViewDate.getMonth() + 1);
            renderFullCalendar();
        };
    }

    // ── Modal Helpers ──
    function openModal(id) {
        document.getElementById(id).style.display = 'flex';
    }
    function closeModal(id) {
        document.getElementById(id).style.display = 'none';
        // Reset event modal to form step
        if (id === 'event-modal') {
            document.getElementById('event-step-form').classList.remove('hidden');
            document.getElementById('event-step-success').classList.add('hidden');
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
                const token = localStorage.getItem('tempus_token');
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
                    fetchCalendarData();
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

    // ── Meeting date auto-adjust ──
    const mDateEl = document.getElementById('m-date');
    const mTimeEl = document.getElementById('m-time');
    // No end-date field for meetings (uses duration), so no auto-adjust needed here.

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
            // Pre-fill dates
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

            try {
                const res = await fetch('/api/events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(eventData)
                });

                if (res.ok) {
                    lastCreatedEvent = { ...eventData };
                    const result = await res.json();
                    lastCreatedEvent.id = result.event_id;

                    // Show success step
                    document.getElementById('event-step-form').classList.add('hidden');
                    document.getElementById('event-step-success').classList.remove('hidden');
                    document.getElementById('success-event-title').textContent = eventData.title;

                    eventForm.reset();
                    fetchCalendarData();
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

    // ── Init ──
    fetchCalendarData();
});
