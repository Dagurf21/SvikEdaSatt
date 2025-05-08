// assets/js/game.js

// Dynamic email pool
let emailPool = [];

// Configuration: number of phishing vs genuine per round
const NUM_PHISHING = 4;
const NUM_GENUINE = 6;

// Avatar color palette
const COLORS = ['#e74c3c','#3498db','#2ecc71','#e67e22','#9b59b6','#1abc9c','#f1c40f','#d35400'];

let inbox = [];
let trash = [];
let currentView = 'inbox';
let currentEmail = null;
let round = 1;
const totalRounds = 50;
let score = 0;
let timerId;
let timeLeft = 60;

// Load emails JSON
function loadEmailPool() {
  return fetch('assets/js/emails.json')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      emailPool = data;
    });
}

// Initialize game
function initGame() {
  inbox = selectRoundEmails();
  trash = [];
  currentView = 'inbox';
  currentEmail = null;
  score = 0;
  timeLeft = 60;
  updateHeader();
  renderList();
  renderDetail(null);
  startTimer();
}

// Pick phishing + genuine
function selectRoundEmails() {
  const phishingPool = emailPool.filter(e => e.phishing);
  const genuinePool = emailPool.filter(e => !e.phishing);
  const selected = [];
  selected.push(...shuffle(phishingPool).slice(0, NUM_PHISHING));
  selected.push(...shuffle(genuinePool).slice(0, NUM_GENUINE));
  return shuffle(selected);
}

// Header stats
function updateHeader() {
  document.querySelector('.challenge').innerText = `ÁSKORUN ${round}/${totalRounds}`;
  document.querySelector('.score').innerText = score;
  document.querySelector('.timer').innerText = timeLeft;
}

// Timer
function startTimer() {
  clearInterval(timerId);
  timerId = setInterval(() => {
    timeLeft--;
    document.querySelector('.timer').innerText = timeLeft;
    if (timeLeft <= 0) clearInterval(timerId);
  }, 1000);
}

// Switch tabs
function switchTab(tab) {
  if (currentView === tab) return;
  currentView = tab;
  document.querySelectorAll('#tabs .tab').forEach(el =>
    el.classList.toggle('active', el.dataset.tab === tab)
  );
  renderList();
  renderDetail(null);
}


function renderList() {
  const listEl = document.getElementById('email-list');
  listEl.innerHTML = '';
  const arr = currentView === 'inbox' ? inbox : trash;

  arr.forEach(email => {
    const item = document.createElement('div');
    item.className = 'email-item';
    item.onclick = () => renderDetail(email);

    // 1) Grab domain letter
    const domain = (email.sender.split('@')[1] || '').trim();
    const letter = domain.charAt(0) || '';
    // 2) Random color
    //const letter = domain.charAt(0).toUpperCase();
    const idx    = letter.charCodeAt(0) % COLORS.length;
    const bg     = COLORS[idx];


    // 3) Build avatar div
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = letter;
    avatar.style.background = bg;

    // 4) Build meta block
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `
      <div class="sender">${email.sender}</div>
      <div class="subject">${email.subject}</div>
    `;

    item.appendChild(avatar);
    item.appendChild(meta);
    listEl.appendChild(item);
  });

  // Update counts
  document.getElementById('tab-inbox-count').innerText = inbox.length;
  document.getElementById('tab-trash-count').innerText = trash.length;
}

// Render detail
function renderDetail(email) {
  const det = document.getElementById('email-detail');
  if (!email) {
    det.innerHTML = '<p>Veldu tölvupóst til að skoða innihald.</p>';
    return;
  }
  currentEmail = email;
  let html = `<h2>Subject: ${email.subject}</h2>`;
  html += `<p><strong>From:</strong> ${email.sender}</p>`;
  html += `<p>${email.body}</p>`;
  html += `<button onclick="trashEmail(${email.id})">Trash</button>`;
  det.innerHTML = html;
}

// Trash email
function trashEmail(id) {
  // Remove clicked email from inbox
  const idx = inbox.findIndex(e => e.id === id);
  if (idx < 0) return;
  const [email] = inbox.splice(idx, 1);
  trash.push(email);

  // Update score and UI
  score += email.phishing ? 10 : -5;
  updateHeader();
  renderList();
  renderDetail(null);

  // Only win when you’ve trashed the required number of phishing emails
  const phishingMoved = trash.filter(e => e.phishing).length;
  if (phishingMoved === NUM_PHISHING) {
    showWin();
  }
}


// Utility: shuffle
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

// Kick off
document.addEventListener('DOMContentLoaded', () => {
  loadEmailPool()
    .then(() => {
      initGame();
      document.querySelectorAll('#tabs .tab').forEach(el =>
        el.addEventListener('click', () => switchTab(el.dataset.tab))
      );
    })
    .catch(err => console.error('Failed to load email pool:', err));
});

function showWin() {
  clearInterval(timerId);
  document.getElementById('final-score').textContent = score;
  document.getElementById('win-screen').style.display = 'flex';
}

document.getElementById('play-again').addEventListener('click', () => {
  document.getElementById('win-screen').style.display = 'none';
  round = 1;
  initGame();
});

// // Then, in trashEmail(), after updateHeader(), insert:
// if (inbox.length === 0) {
//   showWin();
// }