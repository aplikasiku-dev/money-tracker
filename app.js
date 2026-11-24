/* ==========================================================================
   SAKUPINTAR CORE LOGIC — AUTO-PILOT PERSONAL FINANCE (LOCALSTORAGE)
   ========================================================================== */

const STORAGE_KEY = 'sakupintar_data_v2';

// Default State (Otomatis membuat Dompet Utama & Celengan Utama)
const getDefaultState = () => ({
    user: null, // { name, isGuest }
    settings: {
        darkMode: false,
        privacyMode: false,
        pin: null, // 4-digit string
        autoSaveSurplus: true, // Auto-tabung sisa jatah harian kemarin
        lastActiveDate: getTodayStr(),
        lastBackupDate: null
    },
    wallets: [
        {
            id: 'wallet_main',
            name: 'Dompet Utama',
            balance: 0,
            color: 'from-slate-800 to-slate-950',
            isMain: true
        }
    ],
    mainPiggyBank: 0, // Celengan Utama bawaan
    specificGoals: [], // Opsional: { id, name, target, saved, deadline }
    transactions: [], // { id, type, amount, walletId, toWalletId, category, note, date, timestamp }
    receivables: [], // { id, friendName, amount, note, walletId, date, paid }
    recurring: [], // { id, type, title, amount, frequency, nextDate, walletId }
    templates: [
        { id: 'tpl_1', label: 'Parkir', amount: 2000, category: 'Transportasi' },
        { id: 'tpl_2', label: 'Makan', amount: 15000, category: 'Makan & Minum' },
        { id: 'tpl_3', label: 'Kopi', amount: 18000, category: 'Makan & Minum' },
        { id: 'tpl_4', label: 'Bensin', amount: 25000, category: 'Transportasi' }
    ]
});

let state = loadState();

// Variabel sementara untuk modal transaksi & PIN
let currentTxType = 'expense';
let calcBuffer = '0';
let selectedPiggyPct = 0;
let selectedWalletColor = 'from-slate-800 to-slate-950';
let pinInputBuffer = '';
let isSettingNewPin = false;

/* ==================== HELPER UTILITIES ==================== */
function getTodayStr() {
    const d = new Date();
    return d.toISOString().split('T')[0];
}

function getCurrentMonthStr() {
    return getTodayStr().slice(0, 7);
}

function formatRupiah(num, forceShow = false) {
    if (state.settings.privacyMode && !forceShow) {
        return 'Rp ••••••';
    }
    const val = Math.round(Number(num) || 0);
    return 'Rp ' + val.toLocaleString('id-ID');
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    const bg =
        type === 'success'
            ? 'bg-emerald-600 text-white'
            : type === 'error'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-900 text-yellow-400 border border-slate-700';
    el.className = `${bg} px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl text-center transition-all duration-300`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
    }, 2600);
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return getDefaultState();
        const parsed = JSON.parse(raw);
        return { ...getDefaultState(), ...parsed };
    } catch (e) {
        return getDefaultState();
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ==================== AUTO-ENGINE: GANTI HARI & RECURRING ==================== */
function runDailyAutomation() {
    const today = getTodayStr();
    const lastDate = state.settings.lastActiveDate;

    // 1. Auto-Tabung Sisa Jatah Harian Kemarin jika berganti tanggal
    if (lastDate && lastDate !== today && state.settings.autoSaveSurplus) {
        const mainWallet = state.wallets.find((w) => w.isMain) || state.wallets[0];
        if (mainWallet && mainWallet.balance > 0) {
            // Hitung jatah kemarin berdasarkan sisa hari bulan pada tanggal kemarin
            const prevDateObj = new Date(lastDate);
            const daysInPrevMonth = new Date(prevDateObj.getFullYear(), prevDateObj.getMonth() + 1, 0).getDate();
            const remainingDaysPrev = Math.max(1, daysInPrevMonth - prevDateObj.getDate() + 1);

            const spentYesterday = state.transactions
                .filter((t) => t.type === 'expense' && t.walletId === mainWallet.id && t.date === lastDate)
                .reduce((acc, t) => acc + t.amount, 0);

            const balanceStartYesterday = mainWallet.balance + spentYesterday;
            const quotaYesterday = Math.floor(balanceStartYesterday / remainingDaysPrev);
            const surplus = quotaYesterday - spentYesterday;

            if (surplus > 0 && mainWallet.balance >= surplus) {
                mainWallet.balance -= surplus;
                state.mainPiggyBank += surplus;
                state.transactions.unshift({
                    id: 'tx_auto_' + Date.now(),
                    type: 'transfer',
                    amount: surplus,
                    walletId: mainWallet.id,
                    toWalletId: 'piggy_main',
                    category: 'Auto-Tabung Sisa Jatah',
                    note: `Sisa jatah tanggal ${lastDate} masuk Celengan Utama`,
                    date: today,
                    timestamp: Date.now()
                });
                showToast(`🐷 Auto-Tabung: ${formatRupiah(surplus, true)} sisa jatah masuk Celengan!`, 'success');
            }
        }
    }

    state.settings.lastActiveDate = today;

    // 2. Eksekusi Transaksi Berulang (Auto-Recurring) yang jatuh tempo
    let executedCount = 0;
    state.recurring.forEach((item) => {
        while (item.nextDate <= today) {
            const targetWallet = state.wallets.find((w) => w.id === item.walletId) || state.wallets[0];
            if (targetWallet) {
                if (item.type === 'income') {
                    targetWallet.balance += item.amount;
                } else {
                    targetWallet.balance = Math.max(0, targetWallet.balance - item.amount);
                }
                state.transactions.unshift({
                    id: 'tx_rec_' + Date.now() + Math.random().toString(36).slice(2, 6),
                    type: item.type,
                    amount: item.amount,
                    walletId: targetWallet.id,
                    category: item.type === 'income' ? 'Pemasukan Rutin' : 'Tagihan & Kuota',
                    note: `[Otomatis] ${item.title}`,
                    date: item.nextDate,
                    timestamp: Date.now()
                });
                executedCount++;
            }
            // Majukan tanggal jatuh tempo berikutnya
            item.nextDate = advanceDate(item.nextDate, item.frequency);
        }
    });

    if (executedCount > 0) {
        showToast(`⚡ ${executedCount} transaksi berulang otomatis dicatat!`, 'info');
    }

    saveState();
}

function advanceDate(dateStr, freq) {
    const d = new Date(dateStr);
    if (freq === 'daily') d.setDate(d.getDate() + 1);
    else if (freq === 'weekly') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
}

/* ==================== JATAH AMAN HARIAN OTOMATIS ==================== */
function calculateSafeDailyAllowance() {
    const mainWallet = state.wallets.find((w) => w.isMain) || state.wallets[0];
    const currentBalance = mainWallet ? mainWallet.balance : 0;

    const now = new Date();
    const todayStr = getTodayStr();
    const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDays = Math.max(1, totalDaysInMonth - now.getDate() + 1);

    // Pengeluaran dari Dompet Utama hari ini
    const spentToday = state.transactions
        .filter((t) => t.type === 'expense' && t.walletId === mainWallet.id && t.date === todayStr)
        .reduce((sum, t) => sum + t.amount, 0);

    // Saldo Dompet Utama di awal hari ini = Saldo sekarang + Pengeluaran hari ini
    const startOfDayBalance = currentBalance + spentToday;
    const initialDailyQuota = Math.max(0, Math.floor(startOfDayBalance / remainingDays));
    const remainingToday = initialDailyQuota - spentToday;

    let pct = 100;
    if (initialDailyQuota > 0) {
        pct = Math.max(0, Math.min(100, Math.round((remainingToday / initialDailyQuota) * 100)));
    } else if (spentToday > 0) {
        pct = 0;
    }

    // Status Warna: Hijau (Aman), Kuning (< 30%), Merah (Melewati jatah)
    let status = 'safe';
    if (remainingToday < 0 || (initialDailyQuota === 0 && spentToday > 0)) {
        status = 'danger';
    } else if (pct < 30) {
        status = 'warning';
    }

    return {
        initialDailyQuota,
        remainingToday,
        spentToday,
        remainingDays,
        pct,
        status
    };
}

/* ==================== RENDERING UI ==================== */
function applyTheme() {
    if (state.settings.darkMode) {
        document.documentElement.classList.add('dark');
        document.getElementById('btn-toggle-theme').textContent = '☀️';
    } else {
        document.documentElement.classList.remove('dark');
        document.getElementById('btn-toggle-theme').textContent = '🌙';
    }
}

function renderAll() {
    applyTheme();
    if (!state.user) {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('app-shell').classList.add('hidden');
        return;
    }

    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');

    // Header Greeting
    const now = new Date();
    document.getElementById('greeting-date').textContent = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    document.getElementById('user-greeting').textContent = `Halo, ${state.user.name} 👋`;
    document.getElementById('btn-toggle-privacy').textContent = state.settings.privacyMode ? '🙈' : '👁️';

    renderHomeDashboard();
    renderSavingsView();
    renderHistoryView();
    renderReportsView();
    populateWalletSelects();
}

function renderHomeDashboard() {
    // Net Worth
    const walletsTotal = state.wallets.reduce((sum, w) => sum + w.balance, 0);
    const goalsTotal = state.specificGoals.reduce((sum, g) => sum + g.saved, 0);
    const savingsTotal = state.mainPiggyBank + goalsTotal;
    const netWorth = walletsTotal + savingsTotal;

    document.getElementById('net-worth-display').textContent = formatRupiah(netWorth);
    document.getElementById('total-wallets-display').textContent = formatRupiah(walletsTotal);
    document.getElementById('total-savings-display').textContent = formatRupiah(savingsTotal);
    document.getElementById('active-wallets-count').textContent = `${state.wallets.length} Dompet + Celengan`;

    // Jatah Aman Harian
    const quota = calculateSafeDailyAllowance();
    const remEl = document.getElementById('daily-remaining-amount');
    const barEl = document.getElementById('daily-progress-bar');
    const badgeEl = document.getElementById('daily-status-badge');

    remEl.textContent = formatRupiah(quota.remainingToday);
    document.getElementById('daily-initial-quota').textContent = `dari ${formatRupiah(quota.initialDailyQuota)} / hari`;
    document.getElementById('daily-spent-today').textContent = formatRupiah(quota.spentToday);
    document.getElementById('days-left-label').textContent = `Sisa ${quota.remainingDays} hari bulan ini`;
    barEl.style.width = `${quota.pct}%`;

    // Reset & set warna dinamis
    remEl.className = 'text-base font-extrabold';
    barEl.className = 'h-full transition-all duration-300 rounded-full';
    badgeEl.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full';

    if (quota.status === 'safe') {
        remEl.classList.add('text-emerald-600', 'dark:text-emerald-400');
        barEl.classList.add('bg-emerald-500');
        badgeEl.classList.add('bg-emerald-100', 'text-emerald-700', 'dark:bg-emerald-950', 'dark:text-emerald-400');
        badgeEl.textContent = 'Aman';
    } else if (quota.status === 'warning') {
        remEl.classList.add('text-amber-500');
        barEl.classList.add('bg-amber-400');
        badgeEl.classList.add('bg-amber-100', 'text-amber-700', 'dark:bg-amber-950', 'dark:text-amber-400');
        badgeEl.textContent = 'Menipis (<30%)';
    } else {
        remEl.classList.add('text-rose-600', 'dark:text-rose-400');
        barEl.classList.add('bg-rose-500');
        badgeEl.classList.add('bg-rose-100', 'text-rose-700', 'dark:bg-rose-950', 'dark:text-rose-400');
        badgeEl.textContent = 'Melewati Jatah!';
    }

    // Wallets Carousel
    const carousel = document.getElementById('wallets-carousel');
    carousel.innerHTML = state.wallets
        .map(
            (w) => `
      <div class="min-w-[155px] rounded-2xl bg-gradient-to-br ${w.color} text-white p-3.5 shadow-md flex flex-col justify-between shrink-0">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold truncate max-w-[100px]">${w.name}</span>
          ${w.isMain ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-yellow-400 text-slate-950 font-extrabold">UTAMA</span>' : ''}
        </div>
        <div>
          <span class="text-[10px] text-white/70 block">Saldo</span>
          <strong class="text-sm font-extrabold tracking-tight">${formatRupiah(w.balance)}</strong>
        </div>
      </div>
    `
        )
        .join('');

    // Smart Insights
    renderSmartInsights();

    // Receivables (Piutang Patungan)
    const unpaidReceivables = state.receivables.filter((r) => !r.paid);
    const recSection = document.getElementById('home-receivables-section');
    if (unpaidReceivables.length > 0) {
        recSection.classList.remove('hidden');
        const totalRec = unpaidReceivables.reduce((s, r) => s + r.amount, 0);
        document.getElementById('total-receivables-badge').textContent = formatRupiah(totalRec);
        document.getElementById('home-receivables-list').innerHTML = unpaidReceivables
            .map(
                (r) => `
        <div class="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div>
            <p class="text-xs font-extrabold">${r.friendName} <span class="font-normal text-slate-400">(${r.note || 'Patungan'})</span></p>
            <p class="text-xs font-bold text-amber-600 dark:text-yellow-400">${formatRupiah(r.amount)}</p>
          </div>
          <button type="button" onclick="markReceivablePaid('${r.id}')" class="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold shadow-xs">
            ✓ Lunas
          </button>
        </div>
      `
            )
            .join('');
    } else {
        recSection.classList.add('hidden');
    }

    // Recent Transactions (Max 5)
    const recentList = document.getElementById('recent-transactions-list');
    const recentTxs = state.transactions.slice(0, 5);
    recentList.innerHTML = recentTxs.length
        ? recentTxs.map((tx) => renderTransactionItem(tx)).join('')
        : `<div class="text-center py-6 text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">Belum ada transaksi. Tekan tombol <strong>+</strong> di bawah untuk mulai!</div>`;
}

function renderTransactionItem(tx) {
    const wallet = state.wallets.find((w) => w.id === tx.walletId);
    const walletName = wallet ? wallet.name : 'Dompet';
    const isExpense = tx.type === 'expense';
    const isIncome = tx.type === 'income';
    const sign = isExpense ? '-' : isIncome ? '+' : '⇄';
    const amountColor = isExpense
        ? 'text-rose-600 dark:text-rose-400'
        : isIncome
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-blue-600 dark:text-blue-400';

    return `
    <div class="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm shrink-0">
          ${isExpense ? '💸' : isIncome ? '💰' : '🔄'}
        </div>
        <div class="min-w-0">
          <p class="text-xs font-extrabold truncate">${tx.note || tx.category}</p>
          <p class="text-[10px] text-slate-400">${tx.category} • ${walletName} • ${tx.date}</p>
        </div>
      </div>
      <span class="text-xs font-extrabold ${amountColor} shrink-0 ml-2">${sign} ${formatRupiah(tx.amount)}</span>
    </div>
  `;
}

function renderSmartInsights() {
    const list = document.getElementById('smart-insights-list');
    const insights = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 14);

    const thisWeekStr = sevenDaysAgo.toISOString().split('T')[0];
    const lastWeekStr = fourteenDaysAgo.toISOString().split('T')[0];

    const thisWeekExpenses = state.transactions.filter((t) => t.type === 'expense' && t.date >= thisWeekStr);
    const lastWeekExpenses = state.transactions.filter(
        (t) => t.type === 'expense' && t.date >= lastWeekStr && t.date < thisWeekStr
    );

    // 1. Kategori paling boros minggu ini
    if (thisWeekExpenses.length > 0) {
        const byCat = {};
        thisWeekExpenses.forEach((t) => {
            byCat[t.category] = (byCat[t.category] || 0) + t.amount;
        });
        const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
        insights.push(`• Kategori paling boros 7 hari terakhir: <strong>${topCat[0]}</strong> (${formatRupiah(topCat[1])}).`);
    } else {
        insights.push('• Belum ada pengeluaran minggu ini. Jatah harianmu masih utuh!');
    }

    // 2. Perbandingan minggu ini vs minggu lalu
    const sumThis = thisWeekExpenses.reduce((s, t) => s + t.amount, 0);
    const sumLast = lastWeekExpenses.reduce((s, t) => s + t.amount, 0);
    if (sumLast > 0) {
        const diffPct = Math.round(((sumThis - sumLast) / sumLast) * 100);
        if (diffPct > 0) {
            insights.push(`• Pengeluaran minggu ini <strong>naik ${diffPct}%</strong> dibanding minggu lalu.`);
        } else {
            insights.push(`• Mantap! Pengeluaran minggu ini <strong>lebih hemat ${Math.abs(diffPct)}%</strong> dari minggu lalu.`);
        }
    }

    // 3. Pengingat backup data > 7 hari
    const backupBadge = document.getElementById('insight-backup-badge');
    const lastBackup = state.settings.lastBackupDate;
    const needBackup = !lastBackup || (now - new Date(lastBackup)) / (1000 * 60 * 60 * 24) >= 7;
    if (needBackup && state.transactions.length > 0) {
        backupBadge.classList.remove('hidden');
        insights.push('• ⚠️ Kamu belum backup data dalam 7 hari terakhir. Unduh JSON di menu Laporan.');
    } else {
        backupBadge.classList.add('hidden');
    }

    list.innerHTML = insights.map((i) => `<li>${i}</li>`).join('');
}

function renderSavingsView() {
    document.getElementById('main-piggy-balance').textContent = formatRupiah(state.mainPiggyBank);
    document.getElementById('toggle-auto-save-surplus').checked = state.settings.autoSaveSurplus;

    const goalsList = document.getElementById('specific-goals-list');
    if (state.specificGoals.length === 0) {
        goalsList.innerHTML = `<p class="text-xs text-slate-400 text-center py-3">Belum ada target spesifik. Gunakan Celengan Utama di atas untuk nabung praktis!</p>`;
        return;
    }

    goalsList.innerHTML = state.specificGoals
        .map((g) => {
            const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
            return `
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
          <div class="flex justify-between items-center mb-1">
            <strong class="text-xs font-extrabold">${g.name}</strong>
            <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">${pct}%</span>
          </div>
          <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
            <div class="h-full bg-emerald-500" style="width: ${pct}%"></div>
          </div>
          <div class="flex items-center justify-between text-[11px] text-slate-500">
            <span>${formatRupiah(g.saved)} / ${formatRupiah(g.target)}</span>
            <button type="button" onclick="addFundToGoal('${g.id}')" class="font-bold text-slate-900 dark:text-yellow-400">+ Isi Rp 20rb</button>
          </div>
        </div>
      `;
        })
        .join('');
}

function renderHistoryView() {
    const search = document.getElementById('filter-search').value.toLowerCase();
    const month = document.getElementById('filter-month').value;
    const type = document.getElementById('filter-type').value;
    const walletId = document.getElementById('filter-wallet').value;

    const filtered = state.transactions.filter((tx) => {
        const matchSearch =
            (tx.note || '').toLowerCase().includes(search) || (tx.category || '').toLowerCase().includes(search);
        const matchMonth = !month || tx.date.startsWith(month);
        const matchType = type === 'all' || tx.type === type;
        const matchWallet = walletId === 'all' || tx.walletId === walletId;
        return matchSearch && matchMonth && matchType && matchWallet;
    });

    const container = document.getElementById('full-history-list');
    container.innerHTML = filtered.length
        ? filtered.map((tx) => renderTransactionItem(tx)).join('')
        : `<p class="text-center text-xs text-slate-400 py-8">Tidak ada transaksi yang cocok dengan filter.</p>`;
}

function renderReportsView() {
    const picker = document.getElementById('report-month-picker');
    if (!picker.value) picker.value = getCurrentMonthStr();
    const selectedMonth = picker.value;

    const monthlyTxs = state.transactions.filter((t) => t.date.startsWith(selectedMonth));
    const income = monthlyTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthlyTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    document.getElementById('report-income').textContent = formatRupiah(income);
    document.getElementById('report-expense').textContent = formatRupiah(expense);

    // Category Breakdown
    const catMap = {};
    monthlyTxs
        .filter((t) => t.type === 'expense')
        .forEach((t) => {
            catMap[t.category] = (catMap[t.category] || 0) + t.amount;
        });

    const catContainer = document.getElementById('category-breakdown-list');
    const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
        catContainer.innerHTML = `<p class="text-xs text-slate-400">Belum ada pengeluaran pada bulan ini.</p>`;
    } else {
        catContainer.innerHTML = entries
            .map(([cat, amt]) => {
                const pct = expense > 0 ? Math.round((amt / expense) * 100) : 0;
                return `
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="font-semibold">${cat}</span>
              <span class="font-bold">${formatRupiah(amt)} (${pct}%)</span>
            </div>
            <div class="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full bg-yellow-400 rounded-full" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
            })
            .join('');
    }

    // Recurring List
    const recContainer = document.getElementById('recurring-list');
    recContainer.innerHTML = state.recurring.length
        ? state.recurring
            .map(
                (r) => `
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
          <div>
            <p class="font-bold">${r.title} <span class="text-[10px] text-slate-400">(${r.frequency})</span></p>
            <p class="text-[11px] text-slate-500">Berikutnya: ${r.nextDate} • ${formatRupiah(r.amount)}</p>
          </div>
          <button type="button" onclick="deleteRecurring('${r.id}')" class="text-rose-500 font-bold px-2">Hapus</button>
        </div>
      `
            )
            .join('')
        : `<p class="text-xs text-slate-400">Belum ada jadwal transaksi berulang.</p>`;

    // PIN Status
    document.getElementById('pin-status-label').textContent = state.settings.pin
        ? 'Aktif (4-digit PIN terpasang)'
        : 'Belum aktif';
}

function populateWalletSelects() {
    const optionsHtml = state.wallets.map((w) => `<option value="${w.id}">${w.name}</option>`).join('');
    document.getElementById('tx-wallet-select').innerHTML = optionsHtml;
    document.getElementById('tx-to-wallet-select').innerHTML = optionsHtml;
    document.getElementById('filter-wallet').innerHTML = `<option value="all">Semua Dompet</option>` + optionsHtml;
}

/* ==================== MODAL & CALCULATOR LOGIC ==================== */
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function renderQuickTemplates() {
    const bar = document.getElementById('quick-templates-bar');
    bar.innerHTML = state.templates
        .map(
            (tpl) => `
      <button type="button" onclick="executeOneTapTemplate('${tpl.id}')" class="shrink-0 px-3 py-1.5 rounded-xl bg-amber-100/80 dark:bg-slate-800 border border-amber-300/60 dark:border-slate-700 text-xs font-bold hover:bg-yellow-400 hover:text-slate-950 transition">
        ${tpl.label} • Rp ${(tpl.amount / 1000).toLocaleString('id-ID')}rb
      </button>
    `
        )
        .join('');
}

window.executeOneTapTemplate = function (tplId) {
    const tpl = state.templates.find((t) => t.id === tplId);
    if (!tpl) return;
    const walletId = document.getElementById('tx-wallet-select').value || state.wallets[0].id;
    const wallet = state.wallets.find((w) => w.id === walletId);
    if (!wallet) return;

    wallet.balance -= tpl.amount;
    state.transactions.unshift({
        id: 'tx_1tap_' + Date.now(),
        type: 'expense',
        amount: tpl.amount,
        walletId: wallet.id,
        category: tpl.category,
        note: tpl.label,
        date: getTodayStr(),
        timestamp: Date.now()
    });

    saveState();
    closeModal('modal-transaction');
    renderAll();
    showToast(`⚡ 1-Tap: ${tpl.label} (${formatRupiah(tpl.amount, true)}) tersimpan!`, 'success');
};

function evaluateCalcBuffer() {
    try {
        // Sanitasi ekspresi matematika sederhana
        const sanitized = calcBuffer.replace(/[^0-9+\-*/.]/g, '');
        if (!sanitized) return 0;
        const result = Function('"use strict";return (' + sanitized + ')')();
        return isFinite(result) ? Math.max(0, Math.round(result)) : 0;
    } catch (e) {
        return 0;
    }
}

function updateCalcDisplay() {
    const val = evaluateCalcBuffer();
    document.getElementById('calc-expression').textContent = /[+\-*/]/.test(calcBuffer) ? calcBuffer : '';
    document.getElementById('calc-display').textContent = val.toLocaleString('id-ID');
    updateSplitBillPreview();
}

function updateSplitBillPreview() {
    if (!document.getElementById('toggle-split-bill').checked) return;
    const total = evaluateCalcBuffer();
    const mode = document.getElementById('split-mode').value;
    let friendShare = 0;

    if (mode === 'equal') {
        friendShare = Math.floor(total / 2);
    } else {
        friendShare = Math.min(total, Number(document.getElementById('split-friend-amount').value) || 0);
    }
    const myShare = Math.max(0, total - friendShare);
    document.getElementById(
        'split-summary-text'
    ).textContent = `Bagianmu: ${formatRupiah(myShare, true)} • Piutang teman: ${formatRupiah(friendShare, true)}`;
}

/* ==================== CORE ACTIONS ==================== */
function saveTransaction() {
    const amount = evaluateCalcBuffer();
    if (amount <= 0) {
        showToast('Masukkan nominal transaksi terlebih dahulu!', 'error');
        return;
    }

    const walletId = document.getElementById('tx-wallet-select').value;
    const wallet = state.wallets.find((w) => w.id === walletId);
    const category = document.getElementById('tx-category-select').value;
    const note = document.getElementById('tx-note').value.trim();
    const today = getTodayStr();

    if (!wallet) return;

    if (currentTxType === 'expense') {
        const isSplit = document.getElementById('toggle-split-bill').checked;
        if (isSplit) {
            const friendName = document.getElementById('split-friend-name').value.trim() || 'Teman';
            const mode = document.getElementById('split-mode').value;
            const friendShare =
                mode === 'equal'
                    ? Math.floor(amount / 2)
                    : Math.min(amount, Number(document.getElementById('split-friend-amount').value) || 0);
            const myShare = Math.max(0, amount - friendShare);

            // Total tagihan keluar dari dompet user dulu, bagian user masuk pengeluaran, bagian teman masuk piutang
            wallet.balance -= amount;

            state.transactions.unshift({
                id: 'tx_' + Date.now(),
                type: 'expense',
                amount: myShare,
                walletId: wallet.id,
                category,
                note: `${note || category} (Patungan dg ${friendName})`,
                date: today,
                timestamp: Date.now()
            });

            if (friendShare > 0) {
                state.receivables.unshift({
                    id: 'rec_' + Date.now(),
                    friendName,
                    amount: friendShare,
                    note: note || category,
                    walletId: wallet.id,
                    date: today,
                    paid: false
                });
            }
            showToast(`🤝 Patungan dicatat! Piutang ${friendName}: ${formatRupiah(friendShare, true)}`, 'success');
        } else {
            wallet.balance -= amount;
            state.transactions.unshift({
                id: 'tx_' + Date.now(),
                type: 'expense',
                amount,
                walletId: wallet.id,
                category,
                note: note || category,
                date: today,
                timestamp: Date.now()
            });
            showToast('Pengeluaran berhasil dicatat!', 'success');
        }
    } else if (currentTxType === 'income') {
        // Cek persentase sisihkan ke Celengan Utama
        const piggyCut = Math.round((amount * selectedPiggyPct) / 100);
        const walletNet = amount - piggyCut;

        wallet.balance += walletNet;
        if (piggyCut > 0) {
            state.mainPiggyBank += piggyCut;
        }

        state.transactions.unshift({
            id: 'tx_' + Date.now(),
            type: 'income',
            amount: walletNet,
            walletId: wallet.id,
            category: 'Pemasukan',
            note:
                piggyCut > 0
                    ? `${note || 'Pemasukan'} (+${formatRupiah(piggyCut, true)} ke Celengan)`
                    : note || 'Pemasukan',
            date: today,
            timestamp: Date.now()
        });
        showToast(
            piggyCut > 0
                ? `💰 Masuk! ${formatRupiah(piggyCut, true)} otomatis masuk Celengan Utama`
                : 'Pemasukan berhasil dicatat!',
            'success'
        );
    } else if (currentTxType === 'transfer') {
        const toWalletId = document.getElementById('tx-to-wallet-select').value;
        if (walletId === toWalletId) {
            showToast('Pilih dompet tujuan yang berbeda!', 'error');
            return;
        }
        const toWallet = state.wallets.find((w) => w.id === toWalletId);
        wallet.balance -= amount;
        toWallet.balance += amount;

        state.transactions.unshift({
            id: 'tx_' + Date.now(),
            type: 'transfer',
            amount,
            walletId: wallet.id,
            toWalletId: toWallet.id,
            category: 'Transfer Antar Dompet',
            note: note || `Transfer ke ${toWallet.name}`,
            date: today,
            timestamp: Date.now()
        });
        showToast(`Transfer ke ${toWallet.name} berhasil!`, 'success');
    }

    // Reset form modal
    calcBuffer = '0';
    document.getElementById('tx-note').value = '';
    document.getElementById('toggle-split-bill').checked = false;
    document.getElementById('split-bill-fields').classList.add('hidden');
    saveState();
    closeModal('modal-transaction');
    renderAll();
}

window.markReceivablePaid = function (recId) {
    const rec = state.receivables.find((r) => r.id === recId);
    if (!rec || rec.paid) return;
    rec.paid = true;

    const wallet = state.wallets.find((w) => w.id === rec.walletId) || state.wallets[0];
    if (wallet) {
        wallet.balance += rec.amount;
    }

    state.transactions.unshift({
        id: 'tx_paid_' + Date.now(),
        type: 'income',
        amount: rec.amount,
        walletId: wallet.id,
        category: 'Pelunasan Piutang',
        note: `Lunas patungan dari ${rec.friendName}`,
        date: getTodayStr(),
        timestamp: Date.now()
    });

    saveState();
    renderAll();
    showToast(`✅ Piutang ${rec.friendName} (${formatRupiah(rec.amount, true)}) lunas & masuk saldo!`, 'success');
};

window.quickFillPiggy = function (amount) {
    const mainWallet = state.wallets.find((w) => w.isMain) || state.wallets[0];
    if (!mainWallet || mainWallet.balance < amount) {
        showToast('Saldo Dompet Utama tidak mencukupi!', 'error');
        return;
    }
    mainWallet.balance -= amount;
    state.mainPiggyBank += amount;
    state.transactions.unshift({
        id: 'tx_piggy_' + Date.now(),
        type: 'transfer',
        amount,
        walletId: mainWallet.id,
        toWalletId: 'piggy_main',
        category: 'Isi Celengan Utama',
        note: 'Menabung ke Celengan Utama',
        date: getTodayStr(),
        timestamp: Date.now()
    });
    saveState();
    renderAll();
    showToast(`🐷 Berhasil nabung ${formatRupiah(amount, true)} ke Celengan Utama!`, 'success');
};

window.addFundToGoal = function (goalId) {
    const amount = 20000;
    const mainWallet = state.wallets.find((w) => w.isMain) || state.wallets[0];
    const goal = state.specificGoals.find((g) => g.id === goalId);
    if (!goal || !mainWallet || mainWallet.balance < amount) {
        showToast('Saldo Dompet Utama kurang dari Rp 20.000', 'error');
        return;
    }
    mainWallet.balance -= amount;
    goal.saved += amount;
    saveState();
    renderAll();
    showToast(`🎯 +Rp 20.000 masuk ke target "${goal.name}"!`, 'success');
};

window.deleteRecurring = function (id) {
    state.recurring = state.recurring.filter((r) => r.id !== id);
    saveState();
    renderReportsView();
    showToast('Jadwal berulang dihapus.');
};

/* ==================== NAVIGATION ==================== */
window.switchTab = function (target) {
    document.querySelectorAll('.app-view').forEach((el) => el.classList.add('hidden'));
    document.getElementById(`view-${target}`).classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.target === target);
    });
};

/* ==================== PIN SECURITY LOCK ==================== */
function initPinLock() {
    if (state.user && state.settings.pin) {
        isSettingNewPin = false;
        pinInputBuffer = '';
        document.getElementById('pin-prompt-text').textContent = 'Masukkan 4-digit PIN keamanan Anda';
        document.getElementById('pin-lock-screen').classList.remove('hidden');
        updatePinDots();
    }
}

function updatePinDots() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, idx) => {
        dot.classList.toggle('filled', idx < pinInputBuffer.length);
    });
}

function handlePinDigit(num) {
    if (pinInputBuffer.length >= 4) return;
    pinInputBuffer += num;
    updatePinDots();

    if (pinInputBuffer.length === 4) {
        setTimeout(() => {
            if (isSettingNewPin) {
                state.settings.pin = pinInputBuffer;
                saveState();
                document.getElementById('pin-lock-screen').classList.add('hidden');
                renderReportsView();
                showToast('🔒 PIN 4-digit berhasil diaktifkan!', 'success');
            } else {
                if (pinInputBuffer === state.settings.pin) {
                    document.getElementById('pin-lock-screen').classList.add('hidden');
                } else {
                    showToast('PIN salah! Coba lagi.', 'error');
                }
            }
            pinInputBuffer = '';
            updatePinDots();
        }, 150);
    }
}

/* ==================== EVENT LISTENERS ==================== */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Screen Logic
    const tabLogin = document.getElementById('tab-auth-login');
    const tabRegister = document.getElementById('tab-auth-register');
    const authSubmitBtn = document.getElementById('auth-submit-btn');

    tabLogin.addEventListener('click', () => {
        tabLogin.className = 'py-2.5 text-sm font-bold rounded-lg bg-white text-slate-950 shadow transition-all';
        tabRegister.className = 'py-2.5 text-sm font-bold rounded-lg bg-slate-950 text-white transition-all';
        authSubmitBtn.textContent = 'Masuk ke SakuPintar';
    });

    tabRegister.addEventListener('click', () => {
        tabRegister.className = 'py-2.5 text-sm font-bold rounded-lg bg-white text-slate-950 shadow transition-all';
        tabLogin.className = 'py-2.5 text-sm font-bold rounded-lg bg-slate-950 text-white transition-all';
        authSubmitBtn.textContent = 'Buat Akun & Mulai';
    });

    document.getElementById('auth-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('auth-fullname').value.trim() || 'Pengguna';
        const pass = document.getElementById('auth-password').value.trim();
        state.user = { name, isGuest: false };
        if (/^\d{4}$/.test(pass)) {
            state.settings.pin = pass;
        }
        saveState();
        runDailyAutomation();
        renderAll();
        showToast(`Selamat datang, ${name}! Dompet Utama siap digunakan.`, 'success');
    });

    document.getElementById('btn-guest-login').addEventListener('click', () => {
        state.user = { name: 'Tamu', isGuest: true };
        saveState();
        runDailyAutomation();
        renderAll();
        showToast('⚡ Masuk sebagai Tamu! Dompet Utama (Rp 0) otomatis dibuat.', 'success');
    });

    // 2. Header Toggles (Privacy & Dark Mode)
    document.getElementById('btn-toggle-privacy').addEventListener('click', () => {
        state.settings.privacyMode = !state.settings.privacyMode;
        saveState();
        renderAll();
    });

    document.getElementById('btn-toggle-theme').addEventListener('click', () => {
        state.settings.darkMode = !state.settings.darkMode;
        saveState();
        applyTheme();
    });

    // 3. Bottom Navigation
    document.querySelectorAll('.nav-item').forEach((btn) => {
        btn.addEventListener('click', () => switchTab(btn.dataset.target));
    });

    // 4. Modal Catat Transaksi
    document.getElementById('btn-open-tx-modal').addEventListener('click', () => {
        calcBuffer = '0';
        updateCalcDisplay();
        renderQuickTemplates();
        openModal('modal-transaction');
    });

    document.querySelectorAll('.tx-type-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tx-type-tab').forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');
            currentTxType = tab.dataset.type;

            const isIncome = currentTxType === 'income';
            const isTransfer = currentTxType === 'transfer';
            const isExpense = currentTxType === 'expense';

            document.getElementById('income-piggy-chips').classList.toggle('hidden', !isIncome);
            document.getElementById('quick-templates-wrapper').classList.toggle('hidden', !isExpense);
            document.getElementById('split-bill-section').classList.toggle('hidden', !isExpense);
            document.getElementById('tx-category-group').classList.toggle('hidden', isTransfer);
            document.getElementById('tx-to-wallet-group').classList.toggle('hidden', !isTransfer);
            document.getElementById('tx-wallet-label').textContent = isIncome ? 'Masuk ke Dompet' : 'Dari Dompet';
        });
    });

    // Chip Persentase Celengan Utama
    document.querySelectorAll('.piggy-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.piggy-chip').forEach((c) => c.classList.remove('active'));
            chip.classList.add('active');
            selectedPiggyPct = Number(chip.dataset.pct);
        });
    });

    // Split Bill Toggles
    document.getElementById('toggle-split-bill').addEventListener('change', (e) => {
        document.getElementById('split-bill-fields').classList.toggle('hidden', !e.target.checked);
        updateSplitBillPreview();
    });

    document.getElementById('split-mode').addEventListener('change', (e) => {
        document.getElementById('split-custom-amount-wrap').classList.toggle('hidden', e.target.value !== 'custom');
        updateSplitBillPreview();
    });

    document.getElementById('split-friend-amount').addEventListener('input', updateSplitBillPreview);

    // Keypad Kalkulator Events
    document.querySelectorAll('.calc-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const val = btn.dataset.val;
            const action = btn.dataset.action;

            if (val) {
                if (calcBuffer === '0' && !['+', '-', '*', '/'].includes(val)) {
                    calcBuffer = val === '000' ? '0' : val;
                } else {
                    calcBuffer += val;
                }
            } else if (action === 'backspace') {
                calcBuffer = calcBuffer.length > 1 ? calcBuffer.slice(0, -1) : '0';
            } else if (action === 'clear') {
                calcBuffer = '0';
            } else if (action === 'equals') {
                calcBuffer = String(evaluateCalcBuffer());
            }
            updateCalcDisplay();
        });
    });

    document.getElementById('btn-save-transaction').addEventListener('click', saveTransaction);

    // 5. Modal Dompet Baru
    document.getElementById('btn-open-wallet-modal').addEventListener('click', () => openModal('modal-wallet'));
    document.querySelectorAll('.color-choice').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-choice').forEach((b) => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedWalletColor = btn.dataset.color;
        });
    });

    document.getElementById('form-add-wallet').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('wallet-name').value.trim();
        const balance = Number(document.getElementById('wallet-balance').value) || 0;
        state.wallets.push({
            id: 'wallet_' + Date.now(),
            name,
            balance,
            color: selectedWalletColor,
            isMain: false
        });
        saveState();
        closeModal('modal-wallet');
        e.target.reset();
        renderAll();
        showToast(`Dompet "${name}" ditambahkan!`, 'success');
    });

    // 6. Celengan Pintar & Target Spesifik
    document.getElementById('toggle-auto-save-surplus').addEventListener('change', (e) => {
        state.settings.autoSaveSurplus = e.target.checked;
        saveState();
        showToast(e.target.checked ? 'Auto-Tabung Sisa Jatah AKTIF' : 'Auto-Tabung Sisa Jatah NONAKTIF');
    });

    document.getElementById('btn-withdraw-main-piggy').addEventListener('click', () => {
        if (state.mainPiggyBank <= 0) {
            showToast('Celengan Utama masih kosong!', 'error');
            return;
        }
        const amt = state.mainPiggyBank;
        const mainWallet = state.wallets.find((w) => w.isMain) || state.wallets[0];
        mainWallet.balance += amt;
        state.mainPiggyBank = 0;
        state.transactions.unshift({
            id: 'tx_wd_' + Date.now(),
            type: 'transfer',
            amount: amt,
            walletId: 'piggy_main',
            toWalletId: mainWallet.id,
            category: 'Tarik Celengan Utama',
            note: 'Pencairan Celengan Utama ke Dompet Utama',
            date: getTodayStr(),
            timestamp: Date.now()
        });
        saveState();
        renderAll();
        showToast(`💸 ${formatRupiah(amt, true)} dipindahkan ke Dompet Utama!`, 'success');
    });

    document.getElementById('btn-open-goal-modal').addEventListener('click', () => openModal('modal-goal'));
    document.getElementById('form-add-goal').addEventListener('submit', (e) => {
        e.preventDefault();
        state.specificGoals.push({
            id: 'goal_' + Date.now(),
            name: document.getElementById('goal-name').value.trim(),
            target: Number(document.getElementById('goal-target').value),
            saved: 0,
            deadline: document.getElementById('goal-deadline').value
        });
        saveState();
        closeModal('modal-goal');
        e.target.reset();
        renderSavingsView();
        showToast('Target nabung spesifik dibuat!', 'success');
    });

    // 7. Filter Riwayat & Laporan
    ['filter-search', 'filter-month', 'filter-type', 'filter-wallet'].forEach((id) => {
        document.getElementById(id).addEventListener('input', renderHistoryView);
    });
    document.getElementById('report-month-picker').addEventListener('change', renderReportsView);

    // 8. Transaksi Berulang
    document.getElementById('btn-open-recurring-modal').addEventListener('click', () => {
        document.getElementById('rec-next-date').value = getTodayStr();
        openModal('modal-recurring');
    });
    document.getElementById('form-add-recurring').addEventListener('submit', (e) => {
        e.preventDefault();
        state.recurring.push({
            id: 'rec_sched_' + Date.now(),
            type: document.getElementById('rec-type').value,
            title: document.getElementById('rec-title').value.trim(),
            amount: Number(document.getElementById('rec-amount').value),
            frequency: document.getElementById('rec-frequency').value,
            nextDate: document.getElementById('rec-next-date').value,
            walletId: state.wallets[0].id
        });
        saveState();
        closeModal('modal-recurring');
        e.target.reset();
        runDailyAutomation();
        renderAll();
        showToast('Jadwal transaksi berulang aktif!', 'success');
    });

    // 9. Kustom Template 1-Tap
    document.getElementById('btn-edit-templates').addEventListener('click', () => openModal('modal-templates'));
    document.getElementById('form-add-template').addEventListener('submit', (e) => {
        e.preventDefault();
        state.templates.push({
            id: 'tpl_' + Date.now(),
            label: document.getElementById('tpl-label').value.trim(),
            amount: Number(document.getElementById('tpl-amount').value),
            category: document.getElementById('tpl-category').value
        });
        saveState();
        closeModal('modal-templates');
        e.target.reset();
        renderQuickTemplates();
        showToast('Template 1-Tap ditambahkan!', 'success');
    });

    // 10. Security PIN & Data Backup/Restore
    document.getElementById('btn-setup-pin').addEventListener('click', () => {
        isSettingNewPin = true;
        pinInputBuffer = '';
        document.getElementById('pin-prompt-text').textContent = 'Buat 4-digit PIN baru Anda';
        document.getElementById('pin-lock-screen').classList.remove('hidden');
        updatePinDots();
    });

    document.querySelectorAll('.pin-key[data-num]').forEach((btn) => {
        btn.addEventListener('click', () => handlePinDigit(btn.dataset.num));
    });
    document.getElementById('pin-del-btn').addEventListener('click', () => {
        pinInputBuffer = pinInputBuffer.slice(0, -1);
        updatePinDots();
    });
    document.getElementById('pin-reset-btn').addEventListener('click', () => {
        if (confirm('Hapus PIN dan reset seluruh data SakuPintar?')) {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        }
    });

    document.getElementById('btn-export-csv').addEventListener('click', () => {
        const headers = ['Tanggal,Tipe,Kategori,Catatan,Nominal'];
        const rows = state.transactions.map(
            (t) => `${t.date},${t.type},"${t.category}","${(t.note || '').replace(/"/g, '""')}",${t.amount}`
        );
        const blob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `SakuPintar_Transaksi_${getTodayStr()}.csv`;
        link.click();
        showToast('File CSV berhasil diunduh!', 'success');
    });

    document.getElementById('btn-backup-json').addEventListener('click', () => {
        state.settings.lastBackupDate = getTodayStr();
        saveState();
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `SakuPintar_Backup_${getTodayStr()}.json`;
        link.click();
        renderSmartInsights();
        showToast('Backup JSON berhasil disimpan!', 'success');
    });

    document.getElementById('input-restore-json').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const restored = JSON.parse(ev.target.result);
                if (restored.wallets && restored.transactions) {
                    state = { ...getDefaultState(), ...restored };
                    saveState();
                    renderAll();
                    showToast('Data berhasil dipulihkan dari backup!', 'success');
                } else {
                    showToast('Format file JSON tidak valid!', 'error');
                }
            } catch (err) {
                showToast('Gagal membaca file backup!', 'error');
            }
        };
        reader.readAsText(file);
    });

    document.getElementById('btn-reset-all').addEventListener('click', () => {
        if (confirm('Yakin ingin menghapus semua data dan kembali ke awal?')) {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        }
    });

    // Inisialisasi Awal
    if (state.user) {
        runDailyAutomation();
        initPinLock();
    }
    renderAll();
});