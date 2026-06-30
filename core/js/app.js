/**
 * Main Application
 * 应用主入口，负责初始化各模块并协调运行
 */
const App = {
  /**
   * 应用初始化
   */
  init() {
    // 初始化状态
    AppState.set('currentPage', 'workbench');

    // 初始化模块加载器
    ModuleLoader.init();

    // 初始化病种切换组件
    DiseaseSwitcher.init();

    // 初始化版本管理器
    VersionManager.init();

    // 渲染侧边栏菜单
    this.renderMenu();

    // 加载初始模块（工作台）
    ModuleLoader.load('workbench');

    // 监听模块加载事件，更新菜单高亮
    document.addEventListener('module:loaded', (e) => {
      this.updateMenuActive(e.detail.pageId);
    });

    console.log('Platform initialized. Version:', VersionManager.getCurrentVersion());
  },

  /**
   * 渲染侧边栏菜单
   * 优先从 JSON 配置文件加载，失败则使用内联回退配置
   */
  renderMenu() {
    const menuContainer = document.getElementById('sidebarNav');
    if (!menuContainer) return;

    // 尝试从配置文件加载菜单
    fetch('core/data/menu-config.json')
      .then(r => r.json())
      .then(config => {
        this._buildMenu(menuContainer, config.groups);
      })
      .catch(() => {
        // 回退：使用内联菜单配置
        this._buildMenuFallback(menuContainer);
      });
  },

  /**
   * 构建菜单HTML
   * @param {HTMLElement} container
   * @param {Array} groups - 菜单分组配置
   */
  _buildMenu(container, groups) {
    const currentPage = AppState.get('currentPage');
    const expandedMenus = AppState.get('expandedMenus');
    let html = '';

    const icons = {
      'home': '<svg viewBox="0 0 20 20" width="16" height="16"><path d="M3 10l7-7 7 7M5 8v8h4v-4h2v4h4V8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      'plus-square': '<svg viewBox="0 0 20 20" width="16" height="16"><path d="M10 3v14M3 10h14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
      'grid': '<svg viewBox="0 0 20 20" width="16" height="16"><rect x="3" y="3" width="6" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="3" width="6" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="3" y="11" width="6" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="11" width="6" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
      'book': '<svg viewBox="0 0 20 20" width="16" height="16"><path d="M4 4h12v12H4zM4 8h12M8 4v12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
      'file-text': '<svg viewBox="0 0 20 20" width="16" height="16"><rect x="4" y="3" width="12" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 7h6M7 10h6M7 13h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
      'git-branch': '<svg viewBox="0 0 20 20" width="16" height="16"><circle cx="5" cy="10" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="15" cy="10" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 10h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
      'cpu': '<svg viewBox="0 0 20 20" width="16" height="16"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="2" fill="currentColor"/></svg>',
      'users': '<svg viewBox="0 0 20 20" width="16" height="16"><circle cx="10" cy="7" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
      'check-circle': '<svg viewBox="0 0 20 20" width="16" height="16"><path d="M5 10l3 3 7-7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      'flask': '<svg viewBox="0 0 20 20" width="16" height="16"><circle cx="8" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M11 11l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
    };

    groups.forEach(group => {
      const hasChildren = group.children && group.children.length > 0;
      const isExpanded = expandedMenus.has(group.id);
      const isActive = currentPage === group.pageId ||
        (hasChildren && group.children.some(c => c.pageId === currentPage));

      html += `<div class="menu-group">`;
      html += `<div class="menu-item ${isActive ? 'active' : ''}"
               onclick="App.toggleMenu('${group.id}', '${group.pageId}', '${hasChildren ? group.children[0].pageId : group.pageId}')">
               <span class="icon">${icons[group.icon] || ''}</span>
               <span class="label">${group.name}</span>
               ${hasChildren ? `<span class="arrow ${isExpanded ? 'expanded' : ''}">&#9656;</span>` : ''}
             </div>`;

      if (hasChildren) {
        html += `<div class="submenu ${isExpanded ? 'open' : ''}">`;
        group.children.forEach(child => {
          html += `<div class="menu-item ${currentPage === child.pageId ? 'active' : ''}"
                   onclick="App.navigate('${child.pageId}')">
                   <span class="icon"></span>
                   <span class="label">${child.name}</span>
                 </div>`;
        });
        html += `</div>`;
      }
      html += `</div>`;
    });

    container.innerHTML = html;
  },

  /**
   * 回退菜单构建（当JSON加载失败时使用内联配置）
   * @param {HTMLElement} container
   */
  _buildMenuFallback(container) {
    this._buildMenu(container, [
      { id: 'workbench', name: '工作台', icon: 'home', pageId: 'workbench', children: [] },
      { id: 'diseases', name: '专科病种管理', icon: 'plus-square', pageId: 'diseases', children: [] },
      { id: 'data-center', name: '专科数据中心', icon: 'grid', pageId: 'data-center/datasets', children: [
        { id: 'datasets', name: '标准数据集管理', pageId: 'data-center/datasets' },
        { id: 'rdr', name: 'RDR 数据仓库', pageId: 'data-center/rdr' },
        { id: 'metadata', name: '元数据管理', pageId: 'data-center/metadata' },
        { id: 'ai-governance', name: 'AI数据治理', pageId: 'data-center/ai' },
        { id: 'standards', name: '医疗标准字典', pageId: 'data-center/standards' }
      ]},
      { id: 'knowledge', name: '专科知识管理', icon: 'book', pageId: 'knowledge/disease', children: [
        { id: 'disease-knowledge', name: '疾病知识管理', pageId: 'knowledge/disease' },
        { id: 'knowledge-graph', name: 'AI知识图谱', pageId: 'knowledge/graph' },
        { id: 'contraindication', name: '禁忌证清单', pageId: 'knowledge/contraindication' },
        { id: 'pre-consultation', name: '专科预问诊配置', pageId: 'patients/preconsult' }
      ]},
      { id: 'records', name: '专科病历管理', icon: 'file-text', pageId: 'records/templates', children: [
        { id: 'templates', name: '病历模板管理', pageId: 'records/templates' },
        { id: 'scales', name: '评估量表管理', pageId: 'records/scales' },
        { id: 'elements', name: '专科数据元管理', pageId: 'records/elements' }
      ]},
      { id: 'pathways', name: '专病诊疗路径', icon: 'git-branch', pageId: 'pathways/overview', children: [
        { id: 'pathway-overview', name: '诊疗路径总览', pageId: 'pathways/overview' },
        { id: 'pathway-manage', name: '诊疗路径管理', pageId: 'pathways/manage' },
        { id: 'pathway-nodes', name: '节点规则配置', pageId: 'pathways/nodes' }
      ]},
      { id: 'ai', name: '专科AI管理', icon: 'cpu', pageId: 'ai/monitor', children: [
        { id: 'ai-monitor', name: '智能体运行监控', pageId: 'ai/monitor' },
        { id: 'ai-config', name: 'Dify智能体配置', pageId: 'ai/config' },
        { id: 'ai-prompt', name: '提示词动态维护', pageId: 'ai/prompt' }
      ]},
      { id: 'patients', name: '患者管理中心', icon: 'users', pageId: 'patients/records', children: [
        { id: 'records-folder', name: '专科病历夹', pageId: 'patients/records' },
        { id: 'followup', name: '患者随访管理', pageId: 'patients/followup' }
      ]},
      { id: 'quality', name: '专科质控中心', icon: 'check-circle', pageId: 'quality/rules', children: [
        { id: 'quality-rules', name: '质控规则配置', pageId: 'quality/rules' },
        { id: 'quality-dispatch', name: '质控规则分发', pageId: 'quality/dispatch' },
        { id: 'quality-dept', name: '质控科室分发', pageId: 'quality/dept' },
        { id: 'record-quality', name: '病历文书质控', pageId: 'quality/emr' },
        { id: 'disease-quality', name: '单病种质控', pageId: 'quality/disease' },
        { id: 'time-quality', name: '病种时效质控', pageId: 'quality/timeliness' }
      ]},
      { id: 'research', name: '科研管理中心', icon: 'flask', pageId: 'research/overview', children: [
        { id: 'research-overview', name: '科研数据总览', pageId: 'research/overview' },
        { id: 'data-distribution', name: '数据特征分布', pageId: 'research/distribution' },
        { id: 'research-review', name: '科研数据审核', pageId: 'research/audit' },
        { id: 'research-data', name: '科研数据管理', pageId: 'research/data' },
        { id: 'research-process', name: '科研数据处理', pageId: 'research/process' },
        { id: 'research-analysis', name: '科研数据分析', pageId: 'research/analysis' },
        { id: 'research-assistant', name: '科研助手-AI小智', pageId: 'research/ai' },
        { id: 'cohort-manage', name: '科研队列管理', pageId: 'research/cohort' },
        { id: 'crf-manage', name: 'CRF表单管理', pageId: 'research/crf' }
      ]}
    ]);
  },

  /**
   * 切换菜单展开/收起
   * @param {string} id - 菜单组ID
   * @param {string} pageId - 菜单组对应的页面ID
   * @param {string} firstChildPageId - 第一个子菜单的页面ID
   */
  toggleMenu(id, pageId, firstChildPageId) {
    const expanded = AppState.get('expandedMenus');
    if (expanded.has(id)) {
      expanded.delete(id);
    } else {
      expanded.add(id);
    }
    this.navigate(firstChildPageId || pageId);
  },

  /**
   * 导航到指定页面
   * @param {string} pageId
   */
  navigate(pageId) {
    ModuleLoader.load(pageId);
    this.renderMenu();
  },

  /**
   * 更新菜单激活状态
   * @param {string} pageId
   */
  updateMenuActive(pageId) {
    // 更新激活状态，简单方案为重新渲染菜单
    this.renderMenu();
  },

  /**
   * 切换侧边栏折叠状态
   */
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
    AppState.set('sidebarCollapsed', sidebar.classList.contains('collapsed'));
  },

  /**
   * 切换版本管理面板
   */
  toggleVersionPanel() {
    VersionManager.togglePanel();
  }
};

// DOM 就绪后初始化应用
document.addEventListener('DOMContentLoaded', () => App.init());
