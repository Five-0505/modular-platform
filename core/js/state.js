/**
 * Centralized State Manager
 * 响应式状态管理，支持订阅与通知机制
 */
const AppState = {
  _state: {
    currentPage: 'workbench',
    currentModule: null,
    expandedMenus: new Set(),
    sidebarCollapsed: false,
    moduleCache: new Map(),
    moduleVersions: new Map(),
    selectedDisease: null,
    searchQuery: ''
  },

  _listeners: new Map(),

  get(key) { return this._state[key]; },

  set(key, value) {
    const old = this._state[key];
    this._state[key] = value;
    this._notify(key, value, old);
  },

  on(key, callback) {
    if (!this._listeners.has(key)) this._listeners.set(key, []);
    this._listeners.get(key).push(callback);
    return () => {
      const arr = this._listeners.get(key);
      const idx = arr.indexOf(callback);
      if (idx > -1) arr.splice(idx, 1);
    };
  },

  _notify(key, value, old) {
    (this._listeners.get(key) || []).forEach(cb => cb(value, old));
  }
};

/**
 * DiseaseContext - 病种上下文工具
 * 提供当前病种的完整专属数据，各模块通过此工具读取并动态渲染
 */
const DiseaseContext = {
  // ========== 每个病种的完整专属数据 ==========
  _diseaseData: {
    'disease1': { // 冠心病 / 急性心肌梗死
      id:'disease1', name:'冠心病 / 急性心肌梗死', dept:'心血管内科', patientCount:1256, icon:'心', code:'DE-AMI-001',
      datasets:[
        {name:'AMI标准数据集 v3.2',items:156,status:'已发布',version:'v3.2',updated:'2026-06-20',standard:'国标'},
        {name:'冠脉造影数据集',items:48,status:'已发布',version:'v2.1',updated:'2026-05-15',standard:'行标'},
        {name:'PCI术后随访数据集',items:32,status:'审核中',version:'v1.0',updated:'2026-06-10',standard:'院标'},
        {name:'心肌标志物检验数据集',items:24,status:'已发布',version:'v2.0',updated:'2026-04-22',standard:'国标'}
      ],
      templates:[
        {name:'AMI入院记录模板',fields:56,status:'已发布',version:'v2.1'},
        {name:'冠脉造影报告模板',fields:28,status:'已发布',version:'v1.5'},
        {name:'PCI手术记录模板',fields:35,status:'已发布',version:'v2.0'},
        {name:'出院小结模板',fields:42,status:'已发布',version:'v1.8'},
        {name:'30天随访CRF',fields:22,status:'审核中',version:'v1.0'}
      ],
      scales:[
        {name:'GRACE评分',type:'风险评估',items:8,status:'启用'},
        {name:'TIMI评分',type:'风险评估',items:7,status:'启用'},
        {name:'Killip分级',type:'心功能',items:4,status:'启用'},
        {name:'SYNTAX评分',type:'病变评估',items:3,status:'启用'}
      ],
      pathways:[
        {name:'AMI急诊PCI路径',nodes:12,compliance:94.2,status:'运行中',updated:'2026-06-18'},
        {name:'AMI溶栓治疗路径',nodes:10,compliance:88.5,status:'运行中',updated:'2026-05-20'},
        {name:'冠心病二级预防路径',nodes:8,compliance:91.3,status:'运行中',updated:'2026-06-01'}
      ],
      cohorts:[
        {name:'AMI临床研究队列',patients:3456,crf:8,completeness:92.1,pi:'张主任',status:'进行中'},
        {name:'PCI术后长期随访队列',patients:1234,crf:5,completeness:88.7,pi:'李主任',status:'进行中'}
      ],
      qualityRules:[
        {name:'D-to-B时间 ≤90min',type:'时效',compliance:94.2,target:90,status:'达标'},
        {name:'入院24h内完成心电图',type:'时效',compliance:98.5,target:100,status:'达标'},
        {name:'出院带药含他汀',type:'用药',compliance:96.8,target:95,status:'达标'},
        {name:'PCI术后24h心脏超声',type:'检查',compliance:87.3,target:90,status:'预警'}
      ],
      patientSamples:[
        {id:'P20260001',name:'王建国',age:62,gender:'男',admit:'2026-06-20',diagnosis:'急性ST段抬高型心肌梗死',status:'在院'},
        {id:'P20260015',name:'李志强',age:55,gender:'男',admit:'2026-06-18',diagnosis:'不稳定型心绞痛',status:'出院'},
        {id:'P20260028',name:'赵秀兰',age:71,gender:'女',admit:'2026-06-22',diagnosis:'NSTEMI',status:'在院'}
      ]
    },
    'disease2': { // 高血压
      id:'disease2', name:'高血压', dept:'心血管内科', patientCount:865, icon:'心', code:'DE-HYP-001',
      datasets:[
        {name:'高血压标准数据集 v2.1',items:92,status:'已发布',version:'v2.1',updated:'2026-05-28',standard:'国标'},
        {name:'动态血压监测数据集',items:18,status:'已发布',version:'v1.3',updated:'2026-04-15',standard:'行标'},
        {name:'高血压合并症数据集',items:36,status:'审核中',version:'v1.0',updated:'2026-06-05',standard:'院标'}
      ],
      templates:[
        {name:'高血压专病门诊记录',fields:38,status:'已发布',version:'v1.5'},
        {name:'动态血压报告模板',fields:22,status:'已发布',version:'v1.2'},
        {name:'高血压随访记录',fields:28,status:'已发布',version:'v1.0'}
      ],
      scales:[
        {name:'心血管风险分层',type:'风险评估',items:5,status:'启用'},
        {name:'靶器官损害评估',type:'器官评估',items:6,status:'启用'}
      ],
      pathways:[
        {name:'高血压初始治疗路径',nodes:6,compliance:91.5,status:'运行中',updated:'2026-06-10'},
        {name:'难治性高血压路径',nodes:8,compliance:85.2,status:'运行中',updated:'2026-05-25'}
      ],
      cohorts:[
        {name:'高血压队列研究',patients:865,crf:4,completeness:89.3,pi:'王主任',status:'进行中'}
      ],
      qualityRules:[
        {name:'首诊测血压率100%',type:'检查',compliance:99.2,target:100,status:'达标'},
        {name:'血压达标率≥60%',type:'疗效',compliance:65.8,target:60,status:'达标'},
        {name:'低危患者3月随访',type:'随访',compliance:78.4,target:85,status:'预警'}
      ],
      patientSamples:[
        {id:'P20260033',name:'陈明华',age:48,gender:'男',admit:'2026-06-15',diagnosis:'原发性高血压3级',status:'门诊'},
        {id:'P20260041',name:'刘淑芬',age:56,gender:'女',admit:'2026-06-20',diagnosis:'高血压合并糖尿病',status:'在院'}
      ]
    },
    'disease3': { // 脑梗死
      id:'disease3', name:'脑梗死', dept:'神经内科', patientCount:987, icon:'脑', code:'DE-CBI-001',
      datasets:[
        {name:'脑梗死标准数据集 v3.0',items:138,status:'已发布',version:'v3.0',updated:'2026-06-15',standard:'国标'},
        {name:'NIHSS评分数据集',items:15,status:'已发布',version:'v2.0',updated:'2026-05-10',standard:'行标'},
        {name:'脑血管影像数据集',items:42,status:'审核中',version:'v1.2',updated:'2026-06-08',standard:'院标'}
      ],
      templates:[
        {name:'脑梗死入院记录',fields:48,status:'已发布',version:'v2.0'},
        {name:'溶栓治疗记录',fields:32,status:'已发布',version:'v1.5'},
        {name:'NIHSS评估记录',fields:15,status:'已发布',version:'v2.0'},
        {name:'出院康复计划',fields:26,status:'已发布',version:'v1.3'}
      ],
      scales:[
        {name:'NIHSS评分',type:'神经功能',items:15,status:'启用'},
        {name:'mRS评分',type:'功能预后',items:6,status:'启用'},
        {name:'Barthel指数',type:'日常生活',items:10,status:'启用'}
      ],
      pathways:[
        {name:'急性脑梗死溶栓路径',nodes:10,compliance:92.1,status:'运行中',updated:'2026-06-12'},
        {name:'脑梗死康复治疗路径',nodes:12,compliance:87.6,status:'运行中',updated:'2026-05-30'}
      ],
      cohorts:[
        {name:'脑梗死预后研究队列',patients:2178,crf:6,completeness:88.5,pi:'李主任',status:'进行中'}
      ],
      qualityRules:[
        {name:'DNT时间 ≤60min',type:'时效',compliance:89.3,target:85,status:'达标'},
        {name:'入院24h内NIHSS评估',type:'评估',compliance:95.6,target:95,status:'达标'},
        {name:'出院带药含抗血小板',type:'用药',compliance:97.2,target:95,status:'达标'}
      ],
      patientSamples:[
        {id:'P20260050',name:'周大明',age:68,gender:'男',admit:'2026-06-21',diagnosis:'急性脑梗死(左侧大脑中动脉)',status:'在院'},
        {id:'P20260062',name:'吴桂芳',age:72,gender:'女',admit:'2026-06-19',diagnosis:'腔隙性脑梗死',status:'出院'}
      ]
    },
    'disease4': { id:'disease4', name:'脑出血', dept:'神经外科', patientCount:345, icon:'脑', code:'DE-CBH-001',
      datasets:[{name:'脑出血标准数据集',items:115,status:'已发布',version:'v2.0',updated:'2026-05-20',standard:'国标'}],
      templates:[{name:'脑出血入院记录',fields:42,status:'已发布',version:'v1.5'},{name:'手术记录模板',fields:35,status:'已发布',version:'v1.2'}],
      scales:[{name:'GCS评分',type:'意识评估',items:3,status:'启用'},{name:'ICH评分',type:'预后评估',items:5,status:'启用'}],
      pathways:[{name:'脑出血急诊处理路径',nodes:8,compliance:90.1,status:'运行中',updated:'2026-06-05'}],
      cohorts:[{name:'脑出血队列研究',patients:345,crf:4,completeness:85.3,pi:'赵主任',status:'进行中'}],
      qualityRules:[{name:'入院1h内CT完成率',type:'时效',compliance:96.5,target:95,status:'达标'}],
      patientSamples:[{id:'P20260070',name:'孙国强',age:58,gender:'男',admit:'2026-06-23',diagnosis:'基底节区脑出血',status:'在院'}]
    },
    'disease5': { id:'disease5', name:'动脉瘤', dept:'神经外科', patientCount:234, icon:'脑', code:'DE-ANE-001',
      datasets:[{name:'颅内动脉瘤数据集',items:86,status:'已发布',version:'v1.5',updated:'2026-04-18',standard:'行标'}],
      templates:[{name:'动脉瘤介入记录',fields:30,status:'已发布',version:'v1.2'}],
      scales:[{name:'Hunt-Hess分级',type:'临床分级',items:5,status:'启用'}],
      pathways:[{name:'动脉瘤介入治疗路径',nodes:8,compliance:88.9,status:'运行中',updated:'2026-05-15'}],
      cohorts:[{name:'动脉瘤介入队列',patients:234,crf:3,completeness:82.1,pi:'钱主任',status:'进行中'}],
      qualityRules:[{name:'术前DSA完成率',type:'检查',compliance:98.2,target:100,status:'达标'}],
      patientSamples:[{id:'P20260075',name:'马晓峰',age:52,gender:'男',admit:'2026-06-22',diagnosis:'前交通动脉瘤',status:'术后'}]
    },
    'disease6': { id:'disease6', name:'结肠癌', dept:'结直肠外科', patientCount:456, icon:'瘤', code:'DE-CCA-001',
      datasets:[{name:'结肠癌标准数据集 v2.1',items:98,status:'已发布',version:'v2.1',updated:'2026-06-01',standard:'国标'},{name:'术后病理数据集',items:28,status:'已发布',version:'v1.0',updated:'2026-05-10',standard:'行标'}],
      templates:[{name:'结肠癌手术记录',fields:38,status:'已发布',version:'v1.8'},{name:'化疗方案记录',fields:24,status:'已发布',version:'v1.3'},{name:'术后随访CRF',fields:20,status:'审核中',version:'v1.0'}],
      scales:[{name:'TNM分期',type:'病理分期',items:4,status:'启用'},{name:'ECOG评分',type:'体能状态',items:5,status:'启用'}],
      pathways:[{name:'结肠癌根治术路径',nodes:10,compliance:93.5,status:'运行中',updated:'2026-06-08'},{name:'辅助化疗路径',nodes:6,compliance:89.2,status:'运行中',updated:'2026-05-20'}],
      cohorts:[{name:'结肠癌术后随访队列',patients:1567,crf:5,completeness:85.3,pi:'王主任',status:'进行中'}],
      qualityRules:[{name:'术前TNM分期完成率',type:'评估',compliance:95.8,target:95,status:'达标'},{name:'术后30天随访率',type:'随访',compliance:82.3,target:85,status:'预警'}],
      patientSamples:[{id:'P20260080',name:'杨秀英',age:65,gender:'女',admit:'2026-06-18',diagnosis:'结肠癌(乙状结肠) cT3N1M0',status:'化疗中'}]
    },
    'disease8': { id:'disease8', name:'膝关节', dept:'骨科', patientCount:456, icon:'骨', code:'DE-KNE-001',
      datasets:[{name:'膝关节置换数据集',items:90,status:'已发布',version:'v2.0',updated:'2026-05-25',standard:'行标'}],
      templates:[{name:'膝关节置换手术记录',fields:32,status:'已发布',version:'v1.5'},{name:'术后康复评估',fields:18,status:'已发布',version:'v1.2'}],
      scales:[{name:'KSS评分',type:'功能评估',items:8,status:'启用'},{name:'VAS疼痛评分',type:'疼痛',items:1,status:'启用'}],
      pathways:[{name:'膝关节置换临床路径',nodes:10,compliance:92.8,status:'运行中',updated:'2026-06-05'}],
      cohorts:[{name:'膝关节置换疗效队列',patients:456,crf:4,completeness:91.2,pi:'孙主任',status:'进行中'}],
      qualityRules:[{name:'术后24h下地活动率',type:'康复',compliance:88.5,target:85,status:'达标'}],
      patientSamples:[{id:'P20260085',name:'张淑珍',age:68,gender:'女',admit:'2026-06-20',diagnosis:'双膝骨关节炎',status:'术后'}]
    },
    'disease9': { id:'disease9', name:'髋关节', dept:'骨科', patientCount:345, icon:'骨', code:'DE-HIP-001',
      datasets:[{name:'髋关节置换数据集',items:86,status:'已发布',version:'v2.0',updated:'2026-05-28',standard:'行标'}],
      templates:[{name:'髋关节置换手术记录',fields:34,status:'已发布',version:'v1.5'}],
      scales:[{name:'Harris评分',type:'功能评估',items:10,status:'启用'}],
      pathways:[{name:'髋关节置换临床路径',nodes:10,compliance:93.8,status:'运行中',updated:'2026-06-10'}],
      cohorts:[{name:'髋关节置换疗效研究',patients:890,crf:4,completeness:93.8,pi:'赵主任',status:'进行中'}],
      qualityRules:[{name:'术后48h下地活动率',type:'康复',compliance:91.2,target:90,status:'达标'}],
      patientSamples:[{id:'P20260090',name:'刘德财',age:72,gender:'男',admit:'2026-06-19',diagnosis:'股骨头坏死(左)',status:'术后'}]
    },
    'disease10': { id:'disease10', name:'肿瘤术后同位素治疗', dept:'核医学科', patientCount:234, icon:'核', code:'DE-NMT-001',
      datasets:[{name:'同位素治疗数据集',items:45,status:'已发布',version:'v1.0',updated:'2026-04-20',standard:'院标'}],
      templates:[{name:'同位素治疗记录',fields:20,status:'已发布',version:'v1.0'}],
      scales:[{name:'RECIST评价',type:'疗效评估',items:4,status:'启用'}],
      pathways:[{name:'碘131治疗路径',nodes:6,compliance:87.5,status:'运行中',updated:'2026-05-10'}],
      cohorts:[{name:'碘131治疗随访队列',patients:234,crf:3,completeness:80.2,pi:'周主任',status:'进行中'}],
      qualityRules:[{name:'治疗前评估完成率',type:'评估',compliance:95.0,target:95,status:'达标'}],
      patientSamples:[{id:'P20260095',name:'何建平',age:45,gender:'男',admit:'2026-06-17',diagnosis:'甲状腺癌术后碘131治疗',status:'治疗中'}]
    },
    'disease11': { id:'disease11', name:'肾癌', dept:'泌尿外科', patientCount:123, icon:'肾', code:'DE-RCC-001',
      datasets:[{name:'肾癌手术数据集',items:72,status:'已发布',version:'v1.5',updated:'2026-05-15',standard:'行标'}],
      templates:[{name:'肾癌手术记录',fields:28,status:'已发布',version:'v1.2'}],
      scales:[{name:'Fuhrman分级',type:'病理分级',items:4,status:'启用'}],
      pathways:[{name:'肾癌根治术路径',nodes:8,compliance:90.5,status:'运行中',updated:'2026-06-01'}],
      cohorts:[{name:'肾癌术后随访队列',patients:123,crf:3,completeness:84.5,pi:'钱主任',status:'进行中'}],
      qualityRules:[{name:'术前影像分期完成率',type:'评估',compliance:97.5,target:95,status:'达标'}],
      patientSamples:[{id:'P20260100',name:'高建明',age:58,gender:'男',admit:'2026-06-21',diagnosis:'右肾透明细胞癌 cT1bN0M0',status:'术前'}]
    },
    'disease12': { id:'disease12', name:'前列腺癌', dept:'泌尿外科', patientCount:156, icon:'肾', code:'DE-PRC-001',
      datasets:[{name:'前列腺癌数据集',items:78,status:'已发布',version:'v1.3',updated:'2026-05-20',standard:'行标'}],
      templates:[{name:'前列腺穿刺记录',fields:18,status:'已发布',version:'v1.0'}],
      scales:[{name:'Gleason评分',type:'病理分级',items:3,status:'启用'}],
      pathways:[{name:'前列腺癌根治术路径',nodes:8,compliance:88.2,status:'运行中',updated:'2026-05-28'}],
      cohorts:[{name:'前列腺癌队列',patients:156,crf:3,completeness:82.8,pi:'孙主任',status:'进行中'}],
      qualityRules:[{name:'PSA筛查率',type:'筛查',compliance:76.5,target:80,status:'预警'}],
      patientSamples:[{id:'P20260105',name:'赵国栋',age:66,gender:'男',admit:'2026-06-18',diagnosis:'前列腺癌 cT2aN0M0',status:'评估中'}]
    },
    'disease13': { id:'disease13', name:'尿路上皮癌', dept:'泌尿外科', patientCount:98, icon:'肾', code:'DE-UC-001',
      datasets:[{name:'尿路上皮癌数据集',items:56,status:'审核中',version:'v1.0',updated:'2026-06-05',standard:'院标'}],
      templates:[{name:'膀胱癌手术记录',fields:24,status:'已发布',version:'v1.0'}],
      scales:[{name:'WHO分级',type:'病理分级',items:3,status:'启用'}],
      pathways:[{name:'膀胱癌电切路径',nodes:6,compliance:85.3,status:'运行中',updated:'2026-05-15'}],
      cohorts:[{name:'膀胱癌随访队列',patients:98,crf:2,completeness:78.5,pi:'周主任',status:'进行中'}],
      qualityRules:[{name:'术后膀胱灌注率',type:'治疗',compliance:92.0,target:90,status:'达标'}],
      patientSamples:[{id:'P20260110',name:'林志远',age:61,gender:'男',admit:'2026-06-20',diagnosis:'膀胱尿路上皮癌',status:'术后'}]
    },
    'disease14': { id:'disease14', name:'心肌病', dept:'心血管内科', patientCount:345, icon:'心', code:'DE-CMY-001',
      datasets:[{name:'心肌病数据集',items:120,status:'已发布',version:'v1.5',updated:'2026-05-30',standard:'行标'}],
      templates:[{name:'心肌病评估记录',fields:32,status:'已发布',version:'v1.2'}],
      scales:[{name:'NYHA心功能分级',type:'心功能',items:4,status:'启用'}],
      pathways:[{name:'心肌病诊断路径',nodes:6,compliance:89.5,status:'运行中',updated:'2026-06-08'}],
      cohorts:[{name:'心肌病队列',patients:345,crf:4,completeness:86.2,pi:'张主任',status:'进行中'}],
      qualityRules:[{name:'心脏MRI完成率',type:'检查',compliance:82.3,target:85,status:'预警'}],
      patientSamples:[{id:'P20260115',name:'王秀梅',age:42,gender:'女',admit:'2026-06-19',diagnosis:'扩张型心肌病',status:'在院'}]
    },
    'disease15': { id:'disease15', name:'心力衰竭', dept:'心血管内科', patientCount:567, icon:'心', code:'DE-HF-001',
      datasets:[{name:'心衰标准数据集',items:108,status:'已发布',version:'v2.0',updated:'2026-06-05',standard:'国标'}],
      templates:[{name:'心衰入院评估',fields:36,status:'已发布',version:'v1.5'},{name:'容量管理记录',fields:18,status:'已发布',version:'v1.0'}],
      scales:[{name:'NYHA心功能分级',type:'心功能',items:4,status:'启用'},{name:'6分钟步行试验',type:'功能',items:3,status:'启用'}],
      pathways:[{name:'急性心衰救治路径',nodes:10,compliance:91.8,status:'运行中',updated:'2026-06-12'}],
      cohorts:[{name:'心衰长期管理队列',patients:567,crf:5,completeness:87.5,pi:'李主任',status:'进行中'}],
      qualityRules:[{name:'出院前LVEF评估率',type:'评估',compliance:93.2,target:90,status:'达标'},{name:'30天再入院率<10%',type:'疗效',compliance:8.5,target:10,status:'达标'}],
      patientSamples:[{id:'P20260120',name:'张福贵',age:75,gender:'男',admit:'2026-06-22',diagnosis:'慢性心力衰竭急性加重',status:'在院'}]
    },
    'disease16': { id:'disease16', name:'心律失常（房颤）', dept:'心血管内科', patientCount:456, icon:'心', code:'DE-AF-001',
      datasets:[{name:'房颤数据集',items:86,status:'已发布',version:'v1.5',updated:'2026-05-25',standard:'行标'}],
      templates:[{name:'房颤消融记录',fields:28,status:'已发布',version:'v1.2'}],
      scales:[{name:'CHA2DS2-VASc评分',type:'栓塞风险',items:8,status:'启用'},{name:'HAS-BLED评分',type:'出血风险',items:7,status:'启用'}],
      pathways:[{name:'房颤消融治疗路径',nodes:8,compliance:90.5,status:'运行中',updated:'2026-06-08'}],
      cohorts:[{name:'房颤消融随访队列',patients:456,crf:4,completeness:85.8,pi:'王主任',status:'进行中'}],
      qualityRules:[{name:'抗凝治疗率(高危)',type:'用药',compliance:88.5,target:90,status:'预警'}],
      patientSamples:[{id:'P20260125',name:'陈志国',age:63,gender:'男',admit:'2026-06-20',diagnosis:'阵发性心房颤动',status:'术前'}]
    },
    'disease17': { id:'disease17', name:'起搏治疗相关疾病', dept:'心血管内科', patientCount:234, icon:'心', code:'DE-PGM-001',
      datasets:[{name:'起搏器植入数据集',items:72,status:'已发布',version:'v1.0',updated:'2026-04-28',standard:'院标'}],
      templates:[{name:'起搏器植入记录',fields:22,status:'已发布',version:'v1.0'}],
      scales:[{name:'起搏器程控评估',type:'设备评估',items:5,status:'启用'}],
      pathways:[{name:'永久起搏器植入路径',nodes:6,compliance:92.0,status:'运行中',updated:'2026-05-20'}],
      cohorts:[{name:'起搏器随访队列',patients:234,crf:3,completeness:90.1,pi:'赵主任',status:'进行中'}],
      qualityRules:[{name:'术后1月程控率',type:'随访',compliance:94.5,target:95,status:'预警'}],
      patientSamples:[{id:'P20260130',name:'刘玉兰',age:78,gender:'女',admit:'2026-06-18',diagnosis:'病态窦房结综合征',status:'术后'}]
    },
    'disease18': { id:'disease18', name:'心脏瓣膜病', dept:'心血管内科', patientCount:345, icon:'心', code:'DE-VHD-001',
      datasets:[{name:'瓣膜病数据集',items:95,status:'已发布',version:'v1.5',updated:'2026-06-01',standard:'行标'}],
      templates:[{name:'瓣膜置换手术记录',fields:36,status:'已发布',version:'v1.3'}],
      scales:[{name:'超声心动图评估',type:'影像评估',items:8,status:'启用'}],
      pathways:[{name:'TAVR介入路径',nodes:10,compliance:88.5,status:'运行中',updated:'2026-06-05'}],
      cohorts:[{name:'瓣膜病队列',patients:345,crf:4,completeness:86.5,pi:'钱主任',status:'进行中'}],
      qualityRules:[{name:'术前超声评估完成率',type:'检查',compliance:98.5,target:98,status:'达标'}],
      patientSamples:[{id:'P20260135',name:'赵德胜',age:70,gender:'男',admit:'2026-06-21',diagnosis:'重度主动脉瓣狭窄',status:'评估中'}]
    },
    'disease19': { id:'disease19', name:'肺动脉高压', dept:'心血管内科', patientCount:123, icon:'肺', code:'DE-PAH-001',
      datasets:[{name:'肺动脉高压数据集',items:56,status:'审核中',version:'v1.0',updated:'2026-06-08',standard:'院标'}],
      templates:[{name:'右心导管记录',fields:20,status:'已发布',version:'v1.0'}],
      scales:[{name:'WHO功能分级',type:'功能',items:4,status:'启用'}],
      pathways:[{name:'肺高压诊断路径',nodes:6,compliance:82.5,status:'运行中',updated:'2026-05-28'}],
      cohorts:[{name:'肺高压队列',patients:123,crf:3,completeness:78.2,pi:'李主任',status:'进行中'}],
      qualityRules:[{name:'右心导管检查率',type:'检查',compliance:75.0,target:80,status:'预警'}],
      patientSamples:[{id:'P20260140',name:'孙丽华',age:38,gender:'女',admit:'2026-06-19',diagnosis:'特发性肺动脉高压',status:'在院'}]
    },
    'disease20': { id:'disease20', name:'先天性心脏病', dept:'心血管内科', patientCount:156, icon:'心', code:'DE-CHD-001',
      datasets:[{name:'先心病数据集',items:78,status:'已发布',version:'v1.2',updated:'2026-05-15',standard:'行标'}],
      templates:[{name:'先心病介入记录',fields:26,status:'已发布',version:'v1.0'}],
      scales:[{name:'先心病风险分层',type:'风险评估',items:5,status:'启用'}],
      pathways:[{name:'先心病介入封堵路径',nodes:6,compliance:91.0,status:'运行中',updated:'2026-06-02'}],
      cohorts:[{name:'先心病队列',patients:156,crf:3,completeness:84.5,pi:'周主任',status:'进行中'}],
      qualityRules:[{name:'术后心脏超声复查率',type:'随访',compliance:90.5,target:90,status:'达标'}],
      patientSamples:[{id:'P20260145',name:'李小明',age:28,gender:'男',admit:'2026-06-20',diagnosis:'房间隔缺损',status:'术前'}]
    }
  },

  // 获取当前选中的病种对象
  get() {
    if (typeof DiseaseSwitcher !== 'undefined' && DiseaseSwitcher.state.selectedDisease) {
      return DiseaseSwitcher.state.selectedDisease;
    }
    return AppState.get('selectedDisease') || this._diseaseData['disease1'];
  },

  // 获取当前病种的完整数据（含各模块专属数据）
  getData() {
    var id = this.getId();
    return this._diseaseData[id] || this._diseaseData['disease1'];
  },

  // 便捷方法
  getName() { return this.get().name || '未知病种'; },
  getDept() { return this.get().dept || ''; },
  getPatientCount() { return this.get().patientCount || 0; },
  getIcon() { return this.get().icon || '病'; },
  getId() { return this.get().id || 'disease1'; },
  getCode() { return this.getData().code || ''; },

  // 获取各模块专属数据
  getDatasets() { return this.getData().datasets || []; },
  getTemplates() { return this.getData().templates || []; },
  getScales() { return this.getData().scales || []; },
  getPathways() { return this.getData().pathways || []; },
  getCohorts() { return this.getData().cohorts || []; },
  getQualityRules() { return this.getData().qualityRules || []; },
  getPatientSamples() { return this.getData().patientSamples || []; },

  // 生成统计数据
  getStats() {
    var d = this.get();
    var data = this.getData();
    var seed = d.name.length * 7;
    return {
      patientCount: d.patientCount,
      templateCount: data.templates ? data.templates.length : Math.floor(d.patientCount * 0.05) + 3,
      scaleCount: data.scales ? data.scales.length : Math.floor(d.patientCount * 0.03) + 2,
      elementCount: Math.floor(d.patientCount * 0.12) + 20,
      datasetCount: data.datasets ? data.datasets.length : 3,
      pathwayCount: data.pathways ? data.pathways.length : Math.floor(d.patientCount * 0.003) + 1,
      cohortCount: data.cohorts ? data.cohorts.length : 1,
      completionRate: (80 + (seed % 15)).toFixed(1) + '%',
      avgStayDays: (5 + (seed % 8)).toFixed(1),
      monthlyCount: Math.floor(d.patientCount * (0.08 + (seed % 5) * 0.02))
    };
  }
};
