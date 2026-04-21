const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyEEsAdDKlcjXeWBs60xMJG3Peo_5vwTyij-9Ha4McqBpjoOpzpSSNWblB8GtE-zby8/exec';
let allNotes = [];

// --- AUTHENTICATION ---
async function checkAuth() {
    const code = document.getElementById('access-code').value;
    const btn = event.target;
    btn.innerText = "Mengecek...";
    
    const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });

    if (res.ok) {
        localStorage.setItem('best_note_session', Date.now());
        showApp();
    } else {
        alert('Maaf, kode akses salah.');
        btn.innerText = "Masuk";
    }
}

function autoLogout() {
    const session = localStorage.getItem('best_note_session');
    if (session && (Date.now() - session > 3600000)) logout();
}
setInterval(autoLogout, 60000);

function logout() { localStorage.clear(); location.reload(); }

// --- UI CONTROL ---
function showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    loadNotes();
}
if (localStorage.getItem('best_note_session')) showApp();

function closeModals() {
    document.getElementById('form-modal').classList.add('hidden');
    document.getElementById('preview-modal').classList.add('hidden');
}

function openForm(id = null) {
    const input = document.getElementById('note-input');
    const idField = document.getElementById('note-id');
    const title = document.getElementById('modal-title');

    if (id) {
        const note = allNotes.find(n => n.id === id);
        title.innerText = "Edit Catatan";
        input.value = note.note;
        idField.value = id;
    } else {
        title.innerText = "Catatan Baru";
        input.value = "";
        idField.value = "";
    }
    document.getElementById('form-modal').classList.remove('hidden');
}

function openPreview(id) {
    const note = allNotes.find(n => n.id === id);
    document.getElementById('preview-date').innerText = new Date(note.date).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
    document.getElementById('preview-body').innerText = note.note;
    
    document.getElementById('btn-edit-trigger').onclick = () => { closeModals(); openForm(id); };
    document.getElementById('btn-delete-trigger').onclick = () => deleteNote(id);
    
    document.getElementById('preview-modal').classList.remove('hidden');
}

// --- DATA LOGIC ---
async function loadNotes() {
    const grid = document.getElementById('notes-grid');
    grid.innerHTML = '<div class="loader">Sinkronisasi data...</div>';
    
    try {
        const res = await fetch(SCRIPT_URL);
        allNotes = await res.json();
        grid.innerHTML = "";
        
        allNotes.reverse().forEach(n => {
            const card = document.createElement('div');
            card.className = 'note-card';
            card.onclick = () => openPreview(n.id);
            card.innerHTML = `<p>${n.note}</p>`;
            grid.appendChild(card);
        });
    } catch (e) { grid.innerHTML = "Gagal memuat catatan."; }
}

async function saveNote() {
    const btn = document.getElementById('btn-save');
    const note = document.getElementById('note-input').value;
    const id = document.getElementById('note-id').value;
    if (!note) return;

    btn.disabled = true;
    btn.innerText = "MENYIMPAN...";

    const payload = {
        action: id ? 'edit' : 'add',
        id: id ? parseInt(id) : null,
        note: note
    };

    await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload)
    });

    setTimeout(() => {
        closeModals();
        loadNotes();
        btn.disabled = false;
        btn.innerText = "Simpan Sekarang";
    }, 1200);
}

async function deleteNote(id) {
    if (!confirm("Hapus catatan ini?")) return;
    closeModals();
    await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'delete', id: parseInt(id) })
    });
    setTimeout(loadNotes, 1000);
}
