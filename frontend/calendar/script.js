document.addEventListener('DOMContentLoaded', () => {
    console.log('Calendar Page Loaded');

    // Shared Data Store
    const appData = {
        meetings: [],
        events: []
    };

    // --- 1. Fetch Data ---
    async function fetchCalendarData() {
        try {
            const userId = 5;
            const [meetingsRes, eventsRes] = await Promise.all([
                fetch(`/api/calendar/meetings?user_id=${userId}`),
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

    // --- 2. Render Functions ---
    function renderFullCalendar() {
        const grid = document.getElementById('calendar-dates');
        if (!grid) return;
        grid.innerHTML = '';

        const startDay = 3; // Mock
        const daysInMonth = 31;
        const currentMonth = 9; // Oct (0-index) - Adjust logic later

        // Empty slots
        for (let i = 0; i < startDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-date empty';
            grid.appendChild(empty);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateEl = document.createElement('div');
            dateEl.className = 'calendar-date';

            // Check for events
            // Simplified matching for now (Day only)
            const dayMeetings = appData.meetings.filter(m => new Date(m.start_time).getDate() === day);
            const dayEvents = appData.events.filter(e => new Date(e.start_date).getDate() === day);

            // Inner Content
            let html = `<span class="date-num">${day}</span>`;

            if (dayMeetings.length > 0 || dayEvents.length > 0) {
                html += `<div class="dot-container">`;
                dayMeetings.forEach(() => html += `<div class="event-dot meeting-dot"></div>`);
                dayEvents.forEach(() => html += `<div class="event-dot event-dot-org"></div>`);
                html += `</div>`;
            }

            dateEl.innerHTML = html;

            // Highlight Today
            if (day === new Date().getDate()) dateEl.classList.add('today');

            grid.appendChild(dateEl);
        }
    }

    function renderUpcomingSidePanel() {
        const list = document.getElementById('upcoming-list');
        if (!list) return;
        list.innerHTML = '';

        // Merge and Sort
        const allItems = [
            ...appData.meetings.map(m => ({ ...m, type: 'meeting', dateObj: new Date(m.start_time) })),
            ...appData.events.map(e => ({ ...e, type: 'event', dateObj: new Date(e.start_date) }))
        ].sort((a, b) => a.dateObj - b.dateObj);

        allItems.forEach(item => {
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

    // --- 3. Modal Logic (Add Meeting) ---
    const modal = document.getElementById('meeting-modal');
    const btn = document.getElementById('add-meeting-btn');
    const span = document.getElementsByClassName('close-modal')[0];
    const form = document.getElementById('meeting-form');

    if (btn && modal) {
        btn.onclick = () => {
            modal.style.display = "flex";
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            document.getElementById('m-date').value = now.toISOString().split('T')[0];
            document.getElementById('m-time').value = now.toISOString().split('T')[1].slice(0, 5);
        }
        span.onclick = () => modal.style.display = "none";
        window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; }
    }

    if (form) {
        form.onsubmit = async (e) => {
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
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title, start_time: start, end_time: end, user_id: 5
                    })
                });

                if (res.ok) {
                    modal.style.display = "none";
                    form.reset();
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
        }
    }

    // Init
    fetchCalendarData();
});
