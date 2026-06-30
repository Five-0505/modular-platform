/**
 * DiseaseSwitcher Component
 * 病种切换组件，支持搜索、键盘导航、多病种切换
 * 从原始单体应用迁移至模块化架构
 */
const DiseaseSwitcher = {
  // 状态管理
  state: {
    isOpen: false,
    isLoading: false,
    isError: false,
    isMultiDiseaseUser: true, // 模拟：拥有多病种权限的用户
    diseases: [],
    selectedDisease: null,
    searchQuery: '',
    focusedIndex: -1
  },

  // 获取病种图标（文字图标）
  getDiseaseIcon(diseaseName) {
    if (diseaseName.includes('心') || diseaseName.includes('心脏病')) return '心';
    if (diseaseName.includes('脑') || diseaseName.includes('神经')) return '脑';
    if (diseaseName.includes('肿瘤') || diseaseName.includes('癌')) return '瘤';
    if (diseaseName.includes('骨') || diseaseName.includes('关节')) return '骨';
    if (diseaseName.includes('肾') || diseaseName.includes('泌尿')) return '肾';
    if (diseaseName.includes('核')) return '核';
    if (diseaseName.includes('肺')) return '肺';
    if (diseaseName.includes('肠') || diseaseName.includes('结直肠')) return '肠';
    return '病';
  },

  // 模拟病种数据
  getMockDiseases() {
    return [
      { id: 'disease1', name: '冠心病 / 急性心肌梗死', dept: '心血管内科', patientCount: 1256, icon: '心' },
      { id: 'disease2', name: '高血压', dept: '心血管内科', patientCount: 865, icon: '心' },
      { id: 'disease3', name: '脑梗死', dept: '神经内科', patientCount: 987, icon: '脑' },
      { id: 'disease4', name: '脑出血', dept: '神经外科', patientCount: 345, icon: '脑' },
      { id: 'disease5', name: '动脉瘤', dept: '神经外科', patientCount: 234, icon: '脑' },
      { id: 'disease6', name: '结肠癌', dept: '结直肠外科', patientCount: 456, icon: '瘤' },
      { id: 'disease8', name: '膝关节', dept: '骨科', patientCount: 456, icon: '骨' },
      { id: 'disease9', name: '髋关节', dept: '骨科', patientCount: 345, icon: '骨' },
      { id: 'disease10', name: '肿瘤术后同位素治疗', dept: '核医学科', patientCount: 234, icon: '核' },
      { id: 'disease11', name: '肾癌', dept: '泌尿外科', patientCount: 123, icon: '肾' },
      { id: 'disease12', name: '前列腺癌', dept: '泌尿外科', patientCount: 156, icon: '肾' },
      { id: 'disease13', name: '尿路上皮癌', dept: '泌尿外科', patientCount: 98, icon: '肾' },
      { id: 'disease14', name: '心肌病', dept: '心血管内科', patientCount: 345, icon: '心' },
      { id: 'disease15', name: '心力衰竭', dept: '心血管内科', patientCount: 567, icon: '心' },
      { id: 'disease16', name: '心律失常（房颤）', dept: '心血管内科', patientCount: 456, icon: '心' },
      { id: 'disease17', name: '起搏治疗相关疾病', dept: '心血管内科', patientCount: 234, icon: '心' },
      { id: 'disease18', name: '心脏瓣膜病', dept: '心血管内科', patientCount: 345, icon: '心' },
      { id: 'disease19', name: '肺动脉高压', dept: '心血管内科', patientCount: 123, icon: '肺' },
      { id: 'disease20', name: '先天性心脏病', dept: '心血管内科', patientCount: 156, icon: '心' }
    ];
  },

  // 初始化
  async init() {
    this.bindEvents();
    const saved = localStorage.getItem('selectedDisease');
    if (saved) {
      this.state.selectedDisease = JSON.parse(saved);
    }
    await this.loadDiseases();
  },

  // 绑定事件
  bindEvents() {
    const overlay = document.getElementById('diseaseSwitcherOverlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.close());
    }
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  },

  // 键盘事件处理
  handleKeyDown(e) {
    if (!this.state.isOpen) return;

    const filtered = this.getFilteredDiseases();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.state.focusedIndex = Math.min(this.state.focusedIndex + 1, filtered.length - 1);
        this.highlightItem();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.state.focusedIndex = Math.max(this.state.focusedIndex - 1, 0);
        this.highlightItem();
        break;
      case 'Enter':
        e.preventDefault();
        if (this.state.focusedIndex >= 0 && this.state.focusedIndex < filtered.length) {
          this.selectDisease(filtered[this.state.focusedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
    }
  },

  highlightItem() {
    const items = document.querySelectorAll('.disease-switcher-item');
    items.forEach((item, index) => {
      if (index === this.state.focusedIndex) {
        item.style.background = 'var(--primary-bg)';
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.style.background = '';
      }
    });
  },

  // 加载病种数据（模拟API）
  async loadDiseases() {
    if (!this.state.isMultiDiseaseUser) return;

    this.state.isLoading = true;
    this.state.isError = false;
    this.render();

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      this.state.diseases = this.getMockDiseases();
      if (!this.state.selectedDisease) {
        this.state.selectedDisease = this.state.diseases[0];
      }
      this.state.isLoading = false;
      this.render();
    } catch (error) {
      this.state.isLoading = false;
      this.state.isError = true;
      this.render();
    }
  },

  // 重试加载
  async retry() {
    await this.loadDiseases();
  },

  // 获取过滤后的病种列表
  getFilteredDiseases() {
    if (!this.state.searchQuery) return this.state.diseases;
    const query = this.state.searchQuery.toLowerCase();
    return this.state.diseases.filter(d =>
      d.name.toLowerCase().includes(query) ||
      d.dept.toLowerCase().includes(query)
    );
  },

  // 切换下拉框
  toggle() {
    if (this.state.isOpen) {
      this.close();
    } else {
      this.open();
    }
  },

  open() {
    this.state.isOpen = true;
    this.state.searchQuery = '';
    this.state.focusedIndex = -1;
    this.render();
    const overlay = document.getElementById('diseaseSwitcherOverlay');
    if (overlay) overlay.style.display = 'block';
  },

  close() {
    this.state.isOpen = false;
    this.render();
    const overlay = document.getElementById('diseaseSwitcherOverlay');
    if (overlay) overlay.style.display = 'none';
  },

  // 通过索引选择病种
  async selectDiseaseByIndex(index) {
    const disease = this.getFilteredDiseases()[index];
    if (!disease) return;
    await this.selectDisease(disease);
  },

  // 选择病种
  async selectDisease(disease) {
    // 权限验证
    const hasPermission = this.state.diseases.some(d => d.id === disease.id);
    if (!hasPermission) {
      this.showToast('error', '您没有权限访问此病种');
      return;
    }

    this.state.selectedDisease = disease;
    this.close();

    // 保存到localStorage
    localStorage.setItem('selectedDisease', JSON.stringify(disease));

    // 同步到全局状态
    if (typeof AppState !== 'undefined') {
      AppState.set('selectedDisease', disease);
    }

    // 加载状态
    this.showToast('success', `正在切换到「${disease.name}」...`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 切换成功
    this.showToast('success', `已切换到「${disease.name}」`);

    // 触发系统联动
    this.updateSystemData(disease);
    this.render();
  },

  // 更新系统数据
  updateSystemData(disease) {
    console.log('Updating system data for:', disease.name);

    // 模拟更新统计数据
    const stats = document.querySelectorAll('.stat-info .value');
    stats.forEach(stat => {
      stat.style.animation = 'pulse .3s ease';
      setTimeout(() => stat.style.animation = '', 300);
    });

    // 触发病种切换事件
    const event = new CustomEvent('disease:changed', { detail: { disease } });
    document.dispatchEvent(event);
  },

  // 显示提示信息
  showToast(type, message) {
    const container = document.getElementById('diseaseSwitcherToast');
    if (!container) return;

    const icons = { success: '✓', error: '×', warning: '!' };

    container.innerHTML = `
      <div class="disease-switcher-toast ${type}">
        <span class="disease-switcher-toast-icon">${icons[type]}</span>
        <span class="disease-switcher-toast-text">${message}</span>
      </div>
    `;

    setTimeout(() => {
      container.innerHTML = '';
    }, 3000);
  },

  // 渲染
  render() {
    const container = document.getElementById('diseaseSwitcher');
    if (!container) return;

    // 如果是单病种权限用户，不显示
    if (!this.state.isMultiDiseaseUser) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';

    container.innerHTML = `
      <div class="disease-switcher-trigger" onclick="DiseaseSwitcher.toggle()">
        <div class="disease-switcher-trigger-icon">
          ${this.state.selectedDisease ? this.state.selectedDisease.icon : '选'}
        </div>
        <div class="disease-switcher-trigger-info">
          <div class="disease-switcher-trigger-name">
            ${this.state.selectedDisease ? this.state.selectedDisease.name : '请选择病种'}
          </div>
        </div>
        <div class="disease-switcher-trigger-arrow ${this.state.isOpen ? 'open' : ''}">▾</div>
      </div>

      <div class="disease-switcher-dropdown ${this.state.isOpen ? 'open' : ''}">
        ${this.state.isLoading ? `
          <div class="disease-switcher-loading">
            <div class="disease-switcher-loading-icon">···</div>
            <div class="disease-switcher-loading-text">正在加载病种列表...</div>
          </div>
        ` : this.state.isError ? `
          <div class="disease-switcher-error">
            <div style="font-size:24px;margin-bottom:8px">×</div>
            <div>加载失败，请重试</div>
            <button class="disease-switcher-error-btn" onclick="DiseaseSwitcher.retry()">重新加载</button>
          </div>
        ` : `
          <div class="disease-switcher-search">
            <input type="text" placeholder="搜索病种..." value="${this.state.searchQuery}"
              oninput="DiseaseSwitcher.state.searchQuery = this.value;DiseaseSwitcher.state.focusedIndex=-1;DiseaseSwitcher.render();">
          </div>
          <div class="disease-switcher-list">
            ${this.getFilteredDiseases().length === 0 ? `
              <div style="padding:32px;text-align:center;color:var(--gray-500);">未找到匹配的病种</div>
            ` : this.getFilteredDiseases().map((disease, index) => `
              <div class="disease-switcher-item ${this.state.selectedDisease?.id === disease.id ? 'active' : ''}"
                onclick="DiseaseSwitcher.selectDiseaseByIndex(${index})"
                onmouseenter="DiseaseSwitcher.state.focusedIndex=-1">
                <div class="disease-switcher-item-icon">${disease.icon}</div>
                <div class="disease-switcher-item-info">
                  <div class="disease-switcher-item-name">${disease.name}</div>
                  <div class="disease-switcher-item-dept">${disease.dept}</div>
                </div>
                <div class="disease-switcher-item-badge">
                  <span>${disease.patientCount}人</span>
                </div>
                <div class="disease-switcher-item-check">✓</div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }
};
