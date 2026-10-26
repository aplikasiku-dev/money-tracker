// SIMULASI DATABASE & STATE MANAGEMENT
const GUEST_SESSION_KEYS = ['isLoggedIn', 'userName', 'guestUserData'];
const GUEST_NAME = 'Tamu Spesial';

function clearGuestSessionOnPageLoad() {
    const guestSessionActive = sessionStorage.getItem('isLoggedIn') === 'true' &&
        (sessionStorage.getItem('guestUserData') !== null || sessionStorage.getItem('userName') === GUEST_NAME);
    if (guestSessionActive) {
        GUEST_SESSION_KEYS.forEach(key => sessionStorage.removeItem(key));
        sessionStorage.setItem('guestSessionExpired', 'true');
    }
    return guestSessionActive || sessionStorage.getItem('guestSessionExpired') === 'true';
}

const guestSessionExpired = clearGuestSessionOnPageLoad();

let usersDB = JSON.parse(localStorage.getItem('fintech_users') || '[]');
let currentUser = guestSessionExpired ? null : loadActiveUser();
let isGuestMode = false;
let isAuthRegisterMode = false;
let isBalanceSensorHidden = false;
let calculatorDisplayValue = '0';
let calculatorStoredValue = null;
let calculatorPendingOperator = null;
let calculatorWaitingForOperand = false;
const savedCurrency = localStorage.getItem('fintech_currency');
let currentCurrency = savedCurrency === 'IDR' ? 'IDR' : 'USD';
const savedCardTheme = localStorage.getItem('fintech_card_theme');
let currentCardTheme = ['black', 'blue', 'green', 'gold'].includes(savedCardTheme) ? savedCardTheme : 'blue';
const savedLanguage = localStorage.getItem('fintech_language');
let currentLanguage = savedLanguage === 'en' ? 'en' : 'id';
let displayedCalendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let appConfig = null;
let historyTypeFilter = 'all';
let activeHistoryFilter = 'all';

const translations = {
    en: {
        welcome: 'Hello,', logout: 'Logout', availableBalance: 'Available Balance', cardNumber: 'Card Number', validThru: 'Valid Thru',
        addExpense: '+ Add Expense', addIncome: '+ Add Income', spendingBreakdown: 'Spending Breakdown', totalSpent: 'Total Spent',
        recentTransactions: 'Recent Transactions', seeAll: 'See All', expensesList: 'Expenses List', thisMonth: 'This Month',
        allCategories: 'All Categories', financialReport: 'Financial Report',
        totalSalary: 'Total Salary', totalExpense: 'Total Expense', expenseBreakdown: 'Expense Breakdown',
        account: 'Account', accountSubtitle: 'Manage your profile and security settings.', profile: 'Profile',
        profileSubtitle: 'View and edit your personal details', changePassword: 'Change Password',
        passwordSubtitle: 'Update your account password', fullName: 'Full Name', userId: 'Student ID / User ID',
        faculty: 'Faculty / Category', birthPlace: 'Place of Birth', birthDateAge: 'Date of Birth / Age',
        dateOfBirth: 'Date of Birth', age: 'Age', editProfile: 'Edit Profile', saveChanges: 'Save Changes', close: 'Close',
        currentPassword: 'Current Password', newPassword: 'New Password', confirmPassword: 'Confirm New Password',
        updatePassword: 'Update Password', home: 'Home', history: 'History', report: 'Report',
        transactionTitle: 'Add New Transaction', expenseTitle: 'Add New Expense', incomeTitle: 'Add New Income',
        expense: 'Expense', income: 'Income', amount: 'Amount', transactionName: 'Transaction Name',
        category: 'Category', paymentMethod: 'Payment Method', uangKu: 'MY MONEY', selectPaymentMethod: 'Select payment method',
        cash: 'Cash', transferTf: 'Transfer / Tf', savingsGoal: 'Savings Goal',
        savingsGoalName: 'Goal Name', savingsGoalPlaceholder: 'Example: New Laptop / Vacation',
        savingsGoalAmount: 'Goal Amount (Rp)', saveGoal: 'Save Goal',
        saveTransaction: 'Save Transaction', calculator: 'Amount Calculator',
        goalProgress: 'GOAL PROGRESS', goalAmount: 'GOAL AMOUNT',
        liveUpdates: 'Live updates', noFilteredTransactions: 'No transactions match this filter.',
        confirmDeleteTransaction: 'Are you sure you want to delete "{title}" ({amount})? Your balance will be adjusted.',
        allocated: 'Allocated', foodDrinks: 'Food & Drinks', transport: 'Transport', shopping: 'Shopping', other: 'Other',
        ageYears: 'years old',
        noValue: 'Not provided', invalidBirthDate: 'Date of birth cannot be in the future.',
        invalidAge: 'Enter an age between 1 and 130.',
        incorrectPassword: 'Current password is incorrect.', passwordMismatch: 'New passwords do not match.',
        passwordUpdated: 'Password updated successfully.', passwordUpdateFailed: 'Could not save the password. Please try again.',
        passwordTooShort: 'New password must be at least 6 characters.', changesSaveFailed: 'Could not save changes. Please try again.'
    },
    id: {
        welcome: 'Halo,', logout: 'Keluar', availableBalance: 'Saldo Tersedia', cardNumber: 'Nomor Kartu', validThru: 'Berlaku Hingga',
        addExpense: '+ Tambah Pengeluaran', addIncome: '+ Tambah Pemasukan', spendingBreakdown: 'Rincian Pengeluaran',
        totalSpent: 'Total Pengeluaran', recentTransactions: 'Transaksi Terbaru', seeAll: 'Lihat Semua',
        expensesList: 'Daftar Transaksi', thisMonth: 'Bulan Ini', allCategories: 'Semua Kategori',
        financialReport: 'Laporan Keuangan', totalSalary: 'Total Pemasukan',
        totalExpense: 'Total Pengeluaran', expenseBreakdown: 'Rincian Pengeluaran',
        account: 'Akun', accountSubtitle: 'Kelola profil dan pengaturan keamanan Anda.', profile: 'Profil',
        profileSubtitle: 'Lihat dan ubah detail pribadi Anda', changePassword: 'Ganti Kata Sandi',
        passwordSubtitle: 'Perbarui kata sandi akun Anda', fullName: 'Nama Lengkap', userId: 'ID Mahasiswa / ID Pengguna',
        faculty: 'Fakultas / Kategori', birthPlace: 'Tempat Lahir', birthDateAge: 'Tanggal Lahir / Umur',
        dateOfBirth: 'Tanggal Lahir', age: 'Umur / Usia', editProfile: 'Edit Profil', saveChanges: 'Simpan Perubahan', close: 'Tutup',
        currentPassword: 'Kata Sandi Lama', newPassword: 'Kata Sandi Baru', confirmPassword: 'Konfirmasi Kata Sandi Baru',
        updatePassword: 'Perbarui Kata Sandi', home: 'Beranda', history: 'Riwayat', report: 'Laporan',
        transactionTitle: 'Tambah Transaksi Baru', expenseTitle: 'Tambah Pengeluaran Baru', incomeTitle: 'Tambah Pemasukan Baru',
        expense: 'Pengeluaran', income: 'Pemasukan', amount: 'Jumlah Nominal', transactionName: 'Nama / Judul Transaksi',
        category: 'Kategori', paymentMethod: 'Metode Pembayaran', uangKu: 'UANG KU', selectPaymentMethod: 'Pilih metode pembayaran',
        cash: 'Tunai (Cash)', transferTf: 'Transfer / Tf', savingsGoal: 'Target Nabung',
        savingsGoalName: 'Nama Target', savingsGoalPlaceholder: 'Contoh: Beli Laptop / Liburan',
        savingsGoalAmount: 'Nominal Target (Rp)', saveGoal: 'Simpan Target',
        saveTransaction: 'Simpan Transaksi', calculator: 'Kalkulator Nominal',
        goalProgress: 'PROGRES TARGET', goalAmount: 'NOMINAL TARGET',
        liveUpdates: 'Diperbarui langsung', noFilteredTransactions: 'Tidak ada transaksi yang sesuai dengan filter ini.',
        confirmDeleteTransaction: 'Apakah Anda yakin ingin menghapus "{title}" ({amount})? Saldo akan disesuaikan.',
        allocated: 'Dialokasikan', foodDrinks: 'Makanan & Minuman', transport: 'Transportasi', shopping: 'Belanja', other: 'Lainnya',
        ageYears: 'tahun',
        noValue: 'Belum diisi', invalidBirthDate: 'Tanggal lahir tidak boleh di masa depan.',
        invalidAge: 'Masukkan umur antara 1 sampai 130 tahun.',
        incorrectPassword: 'Kata sandi lama salah.', passwordMismatch: 'Kata sandi baru tidak cocok.',
        passwordUpdated: 'Kata sandi berhasil diperbarui.', passwordUpdateFailed: 'Kata sandi gagal disimpan. Silakan coba lagi.',
        passwordTooShort: 'Kata sandi baru harus terdiri dari minimal 6 karakter.',
        changesSaveFailed: 'Perubahan gagal disimpan. Silakan coba lagi.'
    }
};

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

function translate(key) {
    return translations[currentLanguage][key] || translations.en[key] || key;
}

function getExpenseCategories() {
    return appConfig.categories.filter(category => typeof category.reportKey === 'string');
}

function getExpenseCategoryTotals(transactions) {
    const categories = getExpenseCategories();
    const totals = Object.fromEntries(categories.map(category => [category.reportKey, 0]));
    const otherCategory = categories.find(category => category.value === 'Other');

    transactions.forEach(transaction => {
        if (transaction.type !== 'expense') return;
        const category = appConfig.categories.find(item => item.value === transaction.category);
        const reportKey = category && category.reportKey ? category.reportKey : otherCategory.reportKey;
        totals[reportKey] += Number(transaction.amount) || 0;
    });
    return totals;
}

function populateCategoryOptions(type = 'expense') {
    const select = document.getElementById('txCategory');
    select.replaceChildren();
    const categories = type === 'income'
        ? appConfig.categories.filter(category => category.value === 'Salary')
        : appConfig.categories.filter(category => category.value !== 'Salary');
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.value;
        option.textContent = translate(category.translationKey);
        select.appendChild(option);
    });
}

function renderHomeBreakdown(totals, totalSpent) {
    const container = document.getElementById('homeBreakdownList');
    container.replaceChildren();

    getExpenseCategories().filter(category => category.showInHomeBreakdown).forEach(category => {
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between';
        const percentage = totalSpent > 0
            ? Math.round((totals[category.reportKey] / totalSpent) * 100)
            : 0;
        row.innerHTML = `
            <span class="flex items-center space-x-1.5 text-gray-600">
                <span class="w-2 h-2 rounded-full ${category.reportColor}"></span>
                <span>${translate(category.translationKey)}</span>
            </span>
            <span class="font-semibold text-gray-900">${percentage}%</span>
        `;
        container.appendChild(row);
    });
}

async function loadAppConfig() {
    const response = await fetch('./config.json');
    if (!response.ok) {
        throw new Error(`config.json returned HTTP ${response.status}`);
    }

    const config = await response.json();
    if (!config || !Array.isArray(config.categories) ||
        !config.categories.every(category =>
            category &&
            typeof category.value === 'string' &&
            typeof category.translationKey === 'string'
        ) ||
        !config.categories.some(category =>
            category.value === 'Other' &&
            typeof category.reportKey === 'string' &&
            typeof category.reportColor === 'string'
        ) ||
        new Set(config.categories.map(category => category.value)).size !== config.categories.length) {
        throw new Error('config.json has an invalid categories definition');
    }
    if (config.categories.some(category =>
        category.reportKey !== undefined &&
        (typeof category.reportKey !== 'string' ||
            typeof category.reportColor !== 'string')
    )) {
        throw new Error('config.json has invalid report category settings');
    }
    const reportKeys = config.categories
        .filter(category => typeof category.reportKey === 'string')
        .map(category => category.reportKey);
    if (new Set(reportKeys).size !== reportKeys.length) {
        throw new Error('config.json contains duplicate report keys');
    }

    appConfig = config;
}

function showConfigLoadError(error) {
    console.error('Unable to load app configuration:', error);
    const message = document.createElement('p');
    message.className = 'mx-6 mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700';
    message.setAttribute('role', 'alert');
    message.textContent = 'Konfigurasi kategori gagal dimuat. Jalankan aplikasi melalui server lokal (HTTP), lalu muat ulang halaman.';
    document.getElementById('authScreen').appendChild(message);
    document.querySelectorAll('#authScreen input, #authScreen button').forEach(element => {
        element.disabled = true;
    });
}

function applyLanguage() {
    document.documentElement.lang = currentLanguage;
    document.getElementById('languageSelector').value = currentLanguage;
    document.querySelectorAll('[data-i18n]').forEach(element => {
        element.textContent = translate(element.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
        const label = translate(element.dataset.i18nAriaLabel);
        element.setAttribute('aria-label', label);
        element.title = label;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        element.placeholder = translate(element.dataset.i18nPlaceholder);
    });
    const isSavingGoal = document.getElementById('txType').value === 'savingsGoal';
    document.querySelector('#transactionForm button[type="submit"]').textContent =
        translate(isSavingGoal ? 'saveGoal' : 'saveTransaction');
    if (appConfig) {
        const currentType = document.getElementById('txType').value;
        populateCategoryOptions(currentType === 'income' ? 'income' : 'expense');
        updatePaymentMethodOptions(currentType === 'income' ? 'income' : 'expense');
    }
    if (currentUser) {
        updateDashboardUI();
        if (!document.getElementById('tabReport').classList.contains('hidden')) {
            renderMiniCalendar();
            updateReportUI();
        }
    }
}

function translateCategory(category) {
    const categoryConfig = appConfig.categories.find(item => item.value === category);
    return categoryConfig ? translate(categoryConfig.translationKey) : category;
}

function createUserId() {
    return `USR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function calculateAge(birthDate) {
    const birth = new Date(`${birthDate}T00:00:00`);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function ensureUserProfile() {
    let needsSave = false;
    if (!currentUser.userId) {
        currentUser.userId = createUserId();
        needsSave = true;
    }
    if (!Object.prototype.hasOwnProperty.call(currentUser, 'age')) {
        const ageFromBirthDate = currentUser.birthDate ? calculateAge(currentUser.birthDate) : null;
        currentUser.age = ageFromBirthDate !== null && ageFromBirthDate >= 1 && ageFromBirthDate <= 130
            ? ageFromBirthDate
            : '';
        needsSave = true;
    } else if (currentUser.age !== '' &&
        (!Number.isInteger(currentUser.age) || currentUser.age < 1 || currentUser.age > 130)) {
        currentUser.age = '';
        needsSave = true;
    }
    if (needsSave) saveUserData();
}

function toggleAccountPanel(panelId) {
    const panel = document.getElementById(panelId);
    const willOpen = panel.classList.contains('hidden');
    document.querySelectorAll('.account-inline-panel').forEach(item => item.classList.add('hidden'));
    document.querySelectorAll('.account-menu-item[aria-controls]').forEach(button => {
        button.setAttribute('aria-expanded', String(button.getAttribute('aria-controls') === panelId && willOpen));
    });
    if (willOpen) {
        panel.classList.remove('hidden');
        if (panelId === 'profilePanel') {
            document.getElementById('profileIdValue').textContent = currentUser.userId;
            document.getElementById('editProfileName').value = currentUser.name || '';
            document.getElementById('editProfileAge').value = currentUser.age || '';
        } else {
            document.getElementById('passwordForm').reset();
            document.getElementById('passwordFormMessage').classList.add('hidden');
        }
    }
}

function formatMoney(amount) {
    const value = Number(amount);
    if (currentCurrency === 'IDR') {
        return `Rp ${value.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
    }
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatRupiah(amount) {
    return `Rp ${Number(amount).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
}

function updateDigitalClock() {
    const clock = document.getElementById('digitalClock');
    if (!clock) return;
    const time = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).format(new Date());
    clock.textContent = `${time} WIB`;
}

function parseTransactionAmount(value) {
    const normalizedValue = currentCurrency === 'IDR'
        ? value.replace(/\./g, '')
        : value.replace(/,/g, '');
    return normalizedValue.trim() ? Number(normalizedValue) : NaN;
}

function formatTransactionAmountValue(value) {
    if (currentCurrency === 'IDR') {
        return value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    const sanitizedValue = value.replace(/,/g, '').replace(/[^\d.]/g, '');
    const decimalIndex = sanitizedValue.indexOf('.');
    const integerDigits = (decimalIndex === -1 ? sanitizedValue : sanitizedValue.slice(0, decimalIndex));
    const fractionDigits = decimalIndex === -1 ? '' : sanitizedValue.slice(decimalIndex + 1).replace(/\./g, '').slice(0, 2);
    const groupedInteger = integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const integerPart = groupedInteger || (decimalIndex !== -1 ? '0' : '');
    return decimalIndex === -1 ? integerPart : `${integerPart}.${fractionDigits}`;
}

function formatTransactionAmountInput() {
    const input = document.getElementById('txAmount');
    const originalValue = input.value;
    const originalCaret = input.selectionStart === null ? originalValue.length : input.selectionStart;
    const semanticCharacters = currentCurrency === 'IDR' ? /\d/g : /[\d.]/g;
    const charactersBeforeCaret = (originalValue.slice(0, originalCaret).match(semanticCharacters) || []).length;
    const formattedValue = formatTransactionAmountValue(originalValue);
    input.value = formattedValue;

    let nextCaret = 0;
    let charactersSeen = 0;
    for (let index = 0; index < formattedValue.length; index++) {
        const isSemanticCharacter = currentCurrency === 'IDR'
            ? /\d/.test(formattedValue[index])
            : /[\d.]/.test(formattedValue[index]);
        if (isSemanticCharacter) {
            charactersSeen++;
        }
        nextCaret = index + 1;
        if (charactersSeen >= charactersBeforeCaret) break;
    }
    if (charactersBeforeCaret === 0) nextCaret = 0;
    input.setSelectionRange(nextCaret, nextCaret);
}

function updateCurrencyLabel() {
    document.getElementById('txCurrencyLabel').textContent = currentCurrency === 'IDR' ? 'Rp' : '$';
    const amountInput = document.getElementById('txAmount');
    amountInput.inputMode = currentCurrency === 'IDR' ? 'numeric' : 'decimal';
    amountInput.placeholder = currentCurrency === 'IDR' ? '0' : '0.00';
}

function applyCardTheme() {
    const card = document.getElementById('walletCard');
    card.classList.remove('card-theme-black', 'card-theme-blue', 'card-theme-green', 'card-theme-gold');
    card.classList.add(`card-theme-${currentCardTheme}`);
    document.querySelectorAll('[data-card-theme]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.cardTheme === currentCardTheme));
    });
}

function setCardTheme(theme) {
    if (!['black', 'blue', 'green', 'gold'].includes(theme)) {
        alert("Tema kartu tidak valid.");
        return;
    }
    currentCardTheme = theme;
    localStorage.setItem('fintech_card_theme', currentCardTheme);
    applyCardTheme();
}

function setActiveSession(user) {
    isGuestMode = false;
    sessionStorage.removeItem('guestSessionExpired');
    currentUser = user;
    localStorage.setItem('sesiUserAktif', user.email);
    localStorage.setItem('fintech_current_user', JSON.stringify(user));
}

function loginAsGuest() {
    sessionStorage.removeItem('guestSessionExpired');
    isGuestMode = true;
    currentUser = {
        name: GUEST_NAME,
        email: 'guest@session.local',
        password: '',
        balance: 0,
        transactions: [],
        userId: 'GUEST',
        age: ''
    };
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('userName', GUEST_NAME);
    sessionStorage.setItem('guestUserData', JSON.stringify(currentUser));
    showMainDashboard();
}

// Inisialisasi menunggu konfigurasi kategori dari config.json.
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadAppConfig();
    } catch (error) {
        showConfigLoadError(error);
        return;
    }

    document.getElementById('currencySelector').value = currentCurrency;
    populateCategoryOptions();
    updatePaymentMethodOptions('expense');
    updateCurrencyLabel();
    applyCardTheme();
    applyLanguage();
    updateDigitalClock();
    window.setInterval(updateDigitalClock, 60_000);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) updateDigitalClock();
    });

    if (currentUser) {
        showMainDashboard();
    } else {
        showAuthScreen();
    }
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('btnGuest').addEventListener('click', loginAsGuest);

    document.getElementById('languageSelector').addEventListener('change', event => {
        const selectedLanguage = event.target.value;
        if (!['en', 'id'].includes(selectedLanguage)) {
            alert("Language selection is invalid.");
            event.target.value = currentLanguage;
            return;
        }
        currentLanguage = selectedLanguage;
        localStorage.setItem('fintech_language', currentLanguage);
        applyLanguage();
    });

    document.getElementById('currencySelector').addEventListener('change', (event) => {
        const selectedCurrency = event.target.value;
        if (!['USD', 'IDR'].includes(selectedCurrency)) {
            alert("Pilihan mata uang tidak valid.");
            event.target.value = currentCurrency;
            return;
        }

        const amountInput = document.getElementById('txAmount');
        const currentAmount = parseTransactionAmount(amountInput.value);
        currentCurrency = selectedCurrency;
        localStorage.setItem('fintech_currency', currentCurrency);
        updateCurrencyLabel();
        if (Number.isFinite(currentAmount)) {
            amountInput.value = formatTransactionAmountValue(
                currentCurrency === 'IDR' ? String(Math.round(currentAmount)) : currentAmount.toFixed(2)
            );
        }
        if (currentUser) {
            updateDashboardUI();
            updateReportUI();
        }
    });
    document.getElementById('txAmount').addEventListener('input', formatTransactionAmountInput);
    document.getElementById('savingsGoalAmount').addEventListener('input', event => {
        const digits = event.target.value.replace(/\D/g, '');
        event.target.value = digits ? Number(digits).toLocaleString('id-ID') : '';
    });

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

    document.getElementById('editProfileForm').addEventListener('submit', event => {
        event.preventDefault();
        const age = Number(document.getElementById('editProfileAge').value);
        if (!Number.isInteger(age) || age < 1 || age > 130) {
            alert(translate('invalidAge'));
            return;
        }

        const previousProfile = {
            name: currentUser.name,
            age: currentUser.age
        };
        currentUser.name = document.getElementById('editProfileName').value.trim();
        currentUser.age = age;
        try {
            saveUserData();
        } catch (error) {
            Object.assign(currentUser, previousProfile);
            alert(translate('changesSaveFailed'));
            return;
        }

        document.getElementById('userNameDisplay').textContent = currentUser.name;
        document.getElementById('accountUserName').textContent = currentUser.name;
        document.getElementById('accountAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
        document.getElementById('profileIdValue').textContent = currentUser.userId;
    });

    document.getElementById('passwordForm').addEventListener('submit', event => {
        event.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value.trim();
        const newPassword = document.getElementById('newPassword').value.trim();
        const confirmPassword = document.getElementById('confirmNewPassword').value.trim();
        const message = document.getElementById('passwordFormMessage');
        message.classList.remove('hidden', 'text-emerald-600', 'text-rose-600');
        message.classList.add('text-rose-600');

        if (currentPassword !== currentUser.password) {
            message.textContent = translate('incorrectPassword');
            return;
        }
        if (newPassword !== confirmPassword) {
            message.textContent = translate('passwordMismatch');
            return;
        }
        if (newPassword.length < 6) {
            message.textContent = translate('passwordTooShort');
            return;
        }

        const previousPassword = currentUser.password;
        currentUser.password = newPassword;
        try {
            saveUserData();
        } catch (error) {
            currentUser.password = previousPassword;
            message.textContent = translate('passwordUpdateFailed');
            return;
        }
        message.classList.remove('text-rose-600');
        message.classList.add('text-emerald-600');
        message.textContent = translate('passwordUpdated');
        document.getElementById('passwordForm').reset();
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
    ensureUserProfile();
    
    // Set User Info
    document.getElementById('userNameDisplay').textContent = currentUser.name;
    document.getElementById('accountUserName').textContent = currentUser.name;
    document.getElementById('accountAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
    
    // Set Current Date Header
    applyLanguage();

    updateDashboardUI();
    switchTab('home');
}

function logoutUser() {
    currentUser = null;
    if (isGuestMode) {
        GUEST_SESSION_KEYS.forEach(key => sessionStorage.removeItem(key));
        sessionStorage.setItem('guestSessionExpired', 'true');
        isGuestMode = false;
    }
    localStorage.removeItem('sesiUserAktif');
    localStorage.removeItem('fintech_current_user');
    showAuthScreen();
}

// TAB NAVIGASI UTAMA
function switchTab(tabName) {
    const tabs = ['home', 'history', 'report', 'account'];
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
    updateWalletGoalCard();
}

function updateBalanceDisplay() {
    updateDailyAllowance();
    if (!isBalanceSensorHidden) {
        const balance = currentUser.balance || 0;
        document.getElementById('displayBalance').textContent = formatMoney(balance);
    }
}

function updateDailyAllowance() {
    const allowanceElement = document.getElementById('dailyAllowance');
    const balance = Number(currentUser && currentUser.balance);
    const today = new Date();
    const daysRemaining = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1;
    const dailyAllowance = Number.isFinite(balance) && daysRemaining > 0 ? balance / daysRemaining : 0;
    const warningThreshold = currentCurrency === 'IDR' ? 20000 : 1.5;

    allowanceElement.textContent = isBalanceSensorHidden
        ? `${currentLanguage === 'id' ? 'Jatah aman harian' : 'Safe daily budget'}: ****`
        : `${currentLanguage === 'id' ? 'Jatah aman harian' : 'Safe daily budget'}: ${formatMoney(dailyAllowance)}`;
    allowanceElement.classList.toggle('daily-allowance-warning', !isBalanceSensorHidden && dailyAllowance < warningThreshold);
}

// MODAL TRANSAKSI (TAMBAH PEMASUKAN / PENGELUARAN)
function openTransactionModal(type = 'expense') {
    document.getElementById('transactionModal').classList.remove('hidden');
    if (type === 'savingsGoal' && currentUser.savingsGoal) {
        document.getElementById('savingsGoalName').value = currentUser.savingsGoal.name;
        document.getElementById('savingsGoalAmount').value = Number(currentUser.savingsGoal.amount).toLocaleString('id-ID');
    }
    setModalType(type);
}

function closeTransactionModal() {
    closeCalculator();
    document.getElementById('transactionModal').classList.add('hidden');
    document.getElementById('transactionForm').reset();
}

function openCalculator() {
    const amountInput = document.getElementById('txAmount');
    const initialValue = parseTransactionAmount(amountInput.value);
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
        const calculatorResult = Number(calculatorDisplayValue);
        document.getElementById('txAmount').value = formatTransactionAmountValue(
            currentCurrency === 'IDR' ? String(Math.round(calculatorResult)) : calculatorDisplayValue
        );
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

function updatePaymentMethodOptions(type) {
    const select = document.getElementById('txPaymentMethod');
    const label = document.querySelector('label[for="txPaymentMethod"]');
    const selectedValue = select.value;
    const isIncome = type === 'income';
    const options = isIncome
        ? [
            { value: 'BANK', label: 'BANK' },
            { value: 'E-WALLET', label: 'E-WALLET' },
            { value: 'Cash', label: translate('cash') }
        ]
        : [
            { value: 'Cash', label: translate('cash') },
            { value: 'Transfer / Tf', label: translate('transferTf') },
            { value: 'Other', label: translate('other') }
        ];

    label.textContent = translate(isIncome ? 'uangKu' : 'paymentMethod');
    select.replaceChildren();
    options.forEach(optionData => {
        const option = document.createElement('option');
        option.value = optionData.value;
        option.textContent = optionData.label;
        select.appendChild(option);
    });
    if (options.some(option => option.value === selectedValue)) {
        select.value = selectedValue;
    }
}

function setModalType(type) {
    if (!['income', 'expense', 'savingsGoal'].includes(type)) return;

    const buttons = {
        income: document.getElementById('typeIncomeBtn'),
        expense: document.getElementById('typeExpenseBtn'),
        savingsGoal: document.getElementById('typeSavingsGoalBtn')
    };
    const isSavingsGoal = type === 'savingsGoal';
    const isIncome = type === 'income';
    const regularFields = [
        'transactionAmountFields',
        'transactionTitleField',
        'transactionCategoryField',
        'transactionPaymentMethodField'
    ].map(id => document.getElementById(id));
    const goalFields = document.getElementById('savingsGoalFields');

    document.getElementById('txType').value = type;
    Object.entries(buttons).forEach(([buttonType, button]) => {
        const isActive = buttonType === type;
        button.setAttribute('aria-pressed', String(isActive));
        button.classList.toggle('bg-indigo-600', isActive);
        button.classList.toggle('text-white', isActive);
        button.classList.toggle('shadow-sm', isActive);
        button.classList.toggle('bg-white', !isActive);
        button.classList.toggle('text-gray-500', !isActive);
    });
    regularFields.forEach(field => {
        field.classList.toggle('hidden', isSavingsGoal);
        field.querySelectorAll('input, select, button').forEach(control => {
            control.disabled = isSavingsGoal;
        });
    });
    goalFields.classList.toggle('hidden', !isSavingsGoal);
    goalFields.querySelectorAll('input').forEach(input => {
        input.disabled = !isSavingsGoal;
        input.required = isSavingsGoal;
    });

    if (appConfig) {
        populateCategoryOptions(isIncome ? 'income' : 'expense');
        updatePaymentMethodOptions(isIncome ? 'income' : 'expense');
    }
    document.getElementById('modalTitle').textContent = translate(
        isSavingsGoal ? 'savingsGoal' : isIncome ? 'incomeTitle' : 'expenseTitle'
    );
    document.querySelector('#transactionForm button[type="submit"]').textContent =
        translate(isSavingsGoal ? 'saveGoal' : 'saveTransaction');
}

function handleTransactionSubmit(e) {
    e.preventDefault();
    const type = document.getElementById('txType').value;
    if (type === 'savingsGoal') {
        saveSavingsGoal(
            document.getElementById('savingsGoalName').value.trim(),
            Number(document.getElementById('savingsGoalAmount').value.replace(/[^\d]/g, ''))
        );
        return;
    }

    const amount = parseTransactionAmount(document.getElementById('txAmount').value);
    const title = document.getElementById('txTitle').value.trim();
    const category = document.getElementById('txCategory').value;
    const paymentMethod = document.getElementById('txPaymentMethod').value;

    saveTransaction(type, amount, title, category, paymentMethod);
}

function alertForGamblingTransaction(title) {
    if (!/\b(judi|slot|gacor|depo)\b/i.test(title) || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
        return;
    }

    const utterance = new SpeechSynthesisUtterance('Udah gede jangang gitu terus cok!');
    utterance.lang = 'id-ID';
    utterance.rate = 1.35;
    utterance.pitch = 1.25;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
}

function saveTransaction(type, amount, title, category, paymentMethod) {
    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Masukkan jumlah nominal yang valid.");
        return;
    }
    if (!currentUser || !['income', 'expense'].includes(type)) {
        alert("Transaksi tidak dapat disimpan.");
        return;
    }
    const validPaymentMethods = type === 'income'
        ? ['BANK', 'E-WALLET', 'Cash']
        : ['Cash', 'Transfer / Tf', 'Other'];
    if (!validPaymentMethods.includes(paymentMethod)) {
        alert("Pilih metode pembayaran yang valid.");
        return;
    }

    const newTx = {
        id: Date.now(),
        type: type,
        title: title,
        category: category,
        paymentMethod: paymentMethod,
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
    displayedCalendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    renderMiniCalendar();
    alertForGamblingTransaction(title);
}

function saveSavingsGoal(name, amount) {
    if (!currentUser || !name || !Number.isFinite(amount) || amount <= 0) {
        alert(currentLanguage === 'id'
            ? 'Masukkan nama dan nominal target yang valid.'
            : 'Enter a valid goal name and amount.');
        return;
    }

    currentUser.savingsGoal = {
        name,
        amount,
        updatedAt: new Date().toISOString()
    };
    saveUserData();
    closeTransactionModal();
    updateWalletGoalCard();
}

function saveUserData() {
    if (isGuestMode) {
        sessionStorage.setItem('guestUserData', JSON.stringify(currentUser));
        sessionStorage.setItem('userName', currentUser.name);
        return;
    }

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

    const confirmation = translate('confirmDeleteTransaction')
        .replace('{title}', transaction.title)
        .replace('{amount}', formatMoney(amount));
    if (!confirm(confirmation)) {
        return;
    }

    currentUser.balance = currentBalance + (transaction.type === 'income' ? -amount : amount);
    transactions.splice(transactionIndex, 1);
    saveUserData();
    updateDashboardUI();
    renderMiniCalendar();
}

// UPDATE DASHBOARD & RENDER UI
function updateDashboardUI() {
    updateBalanceDisplay();
    updateWalletGoalCard();
    
    const txs = currentUser.transactions || [];
    
    let totalSpent = 0;
    let totalSalary = 0;

    txs.forEach(t => {
        if (t.type === 'expense') {
            totalSpent += t.amount;
        } else if (t.type === 'income') {
            totalSalary += t.amount;
        }
    });
    const catTotals = getExpenseCategoryTotals(txs);

    document.getElementById('homeTotalSpent').textContent = formatMoney(totalSpent);
    renderHomeBreakdown(catTotals, totalSpent);

    const recentContainer = document.getElementById('recentExpensesList');
    recentContainer.innerHTML = '';

    if (txs.length === 0) {
        recentContainer.innerHTML = `<p class="text-xs text-gray-400 text-center py-4">${currentLanguage === 'id' ? 'Belum ada transaksi.' : 'No transactions yet.'}</p>`;
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
                        <p class="text-[10px] text-gray-400">${translateCategory(t.category)} • ${new Date(t.date).toLocaleDateString(currentLanguage === 'id' ? 'id-ID' : 'en-US')}</p>
                    </div>
                </div>
                <span class="text-xs font-bold ${colorClass}">${sign}${formatMoney(t.amount)}</span>
            `;
            recentContainer.appendChild(div);
        });
    }

    renderFullHistory();
}

function updateWalletGoalCard() {
    if (!currentUser) return;
    const goal = currentUser.savingsGoal;
    const primaryLabel = document.getElementById('walletCardPrimaryLabel');
    const primaryValue = document.getElementById('walletCardPrimaryValue');
    const secondaryLabel = document.getElementById('walletCardSecondaryLabel');
    const secondaryValue = document.getElementById('walletCardSecondaryValue');

    if (!goal || typeof goal.name !== 'string' || !Number.isFinite(Number(goal.amount)) || Number(goal.amount) <= 0) {
        primaryLabel.textContent = translate('cardNumber');
        primaryValue.textContent = '**** **** **** 8766';
        secondaryLabel.textContent = translate('validThru');
        secondaryValue.textContent = '08/28';
        return;
    }

    const targetAmount = Number(goal.amount);
    const balance = Number(currentUser.balance);
    const progress = Number.isFinite(balance) ? Math.max(0, balance) : 0;
    const progressPercent = Math.min(100, Math.floor((progress / targetAmount) * 100));
    primaryLabel.textContent = translate('savingsGoalName');
    primaryValue.textContent = goal.name;
    primaryValue.title = goal.name;
    secondaryLabel.textContent = translate('goalProgress');
    secondaryValue.textContent = isBalanceSensorHidden
        ? `•••• / ${formatRupiah(targetAmount)}`
        : `${formatRupiah(progress)} / ${formatRupiah(targetAmount)} (${progressPercent}%)`;
}

function setHistoryFilter(filter) {
    if (!['month', 'all', 'income', 'expense'].includes(filter)) {
        return;
    }

    activeHistoryFilter = filter;
    if (filter !== 'month') {
        historyTypeFilter = filter;
    }
    const filters = {
        month: document.getElementById('historyFilterMonth'),
        all: document.getElementById('historyFilterAll'),
        income: document.getElementById('historyFilterIncome'),
        expense: document.getElementById('historyFilterExpense')
    };

    Object.entries(filters).forEach(([key, button]) => {
        const isActive = key === activeHistoryFilter;
        button.setAttribute('aria-pressed', String(isActive));
        button.classList.toggle('bg-indigo-600', isActive);
        button.classList.toggle('text-white', isActive);
        button.classList.toggle('shadow-sm', isActive);
        button.classList.toggle('bg-gray-100', !isActive);
        button.classList.toggle('text-gray-600', !isActive);
        button.classList.toggle('hover:bg-gray-200', !isActive);
        button.classList.toggle('hover:bg-indigo-700', isActive);
        button.classList.toggle('font-semibold', isActive);
        button.classList.toggle('font-medium', !isActive);
    });

    if (filter !== 'month') {
        renderFullHistory();
    }
}

function renderFullHistory() {
    const container = document.getElementById('fullHistoryContainer');
    container.innerHTML = '';
    const txs = currentUser.transactions || [];

    if (txs.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-400 text-center py-8">${currentLanguage === 'id' ? 'Belum ada riwayat transaksi.' : 'No transaction history yet.'}</p>`;
        return;
    }

    const visibleTransactions = txs
        .map((transaction, index) => ({ transaction, index }))
        .filter(({ transaction }) => historyTypeFilter === 'all' || transaction.type === historyTypeFilter);

    if (visibleTransactions.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-400 text-center py-8">${translate('noFilteredTransactions')}</p>`;
        return;
    }

    visibleTransactions.forEach(({ transaction: t, index }) => {
        const isInc = t.type === 'income';
        const sign = isInc ? '+' : '-';
        const colorClass = isInc ? 'text-emerald-600' : 'text-gray-900';
        
        const div = document.createElement('div');
        div.className = "history-transaction flex items-center justify-between p-3.5 bg-white border border-gray-100 rounded-xl shadow-xs";
        div.innerHTML = `
            <div class="flex items-center space-x-3 min-w-0 flex-1">
                <div class="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center text-sm font-semibold">
                    <i class="fa-solid ${isInc ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                </div>
                <div class="min-w-0">
                    <h5 class="text-xs font-bold text-gray-900">${t.title}</h5>
                    <p class="text-[10px] text-gray-400">${translateCategory(t.category)} • ${new Date(t.date).toLocaleTimeString(currentLanguage === 'id' ? 'id-ID' : 'en-US', {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2 shrink-0">
                <span class="text-xs font-bold ${colorClass}">${sign}${formatMoney(t.amount)}</span>
                <button type="button" onclick="deleteTransaction(${index})" aria-label="Hapus transaksi" title="Hapus transaksi" class="w-8 h-8 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </div>
        `;
        let holdTimeout;
        let startX = 0;
        let startY = 0;
        let longPressTriggered = false;
        let gestureEligible = false;

        div.addEventListener('pointerdown', event => {
            gestureEligible = event.button === 0 && !event.target.closest('button');
            if (!gestureEligible) return;
            startX = event.clientX;
            startY = event.clientY;
            longPressTriggered = false;
            holdTimeout = window.setTimeout(() => {
                longPressTriggered = true;
                deleteTransaction(index);
            }, 650);
        });
        div.addEventListener('pointermove', event => {
            if (Math.abs(event.clientX - startX) > 10 || Math.abs(event.clientY - startY) > 10) {
                window.clearTimeout(holdTimeout);
            }
        });
        const finishGesture = event => {
            window.clearTimeout(holdTimeout);
            if (!gestureEligible) return;
            gestureEligible = false;
            const deltaX = event.clientX - startX;
            const deltaY = event.clientY - startY;
            if (!longPressTriggered && Math.abs(deltaX) >= 80 && Math.abs(deltaX) > Math.abs(deltaY)) {
                deleteTransaction(index);
            }
        };
        div.addEventListener('pointerup', finishGesture);
        div.addEventListener('pointercancel', () => {
            window.clearTimeout(holdTimeout);
            gestureEligible = false;
        });
        container.appendChild(div);
    });
}

function updateReportUI() {
    const txs = currentUser.transactions || [];
    let totalSpent = 0;
    let totalSalary = 0;

    txs.forEach(t => {
        if (t.type === 'expense') {
            totalSpent += t.amount;
        } else if (t.type === 'income') {
            totalSalary += t.amount;
        }
    });
    const catTotals = getExpenseCategoryTotals(txs);

    document.getElementById('reportTotalSalary').textContent = formatMoney(totalSalary);
    document.getElementById('reportTotalExpense').textContent = formatMoney(totalSpent);
    document.getElementById('reportChartCenterText').textContent = formatMoney(totalSpent);

    const legendList = document.getElementById('reportLegendList');
    legendList.innerHTML = '';

    getExpenseCategories().forEach(category => {
        const amount = catTotals[category.reportKey];
        const pct = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
        const row = document.createElement('div');
        row.className = "flex items-center justify-between";
        row.innerHTML = `
            <span class="flex items-center space-x-2 text-gray-600"><span class="w-2.5 h-2.5 rounded-full ${category.reportColor}"></span><span>${translate(category.translationKey)}</span></span>
            <span class="font-semibold text-gray-900">${pct}% (${formatMoney(amount)})</span>
        `;
        legendList.appendChild(row);
    });
}

function renderMiniCalendar() {
    const grid = document.getElementById('miniCalendarGrid');
    const monthTitle = document.getElementById('calMonthTitle');
    const year = displayedCalendarMonth.getFullYear();
    const month = displayedCalendarMonth.getMonth();
    const monthLabel = displayedCalendarMonth.toLocaleDateString(currentLanguage === 'id' ? 'id-ID' : 'en-US', {
        month: 'short',
        year: 'numeric'
    });
    monthTitle.textContent = monthLabel;
    document.getElementById('reportMonthYear').textContent =
        displayedCalendarMonth.toLocaleDateString(currentLanguage === 'id' ? 'id-ID' : 'en-US', {
            month: 'long',
            year: 'numeric'
        });

    grid.innerHTML = '';
    const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
    for (let i = 0; i < firstDayOffset; i++) {
        const emptySpan = document.createElement('span');
        emptySpan.setAttribute('aria-hidden', 'true');
        grid.appendChild(emptySpan);
    }

    const transactionsByDate = new Map();
    (currentUser.transactions || []).forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        if (Number.isNaN(transactionDate.getTime()) ||
            transactionDate.getFullYear() !== year ||
            transactionDate.getMonth() !== month) {
            return;
        }

        const dateKey = `${transactionDate.getFullYear()}-${transactionDate.getMonth()}-${transactionDate.getDate()}`;
        if (!transactionsByDate.has(dateKey)) transactionsByDate.set(dateKey, []);
        transactionsByDate.get(dateKey).push(transaction);
    });

    const today = new Date();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const span = document.createElement('span');
        span.textContent = day;
        span.className = 'calendar-day';
        span.setAttribute('aria-label', new Date(year, month, day).toLocaleDateString(
            currentLanguage === 'id' ? 'id-ID' : 'en-US',
            { day: 'numeric', month: 'long', year: 'numeric' }
        ));

        const dateKey = `${year}-${month}-${day}`;
        const dayTransactions = transactionsByDate.get(dateKey) || [];
        const hasMarkedPayment = dayTransactions.some(transaction => {
            const paymentMethod = String(transaction.paymentMethod || '').trim().toLowerCase();
            return paymentMethod === 'cash' ||
                paymentMethod === 'transfer' ||
                paymentMethod === 'tf' ||
                paymentMethod === 'transfer / tf';
        });

        if (hasMarkedPayment) {
            span.classList.add('calendar-day-payment');
        }

        if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === day) {
            span.classList.add('calendar-day-today');
        }
        grid.appendChild(span);
    }
}

function changeCalendarMonth(monthOffset) {
    displayedCalendarMonth = new Date(
        displayedCalendarMonth.getFullYear(),
        displayedCalendarMonth.getMonth() + monthOffset,
        1
    );
    renderMiniCalendar();
}