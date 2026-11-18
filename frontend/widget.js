// Idea 4 — Real Embeddable Partner SDK Widget (<script src="http://127.0.0.1:3000/widget.js"></script>)
// Any app or onboarding portal (Snabbit, Rapido, Blinkit, Loan Apps) can drop one script tag
// and add `data-contractlens-clause` to any terms box to power "Understand This with AI"!
(function () {
  const API_BASE = document.currentScript?.src
    ? new URL(document.currentScript.src).origin
    : 'http://127.0.0.1:3000';

  function injectStyles() {
    if (document.getElementById('contractlens-sdk-style')) return;
    const style = document.createElement('style');
    style.id = 'contractlens-sdk-style';
    style.textContent = `
      .cl-sdk-btn { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:999px; border:1px solid #4f46e5; background:#eef2ff; color:#4f46e5; font:600 13px/1 system-ui,sans-serif; cursor:pointer; margin-top:8px; }
      .cl-sdk-btn:hover { background:#4f46e5; color:#fff; }
      .cl-sdk-panel { margin-top:10px; padding:14px; border-radius:12px; border:1px solid #c7d2fe; background:#ffffff; color:#0f172a; font:13px/1.55 system-ui,sans-serif; box-shadow:0 12px 28px rgba(15,23,42,0.12); }
    `;
    document.head.appendChild(style);
  }

  async function explainText(text, targetContainer) {
    targetContainer.innerHTML = '<div class="cl-sdk-panel">Analyzing terms with ContractLens AI...</div>';
    try {
      const res = await fetch(`${API_BASE}/api/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, contextMode: 'partner_widget' })
      });
      const { explanation } = await res.json();
      targetContainer.innerHTML = `
        <div class="cl-sdk-panel">
          <strong>✨ ContractLens AI — ${explanation.label}</strong>
          <p style="margin:6px 0;"><strong>What this means:</strong> ${explanation.simpleMeaning}</p>
          <p style="margin:6px 0;"><strong>Income / Wallet impact:</strong> ${explanation.affectsIncomeOrWallet}</p>
          <p style="margin:6px 0;"><strong>Deductions risk:</strong> ${explanation.deductionsRisk}</p>
          <p style="margin:6px 0;"><strong>Clarify before accepting:</strong> ${(explanation.askBeforeAgreeing || [])[0] || ''}</p>
        </div>`;
    } catch {
      targetContainer.innerHTML = '<div class="cl-sdk-panel">Could not reach ContractLens AI backend.</div>';
    }
  }

  window.ContractLensSDK = {
    mount() {
      injectStyles();
      document.querySelectorAll('[data-contractlens-clause]').forEach((el) => {
        if (el.dataset.clMounted) return;
        el.dataset.clMounted = '1';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cl-sdk-btn';
        btn.textContent = '✨ Understand This with ContractLens AI';
        const out = document.createElement('div');
        btn.addEventListener('click', () => explainText(el.innerText || el.textContent, out));
        el.insertAdjacentElement('afterend', out);
        el.insertAdjacentElement('afterend', btn);
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.ContractLensSDK.mount());
  } else {
    window.ContractLensSDK.mount();
  }
})();
