#!/usr/bin/env node

const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3333;
const CHOICE_FILE = '/tmp/brain-canvas-choice.json';

let version = Date.now();
let canvas = {
  type: 'welcome',
  title: 'brain-canvas',
  subtitle: 'Give any LLM its own display',
  sections: [
    { type: 'text', text: 'Waiting for content...' },
    { type: 'text', text: 'POST to /update with JSON to render anything.' }
  ]
};

const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #0d1117; color: #e6edf3; padding: 32px; min-height: 100vh; }
.container { max-width: 800px; margin: 0 auto; }
.header { text-align: center; padding: 32px; background: #161b22; border-radius: 16px; border: 1px solid #30363d; margin-bottom: 32px; }
.query { font-size: 12px; color: #3fb950; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
.title { font-size: 36px; font-weight: 700; background: linear-gradient(135deg, #58a6ff, #3fb950); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
.subtitle { color: #8b949e; }
.content { display: flex; flex-direction: column; gap: 20px; }
.section { background: #161b22; border-radius: 12px; padding: 20px; border: 1px solid #30363d; }
.section-header { font-size: 20px; font-weight: 600; color: #e6edf3; margin-bottom: 8px; }
.text { color: #8b949e; line-height: 1.6; }
.quote { border-left: 3px solid #58a6ff; padding-left: 16px; font-style: italic; color: #e6edf3; font-size: 18px; }
.quote-date { font-size: 11px; color: #3fb950; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
.insight { background: linear-gradient(135deg, #238636 0%, #1f6feb 100%); padding: 20px; border-radius: 12px; border: none; }
.insight-label { font-size: 11px; font-weight: 700; letter-spacing: 2px; margin-bottom: 8px; opacity: 0.8; }
.insight-text { font-size: 16px; color: #fff; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; background: none; border: none; padding: 0; }
.stat { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 20px; text-align: center; }
.stat-value { font-size: 32px; font-weight: 700; color: #58a6ff; }
.stat-label { font-size: 11px; color: #8b949e; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
.timeline { border-left: 2px solid #30363d; padding-left: 20px; margin-left: 8px; }
.timeline-item { position: relative; padding-bottom: 20px; }
.timeline-item:before { content: ''; position: absolute; left: -26px; top: 4px; width: 10px; height: 10px; background: #58a6ff; border-radius: 50%; }
.timeline-date { font-size: 12px; color: #3fb950; margin-bottom: 4px; }
.timeline-text { color: #e6edf3; }
.comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: none; border: none; padding: 0; }
.compare-col { background: #161b22; border-radius: 12px; padding: 16px; }
.compare-col.old { border: 1px solid #f85149; }
.compare-col.new { border: 1px solid #3fb950; }
.compare-header { font-size: 11px; font-weight: 700; letter-spacing: 2px; margin-bottom: 12px; }
.compare-col.old .compare-header { color: #f85149; }
.compare-col.new .compare-header { color: #3fb950; }
.compare-item { padding: 8px 0; border-bottom: 1px solid #30363d; color: #8b949e; font-size: 14px; }
.compare-item:last-child { border-bottom: none; }
.choices { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; background: none; border: none; padding: 0; }
.choice { background: #21262d; border: 2px solid #30363d; border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s; text-align: left; color: #e6edf3; font-family: inherit; }
.choice:hover { border-color: #58a6ff; transform: translateY(-2px); }
.choice.green:hover { border-color: #3fb950; }
.choice.yellow:hover { border-color: #d29922; }
.choice.red:hover { border-color: #f85149; }
.choice-key { display: inline-block; width: 24px; height: 24px; background: #30363d; border-radius: 6px; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700; color: #58a6ff; margin-bottom: 8px; }
.choice.green .choice-key { color: #3fb950; }
.choice.yellow .choice-key { color: #d29922; }
.choice.red .choice-key { color: #f85149; }
.choice-label { font-weight: 600; margin-bottom: 4px; }
.choice-desc { font-size: 13px; color: #8b949e; }
.toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(100px); background: #3fb950; color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 600; opacity: 0; transition: all 0.3s; }
.toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
.divider { height: 1px; background: #30363d; margin: 8px 0; }
.principle { background: linear-gradient(135deg, #9e6a03 0%, #b62324 100%); border: none; }
.principle-name { font-size: 11px; font-weight: 700; letter-spacing: 2px; margin-bottom: 8px; color: #ffd93d; }
.principle-text { color: #fff; }
`;

function renderSection(s, i) {
  switch (s.type) {
    case 'text': return `<div class="section"><div class="text">${s.text}</div></div>`;
    case 'header': return `<div class="section-header">${s.text}</div>`;
    case 'quote': return `<div class="section quote-section"><div class="quote-date">${s.date || ''}</div><div class="quote">"${s.text}"</div></div>`;
    case 'insight': return `<div class="section insight"><div class="insight-label">${s.label || 'INSIGHT'}</div><div class="insight-text">${s.text}</div></div>`;
    case 'principle': return `<div class="section principle"><div class="principle-name">${s.name || ''}</div><div class="principle-text">${s.text}</div></div>`;
    case 'stats': return `<div class="stats">${(s.items||[]).map(x => `<div class="stat"><div class="stat-value">${x.value}</div><div class="stat-label">${x.label}</div></div>`).join('')}</div>`;
    case 'timeline': return `<div class="section"><div class="section-header">${s.title || 'Timeline'}</div><div class="timeline">${(s.items||[]).map(x => `<div class="timeline-item"><div class="timeline-date">${x.date}</div><div class="timeline-text">${x.text}</div></div>`).join('')}</div></div>`;
    case 'comparison': return `<div class="comparison"><div class="compare-col old"><div class="compare-header">OLD WAY</div>${(s.old||[]).map(x => `<div class="compare-item">${x}</div>`).join('')}</div><div class="compare-col new"><div class="compare-header">NEW WAY</div>${(s.new||[]).map(x => `<div class="compare-item">${x}</div>`).join('')}</div></div>`;
    case 'choices': return `<div class="choices">${(s.items||[]).map((x,j) => `<button class="choice ${x.color||''}" onclick="pick('${x.id||j}','${(x.label||'').replace(/'/g,"\\'")}')"><div class="choice-key">${j+1}</div><div class="choice-label">${x.label}</div><div class="choice-desc">${x.desc||''}</div></button>`).join('')}</div>`;
    case 'divider': return `<div class="divider"></div>`;
    default: return '';
  }
}

function render() {
  const sections = (canvas.sections || []).map(renderSection).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>brain-canvas</title><style>${CSS}</style></head><body>
<div class="container">
  <div class="header">
    <div class="query">${canvas.query || ''}</div>
    <div class="title">${canvas.title || 'brain-canvas'}</div>
    <div class="subtitle">${canvas.subtitle || ''}</div>
  </div>
  <div class="content">${sections}</div>
</div>
<div id="toast" class="toast"></div>
<script>
let v = ${version};
async function pick(id, label) {
  await fetch('/choice', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id,label,t:Date.now()}) });
  const t = document.getElementById('toast');
  t.textContent = '✓ ' + label;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}
document.addEventListener('keydown', e => {
  if (e.key >= '1' && e.key <= '9') {
    const b = document.querySelectorAll('.choice');
    if (b[e.key-1]) b[e.key-1].click();
  }
});
setInterval(async () => {
  try {
    const r = await fetch('/v');
    const d = await r.json();
    if (d.v !== v) location.reload();
  } catch {}
}, 500);
</script></body></html>`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/v') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ v: version }));
  }

  if (url.pathname === '/update' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        canvas = data.config || data;
        version = Date.now();
        if (fs.existsSync(CHOICE_FILE)) fs.unlinkSync(CHOICE_FILE);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      } catch (e) {
        res.writeHead(400);
        res.end('{"error":"Invalid JSON"}');
      }
    });
    return;
  }

  if (url.pathname === '/choice' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      fs.writeFileSync(CHOICE_FILE, body);
      // Print to stdout so terminal sees it
      console.log('\n  [CHOICE]', body, '\n');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }

  if (url.pathname === '/choice' && req.method === 'GET') {
    if (fs.existsSync(CHOICE_FILE)) {
      const choice = fs.readFileSync(CHOICE_FILE, 'utf-8');
      fs.unlinkSync(CHOICE_FILE);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(choice);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end('{"pending":true}');
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(render());
});

server.listen(PORT, () => {
  console.log(`\n  brain-canvas running at http://localhost:${PORT}\n`);
  console.log('  POST /update with JSON to render content');
  console.log('  GET /choice to receive user selections\n');

  // Auto-open browser
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${cmd} http://localhost:${PORT}`);
});
