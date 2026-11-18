document.getElementById('scanPageBtn').addEventListener('click', async () => {
  const out = document.getElementById('out');
  out.textContent = 'Scanning page text with ContractLens AI...';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const [{ result: pageText }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText.slice(0, 8000)
    });
    const res = await fetch('http://127.0.0.1:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: tab.title || 'Webpage Terms', text: pageText })
    });
    const { analysis } = await res.json();
    out.innerHTML = `<strong>Score: ${analysis.safetyScore}/100 (${analysis.grade})</strong><br/>🔴 ${analysis.trafficLightCounts.red} Red · 🟡 ${analysis.trafficLightCounts.yellow} Yellow clauses found.<br/><a href="http://127.0.0.1:3000" target="_blank" style="color:#4f46e5;font-weight:700;">Open Full Report in ContractLens →</a>`;
  } catch (err) {
    out.textContent = 'Ensure ContractLens server is running at http://127.0.0.1:3000 (' + err.message + ')';
  }
});
