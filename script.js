/* --- INITIALIZATION --- */
document.addEventListener('DOMContentLoaded', () => {
    initBootSequence();
});

function initBootSequence() {
    const bootScreen = document.getElementById('boot-screen');
    const progressBar = document.getElementById('boot-progress-bar');
    let progress = 0;

    const bootInterval = setInterval(() => {
        progress += Math.random() * 8 + 2;
        if (progress >= 100) {
            progress = 100;
            clearInterval(bootInterval);
            
            if (progressBar) progressBar.style.width = '100%';
            
            setTimeout(() => {
                if (bootScreen) bootScreen.classList.add('fade-out');
                
                setTimeout(() => {
                    if (bootScreen) bootScreen.style.display = 'none';
                    initDesktop();
                }, 600); 
            }, 500);
        } else {
            if (progressBar) progressBar.style.width = `${progress}%`;
        }
    }, 100);
}

function initDesktop() {
    initClock();
    initDockMagnification();
    initDraggableWindows();
    initDefaultWallpaper();
    initCalendar();
    initFinder();
    initNotes();
    initDesktopIcons();
    initSpotlightSearch();
}

/* --- FINDER APP LOGIC --- */
const finderFiles = [
    { name: 'Portfolio Projects', type: 'folder', folder: 'All Files', target: 'Projects', detail: '6 projects' },
    { name: 'About Me', type: 'document', folder: 'About Me', detail: 'Profile and experience', action: 'open-about' },
    { name: 'Contact', type: 'document', folder: 'Contact', detail: 'Get in touch', action: 'open-contact' },
    { name: 'Macintosh HD', type: 'folder', folder: 'Macintosh HD', detail: 'Local disk' },
    { name: 'Web Portfolio', type: 'folder', folder: 'Projects', target: 'Projects', detail: 'Frontend project' },
    { name: 'Desktop Experience', type: 'folder', folder: 'Projects', target: 'Projects', detail: 'Interaction study' },
    { name: 'Visual Identity', type: 'folder', folder: 'Projects', target: 'Projects', detail: 'Brand system' }
];

let finderFolder = 'All Files';

function initFinder() {
    const search = document.getElementById('finder-search');
    if (!search) return;
    search.addEventListener('input', renderFinderFiles);
    renderFinderFiles();
}

function openFinder() {
    openWindow('window-finder');
    renderFinderFiles();
}

function selectFinderFolder(folder) {
    finderFolder = folder;
    const search = document.getElementById('finder-search');
    if (search) search.value = '';
    document.querySelectorAll('.finder-location').forEach(location => {
        location.classList.toggle('active', location.dataset.folder === folder);
    });
    document.getElementById('finder-breadcrumb').textContent = folder;
    renderFinderFiles();
}

function renderFinderFiles() {
    const grid = document.getElementById('finder-grid');
    const search = document.getElementById('finder-search');
    const status = document.getElementById('finder-status');
    if (!grid || !status) return;

    const query = search ? search.value.trim().toLowerCase() : '';
    const visibleFiles = finderFiles.filter(file => {
        const matchesFolder = finderFolder === 'All Files' || file.folder === finderFolder;
        const matchesSearch = !query || file.name.toLowerCase().includes(query) || file.detail.toLowerCase().includes(query);
        return matchesFolder && matchesSearch;
    });

    grid.innerHTML = '';
    visibleFiles.forEach(file => {
        const item = document.createElement('button');
        item.className = 'finder-file';
        item.type = 'button';
        const icon = file.type === 'folder' || file.action === 'open-about' || file.action === 'open-contact'
            ? '<img class="finder-file-icon folder" src="assets/app/Apple_App_Icons_-_Sketch_Resource-removebg-preview.png" alt="">'
            : `<span class="finder-file-icon ${file.type}" aria-hidden="true">${file.type === 'drive' ? 'Disk' : 'Doc'}</span>`;
        item.innerHTML = `${icon}<strong>${file.name}</strong><small>${file.detail}</small>`;
        item.addEventListener('click', () => {
            if (file.action === 'open-about') {
                openAboutPortfolio();
            } else if (file.action === 'open-contact') {
                openWindow('window-contact');
            } else if (file.type === 'folder') {
                selectFinderFolder(file.target || file.folder);
            }
        });
        grid.appendChild(item);
    });

    status.textContent = `${visibleFiles.length} item${visibleFiles.length === 1 ? '' : 's'}`;
}

/* --- NOTES APP LOGIC --- */
let notes = JSON.parse(localStorage.getItem('portfolio_notes') || '[]');
let selectedNoteId = null;

function initNotes() {
    const search = document.getElementById('notes-search');
    const title = document.getElementById('note-title');
    const content = document.getElementById('note-content');
    if (!search || !title || !content) return;

    search.addEventListener('input', renderNotesList);
    title.addEventListener('input', saveSelectedNote);
    content.addEventListener('input', saveSelectedNote);

    if (notes.length > 0) selectedNoteId = notes[0].id;
    renderNotesList();
    renderSelectedNote();
}

function openNotes() {
    openWindow('window-notes');
    renderNotesList();
    renderSelectedNote();
}

function createNote() {
    const note = {
        id: Date.now(),
        title: 'New Note',
        content: '',
        updatedAt: Date.now()
    };
    notes.unshift(note);
    selectedNoteId = note.id;
    persistNotes();
    renderNotesList();
    renderSelectedNote();
    document.getElementById('note-title').focus();
    document.getElementById('note-title').select();
}

function selectNote(noteId) {
    selectedNoteId = noteId;
    renderNotesList();
    renderSelectedNote();
}

function renderNotesList() {
    const list = document.getElementById('notes-list');
    const search = document.getElementById('notes-search');
    if (!list) return;

    const query = search ? search.value.trim().toLowerCase() : '';
    const visibleNotes = notes.filter(note =>
        !query || `${note.title} ${note.content}`.toLowerCase().includes(query)
    );

    list.innerHTML = '';
    if (visibleNotes.length === 0) {
        list.innerHTML = '<p class="notes-empty">No notes found.</p>';
        return;
    }

    visibleNotes.forEach(note => {
        const item = document.createElement('button');
        item.className = `note-list-item${note.id === selectedNoteId ? ' active' : ''}`;
        item.type = 'button';
        item.innerHTML = `<strong>${escapeNoteText(note.title || 'Untitled')}</strong><span>${escapeNoteText(note.content || 'No additional text')}</span>`;
        item.addEventListener('click', () => selectNote(note.id));
        list.appendChild(item);
    });
}

function renderSelectedNote() {
    const title = document.getElementById('note-title');
    const content = document.getElementById('note-content');
    const deleteButton = document.querySelector('.notes-delete-btn');
    if (!title || !content) return;

    const note = notes.find(item => item.id === selectedNoteId);
    const hasNote = Boolean(note);
    title.disabled = !hasNote;
    content.disabled = !hasNote;
    if (deleteButton) deleteButton.disabled = !hasNote;
    title.value = hasNote ? note.title : '';
    content.value = hasNote ? note.content : '';
    updateNotesStatus(hasNote ? 'Saved' : 'No note selected');
}

function saveSelectedNote() {
    const note = notes.find(item => item.id === selectedNoteId);
    if (!note) return;
    note.title = document.getElementById('note-title').value;
    note.content = document.getElementById('note-content').value;
    note.updatedAt = Date.now();
    persistNotes();
    renderNotesList();
    updateNotesStatus('Saved');
}

function deleteSelectedNote() {
    if (selectedNoteId === null) return;
    notes = notes.filter(note => note.id !== selectedNoteId);
    selectedNoteId = notes.length > 0 ? notes[0].id : null;
    persistNotes();
    renderNotesList();
    renderSelectedNote();
}

function persistNotes() {
    localStorage.setItem('portfolio_notes', JSON.stringify(notes));
}

function updateNotesStatus(status) {
    const statusEl = document.getElementById('notes-save-status');
    if (statusEl) statusEl.textContent = status;
}

function escapeNoteText(value) {
    return String(value).replace(/[&<>'"]/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[character]));
}

/* --- CALENDAR APP LOGIC --- */
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

let calViewDate = new Date();   // month currently displayed
let calSelectedDate = null;     // date user clicked
let calEvents = JSON.parse(localStorage.getItem('cal_events') || '{}');

function initCalendar() {
    renderCalendarGrid();
    renderCalSidebar();
}

function renderCalendarGrid() {
    const year = calViewDate.getFullYear();
    const month = calViewDate.getMonth();
    const today = new Date();

    document.getElementById('cal-month-year-label').textContent = `${MONTHS[month]} ${year}`;
    document.getElementById('cal-sidebar-year').textContent = year;

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const grid = document.getElementById('cal-grid-main');
    grid.innerHTML = '';

    // Previous month tail
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        const cell = createCalCell(day, month - 1, year, true);
        grid.appendChild(cell);
    }

    // Current month
    for (let d = 1; d <= totalDays; d++) {
        const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const isSelected = calSelectedDate &&
            d === calSelectedDate.getDate() &&
            month === calSelectedDate.getMonth() &&
            year === calSelectedDate.getFullYear();
        const cell = createCalCell(d, month, year, false, isToday, isSelected);
        grid.appendChild(cell);
    }

    // Next month fill
    const filled = firstDay + totalDays;
    const remaining = filled % 7 === 0 ? 0 : 7 - (filled % 7);
    for (let d = 1; d <= remaining; d++) {
        const cell = createCalCell(d, month + 1, year, true);
        grid.appendChild(cell);
    }

    renderEventsList();
}

function createCalCell(day, month, year, otherMonth, isToday = false, isSelected = false) {
    const cell = document.createElement('div');
    cell.className = 'cal-day-cell';

    // Resolve correct date for other-month cells
    const actualDate = new Date(year, month, day);
    const dow = actualDate.getDay();

    if (otherMonth) cell.classList.add('other-month');
    if (isToday) cell.classList.add('today');
    if (isSelected) cell.classList.add('selected');
    if (!otherMonth && dow === 0) cell.classList.add('sunday');
    if (!otherMonth && dow === 6) cell.classList.add('saturday');

    const numEl = document.createElement('div');
    numEl.className = 'cal-day-num';
    numEl.textContent = day;
    cell.appendChild(numEl);

    // Event dots
    const dateKey = `${actualDate.getFullYear()}-${actualDate.getMonth()}-${actualDate.getDate()}`;
    if (calEvents[dateKey] && calEvents[dateKey].length > 0) {
        const dots = document.createElement('div');
        dots.className = 'cal-day-dots';
        const dotsToShow = Math.min(calEvents[dateKey].length, 3);
        for (let i = 0; i < dotsToShow; i++) {
            const dot = document.createElement('div');
            dot.className = 'cal-dot';
            dots.appendChild(dot);
        }
        cell.appendChild(dots);
    }

    cell.addEventListener('click', () => {
        calSelectedDate = actualDate;
        // If clicking other-month cell, navigate there
        if (otherMonth) {
            calViewDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), 1);
        }
        renderCalendarGrid();
        showCalEventForm(dateKey);
    });

    return cell;
}

function calNavigate(dir) {
    calViewDate = new Date(calViewDate.getFullYear(), calViewDate.getMonth() + dir, 1);
    renderCalendarGrid();
    renderCalSidebar();
}

function calGoToday() {
    const today = new Date();
    calViewDate = new Date(today.getFullYear(), today.getMonth(), 1);
    calSelectedDate = today;
    renderCalendarGrid();
    renderCalSidebar();
}

function renderCalSidebar() {
    const year = calViewDate.getFullYear();
    const currentMonth = calViewDate.getMonth();
    const container = document.getElementById('cal-mini-months');
    container.innerHTML = '';
    for (let m = 0; m < 12; m++) {
        const label = document.createElement('div');
        label.className = 'cal-mini-month-label';
        label.textContent = SHORT_MONTHS[m];
        if (m === currentMonth) label.style.color = '#007aff';
        label.addEventListener('click', () => {
            calViewDate = new Date(year, m, 1);
            renderCalendarGrid();
            renderCalSidebar();
        });
        container.appendChild(label);
    }
}

function showCalEventForm(dateKey) {
    document.getElementById('cal-add-event-form').style.display = 'flex';
    document.getElementById('cal-event-input').value = '';
    document.getElementById('cal-event-input').dataset.dateKey = dateKey;
    document.getElementById('cal-event-input').focus();
    renderEventsList();
}

function renderEventsList() {
    const list = document.getElementById('cal-events-list');
    if (!calSelectedDate) {
        list.innerHTML = '<p class="cal-no-events">No events. Click a day to add one.</p>';
        return;
    }

    const dateKey = `${calSelectedDate.getFullYear()}-${calSelectedDate.getMonth()}-${calSelectedDate.getDate()}`;
    const events = calEvents[dateKey] || [];
    const dateLabel = calSelectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    if (events.length === 0) {
        list.innerHTML = `<p class="cal-no-events">${dateLabel} — No events yet.</p>`;
    } else {
        list.innerHTML = `<p class="cal-no-events" style="font-weight:600;color:#1d1d1f;">${dateLabel}</p>`;
        events.forEach((ev, idx) => {
            const item = document.createElement('div');
            item.className = 'cal-event-item';
            item.innerHTML = `<span>${ev}</span><span class="cal-event-remove" onclick="removeCalEvent('${dateKey}', ${idx})">✕</span>`;
            list.appendChild(item);
        });
    }
}

function saveCalEvent() {
    const input = document.getElementById('cal-event-input');
    const dateKey = input.dataset.dateKey;
    const title = input.value.trim();
    if (!title) return;

    if (!calEvents[dateKey]) calEvents[dateKey] = [];
    calEvents[dateKey].push(title);
    localStorage.setItem('cal_events', JSON.stringify(calEvents));

    input.value = '';
    renderCalendarGrid();
    renderEventsList();
}

function cancelCalEvent() {
    document.getElementById('cal-add-event-form').style.display = 'none';
    document.getElementById('cal-event-input').value = '';
}

function removeCalEvent(dateKey, idx) {
    if (calEvents[dateKey]) {
        calEvents[dateKey].splice(idx, 1);
        if (calEvents[dateKey].length === 0) delete calEvents[dateKey];
        localStorage.setItem('cal_events', JSON.stringify(calEvents));
        renderCalendarGrid();
        renderEventsList();
    }
}


/* --- 1. CLOCK LOGIC --- */
function initClock() {
    const clockEl = document.getElementById('clock');
    
    function updateTime() {
        const now = new Date();
        const options = { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        };
        clockEl.textContent = now.toLocaleDateString('en-US', options).replace(/,/g, '');
    }

    updateTime();
    setInterval(updateTime, 1000);
}

/* --- 2. DOCK MAGNIFICATION EFFECT --- */
function initDockMagnification() {
    const dock = document.getElementById('dock');
    const dockItems = document.querySelectorAll('.dock-item');

    dock.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX;

        dockItems.forEach(item => {
            const rect = item.getBoundingClientRect();
            const itemCenter = rect.left + rect.width / 2;
            const distance = Math.abs(mouseX - itemCenter);
            
            // Calculate scale based on mouse proximity
            let scale = 1;
            if (distance < 140) {
                scale = 1 + (1 - distance / 140) * 0.45; // Max 1.45x scale
            }

            item.style.transform = `scale(${scale})`;
            item.style.margin = `0 ${scale * 2}px`;
        });
    });

    dock.addEventListener('mouseleave', () => {
        dockItems.forEach(item => {
            item.style.transform = 'scale(1)';
            item.style.margin = '0';
        });
    });
}

/* --- 3. WINDOW MANAGEMENT & DRAGGING --- */
let highestZIndex = 100;

function openWindow(windowId) {
    const win = document.getElementById(windowId);
    if (!win) return;
    
    highestZIndex++;
    win.style.zIndex = highestZIndex;
    win.classList.add('open');
}

function closeWindow(windowId) {
    const win = document.getElementById(windowId);
    if (win) {
        win.classList.remove('open');
    }
}

function minimizeWindow(windowId) {
    closeWindow(windowId);
}

function maximizeWindow(windowId) {
    const win = document.getElementById(windowId);
    if (win) {
        win.classList.toggle('maximized');
    }
}

function initDraggableWindows() {
    const windows = document.querySelectorAll('.window');

    windows.forEach(win => {
        const header = win.querySelector('.window-header');
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        win.addEventListener('mousedown', () => {
            highestZIndex++;
            win.style.zIndex = highestZIndex;
        });

        header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('light')) return; // Ignore traffic lights

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = win.offsetLeft;
            initialTop = win.offsetTop;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        function onMouseMove(e) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            win.style.left = `${initialLeft + dx}px`;
            win.style.top = `${initialTop + dy}px`;
        }

        function onMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    });
}

/* --- 4. WALLPAPER APP LOGIC --- */
function initDefaultWallpaper() {
    const savedTheme = localStorage.getItem('selected_wallpaper') || 'big-sur';
    changeWallpaper(savedTheme);
}

function changeWallpaper(theme) {
    const desktop = document.getElementById('desktop');
    desktop.className = `desktop ${theme}`;

    localStorage.setItem('selected_wallpaper', theme);

    // Update selected card state
    document.querySelectorAll('.wallpaper-card').forEach(card => {
        card.classList.remove('active');
        // Match card by checking its onclick attribute for the theme name
        if (card.getAttribute('onclick') && card.getAttribute('onclick').includes(`'${theme}'`)) {
            card.classList.add('active');
        }
    });
}

/* --- 5. CALCULATOR LOGIC --- */
let calcValue = '0';
let prevValue = null;
let currentOp = null;
let calcWaitingForOperand = false;

function updateCalcDisplay() {
    document.getElementById('calcDisplay').textContent = calcValue;
}

function calculateResult(firstValue, secondValue, operation) {
    const a = parseFloat(firstValue);
    const b = parseFloat(secondValue);

    switch (operation) {
        case '+': return a + b;
        case '-': return a - b;
        case '×': return a * b;
        case '÷': return b === 0 ? 'Error' : a / b;
        default: return b;
    }
}

function calcAction(type, val = '') {
    if (type === 'num') {
        if (calcWaitingForOperand) {
            calcValue = val === '.' ? '0.' : val;
            calcWaitingForOperand = false;
        } else if (calcValue === '0' && val !== '.') {
            calcValue = val;
        } else if (val === '.' && calcValue.includes('.')) {
            return;
        } else {
            calcValue += val;
        }
    } else if (type === 'clear') {
        calcValue = '0';
        prevValue = null;
        currentOp = null;
        calcWaitingForOperand = false;
    } else if (type === 'sign') {
        if (calcValue !== 'Error') calcValue = (parseFloat(calcValue) * -1).toString();
    } else if (type === 'percent') {
        if (calcValue !== 'Error') calcValue = (parseFloat(calcValue) / 100).toString();
    } else if (type === 'op') {
        if (calcValue === 'Error') return;
        if (prevValue !== null && currentOp !== null && !calcWaitingForOperand) {
            calcValue = calculateResult(prevValue, calcValue, currentOp).toString();
            if (calcValue === 'Error') {
                prevValue = null;
                currentOp = null;
                updateCalcDisplay();
                return;
            }
        } else if (prevValue === null) {
            prevValue = calcValue;
        }
        currentOp = val;
        calcWaitingForOperand = true;
    } else if (type === 'equals') {
        if (prevValue !== null && currentOp !== null && !calcWaitingForOperand) {
            calcValue = calculateResult(prevValue, calcValue, currentOp).toString();
            prevValue = null;
            currentOp = null;
            calcWaitingForOperand = true;
        }
    }

    updateCalcDisplay();
}

/* --- 6. NANO BANANA INTERACTIVE PLAYGROUND --- */
function generateBananaIcon() {
    const promptInput = document.getElementById('nbPrompt').value;
    const previewArea = document.getElementById('nbPreview');

    if (!promptInput.trim()) {
        previewArea.innerHTML = `<p style="color: #ff3b30;">Please enter a description first!</p>`;
        return;
    }

    previewArea.innerHTML = `<div class="nb-placeholder-icon">🍌</div><p>Generating "${promptInput}"...</p>`;

    setTimeout(() => {
        previewArea.innerHTML = `
            <div style="font-size: 50px;">🎨</div>
            <p style="color: #34c759; font-weight: 600; margin-top: 6px;">Icon Generated!</p>
            <small style="color: #86868b;">"${promptInput}" style rendered.</small>
        `;
    }, 1200);
}

/* --- 7. DESKTOP ICONS --- */
function initDesktopIcons() {
    const icons = document.querySelectorAll('.desktop-icon');
    icons.forEach(icon => {
        let clickTimer = null;
        icon.addEventListener('click', (e) => {
            if (clickTimer === null) {
                clickTimer = setTimeout(() => {
                    handleClickIcon(icon);
                    clickTimer = null;
                }, 250);
            } else {
                clearTimeout(clickTimer);
                clickTimer = null;
                handleDoubleClickIcon(icon);
            }
        });
    });
}

function handleClickIcon(icon) {
    icon.style.transform = 'scale(0.95)';
    setTimeout(() => { icon.style.transform = ''; }, 100);
}

function handleDoubleClickIcon(icon) {
    const action = icon.dataset.action;
    icon.style.transform = 'scale(1.1)';
    setTimeout(() => { icon.style.transform = ''; }, 100);

    switch (action) {
        case 'resume':
            openWindow('window-finder');
            selectFinderFolder('About Me');
            break;
        case 'projects':
            openWindow('window-finder');
            selectFinderFolder('Projects');
            break;
        case 'contact':
            openWindow('window-contact');
            break;
    }
}

/* --- 8. SPOTLIGHT SEARCH --- */
const spotlightData = [
    { id: 'finder', label: 'Finder', category: 'Apps', action: () => { openFinder(); } },
    { id: 'calculator', label: 'Calculator', category: 'Apps', action: () => { openWindow('window-calculator'); } },
    { id: 'calendar', label: 'Calendar', category: 'Apps', action: () => { openWindow('window-calendar'); } },
    { id: 'notes', label: 'Notes', category: 'Apps', action: () => { openNotes(); } },
    { id: 'wallpapers', label: 'Wallpapers', category: 'Apps', action: () => { openWindow('window-wallpapers'); } },
    { id: 'nanobanana', label: 'Nano Banana Studio', category: 'Apps', action: () => { openWindow('window-nanobanana'); } },
    { id: 'about', label: 'About This Portfolio', category: 'Apps', action: () => { openAboutPortfolio(); } },
    { id: 'about-me', label: 'About Me', category: 'Apps', action: () => { openAboutPortfolio(); } },
    { id: 'resume', label: 'Resume (desktop)', category: 'Files', action: () => { openWindow('window-finder'); selectFinderFolder('About Me'); } },
    { id: 'projects', label: 'Projects (desktop)', category: 'Files', action: () => { openWindow('window-finder'); selectFinderFolder('Projects'); } },
    { id: 'contact', label: 'Contact Me (desktop)', category: 'Files', action: () => { openWindow('window-contact'); } },
    { id: 'bigsur', label: 'Wallpaper: Big Sur', category: 'Actions', action: () => { changeWallpaper('big-sur'); } },
    { id: 'monterey', label: 'Wallpaper: Monterey', category: 'Actions', action: () => { changeWallpaper('monterey'); } },
    { id: 'ventura', label: 'Wallpaper: Ventura', category: 'Actions', action: () => { changeWallpaper('ventura'); } },
    { id: 'reload', label: 'Restart… (Relaunch Portfolio)', category: 'Actions', action: () => { location.reload(); } }
];

function initSpotlightSearch() {
    document.addEventListener('keydown', (e) => {
        if ((e.key === ' ' || e.code === 'Space') && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
            e.preventDefault();
            toggleSpotlight();
        }
    });

    const input = document.getElementById('spotlight-full-input');
    if (input) {
        input.addEventListener('input', renderSpotlightResults);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeSpotlight();
            } else if (e.key === 'Enter') {
                const firstResult = document.querySelector('.spotlight-result-item');
                if (firstResult) {
                    firstResult.click();
                }
            }
        });
    }
}

function toggleSpotlight() {
    const overlay = document.getElementById('spotlight-full');
    if (!overlay) return;
    if (overlay.classList.contains('active')) {
        closeSpotlight();
    } else {
        openSpotlight();
    }
}

function openSpotlight() {
    const overlay = document.getElementById('spotlight-full');
    const input = document.getElementById('spotlight-full-input');
    if (!overlay || !input) return;
    overlay.classList.add('active');
    input.value = '';
    input.focus();
    renderSpotlightResults();
}

function closeSpotlight() {
    const overlay = document.getElementById('spotlight-full');
    if (!overlay) return;
    overlay.classList.remove('active');
}

function renderSpotlightResults() {
    const input = document.getElementById('spotlight-full-input');
    const resultsEl = document.getElementById('spotlight-full-results');
    if (!input || !resultsEl) return;

    const query = input.value.trim().toLowerCase();
    const filtered = query
        ? spotlightData.filter(item =>
            item.label.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query)
          )
        : spotlightData.slice(0, 8);

    resultsEl.innerHTML = '';
    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = 'spotlight-result-item';
        div.innerHTML = `
            <span class="spotlight-result-icon">${getSpotlightItemIcon(item.id)}</span>
            <span class="spotlight-result-text">${highlightMatch(item.label, query)}</span>
            <span class="spotlight-result-sub">${item.category}</span>
        `;
        div.addEventListener('click', () => {
            closeSpotlight();
            item.action();
        });
        resultsEl.appendChild(div);
    });
}

function getSpotlightItemIcon(id) {
    const icons = {
        finder: '📁',
        calculator: '🔢',
        calendar: '📅',
        notes: '📝',
        wallpapers: '🖼️',
        nanobanana: '🍌',
        about: 'ℹ️',
        'about-me': 'ℹ️',
        resume: '📄',
        projects: '📁',
        contact: '✉️',
        bigsur: '🌄',
        monterey: '🌊',
        ventura: '🌈',
        reload: '↻'
    };
    return icons[id] || '🔍';
}

function highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span style="color:#007aff;font-weight:600">$1</span>');
}

/* --- 9. ABOUT THIS PORTFOLIO --- */
function openAboutPortfolio() {
    const win = document.getElementById('window-about');
    if (!win) return;
    openWindow('window-about');
    win.classList.remove('maximized');
    win.style.transform = 'scale(1)';
}

/* --- DARK MODE TOGGLE --- */
if (window.matchMedia) {
    const darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)');
    const updateDarkModeIcons = () => {
        const icons = document.querySelectorAll('.dock-item img');
        icons.forEach(img => {
            const alt = img.getAttribute('alt');
        });
    };
    darkModeMedia.addEventListener('change', updateDarkModeIcons);
}