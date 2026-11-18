// Idea 2 — Real Chrome/Edge Content Script: Floating "Explain this / Check risks" on any webpage!
(function () {
  const API = 'http://127.0.0.1:3000/api/explain';
  let bar = null;
  let panel = null;

  function removeUi() {
    if (bar) { bar.remove(); bar = null; }
  }

  function showPanel(data) {
    if (!panel) {
      panel = document.createElement('div');
      panel.style.cssText = 'position:fixed;top:16px;right:16px;width:360px;max-height:80vh;overflow:auto;z-index:2147483647;background:#fff;color:#0f172a;border:2px solid #4f46e5;border-radius:14px;padding:16px;font:13.5px/1.5 system-ui,sans-serif;box-shadow:0 20px 45px rgba(15,23,42,0.22);';
      document.body.appendChild(panel);
    }
    const badgeColor = data.trafficLight === 'red' ? '#dc2626' : data.trafficLight === 'yellow' ? '#d97706' : '#059669';
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <strong style="color:#4f46e5;">ContractLens — Browser Assistant</strong>
        <button id="cl-ext-close" style="border:none;background:none;font-size:18px;cursor:pointer;">&times;</button>
      </div>
      <div style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;color:#fff;background:${badgeColor};margin-bottom:8px;">${data.trafficLight.toUpperCase()} RISK · ${data.label}</div>
      <p style="margin:6px 0;"><strong>AI Explanation:</strong> ${data.simpleMeaning}</p>
      <p style="margin:6px 0;"><strong>Why you should check:</strong> ${data.whyYouShouldCheck}</p>
      <p style="margin:6px 0;"><strong>What is unclear:</strong> ${data.whatIsUnclear}</p>
      <div style="background:#f8fafc;border-radius:8px;padding:8px;margin-top:8px;">
        <strong>Ask before agreeing:</strong>
        <ul style="margin:4px 0 0 16px;padding:0;">${(data.askBeforeAgreeing || []).map((q) => `<li>${q}</li>`).join('')}</ul>
      </div>`;
    panel.querySelector('#cl-ext-close').onclick = () => { panel.remove(); panel = null; };
  }

  document.addEventListener('mouseup', (e) => {
    const sel = window.getSelection()?.toString().trim() || '';
    if (sel.length < 20) { removeUi(); return; }
    removeUi();
    bar = document.createElement('div');
    bar.style.cssText = `position:fixed;top:${Math.max(10, e.clientY - 46)}px;left:${Math.max(10, e.clientX - 60)}px;z-index:2147483647;display:flex;gap:6px;background:#0f172a;padding:6px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,0.25);`;
    bar.innerHTML = `
      <button id="cl-btn-exp" style="border:none;background:#4f46e5;color:#fff;padding:5px 11px;border-radius:999px;font:600 12px system-ui;cursor:pointer;">✨ Explain this</button>
      <button id="cl-btn-risk" style="border:none;background:#dc2626;color:#fff;padding:5px 11px;border-radius:999px;font:600 12px system-ui;cursor:pointer;">Check risks</button>
    `;
    document.body.appendChild(bar);
    const run = async () => {
      removeUi();
      const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: sel, contextMode: 'extension' }) });
      const { explanation } = await res.json();
      showPanel(explanation);
    };
    bar.querySelector('#cl-btn-exp').onclick = run;
    bar.querySelector('#cl-btn-risk').onclick = run;
  });
})();
