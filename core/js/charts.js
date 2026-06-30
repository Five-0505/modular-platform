/* ===================================================================
 * 专科一体化管理平台 - SVG 图表库
 * =================================================================== */

const Charts = {
  // 生成渐变色定义
  _generateGradient: (id, color1, color2) => `
    <linearGradient id="${id}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${color1};stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:${color2};stop-opacity:0.1" />
    </linearGradient>
  `,

  // 折线图
  lineChart: (data, options = {}) => {
    const { 
      width = 600, 
      height = 220, 
      color = '#3B82F6', 
      labelColor = '#64748B',
      gridColor = '#e5e7eb',
      showArea = true,
      showPoints = true
    } = options;

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // 数据处理
    const maxVal = Math.max(...data.map(d => d.value));
    const minVal = Math.min(...data.map(d => d.value));
    const range = maxVal - minVal || 1;

    // 计算点位置
    const points = data.map((d, i) => ({
      x: padding.left + (i / (data.length - 1)) * chartWidth,
      y: padding.top + chartHeight - ((d.value - minVal) / range) * chartHeight,
      label: d.label,
      value: d.value
    }));

    // 生成路径
    const linePath = points.map((p, i) => 
      (i === 0 ? 'M' : 'L') + `${p.x},${p.y}`
    ).join(' ');

    const areaPath = linePath + 
      ` L${points[points.length - 1].x},${padding.top + chartHeight} L${points[0].x},${padding.top + chartHeight} Z`;

    // 生成网格线
    const gridLines = [];
    const numYLines = 4;
    for (let i = 0; i <= numYLines; i++) {
      const y = padding.top + (i / numYLines) * chartHeight;
      const val = maxVal - (i / numYLines) * range;
      gridLines.push(`<line x1="${padding.left}" y1="${y}" x2="${padding.left + chartWidth}" y2="${y}" stroke="${gridColor}" stroke-width="1"/>`);
      gridLines.push(`<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" fill="${labelColor}" font-size="11">${Math.round(val)}</text>`);
    }

    // 生成X轴标签
    const xLabels = points.map((p, i) => 
      `<text x="${p.x}" y="${padding.top + chartHeight + 25}" text-anchor="middle" fill="${labelColor}" font-size="11">${p.label}</text>`
    );

    // 生成数据点
    const pointElems = points.map(p => 
      `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${color}" stroke="#fff" stroke-width="2"/>`
    );

    return `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
        <defs>
          ${Charts._generateGradient('lineGrad', color, color)}
        </defs>
        ${gridLines.join('')}
        ${showArea ? `<path d="${areaPath}" fill="url(#lineGrad)" opacity="0.2"/>` : ''}
        <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${showPoints ? pointElems.join('') : ''}
        ${xLabels.join('')}
      </svg>
    `;
  },

  // 横向柱状图 (Top N)
  horizontalBarChart: (data, options = {}) => {
    const { 
      width = 600, 
      height = 220, 
      colors = ['#3B82F6', '#60A5FA', '#818CF8', '#A78BFA', '#C4B5FD'],
      labelColor = '#64748B',
      barHeight = 28,
      barGap = 12
    } = options;

    const padding = { top: 15, right: 30, bottom: 15, left: 120 };
    const maxVal = Math.max(...data.map(d => d.value));
    const chartHeight = padding.top + data.length * (barHeight + barGap) + padding.bottom;

    const bars = data.map((d, i) => {
      const barWidth = (d.value / maxVal) * (width - padding.left - padding.right);
      const y = padding.top + i * (barHeight + barGap);
      const color = colors[i % colors.length];
      return `
        <g>
          <text x="${padding.left - 10}" y="${y + barHeight/2 + 4}" text-anchor="end" fill="${labelColor}" font-size="12" font-weight="500">${d.label}</text>
          <rect x="${padding.left}" y="${y}" width="${barWidth}" height="${barHeight}" rx="6" fill="${color}" opacity="0.9"/>
          <text x="${padding.left + barWidth + 8}" y="${y + barHeight/2 + 4}" text-anchor="start" fill="${labelColor}" font-size="12" font-weight="600">${d.value}</text>
        </g>
      `;
    });

    return `
      <svg width="100%" height="${chartHeight}" viewBox="0 0 ${width} ${chartHeight}" preserveAspectRatio="xMidYMid meet">
        ${bars.join('')}
      </svg>
    `;
  },

  // 柱状图 (排行榜)
  barChart: (data, options = {}) => {
    const { 
      width = 600, 
      height = 220, 
      color = '#3B82F6', 
      labelColor = '#64748B',
      barWidth = 40
    } = options;

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxVal = Math.max(...data.map(d => d.value));
    const totalWidth = data.length * barWidth + (data.length - 1) * 16;
    const startX = padding.left + (chartWidth - totalWidth) / 2;

    const bars = data.map((d, i) => {
      const barHeight = (d.value / maxVal) * chartHeight;
      const x = startX + i * (barWidth + 16);
      const y = padding.top + chartHeight - barHeight;
      return `
        <g>
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="6" fill="${color}"/>
          <text x="${x + barWidth/2}" y="${padding.top + chartHeight + 25}" text-anchor="middle" fill="${labelColor}" font-size="11">${d.label}</text>
          <text x="${x + barWidth/2}" y="${y - 8}" text-anchor="middle" fill="${color}" font-size="12" font-weight="600">${d.value}</text>
        </g>
      `;
    });

    // 网格线
    const gridLines = [];
    const numYLines = 4;
    for (let i = 0; i <= numYLines; i++) {
      const y = padding.top + (i / numYLines) * chartHeight;
      const val = maxVal - (i / numYLines) * maxVal;
      gridLines.push(`<line x1="${padding.left}" y1="${y}" x2="${padding.left + chartWidth}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`);
      gridLines.push(`<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" fill="${labelColor}" font-size="11">${Math.round(val)}</text>`);
    }

    return `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
        ${gridLines.join('')}
        ${bars.join('')}
      </svg>
    `;
  },

  // 饼图/环形图
  donutChart: (data, options = {}) => {
    const { 
      width = 280, 
      height = 220, 
      colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1'],
      innerRadius = 45,
      outerRadius = 80
    } = options;

    const cx = width / 2;
    const cy = height / 2;
    const total = data.reduce((sum, d) => sum + d.value, 0);

    let startAngle = -Math.PI / 2;
    const slices = data.map((d, i) => {
      const endAngle = startAngle + (d.value / total) * 2 * Math.PI;
      const x1 = cx + innerRadius * Math.cos(startAngle);
      const y1 = cy + innerRadius * Math.sin(startAngle);
      const x2 = cx + outerRadius * Math.cos(startAngle);
      const y2 = cy + outerRadius * Math.sin(startAngle);
      const x3 = cx + outerRadius * Math.cos(endAngle);
      const y3 = cy + outerRadius * Math.sin(endAngle);
      const x4 = cx + innerRadius * Math.cos(endAngle);
      const y4 = cy + innerRadius * Math.sin(endAngle);

      const largeArc = (d.value / total) > 0.5 ? 1 : 0;

      const path = `
        M ${x1} ${y1}
        L ${x2} ${y2}
        A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x3} ${y3}
        L ${x4} ${y4}
        A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1}
      `;

      const slice = {
        path,
        color: colors[i % colors.length],
        label: d.label,
        value: d.value,
        percentage: Math.round((d.value / total) * 100)
      };

      startAngle = endAngle;
      return slice;
    });

    return `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
        ${slices.map(s => `<path d="${s.path}" fill="${s.color}" />`).join('')}
      </svg>
    `;
  },

  // 年龄分布图表
  ageDistributionChart: (data, options = {}) => {
    const { 
      width = 600, 
      height = 220, 
      color = '#3B82F6', 
      labelColor = '#64748B'
    } = options;

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxVal = Math.max(...data.map(d => d.value));
    const barWidth = chartWidth / data.length - 8;

    const bars = data.map((d, i) => {
      const barHeight = (d.value / maxVal) * chartHeight;
      const x = padding.left + i * (chartWidth / data.length) + 4;
      const y = padding.top + chartHeight - barHeight;
      return `
        <g>
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="${color}" opacity="0.9"/>
          <text x="${x + barWidth/2}" y="${padding.top + chartHeight + 25}" text-anchor="middle" fill="${labelColor}" font-size="11">${d.label}</text>
          <text x="${x + barWidth/2}" y="${y - 6}" text-anchor="middle" fill="${labelColor}" font-size="10" font-weight="600">${d.value}</text>
        </g>
      `;
    });

    return `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
        ${bars.join('')}
      </svg>
    `;
  }
};

// 图表初始化
const ChartRenderer = {
  // 自动检测并渲染所有图表（模块加载后调用）
  autoRender() {
    console.log('🔍 自动检测图表...');
    
    // 尝试渲染所有可能的图表
    ChartRenderer.renderQualityRules();
    ChartRenderer.renderQualityDisease();
    ChartRenderer.renderFollowup();
    ChartRenderer.renderResearchCohort();
    ChartRenderer.renderResearchOverview();
    ChartRenderer.renderResearchDistribution();
    ChartRenderer.renderResearchAnalysis();
    ChartRenderer.renderPathwayOverview();
    ChartRenderer.renderAIMonitor();
    ChartRenderer.renderKnowledgeContraindication();
    ChartRenderer.renderRecordsScales();
    
    console.log('✅ 图表检测完成');
  },

  // 渲染质控规则页面图表
  renderQualityRules: () => {
    const trendData = [
      { label: '1月', value: 45 },
      { label: '2月', value: 52 },
      { label: '3月', value: 38 },
      { label: '4月', value: 65 },
      { label: '5月', value: 48 },
      { label: '6月', value: 72 }
    ];
    
    const topData = [
      { label: '用药不适宜', value: 156 },
      { label: '医嘱超时', value: 124 },
      { label: '检验漏项', value: 98 },
      { label: '病历缺失', value: 76 },
      { label: '院感风险', value: 54 }
    ];

    const volumeData = [
      { label: '1月', value: 245 },
      { label: '2月', value: 289 },
      { label: '3月', value: 267 },
      { label: '4月', value: 312 },
      { label: '5月', value: 298 },
      { label: '6月', value: 345 }
    ];

    const trendEl = document.querySelector('.quality-trend-chart');
    const topEl = document.querySelector('.quality-top-chart');
    const volumeEl = document.querySelector('.quality-volume-chart');

    if (trendEl) {
      trendEl.innerHTML = Charts.lineChart(trendData, { color: '#3B82F6' });
      console.log('📊 月度预警趋势图已渲染');
    }
    if (topEl) {
      topEl.innerHTML = Charts.horizontalBarChart(topData);
      console.log('📊 高频预警Top5图已渲染');
    }
    if (volumeEl) {
      volumeEl.innerHTML = Charts.lineChart(volumeData, { color: '#10B981' });
      console.log('📊 处理量趋势图已渲染');
    }
  },

  // 渲染单病种质控页面图表
  renderQualityDisease: () => {
    const deptData = [
      { label: '心内科', value: 92 },
      { label: '神经内科', value: 88 },
      { label: '骨科', value: 85 },
      { label: '呼吸科', value: 82 },
      { label: '普外科', value: 79 }
    ];

    const deptEl = document.querySelector('.dept-ranking-chart');

    if (deptEl) {
      deptEl.innerHTML = Charts.barChart(deptData);
      console.log('📊 科室达标率排行图已渲染');
    }
  },

  // 渲染随访页面图表
  renderFollowup: () => {
    const followupData = [
      { label: '1月', value: 82 },
      { label: '2月', value: 85 },
      { label: '3月', value: 87 },
      { label: '4月', value: 84 },
      { label: '5月', value: 89 },
      { label: '6月', value: 92 }
    ];

    const el = document.querySelector('.followup-trend-chart');
    if (el) {
      el.innerHTML = Charts.lineChart(followupData, { color: '#10B981' });
      console.log('📊 随访完成率趋势图已渲染');
    }
  },

  // 渲染科研队列页面图表
  renderResearchCohort: () => {
    const enrollmentData = [
      { label: '1月', value: 45 },
      { label: '2月', value: 58 },
      { label: '3月', value: 72 },
      { label: '4月', value: 65 },
      { label: '5月', value: 89 },
      { label: '6月', value: 105 }
    ];

    const ageData = [
      { label: '18-30', value: 120 },
      { label: '31-45', value: 245 },
      { label: '46-60', value: 356 },
      { label: '61-75', value: 289 },
      { label: '75+', value: 145 }
    ];

    const genderData = [
      { label: '男性', value: 658 },
      { label: '女性', value: 597 }
    ];

    const statusData = [
      { label: '进行中', value: 36 },
      { label: '已完成', value: 28 },
      { label: '已暂停', value: 8 },
      { label: '已终止', value: 3 }
    ];

    const enrollmentEl = document.querySelector('.enrollment-trend-chart');
    const ageEl = document.querySelector('.age-distribution-chart');
    const genderEl = document.querySelector('.gender-distribution-chart');
    const statusEl = document.querySelector('.cohort-status-chart');

    if (enrollmentEl) {
      enrollmentEl.innerHTML = Charts.lineChart(enrollmentData, { color: '#3B82F6' });
      console.log('📊 入组进度趋势图已渲染');
    }
    if (ageEl) {
      ageEl.innerHTML = Charts.ageDistributionChart(ageData);
      console.log('📊 年龄分布图已渲染');
    }
    if (genderEl) {
      genderEl.innerHTML = Charts.donutChart(genderData, { colors: ['#3B82F6', '#EC4899'] });
      console.log('📊 性别构成图已渲染');
    }
    if (statusEl) {
      statusEl.innerHTML = Charts.donutChart(statusData);
      console.log('📊 队列状态分布图已渲染');
    }
  },

  // 渲染科研总览页面图表
  renderResearchOverview: () => {
    const trendData = [
      { label: '1月', value: 820 },
      { label: '2月', value: 945 },
      { label: '3月', value: 1020 },
      { label: '4月', value: 1156 },
      { label: '5月', value: 1289 },
      { label: '6月', value: 1456 }
    ];

    const chartEl = document.querySelector('.chart-placeholder');
    if (chartEl && chartEl.textContent.includes('入组')) {
      chartEl.innerHTML = Charts.lineChart(trendData, { color: '#3B82F6', height: 220 });
      console.log('📊 入组进度趋势图已渲染');
    }
  },

  // 渲染数据特征分布页面图表
  renderResearchDistribution: () => {
    const ageData = [
      { label: '18-30', value: 1256 },
      { label: '31-40', value: 1892 },
      { label: '41-50', value: 2567 },
      { label: '51-60', value: 3124 },
      { label: '61-70', value: 2345 },
      { label: '71-80', value: 1056 },
      { label: '80+', value: 340 }
    ];

    const genderData = [
      { label: '男性', value: 7321 },
      { label: '女性', value: 5259 }
    ];

    const stayData = [
      { label: '3天内', value: 1567 },
      { label: '4-7天', value: 3456 },
      { label: '8-14天', value: 4123 },
      { label: '15-30天', value: 2345 },
      { label: '30天以上', value: 1089 }
    ];

    const comorbidityData = [
      { label: '高血压', value: 7850 },
      { label: '糖尿病', value: 4869 },
      { label: '冠心病', value: 3711 },
      { label: '高血脂', value: 3245 },
      { label: 'COPD', value: 1856 }
    ];

    const chartEls = document.querySelectorAll('.chart-placeholder');
    chartEls.forEach(el => {
      if (el.textContent.includes('年龄分布')) {
        el.innerHTML = Charts.ageDistributionChart(ageData, { color: '#3B82F6', height: 260 });
        console.log('📊 年龄分布图已渲染');
      } else if (el.textContent.includes('性别构成')) {
        el.innerHTML = Charts.donutChart(genderData, { colors: ['#3B82F6', '#EC4899'], height: 260 });
        console.log('📊 性别构成图已渲染');
      } else if (el.textContent.includes('住院天数')) {
        el.innerHTML = Charts.barChart(stayData, { color: '#10B981', height: 240 });
        console.log('📊 住院天数分布图已渲染');
      } else if (el.textContent.includes('合并症')) {
        el.innerHTML = Charts.horizontalBarChart(comorbidityData, { height: 240 });
        console.log('📊 合并症分布图已渲染');
      }
    });
  },

  // 渲染科研分析页面图表
  renderResearchAnalysis: () => {
    const chartEl = document.querySelector('.chart-placeholder');
    if (chartEl && chartEl.textContent.includes('图表区域')) {
      const resultData = [
        { label: '基线特征', value: 95 },
        { label: '差异分析', value: 87 },
        { label: '相关系数', value: 72 },
        { label: '回归系数', value: 68 },
        { label: '生存分析', value: 90 }
      ];
      chartEl.innerHTML = Charts.barChart(resultData, { color: '#6366F1', height: 280 });
      console.log('📊 分析结果图已渲染');
    }
  },

  // 渲染路径总览页面图表
  renderPathwayOverview: () => {
    const chartEls = document.querySelectorAll('.chart-placeholder');
    chartEls.forEach(el => {
      if (el.textContent.includes('月度趋势') || el.textContent.includes('路径')) {
        const entryData = [
          { label: '1月', value: 88 },
          { label: '2月', value: 90 },
          { label: '3月', value: 89 },
          { label: '4月', value: 91 },
          { label: '5月', value: 93 },
          { label: '6月', value: 96 }
        ];
        el.innerHTML = Charts.lineChart(entryData, { color: '#3B82F6', height: 220 });
        console.log('📊 路径趋势图已渲染');
      }
    });
  },

  // 渲染 AI 监控页面图表
  renderAIMonitor: () => {
    const trendData = [
      { label: '周一', value: 12450 },
      { label: '周二', value: 13560 },
      { label: '周三', value: 12890 },
      { label: '周四', value: 14230 },
      { label: '周五', value: 13890 },
      { label: '周六', value: 8960 },
      { label: '周日', value: 7850 }
    ];

    const chartEl = document.querySelector('.chart-placeholder');
    if (chartEl && chartEl.textContent.includes('处理')) {
      chartEl.innerHTML = Charts.lineChart(trendData, { color: '#F59E0B', height: 200 });
      console.log('📊 处理量趋势图已渲染');
    }
  },

  // 渲染禁忌证页面图表
  renderKnowledgeContraindication: () => {
    const trendData = [
      { label: '1月', value: 1256 },
      { label: '2月', value: 1423 },
      { label: '3月', value: 1567 },
      { label: '4月', value: 1890 },
      { label: '5月', value: 1756 },
      { label: '6月', value: 1892 }
    ];

    const chartEl = document.querySelector('.chart-placeholder');
    if (chartEl && chartEl.textContent.includes('预警')) {
      chartEl.innerHTML = Charts.lineChart(trendData, { color: '#EF4444', height: 180 });
      console.log('📊 预警趋势图已渲染');
    }
  },

  // 渲染量表页面图表
  renderRecordsScales: () => {
    const scaleData = [
      { label: '入院', value: 78 },
      { label: '3天', value: 85 },
      { label: '7天', value: 92 },
      { label: '14天', value: 95 },
      { label: '30天', value: 98 }
    ];

    const chartEl = document.querySelector('.chart-placeholder');
    if (chartEl && chartEl.textContent.includes('量表')) {
      chartEl.innerHTML = Charts.lineChart(scaleData, { color: '#8B5CF6', height: 180 });
      console.log('📊 评分趋势图已渲染');
    }
  }
};

// 监听模块加载事件，自动渲染图表
document.addEventListener('module:loaded', () => {
  console.log('📦 模块加载完成，准备渲染图表...');
  setTimeout(() => {
    ChartRenderer.autoRender();
  }, 50);
});
