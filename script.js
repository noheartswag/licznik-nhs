// DOM Elements
const views = {
    list: document.getElementById('view-list'),
    detail: document.getElementById('view-detail')
};
const listContainer = document.getElementById('counters-list');
const fabAdd = document.getElementById('add-btn');
const backBtn = document.getElementById('back-btn');
const detailTitle = document.getElementById('detail-title');

// Detail Elements
const detailEls = {
    activeState: document.getElementById('active-state'),
    failedState: document.getElementById('failed-state'),
    successState: document.getElementById('success-state'),
    countdownDetails: document.getElementById('countdown-details'),
    yearsRow: document.getElementById('years-row'),
    years: document.getElementById('years-count'),
    days: document.getElementById('days-count'),
    hours: document.getElementById('hours-count'),
    minutes: document.getElementById('minutes-count'),
    seconds: document.getElementById('seconds-count'),
    startLabel: document.getElementById('start-date'),
    quote: document.getElementById('quote-text'),
    finalYearsRow: document.getElementById('final-years-row'),
    finalYears: document.getElementById('final-years'),
    finalDays: document.getElementById('final-days'),
    finalHours: document.getElementById('final-hours'),
    finalMinutes: document.getElementById('final-minutes'),
    restartBtn: document.getElementById('restart-btn'),
    undoBtn: document.getElementById('undo-fail-btn'),
    deleteFailBtn: document.getElementById('delete-fail-btn'),
    continueBtn: document.getElementById('continue-btn'),
    circleLabel: document.getElementById('circle-unit-label')
};

// Modals
const modals = {
    add: {
        el: document.getElementById('modal-add'),
        title: document.getElementById('modal-title'),
        nameInput: document.getElementById('counter-name-input'),
        confirm: document.getElementById('confirm-add'),
        cancel: document.getElementById('cancel-add'),
        typeOptions: document.querySelectorAll('.type-option'),
        targetSection: document.getElementById('target-date-section'),
        targetInput: document.getElementById('new-counter-target'),
        typeWrapper: document.getElementById('type-selector-wrapper'),
        tabs: document.querySelectorAll('.add-tab-btn'),
        tabContents: document.querySelectorAll('.add-tab-content'),
        durYearSelect: document.getElementById('target-years'),
        durDaySelect: document.getElementById('target-days'),
        durMinSelect: document.getElementById('target-mins'),
        activeTab: 'cal',
        selectedType: 'regular',
        mode: 'add' 
    },
    datePicker: {
        el: document.getElementById('modal-date-picker'),
        tabs: document.querySelectorAll('.tab-btn'),
        tabContents: document.querySelectorAll('.tab-content'),
        calendarInput: document.getElementById('manual-date-input'),
        yearSelect: document.getElementById('input-years'),
        daySelect: document.getElementById('input-days'),
        minSelect: document.getElementById('input-mins'),
        confirm: document.getElementById('confirm-date'),
        cancel: document.getElementById('cancel-date'),
        activeTab: 'calendar'
    },
    menu: {
        el: document.getElementById('menu-options'),
        btn: document.getElementById('more-btn'),
        close: document.getElementById('close-menu'),
        rename: document.getElementById('opt-rename'),
        date: document.getElementById('opt-date'),
        giveup: document.getElementById('opt-giveup'),
        delete: document.getElementById('opt-delete')
    }
};

const quotes = [
    "Każda podróż zaczyna się od pierwszego kroku.",
    "Trzeźwość to obecność wolności.",
    "Jutro będziesz wdzięczny sobie za dzisiejszą siłę.",
    "Nie licz dni, spraw by dni się liczyły.",
    "Małe kroki prowadzą do wielkich zmian.",
    "Każdy dzień to nowa szansa.",
    "Siła pojawia się wtedy, gdy myślisz, że już jej nie masz.",
    "Twoja przyszłość zależy od tego, co zrobisz dzisiaj.",
    "Jeden dzień na raz.",
    "Bądź dumny z tego, jak daleko zaszedłeś."
];

// State
let counters = [];
let currentCounterId = null;
let updateInterval = null;

// --- Helper: Setup Selects ---
function setupSelects() {
    const selects = [
        { el: modals.add.durYearSelect, max: 10, label: 'lat' },
        { el: modals.add.durDaySelect, max: 365, label: 'dni' },
        { el: modals.add.durMinSelect, max: 60, label: 'min' },
        { el: modals.datePicker.yearSelect, max: 10, label: 'lat' },
        { el: modals.datePicker.daySelect, max: 365, label: 'dni' },
        { el: modals.datePicker.minSelect, max: 60, label: 'min' }
    ];

    selects.forEach(s => {
        if (!s.el) return;
        s.el.innerHTML = '';
        for (let i = 0; i <= s.max; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `${i} ${s.label}`;
            s.el.appendChild(opt);
        }
    });
}

// --- Persistence ---
function loadCounters() {
    const stored = localStorage.getItem('sobriety_counters');
    if (stored) {
        counters = JSON.parse(stored);
    }
    renderList();
    setInterval(checkCountdowns, 60000); 
}

function saveCounters() {
    localStorage.setItem('sobriety_counters', JSON.stringify(counters));
}

// --- Navigation ---
function switchView(viewName) {
    Object.values(views).forEach(el => el.classList.remove('active'));
    views[viewName].classList.add('active');
    
    if (viewName === 'list') {
        stopTimer();
        currentCounterId = null;
        renderList();
        closeAllModals();
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('visible'));
}

// --- List Logic ---
function renderList() {
    listContainer.innerHTML = '';
    if (counters.length === 0) {
        listContainer.innerHTML = '<div style="text-align:center; color:#666; margin-top:50px; font-size:16px; font-weight:600;">Dodaj swój pierwszy licznik przyciskiem +</div>';
        return;
    }

    counters.forEach(counter => {
        const isActive = counter.status !== 'failed';
        const isCountdown = counter.type === 'countdown';
        
        let diff, labelText;
        if (isCountdown) {
             diff = counter.targetDate - Date.now();
             labelText = diff <= 0 ? 'OSIĄGNIĘTO' : 'POZOSTAŁO';
        } else {
             const end = isActive ? Date.now() : counter.endDate;
             diff = end - counter.startDate;
             labelText = 'DNI';
        }

        const days = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24));
        
        const el = document.createElement('div');
        el.className = 'counter-card';
        if (!isActive && !isCountdown) el.style.opacity = '0.7'; 
        
        const icon = isCountdown ? 'fa-arrow-down' : 'fa-arrow-up';
        
        el.innerHTML = `
            <div class="card-info">
                <h3><i class="fas ${icon}" style="font-size:14px; margin-right:8px; color: var(--accent);"></i>${counter.name}</h3>
                <p>${isCountdown ? 'Cel:' : (isActive ? 'Od:' : 'Koniec:')} ${new Date(isCountdown ? counter.targetDate : (isActive ? counter.startDate : counter.endDate)).toLocaleDateString()}</p>
            </div>
            <div class="card-days">
                <span class="num">${diff <= 0 && isCountdown ? '<i class="fas fa-check"></i>' : days}</span>
                <span class="unit">${labelText}</span>
            </div>
        `;
        el.onclick = () => openDetail(counter.id);
        listContainer.appendChild(el);
    });
}

// --- Detail Logic ---
function openDetail(id) {
    const counter = counters.find(c => c.id === id);
    if (!counter) return;

    currentCounterId = id;
    detailTitle.textContent = counter.name;
    detailEls.quote.textContent = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;

    if (counter.type === 'countdown') {
        detailEls.circleLabel.textContent = 'POZOSTAŁO';
        detailEls.yearsRow.classList.add('hidden');
    } else {
        detailEls.circleLabel.textContent = 'DNI';
    }

    updateDetailView(counter);
    startTimer(); 
    switchView('detail');
}

function updateDetailView(counter) {
    // FORCE HIDE ALL FIRST
    detailEls.activeState.classList.add('hidden');
    detailEls.failedState.classList.add('hidden');
    detailEls.successState.classList.add('hidden');
    document.querySelector('.controls-bottom').classList.remove('hidden');

    if (counter.status === 'failed') {
        detailEls.failedState.classList.remove('hidden');
        document.querySelector('.controls-bottom').classList.add('hidden');
        
        const diff = Math.abs(counter.endDate - counter.startDate);
        const { y, d, h, m } = calculateFullTime(diff);
        
        if (y > 0) {
            detailEls.finalYearsRow.classList.remove('hidden');
            detailEls.finalYears.textContent = y;
        } else {
            detailEls.finalYearsRow.classList.add('hidden');
        }
        
        detailEls.finalDays.textContent = d;
        detailEls.finalHours.textContent = h;
        detailEls.finalMinutes.textContent = m;
        detailEls.startLabel.textContent = `Wynik: ${new Date(counter.startDate).toLocaleDateString()} - ${new Date(counter.endDate).toLocaleDateString()}`;
    } else {
        if (counter.type === 'countdown') {
             detailEls.startLabel.textContent = 'Data celu: ' + new Date(counter.targetDate).toLocaleString();
             modals.menu.giveup.classList.add('hidden');
             
             if (counter.targetDate - Date.now() <= 0) {
                 detailEls.successState.classList.remove('hidden');
             } else {
                 detailEls.activeState.classList.remove('hidden');
             }
        } else {
             detailEls.activeState.classList.remove('hidden');
             detailEls.startLabel.textContent = 'Trwa od: ' + new Date(counter.startDate).toLocaleString();
             modals.menu.giveup.classList.remove('hidden');
        }
    }
}

function calculateFullTime(diffMs) {
    const totalSec = Math.floor(Math.abs(diffMs) / 1000);
    const y = Math.floor(totalSec / (365 * 24 * 3600));
    const d = Math.floor((totalSec % (365 * 24 * 3600)) / (24 * 3600));
    const h = Math.floor((totalSec % (24 * 3600)) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return { y, d, h, m, s };
}

function startTimer() {
    updateDisplay();
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(updateDisplay, 1000);
}

function stopTimer() {
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = null;
}

function updateDisplay() {
    if (!currentCounterId) return;
    const counter = counters.find(c => c.id === currentCounterId);
    if (!counter || counter.status === 'failed') return; 

    const now = Date.now();
    let diff = counter.type === 'countdown' ? counter.targetDate - now : now - counter.startDate;
    
    if (counter.type === 'countdown' && diff <= 0) {
        if (detailEls.successState.classList.contains('hidden')) {
            updateDetailView(counter);
        }
        return;
    }

    const { y, d, h, m, s } = calculateFullTime(diff);

    if (y > 0 && counter.type !== 'countdown') {
        detailEls.yearsRow.classList.remove('hidden');
        detailEls.years.textContent = y;
    } else {
        detailEls.yearsRow.classList.add('hidden');
    }

    detailEls.days.textContent = d;
    detailEls.days.style.fontSize = d > 999 ? "40px" : "64px";
    detailEls.hours.textContent = h.toString().padStart(2, '0');
    detailEls.minutes.textContent = m.toString().padStart(2, '0');
    detailEls.seconds.textContent = s.toString().padStart(2, '0');
}

// --- Menu & Modals Logic ---
function openMenu() { modals.menu.el.classList.add('visible'); }
function closeMenu() { modals.menu.el.classList.remove('visible'); }

modals.menu.btn.onclick = openMenu;
modals.menu.close.onclick = closeMenu;
modals.menu.el.onclick = (e) => { if (e.target === modals.menu.el) closeMenu(); };

modals.menu.rename.onclick = () => {
    const counter = counters.find(c => c.id === currentCounterId);
    modals.add.title.textContent = "Zmień nazwę";
    modals.add.nameInput.value = counter.name;
    modals.add.typeWrapper.classList.add('hidden');
    modals.add.targetSection.classList.add('hidden');
    modals.add.mode = 'edit';
    modals.add.el.classList.add('visible');
    closeMenu();
};

modals.menu.date.onclick = () => {
    modals.datePicker.el.classList.add('visible');
    closeMenu();
};

modals.datePicker.tabs.forEach(tab => {
    tab.onclick = () => {
        modals.datePicker.tabs.forEach(t => t.classList.remove('active'));
        modals.datePicker.tabContents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        modals.datePicker.activeTab = tab.dataset.tab;
    };
});

modals.datePicker.confirm.onclick = () => {
    let newTime;
    if (modals.datePicker.activeTab === 'calendar') {
        const val = modals.datePicker.calendarInput.value;
        if (!val) return;
        newTime = new Date(val).getTime();
    } else {
        const y = parseInt(modals.datePicker.yearSelect.value) || 0;
        const d = parseInt(modals.datePicker.daySelect.value) || 0;
        const m = parseInt(modals.datePicker.minSelect.value) || 0;
        const counter = counters.find(c => c.id === currentCounterId);
        const ms = (y * 365 * 24 * 3600 * 1000) + (d * 24 * 3600 * 1000) + (m * 60 * 1000);
        newTime = (counter.type === 'countdown') ? Date.now() + ms : Date.now() - ms;
    }

    const counter = counters.find(c => c.id === currentCounterId);
    updateCounter(currentCounterId, { 
        [counter.type === 'countdown' ? 'targetDate' : 'startDate']: newTime,
        notified: false 
    });
    updateDetailView(counters.find(c => c.id === currentCounterId));
    closeAllModals();
};

modals.datePicker.cancel.onclick = closeAllModals;

modals.add.tabs.forEach(tab => {
    tab.onclick = () => {
        modals.add.tabs.forEach(t => t.classList.remove('active'));
        modals.add.tabContents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`add-tab-${tab.dataset.tab}`).classList.add('active');
        modals.add.activeTab = tab.dataset.tab;
    };
});

modals.menu.giveup.onclick = () => {
    if (confirm("Zapewne? Postęp zostanie zatrzymany.")) {
        updateCounter(currentCounterId, { status: 'failed', endDate: Date.now() });
        closeMenu();
        updateDetailView(counters.find(c => c.id === currentCounterId)); 
    }
};

modals.menu.delete.onclick = () => {
    if (confirm("Usunąć licznik na zawsze?")) {
        counters = counters.filter(c => c.id !== currentCounterId);
        saveCounters();
        switchView('list');
    }
};

detailEls.restartBtn.onclick = () => {
    if (confirm("Zacząć od nowa?")) {
        updateCounter(currentCounterId, { status: 'active', startDate: Date.now(), endDate: null });
        updateDetailView(counters.find(c => c.id === currentCounterId));
    }
};

detailEls.undoBtn.onclick = () => {
    updateCounter(currentCounterId, { status: 'active', endDate: null });
    updateDetailView(counters.find(c => c.id === currentCounterId));
};

detailEls.deleteFailBtn.onclick = () => {
    if (confirm("Usunąć licznik?")) {
        counters = counters.filter(c => c.id !== currentCounterId);
        saveCounters();
        switchView('list');
    }
};

detailEls.continueBtn.onclick = () => {
    modals.datePicker.el.classList.add('visible');
};

function updateCounter(id, updates) {
    const idx = counters.findIndex(c => c.id === id);
    if (idx !== -1) {
        counters[idx] = { ...counters[idx], ...updates };
        saveCounters();
        updateDisplay();
    }
}

// --- Adding New Counter ---
fabAdd.onclick = () => {
    modals.add.title.textContent = "Nowy Licznik";
    modals.add.nameInput.value = '';
    modals.add.typeWrapper.classList.remove('hidden');
    modals.add.targetSection.classList.add('hidden');
    modals.add.mode = 'add';
    modals.add.el.classList.add('visible');
    modals.add.activeTab = 'cal';
    modals.add.tabs.forEach((t, i) => t.classList.toggle('active', i === 0));
    modals.add.tabContents.forEach((c, i) => c.classList.toggle('active', i === 0));
};

modals.add.typeOptions.forEach(el => {
    el.onclick = () => {
        modals.add.typeOptions.forEach(o => o.classList.remove('active'));
        el.classList.add('active');
        modals.add.selectedType = el.dataset.type;
        modals.add.targetSection.classList.toggle('hidden', modals.add.selectedType !== 'countdown');
    };
});

modals.add.cancel.onclick = closeAllModals;

modals.add.confirm.onclick = () => {
    const name = modals.add.nameInput.value.trim();
    if (!name) return;

    if (modals.add.mode === 'add') {
        const newCounter = {
            id: Date.now(),
            name: name,
            type: modals.add.selectedType,
            startDate: Date.now(),
            status: 'active'
        };
        
        if (modals.add.selectedType === 'countdown') {
            if (modals.add.activeTab === 'cal') {
                const tDate = modals.add.targetInput.value;
                newCounter.targetDate = tDate ? new Date(tDate).getTime() : Date.now() + (7 * 24 * 3600 * 1000);
            } else {
                const y = parseInt(modals.add.durYearSelect.value) || 0;
                const d = parseInt(modals.add.durDaySelect.value) || 0;
                const m = parseInt(modals.add.durMinSelect.value) || 0;
                newCounter.targetDate = Date.now() + (y * 365 * 24 * 3600 * 1000) + (d * 24 * 3600 * 1000) + (m * 60 * 1000);
            }
            newCounter.notified = false;
        }
        counters.push(newCounter);
    } else {
        updateCounter(currentCounterId, { name: name });
    }
    
    saveCounters();
    closeAllModals();
    if (modals.add.mode === 'edit') detailTitle.textContent = name;
    renderList();
};

backBtn.onclick = () => switchView('list');

function checkCountdowns() {
    counters.forEach(c => {
        if (c.type === 'countdown' && !c.notified) {
             if (c.targetDate - Date.now() <= 0) {
                 sendNotification("Cel Osiągnięty!", `Twój cel "${c.name}" został zrealizowany!`);
                 c.notified = true;
                 saveCounters();
                 renderList();
             }
        }
    });
}

// Init
setupSelects();
if ('Notification' in window) Notification.requestPermission();
loadCounters();
