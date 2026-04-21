const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzgQuYj7GD6SG_kcQqhdQsOevEQ4c9JIx4eoPuOVESu6ijP0HNjlkrpO-txIYJgmFw/exec';

// Cek session saat pertama buka
if (localStorage.getItem('isLoggedIn') === 'true') {
    showMain();
}

async function checkAuth() {
    const code = document.getElementById('access-code').value;
    
    const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });

    if (res.ok) {
        localStorage.setItem('isLoggedIn', 'true');
        showMain();
    } else {
        alert('Kode salah!');
    }
}

function showMain() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    loadNotes();
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    location.reload();
}

async function saveNote() {
    const input = document.getElementById('note-input');
    if (!input.value) return;

    const btn = event.target;
    btn.disabled = true;
    btn.innerText = 'Menyimpan...';

    await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Penting untuk Apps Script
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: input.value })
    });

    input.value = '';
    btn.disabled = false;
    btn.innerText = 'Simpan Catatan';
    setTimeout(loadNotes, 1000); // Reload data
}

async function loadNotes() {
    const res = await fetch(SCRIPT_URL);
    const data = await res.json();
    const container = document.getElementById('notes-list');
    container.innerHTML = '';

    data.reverse().forEach(row => {
        const div = document.createElement('div');
        div.className = 'note-item';
        const date = new Date(row[0]).toLocaleString('id-ID');
        div.innerHTML = `<small>${date}</small><div>${row[1]}</div>`;
        container.appendChild(div);
    });
}
