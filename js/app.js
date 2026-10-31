/**
 * Indian Goods and Services Tax (GST) Portal Clone
 * Core Application Logic & Interactive Returns Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initCalculations();
  initAccessibility();
  initModals();
});

// ==========================================
// 1. NAVIGATION & STRICT AUTHENTICATION LOGIC
// ==========================================

// Strict Hardcoded Valid Credentials
const VALID_PORTAL_USER_ID = "GSTADMIN2026";
const VALID_PORTAL_PASSWORD = "SecureGST@123";

let isPortalAuthenticated = false;

function initNavigation() {
  const homeTab = document.getElementById('nav-tab-home');
  const returnTab = document.getElementById('nav-tab-returns');
  const homeHeaderBtn = document.getElementById('btn-switch-to-portal-header');

  if (homeTab) {
    homeTab.addEventListener('click', () => switchToHomeView());
  }

  if (returnTab) {
    returnTab.addEventListener('click', () => switchToLoginView());
  }

  if (homeHeaderBtn) {
    homeHeaderBtn.addEventListener('click', () => switchToLoginView());
  }
}

function switchToHomeView() {
  const homeSection = document.getElementById('home-section');
  const loginSection = document.getElementById('login-section');
  const portalSection = document.getElementById('return-portal-section');
  const homeTab = document.getElementById('nav-tab-home');
  const returnTab = document.getElementById('nav-tab-returns');

  if (homeSection) homeSection.classList.remove('hidden');
  if (loginSection) loginSection.classList.add('hidden');
  if (portalSection) portalSection.classList.add('hidden');

  if (homeTab && returnTab) {
    homeTab.classList.add('nav-link-active');
    returnTab.classList.remove('nav-link-active');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchToLoginView() {
  // If already authenticated, proceed to the dashboard directly
  if (isPortalAuthenticated) {
    switchToReturnsPortal();
    return;
  }

  const homeSection = document.getElementById('home-section');
  const loginSection = document.getElementById('login-section');
  const portalSection = document.getElementById('return-portal-section');
  const homeTab = document.getElementById('nav-tab-home');
  const returnTab = document.getElementById('nav-tab-returns');

  if (homeSection) homeSection.classList.add('hidden');
  if (portalSection) portalSection.classList.add('hidden');

  if (loginSection) {
    loginSection.classList.remove('hidden');
    
    // CRITICAL REQUIREMENT: The input fields must be completely blank by default (value="")
    const userInput = document.getElementById('portal-userid');
    const passInput = document.getElementById('portal-password');
    if (userInput) {
      userInput.value = '';
      userInput.classList.remove('border-red-500', 'bg-red-50/20');
      userInput.classList.add('border-slate-300');
    }
    if (passInput) {
      passInput.value = '';
      passInput.classList.remove('border-red-500', 'bg-red-50/20');
      passInput.classList.add('border-slate-300');
    }
    hideLoginError();
    if (userInput) setTimeout(() => userInput.focus(), 100);
  }

  if (homeTab && returnTab) {
    returnTab.classList.add('nav-link-active');
    homeTab.classList.remove('nav-link-active');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handlePortalLogin(e) {
  if (e) e.preventDefault();

  const userInput = document.getElementById('portal-userid');
  const passInput = document.getElementById('portal-password');
  const errorBanner = document.getElementById('login-error-banner');
  const errorMsg = document.getElementById('login-error-message');
  const submitBtn = document.getElementById('btn-portal-submit');

  const enteredId = userInput ? userInput.value.trim() : '';
  const enteredPass = passInput ? passInput.value : '';

  // Strict Authentication Comparison
  if (enteredId === VALID_PORTAL_USER_ID && enteredPass === VALID_PORTAL_PASSWORD) {
    // Valid credentials: hide errors and transition to dashboard
    hideLoginError();
    if (userInput) {
      userInput.classList.remove('border-red-500', 'bg-red-50/20');
      userInput.classList.add('border-emerald-500');
    }
    if (passInput) {
      passInput.classList.remove('border-red-500', 'bg-red-50/20');
      passInput.classList.add('border-emerald-500');
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1.5"></i>Authenticating...';
    }

    setTimeout(() => {
      isPortalAuthenticated = true;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket text-xs mr-1"></i><span>Login</span>';
      }
      showToast('Authentication successful! Welcome GSTADMIN2026', 'success');
      switchToReturnsPortal('GSTR-3B');
    }, 400);

  } else {
    // Incorrect credentials: Display clear red error message banner and prevent login
    if (errorBanner) {
      errorBanner.classList.remove('hidden');
    }
    if (errorMsg) {
      errorMsg.textContent = 'Invalid User ID or Password. Please try again.';
    }

    if (userInput) {
      userInput.classList.remove('border-slate-300', 'border-emerald-500');
      userInput.classList.add('border-red-500', 'bg-red-50/20');
    }
    if (passInput) {
      passInput.classList.remove('border-slate-300', 'border-emerald-500');
      passInput.classList.add('border-red-500', 'bg-red-50/20');
      passInput.focus();
    }

    showToast('Invalid User ID or Password. Please try again.', 'error');
  }
}

function hideLoginError() {
  const errorBanner = document.getElementById('login-error-banner');
  if (errorBanner) errorBanner.classList.add('hidden');
}

function togglePortalPasswordVisibility() {
  const passInput = document.getElementById('portal-password');
  const icon = document.getElementById('toggle-portal-pass-icon');
  if (passInput && icon) {
    const isPass = passInput.type === 'password';
    passInput.type = isPass ? 'text' : 'password';
    icon.className = isPass ? 'fa-solid fa-eye-slash text-xs' : 'fa-solid fa-eye text-xs';
  }
}

function handlePortalLogout() {
  isPortalAuthenticated = false;
  const userInput = document.getElementById('portal-userid');
  const passInput = document.getElementById('portal-password');
  if (userInput) userInput.value = '';
  if (passInput) passInput.value = '';
  hideLoginError();
  showToast('Logged out of GST Return Portal successfully.');
  switchToHomeView();
}

function switchToReturnsPortal(specificReturn = 'GSTR-3B') {
  if (!isPortalAuthenticated) {
    switchToLoginView();
    return;
  }

  const homeSection = document.getElementById('home-section');
  const loginSection = document.getElementById('login-section');
  const portalSection = document.getElementById('return-portal-section');
  const homeTab = document.getElementById('nav-tab-home');
  const returnTab = document.getElementById('nav-tab-returns');

  if (homeSection) homeSection.classList.add('hidden');
  if (loginSection) loginSection.classList.add('hidden');
  if (portalSection) portalSection.classList.remove('hidden');

  if (homeTab && returnTab) {
    returnTab.classList.add('nav-link-active');
    homeTab.classList.remove('nav-link-active');
  }

  if (specificReturn) {
    selectReturnForm(specificReturn);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function triggerPortalTab(returnName) {
  if (!isPortalAuthenticated) {
    switchToLoginView();
  } else {
    switchToReturnsPortal(returnName);
  }
}

// ==========================================
// 2. UPCOMING DUE DATES TABS
// ==========================================

function switchDueDateTab(tabName) {
  const tabs = ['monthly', 'quarterly', 'others'];
  tabs.forEach(name => {
    const btn = document.getElementById(`due-tab-${name}`);
    const pane = document.getElementById(`due-content-${name}`);
    if (btn && pane) {
      if (name === tabName) {
        btn.classList.add('text-gst-navy', 'border-b-2', 'border-gst-navy', 'bg-white');
        btn.classList.remove('text-slate-600');
        pane.classList.remove('hidden');
      } else {
        btn.classList.remove('text-gst-navy', 'border-b-2', 'border-gst-navy', 'bg-white');
        btn.classList.add('text-slate-600');
        pane.classList.add('hidden');
      }
    }
  });
}

// ==========================================
// 3. POPULAR HELP ACCORDION
// ==========================================

function toggleHelpAccordion(id) {
  const answer = document.getElementById(`faq-answer-${id}`);
  const chevron = document.getElementById(`faq-chevron-${id}`);
  
  if (!answer) return;

  const isHidden = answer.classList.contains('hidden');

  // Close all other accordions first
  for (let i = 1; i <= 4; i++) {
    const a = document.getElementById(`faq-answer-${i}`);
    const c = document.getElementById(`faq-chevron-${i}`);
    if (a && c) {
      a.classList.add('hidden');
      c.classList.remove('rotate-180');
    }
  }

  if (isHidden) {
    answer.classList.remove('hidden');
    chevron.classList.add('rotate-180');
  }
}

function scrollToFaq() {
  const faqElement = document.querySelector('.help-accordion-item');
  if (faqElement) {
    faqElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toggleHelpAccordion(1);
  }
}

// ==========================================
// 4. RETURN FORM WORKSPACE SELECTOR
// ==========================================

let currentSelectedReturn = 'GSTR-3B';
let isOctReturnFiled = false;

function selectReturnForm(returnType) {
  currentSelectedReturn = returnType;

  // Visual card highlighting
  const cards = ['gstr1', 'gstr2b', 'gstr3b'];
  cards.forEach(cardId => {
    const cardEl = document.getElementById(`card-${cardId}`);
    if (cardEl) {
      cardEl.classList.remove('border-gst-navy', 'ring-2', 'ring-gst-navy/20', 'bg-blue-50/30');
      cardEl.classList.add('border-slate-200');
    }
  });

  const activeCard = document.getElementById(`card-${returnType.toLowerCase()}`);
  if (activeCard) {
    activeCard.classList.remove('border-slate-200');
    activeCard.classList.add('border-gst-navy', 'ring-2', 'ring-gst-navy/20', 'bg-blue-50/30');
  }

  // Workspaces logic
  const workspaceContainer = document.getElementById('workspace-container');
  if (workspaceContainer) {
    workspaceContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  if (returnType === 'GSTR-1') {
    showToast('GSTR-1 for October 2026 was filed on 09/11/2026. ARN: AA271026049281X.');
  } else if (returnType === 'GSTR-2B') {
    showToast('GSTR-2B auto-generated ITC statement loaded from 158 verified supplier invoices.');
  } else if (returnType === 'GSTR-3B') {
    calculateGSTR3B();
  }
}

function applyReturnFilter() {
  const fy = document.getElementById('filter-fy').value;
  const period = document.getElementById('filter-period').value;
  const label = document.getElementById('label-selected-period');

  if (label) {
    label.textContent = `${period} (FY ${fy})`;
  }

  showToast(`Filtered return statements for: ${period} (${fy})`);
  calculateGSTR3B();
}

function resetReturnFilter() {
  document.getElementById('filter-fy').value = '2026-27';
  document.getElementById('filter-quarter').value = 'Q3';
  document.getElementById('filter-period').value = 'October 2026';
  applyReturnFilter();
}

// ==========================================
// 5. GSTR-3B CALCULATION & OFFSET ENGINE
// ==========================================

function parseNum(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const val = parseFloat(el.value);
  return isNaN(val) ? 0 : val;
}

function formatINR(val) {
  const rounded = Math.round((val + Number.EPSILON) * 100) / 100;
  return '₹ ' + rounded.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function initCalculations() {
  calculateGSTR3B();
}

function calculateGSTR3B() {
  // Table 3.1: Outward supplies
  const t31a_taxable = parseNum('t31a-taxable');
  const t31a_igst = parseNum('t31a-igst');
  const t31a_cgst = parseNum('t31a-cgst');
  const t31a_sgst = parseNum('t31a-sgst');
  const t31a_cess = parseNum('t31a-cess');

  const t31b_taxable = parseNum('t31b-taxable');
  const t31b_igst = parseNum('t31b-igst');
  const t31b_cess = parseNum('t31b-cess');

  const t31c_taxable = parseNum('t31c-taxable');

  const t31d_taxable = parseNum('t31d-taxable');
  const t31d_igst = parseNum('t31d-igst');
  const t31d_cgst = parseNum('t31d-cgst');
  const t31d_sgst = parseNum('t31d-sgst');
  const t31d_cess = parseNum('t31d-cess');

  const t31e_taxable = parseNum('t31e-taxable');

  // Sums for 3.1
  const sum_31_taxable = t31a_taxable + t31b_taxable + t31c_taxable + t31d_taxable + t31e_taxable;
  const sum_31_igst = t31a_igst + t31b_igst + t31d_igst;
  const sum_31_cgst = t31a_cgst + t31d_cgst;
  const sum_31_sgst = t31a_sgst + t31d_sgst;
  const sum_31_cess = t31a_cess + t31b_cess + t31d_cess;

  // Update Section 3.1 Totals
  document.getElementById('t31-total-taxable').textContent = formatINR(sum_31_taxable);
  document.getElementById('t31-total-igst').textContent = formatINR(sum_31_igst);
  document.getElementById('t31-total-cgst').textContent = formatINR(sum_31_cgst);
  document.getElementById('t31-total-sgst').textContent = formatINR(sum_31_sgst);
  document.getElementById('t31-total-cess').textContent = formatINR(sum_31_cess);

  // Table 4: ITC Available & Reversals
  const itc_a1_igst = parseNum('itc-a1-igst');
  const itc_a3_igst = parseNum('itc-a3-igst');
  const itc_a3_cgst = parseNum('itc-a3-cgst');
  const itc_a3_sgst = parseNum('itc-a3-sgst');

  const itc_a5_igst = parseNum('itc-a5-igst');
  const itc_a5_cgst = parseNum('itc-a5-cgst');
  const itc_a5_sgst = parseNum('itc-a5-sgst');

  const itc_b_igst = parseNum('itc-b-igst');
  const itc_b_cgst = parseNum('itc-b-cgst');
  const itc_b_sgst = parseNum('itc-b-sgst');

  // Net ITC Available [(A) - (B)]
  const net_itc_igst = Math.max(0, (itc_a1_igst + itc_a3_igst + itc_a5_igst) - itc_b_igst);
  const net_itc_cgst = Math.max(0, (itc_a3_cgst + itc_a5_cgst) - itc_b_cgst);
  const net_itc_sgst = Math.max(0, (itc_a3_sgst + itc_a5_sgst) - itc_b_sgst);
  const net_itc_cess = 0;

  document.getElementById('itc-net-igst').textContent = formatINR(net_itc_igst);
  document.getElementById('itc-net-cgst').textContent = formatINR(net_itc_cgst);
  document.getElementById('itc-net-sgst').textContent = formatINR(net_itc_sgst);
  document.getElementById('itc-net-cess').textContent = formatINR(net_itc_cess);

  // Table 6.1: Offset Order (Rule 88A)
  // Total Liabilities
  const liab_igst = sum_31_igst;
  const liab_cgst = sum_31_cgst;
  const liab_sgst = sum_31_sgst;
  const liab_cess = sum_31_cess;

  // IGST Liability offset first with IGST ITC
  const itc_used_igst = Math.min(liab_igst, net_itc_igst);
  const remaining_igst_itc = net_itc_igst - itc_used_igst;
  let cash_igst = liab_igst - itc_used_igst;

  // CGST offset with remaining IGST ITC, then CGST ITC
  let itc_used_cgst = 0;
  let remaining_cgst_liab = liab_cgst;

  // Use remaining IGST ITC if any
  let igst_to_cgst = Math.min(remaining_cgst_liab, remaining_igst_itc);
  remaining_cgst_liab -= igst_to_cgst;
  const remaining_igst_after_cgst = remaining_igst_itc - igst_to_cgst;

  // Use CGST ITC
  const cgst_itc_offset = Math.min(remaining_cgst_liab, net_itc_cgst);
  itc_used_cgst = igst_to_cgst + cgst_itc_offset;
  const cash_cgst = liab_cgst - itc_used_cgst;

  // SGST offset with remaining IGST ITC, then SGST ITC
  let remaining_sgst_liab = liab_sgst;
  let igst_to_sgst = Math.min(remaining_sgst_liab, remaining_igst_after_cgst);
  remaining_sgst_liab -= igst_to_sgst;

  const sgst_itc_offset = Math.min(remaining_sgst_liab, net_itc_sgst);
  const itc_used_sgst = igst_to_sgst + sgst_itc_offset;
  const cash_sgst = liab_sgst - itc_used_sgst;

  // Cess cash
  const itc_used_cess = 0;
  const cash_cess = liab_cess;

  // Render Table 6.1 rows
  document.getElementById('pay-liab-igst').textContent = formatINR(liab_igst);
  document.getElementById('pay-itc-igst').textContent = formatINR(itc_used_igst);
  document.getElementById('pay-cash-igst').textContent = formatINR(cash_igst);
  document.getElementById('pay-total-igst').textContent = formatINR(cash_igst);

  document.getElementById('pay-liab-cgst').textContent = formatINR(liab_cgst);
  document.getElementById('pay-itc-cgst').textContent = formatINR(itc_used_cgst);
  document.getElementById('pay-cash-cgst').textContent = formatINR(cash_cgst);
  document.getElementById('pay-total-cgst').textContent = formatINR(cash_cgst);

  document.getElementById('pay-liab-sgst').textContent = formatINR(liab_sgst);
  document.getElementById('pay-itc-sgst').textContent = formatINR(itc_used_sgst);
  document.getElementById('pay-cash-sgst').textContent = formatINR(cash_sgst);
  document.getElementById('pay-total-sgst').textContent = formatINR(cash_sgst);

  document.getElementById('pay-liab-cess').textContent = formatINR(liab_cess);
  document.getElementById('pay-itc-cess').textContent = formatINR(itc_used_cess);
  document.getElementById('pay-cash-cess').textContent = formatINR(cash_cess);
  document.getElementById('pay-total-cess').textContent = formatINR(cash_cess);

  // Totals footing
  const total_liability = liab_igst + liab_cgst + liab_sgst + liab_cess;
  const total_itc_paid = itc_used_igst + itc_used_cgst + itc_used_sgst + itc_used_cess;
  const total_cash_paid = cash_igst + cash_cgst + cash_sgst + cash_cess;

  document.getElementById('pay-sum-liab').textContent = formatINR(total_liability);
  document.getElementById('pay-sum-itc').textContent = formatINR(total_itc_paid);
  document.getElementById('pay-sum-cash').textContent = formatINR(total_cash_paid);
  document.getElementById('pay-sum-grand').textContent = formatINR(total_cash_paid);

  // Top header indicator
  const headerNet = document.getElementById('header-net-payable');
  if (headerNet) {
    headerNet.textContent = formatINR(total_cash_paid);
  }

  // Sync to filing modal
  const filingCash = document.getElementById('filing-modal-cash');
  if (filingCash) {
    filingCash.textContent = formatINR(total_cash_paid);
  }

  // Update save status text to show uncommitted edits
  const saveText = document.getElementById('save-status-text');
  if (saveText) {
    saveText.textContent = 'Auto-recalculated. Click "Save Draft" to persist.';
  }
}

function restoreDefaultFormValues() {
  document.getElementById('t31a-taxable').value = '1250000';
  document.getElementById('t31a-igst').value = '45000';
  document.getElementById('t31a-cgst').value = '90000';
  document.getElementById('t31a-sgst').value = '90000';
  document.getElementById('t31a-cess').value = '0';

  document.getElementById('t31b-taxable').value = '300000';
  document.getElementById('t31b-igst').value = '54000';
  document.getElementById('t31b-cess').value = '0';

  document.getElementById('t31c-taxable').value = '40000';

  document.getElementById('t31d-taxable').value = '50000';
  document.getElementById('t31d-igst').value = '0';
  document.getElementById('t31d-cgst').value = '4500';
  document.getElementById('t31d-sgst').value = '4500';
  document.getElementById('t31d-cess').value = '0';

  document.getElementById('t31e-taxable').value = '0';

  document.getElementById('itc-a1-igst').value = '12000';
  document.getElementById('itc-a3-igst').value = '0';
  document.getElementById('itc-a3-cgst').value = '4500';
  document.getElementById('itc-a3-sgst').value = '4500';

  document.getElementById('itc-a5-igst').value = '65000';
  document.getElementById('itc-a5-cgst').value = '72000';
  document.getElementById('itc-a5-sgst').value = '72000';

  document.getElementById('itc-b-igst').value = '2000';
  document.getElementById('itc-b-cgst').value = '1500';
  document.getElementById('itc-b-sgst').value = '1500';

  calculateGSTR3B();
  showToast('Default portal figures restored successfully.');
}

function handleSaveDraft() {
  const saveText = document.getElementById('save-status-text');
  if (saveText) {
    const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    saveText.textContent = `Draft saved to GSTN servers at ${timestamp}.`;
  }
  showToast('Form GSTR-3B draft saved successfully.');
}

// ==========================================
// 6. PREVIEW STATEMENT MODAL BUILDER
// ==========================================

function openPreviewStatementModal() {
  const fy = document.getElementById('filter-fy').value;
  const period = document.getElementById('filter-period').value;

  document.getElementById('preview-fy').textContent = fy;
  document.getElementById('preview-period').textContent = period;
  document.getElementById('preview-date').textContent = new Date().toLocaleDateString('en-IN');

  // Populate Table 3.1 rows
  const tbody31 = document.getElementById('preview-tbody-31');
  if (tbody31) {
    tbody31.innerHTML = `
      <tr>
        <td class="p-2 font-medium">(a) Outward taxable supplies</td>
        <td class="p-2 text-right font-mono">${formatINR(parseNum('t31a-taxable'))}</td>
        <td class="p-2 text-right font-mono">${formatINR(parseNum('t31a-igst'))}</td>
        <td class="p-2 text-right font-mono">${formatINR(parseNum('t31a-cgst'))}</td>
        <td class="p-2 text-right font-mono">${formatINR(parseNum('t31a-sgst'))}</td>
      </tr>
      <tr>
        <td class="p-2 font-medium">(b) Outward taxable supplies (Zero rated)</td>
        <td class="p-2 text-right font-mono">${formatINR(parseNum('t31b-taxable'))}</td>
        <td class="p-2 text-right font-mono">${formatINR(parseNum('t31b-igst'))}</td>
        <td class="p-2 text-right font-mono">-</td>
        <td class="p-2 text-right font-mono">-</td>
      </tr>
      <tr>
        <td class="p-2 font-medium">(d) Inward supplies liable to reverse charge</td>
        <td class="p-2 text-right font-mono">${formatINR(parseNum('t31d-taxable'))}</td>
        <td class="p-2 text-right font-mono">${formatINR(parseNum('t31d-igst'))}</td>
        <td class="p-2 text-right font-mono">${formatINR(parseNum('t31d-cgst'))}</td>
        <td class="p-2 text-right font-mono">${formatINR(parseNum('t31d-sgst'))}</td>
      </tr>
      <tr class="bg-slate-100 font-bold">
        <td class="p-2">Total Outward Liability</td>
        <td class="p-2 text-right font-mono">${document.getElementById('t31-total-taxable').textContent}</td>
        <td class="p-2 text-right font-mono">${document.getElementById('t31-total-igst').textContent}</td>
        <td class="p-2 text-right font-mono">${document.getElementById('t31-total-cgst').textContent}</td>
        <td class="p-2 text-right font-mono">${document.getElementById('t31-total-sgst').textContent}</td>
      </tr>
    `;
  }

  // Populate Table 4 rows
  const tbody4 = document.getElementById('preview-tbody-4');
  if (tbody4) {
    tbody4.innerHTML = `
      <tr>
        <td class="p-2 font-medium">All other ITC (from GSTR-2B)</td>
        <td class="p-2 text-right font-mono">${formatINR(parseNum('itc-a5-igst'))}</td>
        <td class="p-2 text-right font-mono">${formatINR(parseNum('itc-a5-cgst'))}</td>
        <td class="p-2 text-right font-mono">${formatINR(parseNum('itc-a5-sgst'))}</td>
      </tr>
      <tr>
        <td class="p-2 font-medium text-red-700">Less: ITC Reversed</td>
        <td class="p-2 text-right font-mono text-red-700">(${formatINR(parseNum('itc-b-igst'))})</td>
        <td class="p-2 text-right font-mono text-red-700">(${formatINR(parseNum('itc-b-cgst'))})</td>
        <td class="p-2 text-right font-mono text-red-700">(${formatINR(parseNum('itc-b-sgst'))})</td>
      </tr>
      <tr class="bg-emerald-50 font-bold text-emerald-950">
        <td class="p-2">Net Eligible ITC Available</td>
        <td class="p-2 text-right font-mono">${document.getElementById('itc-net-igst').textContent}</td>
        <td class="p-2 text-right font-mono">${document.getElementById('itc-net-cgst').textContent}</td>
        <td class="p-2 text-right font-mono">${document.getElementById('itc-net-sgst').textContent}</td>
      </tr>
    `;
  }

  document.getElementById('preview-total-cash').textContent = document.getElementById('pay-sum-grand').textContent;
  openModal('modal-preview-statement');
}

// ==========================================
// 7. PROCEED TO FILE & OTP SIMULATION
// ==========================================

let otpTimerInterval = null;

function openProceedToFileModal() {
  if (isOctReturnFiled) {
    showToast('GSTR-3B for October 2026 is already filed. Generating fresh ARN preview.');
  }

  // Reset steps
  document.getElementById('filing-step-declaration').classList.remove('hidden');
  document.getElementById('filing-step-otp').classList.add('hidden');
  document.getElementById('filing-step-success').classList.add('hidden');

  // Reset checkbox & buttons
  const checkbox = document.getElementById('filing-declaration-checkbox');
  if (checkbox) checkbox.checked = false;
  toggleFilingButtons();

  const period = document.getElementById('filter-period').value;
  document.getElementById('filing-modal-period').textContent = period;
  document.getElementById('filing-modal-cash').textContent = document.getElementById('pay-sum-grand').textContent;

  openModal('modal-proceed-to-file');
}

function toggleFilingButtons() {
  const checkbox = document.getElementById('filing-declaration-checkbox');
  const btnEvc = document.getElementById('btn-file-evc');
  const btnDsc = document.getElementById('btn-file-dsc');

  const isChecked = checkbox && checkbox.checked;
  if (btnEvc && btnDsc) {
    btnEvc.disabled = !isChecked;
    btnDsc.disabled = !isChecked;
  }
}

function triggerOtpStep() {
  document.getElementById('filing-step-declaration').classList.add('hidden');
  document.getElementById('filing-step-otp').classList.remove('hidden');

  document.getElementById('otp-input').value = '';
  startOtpTimer();
  showToast('OTP sent to registered mobile and email.');
}

function triggerDscStep() {
  showToast('Connecting to emSigner Digital Signature utility...');
  setTimeout(() => {
    generateFilingSuccess('DSC (Digital Signature Certificate)');
  }, 1000);
}

function startOtpTimer() {
  clearInterval(otpTimerInterval);
  let duration = 600; // 10 minutes in seconds
  const timerEl = document.getElementById('otp-timer');

  otpTimerInterval = setInterval(() => {
    duration--;
    if (duration <= 0) {
      clearInterval(otpTimerInterval);
      if (timerEl) timerEl.textContent = '00:00 (Expired)';
      return;
    }
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    if (timerEl) {
      timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }, 1000);
}

function backToDeclarationStep() {
  clearInterval(otpTimerInterval);
  document.getElementById('filing-step-otp').classList.add('hidden');
  document.getElementById('filing-step-declaration').classList.remove('hidden');
}

function verifyOtpAndFinalize() {
  const otpInput = document.getElementById('otp-input');
  const otpVal = otpInput.value.trim();

  if (!otpVal || otpVal.length < 6) {
    alert('Please enter the 6-digit OTP sent to your registered contacts (or use demo code: 123456).');
    return;
  }

  // Success flow
  clearInterval(otpTimerInterval);
  generateFilingSuccess('EVC (One Time Password)');
}

function generateFilingSuccess(authMode) {
  // Generate random realistic ARN: AA271026XXXXXXX
  const randomSuffix = Math.floor(1000000 + Math.random() * 9000000);
  const arn = `AA271026${randomSuffix}`;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN') + ', ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST';

  document.getElementById('res-arn-display').textContent = arn;
  document.getElementById('res-arn-date').textContent = dateStr;

  document.getElementById('filing-step-declaration').classList.add('hidden');
  document.getElementById('filing-step-otp').classList.add('hidden');
  document.getElementById('filing-step-success').classList.remove('hidden');

  isOctReturnFiled = true;
  showToast('Congratulations! Return filed successfully on GST Common Portal.');
}

function updatePostFilingState() {
  // Update card 3B visual badge
  const card3B = document.getElementById('card-gstr3b');
  if (card3B) {
    const badge = card3B.querySelector('.badge-pending');
    if (badge) {
      badge.className = 'badge-filed text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase mr-14';
      badge.innerHTML = '<i class="fa-solid fa-circle-check mr-1"></i>Filed';
    }
    const dueText = card3B.querySelector('.text-red-600');
    if (dueText) {
      dueText.className = 'text-emerald-700 font-bold';
      dueText.textContent = 'Filed Successfully';
    }
  }

  // Update cash ledger balance (debit simulated cash)
  const cashLedgerDisplay = document.getElementById('cash-ledger-display');
  if (cashLedgerDisplay) {
    cashLedgerDisplay.textContent = '₹ 21,500.00 (Debited)';
  }

  showToast('Filing status updated to FILED. Cash ledger debited.');
}

// ==========================================
// 8. TAXPAYER GSTIN SEARCH ENGINE
// ==========================================

const SAMPLE_TAXPAYERS = {
  '27AAACB2026P1Z8': {
    legal: 'BHARAT TECHTRONICS ENTERPRISES PRIVATE LIMITED',
    trade: 'BHARAT TECHTRONICS',
    status: 'ACTIVE',
    constitution: 'Private Limited Company',
    regDate: '01/07/2017',
    jurisdiction: 'Mumbai Central - Division IV',
    type: 'Regular Taxpayer'
  },
  '07AAAAA0000A1Z5': {
    legal: 'NATIONAL LOGISTICS & SUPPLY CHAIN LTD',
    trade: 'DELHI EXPRESS CARGO',
    status: 'ACTIVE',
    constitution: 'Public Limited Company',
    regDate: '15/09/2018',
    jurisdiction: 'Delhi West - Ward 12',
    type: 'Regular Taxpayer'
  },
  '29BBBBB1111B1Z2': {
    legal: 'BENGALURU CLOUD COMPUTING SOLUTIONS LLP',
    trade: 'CLOUD INFRA TECH',
    status: 'ACTIVE',
    constitution: 'Limited Liability Partnership',
    regDate: '12/03/2020',
    jurisdiction: 'Bengaluru South - Range 3',
    type: 'Regular Taxpayer'
  }
};

function openSearchTaxpayerModal() {
  openModal('modal-search-taxpayer');
}

function executeGstinSearch() {
  const input = document.getElementById('search-gstin-input');
  const gstin = input.value.trim().toUpperCase();

  if (!gstin || gstin.length < 10) {
    alert('Please enter a valid 15-digit GSTIN.');
    return;
  }

  const resultData = SAMPLE_TAXPAYERS[gstin] || {
    legal: `${gstin.substring(2, 7)} ENTERPRISES (VERIFIED)`,
    trade: 'COMMERCIAL TRADING CO.',
    status: 'ACTIVE',
    constitution: 'Proprietorship / Partnership',
    regDate: '01/04/2019',
    jurisdiction: `State Code ${gstin.substring(0, 2)} - Division I`,
    type: 'Regular Taxpayer'
  };

  document.getElementById('res-legal-name').textContent = resultData.legal;
  document.getElementById('res-trade-name').textContent = resultData.trade;
  document.getElementById('res-gstin').textContent = gstin;
  document.getElementById('res-status').textContent = resultData.status;

  showToast(`Verified GSTIN: ${gstin}`);
}

// ==========================================
// 9. NEWS & MEDIA DETAIL MODALS
// ==========================================

const NEWS_DATA = {
  1: {
    badge: 'E-INVOICE',
    date: 'Oct 16th, 2026',
    title: 'Introduction of e-Invoicing Facility for Recipient Generated Self Invoices under RCMDOM and Import of Services (RCMIMP)',
    content: `
      <p>1. As per Rule 48(4) of CGST Rules, taxpayers liable to pay tax under Reverse Charge Mechanism (RCM) are required to generate self-invoices for domestic inward supplies and import of services.</p>
      <p>2. A dedicated document type <strong>RCMDOM</strong> (Recipient Generated Self Invoice - Domestic) and <strong>RCMIMP</strong> (Import of Services) is now operational on all Invoice Registration Portals (IRPs).</p>
      <p>3. Taxpayers can report these invoices and acquire valid IRN and QR code for proper compliance and ITC claim in Form GSTR-3B.</p>
    `
  },
  2: {
    badge: 'RETURNS',
    date: 'Oct 13th, 2026',
    title: 'Annual Returns in the form of GSTR-9/9C for FY 2025-26',
    content: `
      <p>1. The GST Common Portal has enabled the online and offline utility for filing Annual Return in <strong>Form GSTR-9</strong> and Reconciliation Statement in <strong>Form GSTR-9C</strong> for FY 2025-26.</p>
      <p>2. Filing of GSTR-9 is mandatory for taxpayers having aggregate annual turnover above ₹2 Crores.</p>
      <p>3. Form GSTR-9C self-certification is required for taxpayers whose aggregate turnover exceeds ₹5 Crores in the preceding financial year.</p>
      <p>4. Last date for filing without late fee is <strong>31st December 2026</strong>.</p>
    `
  },
  3: {
    badge: 'OTHERS',
    date: 'Oct 13th, 2026',
    title: 'FAQs in relation to recommendations of the 57th GST Council Meeting',
    content: `
      <p>1. <strong>Section 128A Waiver:</strong> Clarifications issued on the conditional waiver of interest or penalty or both relating to demand notices issued under Section 73 for FY 2017-18, 2018-19, and 2019-20.</p>
      <p>2. <strong>Biometric Authentication:</strong> Phased pan-India rollout of biometric-based Aadhaar authentication for high-risk registration applicants.</p>
      <p>3. <strong>Pre-deposit reduction:</strong> Maximum limit for filing appeals before Appellate Authority reduced to facilitate trade liquidity.</p>
    `
  }
};

function openNewsDetailModal(id) {
  const data = NEWS_DATA[id];
  if (!data) return;

  document.getElementById('news-modal-badge').textContent = data.badge;
  document.getElementById('news-modal-date').textContent = data.date;
  document.getElementById('news-modal-title').textContent = data.title;
  document.getElementById('news-modal-content').innerHTML = data.content;

  openModal('modal-news-detail');
}

const MEDIA_DATA = {
  geocoding: {
    badge: 'REGISTRATION',
    title: 'Map-based Geocoding in the Registration Process',
    content: `
      <p><strong>What is Geocoding?</strong> Geocoding converts an address into geographic coordinates (Latitude and Longitude) to ensure precise physical location marking of business premises.</p>
      <p><strong>Mandatory Requirement:</strong> All new applicants and existing taxpayers must verify the pinpoint location on the map displayed in Table 2 of the Registration amendment form.</p>
      <p><strong>Benefits:</strong> Eliminates physical inspection delays, prevents fake registrations, and ensures rapid issuance of GSTIN without jurisdictional disputes.</p>
    `
  },
  ims: {
    badge: 'IMS SYSTEM',
    title: 'Invoice Management System (IMS) Workflow',
    content: `
      <p><strong>Concept:</strong> IMS provides recipient taxpayers a facility to verify, review, and act on supplier invoices filed in GSTR-1 / IFF before GSTR-2B is generated on the 14th of every month.</p>
      <p><strong>Three Actions Available:</strong></p>
      <ul class="list-disc pl-5 space-y-1">
        <li><strong>Accept:</strong> Invoice is included in GSTR-2B eligible ITC.</li>
        <li><strong>Reject:</strong> Invoice is excluded from GSTR-2B and sent back to supplier.</li>
        <li><strong>Pending:</strong> Invoice is kept on hold for subsequent period review.</li>
      </ul>
    `
  },
  auto3b: {
    badge: 'RETURNS COMPLIANCE',
    title: 'Auto-population of ITC in GSTR-3B from GSTR-2B',
    content: `
      <p><strong>Hard-locking Mechanism:</strong> To safeguard revenue and ensure statutory adherence, Input Tax Credit figures in Table 4 of Form GSTR-3B are auto-populated directly from the recipient's GSTR-2B statement.</p>
      <p><strong>Red-Flagged Variances:</strong> Taxpayers entering ITC higher than GSTR-2B by more than 10% will be prompted with a warning dialog and may trigger automated system scrutiny under Rule 88D.</p>
    `
  }
};

function openMediaDetailModal(key) {
  const data = MEDIA_DATA[key];
  if (!data) return;

  document.getElementById('media-modal-badge').textContent = data.badge;
  document.getElementById('media-modal-title').textContent = data.title;
  document.getElementById('media-modal-content').innerHTML = data.content;

  openModal('modal-media-detail');
}

function openHelpdeskModal() {
  alert('GST Helpdesk:\nToll Free: 1800-103-4786\nAlternate: 0120-4888999\nEmail: helpdesk@gst.gov.in\nHours: 9:00 AM - 9:00 PM (Mon-Sat)');
}

// ==========================================
// 10. ACCESSIBILITY TOOLS (FONT SIZING)
// ==========================================

let currentFontSize = 100;

function initAccessibility() {
  const btnInc = document.getElementById('btn-font-inc');
  const btnDec = document.getElementById('btn-font-dec');
  const btnReset = document.getElementById('btn-font-reset');

  if (btnInc) {
    btnInc.addEventListener('click', () => {
      if (currentFontSize < 125) {
        currentFontSize += 5;
        document.body.style.fontSize = `${currentFontSize}%`;
      }
    });
  }

  if (btnDec) {
    btnDec.addEventListener('click', () => {
      if (currentFontSize > 85) {
        currentFontSize -= 5;
        document.body.style.fontSize = `${currentFontSize}%`;
      }
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      currentFontSize = 100;
      document.body.style.fontSize = '100%';
    });
  }

  // Language select feedback
  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      showToast(`Interface language switched to: ${e.target.options[e.target.selectedIndex].text}`);
    });
  }

  const badgeHeader = document.getElementById('taxpayer-badge-header');
  if (badgeHeader) {
    badgeHeader.addEventListener('click', () => {
      openSearchTaxpayerModal();
    });
  }
}

// ==========================================
// 11. MODAL SYSTEM HELPERS
// ==========================================

function initModals() {
  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModals = document.querySelectorAll('.fixed:not(.hidden)');
      openModals.forEach(modal => {
        if (modal.id && modal.id.startsWith('modal-')) {
          closeModal(modal.id);
        }
      });
    }
  });

  // Close modals when clicking the backdrop
  const modalWrappers = document.querySelectorAll('[id^="modal-"]');
  modalWrappers.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

// ==========================================
// 12. TOAST SYSTEM & FILE SIMULATOR
// ==========================================

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border-l-4 border-amber-400 flex items-center space-x-2 transform transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto';
  toast.innerHTML = `
    <i class="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
    <span class="font-medium">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  // Remove toast
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function simulateDownload(filename) {
  showToast(`Downloading official utility package: ${filename}`);
}
