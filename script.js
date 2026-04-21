const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyEEsAdDKlcjXeWBs60xMJG3Peo_5vwTyij-9Ha4McqBpjoOpzpSSNWblB8GtE-zby8/exec';
let allNotes = [];
let activeNoteId = null;

// --- AUTH & SESSION ---
async function checkAuth() {
    const code = document.getElementById('access-code').value;
    const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });

    if (res.ok) {
        localStorage.setItem('bn_session', Date.now());
        initApp();
    } else {
        alert('Passcode Salah');
    }
}

function initApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    loadNotes();
}

if (localStorage.getItem('bn_session')) {
    // Cek logout 1 jam
    if (Date.now() - localStorage.getItem('bn_session') > 3600000) logout();
    else initApp();
}

function logout() { localStorage.clear(); location.reload(); }

// --- UI HELPERS ---
function closeModals() {
    document.querySelectorAll('.modal').forEach(m => {
        if(m.id !== 'login-screen') m.classList.add('hidden');
    });
}

// --- CRUD ---
async function loadNotes() {
    const grid = document.getElementById('notes-grid');
    grid.innerHTML = "<p>Syncing...</p>";
    try {
        const res = await fetch(SCRIPT_URL);
        allNotes = await res.json();
        grid.innerHTML = "";
        allNotes.reverse().forEach(n => {
            const card = document.createElement('div');
            card.className = 'note-card';
            card.onclick = () => showPreview(n.id);
            card.innerHTML = `<p>${n.note}</p>`;
            grid.appendChild(card);
        });
    } catch (e) { grid.innerHTML = "Gagal memuat."; }
}

function showPreview(id) {
    const note = allNotes.find(n => n.id === id);
    activeNoteId = id;
    document.getElementById('preview-date').innerText = new Date(note.date).toLocaleString('id-ID');
    document.getElementById('preview-body').innerText = note.note;
    document.getElementById('preview-modal').classList.remove('hidden');
}

function openForm() {
    document.getElementById('note-id').value = "";
    document.getElementById('note-input').value = "";
    document.getElementById('modal-title').innerText = "Tulis Catatan";
    document.getElementById('form-modal').classList.remove('hidden');
}

function prepareEdit() {
    const note = allNotes.find(n => n.id === activeNoteId);
    document.getElementById('note-id').value = activeNoteId;
    document.getElementById('note-input').value = note.note;
    document.getElementById('modal-title').innerText = "Edit Catatan";
    closeModals();
    document.getElementById('form-modal').classList.remove('hidden');
}

async function saveNote() {
    const btn = document.getElementById('btn-save');
    const noteText = document.getElementById('note-input').value;
    const id = document.getElementById('note-id').value;
    if(!noteText) return;

    btn.innerText = "SAVING...";
    btn.disabled = true;

    await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
            action: id ? 'edit' : 'add',
            id: id ? parseInt(id) : null,
            note: noteText
        })
    });

    setTimeout(() => {
        btn.innerText = "SIMPAN";
        btn.disabled = false;
        closeModals();
        loadNotes();
    }, 1200);
}

async function deleteNote() {
    if(!confirm("Hapus catatan?")) return;
    closeModals();
    await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'delete', id: activeNoteId })
    });
    setTimeout(loadNotes, 1000);
}
