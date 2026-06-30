/**
 * Dynamic Module Loader
 * 模块动态加载器，支持缓存、版本检查与懒加载
 */
const ModuleLoader = {
  container: null,
  loadingIndicator: null,

  /**
   * 初始化模块加载器，获取容器DOM引用
   */
  init() {
    this.container = document.getElementById('module-container');
    this._bindDiseaseChange();
  },

  // 不受病种切换影响的模块（豁免列表）
  _diseaseExempt: new Set(['workbench', 'diseases', 'disease-detail']),

  /**
   * 监听病种切换事件，自动重载当前模块
   */
  _bindDiseaseChange() {
    document.addEventListener('disease:changed', (e) => {
      const currentPage = AppState.get('currentPage');
      if (!currentPage) return;

      // 豁免的模块不重载
      if (this._diseaseExempt.has(currentPage)) return;

      // 清除缓存并重载当前模块
      this.invalidate(currentPage);
      this.load(currentPage);
    });
  },

  /**
   * 按 pageId 加载模块
   * @param {string} pageId - 模块标识，如 'workbench' 或 'data-center/datasets'
   */
  async load(pageId) {
    if (AppState.get('currentPage') === pageId && this.container.querySelector('.module-loaded')) {
      return; // 已加载，跳过
    }

    const modulePath = this._resolvePath(pageId);

    // 检查缓存
    const cached = AppState.get('moduleCache').get(modulePath);
    if (cached && !this._isStale(modulePath, cached)) {
      this._inject(cached.html, pageId);
      return;
    }

    // 显示加载状态
    this._showLoading();

    try {
      const html = await this._fetch(modulePath);
      // 缓存模块
      AppState.get('moduleCache').set(modulePath, {
        html,
        timestamp: Date.now(),
        version: null
      });
      this._inject(html, pageId);
    } catch (err) {
      this._showError(pageId, err);
    }
  },

  /**
   * 将 pageId 解析为模块文件路径
   * @param {string} pageId
   * @returns {string}
   */
  _resolvePath(pageId) {
    const pathMap = {
      'workbench': 'modules/workbench.html',
      'diseases': 'modules/diseases.html',
      'disease-detail': 'modules/disease-detail.html',
      'data-center/datasets': 'modules/data-center/datasets.html',
      'data-center/rdr': 'modules/data-center/rdr.html',
      'data-center/metadata': 'modules/data-center/metadata.html',
      'data-center/ai': 'modules/data-center/ai-governance.html',
      'data-center/standards': 'modules/data-center/standards.html',
      'knowledge/disease': 'modules/knowledge/disease.html',
      'knowledge/graph': 'modules/knowledge/graph.html',
      'knowledge/contraindication': 'modules/knowledge/contraindication.html',
      'records/templates': 'modules/records/templates.html',
      'records/scales': 'modules/records/scales.html',
      'records/elements': 'modules/records/elements.html',
      'pathways/overview': 'modules/pathways/overview.html',
      'pathways/manage': 'modules/pathways/manage.html',
      'pathways/nodes': 'modules/pathways/nodes.html',
      'quality/rules': 'modules/quality/rules.html',
      'quality/dispatch': 'modules/quality/dispatch.html',
      'quality/dept': 'modules/quality/dept.html',
      'quality/emr': 'modules/quality/emr.html',
      'quality/disease': 'modules/quality/disease.html',
      'quality/timeliness': 'modules/quality/timeliness.html',
      'research/overview': 'modules/research/overview.html',
      'research/distribution': 'modules/research/distribution.html',
      'research/audit': 'modules/research/audit.html',
      'research/data': 'modules/research/data.html',
      'research/process': 'modules/research/process.html',
      'research/analysis': 'modules/research/analysis.html',
      'research/ai': 'modules/research/ai.html',
      'research/cohort': 'modules/research/cohort.html',
      'research/crf': 'modules/research/crf.html',
      'ai/monitor': 'modules/ai/monitor.html',
      'ai/config': 'modules/ai/config.html',
      'ai/prompt': 'modules/ai/prompt.html',
      'patients/preconsult': 'modules/patients/preconsult.html',
      'patients/records': 'modules/patients/records.html',
      'patients/followup': 'modules/patients/followup.html'
    };
    return pathMap[pageId] || `modules/${pageId}.html`;
  },

  /**
   * 获取模块HTML内容
   * @param {string} path
   * @returns {Promise<string>}
   */
  async _fetch(path) {
    const resp = await fetch(path);
    if (!resp.ok) throw new Error(`Module not found: ${path}`);
    return await resp.text();
  },

  /**
   * 将HTML注入容器并触发初始化
   * @param {string} html
   * @param {string} pageId
   */
  _inject(html, pageId) {
    // 淡出旧内容
    this.container.classList.remove('module-enter');
    void this.container.offsetWidth; // 强制重排

    this.container.innerHTML = `<div class="module-loaded">${html}</div>`;
    this.container.classList.add('module-enter');

    AppState.set('currentPage', pageId);
    AppState.set('currentModule', pageId);

    // 执行模块内联脚本
    this.container.querySelectorAll('script').forEach(old => {
      const newScript = document.createElement('script');
      newScript.textContent = old.textContent;
      old.parentNode.replaceChild(newScript, old);
    });

    // 更新面包屑
    this._updateBreadcrumb(pageId);

    // 触发模块加载完成事件
    const event = new CustomEvent('module:loaded', { detail: { pageId } });
    document.dispatchEvent(event);
  },

  /**
   * 显示加载中状态
   */
  _showLoading() {
    this.container.innerHTML = `
      <div class="module-loading">
        <div class="spinner"></div>
        <div style="color:var(--gray-500);font-size:14px;">加载模块中...</div>
      </div>`;
  },

  /**
   * 显示加载错误状态
   * @param {string} pageId
   * @param {Error} err
   */
  _showError(pageId, err) {
    this.container.innerHTML = `
      <div class="module-loading">
        <div style="font-size:48px;">!</div>
        <div style="color:var(--danger);font-size:14px;">模块加载失败: ${pageId}</div>
        <div style="color:var(--gray-500);font-size:12px;">${err.message}</div>
        <button class="btn btn-outline" onclick="ModuleLoader.load('${pageId}')" style="margin-top:12px;">重试</button>
      </div>`;
  },

  /**
   * 更新面包屑导航
   * @param {string} pageId
   */
  _updateBreadcrumb(pageId) {
    const titles = {
      'workbench': '工作台', 'diseases': '专科病种管理', 'disease-detail': '病种详情',
      'data-center/datasets': '标准数据集管理', 'data-center/rdr': 'RDR 数据仓库',
      'data-center/metadata': '元数据管理', 'data-center/ai': 'AI数据治理',
      'data-center/standards': '医疗标准字典', 'knowledge/disease': '疾病知识管理',
      'knowledge/graph': 'AI知识图谱', 'knowledge/contraindication': '禁忌证清单',
      'records/templates': '病历模板管理', 'records/scales': '评估量表管理',
      'records/elements': '专科数据元管理', 'pathways/overview': '诊疗路径总览',
      'pathways/manage': '诊疗路径管理', 'pathways/nodes': '节点规则配置',
      'quality/rules': '质控规则配置', 'quality/dispatch': '质控规则分发',
      'quality/dept': '质控科室分发', 'quality/emr': '病历文书质控',
      'quality/disease': '单病种质控', 'quality/timeliness': '病种时效质控',
      'research/overview': '科研数据总览', 'research/distribution': '数据特征分布',
      'research/audit': '科研数据审核', 'research/data': '科研数据管理',
      'research/process': '科研数据处理', 'research/analysis': '科研数据分析',
      'research/ai': '科研助手-AI小智', 'research/cohort': '科研队列管理',
      'research/crf': 'CRF表单管理', 'ai/monitor': '智能体运行监控',
      'ai/config': 'Dify智能体配置', 'ai/prompt': '提示词动态维护',
      'patients/preconsult': '专科预问诊配置', 'patients/records': '专科病历夹',
      'patients/followup': '患者随访管理'
    };
    const bc = document.getElementById('breadcrumb');
    if (bc) {
      bc.innerHTML = `<span>${titles[pageId] || pageId}</span>`;
    }
  },

  /**
   * 检查缓存是否过期（超过5分钟视为过期）
   * @param {string} path
   * @param {object} cached
   * @returns {boolean}
   */
  _isStale(path, cached) {
    return Date.now() - cached.timestamp > 5 * 60 * 1000;
  },

  /**
   * 使指定模块缓存失效
   * @param {string} pageId
   */
  invalidate(pageId) {
    const path = this._resolvePath(pageId);
    AppState.get('moduleCache').delete(path);
  },

  /**
   * 使所有模块缓存失效
   */
  invalidateAll() {
    AppState.get('moduleCache').clear();
  },

  /**
   * 获取缓存统计信息
   * @returns {{ totalCached: number, modules: Array<{ path: string, timestamp: string, size: number }> }}
   */
  getCacheStats() {
    const cache = AppState.get('moduleCache');
    return {
      totalCached: cache.size,
      modules: Array.from(cache.entries()).map(([path, data]) => ({
        path,
        timestamp: new Date(data.timestamp).toLocaleString(),
        size: data.html.length
      }))
    };
  }
};
