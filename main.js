// DOM Elements
const html = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

// Modals
const modalOverlay = document.getElementById('modal-overlay');
const registrationModal = document.getElementById('registration-modal');
const loginModal = document.getElementById('login-modal');
const regForm = document.getElementById('registration-form');
const loginForm = document.getElementById('login-form');

// Chat & Inputs
const chatContainer = document.getElementById('chat-container');
const greetingScreen = document.getElementById('greeting-screen');
const messagesList = document.getElementById('messages-list');
const inputForm = document.getElementById('input-form');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const suggestionChips = document.querySelectorAll('.chip');

// Approval Gate
const approvalGate = document.getElementById('approval-gate');
const btnApprove = document.getElementById('btn-approve');
const btnDeny = document.getElementById('btn-deny');
const btnAlways = document.getElementById('btn-always');

// Application State
let currentState = 'LOCKED'; // LOCKED, STAND_BY, PLANNING, AWAITING_APPROVAL, EXECUTING, AWAITING_COMPLETION
let isRegistered = localStorage.getItem('agenticos_registered') === 'true';

// Initialization
function init() {
  // Load Theme
  const savedTheme = localStorage.getItem('agenticos_theme') || 'system';
  html.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
  
  // Setup Input Listener
  userInput.addEventListener('input', () => {
    sendBtn.disabled = userInput.value.trim().length === 0;
  });

  // Check Registration Flow
  if (!isRegistered) {
    registrationModal.classList.remove('hidden');
    loginModal.classList.add('hidden');
    updateStatus('LOCKED', 'LOCKED');
  } else {
    registrationModal.classList.add('hidden');
    loginModal.classList.remove('hidden');
    updateStatus('LOCKED', 'LOCKED');
  }
}

// Mock API Call (Simulating REST Endpoint)
function mockRestApiCall(endpoint, payload) {
  console.log(`[REST] POST ${endpoint}`, payload);
  return new Promise(resolve => setTimeout(() => resolve({ status: 200 }), Math.random() * 500 + 300));
}

// Mock WebSocket Event Stream
function triggerMockWebSocketEvent(eventType, delay, callback) {
  console.log(`[WS] Awaiting event stream: ${eventType}`);
  setTimeout(() => {
    callback({ type: eventType, timestamp: Date.now() });
  }, delay);
}

// Theme Toggle
function updateThemeIcon(theme) {
  // Simple icon update to reflect the mode
  let label = 'Theme: System';
  if (theme === 'dark') label = 'Theme: Dark';
  if (theme === 'light') label = 'Theme: Light';
  themeToggle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> <span>${label}</span>`;
}

themeToggle.addEventListener('click', () => {
  const currentTheme = html.getAttribute('data-theme');
  let newTheme = 'system';
  if (currentTheme === 'system') newTheme = 'dark';
  else if (currentTheme === 'dark') newTheme = 'light';
  
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('agenticos_theme', newTheme);
  updateThemeIcon(newTheme);
});

// Registration Logic
regForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pwd = document.getElementById('reg-password').value;
  const email = document.getElementById('reg-email').value;
  
  await mockRestApiCall('/api/v1/register', { email, pwdLength: pwd.length });
  
  localStorage.setItem('agenticos_registered', 'true');
  isRegistered = true;
  registrationModal.classList.add('hidden');
  loginModal.classList.remove('hidden');
});

// Login Logic
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  await mockRestApiCall('/api/v1/login', { timestamp: Date.now() });
  
  modalOverlay.classList.add('hidden');
  updateStatus('STAND_BY', 'stand-by');
  // Auto-focus input when entering chat
  setTimeout(() => userInput.focus(), 500);
});

// Suggestion Chips
suggestionChips.forEach(chip => {
  chip.addEventListener('click', () => {
    userInput.value = chip.textContent;
    sendBtn.disabled = false;
    inputForm.dispatchEvent(new Event('submit'));
  });
});

// Status Updater
function updateStatus(text, dotClass) {
  currentState = text;
  statusText.textContent = text;
  statusDot.className = `status-dot ${dotClass}`;
}

// Chat UI helpers
function addMessage(text, sender) {
  if (greetingScreen && !greetingScreen.classList.contains('hidden')) {
    greetingScreen.classList.add('hidden');
  }
  
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${sender}`;
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.innerHTML = sender === 'user' ? 'U' : '✧';
  
  const content = document.createElement('div');
  content.className = 'message-content';
  content.innerHTML = text;
  
  msgDiv.appendChild(avatar);
  msgDiv.appendChild(content);
  messagesList.appendChild(msgDiv);
  
  // Scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Agentic Iteration Loop
inputForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (currentState !== 'STAND_BY') return;
  
  const text = userInput.value.trim();
  if (!text) return;
  
  // 1. User sends message
  addMessage(text, 'user');
  userInput.value = '';
  sendBtn.disabled = true;
  
  // 2. Send command to daemon
  await mockRestApiCall('/api/v1/execute', { command: text });
  
  // 3. Planning State
  updateStatus('PLANNING', 'planning');
  
  // Await planning completion via WebSocket
  triggerMockWebSocketEvent('PLAN_READY', 1500, () => {
    updateStatus('AWAITING_APPROVAL', 'planning');
    approvalGate.classList.remove('hidden');
  });
});

// Gate Actions
function closeGate() {
  approvalGate.classList.add('hidden');
}

btnDeny.addEventListener('click', async () => {
  closeGate();
  await mockRestApiCall('/api/v1/authorize', { action: 'DENY' });
  addMessage("<i>Task execution was denied by administrator. Returning to STAND_BY.</i>", "agent");
  updateStatus('STAND_BY', 'stand-by');
});

btnApprove.addEventListener('click', () => {
  closeGate();
  startExecution('APPROVE');
});

btnAlways.addEventListener('click', () => {
  closeGate();
  startExecution('ALWAYS_APPROVE');
});

async function startExecution(authorizationPolicy) {
  await mockRestApiCall('/api/v1/authorize', { action: authorizationPolicy });
  
  // 4. Executing State
  updateStatus('EXECUTING', 'executing');
  
  triggerMockWebSocketEvent('EXECUTION_START', 1000, () => {
    addMessage("Executing native OS tasks based on approved plan...", "agent");
    
    // 5. Validator / Awaiting Completion
    triggerMockWebSocketEvent('EXECUTION_VALIDATE', 2500, () => {
      updateStatus('AWAITING_COMPLETION', 'planning');
      
      // Inject completion dialogue
      addMessage(`
        <div>Task Finished?</div>
        <div style="margin-top:10px; display:flex; gap:10px;">
          <button id="btn-yes" class="chip" style="padding: 6px 14px; background: transparent; color: var(--status-standby); border-color: var(--status-standby);">Yes</button>
          <button id="btn-no" class="chip" style="padding: 6px 14px; background: transparent; color: var(--status-executing); border-color: var(--status-executing);">No</button>
        </div>
      `, "agent");
      
      // Bind temp buttons
      document.getElementById('btn-yes').addEventListener('click', async () => {
        await mockRestApiCall('/api/v1/complete', { success: true });
        updateStatus('STAND_BY', 'stand-by');
        addMessage("<i>Task marked as successfully completed.</i>", "agent");
        document.getElementById('btn-yes').parentElement.remove();
      });
      
      document.getElementById('btn-no').addEventListener('click', async () => {
        await mockRestApiCall('/api/v1/complete', { success: false });
        updateStatus('STAND_BY', 'stand-by');
        addMessage("I apologize. Could you please provide clearer clarifying parameters so I can resolve the missing steps?", "agent");
        document.getElementById('btn-no').parentElement.remove();
      });
      
    });
  });
}

// Bootstrap
init();
