/**
 * SakuPintar — Personal Finance Tracker
 * Modular State Management with separate JSON file storage
 */

const LEGACY_STORAGE_KEY = 'sakupintar_db_v1';
const BACKUP_SCHEMA_VERSION = 1;

// Default Categories with Lucide Icons
const CATEGORIES = [
    { id: 'makan', name: 'Makan & Minum', icon: 'utensils', color: '#f97316' },
    { id: 'transport', name: 'Transportasi', icon: 'car', color: '#3b82f6' },
    { id: 'belanja', name: 'Belanja', icon: 'shopping-bag', color: '#ec4899' },
    { id: 'tagihan', name: 'Tagihan & Kuota', icon: 'smartphone', color: '#8b5cf6' },
    { id: 'hiburan', name: 'Hiburan', icon: 'gamepad-2', color: '#14b8a6' },
    { id: 'gaji', name: 'Gaji/Uang Saku', icon: 'banknote', color: '#10b981' },
    { id: 'lainnya', name: 'Lainnya', icon: 'layers', color: '#64748b' }
];

// Wallet Card Color Presets
const WALLET_COLORS = {
    indigo: 'from-indigo-600 to-blue-700',
    emerald: 'from-emerald-600 to-teal-700',
    sky: 'from-sky-500 to-blue-600',
    amber: 'from-amber-500 to-orange-600',
    rose: 'from-rose-500 to-pink-600',
    slate: 'from-slate-700 to-slate-900'
};

// Application State
let appState = null;
let jsonDataDirty = false;
let legacyDataLoaded = false;
let currentTab = 'beranda';
let pinEntryBuffer = '';
let donutChartInstance = null;
let barChartInstance = null;

// Transaction Modal Temporary State
let txModalState = {
    type: 'expense', // 'expense' | 'income' | 'transfer'
    category: 'makan',
    microSavePct: 0,
    splitMode: 'equal', // 'equal' | 'custom'
    calcExpr: '0',
    selectedWalletColor: 'indigo'
};

// ==========================================
// 1. INITIALIZATION & STORAGE ENGINE
// ==========================================
function getDefaultState() {
    return {
        onboarded: false,
        user: {
            name: 'Pengguna',
            pinEnabled: false,
            pin: '',
            privacyMode: false,
            theme: 'light'
        },
        wallets: [
            { id: 'w_main', name: 'Dompet Utama', balance: 0, color: 'indigo' }
        ],
        piggyBank: {
            balance: 0
        },
        goals: [],
        transactions: [],
        receivables: [],
        templates: [
            { id: 'tpl_1', name: 'Kopi', amount: 20000, category: 'makan' },
            { id: 'tpl_2', name: 'Makan Siang', amount: 25000, category: 'makan' },
            { id: 'tpl_3', name: 'Bensin', amount: 30000, category: 'transport' }
        ],
        recurring: []
    };
}

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertSafeJSON(value) {
    if (Array.isArray(value)) {
        value.forEach(assertSafeJSON);
        return;
    }
    if (!isPlainObject(value)) return;

    Object.keys(value).forEach((key) => {
        if (key === '__proto__' || key === 'prototype' || key === 'constructor') {
            throw new Error('Properti JSON tidak diizinkan');
        }
        assertSafeJSON(value[key]);
    });
}

function mergeStateWithDefaults(defaults, imported) {
    const merged = { ...defaults };
    Object.keys(imported).forEach((key) => {
        const defaultValue = defaults[key];
        const importedValue = imported[key];
        merged[key] = isPlainObject(defaultValue) && isPlainObject(importedValue)
            ? mergeStateWithDefaults(defaultValue, importedValue)
            : importedValue;
    });
    return merged;
}

function validateAndMergeImportedState(parsed) {
    if (!isPlainObject(parsed)) throw new Error('Format tidak valid');
    assertSafeJSON(parsed);

    let imported = parsed;
    if (Object.prototype.hasOwnProperty.call(parsed, 'metadata') ||
        Object.prototype.hasOwnProperty.call(parsed, 'data')) {
        if (!isPlainObject(parsed.metadata) || !isPlainObject(parsed.data) ||
            parsed.metadata.app !== 'SakuPintar' ||
            parsed.metadata.schemaVersion !== BACKUP_SCHEMA_VERSION ||
            Object.keys(parsed).some((key) => key !== 'metadata' && key !== 'data')) {
            throw new Error('Versi atau format backup tidak didukung');
        }
        imported = parsed.data;
    }

    const defaults = getDefaultState();
    const allowedKeys = Object.keys(defaults);
    if (Object.keys(imported).some((key) => !allowedKeys.includes(key))) {
        throw new Error('Properti data tidak dikenal');
    }
    if (!Array.isArray(imported.wallets) || !Array.isArray(imported.transactions)) {
        throw new Error('Backup harus memiliki array wallets dan transactions');
    }
    ['wallets', 'transactions', 'goals', 'receivables', 'templates', 'recurring'].forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(imported, key) && !Array.isArray(imported[key])) {
            throw new Error(`Bagian ${key} harus berupa array`);
        }
    });
    ['user', 'piggyBank'].forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(imported, key) && !isPlainObject(imported[key])) {
            throw new Error(`Bagian ${key} harus berupa objek`);
        }
    });
    if (Object.prototype.hasOwnProperty.call(imported, 'onboarded') &&
        typeof imported.onboarded !== 'boolean') {
        throw new Error('Bagian onboarded harus berupa boolean');
    }
    if (imported.user) {
        const userDefaults = defaults.user;
        if (Object.keys(imported.user).some((key) => !Object.prototype.hasOwnProperty.call(userDefaults, key))) {
            throw new Error('Properti user tidak dikenal');
        }
        Object.keys(imported.user).forEach((key) => {
            if (typeof imported.user[key] !== typeof userDefaults[key]) {
                throw new Error(`Tipe user.${key} tidak valid`);
            }
        });
    }
    if (imported.piggyBank) {
        if (Object.keys(imported.piggyBank).some((key) => key !== 'balance') ||
            (Object.prototype.hasOwnProperty.call(imported.piggyBank, 'balance') &&
                (typeof imported.piggyBank.balance !== 'number' || !Number.isFinite(imported.piggyBank.balance)))) {
            throw new Error('Bagian piggyBank tidak valid');
        }
    }

    return mergeStateWithDefaults(defaults, imported);
}

function loadState() {
    try {
        const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (!raw) return getDefaultState();
        const parsed = JSON.parse(raw);
        legacyDataLoaded = true;
        return validateAndMergeImportedState(parsed);
    } catch (e) {
        console.error('Failed to parse state:', e);
        return getDefaultState();
    }
}

function updateJsonDataStatus(message) {
    const status = document.getElementById('jsonDataStatus');
    if (status) status.textContent = message;
}

function saveState() {
    jsonDataDirty = true;
    updateJsonDataStatus('Ada perubahan yang belum disimpan ke file JSON.');
}

// ==========================================
// 2. FORMATTING & DATE HELPERS
// ==========================================
function formatRupiah(num, hideIfPrivate = true) {
    const n = Math.round(Number(num) || 0);
    if (hideIfPrivate && appState?.user?.privacyMode) {
        return 'Rp ••••••';
    }
    const prefix = n < 0 ? '-Rp ' : 'Rp ';
    return prefix + Math.abs(n).toLocaleString('id-ID');
}

function getTodayISO() {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().split('T')[0];
}

function formatDateID(isoStr) {
    if (!isoStr) return '';
    const [y, m, d] = isoStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}

function getCategoryObj(catId) {
    return CATEGORIES.find(c => c.id === catId) || CATEGORIES[CATEGORIES.length - 1];
}

function getWalletObj(walletId) {
    return appState.wallets.find(w => w.id === walletId) || appState.wallets[0];
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    const bg = type === 'error' ? 'bg-rose-600' : type === 'warning' ? 'bg-amber-600' : 'bg-slate-900 dark:bg-indigo-600';
    toast.className = `${bg} text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between gap-2 animate-fade-in pointer-events-auto`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.25s';
        setTimeout(() => toast.remove(), 250);
    }, 2800);
}

// ==========================================
// 3. ONBOARDING, THEME & PIN LOCK
// ==========================================
function applyTheme() {
    const html = document.documentElement;
    if (appState.user.theme === 'dark') {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
}

function initOnboardingAndSecurity() {
    applyTheme();

    if (!appState.onboarded) {
        document.getElementById('onboardingScreen').classList.remove('hidden');
        return;
    }

    document.getElementById('onboardingScreen').classList.add('hidden');
    document.getElementById('headerGreeting').textContent = `Halo, ${appState.user.name}!`;

    if (appState.user.pinEnabled && appState.user.pin) {
        showPinLockScreen();
    }
}

function showPinLockScreen() {
    pinEntryBuffer = '';
    updatePinDots();
    document.getElementById('pinLockGreeting').textContent = `Halo, ${appState.user.name}`;
    document.getElementById('pinLockScreen').classList.remove('hidden');
}

function updatePinDots() {
    const dots = document.querySelectorAll('#pinDotsContainer .pin-dot');
    dots.forEach((dot, idx) => {
        if (idx < pinEntryBuffer.length) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    });
}

function handlePinDigit(digit) {
    if (pinEntryBuffer.length >= 4) return;
    pinEntryBuffer += digit;
    updatePinDots();

    if (pinEntryBuffer.length === 4) {
        setTimeout(() => {
            if (pinEntryBuffer === appState.user.pin) {
                document.getElementById('pinLockScreen').classList.add('hidden');
                pinEntryBuffer = '';
                updatePinDots();
            } else {
                const container = document.getElementById('pinDotsContainer');
                container.classList.add('animate-shake');
                document.getElementById('pinLockSub').textContent = 'PIN salah! Silakan coba lagi.';
                document.getElementById('pinLockSub').classList.add('text-rose-400');
                setTimeout(() => {
                    container.classList.remove('animate-shake');
                    pinEntryBuffer = '';
                    updatePinDots();
                }, 400);
            }
        }, 120);
    }
}

// ==========================================
// 4. RECURRING TRANSACTIONS ENGINE
// ==========================================
function processRecurringTransactions() {
    const today = getTodayISO();
    let executedCount = 0;

    appState.recurring.forEach(item => {
        if (!item.active) return;
        while (item.nextDate <= today) {
            const wallet = getWalletObj(item.walletId);
            if (wallet) {
                const amt = Number(item.amount) || 0;
                if (item.type === 'expense') {
                    wallet.balance -= amt;
                } else {
                    wallet.balance += amt;
                }

                appState.transactions.unshift({
                    id: 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                    type: item.type,
                    amount: amt,
                    walletId: wallet.id,
                    category: item.category,
                    note: `[Otomatis] ${item.note}`,
                    date: item.nextDate,
                    microSaved: 0,
                    splitReceivableId: null
                });
                executedCount++;
            }

            // Advance nextDate
            const dt = new Date(item.nextDate + 'T00:00:00');
            if (item.freq === 'daily') dt.setDate(dt.getDate() + 1);
            else if (item.freq === 'weekly') dt.setDate(dt.getDate() + 7);
            else dt.setMonth(dt.getMonth() + 1);

            const offset = dt.getTimezoneOffset();
            item.nextDate = new Date(dt.getTime() - offset * 60000).toISOString().split('T')[0];
        }
    });

    if (executedCount > 0) {
        saveState();
        showToast(`${executedCount} transaksi berulang otomatis dicatat!`);
    }
}

// ==========================================
// 5. NAVIGATION & MODAL HELPERS
// ==========================================
function switchTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-view').forEach(el => el.classList.add('hidden'));
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        const isTarget = btn.dataset.nav === tabName;
        btn.classList.toggle('text-indigo-600', isTarget);
        btn.classList.toggle('dark:text-indigo-400', isTarget);
        btn.classList.toggle('text-slate-400', !isTarget);
    });

    renderAll();
}

function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
    lucide.createIcons();
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function showConfirm(title, message, onConfirm) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    const okBtn = document.getElementById('btnConfirmOk');
    const cancelBtn = document.getElementById('btnConfirmCancel');

    const cleanup = () => {
        closeModal('confirmModal');
        okBtn.onclick = null;
        cancelBtn.onclick = null;
    };

    okBtn.onclick = () => {
        cleanup();
        onConfirm();
    };
    cancelBtn.onclick = cleanup;
    openModal('confirmModal');
}

// ==========================================
// 6. RENDERING ENGINE (ALL VIEWS)
// ==========================================
function renderAll() {
    renderHeaderState();
    renderDashboard();
    renderCelengan();
    renderHistory();
    if (currentTab === 'laporan') {
        renderReports();
    }
    lucide.createIcons();
}

function renderHeaderState() {
    const lockBtn = document.getElementById('btnLockNow');
    if (appState.user.pinEnabled && appState.user.pin) {
        lockBtn.classList.remove('hidden');
    } else {
        lockBtn.classList.add('hidden');
    }

    const eyeOpen = document.getElementById('iconEyeOpen');
    const eyeClosed = document.getElementById('iconEyeClosed');
    if (appState.user.privacyMode) {
        eyeOpen.classList.add('hidden');
        eyeClosed.classList.remove('hidden');
    } else {
        eyeOpen.classList.remove('hidden');
        eyeClosed.classList.add('hidden');
    }
}

function renderDashboard() {
    // 1. Net Worth & Balances
    const totalWallets = appState.wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);
    const goalsTotal = appState.goals.reduce((sum, g) => sum + (Number(g.currentAmount) || 0), 0);
    const totalSavings = (Number(appState.piggyBank.balance) || 0) + goalsTotal;
    const netWorth = totalWallets + totalSavings;

    document.getElementById('netWorthAmount').textContent = formatRupiah(netWorth);
    document.getElementById('totalWalletsAmount').textContent = formatRupiah(totalWallets);
    document.getElementById('totalSavingsAmount').textContent = formatRupiah(totalSavings);

    // 2. Safe-to-Spend Calculation
    const now = new Date();
    const todayISO = getTodayISO();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDays = Math.max(1, daysInMonth - now.getDate() + 1);

    const todaySpent = appState.transactions
        .filter(t => t.type === 'expense' && t.date === todayISO)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Available balance before today's spending = totalWallets + todaySpent
    const dailyAllowance = Math.max(0, Math.floor((totalWallets + todaySpent) / remainingDays));
    const safeRemainingToday = Math.max(0, Math.floor((totalWallets) / remainingDays));

    document.getElementById('safeDaysLeftText').textContent = `Sisa ${remainingDays} hari bulan ini`;
    document.getElementById('safeToSpendAmount').textContent = formatRupiah(safeRemainingToday);
    document.getElementById('todaySpentAmount').textContent = formatRupiah(todaySpent);

    const badge = document.getElementById('safeStatusBadge');
    const bar = document.getElementById('safeProgressBar');
    const ratio = dailyAllowance > 0 ? Math.min(100, Math.round((todaySpent / dailyAllowance) * 100)) : (todaySpent > 0 ? 100 : 0);
    bar.style.width = `${ratio}%`;

    if (totalWallets <= 0 || ratio >= 100) {
        badge.textContent = 'Boros';
        badge.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300';
        bar.className = 'h-full bg-rose-500 rounded-full transition-all duration-500';
    } else if (ratio >= 70) {
        badge.textContent = 'Hati-hati';
        badge.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
        bar.className = 'h-full bg-amber-500 rounded-full transition-all duration-500';
    } else {
        badge.textContent = 'Aman';
        badge.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
        bar.className = 'h-full bg-emerald-500 rounded-full transition-all duration-500';
    }

    // 3. Multi-Wallet Cards
    const walletsContainer = document.getElementById('walletsListContainer');
    walletsContainer.innerHTML = appState.wallets.map(w => {
        const grad = WALLET_COLORS[w.color] || WALLET_COLORS.indigo;
        return `
      <div class="min-w-[148px] rounded-2xl bg-gradient-to-br ${grad} text-white p-3.5 shadow-sm shrink-0 flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold truncate max-w-[100px]">${w.name}</span>
          <i data-lucide="credit-card" class="w-4 h-4 opacity-80"></i>
        </div>
        <p class="text-sm font-extrabold mt-4">${formatRupiah(w.balance)}</p>
      </div>
    `;
    }).join('');

    // 4. Receivables Summary
    const unpaidReceivables = appState.receivables.filter(r => !r.paid);
    const totalUnpaid = unpaidReceivables.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    document.getElementById('totalReceivablesAmount').textContent = formatRupiah(totalUnpaid);
    document.getElementById('receivablesCountBadge').textContent = unpaidReceivables.length;

    // 5. Recent 5 Transactions
    const recentContainer = document.getElementById('recentTransactionsList');
    const recent = appState.transactions.slice(0, 5);
    if (recent.length === 0) {
        recentContainer.innerHTML = `
      <div class="text-center py-8 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
        <p class="text-xs text-slate-400">Belum ada transaksi. Tekan tombol <strong>+</strong> di bawah untuk mulai mencatat!</p>
      </div>
    `;
    } else {
        recentContainer.innerHTML = recent.map(tx => renderTransactionItemHTML(tx, false)).join('');
    }
}

function renderTransactionItemHTML(tx, showTrash = false) {
    const cat = getCategoryObj(tx.category);
    const wallet = getWalletObj(tx.walletId);
    let amountColor = 'text-rose-600 dark:text-rose-400';
    let sign = '-';
    let title = tx.note || cat.name;
    let iconName = cat.icon;
    let iconBg = cat.color;

    if (tx.type === 'income') {
        amountColor = 'text-emerald-600 dark:text-emerald-400';
        sign = '+';
    } else if (tx.type === 'transfer') {
        amountColor = 'text-indigo-600 dark:text-indigo-400';
        sign = '';
        iconName = 'arrow-left-right';
        iconBg = '#6366f1';
    }

    return `
    <div class="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style="background-color: ${iconBg}">
          <i data-lucide="${iconName}" class="w-5 h-5"></i>
        </div>
        <div class="min-w-0">
          <p class="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">${title}</p>
          <p class="text-[11px] text-slate-400 truncate mt-0.5">
            ${wallet ? wallet.name : ''} • ${formatDateID(tx.date)}
            ${tx.microSaved > 0 ? ` • <span class="text-emerald-500 font-semibold">+Celengan ${formatRupiah(tx.microSaved, false)}</span>` : ''}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2.5 shrink-0">
        <span class="text-xs font-extrabold ${amountColor}">${sign}${formatRupiah(tx.amount)}</span>
        ${showTrash ? `
          <button onclick="deleteTransactionWithRevert('${tx.id}')" title="Hapus & Kembalikan Saldo" class="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

// ==========================================
// 7. CELENGAN PINTAR & TARGET NABUNG
// ==========================================
function renderCelengan() {
    document.getElementById('mainPiggyBalance').textContent = formatRupiah(appState.piggyBank.balance);

    const goalsContainer = document.getElementById('savingsGoalsList');
    if (appState.goals.length === 0) {
        goalsContainer.innerHTML = `
      <div class="text-center py-8 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
        <p class="text-xs text-slate-400">Belum ada target nabung. Klik <strong>+ Target Baru</strong> untuk memulai.</p>
      </div>
    `;
        return;
    }

    goalsContainer.innerHTML = appState.goals.map(g => {
        const pct = Math.min(100, Math.round(((Number(g.currentAmount) || 0) / (Number(g.targetAmount) || 1)) * 100));
        return `
      <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5">
        <div class="flex items-start justify-between">
          <div>
            <h4 class="text-xs font-bold text-slate-800 dark:text-slate-100">${g.title}</h4>
            <p class="text-[11px] text-slate-400 mt-0.5">Target: ${formatDateID(g.deadline)}</p>
          </div>
          <span class="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[11px] font-extrabold">${pct}%</span>
        </div>

        <div class="flex items-baseline justify-between text-xs">
          <span class="font-extrabold text-emerald-600 dark:text-emerald-400">${formatRupiah(g.currentAmount)}</span>
          <span class="text-slate-400">dari ${formatRupiah(g.targetAmount)}</span>
        </div>

        <div class="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
        </div>

        <div class="pt-1 flex items-center justify-between gap-2">
          <button onclick="addMoneyToGoal('${g.id}', 25000)" class="flex-1 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold transition">
            + Rp 25rb
          </button>
          <button onclick="addMoneyToGoal('${g.id}', 100000)" class="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition">
            + Rp 100rb
          </button>
          <button onclick="deleteGoal('${g.id}')" class="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 transition" title="Hapus Target">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
    }).join('');
}

function quickSaveToPiggy(amount) {
    const mainWallet = appState.wallets[0];
    if (!mainWallet) return;

    mainWallet.balance -= amount;
    appState.piggyBank.balance += amount;

    appState.transactions.unshift({
        id: 'tx_' + Date.now(),
        type: 'transfer',
        amount: amount,
        walletId: mainWallet.id,
        targetPiggy: true,
        category: 'lainnya',
        note: 'Isi Celengan Cepat',
        date: getTodayISO(),
        microSaved: 0
    });

    saveState();
    renderAll();
    showToast(`Berhasil menabung ${formatRupiah(amount, false)} ke Celengan!`);
}

function addMoneyToGoal(goalId, amount) {
    const goal = appState.goals.find(g => g.id === goalId);
    const mainWallet = appState.wallets[0];
    if (!goal || !mainWallet) return;

    mainWallet.balance -= amount;
    goal.currentAmount = (Number(goal.currentAmount) || 0) + amount;

    appState.transactions.unshift({
        id: 'tx_' + Date.now(),
        type: 'transfer',
        amount: amount,
        walletId: mainWallet.id,
        targetGoalId: goal.id,
        category: 'lainnya',
        note: `Nabung Target: ${goal.title}`,
        date: getTodayISO(),
        microSaved: 0
    });

    saveState();
    renderAll();
    showToast(`+${formatRupiah(amount, false)} ditambahkan ke "${goal.title}"!`);
}

function deleteGoal(goalId) {
    const goal = appState.goals.find(g => g.id === goalId);
    if (!goal) return;
    showConfirm(
        'Hapus Target Nabung?',
        `Saldo terkumpul sebesar ${formatRupiah(goal.currentAmount, false)} akan dikembalikan ke Dompet Utama.`,
        () => {
            if (appState.wallets[0]) {
                appState.wallets[0].balance += Number(goal.currentAmount) || 0;
            }
            appState.goals = appState.goals.filter(g => g.id !== goalId);
            saveState();
            renderAll();
            showToast('Target dihapus & dana dikembalikan ke Dompet Utama.');
        }
    );
}

// ==========================================
// 8. RIWAYAT & SMART REVERT DELETE
// ==========================================
function renderHistory() {
    // Populate wallet filter options while preserving selection
    const walletFilter = document.getElementById('filterHistoryWallet');
    const currentWalletVal = walletFilter.value;
    walletFilter.innerHTML = `<option value="all">Semua Dompet</option>` +
        appState.wallets.map(w => `<option value="${w.id}">${w.name}</option>`).join('');
    walletFilter.value = currentWalletVal || 'all';

    const query = document.getElementById('searchHistoryInput').value.toLowerCase().trim();
    const typeFilter = document.getElementById('filterHistoryType').value;
    const selectedWallet = walletFilter.value;

    const filtered = appState.transactions.filter(tx => {
        const cat = getCategoryObj(tx.category);
        const matchText = (tx.note || '').toLowerCase().includes(query) || cat.name.toLowerCase().includes(query);
        const matchType = typeFilter === 'all' || tx.type === typeFilter;
        const matchWallet = selectedWallet === 'all' || tx.walletId === selectedWallet || tx.targetWalletId === selectedWallet;
        return matchText && matchType && matchWallet;
    });

    const listEl = document.getElementById('fullTransactionsList');
    if (filtered.length === 0) {
        listEl.innerHTML = `
      <div class="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
        <p class="text-xs text-slate-400">Tidak ada transaksi yang cocok dengan filter.</p>
      </div>
    `;
    } else {
        listEl.innerHTML = filtered.map(tx => renderTransactionItemHTML(tx, true)).join('');
    }
}

function deleteTransactionWithRevert(txId) {
    const txIndex = appState.transactions.findIndex(t => t.id === txId);
    if (txIndex === -1) return;
    const tx = appState.transactions[txIndex];

    showConfirm(
        'Hapus Transaksi Ini?',
        `Nominal ${formatRupiah(tx.amount, false)} akan otomatis dikembalikan ke saldo asal secara real-time.`,
        () => {
            const wallet = getWalletObj(tx.walletId);
            const amt = Number(tx.amount) || 0;
            const micro = Number(tx.microSaved) || 0;

            if (tx.type === 'expense') {
                if (wallet) wallet.balance += amt + micro;
                if (micro > 0) {
                    appState.piggyBank.balance = Math.max(0, appState.piggyBank.balance - micro);
                }
                // If it had a split bill receivable, remove or revert it
                if (tx.splitReceivableId) {
                    const rec = appState.receivables.find(r => r.id === tx.splitReceivableId);
                    if (rec) {
                        if (!rec.paid && wallet) {
                            // Friend hasn't paid yet, so return the lent money back to wallet
                            wallet.balance += Number(rec.amount) || 0;
                        }
                        appState.receivables = appState.receivables.filter(r => r.id !== tx.splitReceivableId);
                    }
                }
            } else if (tx.type === 'income') {
                if (wallet) wallet.balance -= amt;
            } else if (tx.type === 'transfer') {
                if (tx.targetPiggy) {
                    if (wallet) wallet.balance += amt;
                    appState.piggyBank.balance = Math.max(0, appState.piggyBank.balance - amt);
                } else if (tx.fromPiggy) {
                    appState.piggyBank.balance += amt;
                    if (wallet) wallet.balance -= amt;
                } else if (tx.targetGoalId) {
                    if (wallet) wallet.balance += amt;
                    const g = appState.goals.find(item => item.id === tx.targetGoalId);
                    if (g) g.currentAmount = Math.max(0, (Number(g.currentAmount) || 0) - amt);
                } else if (tx.targetWalletId) {
                    const targetW = getWalletObj(tx.targetWalletId);
                    if (wallet) wallet.balance += amt;
                    if (targetW) targetW.balance -= amt;
                }
            }

            appState.transactions.splice(txIndex, 1);
            saveState();
            renderAll();
            showToast('Transaksi dihapus & saldo berhasil dikembalikan!');
        }
    );
}

// ==========================================
// 9. REPORTS, CHARTS & DATA MANAGEMENT
// ==========================================
function renderReports() {
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    document.getElementById('reportCurrentMonthLabel').textContent = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    const monthTxs = appState.transactions.filter(t => t.date && t.date.startsWith(currentMonthPrefix));
    const monthIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const monthExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const net = monthIncome - monthExpense;

    document.getElementById('reportMonthIncome').textContent = formatRupiah(monthIncome, false);
    document.getElementById('reportMonthExpense').textContent = formatRupiah(monthExpense, false);

    const netEl = document.getElementById('reportMonthNet');
    netEl.textContent = (net >= 0 ? '+' : '') + formatRupiah(net, false);
    netEl.className = `font-extrabold text-sm ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`;

    renderDonutChart(monthTxs);
    renderBarChart();
    renderRecurringList();

    // PIN Toggle UI
    const pinToggle = document.getElementById('togglePinSetting');
    const pinLabel = document.getElementById('pinStatusLabel');
    pinToggle.checked = Boolean(appState.user.pinEnabled);
    pinLabel.textContent = appState.user.pinEnabled ? 'Status: Aktif (Terkunci saat dibuka)' : 'Status: Nonaktif';
}

function renderDonutChart(monthTxs) {
    const expenses = monthTxs.filter(t => t.type === 'expense');
    const totalsByCat = {};
    expenses.forEach(t => {
        totalsByCat[t.category] = (totalsByCat[t.category] || 0) + Number(t.amount);
    });

    const labels = [];
    const data = [];
    const colors = [];
    const totalExp = Object.values(totalsByCat).reduce((a, b) => a + b, 0);

    CATEGORIES.forEach(cat => {
        if (totalsByCat[cat.id] > 0) {
            labels.push(cat.name);
            data.push(totalsByCat[cat.id]);
            colors.push(cat.color);
        }
    });

    const canvas = document.getElementById('categoryDonutChart');
    const emptyMsg = document.getElementById('emptyDonutMsg');
    const legendList = document.getElementById('categoryLegendList');

    if (donutChartInstance) {
        donutChartInstance.destroy();
        donutChartInstance = null;
    }

    if (data.length === 0) {
        canvas.classList.add('hidden');
        emptyMsg.classList.remove('hidden');
        legendList.innerHTML = '';
        return;
    }

    canvas.classList.remove('hidden');
    emptyMsg.classList.add('hidden');

    donutChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: { display: false }
            }
        }
    });

    legendList.innerHTML = labels.map((lbl, idx) => {
        const pct = Math.round((data[idx] / totalExp) * 100);
        return `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${colors[idx]}"></span>
          <span class="text-slate-600 dark:text-slate-300 font-medium">${lbl}</span>
        </div>
        <span class="font-bold text-slate-800 dark:text-slate-100">${formatRupiah(data[idx], false)} (${pct}%)</span>
      </div>
    `;
    }).join('');
}

function renderBarChart() {
    const days = [];
    const incomeSeries = [];
    const expenseSeries = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const offset = d.getTimezoneOffset();
        const iso = new Date(d.getTime() - offset * 60000).toISOString().split('T')[0];
        days.push(`${d.getDate()}/${d.getMonth() + 1}`);

        const dayTxs = appState.transactions.filter(t => t.date === iso);
        incomeSeries.push(dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0));
        expenseSeries.push(dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0));
    }

    const canvas = document.getElementById('cashflowBarChart');
    if (barChartInstance) {
        barChartInstance.destroy();
    }

    const isDark = appState.user.theme === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const tickColor = isDark ? '#94a3b8' : '#64748b';

    barChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [
                {
                    label: 'Pemasukan',
                    data: incomeSeries,
                    backgroundColor: '#10b981',
                    borderRadius: 6
                },
                {
                    label: 'Pengeluaran',
                    data: expenseSeries,
                    backgroundColor: '#f43f5e',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: tickColor, font: { size: 11, family: 'Plus Jakarta Sans' } }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 10 } } },
                y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } }
            }
        }
    });
}

function renderRecurringList() {
    const container = document.getElementById('recurringListContainer');
    if (appState.recurring.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 text-center py-3">Belum ada jadwal transaksi otomatis.</p>`;
        return;
    }

    const freqMap = { daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan' };
    container.innerHTML = appState.recurring.map(r => `
    <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 flex items-center justify-between gap-2">
      <div>
        <p class="text-xs font-bold">${r.note} <span class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">${freqMap[r.freq]}</span></p>
        <p class="text-[11px] text-slate-400 mt-0.5">Berikutnya: ${formatDateID(r.nextDate)} • ${formatRupiah(r.amount, false)}</p>
      </div>
      <button onclick="deleteRecurring('${r.id}')" class="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950 rounded-lg">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    </div>
  `).join('');
}

function deleteRecurring(id) {
    appState.recurring = appState.recurring.filter(r => r.id !== id);
    saveState();
    renderReports();
    lucide.createIcons();
    showToast('Jadwal transaksi berulang dihapus.');
}

// ==========================================
// 10. TRANSACTION MODAL & CALCULATOR LOGIC
// ==========================================
function openTransactionModal() {
    txModalState.type = 'expense';
    txModalState.category = 'makan';
    txModalState.microSavePct = 0;
    txModalState.splitMode = 'equal';
    txModalState.calcExpr = '0';

    document.getElementById('txAmountDisplay').value = '0';
    document.getElementById('calcExpressionPreview').textContent = '';
    document.getElementById('txNote').value = '';
    document.getElementById('txDate').value = getTodayISO();
    document.getElementById('toggleSplitBill').checked = false;
    document.getElementById('splitBillDetails').classList.add('hidden');
    document.getElementById('splitFriendName').value = '';
    document.getElementById('splitFriendAmount').value = '';

    populateTxModalSelectors();
    setTxType('expense');
    setMicroSavePct(0);
    openModal('txModal');
}

function populateTxModalSelectors() {
    const walletOptions = appState.wallets.map(w => `<option value="${w.id}">${w.name} (${formatRupiah(w.balance, false)})</option>`).join('');
    document.getElementById('txWalletId').innerHTML = walletOptions;
    document.getElementById('txTargetWalletId').innerHTML = walletOptions;
    if (appState.wallets.length > 1) {
        document.getElementById('txTargetWalletId').selectedIndex = 1;
    }

    // Templates
    const tplContainer = document.getElementById('quickTemplatesContainer');
    tplContainer.innerHTML = appState.templates.map(tpl => `
    <button type="button" onclick="applyQuickTemplate('${tpl.id}')" class="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shrink-0 transition">
      ${tpl.name} <span class="opacity-75">${Math.round(tpl.amount / 1000)}rb</span>
    </button>
  `).join('');

    // Categories Grid
    const catGrid = document.getElementById('categoryGrid');
    catGrid.innerHTML = CATEGORIES.map(cat => `
    <button type="button" onclick="selectTxCategory('${cat.id}')" data-cat="${cat.id}" class="tx-cat-btn p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-1 text-center transition">
      <i data-lucide="${cat.icon}" class="w-4 h-4" style="color: ${cat.color}"></i>
      <span class="text-[10px] font-semibold leading-tight truncate w-full">${cat.name.split(' ')[0]}</span>
    </button>
  `).join('');
    selectTxCategory(txModalState.category);
}

function setTxType(type) {
    txModalState.type = type;

    // Reset tab styles
    ['Expense', 'Income', 'Transfer'].forEach(t => {
        const btn = document.getElementById(`tabTx${t}`);
        btn.className = 'tx-type-tab py-2 rounded-xl text-xs font-bold text-slate-500 transition';
    });

    const activeBtn = document.getElementById(`tabTx${type.charAt(0).toUpperCase() + type.slice(1)}`);
    const activeColor = type === 'expense' ? 'text-rose-600' : type === 'income' ? 'text-emerald-600' : 'text-indigo-600';
    activeBtn.className = `tx-type-tab py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 ${activeColor} shadow-sm transition`;

    // Toggle conditional sections
    document.getElementById('quickTemplatesSection').classList.toggle('hidden', type !== 'expense');
    document.getElementById('expenseExtrasWrapper').classList.toggle('hidden', type !== 'expense');
    document.getElementById('categorySelectWrapper').classList.toggle('hidden', type === 'transfer');
    document.getElementById('targetWalletWrapper').classList.toggle('hidden', type !== 'transfer');
    document.getElementById('lblSourceWallet').textContent = type === 'income' ? 'Masuk ke Dompet' : 'Dari Dompet';

    if (type === 'income' && txModalState.category === 'makan') {
        selectTxCategory('gaji');
    } else if (type === 'expense' && txModalState.category === 'gaji') {
        selectTxCategory('makan');
    }
}

function selectTxCategory(catId) {
    txModalState.category = catId;
    document.querySelectorAll('.tx-cat-btn').forEach(btn => {
        const isSel = btn.dataset.cat === catId;
        btn.classList.toggle('border-indigo-600', isSel);
        btn.classList.toggle('bg-indigo-50', isSel);
        btn.classList.toggle('dark:bg-indigo-950/50', isSel);
    });
}

function applyQuickTemplate(tplId) {
    const tpl = appState.templates.find(t => t.id === tplId);
    if (!tpl) return;
    txModalState.calcExpr = String(tpl.amount);
    updateCalcDisplay();
    selectTxCategory(tpl.category);
    document.getElementById('txNote').value = tpl.name;
}

// Built-in Safe Calculator Logic
function getEvaluatedAmount() {
    try {
        const sanitized = txModalState.calcExpr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/[^0-9+\-*/.]/g, '');
        if (!sanitized) return 0;
        // Remove trailing operator if any
        const cleanExpr = sanitized.replace(/[+\-*/.]+$/, '');
        if (!cleanExpr) return 0;
        const result = Function(`"use strict"; return (${cleanExpr})`)();
        return Math.max(0, Math.round(Number(result) || 0));
    } catch {
        return 0;
    }
}

function updateCalcDisplay() {
    const val = getEvaluatedAmount();
    document.getElementById('txAmountDisplay').value = val.toLocaleString('id-ID');
    const hasOp = /[+\-×÷]/.test(txModalState.calcExpr);
    document.getElementById('calcExpressionPreview').textContent = hasOp ? txModalState.calcExpr : '';
    updateMicroSaveAndSplitPreviews();
}

function calcInput(digit) {
    if (txModalState.calcExpr === '0') {
        txModalState.calcExpr = digit === '000' ? '0' : digit;
    } else {
        txModalState.calcExpr += digit;
    }
    updateCalcDisplay();
}

function calcOp(op) {
    if (/[+\-×÷]$/.test(txModalState.calcExpr)) {
        txModalState.calcExpr = txModalState.calcExpr.slice(0, -1) + op;
    } else {
        txModalState.calcExpr += op;
    }
    updateCalcDisplay();
}

function calcClear() {
    txModalState.calcExpr = '0';
    updateCalcDisplay();
}

function calcBackspace() {
    if (txModalState.calcExpr.length <= 1) {
        txModalState.calcExpr = '0';
    } else {
        txModalState.calcExpr = txModalState.calcExpr.slice(0, -1);
    }
    updateCalcDisplay();
}

function calcEquals() {
    const val = getEvaluatedAmount();
    txModalState.calcExpr = String(val);
    updateCalcDisplay();
}

function setMicroSavePct(pct) {
    txModalState.microSavePct = pct;
    document.querySelectorAll('.micro-pct-btn').forEach(btn => {
        const active = Number(btn.dataset.pct) === pct;
        btn.className = active
            ? 'micro-pct-btn active py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white'
            : 'micro-pct-btn py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300';
    });
    updateMicroSaveAndSplitPreviews();
}

function setSplitMode(mode) {
    txModalState.splitMode = mode;
    document.getElementById('btnSplitEqual').className = mode === 'equal'
        ? 'py-1.5 rounded-lg text-[11px] font-bold bg-amber-500 text-white'
        : 'py-1.5 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300';
    document.getElementById('btnSplitCustom').className = mode === 'custom'
        ? 'py-1.5 rounded-lg text-[11px] font-bold bg-amber-500 text-white'
        : 'py-1.5 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300';
    updateMicroSaveAndSplitPreviews();
}

function updateMicroSaveAndSplitPreviews() {
    const totalAmount = getEvaluatedAmount();
    const isSplit = document.getElementById('toggleSplitBill').checked;
    const friendInput = document.getElementById('splitFriendAmount');

    let personalExpense = totalAmount;
    if (isSplit) {
        if (txModalState.splitMode === 'equal') {
            const half = Math.floor(totalAmount / 2);
            friendInput.value = half;
            friendInput.readOnly = true;
            personalExpense = totalAmount - half;
        } else {
            friendInput.readOnly = false;
            const friendVal = Math.min(totalAmount, Math.max(0, parseInt(friendInput.value, 10) || 0));
            personalExpense = totalAmount - friendVal;
        }
        document.getElementById('splitPersonalPreview').textContent = formatRupiah(personalExpense, false);
    }

    const microAmt = Math.round((personalExpense * txModalState.microSavePct) / 100);
    document.getElementById('microSavePreview').textContent = `+ ${formatRupiah(microAmt, false)}`;
}

// ==========================================
// 11. RECEIVABLES MODAL (PIUTANG)
// ==========================================
function renderReceivablesModal() {
    const container = document.getElementById('receivablesListContainer');
    if (appState.receivables.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 text-center py-8">Belum ada catatan piutang patungan.</p>`;
        return;
    }

    container.innerHTML = appState.receivables.map(rec => `
    <div class="p-3.5 rounded-2xl border ${rec.paid ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-65' : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'} flex items-center justify-between gap-3">
      <div>
        <div class="flex items-center gap-1.5">
          <span class="text-xs font-extrabold text-slate-800 dark:text-slate-100">${rec.friendName}</span>
          ${rec.paid ? '<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">Lunas</span>' : ''}
        </div>
        <p class="text-[11px] text-slate-500 mt-0.5">${rec.note} • ${formatDateID(rec.date)}</p>
        <p class="text-xs font-extrabold text-amber-700 dark:text-amber-400 mt-1">${formatRupiah(rec.amount, false)}</p>
      </div>
      ${!rec.paid ? `
        <button onclick="markReceivablePaid('${rec.id}')" class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shrink-0 transition">
          Tandai Lunas
        </button>
      ` : ''}
    </div>
  `).join('');
}

function markReceivablePaid(recId) {
    const rec = appState.receivables.find(r => r.id === recId);
    if (!rec || rec.paid) return;

    rec.paid = true;
    const mainWallet = appState.wallets[0];
    if (mainWallet) {
        mainWallet.balance += Number(rec.amount) || 0;
    }

    appState.transactions.unshift({
        id: 'tx_' + Date.now(),
        type: 'income',
        amount: Number(rec.amount) || 0,
        walletId: mainWallet ? mainWallet.id : 'w_main',
        category: 'lainnya',
        note: `Pelunasan Patungan: ${rec.friendName}`,
        date: getTodayISO(),
        microSaved: 0
    });

    saveState();
    renderReceivablesModal();
    renderAll();
    showToast(`Piutang ${rec.friendName} lunas! Saldo masuk ke Dompet Utama.`);
}

// ==========================================
// 12. EVENT LISTENERS WIRING
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    appState = loadState();
    processRecurringTransactions();
    initOnboardingAndSecurity();
    renderAll();
    updateJsonDataStatus(jsonDataDirty
        ? 'Ada perubahan yang belum disimpan ke file JSON.'
        : legacyDataLoaded
            ? 'Data lama dari browser dimuat. Unduh sebagai JSON, lalu buka file itu saat kembali.'
            : 'Buka file JSON untuk melanjutkan data sebelumnya; perubahan perlu diunduh.');
    window.addEventListener('beforeunload', (event) => {
        if (!jsonDataDirty) return;
        event.preventDefault();
        event.returnValue = '';
    });

    // Onboarding: Guest 1-Click
    document.getElementById('btnGuestLogin').addEventListener('click', () => {
        appState.onboarded = true;
        appState.user.name = 'Tamu';
        appState.user.pinEnabled = false;
        saveState();
        initOnboardingAndSecurity();
        renderAll();
        showToast('Selamat datang di SakuPintar!');
    });

    // Onboarding: Custom Profile & PIN
    document.getElementById('formCustomOnboarding').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('obName').value.trim() || 'Pengguna';
        const pin = document.getElementById('obPin').value.trim();
        if (!/^\d{4}$/.test(pin)) {
            showToast('PIN harus terdiri dari 4 angka!', 'error');
            return;
        }
        appState.onboarded = true;
        appState.user.name = name;
        appState.user.pin = pin;
        appState.user.pinEnabled = true;
        saveState();
        initOnboardingAndSecurity();
        renderAll();
        showToast(`Profil ${name} dengan PIN aktif berhasil dibuat!`);
    });

    // PIN Lock Keypad
    document.querySelectorAll('.pin-key').forEach(btn => {
        btn.addEventListener('click', () => handlePinDigit(btn.dataset.key));
    });
    document.getElementById('btnPinClear').addEventListener('click', () => {
        pinEntryBuffer = '';
        updatePinDots();
    });
    document.getElementById('btnPinBack').addEventListener('click', () => {
        pinEntryBuffer = pinEntryBuffer.slice(0, -1);
        updatePinDots();
    });
    document.getElementById('btnLockNow').addEventListener('click', showPinLockScreen);

    // Theme Toggle
    document.getElementById('btnThemeToggle').addEventListener('click', () => {
        appState.user.theme = appState.user.theme === 'dark' ? 'light' : 'dark';
        applyTheme();
        saveState();
        if (currentTab === 'laporan') renderReports();
    });

    // Privacy Eye Toggle
    document.getElementById('btnTogglePrivacy').addEventListener('click', () => {
        appState.user.privacyMode = !appState.user.privacyMode;
        saveState();
        renderAll();
    });

    // Open Transaction Modal (+)
    document.getElementById('btnOpenTxModal').addEventListener('click', openTransactionModal);

    // Split Bill Toggle & Custom Input Listeners
    document.getElementById('toggleSplitBill').addEventListener('change', (e) => {
        document.getElementById('splitBillDetails').classList.toggle('hidden', !e.target.checked);
        updateMicroSaveAndSplitPreviews();
    });
    document.getElementById('splitFriendAmount').addEventListener('input', updateMicroSaveAndSplitPreviews);

    // Save Transaction Form Submission
    document.getElementById('formTransaction').addEventListener('submit', (e) => {
        e.preventDefault();
        const totalAmount = getEvaluatedAmount();
        if (totalAmount <= 0) {
            showToast('Masukkan nominal transaksi lebih dari Rp 0', 'error');
            return;
        }

        const type = txModalState.type;
        const walletId = document.getElementById('txWalletId').value;
        const wallet = getWalletObj(walletId);
        const note = document.getElementById('txNote').value.trim();
        const date = document.getElementById('txDate').value || getTodayISO();

        if (type === 'transfer') {
            const targetWalletId = document.getElementById('txTargetWalletId').value;
            if (walletId === targetWalletId) {
                showToast('Pilih dompet tujuan yang berbeda!', 'error');
                return;
            }
            const targetWallet = getWalletObj(targetWalletId);
            wallet.balance -= totalAmount;
            targetWallet.balance += totalAmount;

            appState.transactions.unshift({
                id: 'tx_' + Date.now(),
                type: 'transfer',
                amount: totalAmount,
                walletId: wallet.id,
                targetWalletId: targetWallet.id,
                category: 'lainnya',
                note: note || `Transfer ke ${targetWallet.name}`,
                date,
                microSaved: 0
            });
            showToast(`Transfer ${formatRupiah(totalAmount, false)} berhasil!`);
        } else if (type === 'income') {
            wallet.balance += totalAmount;
            appState.transactions.unshift({
                id: 'tx_' + Date.now(),
                type: 'income',
                amount: totalAmount,
                walletId: wallet.id,
                category: txModalState.category,
                note: note || getCategoryObj(txModalState.category).name,
                date,
                microSaved: 0
            });
            showToast(`Pemasukan ${formatRupiah(totalAmount, false)} dicatat!`);
        } else {
            // EXPENSE (with optional Split Bill & Micro-Saving)
            const isSplit = document.getElementById('toggleSplitBill').checked;
            let personalExpense = totalAmount;
            let friendShare = 0;
            let splitReceivableId = null;

            if (isSplit) {
                friendShare = Math.min(totalAmount, Math.max(0, parseInt(document.getElementById('splitFriendAmount').value, 10) || 0));
                personalExpense = totalAmount - friendShare;
                const friendName = document.getElementById('splitFriendName').value.trim() || 'Teman';

                if (friendShare > 0) {
                    splitReceivableId = 'rec_' + Date.now();
                    appState.receivables.unshift({
                        id: splitReceivableId,
                        friendName,
                        amount: friendShare,
                        note: note || 'Patungan',
                        date,
                        paid: false
                    });
                }
            }

            const microSaved = Math.round((personalExpense * txModalState.microSavePct) / 100);

            // Deduct total money leaving wallet (total bill paid upfront + micro-saving transfer)
            wallet.balance -= (totalAmount + microSaved);
            if (microSaved > 0) {
                appState.piggyBank.balance += microSaved;
            }

            appState.transactions.unshift({
                id: 'tx_' + Date.now(),
                type: 'expense',
                amount: personalExpense,
                walletId: wallet.id,
                category: txModalState.category,
                note: note || getCategoryObj(txModalState.category).name,
                date,
                microSaved,
                splitReceivableId
            });

            showToast(microSaved > 0
                ? `Pengeluaran dicatat + ${formatRupiah(microSaved, false)} masuk Celengan!`
                : 'Pengeluaran berhasil dicatat!');
        }

        saveState();
        closeModal('txModal');
        renderAll();
    });

    // Add Wallet Modal
    document.getElementById('btnOpenAddWallet').addEventListener('click', () => {
        document.getElementById('newWalletName').value = '';
        document.getElementById('newWalletBalance').value = '0';
        openModal('addWalletModal');
    });

    document.querySelectorAll('#walletColorPicker button').forEach(btn => {
        btn.addEventListener('click', () => {
            txModalState.selectedWalletColor = btn.dataset.color;
            document.querySelectorAll('#walletColorPicker button').forEach(b => b.classList.remove('ring-2', 'ring-offset-2'));
            btn.classList.add('ring-2', 'ring-offset-2');
        });
    });

    document.getElementById('formAddWallet').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('newWalletName').value.trim();
        const balance = parseInt(document.getElementById('newWalletBalance').value, 10) || 0;
        if (!name) return;

        appState.wallets.push({
            id: 'w_' + Date.now(),
            name,
            balance,
            color: txModalState.selectedWalletColor
        });
        saveState();
        closeModal('addWalletModal');
        renderAll();
        showToast(`Dompet "${name}" ditambahkan!`);
    });

    // Receivables Modal
    document.getElementById('btnOpenReceivablesModal').addEventListener('click', () => {
        renderReceivablesModal();
        openModal('receivablesModal');
    });

    // Custom Template Modal
    document.getElementById('btnOpenAddTemplate').addEventListener('click', () => {
        document.getElementById('tplCategory').innerHTML = CATEGORIES
            .filter(c => c.id !== 'gaji')
            .map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        openModal('addTemplateModal');
    });

    document.getElementById('formAddTemplate').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('tplName').value.trim();
        const amount = parseInt(document.getElementById('tplAmount').value, 10) || 0;
        const category = document.getElementById('tplCategory').value;
        if (!name || amount <= 0) return;

        appState.templates.push({ id: 'tpl_' + Date.now(), name, amount, category });
        saveState();
        closeModal('addTemplateModal');
        populateTxModalSelectors();
        showToast(`Template "${name}" disimpan!`);
    });

    // Add Savings Goal Modal
    document.getElementById('btnOpenAddGoal').addEventListener('click', () => {
        document.getElementById('goalTitle').value = '';
        document.getElementById('goalTargetAmount').value = '';
        document.getElementById('goalDeadline').value = getTodayISO();
        openModal('addGoalModal');
    });

    document.getElementById('formAddGoal').addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('goalTitle').value.trim();
        const targetAmount = parseInt(document.getElementById('goalTargetAmount').value, 10) || 0;
        const deadline = document.getElementById('goalDeadline').value;
        if (!title || targetAmount <= 0) return;

        appState.goals.push({
            id: 'goal_' + Date.now(),
            title,
            targetAmount,
            currentAmount: 0,
            deadline
        });
        saveState();
        closeModal('addGoalModal');
        renderAll();
        showToast(`Target "${title}" berhasil dibuat!`);
    });

    // Withdraw Piggy Bank Modal
    document.getElementById('btnOpenWithdrawPiggy').addEventListener('click', () => {
        document.getElementById('withdrawAmount').value = '';
        document.getElementById('withdrawTargetWallet').innerHTML = appState.wallets
            .map(w => `<option value="${w.id}">${w.name}</option>`).join('');
        openModal('withdrawPiggyModal');
    });

    document.getElementById('formWithdrawPiggy').addEventListener('submit', (e) => {
        e.preventDefault();
        const amt = parseInt(document.getElementById('withdrawAmount').value, 10) || 0;
        const walletId = document.getElementById('withdrawTargetWallet').value;
        if (amt <= 0 || amt > appState.piggyBank.balance) {
            showToast('Nominal melebihi saldo Celengan Utama!', 'error');
            return;
        }

        const wallet = getWalletObj(walletId);
        appState.piggyBank.balance -= amt;
        wallet.balance += amt;

        appState.transactions.unshift({
            id: 'tx_' + Date.now(),
            type: 'transfer',
            amount: amt,
            walletId: wallet.id,
            fromPiggy: true,
            category: 'lainnya',
            note: `Tarik Celengan ke ${wallet.name}`,
            date: getTodayISO(),
            microSaved: 0
        });

        saveState();
        closeModal('withdrawPiggyModal');
        renderAll();
        showToast(`${formatRupiah(amt, false)} dipindahkan ke ${wallet.name}!`);
    });

    // History Search & Filter Listeners
    document.getElementById('searchHistoryInput').addEventListener('input', renderHistory);
    document.getElementById('filterHistoryType').addEventListener('change', renderHistory);
    document.getElementById('filterHistoryWallet').addEventListener('change', renderHistory);

    // Recurring Transaction Modal
    document.getElementById('btnOpenAddRecurring').addEventListener('click', () => {
        document.getElementById('recCategory').innerHTML = CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        document.getElementById('recWallet').innerHTML = appState.wallets.map(w => `<option value="${w.id}">${w.name}</option>`).join('');
        document.getElementById('recNextDate').value = getTodayISO();
        openModal('addRecurringModal');
    });

    document.getElementById('formAddRecurring').addEventListener('submit', (e) => {
        e.preventDefault();
        const type = document.getElementById('recType').value;
        const freq = document.getElementById('recFreq').value;
        const note = document.getElementById('recNote').value.trim();
        const amount = parseInt(document.getElementById('recAmount').value, 10) || 0;
        const nextDate = document.getElementById('recNextDate').value;
        const category = document.getElementById('recCategory').value;
        const walletId = document.getElementById('recWallet').value;

        appState.recurring.push({
            id: 'rec_sched_' + Date.now(),
            type,
            freq,
            note,
            amount,
            nextDate,
            category,
            walletId,
            active: true
        });

        processRecurringTransactions();
        saveState();
        closeModal('addRecurringModal');
        renderAll();
        showToast('Jadwal transaksi berulang disimpan!');
    });

    // PIN Settings Toggle
    document.getElementById('togglePinSetting').addEventListener('change', (e) => {
        if (e.target.checked) {
            document.getElementById('newPinInput').value = '';
            openModal('setupPinModal');
        } else {
            appState.user.pinEnabled = false;
            saveState();
            renderAll();
            showToast('Kunci PIN dinonaktifkan.');
        }
    });

    document.getElementById('formSetupPin').addEventListener('submit', (e) => {
        e.preventDefault();
        const pin = document.getElementById('newPinInput').value.trim();
        if (!/^\d{4}$/.test(pin)) {
            showToast('PIN wajib 4 digit angka!', 'error');
            return;
        }
        appState.user.pin = pin;
        appState.user.pinEnabled = true;
        saveState();
        closeModal('setupPinModal');
        renderAll();
        showToast('PIN keamanan 4-digit aktif!');
    });

    // Export CSV
    document.getElementById('btnExportCSV').addEventListener('click', () => {
        if (appState.transactions.length === 0) {
            showToast('Belum ada transaksi untuk diexport.', 'warning');
            return;
        }
        const headers = ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Dompet', 'Nominal', 'Auto_Celengan', 'Catatan'];
        const rows = appState.transactions.map(t => [
            t.id,
            t.date,
            t.type,
            getCategoryObj(t.category).name,
            getWalletObj(t.walletId)?.name || '',
            t.amount,
            t.microSaved || 0,
            `"${(t.note || '').replace(/"/g, '""')}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', `SakuPintar_Transaksi_${getTodayISO()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        showToast('File CSV berhasil diunduh!');
    });

    // Download the current app state as a separate JSON data file.
    document.getElementById('btnBackupJSON').addEventListener('click', () => {
        const backup = {
            metadata: {
                app: 'SakuPintar',
                schemaVersion: BACKUP_SCHEMA_VERSION,
                exportedAt: new Date().toISOString()
            },
            data: appState
        };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', downloadUrl);
        link.setAttribute('download', `SakuPintar_Data_${getTodayISO()}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        jsonDataDirty = false;
        legacyDataLoaded = false;
        updateJsonDataStatus('File JSON diunduh. Buka file unduhan ini lagi untuk melanjutkan data.');
        showToast('Data JSON berhasil diunduh!');
    });

    // Load the app state from a separate JSON data file.
    document.getElementById('inputRestoreJSON').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const imported = JSON.parse(evt.target.result);
                appState = validateAndMergeImportedState(imported);
                jsonDataDirty = false;
                legacyDataLoaded = false;
                initOnboardingAndSecurity();
                renderAll();
                updateJsonDataStatus(`File "${file.name}" dibuka. Unduh lagi setelah mengubah data.`);
                showToast('Data berhasil dibuka dari file JSON!');
            } catch {
                showToast('File JSON tidak valid atau rusak!', 'error');
            }
            e.target.value = '';
        };
        reader.onerror = () => {
            showToast('File JSON tidak dapat dibaca!', 'error');
            e.target.value = '';
        };
        reader.readAsText(file);
    });

    // Reset All Data (Double Confirmation)
    document.getElementById('btnResetAllData').addEventListener('click', () => {
        showConfirm(
            'Reset Semua Data?',
            'Data yang sedang dibuka akan direset. File JSON di perangkat tidak terhapus; unduh data kosong untuk menggantikannya.',
            () => {
                showConfirm(
                    'Konfirmasi Terakhir',
                    'Data aktif dan penyimpanan lama browser akan dihapus. File JSON di perangkat tetap ada.',
                    () => {
                        localStorage.removeItem(LEGACY_STORAGE_KEY);
                        appState = getDefaultState();
                        legacyDataLoaded = false;
                        saveState();
                        initOnboardingAndSecurity();
                        renderAll();
                    }
                );
            }
        );
    });
});

function cancelSetupPin() {
    document.getElementById('togglePinSetting').checked = false;
    closeModal('setupPinModal');
}