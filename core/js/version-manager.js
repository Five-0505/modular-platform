/**
 * Version Manager
 * 版本管理器，支持版本跟踪、保存与回滚
 */
const VersionManager = {
  STORAGE_KEY: 'platform_versions',
  CURRENT_VERSION: '2.0.0',

  /**
   * 初始化版本管理器
   */
  init() {
    this._ensureStorage();
    this._renderPanel();
  },

  /**
   * 确保 localStorage 中有初始版本数据
   */
  _ensureStorage() {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      const initial = {
        currentVersion: this.CURRENT_VERSION,
        versions: [{
          version: this.CURRENT_VERSION,
          timestamp: new Date().toISOString(),
          changes: ['模块化架构重构', '动态按需加载', '版本管理系统'],
          modules: this._snapshotModules(),
          isCurrent: true
        }]
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initial));
    }
  },

  /**
   * 从 localStorage 读取版本数据
   * @returns {object}
   */
  _getData() {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
  },

  /**
   * 将版本数据写入 localStorage
   * @param {object} data
   */
  _saveData(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  },

  /**
   * 对当前模块缓存做快照
   * @returns {object}
   */
  _snapshotModules() {
    const cache = AppState.get('moduleCache');
    const snapshot = {};
    cache.forEach((val, key) => {
      snapshot[key] = { size: val.html.length, timestamp: val.timestamp };
    });
    return snapshot;
  },

  /**
   * 保存当前状态为新版本
   * @param {string} [version] - 版本号，不传则自动生成
   * @param {string[]} [changes] - 变更说明列表
   * @returns {object} 新版本对象
   */
  saveVersion(version, changes) {
    const data = this._getData();
    // 标记所有旧版本为非当前
    data.versions.forEach(v => v.isCurrent = false);

    const newVersion = {
      version: version || `v${data.versions.length + 1}.0.0`,
      timestamp: new Date().toISOString(),
      changes: changes || [],
      modules: this._snapshotModules(),
      isCurrent: true
    };

    data.versions.unshift(newVersion);
    data.currentVersion = newVersion.version;
    this._saveData(data);
    this._renderPanel();
    this._showToast('success', `版本 ${newVersion.version} 已保存`);
    return newVersion;
  },

  /**
   * 回滚到指定版本
   * @param {string} version - 目标版本号
   */
  rollback(version) {
    const data = this._getData();
    const target = data.versions.find(v => v.version === version);
    if (!target) return;

    // 标记目标版本为当前
    data.versions.forEach(v => v.isCurrent = false);
    target.isCurrent = true;
    data.currentVersion = version;
    this._saveData(data);

    // 使所有缓存模块失效，强制重新加载
    ModuleLoader.invalidateAll();

    this._renderPanel();
    this._showToast('success', `已回滚到版本 ${version}`);

    // 重新加载当前页面
    const currentPage = AppState.get('currentPage');
    ModuleLoader.load(currentPage);
  },

  /**
   * 获取版本历史列表
   * @returns {Array}
   */
  getHistory() {
    return this._getData().versions || [];
  },

  /**
   * 获取当前版本号
   * @returns {string}
   */
  getCurrentVersion() {
    return this._getData().currentVersion || this.CURRENT_VERSION;
  },

  /**
   * 切换版本管理面板的显示状态
   */
  togglePanel() {
    const panel = document.getElementById('versionPanel');
    if (panel) panel.classList.toggle('open');
  },

  /**
   * 渲染版本管理面板内容
   */
  _renderPanel() {
    const panel = document.getElementById('versionPanel');
    if (!panel) return;

    const data = this._getData();
    const versions = data.versions || [];

    panel.innerHTML = `
      <div class="version-panel-header">
        <h3 style="font-size:16px;font-weight:600;">版本管理</h3>
        <button class="btn btn-sm btn-outline" onclick="VersionManager.togglePanel()">关闭</button>
      </div>
      <div class="version-panel-body">
        <div style="margin-bottom:16px;">
          <button class="btn btn-primary" onclick="VersionManager._promptSave()" style="width:100%;">
            保存当前版本
          </button>
        </div>
        <div style="font-size:12px;color:var(--gray-500);margin-bottom:12px;">
          当前版本: <strong style="color:var(--primary)">${data.currentVersion}</strong>
          &nbsp;|&nbsp; 共 ${versions.length} 个版本
        </div>
        ${versions.map(v => `
          <div class="version-item ${v.isCurrent ? 'current' : ''}">
            <div class="version-tag">${v.version} ${v.isCurrent ? '<span class="tag tag-success">当前</span>' : ''}</div>
            <div class="version-time">${new Date(v.timestamp).toLocaleString()}</div>
            <div class="version-changes">${(v.changes || []).join(', ') || '无变更说明'}</div>
            <div class="version-actions">
              ${!v.isCurrent ? `<button class="btn btn-sm btn-outline" onclick="VersionManager.rollback('${v.version}')">回滚</button>` : ''}
            </div>
          </div>
        `).join('')}
        ${versions.length === 0 ? '<div style="text-align:center;color:var(--gray-400);padding:40px;">暂无版本记录</div>' : ''}
      </div>
    `;
  },

  /**
   * 弹出输入框让用户填写版本变更说明
   */
  _promptSave() {
    const changes = prompt('请输入版本变更说明（多个变更用逗号分隔）:');
    if (changes !== null) {
      const version = `v${this._getData().versions.length + 1}.0.0`;
      this.saveVersion(version, changes.split(',').map(c => c.trim()).filter(Boolean));
    }
  },

  /**
   * 显示提示消息
   * @param {string} type - 'success' | 'error' | 'warning'
   * @param {string} message
   */
  _showToast(type, message) {
    const icons = { success: '✓', error: '×', warning: '!' };
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:9999;background:#fff;padding:12px 20px;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.15);display:flex;align-items:center;gap:10px;font-size:14px;animation:fadeInUp 0.3s ease;';
    toast.innerHTML = `<span style="color:var(--${type});font-size:18px;">${icons[type]}</span><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
};
