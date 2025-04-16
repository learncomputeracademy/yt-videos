// script.js file
document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    let currentView = 'month';
    let calendar;
    let yearCalendars = [];
    let videoData;
    let tooltipEl;
    
  
    const YOUTUBE_API_KEY = 'AIzaSyCX9qj1CTvW8KjWDahLHah2W4T8O1RxwuA'; 
    
    // Cache video details to avoid redundant API calls
    const videoDetailsCache = {};

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

    // Function to fetch video details from YouTube API
    async function fetchVideoDetails(videoId) {
        // Check cache first
        if (videoDetailsCache[videoId]) {
            return videoDetailsCache[videoId];
        }

        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`);
            
            if (!response.ok) {
                throw new Error('YouTube API request failed');
            }
            
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                // Store in cache
                videoDetailsCache[videoId] = data.items[0];
                return data.items[0];
            } else {
                throw new Error('No video found');
            }
        } catch (error) {
            console.error('Error fetching video details:', error);
            return null;
        }
    }

    // Function to format view count with commas
    function formatNumber(num) {
        return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
    }

    // Function to format ISO duration to human readable
    function formatDuration(isoDuration) {
        if (!isoDuration) return 'Unknown';
        
        const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return isoDuration;
        
        const hours = match[1] ? parseInt(match[1]) : 0;
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const seconds = match[3] ? parseInt(match[3]) : 0;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Function to create a loading tooltip
    function showLoadingTooltip(event, videoInfo) {
        const videoId = getYouTubeID(videoInfo.url);
        if (!videoId) return;
        
        // Get thumbnail URL (medium quality)
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        
        // Calculate position
        const rect = event.target.getBoundingClientRect();
        const top = rect.top + window.scrollY - 10;
        const left = rect.left + window.scrollX + rect.width + 10;
        
        // Update tooltip content with loading state
        tooltipEl.innerHTML = `
            <img src="${thumbnailUrl}" alt="${videoInfo.title}">
            <div class="video-title">${videoInfo.title}</div>
            <div class="video-type ${videoInfo.type}">${videoInfo.type === 'full' ? 'Full Video' : 'Reel'}</div>
            <div class="video-metadata">
                <div class="metadata-loader"></div>
                <div class="metadata-text">Loading details...</div>
            </div>
        `;
        
        // Position tooltip
        tooltipEl.style.top = `${top}px`;
        tooltipEl.style.left = `${left}px`;
        
        // Show tooltip
        tooltipEl.classList.add('show');
        
        // Fetch and update with actual details
        updateTooltipWithDetails(videoId, videoInfo);
    }

    // Function to update tooltip with video details
    async function updateTooltipWithDetails(videoId, videoInfo) {
        const videoDetails = await fetchVideoDetails(videoId);
        
        if (!videoDetails || !tooltipEl.classList.contains('show')) {
            return; // Don't update if tooltip was closed or API call failed
        }
        
        const snippet = videoDetails.snippet || {};
        const statistics = videoDetails.statistics || {};
        const contentDetails = videoDetails.contentDetails || {};
        
        // Get better quality thumbnail if available
        const thumbnailUrl = snippet.thumbnails?.high?.url || 
                             snippet.thumbnails?.medium?.url || 
                             `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        
        // Format date
        const publishedAt = new Date(snippet.publishedAt || '');
        const formattedDate = isNaN(publishedAt) ? 'Unknown date' : 
                             publishedAt.toLocaleDateString(undefined, { 
                                year: 'numeric', month: 'short', day: 'numeric' 
                             });
        
        // Update tooltip with full details
        tooltipEl.innerHTML = `
            <img src="${thumbnailUrl}" alt="${videoInfo.title}" class="video-thumbnail">
            <div class="video-details">
                <div class="video-title">${snippet.title || videoInfo.title}</div>
                <div class="video-type ${videoInfo.type}">${videoInfo.type === 'full' ? 'Full Video' : 'Reel'}</div>
                
                <div class="video-metadata">
                    <div class="metadata-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z"/>
                        </svg>
                        <span>Published: ${formattedDate}</span>
                    </div>
                    
                    <div class="metadata-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                        </svg>
                        <span>Duration: ${formatDuration(contentDetails.duration)}</span>
                    </div>
                    
                    <div class="metadata-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
                            <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>
                        </svg>
                        <span>${formatNumber(statistics.viewCount || 0)} views</span>
                    </div>
                    
                    <div class="metadata-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8.864.046C7.908-.193 7.02.53 6.956 1.466c-.072 1.051-.23 2.016-.428 2.59-.125.36-.479 1.013-1.04 1.639-.557.623-1.282 1.178-2.131 1.41C2.685 7.288 2 7.87 2 8.72v4.001c0 .845.682 1.464 1.448 1.545 1.07.114 1.564.415 2.068.723l.048.03c.272.165.578.348.97.484.397.136.861.217 1.466.217h3.5c.937 0 1.599-.477 1.934-1.064a1.86 1.86 0 0 0 .254-.912c0-.152-.023-.312-.077-.464.201-.263.38-.578.488-.901.11-.33.172-.762.004-1.149.069-.13.12-.269.159-.403.077-.27.113-.568.113-.857 0-.288-.036-.585-.113-.856a2.144 2.144 0 0 0-.138-.362 1.9 1.9 0 0 0 .234-1.734c-.206-.592-.682-1.1-1.2-1.272-.847-.282-1.803-.276-2.516-.211a9.84 9.84 0 0 0-.443.05 9.365 9.365 0 0 0-.062-4.509A1.38 1.38 0 0 0 9.125.111L8.864.046zM11.5 14.721H8c-.51 0-.863-.069-1.14-.164-.281-.097-.506-.228-.776-.393l-.04-.024c-.555-.339-1.198-.731-2.49-.868-.333-.036-.554-.29-.554-.55V8.72c0-.254.226-.543.62-.65 1.095-.3 1.977-.996 2.614-1.708.635-.71 1.064-1.475 1.238-1.978.243-.7.407-1.768.482-2.85.025-.362.36-.594.667-.518l.262.066c.16.04.258.143.288.255a8.34 8.34 0 0 1-.145 4.725.5.5 0 0 0 .595.644l.003-.001.014-.003.058-.014a8.908 8.908 0 0 1 1.036-.157c.663-.06 1.457-.054 2.11.164.175.058.45.3.57.65.107.308.087.67-.266 1.022l-.353.353.353.354c.043.043.105.141.154.315.048.167.075.37.075.581 0 .212-.027.414-.075.582-.05.174-.111.272-.154.315l-.353.353.353.354c.047.047.109.177.005.488a2.224 2.224 0 0 1-.505.805l-.353.353.353.354c.006.005.041.05.041.17a.866.866 0 0 1-.121.416c-.165.288-.503.56-1.066.56z"/>
                        </svg>
                        <span>${formatNumber(statistics.likeCount || 0)} likes</span>
                    </div>
                    
                    <div class="metadata-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4.414a1 1 0 0 0-.707.293L.854 15.146A.5.5 0 0 1 0 14.793V2zm3.5 1a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1h-9zm0 2.5a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1h-9zm0 2.5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5z"/>
                        </svg>
                        <span>${formatNumber(statistics.commentCount || 0)} comments</span>
                    </div>
                </div>
                
                <div class="video-description">
                    ${snippet.description ? snippet.description.substring(0, 100) + (snippet.description.length > 100 ? '...' : '') : 'No description available'}
                </div>
            </div>
            <div class="tooltip-footer">
                <a href="${videoInfo.url}" target="_blank" class="watch-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                        <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                    </svg>
                    Watch Video
                </a>
            </div>
        `;
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
                showLoadingTooltip(info.jsEvent, {
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
                        showLoadingTooltip(info.jsEvent, {
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