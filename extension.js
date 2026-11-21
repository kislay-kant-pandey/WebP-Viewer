const vscode = require('vscode');
const path = require('path');

class WebpProvider {
  constructor(context) { this.context = context; }

  openCustomDocument(uri) { return { uri, dispose() {} }; }

  async resolveCustomEditor(document, panel) {
    const dir = vscode.Uri.file(path.dirname(document.uri.fsPath));
    panel.webview.options = { enableScripts: true, localResourceRoots: [dir] };
    const src = panel.webview.asWebviewUri(document.uri);
    let size = '';
    try {
      const stat = await vscode.workspace.fs.stat(document.uri);
      size = (stat.size / 1024).toFixed(1) + ' KB';
    } catch {}
    const csp = panel.webview.cspSource;
    panel.webview.html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${csp} data:; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<style>
  body{margin:0;height:100vh;display:flex;flex-direction:column;background:var(--vscode-editor-background);color:var(--vscode-foreground);font-family:var(--vscode-font-family)}
  #bar{padding:6px 10px;font-size:12px;opacity:.8;border-bottom:1px solid var(--vscode-panel-border)}
  #wrap{flex:1;overflow:auto;display:flex;align-items:center;justify-content:center;
    background-image:linear-gradient(45deg,#8883 25%,transparent 25%,transparent 75%,#8883 75%),linear-gradient(45deg,#8883 25%,transparent 25%,transparent 75%,#8883 75%);
    background-size:16px 16px;background-position:0 0,8px 8px}
  img{image-rendering:auto;cursor:zoom-in;max-width:100%;max-height:100%}
  img.full{max-width:none;max-height:none;cursor:zoom-out}
</style></head><body>
<div id="bar">Loading…</div>
<div id="wrap"><img id="img" src="${src}"></div>
<script>
  const img = document.getElementById('img'), bar = document.getElementById('bar');
  let zoom = 1;
  function upd(){ img.style.width = img.classList.contains('full') ? (img.naturalWidth*zoom)+'px' : '';
    bar.textContent = img.naturalWidth+' × '+img.naturalHeight+' px  ·  ${size}  ·  '+(img.classList.contains('full')?Math.round(zoom*100)+'%':'Fit')+'  ·  Click: fit/100%, Ctrl+Scroll: zoom'; }
  img.onload = upd;
  img.onerror = () => bar.textContent = 'Image load nahi ho payi.';
  img.onclick = () => { img.classList.toggle('full'); zoom = 1; upd(); };
  window.addEventListener('wheel', e => { if(!e.ctrlKey) return; e.preventDefault();
    img.classList.add('full'); zoom = Math.min(20, Math.max(0.05, zoom * (e.deltaY < 0 ? 1.1 : 0.9))); upd(); }, {passive:false});
</script></body></html>`;
  }
}

function activate(context) {
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider('webpViewer.preview', new WebpProvider(context),
      { supportsMultipleEditorsPerDocument: true })
  );
}
function deactivate() {}
module.exports = { activate, deactivate };
