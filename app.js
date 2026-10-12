// --- DATA INITIALIZATION & STATE MANAGEMENT ---
const DEFAULT_ACCOUNT = {
    email: "admin@tabungan.com",
    password: "Password123",
    name: "Administrator",
    saldo: 0,
    setoran: 0,
    penarikan: 0,
    transactions: [],
    logs: [
        "Akun siap digunakan."
    ]
};

const LEGACY_DEMO_TRANSACTIONS = [
    { id: "TRX-001", student: "Ahmad Firdaus (VIIA)", date: "2026-10-18 18:37", type: "Setoran", amount: 50000, status: "Berhasil" },
    { id: "TRX-002", student: "Siti Aminah (VIIB)", date: "2026-10-17 14:20", type: "Setoran", amount: 150000, status: "Berhasil" },
    { id: "TRX-003", student: "Rizky Pratama (VIIIA)", date: "2026-10-16 10:15", type: "Penarikan", amount: 50000, status: "Berhasil" },
    { id: "TRX-004", student: "Ahmad Firdaus (VIIA)", date: "2026-10-15 09:00", type: "Setoran", amount: 500000, status: "Berhasil" },
    { id: "TRX-005", student: "Siti Aminah (VIIB)", date: "2026-10-14 11:45", type: "Setoran", amount: 500000, status: "Berhasil" }
];
let addingAccountFromProfile = false;

function clearUnmodifiedDemoData(users) {
    const demoAccount = users.find(user =>
        user.email === DEFAULT_ACCOUNT.email &&
        user.saldo === 1050000 &&
        user.setoran === 1200000 &&
        user.penarikan === 150000 &&
        Array.isArray(user.transactions) &&
        user.transactions.length === LEGACY_DEMO_TRANSACTIONS.length &&
        user.transactions.every((transaction, index) => {
            const demoTransaction = LEGACY_DEMO_TRANSACTIONS[index];
            return transaction.id === demoTransaction.id &&
                transaction.student === demoTransaction.student &&
                transaction.date === demoTransaction.date &&
                transaction.type === demoTransaction.type &&
                transaction.amount === demoTransaction.amount &&
                transaction.status === demoTransaction.status;
        })
    );

    if (!demoAccount) return false;

    demoAccount.saldo = 0;
    demoAccount.setoran = 0;
    demoAccount.penarikan = 0;
    demoAccount.transactions = [];
    demoAccount.logs = ["Data contoh awal dihapus. Akun siap digunakan."];
    return true;
}

function getRegisteredUsers() {
    let users = JSON.parse(localStorage.getItem('tabungan_users'));
    if (!users) {
        users = [{ ...DEFAULT_ACCOUNT, transactions: [], logs: [...DEFAULT_ACCOUNT.logs] }];
        saveRegisteredUsers(users);
        return users;
    }
    if (clearUnmodifiedDemoData(users)) saveRegisteredUsers(users);
    return users;
}

function saveRegisteredUsers(users) {
    localStorage.setItem('tabungan_users', JSON.stringify(users));
}

function getCurrentUserSession() {
    return localStorage.getItem('tabungan_current_user');
}

function setCurrentUserSession(email) {
    localStorage.setItem('tabungan_current_user', email);
}

function getActiveUserData() {
    const email = getCurrentUserSession();
    const users = getRegisteredUsers();
    return users.find(u => u.email === email) || DEFAULT_ACCOUNT;
}

function saveActiveUserData(userData) {
    const users = getRegisteredUsers();
    const index = users.findIndex(u => u.email === userData.email);
    if (index !== -1) {
        users[index] = userData;
        saveRegisteredUsers(users);
    }
}

// --- INITIALIZATION ON LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = getCurrentUserSession();
    const users = getRegisteredUsers();
    const resetToken = new URLSearchParams(window.location.search).get('resetToken');
    const resetEmail = new URLSearchParams(window.location.search).get('email');
    if (resetToken && resetEmail) {
        document.getElementById('reset-token').value = resetToken;
        document.getElementById('reset-email').value = resetEmail;
        document.getElementById('reset-email-display').textContent = `Atur kata sandi baru untuk ${resetEmail}.`;
        switchAuthView('reset');
    } else if (currentUser && users.some(user => user.email === currentUser)) {
        showDashboardView();
    } else {
        localStorage.removeItem('tabungan_current_user');
        switchAuthView('login');
    }

    const soundEnabled = localStorage.getItem('tabungan_notification_sound') === 'true';
    updateNotificationSoundButton(soundEnabled);

    document.addEventListener('click', event => {
        const profileMenu = document.getElementById('profile-menu');
        const profileButton = document.getElementById('profile-menu-button');
        if (!profileMenu.contains(event.target) && !profileButton.contains(event.target)) {
            closeProfileMenu();
        }
        if (event.target.id === 'account-settings-modal') closeAccountSettings();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeProfileMenu();
            closeAccountSettings();
        }
    });

    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('trans-date');
    if (dateInput) dateInput.value = today;
});

// --- AUTHENTICATION & NAVIGATION ---
function switchAuthView(view) {
    const pages = {
        login: document.getElementById('login-page'),
        register: document.getElementById('register-page'),
        forgot: document.getElementById('forgot-page'),
        reset: document.getElementById('reset-page')
    };
    Object.values(pages).forEach(page => page.classList.add('hidden'));
    if (pages[view]) pages[view].classList.remove('hidden');
    if (view !== 'register') addingAccountFromProfile = false;
    if (view === 'forgot') {
        document.getElementById('forgot-email').value = document.getElementById('login-email').value.trim();
    }
}

async function postAuthRequest(path, payload) {
    let response;
    try {
        response = await fetch(path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        throw new Error('Layanan reset email belum terhubung. Jalankan aplikasi melalui server yang menyediakan API reset kata sandi.');
    }

    let result = {};
    try {
        result = await response.json();
    } catch (error) {
        if (response.ok) throw new Error('Respons layanan reset tidak dapat dibaca.');
    }
    if (!response.ok) {
        if ([403, 404, 405].includes(response.status)) {
            throw new Error('API reset kata sandi belum tersedia. Aplikasi harus dijalankan melalui server yang menyediakan endpoint reset email.');
        }
        throw new Error(result.message || 'Permintaan reset kata sandi gagal.');
    }
    return result;
}

document.getElementById('forgot-form').addEventListener('submit', async event => {
    event.preventDefault();
    const email = document.getElementById('forgot-email').value.trim().toLowerCase();
    try {
        await postAuthRequest('/api/auth/forgot-password', { email });
        showToast('Jika email terdaftar, tautan reset akan dikirim ke kotak masuk.', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
});

document.getElementById('reset-form').addEventListener('submit', async event => {
    event.preventDefault();
    const email = document.getElementById('reset-email').value;
    const token = document.getElementById('reset-token').value;
    const password = document.getElementById('reset-password').value;
    const confirmation = document.getElementById('reset-password-confirm').value;
    if (password !== confirmation) {
        showToast('Konfirmasi kata sandi tidak sama.', 'error');
        return;
    }
    try {
        await postAuthRequest('/api/auth/reset-password', { email, token, password });
        const users = getRegisteredUsers();
        const user = users.find(account => account.email.toLowerCase() === email.toLowerCase());
        if (user) {
            user.password = password;
            saveRegisteredUsers(users);
        }
        document.getElementById('login-email').value = email;
        document.getElementById('login-password').value = '';
        switchAuthView('login');
        showToast('Kata sandi berhasil diubah. Silakan masuk.', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
});

function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.03 10.03 0 012.16-3.38m3.11-2.49A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18"/>`;
    } else {
        input.type = 'password';
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>`;
    }
}

// Login Form Submit Handler
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    const users = getRegisteredUsers();
    const user = users.find(u => u.email.toLowerCase() === email);

    if (!user) {
        showToast("Email tidak terdaftar!", "error");
        return;
    }

    if (user.password !== password) {
        showToast("Kata sandi salah!", "error");
        return;
    }

    // Success Loading Simulation
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.remove('hidden');

    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        setCurrentUserSession(user.email);
        addLogActivity(`Login berhasil sebagai ${user.name}`);
        showDashboardView();
        showToast("Login berhasil! Selamat datang kembali.", "success");
    }, 1000);
});

// Register Form Submit Handler
document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;

    const users = getRegisteredUsers();
    if (users.some(u => u.email.toLowerCase() === email)) {
        addingAccountFromProfile = false;
        showToast("Email sudah terdaftar di sistem!", "error");
        return;
    }

    const newUser = {
        email: email,
        password: password,
        name: name,
        saldo: 0,
        setoran: 0,
        penarikan: 0,
        transactions: [],
        logs: [`Akun ${name} berhasil dibuat.`]
    };

    users.push(newUser);
    saveRegisteredUsers(users);

    if (addingAccountFromProfile) {
        addingAccountFromProfile = false;
        setCurrentUserSession(email);
        document.getElementById('register-form').reset();
        showDashboardView();
        showToast("Akun Gmail berhasil ditambahkan dan digunakan.", "success");
        return;
    }

    document.getElementById('login-email').value = email;
    document.getElementById('login-password').value = password;
    showToast("Akun berhasil dibuat! Silakan masuk.", "success");
    switchAuthView('login');
    document.getElementById('register-form').reset();
});

function logoutSession() {
    localStorage.removeItem('tabungan_current_user');
    document.getElementById('dashboard-app').classList.add('hidden');
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('login-form').reset();
    switchAuthView('login');
    closeProfileMenu();
    closeAccountSettings();
    showToast("Berhasil keluar sesi.", "info");
}

function toggleProfileMenu() {
    const menu = document.getElementById('profile-menu');
    const button = document.getElementById('profile-menu-button');
    const isOpening = menu.classList.contains('hidden');
    menu.classList.toggle('hidden');
    button.setAttribute('aria-expanded', String(isOpening));
}

function closeProfileMenu() {
    const menu = document.getElementById('profile-menu');
    const button = document.getElementById('profile-menu-button');
    if (!menu || !button) return;
    menu.classList.add('hidden');
    button.setAttribute('aria-expanded', 'false');
}

function openAccountSettings() {
    closeProfileMenu();
    document.getElementById('account-settings-name').value = getActiveUserData().name;
    const modal = document.getElementById('account-settings-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function saveAccountSettings(event) {
    event.preventDefault();
    const name = document.getElementById('account-settings-name').value.trim();
    if (!name) {
        showToast('Nama akun tidak boleh kosong.', 'error');
        return;
    }

    const user = getActiveUserData();
    user.name = name;
    saveActiveUserData(user);
    addLogActivity(`Nama akun diubah menjadi ${name}`);
    renderDashboardData();
    closeAccountSettings();
    showToast('Nama akun berhasil disimpan.', 'success');
}

function closeAccountSettings() {
    const modal = document.getElementById('account-settings-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function startAddAccount() {
    addingAccountFromProfile = true;
    localStorage.removeItem('tabungan_current_user');
    document.getElementById('dashboard-app').classList.add('hidden');
    document.getElementById('register-form').reset();
    closeProfileMenu();
    switchAuthView('register');
    document.getElementById('reg-name').focus();
}

function showDashboardView() {
    ['login-page', 'register-page', 'forgot-page', 'reset-page'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById('dashboard-app').classList.remove('hidden');
    
    renderDashboardData();
}

function setActiveNav(element, titleName) {
    document.getElementById('page-title-header').innerText = titleName;
    if (element) {
        document.querySelectorAll('.sidebar-link').forEach(el => {
            el.classList.remove('bg-indigo-600', 'text-white', 'shadow-sm');
            el.classList.add('hover:bg-slate-800/60', 'hover:text-white');
        });
        element.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
        element.classList.remove('hover:bg-slate-800/60', 'hover:text-white');
    }
}

function focusTransactionForm(category) {
    const form = document.getElementById('transaction-entry');
    if (!form) return;
    document.getElementById('trans-type').value = category;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('trans-amount').focus({ preventScroll: true });
}

// --- DASHBOARD RENDER ---
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
}

function renderDashboardData() {
    const user = setActiveUserDataGlobal();
    if (!user) return;

    // Update Profile Info
    document.getElementById('admin-name-display').innerText = user.name;
    document.getElementById('admin-email-display').innerText = user.email;
    document.getElementById('admin-avatar-initial').innerText = user.name.charAt(0).toUpperCase();
    document.getElementById('topbar-username').innerText = user.name;
    document.getElementById('topbar-avatar').innerText = user.name.charAt(0).toUpperCase();
    document.getElementById('profile-menu-name').innerText = user.name;
    document.getElementById('profile-menu-email').innerText = user.email;

    // Update Statistics Cards
    document.getElementById('stat-total-saldo-text').innerText = formatRupiah(user.saldo);
    document.getElementById('stat-total-setoran-text').innerText = formatRupiah(user.setoran);
    document.getElementById('stat-total-penarikan-text').innerText = formatRupiah(user.penarikan);

    // Render Transaction Table
    const tbody = document.getElementById('transaction-table-body');
    tbody.innerHTML = '';
    
    if (user.transactions.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.className = 'px-5 py-8 text-center text-sm text-slate-400';
        cell.textContent = 'Belum ada transaksi.';
        row.appendChild(cell);
        tbody.appendChild(row);
    } else {
        user.transactions.forEach(trx => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-slate-50';
            const date = document.createElement('td');
            date.className = 'whitespace-nowrap px-5 py-3 text-slate-500';
            date.textContent = trx.date;
            const category = document.createElement('td');
            category.className = 'px-5 py-3';
            const isIncome = transactionKind(trx) === 'pemasukan';
            category.textContent = isIncome ? 'Pemasukan' : 'Pengeluaran';
            category.className += isIncome ? ' font-medium text-emerald-700' : ' font-medium text-rose-700';
            const description = document.createElement('td');
            description.className = 'px-5 py-3';
            description.textContent = trx.description || trx.student || '-';
            const amount = document.createElement('td');
            amount.className = 'whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-900';
            amount.textContent = formatRupiah(trx.amount);
            const actions = document.createElement('td');
            actions.className = 'whitespace-nowrap px-5 py-3 text-right';
            const editButton = document.createElement('button');
            editButton.type = 'button';
            editButton.className = 'mr-2 rounded-md px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50';
            editButton.textContent = 'Edit';
            editButton.setAttribute('aria-label', `Edit transaksi ${trx.id}`);
            editButton.addEventListener('click', () => editTransaction(trx.id));
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'rounded-md p-1.5 text-rose-600 hover:bg-rose-50';
            deleteButton.setAttribute('aria-label', `Hapus transaksi ${trx.id}`);
            deleteButton.title = 'Hapus transaksi';
            deleteButton.innerHTML = '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 7h12m-10 0V5h8v2m-9 0l1 13h8l1-13M10 11v5m4-5v5"/></svg>';
            deleteButton.addEventListener('click', () => deleteTransaction(trx.id));
            actions.append(editButton, deleteButton);
            row.append(date, category, description, amount, actions);
            tbody.appendChild(row);
        });
    }

    renderDropdownLogs();
}

function setActiveUserDataGlobal() {
    return getActiveUserData();
}

// --- TRANSACTION FORM & HISTORY ---
function transactionKind(transaction) {
    return ['Setoran', 'Pemasukan', 'pemasukan'].includes(transaction.type)
        ? 'pemasukan'
        : 'pengeluaran';
}

function formatRupiahInput(input) {
    let num = input.value.replace(/[^0-9]/g, '');
    if (num) {
        input.value = parseInt(num, 10).toLocaleString('id-ID');
    } else {
        input.value = '';
    }
}

function submitTransaction(e) {
    e.preventDefault();
    const kind = document.getElementById('trans-type').value;
    const rawAmount = document.getElementById('trans-amount').value.replace(/[^\d]/g, '');
    const amount = Number(rawAmount);
    const dateVal = document.getElementById('trans-date').value;
    const description = document.getElementById('trans-description').value.trim();
    const editingId = document.getElementById('trans-edit-id').value;

    if (!Number.isSafeInteger(amount) || amount <= 0 || !['pemasukan', 'pengeluaran'].includes(kind)) {
        showToast('Masukkan jumlah uang yang valid dan lebih dari nol.', 'error');
        return;
    }
    if (!dateVal || !description) {
        showToast('Lengkapi tanggal dan deskripsi transaksi.', 'error');
        return;
    }

    const user = getActiveUserData();
    const previousIndex = editingId
        ? user.transactions.findIndex(transaction => transaction.id === editingId)
        : -1;
    const previous = previousIndex >= 0 ? user.transactions[previousIndex] : null;
    if (editingId && !previous) {
        showToast('Transaksi yang akan diubah tidak ditemukan.', 'error');
        cancelTransactionEdit();
        return;
    }
    const oldKind = previous ? transactionKind(previous) : null;
    const oldAmount = previous ? previous.amount : 0;

    const incomeDelta = (kind === 'pemasukan' ? amount : 0) - (oldKind === 'pemasukan' ? oldAmount : 0);
    const expenseDelta = (kind === 'pengeluaran' ? amount : 0) - (oldKind === 'pengeluaran' ? oldAmount : 0);
    const newBalance = user.saldo + incomeDelta - expenseDelta;
    if (user.setoran + incomeDelta < 0 || user.penarikan + expenseDelta < 0) {
        showToast('Perubahan ini membuat total transaksi menjadi negatif.', 'error');
        return;
    }
    if (newBalance < 0) {
        showToast('Saldo tidak cukup untuk pengeluaran tersebut.', 'error');
        return;
    }

    const transaction = {
        id: editingId || `TRX-${Date.now()}`,
        date: dateVal,
        type: kind,
        amount: amount,
        description
    };
    user.setoran += incomeDelta;
    user.penarikan += expenseDelta;
    user.saldo = newBalance;
    if (previousIndex >= 0) {
        user.transactions[previousIndex] = transaction;
    } else {
        user.transactions.unshift(transaction);
    }
    saveActiveUserData(user);
    addLogActivity(`${editingId ? 'Mengubah' : 'Menambahkan'} transaksi ${kind} ${formatRupiah(amount)}`);
    cancelTransactionEdit();
    renderDashboardData();
    showToast(`Transaksi ${kind} berhasil disimpan.`, 'success');
}

function editTransaction(id) {
    const transaction = getActiveUserData().transactions.find(item => item.id === id);
    if (!transaction) {
        showToast('Transaksi tidak ditemukan.', 'error');
        return;
    }
    document.getElementById('trans-edit-id').value = transaction.id;
    document.getElementById('trans-amount').value = transaction.amount.toLocaleString('id-ID');
    document.getElementById('trans-date').value = transaction.date.slice(0, 10);
    document.getElementById('trans-type').value = transactionKind(transaction);
    document.getElementById('trans-description').value = transaction.description || transaction.student || '';
    document.getElementById('trans-submit-btn').textContent = 'Simpan Perubahan';
    document.getElementById('trans-cancel-edit').classList.remove('hidden');
    document.getElementById('transaction-entry').scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('trans-amount').focus({ preventScroll: true });
}

function cancelTransactionEdit() {
    document.getElementById('transaction-form').reset();
    document.getElementById('trans-edit-id').value = '';
    document.getElementById('trans-submit-btn').textContent = 'Kirim Transaksi';
    document.getElementById('trans-cancel-edit').classList.add('hidden');
    document.getElementById('trans-date').value = new Date().toISOString().split('T')[0];
}

function deleteTransaction(id) {
    const user = getActiveUserData();
    const index = user.transactions.findIndex(transaction => transaction.id === id);
    if (index === -1) {
        showToast('Transaksi tidak ditemukan.', 'error');
        return;
    }
    if (!window.confirm('Hapus transaksi ini? Ringkasan saldo dan total akan disesuaikan.')) return;

    const transaction = user.transactions[index];
    const kind = transactionKind(transaction);
    user.transactions.splice(index, 1);
    user.setoran = user.transactions.reduce(
        (total, item) => total + (transactionKind(item) === 'pemasukan' ? item.amount : 0),
        0
    );
    user.penarikan = user.transactions.reduce(
        (total, item) => total + (transactionKind(item) === 'pengeluaran' ? item.amount : 0),
        0
    );
    user.saldo = user.setoran - user.penarikan;
    saveActiveUserData(user);
    addLogActivity(`Menghapus transaksi ${kind} ${formatRupiah(transaction.amount)}`);
    renderDashboardData();
    showToast('Transaksi berhasil dihapus.', 'success');
}

// --- NOTIFICATION & LOG SYSTEM ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    let bg = 'bg-emerald-600';
    if (type === 'error') bg = 'bg-rose-600';
    if (type === 'info') bg = 'bg-indigo-600';

    toast.className = `${bg} text-white px-5 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-3 pointer-events-auto animate-in transition duration-300`;
    toast.textContent = message;
    
    container.appendChild(toast);
    if (localStorage.getItem('tabungan_notification_sound') === 'true') playNotificationSound();

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

let notificationAudioContext = null;

function playNotificationSound() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    try {
        notificationAudioContext = notificationAudioContext || new AudioContextClass();
        if (notificationAudioContext.state === 'suspended') notificationAudioContext.resume();
        const oscillator = notificationAudioContext.createOscillator();
        const volume = notificationAudioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 880;
        volume.gain.setValueAtTime(0.08, notificationAudioContext.currentTime);
        volume.gain.exponentialRampToValueAtTime(0.001, notificationAudioContext.currentTime + 0.16);
        oscillator.connect(volume);
        volume.connect(notificationAudioContext.destination);
        oscillator.start();
        oscillator.stop(notificationAudioContext.currentTime + 0.16);
        return true;
    } catch (error) {
        console.error('Gagal memutar suara notifikasi:', error);
        return false;
    }
}

function updateNotificationSoundButton(enabled) {
    const button = document.getElementById('notification-sound-toggle');
    if (!button) return;
    button.textContent = `Suara notif: ${enabled ? 'aktif' : 'mati'}`;
    button.setAttribute('aria-pressed', String(enabled));
}

function toggleNotificationSound() {
    const shouldEnable = localStorage.getItem('tabungan_notification_sound') !== 'true';
    if (shouldEnable && !playNotificationSound()) {
        showToast('Perangkat ini tidak mendukung suara notifikasi.', 'error');
        return;
    }
    localStorage.setItem('tabungan_notification_sound', String(shouldEnable));
    updateNotificationSoundButton(shouldEnable);
    showToast(`Suara notifikasi ${shouldEnable ? 'diaktifkan' : 'dimatikan'}.`, 'info');
}

function addLogActivity(message) {
    const user = getActiveUserData();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    user.logs.unshift(`${message} pada ${timeStr} WIB`);
    if (user.logs.length > 10) user.logs.pop();
    saveActiveUserData(user);
    renderDropdownLogs();
}

function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    dropdown.classList.toggle('hidden');
}

function renderDropdownLogs() {
    const user = getActiveUserData();
    const listContainer = document.getElementById('dropdown-log-list');
    listContainer.innerHTML = '';

    if (!user.logs || user.logs.length === 0) {
        listContainer.innerHTML = `<div class="p-4 text-center text-xs text-slate-400">Belum ada aktivitas.</div>`;
        return;
    }

    user.logs.forEach(log => {
        const div = document.createElement('div');
        div.className = "p-3 hover:bg-slate-50 transition text-xs text-slate-600 flex items-start gap-2";
        div.innerHTML = `
            <span class="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 shrink-0"></span>
            <p>${log}</p>
        `;
        listContainer.appendChild(div);
    });
}