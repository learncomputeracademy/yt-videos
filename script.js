document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    let currentView = 'month';
    let calendar;
    let yearCalendars = [];
    let videoData;

    // Fetch video data with improved error handling
    fetch('https://data.computercenter.in/wp-json/custom/v1/videos')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            videoData = data;
            initializeCalendar(data);
        })
        .catch(error => {
            console.error('Error loading JSON:', error);
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Unable to load video data. Please try again later.';
            calendarEl.appendChild(errorMessage);
        });

    function initializeCalendar(data) {
        // Convert date format from DD-MM-YYYY to YYYY-MM-DD
        const formattedEvents = data.videos.map(video => {
            const [day, month, year] = video.date.split('-');
            return {
                title: video.title,
                start: `${year}-${month}-${day}`,
                url: video.link,
                allDay: true,
                extendedProps: {
                    type: video.type
                },
                className: `video-type-${video.type}`
            };
        });

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            initialDate: new Date(),
            height: 'auto',
            events: formattedEvents,
            eventClick: function(info) {
                info.jsEvent.preventDefault();
                window.open(info.event.url, '_blank');
            },
            dayMaxEvents: true,
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,fullYear'
            },
            customButtons: {
                fullYear: {
                    text: 'Full Year',
                    click: function() {
                        toggleFullYearView();
                    }
                }
            },
            moreLinkClick: function(arg) {
                arg.jsEvent.preventDefault();
                arg.view.calendar.changeView('dayGridMonth', arg.date);
            },
            dayHeaderFormat: { weekday: 'long' }
        });

        calendar.render();
    }

    function toggleFullYearView() {
        if (currentView === 'month') {
            calendar.destroy();
            calendarEl.classList.add('full-year');
            calendarEl.innerHTML = '<div class="month-container"></div>';
            const container = calendarEl.querySelector('.month-container');

            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            for (let month = 0; month < 12; month++) {
                const monthDiv = document.createElement('div');
                monthDiv.className = 'month-calendar';
                monthDiv.innerHTML = `<div class="month-title">${monthNames[month]} 2025</div>`;
                const calendarDiv = document.createElement('div');
                monthDiv.appendChild(calendarDiv);
                container.appendChild(monthDiv);

                // Convert date format in year view as well
                const formattedEvents = videoData.videos.map(video => {
                    const [day, month, year] = video.date.split('-');
                    return {
                        title: video.title,
                        start: `${year}-${month}-${day}`,
                        url: video.link,
                        allDay: true,
                        extendedProps: {
                            type: video.type
                        },
                        className: `video-type-${video.type}`
                    };
                });

                const monthCalendar = new FullCalendar.Calendar(calendarDiv, {
                    initialView: 'dayGridMonth',
                    initialDate: new Date(2025, month, 1),
                    height: 'auto',
                    events: formattedEvents,
                    eventClick: function(info) {
                        info.jsEvent.preventDefault();
                        window.open(info.event.url, '_blank');
                    },
                    headerToolbar: false
                });

                monthCalendar.render();
                yearCalendars.push(monthCalendar);
            }

            const backButton = document.createElement('button');
            backButton.textContent = 'Back to Month View';
            backButton.className = 'fc-button fc-button-primary back-to-month-btn';
            backButton.onclick = toggleFullYearView;
            calendarEl.insertBefore(backButton, container);

            currentView = 'year';
        } else {
            yearCalendars.forEach(cal => cal.destroy());
            yearCalendars = [];
            calendarEl.classList.remove('full-year');
            calendarEl.innerHTML = '';
            
            initializeCalendar(videoData);
            currentView = 'month';
        }
    }
});