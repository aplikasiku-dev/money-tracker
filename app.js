// ==================== GLOBAL STATE & I18N ====================
const STORAGE_KEY = 'sakupintar_fintech_v2_zero';
const USD_RATE = 15500; // Conversion rate for IDR <-> USD display & scaling

const I18N = {
    id: {
        appTagline: 'Keuangan Pribadi Cerdas',
        authHeadline: 'Kelola Uang Lebih Cerdas',
        authDescription: 'Atur pengeluaran, jaga anggaran harian, dan capai target masa depan dalam satu tempat.',
        namePlaceholder: 'Contoh: Amjad',
        passwordPlaceholder: 'Masukkan PIN atau kata sandi',
        authRequired: 'Nama lengkap dan PIN atau kata sandi wajib diisi.',
        txNamePlaceholder: 'Contoh: Makan siang atau Gaji',
        walletNamePlaceholder: 'Contoh: Bank atau E-Wallet',
        goalNamePlaceholder: 'Contoh: Dana darurat atau Laptop',
        borrowerPlaceholder: 'Contoh: Budi',
        walletStartsAtZero: 'Dompet baru dimulai dengan saldo 0.',
        itemCount: 'item',
        deleteTitle: 'Hapus transaksi',
        toggleCalculator: 'Buka atau tutup kalkulator',
        showBalance: 'Tampilkan saldo',
        hideBalance: 'Sembunyikan saldo',
        switchCurrency: 'Ganti mata uang',
        switchLanguage: 'Ganti bahasa',
        switchTheme: 'Ganti mode tampilan',
        addTransaction: 'Tambah transaksi',
        lentWallet: 'Sumber dompet dipinjamkan',
        colorIndigo: 'Biru Indigo',
        colorEmerald: 'Hijau Zamrud',
        colorAmber: 'Jingga Amber',
        colorRose: 'Merah Muda',
        colorPurple: 'Ungu Royal',
        loginTab: 'Masuk',
        registerTab: 'Daftar Akun',
        fullName: 'Nama Lengkap',
        pinPassword: 'PIN / Kata Sandi',
        loginBtn: 'Masuk ke Akun',
        registerBtn: 'Daftar & Masuk',
        orText: 'atau',
        guestBtn: 'Masuk sebagai Tamu',
        netWorth: 'Total Kekayaan Bersih',
        monthIncome: 'Pemasukan Bulan Ini',
        monthExpense: 'Pengeluaran Bulan Ini',
        myWallets: 'Dompet Saya',
        addWallet: 'Tambah Dompet',
        dailySafeTitle: 'Jatah Aman Harian',
        setBtn: 'Atur',
        remainingToday: 'Sisa Jatah Hari Ini',
        spentToday: 'Terpakai:',
        recentTransactions: '5 Transaksi Terakhir',
        seeAll: 'Lihat Semua',
        historyTitle: 'Riwayat Transaksi',
        allMonths: 'Semua Bulan',
        allTypes: 'Semua Tipe',
        expense: 'Pengeluaran',
        income: 'Pemasukan',
        transfer: 'Transfer',
        allWallets: 'Semua Dompet',
        goalsDebtsTitle: 'Target & Piutang',
        savingGoalsTab: 'Target Nabung',
        receivablesTab: 'Catatan Piutang',
        newGoalBtn: '+ Buat Target Nabung Baru',
        newDebtBtn: '+ Catat Piutang Baru',
        reportAccountTitle: 'Laporan & Akun',
        monthlySummary: 'Ringkasan Keuangan Bulanan',
        totalIncome: 'Total Pemasukan',
        totalExpense: 'Total Pengeluaran',
        cashflowRatio: 'Rasio Arus Kas',
        expenseByCategory: 'Pengeluaran per Kategori',
        accountSettings: 'Pengaturan Akun',
        profileName: 'Nama Profil',
        saveBtn: 'Simpan',
        currencyLabel: 'Mata Uang Utama',
        languageLabel: 'Bahasa Aplikasi',
        dataManagement: 'Manajemen Data',
        exportCsvBtn: 'Export Laporan ke CSV / Excel',
        backupJsonBtn: 'Backup Data (Download JSON)',
        restoreJsonBtn: 'Restore Data (Upload JSON)',
        resetDataBtn: 'Reset Semua Data',
        logoutBtn: 'Keluar Akun (Logout)',
        navHome: 'Beranda',
        navHistory: 'Riwayat',
        navGoals: 'Target',
        navReport: 'Laporan',
        addTxTitle: 'Catat Transaksi Cepat',
        amountLabel: 'Nominal Transaksi',
        txNameLabel: 'Nama / Catatan Transaksi',
        categoryLabel: 'Kategori',
        walletLabel: 'Pilih Dompet',
        fromWalletLabel: 'Dari Dompet Asal',
        toWalletLabel: 'Ke Dompet Tujuan',
        dateLabel: 'Tanggal',
        saveTxBtn: 'Simpan Transaksi',
        addWalletTitle: 'Tambah Dompet Baru',
        walletName: 'Nama Dompet',
        initialBalance: 'Saldo Awal',
        cardColor: 'Warna Kartu',
        setDailySafeTitle: 'Atur Jatah Aman Harian',
        totalBudgetLabel: 'Total Anggaran',
        targetDaysLabel: 'Target Durasi (Hari)',
        newGoalModalTitle: 'Target Nabung Baru',
        goalName: 'Nama Target',
        targetAmount: 'Nominal Target',
        deadlineLabel: 'Tenggat Waktu',
        topupGoalTitle: 'Top Up Target Nabung',
        topupAmount: 'Nominal Top Up',
        sourceWallet: 'Ambil dari Dompet',
        confirmTopupBtn: 'Top Up Sekarang',
        newDebtModalTitle: 'Catat Piutang Baru',
        borrowerName: 'Nama Peminjam',
        loanAmount: 'Nominal Pinjaman',
        dueDateLabel: 'Tanggal Jatuh Tempo',
        resetConfirmTitle: 'Reset Semua Data?',
        resetConfirmDesc: 'Seluruh dompet, riwayat transaksi, target, dan piutang akan dihapus dan diatur ulang ke 0.',
        cancelBtn: 'Batal',
        yesResetBtn: 'Ya, Reset',
        safeStatusGood: 'Aman',
        safeStatusWarn: 'Hati-hati',
        safeStatusOver: 'Overbudget',
        targetDaysSub: 'Target {days} hari',
        noTransactions: 'Belum ada transaksi',
        noTransactionsDesc: 'Tap tombol + di bawah untuk mulai mencatat pemasukan atau pengeluaran pertama Anda.',
        noGoals: 'Belum ada target nabung',
        noGoalsDesc: 'Buat target tabungan impian Anda dan pantau progresnya di sini.',
        noDebts: 'Belum ada catatan piutang',
        noDebtsDesc: 'Catat uang yang dipinjam teman atau kerabat agar tidak lupa.',
        noExpenseData: 'Belum ada pengeluaran bulan ini',
        topupBtn: 'Top Up Target',
        markPaidBtn: 'Tandai Lunas',
        unpaidBadge: 'Belum Lunas',
        paidBadge: 'Lunas',
        collectedOf: 'Terkumpul {saved} dari {target}',
        duePrefix: 'Jatuh Tempo:',
        deadlinePrefix: 'Tenggat:',
        toastTxSaved: 'Transaksi berhasil disimpan!',
        toastTxDeleted: 'Transaksi dihapus & saldo dikembalikan.',
        toastInvalidAmount: 'Masukkan nominal lebih dari 0!',
        toastSameWallet: 'Dompet asal dan tujuan tidak boleh sama!',
        toastWalletAdded: 'Dompet baru berhasil ditambahkan!',
        toastBudgetUpdated: 'Jatah aman harian diperbarui!',
        toastGoalAdded: 'Target nabung berhasil dibuat!',
        toastGoalTopup: 'Top up target berhasil & saldo dompet terpotong!',
        toastDebtAdded: 'Piutang dicatat & saldo dompet terpotong!',
        toastDebtPaid: 'Piutang lunas! Saldo dikembalikan ke dompet.',
        toastProfileSaved: 'Nama profil diperbarui!',
        toastCsvExported: 'File CSV berhasil diunduh!',
        toastJsonBackup: 'Backup JSON berhasil diunduh!',
        toastJsonRestored: 'Data berhasil dipulihkan!',
        toastJsonError: 'File JSON tidak valid!',
        toastResetDone: 'Semua data telah direset ke 0!',
        greetMorning: 'Selamat Pagi,',
        greetAfternoon: 'Selamat Siang,',
        greetEvening: 'Selamat Malam,',
        catFood: 'Makan',
        catTransport: 'Transport',
        catShopping: 'Belanja',
        catBills: 'Tagihan',
        catEntertainment: 'Hiburan',
        catHealth: 'Kesehatan',
        catSalary: 'Gaji',
        catOther: 'Lainnya'
    },
    en: {
        appTagline: 'Smart Personal Finance',
        authHeadline: 'Manage Money Smarter',
        authDescription: 'Track spending, stay within your daily budget, and reach your future goals in one place.',
        namePlaceholder: 'Example: Amjad',
        passwordPlaceholder: 'Enter your PIN or password',
        authRequired: 'Enter your full name and PIN or password.',
        txNamePlaceholder: 'Example: Lunch or Salary',
        walletNamePlaceholder: 'Example: Bank or E-Wallet',
        goalNamePlaceholder: 'Example: Emergency fund or Laptop',
        borrowerPlaceholder: 'Example: Alex',
        walletStartsAtZero: 'New wallets always start with a balance of 0.',
        itemCount: 'items',
        deleteTitle: 'Delete transaction',
        toggleCalculator: 'Show or hide calculator',
        showBalance: 'Show balances',
        hideBalance: 'Hide balances',
        switchCurrency: 'Switch currency',
        switchLanguage: 'Switch language',
        switchTheme: 'Switch appearance',
        addTransaction: 'Add transaction',
        lentWallet: 'Lent from wallet',
        colorIndigo: 'Indigo Blue',
        colorEmerald: 'Emerald Green',
        colorAmber: 'Amber Orange',
        colorRose: 'Rose Pink',
        colorPurple: 'Royal Purple',
        loginTab: 'Sign In',
        registerTab: 'Register',
        fullName: 'Full Name',
        pinPassword: 'PIN / Password',
        loginBtn: 'Sign In to Account',
        registerBtn: 'Create Account',
        orText: 'or',
        guestBtn: 'Continue as Guest',
        netWorth: 'Total Net Worth',
        monthIncome: 'This Month Income',
        monthExpense: 'This Month Expense',
        myWallets: 'My Wallets',
        addWallet: 'Add Wallet',
        dailySafeTitle: 'Daily Safe-to-Spend',
        setBtn: 'Configure',
        remainingToday: 'Remaining Today',
        spentToday: 'Spent:',
        recentTransactions: 'Last 5 Transactions',
        seeAll: 'See All',
        historyTitle: 'Transaction History',
        allMonths: 'All Months',
        allTypes: 'All Types',
        expense: 'Expense',
        income: 'Income',
        transfer: 'Transfer',
        allWallets: 'All Wallets',
        goalsDebtsTitle: 'Goals & Receivables',
        savingGoalsTab: 'Saving Goals',
        receivablesTab: 'Receivables',
        newGoalBtn: '+ Create New Saving Goal',
        newDebtBtn: '+ Record New Receivable',
        reportAccountTitle: 'Reports & Account',
        monthlySummary: 'Monthly Financial Summary',
        totalIncome: 'Total Income',
        totalExpense: 'Total Expense',
        cashflowRatio: 'Cashflow Ratio',
        expenseByCategory: 'Expense by Category',
        accountSettings: 'Account Settings',
        profileName: 'Profile Name',
        saveBtn: 'Save',
        currencyLabel: 'Primary Currency',
        languageLabel: 'App Language',
        dataManagement: 'Data Management',
        exportCsvBtn: 'Export Report to CSV / Excel',
        backupJsonBtn: 'Backup Data (Download JSON)',
        restoreJsonBtn: 'Restore Data (Upload JSON)',
        resetDataBtn: 'Reset All Data',
        logoutBtn: 'Sign Out (Logout)',
        navHome: 'Home',
        navHistory: 'History',
        navGoals: 'Goals',
        navReport: 'Report',
        addTxTitle: 'Quick Add Transaction',
        amountLabel: 'Transaction Amount',
        txNameLabel: 'Transaction Name / Note',
        categoryLabel: 'Category',
        walletLabel: 'Select Wallet',
        fromWalletLabel: 'From Source Wallet',
        toWalletLabel: 'To Destination Wallet',
        dateLabel: 'Date',
        saveTxBtn: 'Save Transaction',
        addWalletTitle: 'Add New Wallet',
        walletName: 'Wallet Name',
        initialBalance: 'Initial Balance',
        cardColor: 'Card Color',
        setDailySafeTitle: 'Configure Daily Safe-to-Spend',
        totalBudgetLabel: 'Total Budget',
        targetDaysLabel: 'Target Duration (Days)',
        newGoalModalTitle: 'New Saving Goal',
        goalName: 'Goal Name',
        targetAmount: 'Target Amount',
        deadlineLabel: 'Deadline',
        topupGoalTitle: 'Top Up Saving Goal',
        topupAmount: 'Top Up Amount',
        sourceWallet: 'Deduct from Wallet',
        confirmTopupBtn: 'Top Up Now',
        newDebtModalTitle: 'Record New Receivable',
        borrowerName: 'Borrower Name',
        loanAmount: 'Loan Amount',
        dueDateLabel: 'Due Date',
        resetConfirmTitle: 'Reset All Data?',
        resetConfirmDesc: 'All wallets, transactions, goals, and receivables will be cleared and reset to 0.',
        cancelBtn: 'Cancel',
        yesResetBtn: 'Yes, Reset',
        safeStatusGood: 'Safe',
        safeStatusWarn: 'Caution',
        safeStatusOver: 'Overbudget',
        targetDaysSub: '{days}-day target',
        noTransactions: 'No transactions yet',
        noTransactionsDesc: 'Tap the + button below to record your first income or expense.',
        noGoals: 'No saving goals yet',
        noGoalsDesc: 'Create your dream savings target and track progress here.',
        noDebts: 'No receivables recorded',
        noDebtsDesc: 'Keep track of money lent to friends or family so you never forget.',
        noExpenseData: 'No expenses recorded this month',
        topupBtn: 'Top Up Goal',
        markPaidBtn: 'Mark as Paid',
        unpaidBadge: 'Unpaid',
        paidBadge: 'Paid',
        collectedOf: 'Saved {saved} of {target}',
        duePrefix: 'Due:',
        deadlinePrefix: 'Deadline:',
        toastTxSaved: 'Transaction saved successfully!',
        toastTxDeleted: 'Transaction deleted & balance restored.',
        toastInvalidAmount: 'Please enter an amount greater than 0!',
        toastSameWallet: 'Source and destination wallets cannot be the same!',
        toastWalletAdded: 'New wallet added!',
        toastBudgetUpdated: 'Daily safe budget updated!',
        toastGoalAdded: 'Saving goal created!',
        toastGoalTopup: 'Goal topped up & wallet balance updated!',
        toastDebtAdded: 'Receivable recorded & wallet balance deducted!',
        toastDebtPaid: 'Receivable settled! Balance returned to wallet.',
        toastProfileSaved: 'Profile name updated!',
        toastCsvExported: 'CSV report downloaded!',
        toastJsonBackup: 'JSON backup downloaded!',
        toastJsonRestored: 'Data restored successfully!',
        toastJsonError: 'Invalid JSON file!',
        toastResetDone: 'All data has been reset to 0!',
        greetMorning: 'Good Morning,',
        greetAfternoon: 'Good Afternoon,',
        greetEvening: 'Good Evening,',
        catFood: 'Food',
        catTransport: 'Transport',
        catShopping: 'Shopping',
        catBills: 'Bills',
        catEntertainment: 'Leisure',
        catHealth: 'Health',
        catSalary: 'Salary',
        catOther: 'Other'
    }
};

const CATEGORIES = [
    { id: 'food', icon: 'utensils', color: 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400', labelKey: 'catFood' },
    { id: 'transport', icon: 'car', color: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400', labelKey: 'catTransport' },
    { id: 'shopping', icon: 'shopping-bag', color: 'bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400', labelKey: 'catShopping' },
    { id: 'bills', icon: 'zap', color: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400', labelKey: 'catBills' },
    { id: 'entertainment', icon: 'gamepad-2', color: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400', labelKey: 'catEntertainment' },
    { id: 'health', icon: 'heart-pulse', color: 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400', labelKey: 'catHealth' },
    { id: 'salary', icon: 'briefcase', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400', labelKey: 'catSalary' },
    { id: 'other', icon: 'layers', color: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300', labelKey: 'catOther' }
];

// ==================== INITIAL ZERO STATE ====================
function getDefaultData() {
    return {
        isLoggedIn: false,
        user: { name: 'User', isGuest: false },
        settings: {
            lang: 'id',
            currency: 'IDR',
            theme: 'light',
            hideBalance: false
        },
        safeBudget: {
            totalBudgetIDR: 1400000,
            days: 14
        },
        wallets: [
            { id: 'w1', name: 'Bank Utama', balanceIDR: 0, color: 'from-indigo-600 to-blue-600', icon: 'landmark' },
            { id: 'w2', name: 'E-Wallet', balanceIDR: 0, color: 'from-emerald-500 to-teal-600', icon: 'smartphone' },
            { id: 'w3', name: 'Tunai', balanceIDR: 0, color: 'from-amber-500 to-orange-600', icon: 'banknote' }
        ],
        transactions: [],
        goals: [],
        debts: []
    };
}

let appState = loadState();
let currentAuthTab = 'login';
let currentPage = 'home';
let currentTxType = 'expense';
let selectedCategory = 'food';
let calcExpression = '0';

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            const def = getDefaultData();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(def));
            return def;
        }
        const state = JSON.parse(raw);
        if (state.user && Object.prototype.hasOwnProperty.call(state.user, 'email')) {
            delete state.user.email;
        }
        return state;
    } catch (e) {
        return getDefaultData();
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

// ==================== CURRENCY & FORMATTING ====================
function t(key) {
    return I18N[appState.settings.lang][key] || key;
}

function formatMoney(amountIDR, forceShow = false) {
    if (appState.settings.hideBalance && !forceShow) {
        return '••••••';
    }
    const cur = appState.settings.currency;
    if (cur === 'USD') {
        const usd = amountIDR / USD_RATE;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: usd % 1 === 0 ? 0 : 2,
            maximumFractionDigits: 2
        }).format(usd);
    } else {
        return 'Rp ' + new Intl.NumberFormat('id-ID', {
            maximumFractionDigits: 0
        }).format(Math.round(amountIDR));
    }
}

function inputToIDR(inputVal) {
    const num = parseFloat(inputVal) || 0;
    return appState.settings.currency === 'USD' ? num * USD_RATE : num;
}

function idrToInput(amountIDR) {
    if (appState.settings.currency === 'USD') {
        return Number((amountIDR / USD_RATE).toFixed(2));
    }
    return Math.round(amountIDR);
}

function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    const bg = type === 'error' ? 'bg-rose-600' : 'bg-slate-900 dark:bg-indigo-600';
    el.className = `${bg} text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center justify-between animate-slide-up`;
    el.innerHTML = `<span>${msg}</span>`;
    container.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.3s';
        setTimeout(() => el.remove(), 300);
    }, 2600);
}

// ==================== THEME, LANGUAGE & CURRENCY TOGGLES ====================
function applyTheme() {
    const html = document.documentElement;
    if (appState.settings.theme === 'dark') {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
}

function toggleTheme() {
    appState.settings.theme = appState.settings.theme === 'dark' ? 'light' : 'dark';
    saveState();
    applyTheme();
    lucide.createIcons();
}

function toggleLanguage() {
    setLanguage(appState.settings.lang === 'id' ? 'en' : 'id');
}

function setLanguage(lang) {
    appState.settings.lang = lang;
    document.documentElement.lang = lang;
    saveState();
    applyTranslations();
    renderAll();
}

function toggleCurrency() {
    setCurrency(appState.settings.currency === 'IDR' ? 'USD' : 'IDR');
}

function setCurrency(cur) {
    appState.settings.currency = cur;
    saveState();
    renderAll();
}

function toggleHideBalance() {
    appState.settings.hideBalance = !appState.settings.hideBalance;
    saveState();
    renderHome();
}

function applyTranslations() {
    document.documentElement.lang = appState.settings.lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    if (authSubmitBtn) {
        authSubmitBtn.textContent = t(currentAuthTab === 'login' ? 'loginBtn' : 'registerBtn');
    }
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.getAttribute('data-i18n-title'));
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
        el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria-label')));
    });
    const searchEl = document.getElementById('history-search');
    if (searchEl) {
        searchEl.placeholder = appState.settings.lang === 'id' ? 'Cari nama transaksi...' : 'Search transaction name...';
    }
    const authLangLabel = document.getElementById('auth-lang-label');
    if (authLangLabel) authLangLabel.textContent = appState.settings.lang.toUpperCase();
    const headerLangBadge = document.getElementById('header-lang-badge');
    if (headerLangBadge) headerLangBadge.textContent = appState.settings.lang.toUpperCase();
    const settingsLangSelect = document.getElementById('settings-lang-select');
    if (settingsLangSelect) settingsLangSelect.value = appState.settings.lang;
}

// ==================== AUTHENTICATION ====================
function switchAuthTab(tab) {
    currentAuthTab = tab;
    const loginBtn = document.getElementById('tab-login-btn');
    const regBtn = document.getElementById('tab-register-btn');
    const submitBtn = document.getElementById('auth-submit-btn');
    const isLogin = tab === 'login';
    loginBtn.classList.toggle('is-active', isLogin);
    regBtn.classList.toggle('is-active', !isLogin);
    loginBtn.setAttribute('aria-selected', String(isLogin));
    regBtn.setAttribute('aria-selected', String(!isLogin));
    document.getElementById('auth-pass').autocomplete = isLogin ? 'current-password' : 'new-password';
    submitBtn.textContent = t(isLogin ? 'loginBtn' : 'registerBtn');
}

function handleAuthSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('auth-name').value.trim();
    const passInput = document.getElementById('auth-pass');
    const pin = passInput.value.trim();

    if (!name || !pin) {
        showToast(t('authRequired'), 'error');
        return;
    }

    passInput.value = '';
    appState.isLoggedIn = true;
    appState.user = {
        name,
        isGuest: false
    };
    saveState();
    checkAuth();
}

function loginAsGuest() {
    document.getElementById('auth-pass').value = '';
    appState.isLoggedIn = true;
    appState.user = {
        name: 'User',
        isGuest: true
    };
    saveState();
    checkAuth();
}

function logout() {
    document.getElementById('auth-pass').value = '';
    appState.isLoggedIn = false;
    saveState();
    checkAuth();
}

function checkAuth() {
    const authScreen = document.getElementById('auth-screen');
    const mainApp = document.getElementById('main-app');
    if (appState.isLoggedIn) {
        authScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        renderAll();
    } else {
        authScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
    }
    lucide.createIcons();
}

// ==================== NAVIGATION ====================
function navigateTo(page) {
    currentPage = page;
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(`page-${page}`).classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('text-indigo-600', 'dark:text-indigo-400');
        btn.classList.add('text-slate-400');
    });
    const activeNav = document.getElementById(`nav-${page}`);
    if (activeNav) {
        activeNav.classList.remove('text-slate-400');
        activeNav.classList.add('text-indigo-600', 'dark:text-indigo-400');
    }

    if (page === 'home') renderHome();
    if (page === 'history') renderHistory();
    if (page === 'goals') renderGoalsAndDebts();
    if (page === 'report') renderReport();
    lucide.createIcons();
}

// ==================== RENDERING: HOME ====================
function getGreeting() {
    const hr = new Date().getHours();
    if (hr < 12) return t('greetMorning');
    if (hr < 18) return t('greetAfternoon');
    return t('greetEvening');
}

function renderHome() {
    // Header User & Badges
    const userName = appState.user.name || 'User';
    document.getElementById('greeting-text').textContent = getGreeting();
    document.getElementById('header-username').textContent = userName;
    document.getElementById('header-avatar').textContent = userName.charAt(0).toUpperCase();
    document.getElementById('header-currency-badge').textContent = appState.settings.currency === 'IDR' ? 'IDR (Rp)' : 'USD ($)';
    document.getElementById('header-lang-badge').textContent = appState.settings.lang.toUpperCase();

    // Hide/Show eye icon
    const showIcon = document.getElementById('eye-icon-show');
    const hideIcon = document.getElementById('eye-icon-hide');
    if (appState.settings.hideBalance) {
        showIcon.classList.add('hidden');
        hideIcon.classList.remove('hidden');
    } else {
        showIcon.classList.remove('hidden');
        hideIcon.classList.add('hidden');
    }
    document.querySelector('[onclick="toggleHideBalance()"]')
        .setAttribute('aria-label', t(appState.settings.hideBalance ? 'showBalance' : 'hideBalance'));

    // Net Worth
    const netWorth = appState.wallets.reduce((sum, w) => sum + w.balanceIDR, 0);
    document.getElementById('net-worth-amount').textContent = formatMoney(netWorth);

    // Current Month Income & Expense
    const currentYM = new Date().toISOString().slice(0, 7);
    let monthInc = 0;
    let monthExp = 0;
    appState.transactions.forEach(tx => {
        if (tx.date.startsWith(currentYM)) {
            if (tx.type === 'income') monthInc += tx.amountIDR;
            if (tx.type === 'expense') monthExp += tx.amountIDR;
        }
    });
    document.getElementById('home-month-income').textContent = formatMoney(monthInc);
    document.getElementById('home-month-expense').textContent = formatMoney(monthExp);

    // Wallets Horizontal Cards
    const carousel = document.getElementById('wallets-carousel');
    carousel.innerHTML = appState.wallets.map(w => `
    <div class="min-w-[155px] bg-gradient-to-br ${w.color} text-white p-4 rounded-2xl shadow-md flex flex-col justify-between shrink-0">
      <div class="flex items-center justify-between mb-3">
        <div class="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
          <i data-lucide="${w.icon || 'wallet'}" class="w-4 h-4"></i>
        </div>
        <span class="text-[10px] font-bold uppercase tracking-wider bg-white/15 px-2 py-0.5 rounded-full">${appState.settings.currency}</span>
      </div>
      <div>
        <p class="text-xs text-white/80 font-medium truncate">${w.name}</p>
        <p class="text-sm font-extrabold mt-0.5">${formatMoney(w.balanceIDR)}</p>
      </div>
    </div>
  `).join('');

    // Daily Safe-to-Spend Hero Widget
    const todayStr = new Date().toISOString().slice(0, 10);
    const dailyLimitIDR = appState.safeBudget.totalBudgetIDR / (appState.safeBudget.days || 1);
    const spentTodayIDR = appState.transactions
        .filter(tx => tx.type === 'expense' && tx.date === todayStr)
        .reduce((sum, tx) => sum + tx.amountIDR, 0);

    const remainingTodayIDR = Math.max(0, dailyLimitIDR - spentTodayIDR);
    const pct = dailyLimitIDR > 0 ? (spentTodayIDR / dailyLimitIDR) * 100 : 0;

    document.getElementById('daily-safe-subtitle').textContent = t('targetDaysSub').replace('{days}', appState.safeBudget.days);
    document.getElementById('daily-safe-remaining').textContent = formatMoney(remainingTodayIDR);
    document.getElementById('daily-safe-spent').textContent = formatMoney(spentTodayIDR);
    document.getElementById('daily-safe-limit').textContent = formatMoney(dailyLimitIDR);

    const barEl = document.getElementById('daily-safe-bar');
    const badgeEl = document.getElementById('daily-safe-badge');
    barEl.style.width = `${Math.min(100, pct)}%`;

    if (pct >= 100) {
        barEl.className = 'h-full bg-rose-500 rounded-full transition-all duration-500';
        badgeEl.className = 'inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400';
        badgeEl.textContent = t('safeStatusOver');
    } else if (pct >= 75) {
        barEl.className = 'h-full bg-amber-500 rounded-full transition-all duration-500';
        badgeEl.className = 'inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400';
        badgeEl.textContent = t('safeStatusWarn');
    } else {
        barEl.className = 'h-full bg-emerald-500 rounded-full transition-all duration-500';
        badgeEl.className = 'inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400';
        badgeEl.textContent = t('safeStatusGood');
    }

    // Recent 5 Transactions
    const recentList = document.getElementById('home-recent-list');
    const sorted = [...appState.transactions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 5);

    if (sorted.length === 0) {
        recentList.innerHTML = renderEmptyState('receipt-text', t('noTransactions'), t('noTransactionsDesc'));
    } else {
        recentList.innerHTML = sorted.map(tx => renderTransactionCard(tx, false)).join('');
    }
}

function renderEmptyState(icon, title, desc) {
    return `
    <div class="bg-white dark:bg-slate-900 rounded-3xl p-7 text-center border border-dashed border-slate-300 dark:border-slate-800">
      <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
        <i data-lucide="${icon}" class="w-6 h-6"></i>
      </div>
      <h4 class="font-bold text-sm text-slate-700 dark:text-slate-200">${title}</h4>
      <p class="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto leading-relaxed">${desc}</p>
    </div>
  `;
}

function getWalletName(id) {
    const w = appState.wallets.find(item => item.id === id);
    return w ? w.name : t('walletLabel');
}

function renderTransactionCard(tx, allowDelete = true) {
    const cat = CATEGORIES.find(c => c.id === tx.category) || CATEGORIES[7];
    let sign = '-';
    let amountColor = 'text-rose-600 dark:text-rose-400';
    let iconHtml = `<i data-lucide="${cat.icon}" class="w-4 h-4"></i>`;
    let iconBg = cat.color;
    let subtitle = `${getWalletName(tx.walletId)} • ${tx.date}`;

    if (tx.type === 'income') {
        sign = '+';
        amountColor = 'text-emerald-600 dark:text-emerald-400';
    } else if (tx.type === 'transfer') {
        sign = '⇄';
        amountColor = 'text-indigo-600 dark:text-indigo-400';
        iconHtml = `<i data-lucide="arrow-left-right" class="w-4 h-4"></i>`;
        iconBg = 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400';
        subtitle = `${getWalletName(tx.walletId)} → ${getWalletName(tx.toWalletId)}`;
    }

    return `
    <div class="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3 shadow-sm">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0">
          ${iconHtml}
        </div>
        <div class="min-w-0">
          <p class="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">${tx.name}</p>
          <p class="text-[11px] text-slate-400 truncate">${subtitle}</p>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span class="font-extrabold text-xs sm:text-sm ${amountColor}">${sign} ${formatMoney(tx.amountIDR)}</span>
        ${allowDelete ? `
          <button onclick="deleteTransaction('${tx.id}')" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition" title="${t('deleteTitle')}">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

// ==================== TRANSACTION MODAL & CALCULATOR ====================
function openTransactionModal() {
    calcExpression = '0';
    document.getElementById('tx-amount-display').value = '0';
    document.getElementById('calc-expression-preview').textContent = '';
    document.getElementById('tx-name').value = '';
    document.getElementById('tx-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('tx-currency-symbol').textContent = appState.settings.currency === 'IDR' ? 'Rp' : '$';

    populateWalletSelects();
    renderCategoryGrid();
    setTxType('expense');
    document.getElementById('tx-modal').classList.remove('hidden');
    lucide.createIcons();
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function setTxType(type) {
    currentTxType = type;
    const tabs = ['expense', 'income', 'transfer'];
    const activeColors = {
        expense: 'bg-rose-500 text-white',
        income: 'bg-emerald-500 text-white',
        transfer: 'bg-indigo-600 text-white'
    };

    tabs.forEach(tb => {
        const el = document.getElementById(`tx-tab-${tb}`);
        if (tb === type) {
            el.className = `py-2 text-xs font-bold rounded-xl shadow-sm transition ${activeColors[tb]}`;
        } else {
            el.className = 'py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-300 transition';
        }
    });

    const catGroup = document.getElementById('tx-category-group');
    const toWalletGroup = document.getElementById('tx-wallet-to-group');
    const fromLabel = document.getElementById('tx-wallet-from-label');

    if (type === 'transfer') {
        catGroup.classList.add('hidden');
        toWalletGroup.classList.remove('hidden');
        fromLabel.textContent = t('fromWalletLabel');
    } else {
        catGroup.classList.remove('hidden');
        toWalletGroup.classList.add('hidden');
        fromLabel.textContent = t('walletLabel');
    }
}

function renderCategoryGrid() {
    const grid = document.getElementById('tx-category-grid');
    grid.innerHTML = CATEGORIES.map(cat => {
        const active = selectedCategory === cat.id
            ? 'ring-2 ring-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60'
            : 'bg-slate-50 dark:bg-slate-800/70';
        return `
      <button type="button" onclick="selectCategory('${cat.id}')" class="p-2 rounded-xl flex flex-col items-center gap-1 transition ${active}">
        <div class="w-7 h-7 rounded-lg ${cat.color} flex items-center justify-center">
          <i data-lucide="${cat.icon}" class="w-3.5 h-3.5"></i>
        </div>
        <span class="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate w-full text-center">${t(cat.labelKey)}</span>
      </button>
    `;
    }).join('');
}

function selectCategory(catId) {
    selectedCategory = catId;
    renderCategoryGrid();
    lucide.createIcons();
}

function populateWalletSelects() {
    const options = appState.wallets.map(w => `<option value="${w.id}">${w.name} (${formatMoney(w.balanceIDR, true)})</option>`).join('');
    ['tx-wallet-from', 'tx-wallet-to', 'topup-wallet-select', 'debt-wallet-select'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = options;
    });
    const toEl = document.getElementById('tx-wallet-to');
    if (toEl && appState.wallets.length > 1) {
        toEl.selectedIndex = 1;
    }
}

function toggleCalculator() {
    document.getElementById('calc-keypad').classList.toggle('hidden');
}

function calcInput(key) {
    const display = document.getElementById('tx-amount-display');
    const preview = document.getElementById('calc-expression-preview');

    if (key === 'AC') {
        calcExpression = '0';
        preview.textContent = '';
        display.value = '0';
        return;
    }

    if (key === 'BACK') {
        calcExpression = calcExpression.length > 1 ? calcExpression.slice(0, -1) : '0';
        display.value = calcExpression;
        return;
    }

    if (key === '=') {
        try {
            const sanitized = calcExpression.replace(/×/g, '*').replace(/÷/g, '/');
            if (/^[0-9+\-*/.() ]+$/.test(sanitized)) {
                const result = Function('"use strict";return (' + sanitized + ')')();
                const roundedResult = Math.round(result * 100) / 100;
                if (!Number.isFinite(result) || !Number.isFinite(roundedResult)) {
                    throw new RangeError('Calculator result must be finite.');
                }
                const rounded = Math.max(0, roundedResult);
                preview.textContent = calcExpression + ' =';
                calcExpression = String(rounded);
                display.value = calcExpression;
            }
        } catch {
            display.value = '0';
            calcExpression = '0';
        }
        return;
    }

    const operators = ['+', '-', '×', '÷'];
    if (calcExpression === '0' && !operators.includes(key) && key !== '.') {
        calcExpression = key === '000' ? '0' : key;
    } else {
        const lastChar = calcExpression.slice(-1);
        if (operators.includes(lastChar) && operators.includes(key)) {
            calcExpression = calcExpression.slice(0, -1) + key;
        } else {
            calcExpression += key;
        }
    }
    display.value = calcExpression;
}

function saveTransaction(e) {
    e.preventDefault();
    // Auto-evaluate if expression still has operators
    calcInput('=');
    const rawVal = parseFloat(document.getElementById('tx-amount-display').value) || 0;
    if (rawVal <= 0) {
        showToast(t('toastInvalidAmount'), 'error');
        return;
    }

    const amountIDR = inputToIDR(rawVal);
    const name = document.getElementById('tx-name').value.trim();
    const walletId = document.getElementById('tx-wallet-from').value;
    const toWalletId = document.getElementById('tx-wallet-to').value;
    const date = document.getElementById('tx-date').value;

    if (currentTxType === 'transfer' && walletId === toWalletId) {
        showToast(t('toastSameWallet'), 'error');
        return;
    }

    const fromWallet = appState.wallets.find(w => w.id === walletId);
    if (currentTxType === 'expense') {
        fromWallet.balanceIDR -= amountIDR;
    } else if (currentTxType === 'income') {
        fromWallet.balanceIDR += amountIDR;
    } else if (currentTxType === 'transfer') {
        const toWallet = appState.wallets.find(w => w.id === toWalletId);
        fromWallet.balanceIDR -= amountIDR;
        toWallet.balanceIDR += amountIDR;
    }

    appState.transactions.unshift({
        id: 'tx_' + Date.now(),
        type: currentTxType,
        name,
        amountIDR,
        category: currentTxType === 'transfer' ? 'transfer' : selectedCategory,
        walletId,
        toWalletId: currentTxType === 'transfer' ? toWalletId : null,
        date
    });

    saveState();
    closeModal('tx-modal');
    showToast(t('toastTxSaved'));
    renderAll();
}

function deleteTransaction(txId) {
    const idx = appState.transactions.findIndex(tx => tx.id === txId);
    if (idx === -1) return;
    const tx = appState.transactions[idx];

    const fromWallet = appState.wallets.find(w => w.id === tx.walletId);
    if (fromWallet) {
        if (tx.type === 'expense') fromWallet.balanceIDR += tx.amountIDR;
        if (tx.type === 'income') fromWallet.balanceIDR -= tx.amountIDR;
        if (tx.type === 'transfer') {
            fromWallet.balanceIDR += tx.amountIDR;
            const toWallet = appState.wallets.find(w => w.id === tx.toWalletId);
            if (toWallet) toWallet.balanceIDR -= tx.amountIDR;
        }
    }

    appState.transactions.splice(idx, 1);
    saveState();
    showToast(t('toastTxDeleted'));
    renderAll();
}

// ==================== WALLET & SAFE BUDGET MODALS ====================
function openAddWalletModal() {
    document.getElementById('new-wallet-name').value = '';
    document.getElementById('wallet-modal').classList.remove('hidden');
    lucide.createIcons();
}

function saveNewWallet(e) {
    e.preventDefault();
    const name = document.getElementById('new-wallet-name').value.trim();
    const color = document.getElementById('new-wallet-color').value;

    appState.wallets.push({
        id: 'w_' + Date.now(),
        name,
        balanceIDR: 0,
        color,
        icon: 'wallet'
    });

    saveState();
    closeModal('wallet-modal');
    showToast(t('toastWalletAdded'));
    renderAll();
}

function openSafeBudgetModal() {
    document.getElementById('safe-total-input').value = idrToInput(appState.safeBudget.totalBudgetIDR);
    document.getElementById('safe-days-input').value = appState.safeBudget.days;
    document.getElementById('safe-budget-modal').classList.remove('hidden');
    lucide.createIcons();
}

function saveSafeBudget(e) {
    e.preventDefault();
    const totalVal = parseFloat(document.getElementById('safe-total-input').value) || 0;
    const days = parseInt(document.getElementById('safe-days-input').value) || 1;
    appState.safeBudget = {
        totalBudgetIDR: inputToIDR(totalVal),
        days: Math.max(1, days)
    };
    saveState();
    closeModal('safe-budget-modal');
    showToast(t('toastBudgetUpdated'));
    renderHome();
    lucide.createIcons();
}

// ==================== RENDERING: HISTORY ====================
function populateHistoryFilters() {
    const monthSel = document.getElementById('filter-month');
    const prevMonth = monthSel.value;
    const months = [...new Set(appState.transactions.map(tx => tx.date.slice(0, 7)))].sort().reverse();
    monthSel.innerHTML = `<option value="all">${t('allMonths')}</option>` +
        months.map(m => `<option value="${m}">${m}</option>`).join('');
    if (months.includes(prevMonth)) monthSel.value = prevMonth;

    const walletSel = document.getElementById('filter-wallet');
    const prevWallet = walletSel.value;
    walletSel.innerHTML = `<option value="all">${t('allWallets')}</option>` +
        appState.wallets.map(w => `<option value="${w.id}">${w.name}</option>`).join('');
    if (appState.wallets.some(w => w.id === prevWallet)) walletSel.value = prevWallet;
}

function renderHistory() {
    populateHistoryFilters();
    const query = document.getElementById('history-search').value.toLowerCase().trim();
    const fMonth = document.getElementById('filter-month').value;
    const fType = document.getElementById('filter-type').value;
    const fWallet = document.getElementById('filter-wallet').value;

    const filtered = appState.transactions.filter(tx => {
        const matchName = tx.name.toLowerCase().includes(query);
        const matchMonth = fMonth === 'all' || tx.date.startsWith(fMonth);
        const matchType = fType === 'all' || tx.type === fType;
        const matchWallet = fWallet === 'all' || tx.walletId === fWallet || tx.toWalletId === fWallet;
        return matchName && matchMonth && matchType && matchWallet;
    }).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

    document.getElementById('history-count-badge').textContent = filtered.length;
    const container = document.getElementById('history-grouped-list');

    if (filtered.length === 0) {
        container.innerHTML = renderEmptyState('search-x', t('noTransactions'), t('noTransactionsDesc'));
        lucide.createIcons();
        return;
    }

    // Group by date
    const groups = {};
    filtered.forEach(tx => {
        if (!groups[tx.date]) groups[tx.date] = [];
        groups[tx.date].push(tx);
    });

    container.innerHTML = Object.keys(groups).map(date => `
    <div class="space-y-2">
      <div class="flex items-center justify-between px-1">
        <span class="text-xs font-extrabold text-slate-500 dark:text-slate-400">${date}</span>
        <span class="text-[11px] font-semibold text-slate-400">${groups[date].length} ${t('itemCount')}</span>
      </div>
      <div class="space-y-2">
        ${groups[date].map(tx => renderTransactionCard(tx, true)).join('')}
      </div>
    </div>
  `).join('');

    lucide.createIcons();
}

// ==================== GOALS & RECEIVABLES (PIUTANG) ====================
function switchGoalsTab(tab) {
    const goalsBtn = document.getElementById('subtab-goals-btn');
    const debtsBtn = document.getElementById('subtab-debts-btn');
    const goalsPanel = document.getElementById('goals-panel');
    const debtsPanel = document.getElementById('debts-panel');

    if (tab === 'goals') {
        goalsBtn.className = 'py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm transition';
        debtsBtn.className = 'py-2.5 text-xs font-bold rounded-xl text-slate-500 dark:text-slate-400 transition';
        goalsPanel.classList.remove('hidden');
        debtsPanel.classList.add('hidden');
    } else {
        debtsBtn.className = 'py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm transition';
        goalsBtn.className = 'py-2.5 text-xs font-bold rounded-xl text-slate-500 dark:text-slate-400 transition';
        debtsPanel.classList.remove('hidden');
        goalsPanel.classList.add('hidden');
    }
}

function renderGoalsAndDebts() {
    // Render Goals
    const goalsList = document.getElementById('goals-list');
    if (appState.goals.length === 0) {
        goalsList.innerHTML = renderEmptyState('target', t('noGoals'), t('noGoalsDesc'));
    } else {
        goalsList.innerHTML = appState.goals.map(g => {
            const pct = g.targetIDR > 0 ? Math.min(100, Math.round((g.savedIDR / g.targetIDR) * 100)) : 0;
            const summaryText = t('collectedOf')
                .replace('{saved}', formatMoney(g.savedIDR))
                .replace('{target}', formatMoney(g.targetIDR));

            return `
        <div class="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-3">
          <div class="flex items-start justify-between">
            <div>
              <h4 class="font-extrabold text-sm text-slate-800 dark:text-slate-100">${g.name}</h4>
              <p class="text-[11px] text-slate-400 mt-0.5">${t('deadlinePrefix')} ${g.deadline}</p>
            </div>
            <span class="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold">${pct}%</span>
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">${summaryText}</p>
            <div class="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full bg-indigo-600 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
            </div>
          </div>
          <button onclick="openTopupGoalModal('${g.id}')" class="w-full py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 font-bold text-xs transition">
            + ${t('topupBtn')}
          </button>
        </div>
      `;
        }).join('');
    }

    // Render Receivables (Debts)
    const debtsList = document.getElementById('debts-list');
    if (appState.debts.length === 0) {
        debtsList.innerHTML = renderEmptyState('hand-coins', t('noDebts'), t('noDebtsDesc'));
    } else {
        debtsList.innerHTML = appState.debts.map(d => {
            const badgeClass = d.paid
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400';
            return `
        <div class="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-3">
          <div class="flex items-start justify-between">
            <div>
              <h4 class="font-extrabold text-sm text-slate-800 dark:text-slate-100">${d.person}</h4>
              <p class="text-[11px] text-slate-400 mt-0.5">${getWalletName(d.walletId)} • ${t('duePrefix')} ${d.dueDate}</p>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[11px] font-bold ${badgeClass}">
              ${d.paid ? t('paidBadge') : t('unpaidBadge')}
            </span>
          </div>
          <div class="flex items-center justify-between pt-1">
            <span class="text-base font-extrabold text-slate-900 dark:text-white">${formatMoney(d.amountIDR)}</span>
            ${!d.paid ? `
              <button onclick="markDebtPaid('${d.id}')" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition">
                ✓ ${t('markPaidBtn')}
              </button>
            ` : ''}
          </div>
        </div>
      `;
        }).join('');
    }

    lucide.createIcons();
}

function openAddGoalModal() {
    document.getElementById('goal-name-input').value = '';
    document.getElementById('goal-target-input').value = '';
    document.getElementById('goal-deadline-input').value = new Date().toISOString().slice(0, 10);
    document.getElementById('goal-modal').classList.remove('hidden');
    lucide.createIcons();
}

function saveNewGoal(e) {
    e.preventDefault();
    const name = document.getElementById('goal-name-input').value.trim();
    const targetVal = parseFloat(document.getElementById('goal-target-input').value) || 0;
    const deadline = document.getElementById('goal-deadline-input').value;

    if (targetVal <= 0) {
        showToast(t('toastInvalidAmount'), 'error');
        return;
    }

    appState.goals.push({
        id: 'goal_' + Date.now(),
        name,
        targetIDR: inputToIDR(targetVal),
        savedIDR: 0,
        deadline
    });

    saveState();
    closeModal('goal-modal');
    showToast(t('toastGoalAdded'));
    renderGoalsAndDebts();
}

function openTopupGoalModal(goalId) {
    const goal = appState.goals.find(g => g.id === goalId);
    if (!goal) return;
    document.getElementById('topup-goal-id').value = goalId;
    document.getElementById('topup-goal-title-label').textContent = goal.name;
    document.getElementById('topup-amount-input').value = '';
    populateWalletSelects();
    document.getElementById('topup-goal-modal').classList.remove('hidden');
    lucide.createIcons();
}

function submitGoalTopup(e) {
    e.preventDefault();
    const goalId = document.getElementById('topup-goal-id').value;
    const amountVal = parseFloat(document.getElementById('topup-amount-input').value) || 0;
    const walletId = document.getElementById('topup-wallet-select').value;

    if (amountVal <= 0) {
        showToast(t('toastInvalidAmount'), 'error');
        return;
    }

    const amountIDR = inputToIDR(amountVal);
    const goal = appState.goals.find(g => g.id === goalId);
    const wallet = appState.wallets.find(w => w.id === walletId);

    if (goal && wallet) {
        wallet.balanceIDR -= amountIDR;
        goal.savedIDR += amountIDR;
    }

    saveState();
    closeModal('topup-goal-modal');
    showToast(t('toastGoalTopup'));
    renderAll();
}

function openAddDebtModal() {
    document.getElementById('debt-person-input').value = '';
    document.getElementById('debt-amount-input').value = '';
    document.getElementById('debt-due-input').value = new Date().toISOString().slice(0, 10);
    populateWalletSelects();
    document.getElementById('debt-modal').classList.remove('hidden');
    lucide.createIcons();
}

function saveNewDebt(e) {
    e.preventDefault();
    const person = document.getElementById('debt-person-input').value.trim();
    const amountVal = parseFloat(document.getElementById('debt-amount-input').value) || 0;
    const dueDate = document.getElementById('debt-due-input').value;
    const walletId = document.getElementById('debt-wallet-select').value;

    if (amountVal <= 0) {
        showToast(t('toastInvalidAmount'), 'error');
        return;
    }

    const amountIDR = inputToIDR(amountVal);
    const wallet = appState.wallets.find(w => w.id === walletId);
    if (wallet) {
        wallet.balanceIDR -= amountIDR;
    }

    appState.debts.unshift({
        id: 'debt_' + Date.now(),
        person,
        amountIDR,
        dueDate,
        walletId,
        paid: false
    });

    saveState();
    closeModal('debt-modal');
    showToast(t('toastDebtAdded'));
    renderAll();
}

function markDebtPaid(debtId) {
    const debt = appState.debts.find(d => d.id === debtId);
    if (!debt || debt.paid) return;

    debt.paid = true;
    const wallet = appState.wallets.find(w => w.id === debt.walletId);
    if (wallet) {
        wallet.balanceIDR += debt.amountIDR;
    }

    saveState();
    showToast(t('toastDebtPaid'));
    renderAll();
}

// ==================== REPORT & ACCOUNT ====================
function renderReport() {
    const monthSelect = document.getElementById('report-month-select');
    const currentYM = new Date().toISOString().slice(0, 7);
    const months = [...new Set([currentYM, ...appState.transactions.map(tx => tx.date.slice(0, 7))])].sort().reverse();
    const selected = months.includes(monthSelect.value) ? monthSelect.value : currentYM;

    monthSelect.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join('');
    monthSelect.value = selected;

    let income = 0;
    let expense = 0;
    const catTotals = {};

    appState.transactions.forEach(tx => {
        if (tx.date.startsWith(selected)) {
            if (tx.type === 'income') income += tx.amountIDR;
            if (tx.type === 'expense') {
                expense += tx.amountIDR;
                catTotals[tx.category] = (catTotals[tx.category] || 0) + tx.amountIDR;
            }
        }
    });

    document.getElementById('report-income').textContent = formatMoney(income);
    document.getElementById('report-expense').textContent = formatMoney(expense);
    const net = income - expense;
    document.getElementById('report-net-diff').textContent = (net >= 0 ? '+' : '') + formatMoney(net);

    const totalFlow = income + expense;
    const incPct = totalFlow > 0 ? (income / totalFlow) * 100 : 50;
    const expPct = totalFlow > 0 ? (expense / totalFlow) * 100 : 50;
    document.getElementById('report-income-bar').style.width = `${incPct}%`;
    document.getElementById('report-expense-bar').style.width = `${expPct}%`;

    // Category Breakdown
    const catList = document.getElementById('category-breakdown-list');
    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

    if (sortedCats.length === 0) {
        catList.innerHTML = `<p class="text-xs text-slate-400 text-center py-4">${t('noExpenseData')}</p>`;
    } else {
        catList.innerHTML = sortedCats.map(([catId, val]) => {
            const cat = CATEGORIES.find(c => c.id === catId) || CATEGORIES[7];
            const pct = expense > 0 ? Math.round((val / expense) * 100) : 0;
            return `
        <div class="space-y-1">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <i data-lucide="${cat.icon}" class="w-3.5 h-3.5 text-indigo-500"></i>
              ${t(cat.labelKey)}
            </span>
            <span class="font-bold text-slate-600 dark:text-slate-300">${formatMoney(val)} (${pct}%)</span>
          </div>
          <div class="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-indigo-600 rounded-full" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
        }).join('');
    }

    // Sync Account Settings Inputs
    document.getElementById('settings-username-input').value = appState.user.name;
    document.getElementById('settings-currency-select').value = appState.settings.currency;
    document.getElementById('settings-lang-select').value = appState.settings.lang;

    lucide.createIcons();
}

function updateProfileName() {
    const val = document.getElementById('settings-username-input').value.trim();
    if (val) {
        appState.user.name = val;
        saveState();
        showToast(t('toastProfileSaved'));
        renderAll();
    }
}

// ==================== DATA EXPORT, BACKUP, RESTORE, RESET ====================
function exportToCSV() {
    const headers = ['ID', 'Date', 'Type', 'Name', 'Category', 'Wallet', 'Amount_IDR', 'Amount_USD'];
    const rows = appState.transactions.map(tx => [
        tx.id,
        tx.date,
        tx.type,
        `"${tx.name.replace(/"/g, '""')}"`,
        tx.category,
        `"${getWalletName(tx.walletId)}"`,
        Math.round(tx.amountIDR),
        (tx.amountIDR / USD_RATE).toFixed(2)
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csv, `sakupintar-report-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
    showToast(t('toastCsvExported'));
}

function backupJSON() {
    const json = JSON.stringify(appState, null, 2);
    downloadFile(json, `sakupintar-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    showToast(t('toastJsonBackup'));
}

function restoreJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
        try {
            const parsed = JSON.parse(ev.target.result);
            if (parsed && Array.isArray(parsed.wallets) && Array.isArray(parsed.transactions)) {
                appState = parsed;
                saveState();
                applyTheme();
                applyTranslations();
                renderAll();
                showToast(t('toastJsonRestored'));
            } else {
                showToast(t('toastJsonError'), 'error');
            }
        } catch {
            showToast(t('toastJsonError'), 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function openResetModal() {
    document.getElementById('reset-modal').classList.remove('hidden');
    lucide.createIcons();
}

function confirmResetAll() {
    const currentUser = appState.user;
    const currentSettings = appState.settings;
    appState = getDefaultData();
    appState.isLoggedIn = true;
    appState.user = currentUser;
    appState.settings = currentSettings;
    saveState();
    closeModal('reset-modal');
    showToast(t('toastResetDone'));
    renderAll();
}

// ==================== INITIALIZATION ====================
function renderAll() {
    applyTranslations();
    renderHome();
    renderHistory();
    renderGoalsAndDebts();
    renderReport();
    lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => {
    switchAuthTab('login');
    applyTheme();
    applyTranslations();
    checkAuth();
});