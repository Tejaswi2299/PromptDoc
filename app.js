/* ============================================
   PROMPTDOC — APP LOGIC
   Calls Anthropic API directly from the browser
   ============================================ */

// ——— Tab switching ———
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});

// ——— Persist API key in localStorage ———
const apikeyInput = document.getElementById('apikey');
const savedKey = localStorage.getItem('pd_apikey');
if (savedKey) apikeyInput.value = savedKey;
apikeyInput.addEventListener('change', () => {
  localStorage.setItem('pd_apikey', apikeyInput.value);
});

// ——— State ———
let lastOutput = '';

// ——— MAIN GENERATE FUNCTION ———
async function generateDocs() {
  const apiKey = document.getElementById('apikey').value.trim();
  const content = document.getElementById('input-content').value.trim();

  if (!apiKey) return showError('Please enter your Anthropic API key.');
  if (!content) return showError('Please paste some code or describe your tool.');

  const activeTab = document.querySelector('.tab.active')?.dataset.type || 'code';
  const wantReadme = document.getElementById('out-readme').checked;
  const wantApi = document.getElementById('out-api').checked;
  const wantPitch = document.getElementById('out-pitch').checked;
  const wantOnboard = document.getElementById('out-onboard').checked;

  const outputs = [];
  if (wantReadme) outputs.push('README.md (overview, installation, usage, examples)');
  if (wantApi) outputs.push('API Reference (parameters, return types, error cases)');
  if (wantPitch) outputs.push('Flash Pitch (5-bullet problem/solution/impact summary for an audience)');
  if (wantOnboard) outputs.push('Onboarding Guide (step-by-step for a new team member)');

  if (outputs.length === 0) return showError('Select at least one output format.');

  // UI loading state
  setLoading(true);
  clearOutput();
  showAgentLog();
  addLog('Analyzing your ' + activeTab + '...');

  const typeLabel = {
    code: 'code/function',
    tool: 'internal tool description',
    api: 'REST API description'
  }[activeTab];

  const systemPrompt = `You are PromptDoc, an expert technical documentation agent. You write clear, concise, developer-friendly documentation. 

You always:
- Write in markdown
- Use concrete examples
- Include edge cases and gotchas
- Keep each section focused and scannable
- Write for the actual audience (devs, teammates, not the general public)

You NEVER write generic filler. Every sentence earns its place.`;

  const userPrompt = `I have a ${typeLabel}. Generate the following documentation sections for it:

${outputs.map((o, i) => `${i + 1}. ${o}`).join('\n')}

---
${content}
---

Format each section with a clear H2 header like ## README.md, ## API Reference, etc.
Be specific and practical. Include real code examples where applicable.`;

  try {
    addLog('Sending to Claude claude-sonnet-4-20250514...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    addLog('Documentation generated successfully ✓');
    addLog(`Tokens used: ${data.usage?.input_tokens} in / ${data.usage?.output_tokens} out`);

    lastOutput = text;
    renderOutput(text);

    if (wantPitch) {
      extractAndShowPitch(text);
    }

    document.getElementById('outputTabs').style.display = 'flex';

  } catch (err) {
    addLog('Error: ' + err.message);
    showError('Generation failed: ' + err.message);
  } finally {
    setLoading(false);
  }
}

// ——— Render markdown-ish output ———
function renderOutput(text) {
  const el = document.getElementById('outputContent');
  el.innerHTML = '';

  // Simple markdown rendering
  const formatted = text
    .replace(/^## (.+)$/gm, '<div class="md-h2">$1</div>')
    .replace(/^### (.+)$/gm, '<div class="md-h3">$1</div>')
    .replace(/^# (.+)$/gm, '<div class="md-h1">$1</div>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>')
    .replace(/^\| (.+)$/gm, (m) => {
      if (m.includes('---')) return '';
      const cells = m.split('|').filter(c => c.trim());
      return '<div class="md-table-row">' + cells.map(c => `<span>${c.trim()}</span>`).join('') + '</div>';
    })
    .replace(/^- (.+)$/gm, '<div class="md-li">• $1</div>')
    .replace(/\n\n/g, '<div class="md-spacer"></div>')
    .replace(/\n/g, '<br>');

  el.innerHTML = `<style>
    .md-h1 { font-size:1.3rem; font-weight:800; color:var(--text); margin:1rem 0 0.4rem; font-family:var(--font-display); }
    .md-h2 { font-size:1.1rem; font-weight:700; color:var(--accent); margin:1.2rem 0 0.4rem; border-bottom:1px solid var(--border); padding-bottom:0.3rem; font-family:var(--font-display); }
    .md-h3 { font-size:0.95rem; font-weight:600; color:var(--text); margin:0.8rem 0 0.3rem; font-family:var(--font-display); }
    .md-li { color:var(--muted); margin:0.2rem 0; }
    .md-spacer { height:0.8rem; }
    .inline-code { background:var(--surface2); border:1px solid var(--border); border-radius:4px; padding:0.1rem 0.4rem; font-size:0.8rem; color:#79c0ff; }
    .code-block { background:var(--surface2); border:1px solid var(--border); border-radius:8px; padding:1rem; margin:0.5rem 0; overflow-x:auto; white-space:pre; color:#c9d1d9; line-height:1.6; }
    .md-table-row { display:flex; gap:1rem; border-bottom:1px solid var(--border); padding:0.3rem 0; color:var(--muted); font-size:0.8rem; }
    .md-table-row:first-of-type { color:var(--text); font-weight:600; }
  </style>` + formatted;
}

// ——— Extract pitch for modal ———
function extractAndShowPitch(text) {
  const pitchMatch = text.match(/## Flash Pitch[\s\S]*?(?=## |$)/i);
  if (!pitchMatch) return;

  const pitchText = pitchMatch[0];
  const modal = document.getElementById('pitchModal');
  const content = document.getElementById('pitchContent');

  content.innerHTML = `
    <div style="text-align:center; margin-bottom:2rem;">
      <div style="font-family:var(--font-mono); font-size:0.7rem; letter-spacing:3px; color:var(--accent); margin-bottom:0.5rem;">FLASH PITCH</div>
      <h2 style="font-size:2rem; letter-spacing:-1px;">Your 60-Second Pitch</h2>
    </div>
    <div style="font-family:var(--font-mono); font-size:0.9rem; line-height:1.9; color:var(--muted); white-space:pre-wrap;">${pitchText.replace(/## Flash Pitch\n?/i, '')}</div>
    <div style="margin-top:2rem; text-align:center;">
      <button onclick="closePitch()" style="background:var(--accent); color:#000; border:none; border-radius:8px; padding:0.8rem 2rem; font-weight:700; cursor:pointer; font-family:var(--font-display); font-size:1rem;">Got it! 🎤</button>
    </div>`;

  modal.style.display = 'flex';
}

function closePitch() {
  document.getElementById('pitchModal').style.display = 'none';
}

// ——— Copy & Download ———
function copyOutput() {
  if (!lastOutput) return;
  navigator.clipboard.writeText(lastOutput).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = '✓';
    setTimeout(() => btn.textContent = '📋', 1500);
  });
}

function downloadOutput() {
  if (!lastOutput) return;
  const blob = new Blob([lastOutput], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'documentation.md';
  a.click();
  URL.revokeObjectURL(url);
}

// ——— UI Helpers ———
function setLoading(loading) {
  const btn = document.getElementById('generateBtn');
  const text = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loading');
  btn.disabled = loading;
  text.style.display = loading ? 'none' : 'inline';
  loader.style.display = loading ? 'inline' : 'none';
}

function clearOutput() {
  const el = document.getElementById('outputContent');
  el.innerHTML = '<div class="output-placeholder"><div class="placeholder-icon">⚙️</div><p class="streaming">Generating...</p></div>';
}

function showAgentLog() {
  const log = document.getElementById('agentLog');
  const content = document.getElementById('logContent');
  log.style.display = 'block';
  content.innerHTML = '';
}

function addLog(msg) {
  const content = document.getElementById('logContent');
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = msg;
  content.appendChild(entry);
  content.scrollTop = content.scrollHeight;
}

function showError(msg) {
  const el = document.getElementById('outputContent');
  el.innerHTML = `<div class="output-placeholder" style="color:var(--warn)"><div class="placeholder-icon">⚠️</div><p>${msg}</p></div>`;
  setLoading(false);
}

// ——— Output tab switching ———
document.querySelectorAll('.out-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.out-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const section = tab.dataset.section;
    if (section === 'all' || !lastOutput) {
      renderOutput(lastOutput);
    } else {
      const regex = new RegExp(`## ${section}[\\s\\S]*?(?=## |$)`, 'i');
      const match = lastOutput.match(regex);
      renderOutput(match ? match[0] : '*Section not found.*');
    }
  });
});
