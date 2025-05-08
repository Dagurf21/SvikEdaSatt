// assets/js/game.js

// Dynamic email pool
let emailPool = [];

// Configuration: number of phishing vs genuine per round
const NUM_PHISHING = 4;
const NUM_GENUINE = 6;

// Game state
let inbox = [];
let trash = [];
let currentView = 'inbox';
let currentEmail = null;
let round = 1;
const totalRounds = 50;
let score = 0;
let correctCount = 0;
let falseCount = 0;
let timerId;
let timeLeft = 60;

/**
 * Load the emails.json file
 */
function loadEmailPool() {
    return fetch('assets/js/emails.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);
            return response.json();
        })
        .then(data => { emailPool = data; });
}

/**
 * Initialize the game: select emails, reset state, start timer
 */
function initGame() {
    inbox = selectRoundEmails();
    trash = [];
    currentView = 'inbox';
    currentEmail = null;
    score = 0;
    correctCount = 0;
    falseCount = 0;
    timeLeft = 60;
    updateHeader();
    renderList();
    renderDetail(null);
    startTimer();
}

/**
 * Select NUM_PHISHING phishing and NUM_GENUINE genuine emails randomly
 */
function selectRoundEmails() {
    const phishingPool = emailPool.filter(e => e.phishing);
    const genuinePool = emailPool.filter(e => !e.phishing);
    const selected = [];
    selected.push(...shuffle(phishingPool).slice(0, NUM_PHISHING));
    selected.push(...shuffle(genuinePool).slice(0, NUM_GENUINE));
    return shuffle(selected);
}

/**
 * Update header stats: round, score, timer
 */
function updateHeader() {
    document.querySelector('.challenge').innerText = `ÁSKORUN ${round}/${totalRounds}`;
    document.querySelector('.score').innerText = score;
    document.querySelector('.timer').innerText = timeLeft;
}

/**
 * Start countdown timer
 */
function startTimer() {
    clearInterval(timerId);
    timerId = setInterval(() => {
        timeLeft--;
        document.querySelector('.timer').innerText = timeLeft;
        if (timeLeft <= 0) clearInterval(timerId);
    }, 1000);
}

/**
 * Switch between Inbox and Trash tabs
 */
function switchTab(tab) {
    if (currentView === tab) return;
    currentView = tab;
    document.querySelectorAll('#tabs div').forEach(el =>
        el.classList.toggle('active', el.dataset.tab === tab)
    );
    renderList();
    renderDetail(null);
}

/**
 * Render email list for current view
 */
function renderList() {
    const listEl = document.getElementById('email-list');
    listEl.innerHTML = '';
    const arr = currentView === 'inbox' ? inbox : trash;
    arr.forEach(email => {
        const item = document.createElement('div');
        item.className = 'email-item';
        item.onclick = () => renderDetail(email);
        const icon = document.createElement('img');
        icon.src = `assets/icons/${getIcon(email.sender)}`;
        item.appendChild(icon);
        item.insertAdjacentHTML('beforeend', `
      <div>
        <strong>${email.sender}</strong><br>
        <small>${email.subject}</small>
      </div>
    `);
        listEl.appendChild(item);
    });
    document.getElementById('tab-inbox-count').innerText = inbox.length;
    document.getElementById('tab-trash-count').innerText = trash.length;
}

/**
 * Render detail view for selected email
 */
function renderDetail(email) {
    const det = document.getElementById('email-detail');
    if (!email) {
        det.innerHTML = '<p>Select an email to view details.</p>';
        return;
    }
    currentEmail = email;
    let html = `<h2>Subject: ${email.subject}</h2>`;
    html += `<p><strong>From:</strong> ${email.sender}</p>`;
    html += `<p>${email.body}</p>`;
    if (currentView === 'inbox') {
        html += `<button onclick="trashEmail(${email.id})">Trash</button>`;
    } else {
        html += `<button onclick="restoreEmail(${email.id})">Restore</button>`;
    }
    det.innerHTML = html;
}

/**
 * Trash an email, update score and stats, check for win
 */
function trashEmail(id) {
    const idx = inbox.findIndex(e => e.id === id);
    if (idx < 0) return;
    const [email] = inbox.splice(idx, 1);
    trash.push(email);
    if (email.phishing) {
        score += 10;
        correctCount++;
    } else {
        score -= 5;
        falseCount++;
    }
    updateHeader();
    renderList();
    renderDetail(null);
    // Win when all phishing emails have been correctly identified
    if (correctCount >= NUM_PHISHING) {
        winGame();
    }
}

/**
 * Restore an email, reverse score and stats
 */
function restoreEmail(id) {
    const idx = trash.findIndex(e => e.id === id);
    if (idx < 0) return;
    const [email] = trash.splice(idx, 1);
    inbox.push(email);
    if (email.phishing) {
        score -= 10;
        correctCount--;
    } else {
        score += 5;
        falseCount--;
    }
    updateHeader();
    renderList();
    renderDetail(null);
}

/**
 * Show win screen with stats and retry button
 */
function winGame() {
    clearInterval(timerId);
    document.getElementById('play-area').innerHTML = `
    <div class="win-screen" style="text-align:center; padding:2rem;">
      <h2>Til hamingju!</h2>
      <p><strong>Stig:</strong> ${score}</p>
      <p><strong>Rétt merkt:</strong> ${correctCount}</p>
      <p><strong>Rangt merkt:</strong> ${falseCount}</p>
      <button onclick="initGame()" style="padding:0.75rem 1.5rem; margin-top:1rem;">Reyna aftur</button>
    </div>
  `;
}

/**
 * Determine icon filename based on sender
 */
function getIcon(sender) {
    const map = {
        amazon: 'amazon.png',
        apple: 'apple.png',
        banksecure: 'bank.png',
        'global-lotto': 'lotto.png',
        creativeworks: 'creativeworks.png',
        techtoday: 'techtoday.png',
        'invoices-payable': 'billing.png'
    };
    for (let key in map) if (sender.includes(key)) return map[key];
    return 'default.png';
}

/**
 * Shuffle an array
 */
function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
}

// On page load, load emails then start game
document.addEventListener('DOMContentLoaded', () => {
    loadEmailPool()
        .then(() => {
            initGame();
            document.querySelectorAll('#tabs div').forEach(el => el.addEventListener('click', () => switchTab(el.dataset.tab)));
        })
        .catch(err => console.error('Failed to load email pool:', err));
});