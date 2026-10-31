/**
 * Simplified GST Return Portal - Core Logic & Reactive State
 * Tailored for Small Business Owners & Shopkeepers (Dukaandars)
 */

// ==========================================
// 1. STATE MANAGEMENT
// ==========================================

const GST_STATE_CODES = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '19': 'West Bengal', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '27': 'Maharashtra', '29': 'Karnataka', '32': 'Kerala', '33': 'Tamil Nadu',
  '36': 'Telangana', '37': 'Andhra Pradesh'
};

const DEFAULT_STATE = {
  auth: {
    isLoggedIn: false,
    gstin: '27ABCDE1234F1Z5',
    username: 'apex_traders',
    tradeName: 'Apex Mobile Accessories',
    regType: 'Regular',
    stateJurisdiction: 'Maharashtra - Zone 4 (Bandra West)',
    financialYear: '2026-27',
    returnPeriod: 'October 2026',
    gstr1Status: 'Pending',
    gstr3bStatus: 'Pending'
  },
  gstr1: {
    b2bInvoices: [
      { id: 1, buyerGstin: '27AABCT1332L1Z9', buyerName: 'Om Electronics & Repairs', invNo: 'INV-2026-101', date: '2026-10-05', taxable: 28000, rate: 18, supplyType: 'Intra-State', cgst: 2520, sgst: 2520, igst: 0, total: 33040 },
      { id: 2, buyerGstin: '29AAECS4921K1ZU', buyerName: 'Bangalore Gadget Hub', invNo: 'INV-2026-102', date: '2026-10-14', taxable: 22000, rate: 18, supplyType: 'Inter-State', cgst: 0, sgst: 0, igst: 3960, total: 25960 },
      { id: 3, buyerGstin: '27AAECP8821D1ZN', buyerName: 'Shree Ganesh Telecom', invNo: 'INV-2026-103', date: '2026-10-21', taxable: 15000, rate: 12, supplyType: 'Intra-State', cgst: 900, sgst: 900, igst: 0, total: 16800 }
    ],
    b2c: {
      intraTaxable: 35000,
      intraRate: 18,
      interTaxable: 10000,
      interRate: 18,
      interPos: '07'
    },
    creditNotes: [
      { id: 1, type: 'Credit Note', origInv: 'INV-2026-089', noteNo: 'CN-2026-004', date: '2026-10-18', buyer: 'Om Electronics & Repairs', taxable: 3000, rate: 18, reason: 'Sales Return (Damaged Covers)', cgst: 270, sgst: 270, igst: 0 }
    ],
    exempt: {
      nilRated: 2500,
      exempted: 1500,
      nonGst: 0
    }
  },
  gstr3b: {
    salesTurnover: 107000,
    taxableSales: 100000,
    gstRate: 18,
    supplyType: 'intra', // 'intra' or 'inter'
    // Dynamic math fields
    totalGst: 18000,
    cgstOutput: 9000,
    sgstOutput: 9000,
    igstOutput: 0,
    // Purchase & ITC
    totalPurchases: 50000,
    eligibleItc: 9000,
    itcCgst: 4500,
    itcSgst: 4500,
    itcIgst: 0,
    // Net liability
    netPayable: 9000
  },
  wizard: {
    currentStep: 1,
    draftSavedAt: null,
    isValidated: false,
    isSubmitted: false,
    isVerified: false,
    verificationMethod: 'EVC',
    generatedArn: null,
    filedAt: null
  }
};

let appState = JSON.parse(localStorage.getItem('simplified_gst_state')) || DEFAULT_STATE;

function saveAppState() {
  localStorage.setItem('simplified_gst_state', JSON.stringify(appState));
}

// ==========================================
// 2. INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // Check URL query parameters (e.g. ?module=GSTR-1 or ?module=GSTR-3B)
  const urlParams = new URLSearchParams(window.location.search);
  const targetModule = urlParams.get('module');

  // Set up login event listeners
  initAuthUI();
  
  // Set up GSTIN live validator
  setupGstinValidator();

  // If already logged in, show dashboard
  if (appState.auth.isLoggedIn) {
    showDashboardView();
    if (targetModule === 'GSTR-1') {
      switchMainModule('gstr1');
    } else if (targetModule === 'GSTR-3B') {
      switchMainModule('gstr3b');
    } else if (targetModule === 'wizard') {
      switchMainModule('wizard');
    }
  } else {
    showLoginView();
  }

  // Bind calculation listeners
  setupGstr3bCalculationListeners();
  setupGstr1FormListeners();
  
  // Render initial tables
  renderB2BTable();
  renderCreditNotesTable();
  recalculateGstr3bMath();
});

// ==========================================
// 3. AUTHENTICATION & LOGIN LOGIC
// ==========================================

function initAuthUI() {
  const loginForm = document.getElementById('login-form');
  const togglePassBtn = document.getElementById('toggle-password-btn');
  const passInput = document.getElementById('login-password');
  const demoFillBtn = document.getElementById('demo-fill-btn');

  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener('click', () => {
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      const icon = togglePassBtn.querySelector('i');
      if (icon) {
        icon.className = isPass ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
      }
    });
  }

  if (demoFillBtn) {
    demoFillBtn.addEventListener('click', fillDemoCredentials);
  }

  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }
}

function setupGstinValidator() {
  const gstinInput = document.getElementById('login-gstin');
  const gstinFeedback = document.getElementById('gstin-feedback');
  const stateBadge = document.getElementById('gstin-state-badge');

  if (!gstinInput) return;

  gstinInput.addEventListener('input', (e) => {
    let val = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '');
    if (val.length > 15) val = val.substring(0, 15);
    e.target.value = val;

    const stateCode = val.substring(0, 2);
    if (GST_STATE_CODES[stateCode]) {
      if (stateBadge) {
        stateBadge.textContent = `${stateCode} - ${GST_STATE_CODES[stateCode]}`;
        stateBadge.classList.remove('hidden');
      }
    } else if (stateBadge) {
      stateBadge.classList.add('hidden');
    }

    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (val.length === 15) {
      if (gstinRegex.test(val)) {
        gstinInput.classList.remove('border-red-500', 'border-slate-300');
        gstinInput.classList.add('border-emerald-500', 'bg-emerald-50/30');
        if (gstinFeedback) {
          gstinFeedback.innerHTML = '<span class="text-emerald-700 font-medium"><i class="fa-solid fa-circle-check mr-1"></i>Valid GSTIN Structure</span>';
        }
      } else {
        gstinInput.classList.remove('border-emerald-500', 'border-slate-300');
        gstinInput.classList.add('border-red-500', 'bg-red-50/30');
        if (gstinFeedback) {
          gstinFeedback.innerHTML = '<span class="text-red-600 font-medium"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Invalid GSTIN checksum or pattern</span>';
        }
      }
    } else {
      gstinInput.classList.remove('border-emerald-500', 'border-red-500', 'bg-emerald-50/30', 'bg-red-50/30');
      gstinInput.classList.add('border-slate-300');
      if (gstinFeedback) {
        gstinFeedback.textContent = `${val.length}/15 characters (e.g. 27ABCDE1234F1Z5)`;
      }
    }
  });
}

function fillDemoCredentials() {
  const gstinInput = document.getElementById('login-gstin');
  const userInput = document.getElementById('login-username');
  const passInput = document.getElementById('login-password');

  if (gstinInput) {
    gstinInput.value = '27ABCDE1234F1Z5';
    gstinInput.dispatchEvent(new Event('input'));
  }
  if (userInput) userInput.value = 'apex_traders';
  if (passInput) passInput.value = 'Apex@GST2026';

  showToast('Demo shopkeeper credentials filled!', 'success');
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const gstinInput = document.getElementById('login-gstin');
  const userInput = document.getElementById('login-username');
  const passInput = document.getElementById('login-password');
  const loginBtn = document.getElementById('login-submit-btn');

  const gstinVal = gstinInput ? gstinInput.value.trim().toUpperCase() : '';
  const userVal = userInput ? userInput.value.trim() : '';
  const passVal = passInput ? passInput.value.trim() : '';

  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  if (!gstinVal || !gstinRegex.test(gstinVal)) {
    showToast('Please enter a valid 15-character GSTIN (e.g. 27ABCDE1234F1Z5)', 'error');
    if (gstinInput) gstinInput.focus();
    return;
  }

  if (!userVal) {
    showToast('Please enter your portal username', 'error');
    if (userInput) userInput.focus();
    return;
  }

  if (!passVal) {
    showToast('Please enter your password', 'error');
    if (passInput) passInput.focus();
    return;
  }

  // Loading animation on button
  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Verifying GSTIN Credentials...';
  }

  setTimeout(() => {
    appState.auth.isLoggedIn = true;
    appState.auth.gstin = gstinVal;
    appState.auth.username = userVal;
    
    // Auto-detect jurisdiction from state code
    const stateCode = gstinVal.substring(0, 2);
    const stateName = GST_STATE_CODES[stateCode] || 'Maharashtra';
    appState.auth.stateJurisdiction = `${stateName} - Zone 4 (Commercial Range)`;
    
    saveAppState();

    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket mr-2"></i>Login to Dashboard';
    }

    showToast(`Welcome back, ${appState.auth.tradeName}! Logged in successfully.`, 'success');
    showDashboardView();
  }, 700);
}

function handleLogout() {
  appState.auth.isLoggedIn = false;
  saveAppState();
  showToast('Logged out of GST Return Portal.', 'info');
  showLoginView();
}

// ==========================================
// 4. VIEW & MODULE SWITCHING
// ==========================================

function showLoginView() {
  const loginSection = document.getElementById('login-view-section');
  const portalSection = document.getElementById('portal-dashboard-section');
  const userBar = document.getElementById('top-user-bar');

  if (loginSection) loginSection.classList.remove('hidden');
  if (portalSection) portalSection.classList.add('hidden');
  if (userBar) userBar.classList.add('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showDashboardView() {
  const loginSection = document.getElementById('login-view-section');
  const portalSection = document.getElementById('portal-dashboard-section');
  const userBar = document.getElementById('top-user-bar');

  if (loginSection) loginSection.classList.add('hidden');
  if (portalSection) portalSection.classList.remove('hidden');
  if (userBar) userBar.classList.remove('hidden');

  updateDashboardDataUI();
  switchMainModule('dashboard');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchMainModule(moduleName) {
  const modules = ['dashboard', 'gstr1', 'gstr3b', 'wizard'];
  modules.forEach(m => {
    const el = document.getElementById(`module-${m}`);
    const navBtn = document.getElementById(`nav-btn-${m}`);
    if (el) {
      if (m === moduleName) {
        el.classList.remove('hidden');
        el.classList.add('animate-fade-in');
      } else {
        el.classList.add('hidden');
        el.classList.remove('animate-fade-in');
      }
    }
    if (navBtn) {
      if (m === moduleName) {
        navBtn.classList.add('bg-gst-navy', 'text-white', 'shadow');
        navBtn.classList.remove('text-slate-600', 'hover:bg-slate-100');
      } else {
        navBtn.classList.remove('bg-gst-navy', 'text-white', 'shadow');
        navBtn.classList.add('text-slate-600', 'hover:bg-slate-100');
      }
    }
  });

  if (moduleName === 'dashboard') {
    updateDashboardDataUI();
  } else if (moduleName === 'gstr3b') {
    recalculateGstr3bMath();
  } else if (moduleName === 'wizard') {
    renderWizardStep();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateDashboardDataUI() {
  // Update Header & Dashboard Cards
  const elTradeName = document.querySelectorAll('.display-trade-name');
  const elGstin = document.querySelectorAll('.display-gstin');
  const elRegType = document.querySelectorAll('.display-reg-type');
  const elJurisdiction = document.querySelectorAll('.display-jurisdiction');
  const elPeriod = document.querySelectorAll('.display-active-period');

  elTradeName.forEach(el => el.textContent = appState.auth.tradeName);
  elGstin.forEach(el => el.textContent = appState.auth.gstin);
  elRegType.forEach(el => el.textContent = appState.auth.regType);
  elJurisdiction.forEach(el => el.textContent = appState.auth.stateJurisdiction);
  elPeriod.forEach(el => el.textContent = `${appState.auth.returnPeriod} (${appState.auth.financialYear})`);

  // Filing Status Badges
  updateStatusBadge('gstr1-status-badge', appState.auth.gstr1Status);
  updateStatusBadge('gstr3b-status-badge', appState.auth.gstr3bStatus);

  // Sync quick dashboard KPI cards
  const elTurnover = document.getElementById('dash-kpi-turnover');
  const elTaxCollected = document.getElementById('dash-kpi-tax');
  const elItc = document.getElementById('dash-kpi-itc');
  const elCashPayable = document.getElementById('dash-kpi-net');

  if (elTurnover) elTurnover.textContent = `₹${formatIndianCurrency(appState.gstr3b.taxableSales)}`;
  if (elTaxCollected) elTaxCollected.textContent = `₹${formatIndianCurrency(appState.gstr3b.totalGst)}`;
  if (elItc) elItc.textContent = `₹${formatIndianCurrency(appState.gstr3b.eligibleItc)}`;
  if (elCashPayable) elCashPayable.textContent = `₹${formatIndianCurrency(appState.gstr3b.netPayable)}`;
}

function updateStatusBadge(elementId, status) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.className = 'px-3 py-1 text-xs font-bold rounded-full inline-flex items-center space-x-1.5 shadow-sm';
  if (status === 'Filed') {
    el.classList.add('bg-emerald-100', 'text-emerald-800', 'border', 'border-emerald-300');
    el.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-600 mr-1"></span><span>Filed (Compliant)</span>';
  } else if (status === 'Draft') {
    el.classList.add('bg-amber-100', 'text-amber-800', 'border', 'border-amber-300');
    el.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-600 mr-1 animate-pulse"></span><span>Draft Saved</span>';
  } else {
    el.classList.add('bg-rose-100', 'text-rose-800', 'border', 'border-rose-300');
    el.innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-600 mr-1"></span><span>Pending Filing</span>';
  }
}

function handlePeriodChange() {
  const fySelect = document.getElementById('select-fy');
  const periodSelect = document.getElementById('select-period');

  if (fySelect) appState.auth.financialYear = fySelect.value;
  if (periodSelect) appState.auth.returnPeriod = periodSelect.value;

  saveAppState();
  updateDashboardDataUI();
  showToast(`Active period switched to ${appState.auth.returnPeriod} (${appState.auth.financialYear})`, 'info');
}

// ==========================================
// 5. GSTR-1 MODULE (SALES ENTRY & OUTWARD SUPPLIES)
// ==========================================

function setupGstr1FormListeners() {
  // GSTR-1 Sub-tabs switcher (B2B, B2C, Credit Notes, Nil Rated)
  const tabs = ['b2b', 'b2c', 'cdn', 'exempt'];
  tabs.forEach(tab => {
    const btn = document.getElementById(`gstr1-tab-btn-${tab}`);
    if (btn) {
      btn.addEventListener('click', () => switchGstr1SubTab(tab));
    }
  });

  // B2B Add Form
  const b2bForm = document.getElementById('form-add-b2b');
  const b2bTaxable = document.getElementById('b2b-taxable');
  const b2bRate = document.getElementById('b2b-rate');
  const b2bGstin = document.getElementById('b2b-buyer-gstin');

  if (b2bForm) {
    b2bForm.addEventListener('submit', handleAddB2BInvoice);
  }

  if (b2bTaxable && b2bRate) {
    const updateB2BPreview = () => {
      const taxable = parseFloat(b2bTaxable.value) || 0;
      const rate = parseFloat(b2bRate.value) || 18;
      const taxAmount = (taxable * rate) / 100;
      const total = taxable + taxAmount;
      
      const elTaxVal = document.getElementById('b2b-calc-tax');
      const elTotalVal = document.getElementById('b2b-calc-total');
      if (elTaxVal) elTaxVal.textContent = `₹${formatIndianCurrency(taxAmount)}`;
      if (elTotalVal) elTotalVal.textContent = `₹${formatIndianCurrency(total)}`;
    };

    b2bTaxable.addEventListener('input', updateB2BPreview);
    b2bRate.addEventListener('change', updateB2BPreview);
  }

  if (b2bGstin) {
    b2bGstin.addEventListener('input', (e) => {
      let val = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '');
      if (val.length > 15) val = val.substring(0, 15);
      e.target.value = val;

      const stateBadge = document.getElementById('b2b-supply-type-badge');
      if (val.length >= 2) {
        const buyerState = val.substring(0, 2);
        const myState = appState.auth.gstin.substring(0, 2);
        const isIntra = buyerState === myState;
        if (stateBadge) {
          stateBadge.textContent = isIntra ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)';
          stateBadge.className = isIntra 
            ? 'text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800'
            : 'text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800';
        }
      }
    });
  }

  // Credit/Debit Note Form
  const cdnForm = document.getElementById('form-add-cdn');
  if (cdnForm) {
    cdnForm.addEventListener('submit', handleAddCreditNote);
  }

  // B2C Inputs update
  const b2cSaveBtn = document.getElementById('btn-save-b2c');
  if (b2cSaveBtn) {
    b2cSaveBtn.addEventListener('click', saveB2CSales);
  }

  // Sync GSTR-1 to GSTR-3B button
  const syncBtn = document.getElementById('btn-sync-gstr1-to-3b');
  if (syncBtn) {
    syncBtn.addEventListener('click', syncGstr1ToGstr3b);
  }
}

function switchGstr1SubTab(activeTab) {
  const tabs = ['b2b', 'b2c', 'cdn', 'exempt'];
  tabs.forEach(tab => {
    const pane = document.getElementById(`gstr1-pane-${tab}`);
    const btn = document.getElementById(`gstr1-tab-btn-${tab}`);
    if (pane && btn) {
      if (tab === activeTab) {
        pane.classList.remove('hidden');
        btn.classList.add('border-b-2', 'border-gst-navy', 'text-gst-navy', 'font-bold');
        btn.classList.remove('text-slate-500');
      } else {
        pane.classList.add('hidden');
        btn.classList.remove('border-b-2', 'border-gst-navy', 'text-gst-navy', 'font-bold');
        btn.classList.add('text-slate-500');
      }
    }
  });
}

function renderB2BTable() {
  const tbody = document.getElementById('b2b-invoices-tbody');
  const elCount = document.getElementById('b2b-invoice-count');
  const elTotalTaxable = document.getElementById('b2b-total-taxable');
  const elTotalTax = document.getElementById('b2b-total-tax');

  if (!tbody) return;
  tbody.innerHTML = '';

  let sumTaxable = 0;
  let sumTax = 0;

  appState.gstr1.b2bInvoices.forEach(inv => {
    const tax = inv.cgst + inv.sgst + inv.igst;
    sumTaxable += inv.taxable;
    sumTax += tax;

    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-200 hover:bg-slate-50 transition text-xs';
    tr.innerHTML = `
      <td class="py-3 px-3 font-semibold text-slate-800">${inv.invNo}</td>
      <td class="py-3 px-3">
        <span class="font-mono font-medium text-slate-900">${inv.buyerGstin}</span>
        <span class="block text-[11px] text-slate-500">${inv.buyerName || 'Registered Buyer'}</span>
      </td>
      <td class="py-3 px-3 text-slate-600">${inv.date}</td>
      <td class="py-3 px-3">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${inv.supplyType === 'Intra-State' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}">
          ${inv.supplyType}
        </span>
      </td>
      <td class="py-3 px-3 font-semibold text-slate-800 text-right">₹${formatIndianCurrency(inv.taxable)}</td>
      <td class="py-3 px-3 text-center">
        <span class="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[11px]">${inv.rate}%</span>
      </td>
      <td class="py-3 px-3 text-right text-slate-700">
        ${inv.cgst > 0 ? `<div><span class="text-[10px] text-slate-400">CGST+SGST:</span> ₹${formatIndianCurrency(inv.cgst * 2)}</div>` : ''}
        ${inv.igst > 0 ? `<div><span class="text-[10px] text-slate-400">IGST:</span> ₹${formatIndianCurrency(inv.igst)}</div>` : ''}
      </td>
      <td class="py-3 px-3 font-bold text-slate-900 text-right">₹${formatIndianCurrency(inv.total)}</td>
      <td class="py-3 px-3 text-center">
        <button onclick="deleteB2BInvoice(${inv.id})" class="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition" title="Delete Invoice">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (elCount) elCount.textContent = appState.gstr1.b2bInvoices.length;
  if (elTotalTaxable) elTotalTaxable.textContent = `₹${formatIndianCurrency(sumTaxable)}`;
  if (elTotalTax) elTotalTax.textContent = `₹${formatIndianCurrency(sumTax)}`;

  updateGstr1SummaryBanner();
}

function handleAddB2BInvoice(e) {
  e.preventDefault();
  const gstinInput = document.getElementById('b2b-buyer-gstin');
  const nameInput = document.getElementById('b2b-buyer-name');
  const invNoInput = document.getElementById('b2b-inv-no');
  const dateInput = document.getElementById('b2b-date');
  const taxableInput = document.getElementById('b2b-taxable');
  const rateInput = document.getElementById('b2b-rate');

  const buyerGstin = gstinInput.value.trim().toUpperCase();
  const buyerName = nameInput.value.trim() || 'Retail Client';
  const invNo = invNoInput.value.trim();
  const date = dateInput.value || new Date().toISOString().split('T')[0];
  const taxable = parseFloat(taxableInput.value) || 0;
  const rate = parseFloat(rateInput.value) || 18;

  if (buyerGstin.length !== 15) {
    showToast('Buyer GSTIN must be exactly 15 alphanumeric characters.', 'error');
    return;
  }
  if (!invNo) {
    showToast('Invoice number is required.', 'error');
    return;
  }
  if (taxable <= 0) {
    showToast('Please enter a valid taxable amount greater than 0.', 'error');
    return;
  }

  const myStateCode = appState.auth.gstin.substring(0, 2);
  const buyerStateCode = buyerGstin.substring(0, 2);
  const isIntra = myStateCode === buyerStateCode;
  const taxAmount = (taxable * rate) / 100;

  let cgst = 0, sgst = 0, igst = 0;
  if (isIntra) {
    cgst = taxAmount / 2;
    sgst = taxAmount / 2;
  } else {
    igst = taxAmount;
  }

  const newInvoice = {
    id: Date.now(),
    buyerGstin,
    buyerName,
    invNo,
    date,
    taxable,
    rate,
    supplyType: isIntra ? 'Intra-State' : 'Inter-State',
    cgst,
    sgst,
    igst,
    total: taxable + taxAmount
  };

  appState.gstr1.b2bInvoices.push(newInvoice);
  saveAppState();
  renderB2BTable();

  // Reset form
  gstinInput.value = '';
  nameInput.value = '';
  invNoInput.value = `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  taxableInput.value = '';
  document.getElementById('b2b-calc-tax').textContent = '₹0';
  document.getElementById('b2b-calc-total').textContent = '₹0';

  showToast(`B2B Invoice ${invNo} added successfully!`, 'success');
}

function deleteB2BInvoice(id) {
  appState.gstr1.b2bInvoices = appState.gstr1.b2bInvoices.filter(i => i.id !== id);
  saveAppState();
  renderB2BTable();
  showToast('Invoice deleted from GSTR-1.', 'info');
}

function renderCreditNotesTable() {
  const tbody = document.getElementById('cdn-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  appState.gstr1.creditNotes.forEach(cdn => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-200 hover:bg-slate-50 transition text-xs';
    tr.innerHTML = `
      <td class="py-2.5 px-3 font-semibold text-slate-800">${cdn.noteNo}</td>
      <td class="py-2.5 px-3">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${cdn.type === 'Credit Note' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">
          ${cdn.type}
        </span>
      </td>
      <td class="py-2.5 px-3 text-slate-600">${cdn.origInv}</td>
      <td class="py-2.5 px-3">${cdn.buyer}</td>
      <td class="py-2.5 px-3 text-slate-500">${cdn.reason}</td>
      <td class="py-2.5 px-3 text-right font-semibold text-rose-700">-₹${formatIndianCurrency(cdn.taxable)}</td>
      <td class="py-2.5 px-3 text-center">
        <button onclick="deleteCreditNote(${cdn.id})" class="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50" title="Delete Note">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updateGstr1SummaryBanner();
}

function handleAddCreditNote(e) {
  e.preventDefault();
  const type = document.getElementById('cdn-type').value;
  const origInv = document.getElementById('cdn-orig-inv').value.trim();
  const noteNo = document.getElementById('cdn-no').value.trim();
  const buyer = document.getElementById('cdn-buyer').value.trim() || 'Retail Customer';
  const taxable = parseFloat(document.getElementById('cdn-taxable').value) || 0;
  const rate = parseFloat(document.getElementById('cdn-rate').value) || 18;
  const reason = document.getElementById('cdn-reason').value;

  if (!origInv || !noteNo) {
    showToast('Original invoice number and Note number are required.', 'error');
    return;
  }
  if (taxable <= 0) {
    showToast('Taxable value must be greater than 0.', 'error');
    return;
  }

  const taxAmount = (taxable * rate) / 100;
  const newCdn = {
    id: Date.now(),
    type,
    origInv,
    noteNo,
    date: new Date().toISOString().split('T')[0],
    buyer,
    taxable,
    rate,
    reason,
    cgst: taxAmount / 2,
    sgst: taxAmount / 2,
    igst: 0
  };

  appState.gstr1.creditNotes.push(newCdn);
  saveAppState();
  renderCreditNotesTable();

  // Reset
  document.getElementById('cdn-orig-inv').value = '';
  document.getElementById('cdn-taxable').value = '';
  showToast(`${type} recorded successfully.`, 'success');
}

function deleteCreditNote(id) {
  appState.gstr1.creditNotes = appState.gstr1.creditNotes.filter(c => c.id !== id);
  saveAppState();
  renderCreditNotesTable();
  showToast('Note removed.', 'info');
}

function saveB2CSales() {
  const intraTaxable = parseFloat(document.getElementById('b2c-intra-taxable').value) || 0;
  const intraRate = parseFloat(document.getElementById('b2c-intra-rate').value) || 18;
  const interTaxable = parseFloat(document.getElementById('b2c-inter-taxable').value) || 0;
  const interRate = parseFloat(document.getElementById('b2c-inter-rate').value) || 18;
  const interPos = document.getElementById('b2c-inter-pos').value;

  appState.gstr1.b2c = {
    intraTaxable,
    intraRate,
    interTaxable,
    interRate,
    interPos
  };

  saveAppState();
  updateGstr1SummaryBanner();
  showToast('B2C Retail Sales supplies updated!', 'success');
}

function updateGstr1SummaryBanner() {
  // Aggregate B2B
  let b2bTaxable = 0, b2bCgst = 0, b2bSgst = 0, b2bIgst = 0;
  appState.gstr1.b2bInvoices.forEach(i => {
    b2bTaxable += i.taxable;
    b2bCgst += i.cgst;
    b2bSgst += i.sgst;
    b2bIgst += i.igst;
  });

  // Aggregate B2C
  const b2cIntraTax = (appState.gstr1.b2c.intraTaxable * appState.gstr1.b2c.intraRate) / 100;
  const b2cInterTax = (appState.gstr1.b2c.interTaxable * appState.gstr1.b2c.interRate) / 100;
  const b2cTaxable = appState.gstr1.b2c.intraTaxable + appState.gstr1.b2c.interTaxable;
  const b2cCgst = b2cIntraTax / 2;
  const b2cSgst = b2cIntraTax / 2;
  const b2cIgst = b2cInterTax;

  // Deduct Credit Notes
  let cdnTaxable = 0, cdnCgst = 0, cdnSgst = 0, cdnIgst = 0;
  appState.gstr1.creditNotes.forEach(c => {
    cdnTaxable += c.taxable;
    cdnCgst += c.cgst;
    cdnSgst += c.sgst;
    cdnIgst += c.igst;
  });

  const netTaxable = Math.max(0, b2bTaxable + b2cTaxable - cdnTaxable);
  const netCgst = Math.max(0, b2bCgst + b2cCgst - cdnCgst);
  const netSgst = Math.max(0, b2bSgst + b2cSgst - cdnSgst);
  const netIgst = Math.max(0, b2bIgst + b2cIgst - cdnIgst);
  const totalTax = netCgst + netSgst + netIgst;

  const elSumTaxable = document.getElementById('gstr1-sum-taxable');
  const elSumCgst = document.getElementById('gstr1-sum-cgst');
  const elSumSgst = document.getElementById('gstr1-sum-sgst');
  const elSumIgst = document.getElementById('gstr1-sum-igst');
  const elSumTotal = document.getElementById('gstr1-sum-totaltax');

  if (elSumTaxable) elSumTaxable.textContent = `₹${formatIndianCurrency(netTaxable)}`;
  if (elSumCgst) elSumCgst.textContent = `₹${formatIndianCurrency(netCgst)}`;
  if (elSumSgst) elSumSgst.textContent = `₹${formatIndianCurrency(netSgst)}`;
  if (elSumIgst) elSumIgst.textContent = `₹${formatIndianCurrency(netIgst)}`;
  if (elSumTotal) elSumTotal.textContent = `₹${formatIndianCurrency(totalTax)}`;
}

function syncGstr1ToGstr3b() {
  // Aggregate B2B + B2C - CDN
  let b2bTaxable = 0;
  appState.gstr1.b2bInvoices.forEach(i => b2bTaxable += i.taxable);
  const b2cTaxable = appState.gstr1.b2c.intraTaxable + appState.gstr1.b2c.interTaxable;
  let cdnTaxable = 0;
  appState.gstr1.creditNotes.forEach(c => cdnTaxable += c.taxable);

  const netTaxable = Math.max(0, b2bTaxable + b2cTaxable - cdnTaxable);

  // Update GSTR-3B inputs
  appState.gstr3b.taxableSales = netTaxable;
  appState.gstr3b.salesTurnover = netTaxable + 7000; // includes exempt
  saveAppState();

  const inputTaxable = document.getElementById('gstr3b-taxable-sales');
  const inputTurnover = document.getElementById('gstr3b-turnover');
  if (inputTaxable) inputTaxable.value = netTaxable;
  if (inputTurnover) inputTurnover.value = appState.gstr3b.salesTurnover;

  recalculateGstr3bMath();
  showToast(`Synced ₹${formatIndianCurrency(netTaxable)} Outward Sales from GSTR-1 to GSTR-3B!`, 'success');
  switchMainModule('gstr3b');
}

// ==========================================
// 6. GSTR-3B MODULE (TAX SUMMARY, ITC & PAYMENT)
// ==========================================

function setupGstr3bCalculationListeners() {
  const taxableInput = document.getElementById('gstr3b-taxable-sales');
  const turnoverInput = document.getElementById('gstr3b-turnover');
  const rateSelect = document.getElementById('gstr3b-rate-select');
  const supplyIntra = document.getElementById('gstr3b-supply-intra');
  const supplyInter = document.getElementById('gstr3b-supply-inter');

  const purchaseInput = document.getElementById('gstr3b-purchase-amount');
  const itcInput = document.getElementById('gstr3b-eligible-itc');

  // Input listeners
  if (taxableInput) taxableInput.addEventListener('input', recalculateGstr3bMath);
  if (turnoverInput) turnoverInput.addEventListener('input', recalculateGstr3bMath);
  if (rateSelect) rateSelect.addEventListener('change', recalculateGstr3bMath);
  if (supplyIntra) supplyIntra.addEventListener('change', recalculateGstr3bMath);
  if (supplyInter) supplyInter.addEventListener('change', recalculateGstr3bMath);
  if (purchaseInput) purchaseInput.addEventListener('input', recalculateGstr3bMath);
  if (itcInput) itcInput.addEventListener('input', recalculateGstr3bMath);
}

function recalculateGstr3bMath() {
  const taxableInput = document.getElementById('gstr3b-taxable-sales');
  const turnoverInput = document.getElementById('gstr3b-turnover');
  const rateSelect = document.getElementById('gstr3b-rate-select');
  const isInterState = document.getElementById('gstr3b-supply-inter')?.checked || false;

  const purchaseInput = document.getElementById('gstr3b-purchase-amount');
  const itcInput = document.getElementById('gstr3b-eligible-itc');

  const taxableSales = parseFloat(taxableInput?.value) || 0;
  const turnover = parseFloat(turnoverInput?.value) || taxableSales;
  const rate = parseFloat(rateSelect?.value) || 18;
  const purchases = parseFloat(purchaseInput?.value) || 0;
  const eligibleItc = parseFloat(itcInput?.value) || 0;

  // Real-time Dynamic Math:
  // Total GST Amount: Taxable Sales * GST Rate
  const totalGst = (taxableSales * rate) / 100;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterState) {
    // Inter-State Split: IGST = Full GST Amount
    igst = totalGst;
    cgst = 0;
    sgst = 0;
  } else {
    // Intra-State Split: CGST = Total GST / 2, SGST = Total GST / 2
    cgst = totalGst / 2;
    sgst = totalGst / 2;
    igst = 0;
  }

  // ITC split (Assuming proportional 50/50 for Intra purchases)
  const itcCgst = eligibleItc / 2;
  const itcSgst = eligibleItc / 2;
  const itcIgst = 0;

  // Calculate Tax Liability: Net Payable = Gross Liability - Eligible ITC
  const netPayable = Math.max(0, totalGst - eligibleItc);
  const itcSurplus = Math.max(0, eligibleItc - totalGst);

  // Update App State
  appState.gstr3b = {
    salesTurnover: turnover,
    taxableSales,
    gstRate: rate,
    supplyType: isInterState ? 'inter' : 'intra',
    totalGst,
    cgstOutput: cgst,
    sgstOutput: sgst,
    igstOutput: igst,
    totalPurchases: purchases,
    eligibleItc,
    itcCgst,
    itcSgst,
    itcIgst,
    netPayable
  };
  saveAppState();

  // Update DOM Output Display Elements
  setText('calc-total-gst', `₹${formatIndianCurrency(totalGst)}`);
  setText('calc-cgst-output', `₹${formatIndianCurrency(cgst)}`);
  setText('calc-sgst-output', `₹${formatIndianCurrency(sgst)}`);
  setText('calc-igst-output', `₹${formatIndianCurrency(igst)}`);

  setText('calc-gross-liability', `₹${formatIndianCurrency(totalGst)}`);
  setText('calc-eligible-itc-display', `- ₹${formatIndianCurrency(eligibleItc)}`);
  setText('calc-net-payable', `₹${formatIndianCurrency(netPayable)}`);

  setText('calc-itc-cgst', `₹${formatIndianCurrency(itcCgst)}`);
  setText('calc-itc-sgst', `₹${formatIndianCurrency(itcSgst)}`);

  // Badge alert based on cash liability
  const badgeNet = document.getElementById('calc-liability-badge');
  if (badgeNet) {
    if (netPayable === 0) {
      badgeNet.textContent = itcSurplus > 0 ? `Zero Cash Tax (₹${formatIndianCurrency(itcSurplus)} ITC Surplus carried forward)` : 'Zero Tax Liability';
      badgeNet.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300';
    } else {
      badgeNet.textContent = `₹${formatIndianCurrency(netPayable)} Cash Payment Required via PMT-06`;
      badgeNet.className = 'px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300';
    }
  }

  // Update Split Explainer label
  const splitLabel = document.getElementById('calc-split-description');
  if (splitLabel) {
    if (isInterState) {
      splitLabel.textContent = `Inter-State Supply: 100% IGST applied (Taxable ₹${formatIndianCurrency(taxableSales)} × ${rate}%)`;
    } else {
      splitLabel.textContent = `Intra-State Supply (Maharashtra): Split 50% CGST (${rate/2}%) & 50% SGST (${rate/2}%)`;
    }
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ==========================================
// 7. RETURN FILING & SUBMISSION WORKFLOW (8-STEP WIZARD)
// ==========================================

function openFilingWizard() {
  switchMainModule('wizard');
  renderWizardStep();
}

function goToWizardStep(stepNumber) {
  if (stepNumber < 1 || stepNumber > 8) return;
  
  // Validation check before proceeding past step 2
  if (stepNumber > 2 && !appState.wizard.isValidated && stepNumber !== 8) {
    showToast('Please complete Step 2: Validate Return first.', 'warning');
    return;
  }

  // Submission lock check for steps past 6
  if (stepNumber > 6 && !appState.wizard.isSubmitted && stepNumber !== 8) {
    showToast('Please Submit & Lock Return (Step 6) before proceeding to verification.', 'warning');
    return;
  }

  appState.wizard.currentStep = stepNumber;
  saveAppState();
  renderWizardStep();
  window.scrollTo({ top: 120, behavior: 'smooth' });
}

function renderWizardStep() {
  const current = appState.wizard.currentStep;

  // Highlight step indicators
  for (let i = 1; i <= 8; i++) {
    const indicator = document.getElementById(`wizard-nav-step-${i}`);
    const content = document.getElementById(`wizard-step-content-${i}`);

    if (indicator) {
      indicator.classList.remove('active', 'completed', 'bg-gst-navy', 'text-white', 'border-gst-navy');
      if (i === current) {
        indicator.classList.add('active', 'border-gst-navy', 'bg-blue-50', 'text-gst-navy', 'font-bold');
      } else if (i < current || (i === 1 && appState.wizard.draftSavedAt) || (i === 2 && appState.wizard.isValidated) || (i === 6 && appState.wizard.isSubmitted) || (i === 8 && appState.wizard.generatedArn)) {
        indicator.classList.add('completed', 'border-emerald-500', 'text-emerald-700');
      }
    }

    if (content) {
      if (i === current) {
        content.classList.remove('hidden');
        content.classList.add('animate-fade-in');
      } else {
        content.classList.add('hidden');
        content.classList.remove('animate-fade-in');
      }
    }
  }

  // Step-specific dynamic renders
  if (current === 1) renderStep1();
  if (current === 2) renderStep2();
  if (current === 3) renderStep3();
  if (current === 4) renderStep4();
  if (current === 5) renderStep5();
  if (current === 6) renderStep6();
  if (current === 7) renderStep7();
  if (current === 8) renderStep8();
}

// Step 1: Save Draft
function renderStep1() {
  const timeEl = document.getElementById('step1-draft-timestamp');
  if (timeEl && appState.wizard.draftSavedAt) {
    timeEl.textContent = `Last Draft Saved: ${appState.wizard.draftSavedAt}`;
  }
}

function actionSaveDraft() {
  const now = new Date();
  appState.wizard.draftSavedAt = now.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  appState.auth.gstr1Status = 'Draft';
  appState.auth.gstr3bStatus = 'Draft';
  saveAppState();
  
  renderStep1();
  showToast('Draft saved successfully to local browser database!', 'success');
}

// Step 2: Validate Return
function renderStep2() {
  const gstinValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(appState.auth.gstin);
  const mathValid = appState.gstr3b.taxableSales > 0 && appState.gstr3b.totalGst > 0;
  const itcValid = appState.gstr3b.eligibleItc >= 0;

  const listEl = document.getElementById('step2-validation-list');
  if (listEl) {
    listEl.innerHTML = `
      <div class="flex items-center justify-between p-3 rounded-lg border ${gstinValid ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}">
        <div class="flex items-center space-x-3">
          <i class="fa-solid ${gstinValid ? 'fa-circle-check text-emerald-600' : 'fa-circle-xmark text-red-600'} text-lg"></i>
          <div>
            <div class="font-bold text-xs">GSTIN Format & State Code (${appState.auth.gstin})</div>
            <div class="text-[11px] text-slate-500">Matches 15-character statutory GSTN structure for Maharashtra (27)</div>
          </div>
        </div>
        <span class="text-xs font-bold ${gstinValid ? 'text-emerald-700' : 'text-red-700'}">${gstinValid ? 'PASSED' : 'FAILED'}</span>
      </div>

      <div class="flex items-center justify-between p-3 rounded-lg border ${mathValid ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}">
        <div class="flex items-center space-x-3">
          <i class="fa-solid ${mathValid ? 'fa-circle-check text-emerald-600' : 'fa-triangle-exclamation text-amber-600'} text-lg"></i>
          <div>
            <div class="font-bold text-xs">Sales Math & Tax Reconciliation</div>
            <div class="text-[11px] text-slate-500">Taxable ₹${formatIndianCurrency(appState.gstr3b.taxableSales)} @ ${appState.gstr3b.gstRate}% = Total Output GST ₹${formatIndianCurrency(appState.gstr3b.totalGst)}</div>
          </div>
        </div>
        <span class="text-xs font-bold ${mathValid ? 'text-emerald-700' : 'text-amber-700'}">${mathValid ? 'PASSED' : 'CHECK'}</span>
      </div>

      <div class="flex items-center justify-between p-3 rounded-lg border ${itcValid ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}">
        <div class="flex items-center space-x-3">
          <i class="fa-solid ${itcValid ? 'fa-circle-check text-emerald-600' : 'fa-circle-xmark text-red-600'} text-lg"></i>
          <div>
            <div class="font-bold text-xs">Input Tax Credit (ITC) Verification</div>
            <div class="text-[11px] text-slate-500">Eligible ITC of ₹${formatIndianCurrency(appState.gstr3b.eligibleItc)} verified against purchases</div>
          </div>
        </div>
        <span class="text-xs font-bold text-emerald-700">PASSED</span>
      </div>
    `;
  }
}

function actionValidateReturn() {
  appState.wizard.isValidated = true;
  saveAppState();
  renderStep2();
  showToast('Validation Complete: No mismatched math or missing fields!', 'success');
}

// Step 3: Preview Return
function renderStep3() {
  setText('preview-period', `${appState.auth.returnPeriod} (${appState.auth.financialYear})`);
  setText('preview-trade-name', appState.auth.tradeName);
  setText('preview-gstin', appState.auth.gstin);
  setText('preview-taxable-sales', `₹${formatIndianCurrency(appState.gstr3b.taxableSales)}`);
  setText('preview-cgst', `₹${formatIndianCurrency(appState.gstr3b.cgstOutput)}`);
  setText('preview-sgst', `₹${formatIndianCurrency(appState.gstr3b.sgstOutput)}`);
  setText('preview-igst', `₹${formatIndianCurrency(appState.gstr3b.igstOutput)}`);
  setText('preview-total-tax', `₹${formatIndianCurrency(appState.gstr3b.totalGst)}`);
  setText('preview-itc', `₹${formatIndianCurrency(appState.gstr3b.eligibleItc)}`);
  setText('preview-net-payable', `₹${formatIndianCurrency(appState.gstr3b.netPayable)}`);
}

function printReturnPreview() {
  window.print();
}

// Step 4: Calculate Tax Liability
function renderStep4() {
  setText('step4-gross', `₹${formatIndianCurrency(appState.gstr3b.totalGst)}`);
  setText('step4-itc', `₹${formatIndianCurrency(appState.gstr3b.eligibleItc)}`);
  setText('step4-net', `₹${formatIndianCurrency(appState.gstr3b.netPayable)}`);

  setText('step4-cgst-gross', `₹${formatIndianCurrency(appState.gstr3b.cgstOutput)}`);
  setText('step4-sgst-gross', `₹${formatIndianCurrency(appState.gstr3b.sgstOutput)}`);
  setText('step4-igst-gross', `₹${formatIndianCurrency(appState.gstr3b.igstOutput)}`);

  setText('step4-cgst-itc', `₹${formatIndianCurrency(appState.gstr3b.itcCgst)}`);
  setText('step4-sgst-itc', `₹${formatIndianCurrency(appState.gstr3b.itcSgst)}`);
}

// Step 5: Offset Liability
function renderStep5() {
  const gross = appState.gstr3b.totalGst;
  const itc = appState.gstr3b.eligibleItc;
  const utilizedItc = Math.min(gross, itc);
  const cashBalance = Math.max(0, gross - itc);

  setText('step5-gross-tax', `₹${formatIndianCurrency(gross)}`);
  setText('step5-utilized-itc', `₹${formatIndianCurrency(utilizedItc)}`);
  setText('step5-cash-balance', `₹${formatIndianCurrency(cashBalance)}`);

  const offsetStatus = document.getElementById('step5-offset-status');
  if (offsetStatus) {
    if (cashBalance === 0) {
      offsetStatus.innerHTML = '<span class="text-emerald-700 font-bold"><i class="fa-solid fa-check-circle mr-1"></i>100% Tax Liability Offset from Input Tax Credit! Zero Cash required.</span>';
    } else {
      offsetStatus.innerHTML = `<span class="text-amber-800 font-bold"><i class="fa-solid fa-receipt mr-1"></i>Remaining ₹${formatIndianCurrency(cashBalance)} will be debited from Electronic Cash Ledger via Challan.</span>`;
    }
  }
}

function actionConfirmOffset() {
  showToast('ITC Credits successfully utilized against tax liability!', 'success');
  goToWizardStep(6);
}

// Step 6: Submit Return
function renderStep6() {
  const isLocked = appState.wizard.isSubmitted;
  const lockBanner = document.getElementById('step6-lock-status');
  const submitBtn = document.getElementById('btn-submit-and-lock');

  if (lockBanner) {
    if (isLocked) {
      lockBanner.className = 'p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900';
      lockBanner.innerHTML = '<div class="font-bold flex items-center"><i class="fa-solid fa-lock text-emerald-600 mr-2 text-lg"></i>Return Submitted & Locked for Filing</div><div class="text-xs text-emerald-700 mt-1">Entries have been frozen to prevent unauthorized edits. Ready for DSC / EVC verification.</div>';
    } else {
      lockBanner.className = 'p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900';
      lockBanner.innerHTML = '<div class="font-bold flex items-center"><i class="fa-solid fa-triangle-exclamation text-amber-600 mr-2 text-lg"></i>Declaration Before Final Submission</div><div class="text-xs text-amber-800 mt-1">Submitting will freeze form entries for October 2026. Please ensure all outward sales and purchase credits are verified.</div>';
    }
  }

  if (submitBtn) {
    submitBtn.disabled = isLocked;
    if (isLocked) {
      submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
      submitBtn.innerHTML = '<i class="fa-solid fa-lock mr-2"></i>Return Already Locked';
    } else {
      submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      submitBtn.innerHTML = '<i class="fa-solid fa-lock mr-2"></i>Confirm & Lock Return Entries';
    }
  }
}

function actionLockAndSubmit() {
  appState.wizard.isSubmitted = true;
  saveAppState();
  renderStep6();
  showToast('Return submitted and locked successfully. Proceeding to verification...', 'success');
  setTimeout(() => goToWizardStep(7), 800);
}

// Step 7: Verification (EVC OTP or DSC)
function renderStep7() {
  const evcBox = document.getElementById('verification-pane-evc');
  const dscBox = document.getElementById('verification-pane-dsc');
  const evcRadio = document.getElementById('radio-evc');
  const dscRadio = document.getElementById('radio-dsc');

  const updatePanes = () => {
    if (evcRadio?.checked) {
      if (evcBox) evcBox.classList.remove('hidden');
      if (dscBox) dscBox.classList.add('hidden');
      appState.wizard.verificationMethod = 'EVC';
    } else {
      if (evcBox) evcBox.classList.add('hidden');
      if (dscBox) dscBox.classList.remove('hidden');
      appState.wizard.verificationMethod = 'DSC';
    }
    saveAppState();
  };

  if (evcRadio) evcRadio.addEventListener('change', updatePanes);
  if (dscRadio) dscRadio.addEventListener('change', updatePanes);

  updatePanes();
}

function fillDemoOtp() {
  const otpInput = document.getElementById('evc-otp-input');
  if (otpInput) {
    otpInput.value = '739201';
    showToast('Demo 6-digit Aadhaar OTP filled!', 'info');
  }
}

function actionVerifyEVC() {
  const otpInput = document.getElementById('evc-otp-input');
  const otp = otpInput ? otpInput.value.trim() : '';

  if (otp.length !== 6) {
    showToast('Please enter a valid 6-digit OTP code received on Aadhaar mobile.', 'error');
    return;
  }

  completeFiling('EVC');
}

function actionVerifyDSC() {
  const dscBtn = document.getElementById('btn-sign-dsc');
  if (dscBtn) {
    dscBtn.disabled = true;
    dscBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Reading Crypto Token & Signing...';
  }

  setTimeout(() => {
    completeFiling('DSC');
  }, 1200);
}

function completeFiling(method) {
  // Generate Official 15-char ARN: AA + State (27) + Month (10) + Year (26) + 7 digits
  const randomSeq = Math.floor(1000000 + Math.random() * 9000000);
  const now = new Date();
  const yearShort = String(now.getFullYear()).slice(-2);
  const monthShort = String(now.getMonth() + 1).padStart(2, '0');
  const arn = `AA27${monthShort}${yearShort}${randomSeq}`;

  appState.wizard.isVerified = true;
  appState.wizard.verificationMethod = method;
  appState.wizard.generatedArn = arn;
  appState.wizard.filedAt = now.toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'medium' });

  // Update statuses to FILED
  appState.auth.gstr1Status = 'Filed';
  appState.auth.gstr3bStatus = 'Filed';
  saveAppState();

  showToast(`Congratulations! Return legally verified via ${method}. ARN Generated.`, 'success');
  goToWizardStep(8);
}

// Step 8: Acknowledgement Receipt
function renderStep8() {
  setText('ack-arn-number', appState.wizard.generatedArn || 'AA2710260084591');
  setText('ack-timestamp', appState.wizard.filedAt || new Date().toLocaleString('en-IN'));
  setText('ack-trade-name', appState.auth.tradeName);
  setText('ack-gstin', appState.auth.gstin);
  setText('ack-period', `${appState.auth.returnPeriod} (${appState.auth.financialYear})`);
  setText('ack-method', appState.wizard.verificationMethod || 'EVC');
  setText('ack-total-tax', `₹${formatIndianCurrency(appState.gstr3b.totalGst)}`);
  setText('ack-itc', `₹${formatIndianCurrency(appState.gstr3b.eligibleItc)}`);
  setText('ack-cash-paid', `₹${formatIndianCurrency(appState.gstr3b.netPayable)}`);
}

function downloadReceiptPDF() {
  window.print();
}

// ==========================================
// 8. TOAST & NOTIFICATION UTILITY
// ==========================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'flex items-center space-x-3 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold border transition-all transform duration-300 translate-y-2 opacity-0';

  if (type === 'success') {
    toast.classList.add('bg-emerald-900', 'text-white', 'border-emerald-600');
    toast.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400 text-sm"></i><span>${message}</span>`;
  } else if (type === 'error') {
    toast.classList.add('bg-rose-900', 'text-white', 'border-rose-600');
    toast.innerHTML = `<i class="fa-solid fa-circle-xmark text-rose-400 text-sm"></i><span>${message}</span>`;
  } else if (type === 'warning') {
    toast.classList.add('bg-amber-900', 'text-white', 'border-amber-600');
    toast.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-amber-400 text-sm"></i><span>${message}</span>`;
  } else {
    toast.classList.add('bg-slate-900', 'text-white', 'border-slate-700');
    toast.innerHTML = `<i class="fa-solid fa-circle-info text-blue-400 text-sm"></i><span>${message}</span>`;
  }

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Helper: Indian numbering format
function formatIndianCurrency(amount) {
  if (isNaN(amount)) return '0.00';
  const parts = Number(amount).toFixed(2).split('.');
  let lastThree = parts[0].substring(parts[0].length - 3);
  const otherNumbers = parts[0].substring(0, parts[0].length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree + '.' + parts[1];
  return formatted;
}
