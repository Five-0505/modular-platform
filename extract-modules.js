/**
 * 模块提取脚本
 * 从单体 HTML 文件中提取各页面模块为独立 HTML 文件
 */
const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================
const SOURCE_FILE = path.resolve(__dirname, '..', '专科一体化管理平台-最终版.html');
const OUTPUT_DIR = path.resolve(__dirname, 'modules');

// 页面 ID -> 输出路径映射
const PAGE_MAP = {
  'page-workbench': 'workbench.html',
  'page-diseases': 'diseases.html',
  'page-disease-detail': 'disease-detail.html',
  'page-data-center-datasets': 'data-center/datasets.html',
  'page-data-center-rdr': 'data-center/rdr.html',
  'page-data-center-metadata': 'data-center/metadata.html',
  'page-data-center-ai': 'data-center/ai-governance.html',
  'page-data-center-standards': 'data-center/standards.html',
  'page-knowledge-disease': 'knowledge/disease.html',
  'page-knowledge-graph': 'knowledge/graph.html',
  'page-knowledge-contraindication': 'knowledge/contraindication.html',
  'page-records-templates': 'records/templates.html',
  'page-records-scales': 'records/scales.html',
  'page-records-elements': 'records/elements.html',
  'page-pathways': 'pathways.html',
  'page-quality-rules': 'quality/rules.html',
  'page-quality-dispatch': 'quality/dispatch.html',
  'page-quality-dept': 'quality/dept.html',
  'page-quality-emr': 'quality/emr.html',
  'page-quality-disease': 'quality/disease.html',
  'page-quality-timeliness': 'quality/timeliness.html',
  'page-research-overview': 'research/overview.html',
  'page-research-distribution': 'research/distribution.html',
  'page-research-audit': 'research/audit.html',
  'page-research-data': 'research/data.html',
  'page-research-process': 'research/process.html',
  'page-research-analysis': 'research/analysis.html',
  'page-research-ai': 'research/ai.html',
  'page-research-cohort': 'research/cohort.html',
  'page-research-crf': 'research/crf.html',
  'page-ai-monitor': 'ai/monitor.html',
  'page-ai-config': 'ai/config.html',
  'page-ai-prompt': 'ai/prompt.html',
  'page-patients-preconsult': 'patients/preconsult.html',
  'page-patients-records': 'patients/records.html',
  'page-patients-followup': 'patients/followup.html',
};

// ==================== 工具函数 ====================

/**
 * 确保目录存在
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 修复 HTML 实体编码问题
 */
function fixEncoding(text) {
  return text
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ');
}

/**
 * 从 HTML 行中提取指定属性值
 */
function extractAttr(line, attrName) {
  const regex = new RegExp(`${attrName}\\s*=\\s*["']([^"']+)["']`);
  const match = line.match(regex);
  return match ? match[1] : null;
}

/**
 * 在给定的行范围内，从指定行开始提取一个完整的 div 块
 * 返回该 div 的起始行索引和结束行索引（含）
 */
function extractDivRange(lines, startLineIdx) {
  let depth = 0;
  let found = false;
  for (let i = startLineIdx; i < lines.length; i++) {
    const line = lines[i];

    // 匹配开标签 <div...> — 但不匹配自闭合或注释中的 div
    const openMatches = line.match(/<div\b[^>]*>/gi) || [];
    const closeMatches = line.match(/<\/div>/gi) || [];

    // 也要排除注释中的标签
    const openCount = openMatches.length;
    const closeCount = closeMatches.length;

    depth += openCount;
    depth -= closeCount;

    if (depth === 0 && found) {
      return { startIdx: startLineIdx, endIdx: i };
    }

    if (openCount > 0) found = true;
  }

  // 如果没找到闭合，返回到文件末尾
  return { startIdx: startLineIdx, endIdx: lines.length - 1 };
}

// ==================== 主逻辑 ====================

function main() {
  console.log('========================================');
  console.log('  HTML 模块提取工具');
  console.log('========================================');
  console.log('');

  // 1. 读取源文件
  console.log(`[1/3] 读取源文件: ${SOURCE_FILE}`);
  if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`错误: 源文件不存在: ${SOURCE_FILE}`);
    process.exit(1);
  }
  const content = fs.readFileSync(SOURCE_FILE, 'utf-8');
  const lines = content.split('\n');
  console.log(`  总行数: ${lines.length}`);
  console.log('');

  // 2. 确保输出目录存在
  console.log(`[2/3] 准备输出目录: ${OUTPUT_DIR}`);
  ensureDir(OUTPUT_DIR);
  console.log('  输出目录已就绪');
  console.log('');

  // 3. 逐个提取模块
  console.log('[3/3] 开始提取模块...');
  console.log('');

  let successCount = 0;
  let errorList = [];

  for (const [pageId, outputPath] of Object.entries(PAGE_MAP)) {
    try {
      const fullPath = path.join(OUTPUT_DIR, outputPath);

      // 在所有行中搜索这个页面的起始 div
      let startLineIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(`id="${pageId}"`) && lines[i].includes('<div')) {
          startLineIdx = i;
          break;
        }
      }

      if (startLineIdx === -1) {
        console.log(`  [跳过] ${pageId}: 未找到起始标签`);
        errorList.push({ pageId, error: '未找到起始标签' });
        continue;
      }

      // 提取完整的 div 块
      const { startIdx, endIdx } = extractDivRange(lines, startLineIdx);

      // 获取 div 内容（去掉首行的开标签和末行的闭标签）
      // 首行: <div class="page ...">
      const firstLine = lines[startIdx];
      // 末行: </div>
      let contentLines;

      if (endIdx === startIdx) {
        // 单行 div（不太可能但处理一下）
        contentLines = '';
      } else {
        // 提取中间内容行
        const innerLines = lines.slice(startIdx + 1, endIdx);

        // 在首行中找到开标签的结束位置（>），取后面的内容
        const tagEndMatch = firstLine.match(/<div[^>]*>(.*)/);
        let prefix = '';
        if (tagEndMatch && tagEndMatch[1].trim()) {
          prefix = tagEndMatch[1];
        }

        // 在末行中找到闭标签前面的内容
        const tagStartMatch = lines[endIdx].match(/(.*)<\/div>/);
        let suffix = '';
        if (tagStartMatch && tagStartMatch[1].trim()) {
          suffix = tagStartMatch[1];
        }

        contentLines = [prefix, ...innerLines, suffix]
          .join('\n');
      }

      // 清理编码问题
      let cleanContent = fixEncoding(contentLines);

      // 添加 data-module-id 标识属性（包裹在带属性的注释和包装 div 中）
      // 我们将内容包装在一个 <div data-module-id="pageId"> 中
      const wrappedContent = `<div data-module-id="${pageId}">\n${cleanContent}\n</div>`;

      // 确保输出子目录存在
      const outputDir = path.dirname(fullPath);
      ensureDir(outputDir);

      // 写入文件
      fs.writeFileSync(fullPath, wrappedContent, 'utf-8');

      const lineCount = (wrappedContent.match(/\n/g) || []).length;
      console.log(`  [OK] ${pageId}`);
      console.log(`       -> ${outputPath}`);
      console.log(`       行数: ~${lineCount + 1}, 字节: ${Buffer.byteLength(wrappedContent, 'utf-8')}`);

      successCount++;
    } catch (err) {
      console.log(`  [错误] ${pageId}: ${err.message}`);
      errorList.push({ pageId, error: err.message });
    }
  }

  // 报告
  console.log('');
  console.log('========================================');
  console.log('  提取完成');
  console.log('========================================');
  console.log(`  成功: ${successCount} 个模块`);
  if (errorList.length > 0) {
    console.log(`  失败: ${errorList.length} 个模块`);
    errorList.forEach(e => console.log(`    - ${e.pageId}: ${e.error}`));
  }
  console.log(`  输出目录: ${OUTPUT_DIR}`);
  console.log('');

  // 列出创建的文件
  console.log('  创建的文件:');
  function listFiles(dir, prefix) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        console.log(`  ${prefix}${entry.name}/`);
        listFiles(fullPath, prefix + '  ');
      } else {
        const stat = fs.statSync(fullPath);
        console.log(`  ${prefix}${entry.name}  (${stat.size} bytes)`);
      }
    }
  }
  listFiles(OUTPUT_DIR, '    ');
}

main();
