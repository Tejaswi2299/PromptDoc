// PromptDoc frontend logic

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});

const apikeyInput = document.getElementById('apikey');
const savedKey = localStorage.getItem('pd_apikey');
if (savedKey) apikeyInput.value = savedKey;
apikeyInput.addEventListener('change', () => {
  localStorage.setItem('pd_apikey', apikeyInput.value);
});

let lastOutput = '';

async function generateDocs() {
  const apiKey = document.getElementById('apikey').value.trim();
  const content = document.getElementById('input-content').value.trim();

  if (!apiKey) return showError('Please enter your Anthropic API key.');
  if (!content) return showError('Please paste code or a tool description.');

  const activeTab = document.querySelector('.tab.active')?.dataset.type || 'code';
  const wantReadme = document.getElementById('out-readme').checked;
  const wantApi = document.getElementById('out-api').checked;

  const outputs = [];
  if (wantReadme) outputs.push('README.md (overview, setup, usage, examples)');
  if (wantApi) outputs.push('API Reference (inputs, outputs, error cases)');
  if (!outputs.length) return showError('Select at least one output format.');

  setLoading(true);
  clearOutput();
  showAgentLog();
  addLog(`Analyzing ${activeTab} input...`);

  const systemPrompt = `You are PromptDoc, a technical documentation assistant.
Always write concise, practical markdown suitable for GitHub repos.
Use examples and highlight edge cases. Avoid marketing language.`;

  const userPrompt = `Generate these sections:\n${outputs.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\nInput:\n${content}`;

  try {
    addLog('Calling Claude Sonnet...');

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
        max_tokens: 3500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    lastOutput = text;
    renderOutput(text);
    document.getElementById('outputTabs').style.display = 'flex';

    addLog('Done.');
    addLog(`Tokens: in ${data.usage?.input_tokens} / out ${data.usage?.output_tokens}`);
  } catch (err) {
    addLog('Error: ' + err.message);
    showError('Generation failed: ' + err.message);
  } finally {
    setLoading(false);
  }
}

function renderOutput(text) {
  const el = document.getElementById('outputContent');
  el.innerHTML = '';

  const formatted = text
    .replace(/^## (.+)$/gm, '<div class="md-h2">$1</div>')
    .replace(/^### (.+)$/gm, '<div class="md-h3">$1</div>')
    .replace(/^# (.+)$/gm, '<div class="md-h1">$1</div>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>')
    .replace(/^- (.+)$/gm, '<div class="md-li">• $1</div>')
    .replace(/\n\n/g, '<div class="md-spacer"></div>')
    .replace(/\n/g, '<br>');

  el.innerHTML = formatted;
}

function copyOutput() {
  if (!lastOutput) return;
  navigator.clipboard.writeText(lastOutput).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = 'Copied';
    setTimeout(() => (btn.textContent = 'Copy'), 1200);
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

function setLoading(loading) {
  const btn = document.getElementById('generateBtn');
  const text = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loading');
  btn.disabled = loading;
  text.style.display = loading ? 'none' : 'inline';
  loader.style.display = loading ? 'inline' : 'none';
}

function clearOutput() {
  document.getElementById('outputContent').innerHTML = '<div class="output-placeholder"><div class="placeholder-icon">⚙️</div><p>Generating...</p></div>';
}

function showAgentLog() {
  const log = document.getElementById('agentLog');
  document.getElementById('logContent').innerHTML = '';
  log.style.display = 'block';
}

function addLog(msg) {
  const content = document.getElementById('logContent');
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = msg;
  content.appendChild(entry);
}

function showError(msg) {
  document.getElementById('outputContent').innerHTML = `<div class="output-placeholder" style="color:var(--warn)"><div class="placeholder-icon">⚠️</div><p>${msg}</p></div>`;
  setLoading(false);
}

document.querySelectorAll('.out-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.out-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const section = tab.dataset.section;
    if (section === 'all' || !lastOutput) return renderOutput(lastOutput);
    const regex = new RegExp(`## ${section}[\\s\\S]*?(?=## |$)`, 'i');
    const match = lastOutput.match(regex);
    renderOutput(match ? match[0] : '*Section not found.*');
  });
});
