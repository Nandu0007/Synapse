// Knowledge Q&A — Client

const API_BASE = '';

// --- Auth State ---

let authToken = localStorage.getItem('qa_token');
let currentUser = null;
let currentPage = 'home';
let currentConversationId = null;

const ICONS = {
    arrowRight: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
    arrowLeft: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><polyline points="20 6 9 17 4 12"/></svg>',
    x: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>',
    eye: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>',
    upload: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>',
    message: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
    menu: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>',
    fileText: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
    fileImage: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
    fileCode: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/></svg>',
    fileGeneric: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>',
    user: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    logOut: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>',
    send: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
    plus: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    refresh: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>',
    bot: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>',
    activity: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
    checkCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    alertTriangle: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>',
    loader: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>'
};

function authHeaders() {
    return authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
}

async function authFetch(url, opts = {}) {
    const headers = { ...authHeaders(), ...(opts.headers || {}) };
    const res = await fetch(url, { ...opts, headers });
    if (res.status === 401) {
        logout();
        throw new Error('Session expired. Please log in again.');
    }
    return res;
}

// --- Auth Actions ---


async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const errorEl = document.getElementById('register-error');
    const btn = document.getElementById('register-btn');

    errorEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Creating account...';

    try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('qa_token', data.token);
        onAuthSuccess();
    } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Create Account';
    }
}

function onAuthSuccess() {
    document.getElementById('nav-user').style.display = '';
    const badge = document.getElementById('user-badge');
    badge.textContent = '';
    const iconSpan = document.createElement('span');
    iconSpan.innerHTML = ICONS.user;
    badge.appendChild(iconSpan);
    badge.appendChild(document.createTextNode(' ' + currentUser.username));
    document.getElementById('nav-links').style.display = '';
    navigate('home');
}

async function checkAuth() {
    // Check both storages, priority to localStorage if both exist (unlikely)
    authToken = localStorage.getItem('qa_token') || sessionStorage.getItem('qa_token');

    if (!authToken) {
        navigate('auth');
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { headers: authHeaders() });
        if (!res.ok) throw new Error();
        const data = await res.json();
        currentUser = data.user;
        onAuthSuccess();
    } catch {
        logout();
    }
}

function stopProcessing() {
    if (abortController) {
        abortController.abort();
        abortController = null;
        appendMessage('system', 'Stopped generation.');
        document.getElementById('ask-btn').disabled = false;
        document.getElementById('stop-btn').style.display = 'none';

        // Remove loading indicator if present
        const chatMessages = document.getElementById('chat-messages');
        const loading = chatMessages.querySelector('.chat-loading');
        if (loading) loading.remove();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('login-remember').checked;
    const errorEl = document.getElementById('login-error');

    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (!res.ok) {
            errorEl.textContent = data.error;
            errorEl.style.display = 'block';
            return;
        }

        authToken = data.token;
        currentUser = data.user;

        if (rememberMe) {
            localStorage.setItem('qa_token', authToken);
            sessionStorage.removeItem('qa_token'); // Clear session if switching
        } else {
            sessionStorage.setItem('qa_token', authToken);
            localStorage.removeItem('qa_token'); // Clear local if switching
        }

        document.getElementById('login-form').reset();
        errorEl.style.display = 'none';
        onAuthSuccess();
    } catch (err) {
        errorEl.textContent = 'Login failed. Please try again.';
        errorEl.style.display = 'block';
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    currentConversationId = null;
    localStorage.removeItem('qa_token');
    sessionStorage.removeItem('qa_token');
    document.getElementById('nav-user').style.display = 'none';
    document.getElementById('nav-links').style.display = 'none';
    document.getElementById('nav-links').classList.remove('open');
    navigate('auth');
}

function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
}

function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}

// --- Navigation ---

function navigate(page) {
    if (page !== 'auth' && !authToken) {
        page = 'auth';
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });
    document.querySelector('.nav-links')?.classList.remove('open');

    currentPage = page;

    if (page === 'documents') loadDocuments();
    if (page === 'status') checkHealth();
    if (page === 'home') loadHomeStats();
    if (page === 'ask') loadConversations();
}

function toggleMobileNav() {
    document.querySelector('.nav-links')?.classList.toggle('open');
}

// --- Home ---

async function loadHomeStats() {
    try {
        const res = await authFetch(`${API_BASE}/api/documents`);
        if (!res.ok) return;
        const docs = await res.json();

        const totalChunks = docs.reduce((sum, d) => sum + (d.chunk_count || 0), 0);
        const container = document.getElementById('home-stats');
        container.innerHTML = `
      <div class="stat-item">
        <div class="stat-value">${docs.length}</div>
        <div class="stat-label">Documents</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${totalChunks}</div>
        <div class="stat-label">Knowledge Chunks</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${formatFileSize(docs.reduce((sum, d) => sum + (d.size || 0), 0))}</div>
        <div class="stat-label">Total Size</div>
      </div>
    `;
    } catch {
        // stats are optional
    }
}

// --- Documents ---

async function loadDocuments() {
    const listEl = document.getElementById('doc-list');
    const countEl = document.getElementById('doc-count');

    try {
        const res = await authFetch(`${API_BASE}/api/documents`);
        if (!res.ok) throw new Error('Failed to load documents');
        const docs = await res.json();

        countEl.textContent = `${docs.length} document${docs.length !== 1 ? 's' : ''}`;

        if (docs.length === 0) {
            listEl.innerHTML = '';
            listEl.appendChild(createEmptyState());
            return;
        }

        listEl.innerHTML = docs.map((doc, i) => `
      <div class="doc-item stagger-item" data-id="${doc.id}" style="--i: ${i}">
        <div class="doc-info">
          <span class="doc-icon">${getFileIcon(doc.name)}</span>
          <div class="doc-details">
            <div class="doc-name" title="${escapeHtml(doc.name)}">${escapeHtml(doc.name)}</div>
            <div class="doc-meta">
              <span>${formatFileSize(doc.size)}</span>
              <span>${doc.chunk_count} chunks</span>
              <span>${formatDate(doc.created_at)}</span>
            </div>
          </div>
        </div>
        <div class="doc-actions">
          <button class="btn btn-sm btn-secondary btn-view btn-glow" data-id="${doc.id}" title="View content">${ICONS.eye} View</button>
          <button class="btn btn-sm btn-danger btn-delete btn-glow" data-id="${doc.id}" data-name="${escapeHtml(doc.name)}" title="Delete">${ICONS.trash}</button>
        </div>
      </div>
    `).join('');

        listEl.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', () => viewDocument(Number(btn.dataset.id)));
        });
        listEl.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteDocument(Number(btn.dataset.id), btn.dataset.name));
        });
    } catch (err) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'empty-state';
        const errorIcon = document.createElement('div');
        errorIcon.className = 'empty-icon';
        errorIcon.textContent = '⚠️';
        const errorTitle = document.createElement('h3');
        errorTitle.textContent = 'Error loading documents';
        const errorMsg = document.createElement('p');
        errorMsg.textContent = err.message;
        errorDiv.appendChild(errorIcon);
        errorDiv.appendChild(errorTitle);
        errorDiv.appendChild(errorMsg);
        listEl.innerHTML = '';
        listEl.appendChild(errorDiv);
    }
}

function createEmptyState() {
    const div = document.createElement('div');
    div.className = 'empty-state';
    div.innerHTML = `
    <div class="empty-icon">${ICONS.upload}</div>
    <h3>No documents yet</h3>
    <p>Upload your first document to get started</p>
  `;
    return div;
}

function initUpload() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('drag-over');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) uploadFile(files[0]);
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            uploadFile(fileInput.files[0]);
            fileInput.value = '';
        }
    });
}

async function uploadFile(file) {
    const progressEl = document.getElementById('upload-progress');
    const fillEl = document.getElementById('progress-fill');
    const statusEl = document.getElementById('upload-status');
    const dropzone = document.getElementById('dropzone');

    dropzone.style.display = 'none';
    progressEl.style.display = 'block';
    fillEl.style.width = '20%';
    statusEl.textContent = `Uploading "${file.name}"...`;

    const formData = new FormData();
    formData.append('file', file);

    try {
        fillEl.style.width = '50%';
        const ext = file.name.split('.').pop()?.toLowerCase();
        const isPdf = ext === 'pdf';
        const isImg = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff', 'tif'].includes(ext);
        statusEl.textContent = isPdf ? 'Extracting text from PDF...' : isImg ? 'Extracting text from image via AI...' : 'Processing and generating embeddings...';

        const res = await authFetch(`${API_BASE}/api/documents`, {
            method: 'POST',
            body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');

        fillEl.style.width = '100%';
        statusEl.textContent = `✅ "${file.name}" uploaded successfully (${data.chunks} chunks created)`;

        if (data.warning) {
            showToast(data.warning, 'warning');
        } else {
            showToast(`Document "${file.name}" uploaded successfully!`, 'success');
        }

        setTimeout(() => {
            progressEl.style.display = 'none';
            dropzone.style.display = '';
            fillEl.style.width = '0%';
            loadDocuments();
        }, 2000);
    } catch (err) {
        fillEl.style.width = '0%';
        statusEl.textContent = `❌ Error: ${err.message}`;
        showToast(err.message, 'error');

        setTimeout(() => {
            progressEl.style.display = 'none';
            dropzone.style.display = '';
        }, 3000);
    }
}

// --- Modal Confirmation ---
function showConfirm(title, message, icon = '⚠️') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const titleEl = modal.querySelector('.modal-title');
        const msgEl = modal.querySelector('.modal-message');
        const iconEl = modal.querySelector('.modal-icon');
        const cancelBtn = document.getElementById('confirm-cancel');
        const okBtn = document.getElementById('confirm-ok');

        titleEl.textContent = title;
        msgEl.textContent = message;
        iconEl.textContent = icon;

        modal.classList.remove('hidden');

        const close = (result) => {
            modal.classList.add('hidden');
            resolve(result);
            // cleanup
            cancelBtn.onclick = null;
            okBtn.onclick = null;
        };

        cancelBtn.onclick = () => close(false);
        okBtn.onclick = () => close(true);
    });
}

async function deleteDocument(id, name) {
    const confirmed = await showConfirm(
        'Delete Document',
        `Are you sure you want to delete "${name}"? This action cannot be undone.`,
        '🗑️'
    );

    if (!confirmed) return;

    try {
        const res = await authFetch(`${API_BASE}/api/documents/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Delete failed');

        showToast(`"${name}" deleted successfully.`, 'success');
        loadDocuments();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function viewDocument(id) {
    try {
        const res = await authFetch(`${API_BASE}/api/documents/${id}`);
        if (!res.ok) throw new Error('Failed to load document');
        const doc = await res.json();

        const overlay = document.createElement('div');
        overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 300; background: rgba(0,0,0,0.8);
      display: flex; align-items: center; justify-content: center; padding: 24px;
      backdrop-filter: blur(8px);
    `;
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        const modal = document.createElement('div');
        modal.className = 'doc-modal';
        modal.innerHTML = `
      <div class="doc-modal-header">
        <h3 style="font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">${getFileIcon(doc.name)} ${escapeHtml(doc.name)}</h3>
        <button class="btn btn-sm btn-secondary" onclick="this.closest('.doc-modal').parentElement.remove()">${ICONS.x} Close</button>
      </div>
      
      <div class="doc-modal-tabs">
        <button class="doc-tab active" onclick="switchDocTab(this, 'tab-original')">Original File</button>
        <button class="doc-tab" onclick="switchDocTab(this, 'tab-extracted')">Extracted Text</button>
      </div>

      <div class="doc-modal-content">
        <div id="tab-original" class="doc-tab-pane active">
           ${getOriginalFileViewer(doc)}
        </div>
        <div id="tab-extracted" class="doc-tab-pane">
           <pre class="extracted-text">${escapeHtml(doc.content)}</pre>
        </div>
      </div>
    `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function switchDocTab(btn, tabId) {
    const modal = btn.closest('.doc-modal');
    // tabs
    modal.querySelectorAll('.doc-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    // panes
    modal.querySelectorAll('.doc-tab-pane').forEach(p => p.classList.remove('active'));
    modal.querySelector(`#${tabId}`).classList.add('active');
}

function getOriginalFileViewer(doc) {
    const fileUrl = `${API_BASE}/api/documents/${doc.id}/file?token=${authToken}`;
    const ext = doc.name.split('.').pop()?.toLowerCase();

    if (ext === 'pdf') {
        return `<iframe src="${fileUrl}" class="doc-preview-frame"></iframe>`;
    } else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
        return `<div class="doc-preview-image"><img src="${fileUrl}" alt="${escapeHtml(doc.name)}"></div>`;
    } else {
        // Fallback for code/text files, iframe usually handles them well too for preview
        return `<iframe src="${fileUrl}" class="doc-preview-frame"></iframe>`;
    }
}

// --- Conversations ---

async function loadConversations() {
    const listEl = document.getElementById('conv-list');
    try {
        const res = await authFetch(`${API_BASE}/api/conversations`);
        if (!res.ok) throw new Error('Failed to load');
        const convos = await res.json();

        if (convos.length === 0) {
            listEl.innerHTML = '<div class="conv-empty">No conversations yet. Ask a question to start!</div>';
            return;
        }

        listEl.innerHTML = convos.map((c, i) => `
      <div class="conv-item stagger-item ${c.id === currentConversationId ? 'active' : ''}" data-id="${c.id}" style="--i: ${i}">
        <div class="conv-item-info" onclick="openConversation(${c.id})">
          <div class="conv-item-title">${escapeHtml(c.title)}</div>
          <div class="conv-item-meta">${c.message_count} messages · ${formatDate(c.updated_at)}</div>
        </div>
        <button class="conv-delete-btn" onclick="deleteConversation(${c.id}, event)" title="Delete">${ICONS.trash}</button>
      </div>
    `).join('');
    } catch {
        listEl.innerHTML = '<div class="conv-empty">Failed to load conversations</div>';
    }
}

function startNewConversation() {
    currentConversationId = null;
    document.getElementById('chat-title').innerHTML = `New Conversation`;
    // deselect all
    document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('active'));
    document.getElementById('question-input').focus();
}

async function openConversation(id) {
    try {
        const res = await authFetch(`${API_BASE}/api/conversations/${id}`);
        if (!res.ok) throw new Error('Failed to load');
        const convo = await res.json();

        currentConversationId = convo.id;
        document.getElementById('chat-title').innerHTML = `
            ${escapeHtml(convo.title)}
            <button class="btn btn-sm btn-danger btn-icon" onclick="deleteConversation(${convo.id}, event)" style="margin-left: 10px; padding: 4px 8px;" title="Delete Conversation">
                ${ICONS.trash}
            </button>
        `;

        // render messages
        const messagesEl = document.getElementById('chat-messages');
        if (convo.messages.length === 0) {
            messagesEl.innerHTML = `
        <div class="chat-welcome">
          <div class="chat-welcome-icon">${ICONS.message}</div>
          <h3>Empty Conversation</h3>
          <p>Ask a question to get started</p>
        </div>`;
        } else {
            messagesEl.innerHTML = convo.messages.map((m, i) => renderMessage(m, i)).join('');
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        // highlight active
        document.querySelectorAll('.conv-item').forEach(el => {
            el.classList.toggle('active', Number(el.dataset.id) === id);
        });
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteConversation(id, event) {
    event.stopPropagation();
    const confirmed = await showConfirm(
        'Delete Conversation',
        'Are you sure you want to delete this conversation? This cannot be undone.',
        '💬'
    );

    if (!confirmed) return;

    try {
        const res = await authFetch(`${API_BASE}/api/conversations/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');

        if (currentConversationId === id) startNewConversation();
        loadConversations();
        showToast('Conversation deleted.', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderMessage(msg, index = 0) {
    const style = `style="--i: ${index}; animation-delay: calc(var(--i) * 0.05s); animation-fill-mode: backwards;"`;

    if (msg.role === 'user') {
        return `
      <div class="chat-msg chat-msg-user" ${style}>
        <div class="chat-msg-bubble">${escapeHtml(msg.content)}</div>
      </div>`;
    }

    // Check if this is a new message to animate (not historical)
    const isNew = msg.isNew || false;
    const contentHtml = isNew ? '' : formatAnswer(msg.content);
    const cursorClass = isNew ? 'typing-cursor' : '';

    let sourcesHtml = '';
    if (msg.sources && msg.sources.length > 0) {
        // Only show sources after typing if new, or immediately if old
        const sourceStyle = isNew ? 'style="display:none"' : '';
        sourcesHtml = `
      <div class="chat-sources" id="sources-${msg.id}" ${sourceStyle}>
        <details>
          <summary>${ICONS.check} ${msg.sources.length} source${msg.sources.length > 1 ? 's' : ''}</summary>
          <div class="chat-sources-list">
            ${msg.sources.map(s => `
              <div class="chat-source-item">
                <span class="source-icon">${getFileIcon(s.documentName)}</span>
                <div class="source-info">
                  <strong>${escapeHtml(s.documentName)}</strong> — Chunk ${s.chunkIndex + 1}
                  <span class="chat-source-score">${Math.round(s.relevanceScore * 100)}%</span>
                  <p>${escapeHtml(s.text.slice(0, 200))}${s.text.length > 200 ? '...' : ''}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </details>
      </div>`;
    }

    return `
    <div class="chat-msg chat-msg-assistant" ${style}>
      <div class="chat-msg-bubble ${cursorClass}" id="msg-${msg.id}">${contentHtml}</div>
      ${sourcesHtml}
    </div>`;
}

function formatAnswer(text) {
    // basic markdown-ish rendering
    return escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

async function typeWriter(elementId, text, sourcesId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const formatted = formatAnswer(text);
    // Temporary simpler typing: we'll type plain text then swap to formatted HTML
    // to avoid breaking HTML tags during typing.
    // For a robust solution, we'd need a parser. 
    // Here we'll just fast-type the plain text and then render the HTML.

    // Actually, let's just fade it in for now to be safe, or direct replace.
    // Real typing effect requires complex tag handling.
    // Let's implement a simple "word by word" reveal.

    const words = formatted.split(' ');
    el.innerHTML = '';

    for (let i = 0; i < words.length; i++) {
        el.innerHTML += words[i] + ' ';
        // rudimentary scrolling
        const chatContainer = document.getElementById('chat-messages');
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;

        await new Promise(r => setTimeout(r, 20)); // typing speed
    }

    el.classList.remove('typing-cursor');
    // Show sources
    const sourcesEl = document.getElementById(sourcesId);
    if (sourcesEl) {
        sourcesEl.style.display = 'block';
        sourcesEl.style.animation = 'fadeIn 0.5s ease';
    }
}

// --- Send Message ---

async function sendMessage() {
    const input = document.getElementById('question-input');
    const askBtn = document.getElementById('ask-btn');
    const question = input.value.trim();

    if (!question) return;
    if (question.length < 3) {
        showToast('Question is too short.', 'error');
        return;
    }

    // clear welcome
    const welcome = document.getElementById('chat-welcome');
    if (welcome) welcome.remove();

    // add user message
    const messagesEl = document.getElementById('chat-messages');
    messagesEl.insertAdjacentHTML('beforeend', renderMessage({ role: 'user', content: question }));

    // add loading indicator
    const loadingId = 'loading-' + Date.now();
    messagesEl.insertAdjacentHTML('beforeend', `
    <div class="chat-msg chat-msg-assistant" id="${loadingId}">
      <div class="chat-msg-bubble chat-loading">
        <div class="loading-dots"><span></span><span></span><span></span></div>
        <span>Searching documents...</span>
      </div>
    </div>
  `);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    input.value = '';
    document.getElementById('char-count').textContent = '0 / 2000';
    askBtn.disabled = true;

    try {
        const res = await authFetch(`${API_BASE}/api/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question,
                conversationId: currentConversationId,
            }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to get an answer');

        // update conversation ID for follow-ups
        if (!currentConversationId) {
            currentConversationId = data.conversationId;
            document.getElementById('chat-title').textContent = question.slice(0, 60) + (question.length > 60 ? '...' : '');
            loadConversations();
        }

        // replace loading with answer
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) {
            const msgId = Date.now();
            loadingEl.outerHTML = renderMessage({
                id: msgId,
                role: 'assistant',
                content: data.answer,
                sources: data.sources,
                isNew: true
            });

            // Trigger typing
            await typeWriter(`msg-${msgId}`, data.answer, `sources-${msgId}`);
        }

        messagesEl.scrollTop = messagesEl.scrollHeight;
    } catch (err) {
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) {
            loadingEl.outerHTML = `
        <div class="chat-msg chat-msg-assistant">
          <div class="chat-msg-bubble chat-msg-error">❌ ${escapeHtml(err.message)}</div>
        </div>`;
        }
    } finally {
        askBtn.disabled = false;
        input.focus();
    }
}

function toggleConvSidebar() {
    document.getElementById('conv-sidebar').classList.toggle('open');
}

// --- Status ---

async function checkHealth() {
    const cards = {
        backend: document.getElementById('status-backend'),
        database: document.getElementById('status-database'),
        llm: document.getElementById('status-llm'),
    };

    Object.values(cards).forEach(card => {
        card.className = 'status-card status-checking';
        card.querySelector('.status-icon-container').innerHTML = `<div class="status-icon spin">${ICONS.loader}</div>`;
        card.querySelector('.status-message').textContent = 'Checking...';
    });

    try {
        const res = await fetch(`${API_BASE}/api/health`);
        const health = await res.json();

        updateStatusCard(cards.backend, health.backend);
        updateStatusCard(cards.database, health.database);
        updateStatusCard(cards.llm, health.llm);

        document.getElementById('status-timestamp').textContent =
            `Last checked: ${new Date(health.timestamp).toLocaleString()}`;
    } catch (err) {
        Object.values(cards).forEach(card => {
            card.className = 'status-card status-unhealthy';
            card.querySelector('.status-icon-container').innerHTML = `<div class="status-icon pulse-red">${ICONS.alertTriangle}</div>`;
            card.querySelector('.status-message').textContent = 'Cannot reach server';
        });
        document.getElementById('status-timestamp').textContent =
            `Last checked: ${new Date().toLocaleString()} (connection failed)`;
    }
}

function updateStatusCard(card, serviceHealth) {
    const isHealthy = serviceHealth.status === 'healthy';
    const statusClass = isHealthy ? 'status-healthy' : 'status-unhealthy';
    const iconHtml = isHealthy
        ? `<div class="status-icon pulse-green">${ICONS.checkCircle}</div>`
        : `<div class="status-icon pulse-red">${ICONS.alertTriangle}</div>`;

    card.className = `status-card ${statusClass}`;
    card.querySelector('.status-icon-container').innerHTML = iconHtml;
    card.querySelector('.status-message').textContent = serviceHealth.message;
}

// --- Utilities ---

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();

    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff', 'tif'].includes(ext)) {
        return ICONS.fileImage;
    }

    if (['js', 'css', 'html', 'json', 'xml', 'py', 'java', 'c', 'cpp', 'h'].includes(ext)) {
        return ICONS.fileCode;
    }

    if (['txt', 'md', 'log', 'csv'].includes(ext)) {
        return ICONS.fileText;
    }

    return ICONS.fileGeneric;
}

function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// --- Init ---

function initChat() {
    const input = document.getElementById('question-input');
    const charCount = document.getElementById('char-count');

    if (!input) return;

    input.addEventListener('input', () => {
        charCount.textContent = `${input.value.length} / 2000`;
        // auto-resize
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 150) + 'px';
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            sendMessage();
        }
    });
}

// --- Scroll Reveal Observer ---
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    initUpload();
    initChat();
    // Check for token on load
    checkAuth();

    // Initialize Scroll Reveal
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});
