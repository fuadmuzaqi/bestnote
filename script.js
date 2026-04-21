const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzgSRS1__YPochn7v2czFZCJOTVwc7dUe3pDFrGibjBMXOGHHS9V9VdUas5mibWfDEq/exec';
let currentNotes = [];

// 1. Logic Auth & Auto-Logout (1 Jam)
function checkAuth() {
    const code = document.getElementById('access-code').value;
    fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    }).then(res => {
        if (res.ok) {
            localStorage.setItem('session_start', Date.now());
            showMain();
        } else {
            alert('Kode akses salah!');
        }
    });
}

function autoLogout() {
    const loginTime = localStorage.getItem('session_start');
    if (loginTime) {
        const hoursPassed = (Date.now() - loginTime) / (1000 * 60 * 60);
        if (hoursPassed >= 1) { // 1 Jam
            logout();
        }
    }
}

function logout() {
    localStorage.clear();
    location.reload();
}

setInterval(autoLogout, 60000); // Cek tiap menit

// 2. Navigation & UI
function showMain() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    lucide.createIcons();
    loadNotes();
}

if (localStorage.getItem('session_start')) showMain();

function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

// 3. CRUD Operations
async function loadNotes() {
    const grid = document.getElementById('notes-grid');
    grid.innerHTML = '<div class="loader">Memperbarui...</div>';
    
    try {
        const res = await fetch(SCRIPT_URL);
        currentNotes = await res.json();
        grid.innerHTML = '';
        
        currentNotes.reverse().forEach(note => {
            const card = document.createElement('div');
            card.className = 'note-card';
            card.onclick = () => openPreview(note.id);
            card.innerHTML = `<p>${note.note.substring(0, 100)}${note.note.length > 100 ? '...' : ''}</p>`;
            grid.appendChild(card);
        });
    } catch (e) {
        grid.innerHTML = 'Gagal memuat data.';
    }
}

function openFormModal(id = null) {
    const modal = document.getElementById('form-modal');
    const title = document.getElementById('modal-title');
    const input = document.getElementById('note-input');
    const idInput = document.getElementById('note-id');

    if (id) {
        const note = currentNotes.find(n => n.id === id);
        title.innerText = 'Edit Catatan';
        input.value = note.note;
        idInput.value = id;
    } else {
        title.innerText = 'Catatan Baru';
        input.value = '';
        idInput.value = '';
    }
    modal.classList.remove('hidden');
    lucide.createIcons();
}

function openPreview(id) {
    const note = currentNotes.find(n => n.id === id);
    document.getElementById('preview-date').innerText = new Date(note.date).toLocaleString('id-ID');
    document.getElementById('preview-body').innerText = note.note;
    
    document.getElementById('edit-icon').onclick = () => { closeModals(); openFormModal(id); };
    document.getElementById('delete-icon').onclick = () => deleteNote(id);
    
    document.getElementById('preview-modal').classList.remove('hidden');
    lucide.createIcons();
}

async function saveNote() {
    const noteText = document.getElementById('note-input').value;
    const id = document.getElementById('note-id').value;
    if (!noteText) return;

    const action = id ? 'edit' : 'add';
    closeModals();

    await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action, id: parseInt(id), note: noteText })
    });

    setTimeout(loadNotes, 1500);
}

async function deleteNote(id) {
    if (!confirm('Hapus catatan ini?')) return;
    closeModals();
    
    await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'delete', id: parseInt(id) })
    });

    setTimeout(loadNotes, 1500);
}
