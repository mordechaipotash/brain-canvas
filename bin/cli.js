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
/* shadcn-inspired design tokens */
:root {
  --background: #09090b;
  --foreground: #fafafa;
  --card: #09090b;
  --card-foreground: #fafafa;
  --muted: #27272a;
  --muted-foreground: #a1a1aa;
  --border: #27272a;
  --ring: #d4d4d8;
  --radius: 0.5rem;
  --primary: #fafafa;
  --primary-foreground: #18181b;
  --secondary: #27272a;
  --accent: #27272a;
  --destructive: #ef4444;
  --success: #22c55e;
  --warning: #eab308;
  --info: #3b82f6;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--background);
  color: var(--foreground);
  padding: 24px;
  min-height: 100vh;
  font-feature-settings: "rlig" 1, "calt" 1;
  -webkit-font-smoothing: antialiased;
}
.container { max-width: 720px; margin: 0 auto; }
.header {
  text-align: center;
  padding: 32px 24px;
  background: var(--card);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  margin-bottom: 24px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}
.query { font-size: 11px; color: var(--success); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; font-weight: 500; }
.title { font-size: 30px; font-weight: 600; letter-spacing: -0.025em; color: var(--foreground); margin-bottom: 4px; }
.subtitle { color: var(--muted-foreground); font-size: 14px; }
.content { display: flex; flex-direction: column; gap: 16px; }
.section {
  background: var(--card);
  border-radius: var(--radius);
  padding: 16px;
  border: 1px solid var(--border);
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}
.section-header { font-size: 16px; font-weight: 600; color: var(--foreground); margin-bottom: 8px; letter-spacing: -0.01em; }
.text { color: var(--muted-foreground); line-height: 1.625; font-size: 14px; }
.quote { border-left: 2px solid var(--info); padding-left: 16px; font-style: italic; color: var(--foreground); font-size: 15px; line-height: 1.7; }
.quote-date { font-size: 11px; color: var(--muted-foreground); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px; font-weight: 500; }
.insight {
  background: linear-gradient(135deg, hsl(142 76% 36%) 0%, hsl(217 91% 60%) 100%);
  padding: 16px;
  border-radius: var(--radius);
  border: none;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}
.insight-label { font-size: 10px; font-weight: 600; letter-spacing: 1.5px; margin-bottom: 6px; opacity: 0.9; text-transform: uppercase; }
.insight-text { font-size: 14px; color: #fff; font-weight: 500; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 12px; background: none; border: none; padding: 0; }
.stat {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 12px;
  text-align: center;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  transition: border-color 0.15s ease;
}
.stat:hover { border-color: var(--ring); }
.stat-value { font-size: 28px; font-weight: 700; color: var(--foreground); letter-spacing: -0.025em; }
.stat-label { font-size: 10px; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; font-weight: 500; }
.timeline { border-left: 2px solid var(--border); padding-left: 16px; margin-left: 4px; }
.timeline-item { position: relative; padding-bottom: 16px; }
.timeline-item:last-child { padding-bottom: 0; }
.timeline-item:before { content: ''; position: absolute; left: -21px; top: 6px; width: 8px; height: 8px; background: var(--info); border-radius: 50%; box-shadow: 0 0 0 3px var(--background); }
.timeline-date { font-size: 11px; color: var(--success); margin-bottom: 2px; font-weight: 500; }
.timeline-text { color: var(--foreground); font-size: 14px; }
.comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: none; border: none; padding: 0; }
.compare-col { background: var(--card); border-radius: var(--radius); padding: 14px; }
.compare-col.old { border: 1px solid var(--destructive); }
.compare-col.new { border: 1px solid var(--success); }
.compare-header { font-size: 10px; font-weight: 600; letter-spacing: 1px; margin-bottom: 10px; text-transform: uppercase; }
.compare-col.old .compare-header { color: var(--destructive); }
.compare-col.new .compare-header { color: var(--success); }
.compare-item { padding: 6px 0; border-bottom: 1px solid var(--border); color: var(--muted-foreground); font-size: 13px; }
.compare-item:last-child { border-bottom: none; }
.choices { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; background: none; border: none; padding: 0; }
.choice {
  background: var(--secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  color: var(--foreground);
  font-family: inherit;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}
.choice:hover { background: var(--accent); border-color: var(--ring); transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
.choice:active { transform: translateY(0); }
.choice.green:hover { border-color: var(--success); }
.choice.yellow:hover { border-color: var(--warning); }
.choice.red:hover { border-color: var(--destructive); }
.choice.blue:hover { border-color: var(--info); }
.choice-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: var(--muted);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted-foreground);
  margin-bottom: 8px;
}
.choice.green .choice-key { color: var(--success); }
.choice.yellow .choice-key { color: var(--warning); }
.choice.red .choice-key { color: var(--destructive); }
.choice.blue .choice-key { color: var(--info); }
.choice-label { font-weight: 500; margin-bottom: 2px; font-size: 14px; }
.choice-desc { font-size: 12px; color: var(--muted-foreground); line-height: 1.4; }
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: var(--foreground);
  color: var(--background);
  padding: 10px 20px;
  border-radius: var(--radius);
  font-weight: 500;
  font-size: 14px;
  opacity: 0;
  transition: all 0.2s ease;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
.toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
.divider { height: 1px; background: var(--border); margin: 4px 0; }
.principle {
  background: linear-gradient(135deg, hsl(45 93% 47%) 0%, hsl(0 84% 60%) 100%);
  border: none;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
.principle-name { font-size: 10px; font-weight: 600; letter-spacing: 1.5px; margin-bottom: 6px; color: rgba(255,255,255,0.9); text-transform: uppercase; }
.principle-text { color: #fff; font-size: 14px; font-weight: 500; }
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
