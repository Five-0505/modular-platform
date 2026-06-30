/**
 * DiseaseSwitcher Component
 * 学科与病种两级联动选择组件
 */
const DiseaseSwitcher = {
  // 状态管理
  state: {
    isOpen: false,
    isLoading: false,
    isError: false,
    isMultiDiseaseUser: true,
    selectedDept: null,
    selectedDisease: null,
    searchQuery: '',
    focusedIndex: -1,
    viewMode: 'dept' // 'dept' | 'disease'
  },

  // 学科数据
  getDepartments() {
    return [
      { id: 'cardio', name: '心血管内科', icon: '心', color: '#EF4444' },
      { id: 'neuro', name: '神经内科', icon: '脑', color: '#8B5CF6' },
      { id: 'neurosurgery', name: '神经外科', icon: '脑', color: '#6366F1' },
      { id: 'colorectal', name: '结直肠外科', icon: '肠', color: '#F59E0B' },
      { id: 'ortho', name: '骨科', icon: '骨', color: '#10B981' },
      { id: 'nuclear', name: '核医学科', icon: '核', color: '#3B82F6' },
      { id: 'urology', name: '泌尿外科', icon: '肾', color: '#EC4899' }
    ];
  },

  // 根据学科获取病种列表
  getDiseasesByDept(deptId) {
    const allDiseases = [
      { id: 'disease1', name: '冠心病 / 急性心肌梗死', deptId: 'cardio', dept: '心血管内科', patientCount: 1256, icon: '心' },
      { id: 'disease2', name: '高血压', deptId: 'cardio', dept: '心血管内科', patientCount: 865, icon: '心' },
      { id: 'disease14', name: '心肌病', deptId: 'cardio', dept: '心血管内科', patientCount: 345, icon: '心' },
      { id: 'disease15', name: '心力衰竭', deptId: 'cardio', dept: '心血管内科', patientCount: 567, icon: '心' },
      { id: 'disease16', name: '心律失常（房颤）', deptId: 'cardio', dept: '心血管内科', patientCount: 456, icon: '心' },
      { id: 'disease17', name: '起搏治疗相关疾病', deptId: 'cardio', dept: '心血管内科', patientCount: 234, icon: '心' },
      { id: 'disease18', name: '心脏瓣膜病', deptId: 'cardio', dept: '心血管内科', patientCount: 345, icon: '心' },
      { id: 'disease19', name: '肺动脉高压', deptId: 'cardio', dept: '心血管内科', patientCount: 123, icon: '肺' },
      { id: 'disease20', name: '先天性心脏病', deptId: 'cardio', dept: '心血管内科', patientCount: 156, icon: '心' },
      { id: 'disease3', name: '脑梗死', deptId: 'neuro', dept: '神经内科', patientCount: 987, icon: '脑' },
      { id: 'disease4', name: '脑出血', deptId: 'neurosurgery', dept: '神经外科', patientCount: 345, icon: '脑' },
      { id: 'disease5', name: '动脉瘤', deptId: 'neurosurgery', dept: '神经外科', patientCount: 234, icon: '脑' },
      { id: 'disease6', name: '结肠癌', deptId: 'colorectal', dept: '结直肠外科', patientCount: 456, icon: '瘤' },
      { id: 'disease8', name: '膝关节', deptId: 'ortho', dept: '骨科', patientCount: 456, icon: '骨' },
      { id: 'disease9', name: '髋关节', deptId: 'ortho', dept: '骨科', patientCount: 345, icon: '骨' },
      { id: 'disease10', name: '肿瘤术后同位素治疗', deptId: 'nuclear', dept: '核医学科', patientCount: 234, icon: '核' },
      { id: 'disease11', name: '肾癌', deptId: 'urology', dept: '泌尿外科', patientCount: 123, icon: '肾' },
      { id: 'disease12', name: '前列腺癌', deptId: 'urology', dept: '泌尿外科', patientCount: 156, icon: '肾' },
      { id: 'disease13', name: '尿路上皮癌', deptId: 'urology', dept: '泌尿外科', patientCount: 98, icon: '肾' }
    ];
    return allDiseases.filter(d => d.deptId === deptId);
  },

  // 初始化
  async init() {
    this.bindEvents();
    const saved = localStorage.getItem('selectedDisease');
    if (saved) {
      this.state.selectedDisease = JSON.parse(saved);
      // 根据保存的病种找到对应学科
      if (this.state.selectedDisease) {
        this.state.selectedDept = this.getDepartments().find(d => d.id === this.state.selectedDisease.deptId) || null;
      }
    }
    this.render();
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

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
    }
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
    this.state.viewMode = 'dept';
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

  // 选择学科
  selectDept(dept) {
    this.state.selectedDept = dept;
    this.state.viewMode = 'disease';
    this.state.searchQuery = '';
    this.state.focusedIndex = -1;
    this.render();
  },

  // 返回学科列表
  backToDepts() {
    this.state.viewMode = 'dept';
    this.state.searchQuery = '';
    this.state.focusedIndex = -1;
    this.render();
  },

  // 选择病种
  async selectDisease(disease) {
    this.state.selectedDisease = disease;
    this.close();

    // 保存到localStorage
    localStorage.setItem('selectedDisease', JSON.stringify(disease));

    // 同步到全局状态
    if (typeof AppState !== 'undefined') {
      AppState.set('selectedDisease', disease);
    }

    // 显示切换提示
    this.showToast('success', `已切换到「${disease.name}」`);

    // 触发系统联动
    this.updateSystemData(disease);
    this.render();
  },

  // 更新系统数据
  updateSystemData(disease) {
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

  // 获取过滤后的病种列表
  getFilteredDiseases() {
    const diseases = this.state.selectedDept ? this.getDiseasesByDept(this.state.selectedDept.id) : [];
    if (!this.state.searchQuery) return diseases;
    const query = this.state.searchQuery.toLowerCase();
    return diseases.filter(d => d.name.toLowerCase().includes(query));
  },

  // 渲染
  render() {
    const container = document.getElementById('diseaseSwitcher');
    if (!container) return;

    if (!this.state.isMultiDiseaseUser) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';

    const displayText = this.state.selectedDisease
      ? this.state.selectedDisease.name
      : '请选择病种';

    const displayIcon = this.state.selectedDisease
      ? this.state.selectedDisease.icon
      : '选';

    container.innerHTML = `
      <div class="disease-switcher-trigger" onclick="DiseaseSwitcher.toggle()">
        <div class="disease-switcher-trigger-icon">
          ${displayIcon}
        </div>
        <div class="disease-switcher-trigger-info">
          <div class="disease-switcher-trigger-name">
            ${displayText}
          </div>
          ${this.state.selectedDisease ? `
            <div class="disease-switcher-trigger-desc">${this.state.selectedDisease.dept}</div>
          ` : ''}
        </div>
        <div class="disease-switcher-trigger-arrow ${this.state.isOpen ? 'open' : ''}">▾</div>
      </div>

      <div class="disease-switcher-dropdown ${this.state.isOpen ? 'open' : ''}">
        ${this.state.viewMode === 'dept' ? this.renderDeptList() : this.renderDiseaseList()}
      </div>
    `;
  },

  // 渲染学科列表
  renderDeptList() {
    const depts = this.getDepartments();
    return `
      <div style="padding:12px 16px;border-bottom:1px solid var(--gray-200,#e2e8f0)">
        <div style="font-size:13px;font-weight:600;color:var(--text-primary,#1e293b)">选择学科</div>
      </div>
      <div class="disease-switcher-list">
        ${depts.map(dept => {
          const diseaseCount = this.getDiseasesByDept(dept.id).length;
          return `
            <div class="disease-switcher-item ${this.state.selectedDept?.id === dept.id ? 'active' : ''}"
              onclick="DiseaseSwitcher.selectDept(${JSON.stringify(dept).replace(/"/g, '&quot;')})">
              <div class="disease-switcher-item-icon" style="background:${dept.color}20;color:${dept.color}">${dept.icon}</div>
              <div class="disease-switcher-item-info">
                <div class="disease-switcher-item-name">${dept.name}</div>
                <div class="disease-switcher-item-dept">${diseaseCount} 个病种</div>
              </div>
              <div style="color:var(--gray-400,#94a3b8);font-size:12px">›</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // 渲染病种列表
  renderDiseaseList() {
    const diseases = this.getFilteredDiseases();
    const dept = this.state.selectedDept;

    return `
      <div style="padding:12px 16px;border-bottom:1px solid var(--gray-200,#e2e8f0);display:flex;align-items:center;gap:8px">
        <button onclick="DiseaseSwitcher.backToDepts()" style="background:none;border:none;cursor:pointer;padding:4px;color:var(--gray-500,#64748b);display:flex;align-items:center">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4l-6 6 6 6"/></svg>
        </button>
        <div style="font-size:13px;font-weight:600;color:var(--text-primary,#1e293b)">${dept?.name || ''}</div>
        <div style="font-size:11px;color:var(--text-tertiary,#94a3b8);margin-left:auto">${diseases.length} 个病种</div>
      </div>
      <div class="disease-switcher-search">
        <input type="text" placeholder="搜索病种..." value="${this.state.searchQuery}"
          oninput="DiseaseSwitcher.state.searchQuery = this.value;DiseaseSwitcher.state.focusedIndex=-1;DiseaseSwitcher.render();">
      </div>
      <div class="disease-switcher-list">
        ${diseases.length === 0 ? `
          <div style="padding:32px;text-align:center;color:var(--gray-500,#64748b);">未找到匹配的病种</div>
        ` : diseases.map((disease, index) => `
          <div class="disease-switcher-item ${this.state.selectedDisease?.id === disease.id ? 'active' : ''}"
            onclick="DiseaseSwitcher.selectDisease(${JSON.stringify(disease).replace(/"/g, '&quot;')})">
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
    `;
  }
};
