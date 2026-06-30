const fs = require('fs');
const path = require('path');

const BASE_DIR = path.dirname(__filename);

const JS_FILES = [
  'core/js/state.js',
  'core/js/components/disease-switcher.js',
  'core/js/charts.js',
  'core/js/module-loader.js',
  'core/js/version-manager.js',
  'core/js/app.js'
];

const MODULE_DIRS = [
  'modules',
  'modules/data-center',
  'modules/knowledge',
  'modules/records',
  'modules/pathways',
  'modules/quality',
  'modules/research',
  'modules/ai',
  'modules/patients'
];

function readFile(filePath) {
  return fs.readFileSync(path.join(BASE_DIR, filePath), 'utf-8');
}

function escapeJsString(str) {
  return str.replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

function collectModules() {
  const modules = {};
  const moduleScripts = {};
  MODULE_DIRS.forEach(dir => {
    const fullDir = path.join(BASE_DIR, dir);
    if (!fs.existsSync(fullDir)) return;
    const files = fs.readdirSync(fullDir);
    files.forEach(file => {
      if (file.endsWith('.html')) {
        const filePath = path.join(dir, file).replace(/\\/g, '/');
        let content = readFile(path.join(dir, file));
        content = content.replace(/\r\n/g, '\n');
        const scriptMatches = content.match(/<script>([\s\S]*?)<\/script>/g);
        if (scriptMatches) {
          moduleScripts[filePath] = scriptMatches.map(s => s.replace(/<\/?script>/g, ''));
          content = content.replace(/<script>[\s\S]*?<\/script>/g, '');
        }
        modules[filePath] = content;
      }
    });
  });
  return { modules, moduleScripts };
}

function build() {
  console.log('开始构建独立HTML文件...');
  
  const cssContent = readFile('core/css/main.css');
  const { modules, moduleScripts } = collectModules();
  const menuConfig = JSON.parse(readFile('core/data/menu-config.json'));
  const diseasesData = JSON.parse(readFile('core/data/diseases-data.json'));
  
  console.log(`已收集 ${Object.keys(modules).length} 个模块文件`);
  
  let jsContent = '';
  JS_FILES.forEach(file => {
    console.log(`读取 ${file}...`);
    jsContent += readFile(file) + '\n';
  });
  
  const moduleRegistry = JSON.stringify(modules, null, 2);
  const scriptsRegistry = JSON.stringify(moduleScripts, null, 2);
  
  const patchedModuleLoader = `
const __MODULES__ = ${moduleRegistry};
const __MODULE_SCRIPTS__ = ${scriptsRegistry};

ModuleLoader._fetch = function(path) {
  return Promise.resolve(__MODULES__[path] || '<div style="padding:40px;text-align:center;color:var(--danger);">模块加载失败: ' + path + '</div>');
};

ModuleLoader._inject = function(html, pageId) {
  this.container.classList.remove('module-enter');
  void this.container.offsetWidth;

  this.container.innerHTML = '<div class="module-loaded">' + html + '</div>';
  this.container.classList.add('module-enter');

  AppState.set('currentPage', pageId);
  AppState.set('currentModule', pageId);

  if (__MODULE_SCRIPTS__[this._resolvePath(pageId)]) {
    __MODULE_SCRIPTS__[this._resolvePath(pageId)].forEach(scriptCode => {
      const script = document.createElement('script');
      script.textContent = scriptCode;
      document.head.appendChild(script);
    });
  }

  this._updateBreadcrumb(pageId);

  const event = new CustomEvent('module:loaded', { detail: { pageId } });
  document.dispatchEvent(event);

  if (typeof DiseaseModule !== 'undefined' && pageId === 'diseases') {
    DiseaseModule.render();
  }
};

App.renderMenu = function() {
  const menuContainer = document.getElementById('sidebarNav');
  if (!menuContainer) return;
  this._buildMenu(menuContainer, ${JSON.stringify(menuConfig.groups)});
};
`;
  
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>专科一体化管理平台</title>
  <style>${cssContent}</style>
</head>
<body>
  <div class="app">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">S</div>
        <div class="sidebar-title">专科一体化管理平台</div>
      </div>
      <nav class="sidebar-nav" id="sidebarNav"></nav>
      <div class="sidebar-footer">
        <div class="version-badge" id="versionBadge" title="版本管理">
          <span>&#x2734;</span>
          <span id="versionBadgeText">v1.0.0</span>
        </div>
      </div>
    </aside>

    <main class="main">
      <div class="header">
        <button class="header-toggle" id="sidebarToggle" title="切换侧边栏">&#9776;</button>
        <div class="disease-switcher" id="diseaseSwitcher"></div>
        <div class="header-search">
          <input type="text" placeholder="搜索...">
        </div>
        <div class="header-actions">
          <button class="header-btn" title="通知">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg><span class="dot"></span>
          </button>
          <button class="header-btn" title="消息">&#9993;</button>
          <div class="header-avatar" title="用户中心">L</div>
        </div>
      </div>
      <div id="module-container">
        <div class="module-loading">
          <div class="spinner"></div>
          <span style="font-size:13px;color:var(--gray-500);">正在加载模块...</span>
        </div>
      </div>
    </main>
  </div>

  <div class="version-panel" id="versionPanel">
    <div class="version-panel-header">
      <h3 style="font-size:16px;font-weight:600;color:var(--gray-900);">版本管理</h3>
      <button class="modal-close" id="versionPanelClose">&times;</button>
    </div>
    <div class="version-panel-body" id="versionPanelBody">
      <div style="text-align:center;padding:32px;color:var(--gray-400);font-size:13px;">暂无版本记录</div>
    </div>
  </div>

  <div class="modal-overlay version-modal" id="versionModal">
    <div class="modal">
      <div class="modal-header">
        <h3>版本详情</h3>
        <button class="modal-close" id="versionModalClose">&times;</button>
      </div>
      <div class="modal-body" id="versionModalBody"></div>
      <div class="modal-footer">
        <button class="btn btn-outline" id="versionModalCancel">关闭</button>
        <button class="btn btn-primary" id="versionModalConfirm">确认切换</button>
      </div>
    </div>
  </div>

  <div class="toast-container" id="toastContainer"></div>

  <script>${jsContent}</script>
  <script>${patchedModuleLoader}</script>
  <script>
    document.addEventListener('DOMContentLoaded', () => App.init());
  </script>
</body>
</html>`;
  
  const outputPath = path.join(BASE_DIR, '专科一体化管理平台-standalone.html');
  fs.writeFileSync(outputPath, html);
  
  console.log(`\n构建完成！独立HTML文件已生成:`);
  console.log(`  ${outputPath}`);
  console.log(`\n文件大小: ${(html.length / 1024 / 1024).toFixed(2)} MB`);
}

build();