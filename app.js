// SIMULASI DATABASE & STATE MANAGEMENT
let usersDB = JSON.parse(localStorage.getItem('fintech_users') || '[]');
let currentUser = loadActiveUser();
let isAuthRegisterMode = false;
let isBalanceSensorHidden = false;
let calculatorDisplayValue = '0';
let calculatorStoredValue = null;
let calculatorPendingOperator = null;
let calculatorWaitingForOperand = false;

function loadActiveUser() {
    const savedSessionEmail = localStorage.getItem('sesiUserAktif');
    const legacyUser = savedSessionEmail
        ? null
        : JSON.parse(localStorage.getItem('fintech_current_user') || 'null');
    const activeEmail = savedSessionEmail || (legacyUser && legacyUser.email);

    if (!activeEmail) {
        return null;
    }

    let user = usersDB.find(u => u.email.toLowerCase() === activeEmail.toLowerCase());
    if (!user && legacyUser) {
        usersDB.push(legacyUser);
        persistUsersDB();
        user = legacyUser;
    }

    if (user) {
        localStorage.setItem('sesiUserAktif', user.email);
        localStorage.setItem('fintech_current_user', JSON.stringify(user));
        return user;
    }

    localStorage.removeItem('sesiUserAktif');
    localStorage.removeItem('fintech_current_user');
    return null;
}

function persistUsersDB() {
    localStorage.setItem('fintech_users', JSON.stringify(usersDB));
}

function setActiveSession(user) {
    currentUser = user;
    localStorage.setItem('sesiUserAktif', user.email);
    localStorage.setItem('fintech_current_user', JSON.stringify(user));
}

// Inisialisasi Aplikasi saat DOM Siap
document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        showMainDashboard();
    } else {
        showAuthScreen();
    }
    setupEventListeners();
});

function setupEventListeners() {
    // Login Form Listener
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        const user = usersDB.find(u =>
            u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (user) {
            setActiveSession(user);
            showMainDashboard();
        } else {
            alert("Email atau Kata Sandi salah!");
        }
    });

    // Register Form Listener
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim().toLowerCase();
        const password = document.getElementById('regPassword').value.trim();

        if (usersDB.some(u => u.email.toLowerCase() === email)) {
            alert("Email sudah terdaftar!");
            return;
        }

        const newUser = {
            name: name,
            email: email,
            password: password,
            balance: 0,
            transactions: []
        };

        usersDB.push(newUser);
        persistUsersDB();
        setActiveSession(newUser);
        showMainDashboard();
    });

    document.getElementById('calculatorModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            closeCalculator();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !document.getElementById('calculatorModal').classList.contains('hidden')) {
            closeCalculator();
        }
    });
}

// TOGGLE AUTH MODE (Login <-> Register)
function switchAuthMode() {
    isAuthRegisterMode = !isAuthRegisterMode;
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const authToggleText = document.getElementById('authToggleText');

    if (isAuthRegisterMode) {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        authTitle.textContent = "Buat Akun Baru";
        authSubtitle.textContent = "Mulai kelola keuangan Anda hari ini dengan saldo awal Rp 0";
        authToggleText.innerHTML = `Sudah punya akun? <button type="button" onclick="switchAuthMode()" class="text-indigo-600 font-semibold hover:underline">Masuk</button>`;
    } else {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        authTitle.textContent = "Selamat Datang";
        authSubtitle.textContent = "Kelola keuangan Anda dengan lebih mudah & modern";
        authToggleText.innerHTML = `Belum punya akun? <button type="button" onclick="switchAuthMode()" class="text-indigo-600 font-semibold hover:underline">Daftar sekarang</button>`;
    }
}

// TOGGLE PASSWORD VISIBILITY
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    }
}

// NAVIGASI LAYAR
function showAuthScreen() {
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('mainDashboard').classList.add('hidden');
}

function showMainDashboard() {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('mainDashboard').classList.remove('hidden');
    
    // Set User Info
    document.getElementById('userNameDisplay').textContent = currentUser.name;
    document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
    
    // Set Current Date Header
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    document.getElementById('currentDateHeader').textContent = new Date().toLocaleDateString('id-ID', options);

    updateDashboardUI();
    switchTab('home');
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('sesiUserAktif');
    localStorage.removeItem('fintech_current_user');
    showAuthScreen();
}

// TAB NAVIGASI UTAMA
function switchTab(tabName) {
    const tabs = ['home', 'history', 'report'];
    tabs.forEach(t => {
        const el = document.getElementById(`tab${t.charAt(0).toUpperCase() + t.slice(1)}`);
        const navEl = document.getElementById(`nav${t.charAt(0).toUpperCase() + t.slice(1)}`);
        if (t === tabName) {
            el.classList.remove('hidden');
            if (navEl) {
                navEl.classList.remove('text-gray-400');
                navEl.classList.add('text-indigo-400');
            }
        } else {
            el.classList.add('hidden');
            if (navEl) {
                navEl.classList.remove('text-indigo-400');
                navEl.classList.add('text-gray-400');
            }
        }
    });

    if (tabName === 'report') {
        renderMiniCalendar();
        updateReportUI();
    }
}

// TOGGLE SENSOR SALDO
function toggleBalanceSensor() {
    isBalanceSensorHidden = !isBalanceSensorHidden;
    const icon = document.getElementById('balanceSensorIcon');
    if (isBalanceSensorHidden) {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        document.getElementById('displayBalance').textContent = '****';
    } else {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        updateBalanceDisplay();
    }
}

function updateBalanceDisplay() {
    if (!isBalanceSensorHidden) {
        const balance = currentUser.balance || 0;
        document.getElementById('displayBalance').textContent = `$${balance.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    }
}

// MODAL TRANSAKSI (TAMBAH PEMASUKAN / PENGELUARAN)
function openTransactionModal(type = 'expense') {
    document.getElementById('transactionModal').classList.remove('hidden');
    setModalType(type);
}

function closeTransactionModal() {
    closeCalculator();
    document.getElementById('transactionModal').classList.add('hidden');
    document.getElementById('transactionForm').reset();
}

function openCalculator() {
    const amountInput = document.getElementById('txAmount');
    const initialValue = Number(amountInput.value);
    calculatorDisplayValue = amountInput.value && Number.isFinite(initialValue)
        ? String(initialValue)
        : '0';
    calculatorStoredValue = null;
    calculatorPendingOperator = null;
    calculatorWaitingForOperand = false;
    updateCalculatorDisplay();
    document.getElementById('calculatorModal').classList.remove('hidden');
}

function closeCalculator() {
    document.getElementById('calculatorModal').classList.add('hidden');
}

function updateCalculatorDisplay() {
    document.getElementById('calculatorDisplay').textContent = calculatorDisplayValue;
    const expression = calculatorStoredValue !== null && calculatorPendingOperator
        ? `${calculatorStoredValue} ${calculatorPendingOperator}`
        : '';
    document.getElementById('calculatorExpression').textContent = expression;
}

function formatCalculatorResult(value) {
    if (!Number.isFinite(value)) {
        return 'Error';
    }
    return String(Number(value.toPrecision(12)));
}

function calculateResult(left, right, operator) {
    if (operator === '+') return left + right;
    if (operator === '-') return left - right;
    if (operator === '*') return left * right;
    if (operator === '/') return right === 0 ? NaN : left / right;
    return right;
}

function calculatorInput(key) {
    if (key === 'AC') {
        calculatorDisplayValue = '0';
        calculatorStoredValue = null;
        calculatorPendingOperator = null;
        calculatorWaitingForOperand = false;
    } else if (key === '⌫') {
        if (!calculatorWaitingForOperand && calculatorDisplayValue !== 'Error') {
            calculatorDisplayValue = calculatorDisplayValue.length > 1
                ? calculatorDisplayValue.slice(0, -1)
                : '0';
            if (calculatorDisplayValue === '-') calculatorDisplayValue = '0';
        }
    } else if (key === '%') {
        if (calculatorDisplayValue !== 'Error') {
            calculatorDisplayValue = formatCalculatorResult(Number(calculatorDisplayValue) / 100);
            calculatorWaitingForOperand = true;
        }
    } else if (key === '±') {
        if (calculatorDisplayValue !== 'Error' && Number(calculatorDisplayValue) !== 0) {
            calculatorDisplayValue = calculatorDisplayValue.startsWith('-')
                ? calculatorDisplayValue.slice(1)
                : `-${calculatorDisplayValue}`;
        }
    } else if (['+', '-', '*', '/'].includes(key)) {
        if (calculatorDisplayValue === 'Error') return;
        const inputValue = Number(calculatorDisplayValue);
        if (calculatorStoredValue !== null && calculatorPendingOperator && !calculatorWaitingForOperand) {
            calculatorDisplayValue = formatCalculatorResult(
                calculateResult(calculatorStoredValue, inputValue, calculatorPendingOperator)
            );
            if (calculatorDisplayValue === 'Error') {
                calculatorStoredValue = null;
                calculatorPendingOperator = null;
                calculatorWaitingForOperand = true;
                updateCalculatorDisplay();
                return;
            }
        }
        calculatorStoredValue = Number(calculatorDisplayValue);
        calculatorPendingOperator = key;
        calculatorWaitingForOperand = true;
    } else if (key === '=') {
        if (calculatorPendingOperator && calculatorStoredValue !== null && calculatorDisplayValue !== 'Error') {
            calculatorDisplayValue = formatCalculatorResult(
                calculateResult(calculatorStoredValue, Number(calculatorDisplayValue), calculatorPendingOperator)
            );
        }
        if (calculatorDisplayValue === 'Error') {
            updateCalculatorDisplay();
            return;
        }
        document.getElementById('txAmount').value = calculatorDisplayValue;
        closeCalculator();
        return;
    } else if (/^\d$/.test(key) || key === '.') {
        if (calculatorDisplayValue === 'Error' || calculatorWaitingForOperand) {
            calculatorDisplayValue = key === '.' ? '0.' : key;
            calculatorWaitingForOperand = false;
        } else if (key !== '.' || !calculatorDisplayValue.includes('.')) {
            calculatorDisplayValue = calculatorDisplayValue === '0' && key !== '.'
                ? key
                : calculatorDisplayValue + key;
        }
    }

    updateCalculatorDisplay();
}

function setModalType(type) {
    const expBtn = document.getElementById('typeExpenseBtn');
    const incBtn = document.getElementById('typeIncomeBtn');
    const txTypeInput = document.getElementById('txType');
    const modalTitle = document.getElementById('modalTitle');

    txTypeInput.value = type;
    if (type === 'expense') {
        expBtn.className = "py-2 text-xs font-semibold rounded-lg bg-white shadow-sm text-gray-900 transition";
        incBtn.className = "py-2 text-xs font-semibold rounded-lg text-gray-500 transition";
        modalTitle.textContent = "Tambah Pengeluaran Baru";
    } else {
        incBtn.className = "py-2 text-xs font-semibold rounded-lg bg-white shadow-sm text-gray-900 transition";
        expBtn.className = "py-2 text-xs font-semibold rounded-lg text-gray-500 transition";
        modalTitle.textContent = "Tambah Pemasukan Baru";
    }
}

function handleTransactionSubmit(e) {
    e.preventDefault();
    const type = document.getElementById('txType').value;
    const amount = parseFloat(document.getElementById('txAmount').value);
    const title = document.getElementById('txTitle').value.trim();
    const category = document.getElementById('txCategory').value;

    if (isNaN(amount) || amount <= 0) {
        alert("Masukkan jumlah nominal yang valid.");
        return;
    }

    const newTx = {
        id: Date.now(),
        type: type, // 'income' or 'expense'
        title: title,
        category: category,
        amount: amount,
        date: new Date().toISOString()
    };

    if (!currentUser.transactions) {
        currentUser.balance = 0;
        currentUser.transactions = [];
    }

    if (type === 'income') {
        currentUser.balance += amount;
    } else {
        currentUser.balance -= amount;
    }

    currentUser.transactions.unshift(newTx);
    saveUserData();
    closeTransactionModal();
    updateDashboardUI();
}

function saveUserData() {
    const index = usersDB.findIndex(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
    if (index === -1) usersDB.push(currentUser);
    else usersDB[index] = currentUser;
    persistUsersDB();
    localStorage.setItem('sesiUserAktif', currentUser.email);
    localStorage.setItem('fintech_current_user', JSON.stringify(currentUser));
}

function deleteTransaction(transactionIndex) {
    const transactions = currentUser && currentUser.transactions;
    if (!transactions || !Number.isInteger(transactionIndex) || transactionIndex < 0 || transactionIndex >= transactions.length) {
        alert("Transaksi tidak ditemukan.");
        return;
    }

    const transaction = transactions[transactionIndex];
    const amount = Number(transaction.amount);
    const currentBalance = Number(currentUser.balance);
    if (!Number.isFinite(amount) || amount <= 0 || !['income', 'expense'].includes(transaction.type) || !Number.isFinite(currentBalance)) {
        alert("Transaksi tidak dapat dihapus karena datanya tidak valid.");
        return;
    }

    if (!confirm(`Hapus transaksi "${transaction.title}" sebesar $${amount.toFixed(2)}? Saldo akan disesuaikan.`)) {
        return;
    }

    currentUser.balance = currentBalance + (transaction.type === 'income' ? -amount : amount);
    transactions.splice(transactionIndex, 1);
    saveUserData();
    updateDashboardUI();
}

// UPDATE DASHBOARD & RENDER UI
function updateDashboardUI() {
    updateBalanceDisplay();
    
    const txs = currentUser.transactions || [];
    
    let totalSpent = 0;
    let totalSalary = 0;
    let catTotals = { "Food & Drinks": 0, "Transport": 0, "Shopping": 0, "Other": 0 };

    txs.forEach(t => {
        if (t.type === 'expense') {
            totalSpent += t.amount;
            if (catTotals[t.category] !== undefined) {
                catTotals[t.category] += t.amount;
            } else {
                catTotals["Other"] += t.amount;
            }
        } else if (t.type === 'income') {
            totalSalary += t.amount;
        }
    });

    document.getElementById('homeTotalSpent').textContent = `$${totalSpent.toLocaleString('en-US', {minimumFractionDigits: 0})}`;
    
    let foodPct = totalSpent > 0 ? Math.round((catTotals["Food & Drinks"] / totalSpent) * 100) : 0;
    let transPct = totalSpent > 0 ? Math.round((catTotals["Transport"] / totalSpent) * 100) : 0;
    let shopPct = totalSpent > 0 ? Math.round((catTotals["Shopping"] / totalSpent) * 100) : 0;

    document.getElementById('breakdownFood').textContent = `${foodPct}%`;
    document.getElementById('breakdownTransport').textContent = `${transPct}%`;
    document.getElementById('breakdownShopping').textContent = `${shopPct}%`;

    const recentContainer = document.getElementById('recentExpensesList');
    recentContainer.innerHTML = '';

    if (txs.length === 0) {
        recentContainer.innerHTML = `<p class="text-xs text-gray-400 text-center py-4">Belum ada transaksi.</p>`;
    } else {
        txs.slice(0, 3).forEach(t => {
            const isInc = t.type === 'income';
            const sign = isInc ? '+' : '-';
            const colorClass = isInc ? 'text-emerald-600' : 'text-gray-900';
            const iconBg = isInc ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600';
            const iconClass = isInc ? 'fa-wallet' : 'fa-coffee';

            const div = document.createElement('div');
            div.className = "flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-xs";
            div.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-sm font-semibold">
                        <i class="fa-solid ${iconClass}"></i>
                    </div>
                    <div>
                        <h5 class="text-xs font-bold text-gray-900">${t.title}</h5>
                        <p class="text-[10px] text-gray-400">${t.category} • ${new Date(t.date).toLocaleDateString()}</p>
                    </div>
                </div>
                <span class="text-xs font-bold ${colorClass}">${sign}$${t.amount.toFixed(2)}</span>
            `;
            recentContainer.appendChild(div);
        });
    }

    renderFullHistory();
}

function renderFullHistory() {
    const container = document.getElementById('fullHistoryContainer');
    container.innerHTML = '';
    const txs = currentUser.transactions || [];

    if (txs.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-400 text-center py-8">Belum ada riwayat transaksi.</p>`;
        return;
    }

    txs.forEach((t, index) => {
        const isInc = t.type === 'income';
        const sign = isInc ? '+' : '-';
        const colorClass = isInc ? 'text-emerald-600' : 'text-gray-900';
        
        const div = document.createElement('div');
        div.className = "flex items-center justify-between p-3.5 bg-white border border-gray-100 rounded-xl shadow-xs";
        div.innerHTML = `
            <div class="flex items-center space-x-3 min-w-0 flex-1">
                <div class="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center text-sm font-semibold">
                    <i class="fa-solid ${isInc ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                </div>
                <div class="min-w-0">
                    <h5 class="text-xs font-bold text-gray-900">${t.title}</h5>
                    <p class="text-[10px] text-gray-400">${t.category} • ${new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2 shrink-0">
                <span class="text-xs font-bold ${colorClass}">${sign}$${t.amount.toFixed(2)}</span>
                <button type="button" onclick="deleteTransaction(${index})" aria-label="Hapus transaksi" title="Hapus transaksi" class="w-8 h-8 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

function updateReportUI() {
    const txs = currentUser.transactions || [];
    let totalSpent = 0;
    let totalSalary = 0;
    let catTotals = { "Food & Drinks": 0, "Transport": 0, "Shopping": 0, "Other": 0 };

    txs.forEach(t => {
        if (t.type === 'expense') {
            totalSpent += t.amount;
            if (catTotals[t.category] !== undefined) catTotals[t.category] += t.amount;
            else catTotals["Other"] += t.amount;
        } else if (t.type === 'income') {
            totalSalary += t.amount;
        }
    });

    document.getElementById('reportTotalSalary').textContent = `$${totalSalary.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    document.getElementById('reportTotalExpense').textContent = `$${totalSpent.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    document.getElementById('reportChartCenterText').textContent = totalSpent > 0 ? `$${totalSpent.toFixed(0)}` : '$0';

    const legendList = document.getElementById('reportLegendList');
    legendList.innerHTML = '';

    const categories = [
        { name: 'Food & Drinks', color: 'bg-indigo-600', val: catTotals["Food & Drinks"] },
        { name: 'Transport', color: 'bg-amber-400', val: catTotals["Transport"] },
        { name: 'Shopping', color: 'bg-purple-400', val: catTotals["Shopping"] },
        { name: 'Other', color: 'bg-gray-300', val: catTotals["Other"] }
    ];

    categories.forEach(c => {
        const pct = totalSpent > 0 ? Math.round((c.val / totalSpent) * 100) : 0;
        const row = document.createElement('div');
        row.className = "flex items-center justify-between";
        row.innerHTML = `
            <span class="flex items-center space-x-2 text-gray-600"><span class="w-2.5 h-2.5 rounded-full ${c.color}"></span><span>${c.name}</span></span>
            <span class="font-semibold text-gray-900">${pct}% ($${c.val.toFixed(2)})</span>
        `;
        legendList.appendChild(row);
    });
}

function renderMiniCalendar() {
    const grid = document.getElementById('miniCalendarGrid');
    grid.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const emptySpan = document.createElement('span');
        grid.appendChild(emptySpan);
    }
    for (let day = 1; day <= 31; day++) {
        const span = document.createElement('span');
        span.textContent = day;
        span.className = "py-1 rounded-full text-xs cursor-pointer";
        if (day === 13) {
            span.className += " bg-indigo-600 text-white font-bold shadow-sm";
        } else {
            span.className += " hover:bg-gray-100 text-gray-700";
        }
        grid.appendChild(span);
    }
}