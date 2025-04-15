// script.js file
document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    let currentView = 'month';
    let calendar;
    let yearCalendars = [];
    let videoData;
    let tooltipEl;

    // Add loader
    const loaderContainer = document.createElement('div');
    loaderContainer.className = 'loader-container';
    loaderContainer.innerHTML = `
        <div class="loader"></div>
        <div class="loader-text">Loading video calendar...</div>
    `;
    calendarEl.appendChild(loaderContainer);

    // Create tooltip element for thumbnails
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'video-thumbnail-tooltip';
    document.body.appendChild(tooltipEl);

    // Function to extract YouTube video ID from URL
    function getYouTubeID(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    // Function to show tooltip with YouTube thumbnail
    function showTooltip(event, videoInfo) {
        const videoId = getYouTubeID(videoInfo.url);
        if (!videoId) return;
        
        // Get thumbnail URL (medium quality)
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        
        // Calculate position
        const rect = event.target.getBoundingClientRect();
        const top = rect.top + window.scrollY - 10;
        const left = rect.left + window.scrollX + rect.width + 10;
        
        // Update tooltip content
        tooltipEl.innerHTML = `
            <img src="${thumbnailUrl}" alt="${videoInfo.title}">
            <div class="video-title">${videoInfo.title}</div>
            <div class="video-type ${videoInfo.type}">${videoInfo.type === 'full' ? 'Full Video' : 'Reel'}</div>
        `;
        
        // Position tooltip
        tooltipEl.style.top = `${top}px`;
        tooltipEl.style.left = `${left}px`;
        
        // Show tooltip
        tooltipEl.classList.add('show');
    }

    // Function to hide tooltip
    function hideTooltip() {
        tooltipEl.classList.remove('show');
    }

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
            // Remove loader after data is loaded
            calendarEl.removeChild(loaderContainer);
            initializeCalendar(data);
        })
        .catch(error => {
            console.error('Error loading JSON:', error);
            // Update loader to show error
            loaderContainer.innerHTML = `
                <div class="error-message">
                    <p>Unable to load video data. Please try again later.</p>
                    <button class="fc-button fc-button-primary" onclick="location.reload()">Retry</button>
                </div>
            `;
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
                    type: video.type,
                    originalUrl: video.link
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
            eventMouseEnter: function(info) {
                showTooltip(info.jsEvent, {
                    title: info.event.title,
                    url: info.event.url,
                    type: info.event.extendedProps.type
                });
            },
            eventMouseLeave: function() {
                hideTooltip();
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
                    eventMouseEnter: function(info) {
                        showTooltip(info.jsEvent, {
                            title: info.event.title,
                            url: info.event.url,
                            type: info.event.extendedProps.type
                        });
                    },
                    eventMouseLeave: function() {
                        hideTooltip();
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