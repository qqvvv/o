/**
 * 改进的动态库加载器 v2.3.0
 * 
 * 重大变更：
 * ✅ 移除 candidates 相关逻辑（不再做大小写猜测）
 * ✅ 预设表改为正则匹配（更灵活）
 * ✅ 数据格式统一为数组（支持查询参数）
 * ✅ 不兼容旧对象格式（便于未来文本数据适配）
 * ✅ CSS 加载简化（仅用 link，不需导出名）
 */

import { DebugLogger } from './debug-logger.js';

/**
 * 库导出名预设规则表
 * 使用正则匹配，优先级从高到低
 */
const LIBRARY_RULES = [
    // jQuery 生态
    { pattern: /^jquery/i, exportName: 'jQuery', type: 'js' },
    { pattern: /^popper/i, exportName: 'Popper', type: 'js' },

    // Bootstrap
    { pattern: /^bootstrap/i, exportName: 'bootstrap', type: 'both' },

    // 图表库
    { pattern: /^chart\.?js/i, exportName: 'Chart', type: 'js' },
    { pattern: /^echarts/i, exportName: 'echarts', type: 'js' },

    // 代码高亮
    { pattern: /^highlight\.?js/i, exportName: 'hljs', type: 'js' },
    { pattern: /^prism(js)?/i, exportName: 'Prism', type: 'both' },

    // 工具库
    { pattern: /^lodash/i, exportName: '_', type: 'js' },
    { pattern: /^underscore/i, exportName: '_', type: 'js' },
    { pattern: /^axios/i, exportName: 'axios', type: 'js' },
    { pattern: /^gsap/i, exportName: 'gsap', type: 'js' },
    { pattern: /^anime/i, exportName: 'anime', type: 'js' },
    { pattern: /^marked/i, exportName: 'marked', type: 'js' },

    // 3D 库
    { pattern: /^three(\.js)?/i, exportName: 'THREE', type: 'js' },

    // 图片加载相关
    { pattern: /imagesloaded|imageloaded|imagesload/i, exportName: 'imagesLoaded', type: 'js' },
    { pattern: /imgsfancy|imgsloadfancy|imagefancy|imgsload.*fancy/i, exportName: 'ImageLoader', type: 'js' },

    // 灯箱
    { pattern: /^fancybox/i, exportName: 'Fancybox', type: 'both' },

    // Panel 库
    { pattern: /^jspanel/i, exportName: 'jsPanel', type: 'js' },

    // 前端框架
    { pattern: /^vue/i, exportName: 'Vue', type: 'js' },
    { pattern: /^react/i, exportName: 'React', type: 'js' },

    // 时间库
    { pattern: /^moment/i, exportName: 'moment', type: 'js' },
    { pattern: /^dayjs/i, exportName: 'dayjs', type: 'js' },

    // Live2D
    { pattern: /^live2d/i, exportName: 'L2Dwidget', type: 'js' },

    // 字体图标
    { pattern: /fontawesome/i, type: 'css' },

    // CSS 文件
    { pattern: /\.css$/i, type: 'css' },
];

// ==================== 工具函数 ====================

/**
 * 从 URL 提取库名和文件名
 */
function _extractLibInfo(url) {
    try {
        const fileName = url.split('/').pop().split('?')[0];
        const libName = fileName
            .replace(/\.(min|umd|esm|pkgd)\.js$/i, '')
            .replace(/\.min\.css$/i, '')
            .replace(/\.(js|css)$/i, '')
            .toLowerCase();

        return { fileName, libName };
    } catch {
        return { fileName: url, libName: '' };
    }
}

/**
 * 根据 URL 查找对应的导出规则
 */
function _findExportRule(url) {
    const { fileName, libName } = _extractLibInfo(url);

    // 优先查表
    for (const rule of LIBRARY_RULES) {
        let matched = false;

        if (rule.pattern instanceof RegExp) {
            // 同时尝试文件名和库名
            matched = rule.pattern.test(fileName) || rule.pattern.test(libName);
        }

        if (matched) {
            return rule;
        }
    }

    return null;
}

/**
 * 从 URL 查询参数中提取 exportName
 */
function _extractExportNameFromQuery(url) {
    try {
        const urlObj = new URL(url, 'https://dummy.com');
        return urlObj.searchParams.get('exportName');
    } catch {
        return null;
    }
}

/**
 * 获取文件名
 */
function _getFileName(url) {
    try {
        return url.split('/').pop().split('?')[0];
    } catch {
        return url;
    }
}

/**
 * 获取 CDN 源标识
 */
function _extractSourceLabel(url) {
    const sourcePatterns = [
        { pattern: /esm\.sh/i, label: 'esm.sh' },
        { pattern: /unpkg\.com/i, label: 'unpkg' },
        { pattern: /cdn\.jsdelivr\.net/i, label: 'jsdelivr' },
        { pattern: /gcore\.jsdelivr\.net/i, label: 'jsdelivr(gcore)' },
        { pattern: /cdnjs\.cloudflare\.com/i, label: 'cloudflare' },
        { pattern: /cdn\.bootcdn\.cn/i, label: 'bootcdn' },
        { pattern: /lib\.baomitu\.com/i, label: 'baomitu' },
        { pattern: /cdn\.staticfile\.org/i, label: 'staticfile' },
        { pattern: /code\.jquery\.com/i, label: 'jquery' },
        { pattern: /maxcdn\.bootstrapcdn\.com/i, label: 'maxcdn' },
        { pattern: /use\.fontawesome\.com/i, label: 'fontawesome' },
    ];

    for (const { pattern, label } of sourcePatterns) {
        if (pattern.test(url)) {
            return label;
        }
    }

    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return 'unknown';
    }
}

/**
 * 检测库格式
 * 优先级：
 * 1. 如果包含 umd/pkgd → 标记为 UMD（跳过 import 尝试）
 * 2. 否则 → 默认 ESM（尝试 import）
 */
function _detectLibraryFormat(url) {
    // 明确的 UMD/PKGD 标记
    if (url.includes('umd') || url.includes('.umd.') ||
        url.includes('pkgd') || url.includes('.pkgd.')) {
        return 'umd';
    }
    
    // 默认当 ESM（符合现代开发趋势）
    return 'esm';
}

// ==================== 输入规范化 ====================

/**
 * 规范化输入数据
 * 支持格式：
 * - 单个 URL 字符串
 * - URL 数组
 * - URL 对象（{url: '...', exportName: '...'}）
 */
function _normalizeInputs(inputs) {
    let urlList = [];

    if (typeof inputs === 'string') {
        urlList = [inputs];
    } else if (Array.isArray(inputs)) {
        urlList = inputs.filter(item => {
            if (typeof item === 'string') return true;
            if (typeof item === 'object' && item?.url) return true;
            return false;
        });
    } else {
        return [];
    }

    // 转换为标准任务格式
    const tasks = [];
    const usedDomIds = new Set();

    urlList.forEach((item, index) => {
        let url, userExportName;

        if (typeof item === 'string') {
            url = item;
            userExportName = null;
        } else if (typeof item === 'object' && item.url) {
            url = item.url;
            userExportName = item.exportName || null;
        } else {
            return;
        }

        // 提取信息
        const { fileName, libName } = _extractLibInfo(url);
        const isCSS = url.match(/\.css($|\?)/i);

        // 确定导出名（JS 文件）
        let exportName = userExportName || _extractExportNameFromQuery(url);
        if (!exportName && !isCSS) {
            const rule = _findExportRule(url);
            exportName = rule?.exportName || null;
        }

        // 生成唯一的 DOM id
        let baseDomId;
        if (exportName) {
            baseDomId = `lib-${exportName}`;
        } else if (libName) {
            baseDomId = `lib-${libName}`;
        } else {
            baseDomId = `lib-auto-${index}`;
        }

        let domId = baseDomId;
        let counter = 2;
        while (usedDomIds.has(domId)) {
            domId = `${baseDomId}_${counter}`;
            counter++;
        }
        usedDomIds.add(domId);

        tasks.push({
            url,
            domId,
            exportName,
            isCSS,
            fileName,
            libName
        });
    });

    return tasks;
}

// ==================== 加载函数 ====================

/**
 * 从全局对象中提取导出的库
 */
function _extractFromGlobal(exportName, debug = false, logger = null) {
    if (!exportName) return null;

    const value = window[exportName];

    if (value !== undefined) {
        if (debug && logger) {
            logger.log(`✓ 找到全局变量: window.${exportName}`, 'success');
        }
        return value;
    }

    if (debug && logger) {
        logger.log(`✗ 未找到全局变量: window.${exportName}`, 'warn');
    }

    return null;
}

/**
 * 加载 JS 脚本
 * 策略：
 * - 非 UMD 格式 → 优先尝试 import()
 * - import() 失败 → 自动降级到 <script> 标签
 * - forceTag=true → 跳过 import，直接用 <script>
 * - UMD 格式 → 直接用 <script>（避免浪费尝试）
 */
async function _loadJS(
    url,
    domId,
    exportName,
    forceTag,
    debug = false,
    logger = null,
    startTime = null
) {
    if (debug && logger) {
        logger.log(`加载 JS: ${_getFileName(url)}`, 'log');
    }
    // 检查是否已加载
    const existing = document.querySelector(`script[data-lib-id="${domId}"]`);
    if (existing) {
        if (debug && logger) {
            logger.log(`  [已存在] 跳过`, 'log');
        }
        return exportName ? window[exportName] : true;
    }
    const format = _detectLibraryFormat(url);
    // ✅ 策略1：非 UMD 且非强制 script 标签 → 优先尝试 import()
    if (format !== 'umd' && !forceTag) {
        try {
            if (debug && logger) {
                logger.log(`  → 尝试 ESM import()`, 'log');
            }
            const module = await import(url);
            if (exportName) {
                const exported = module[exportName] || module.default || module;
                window[exportName] = exported;
            }
            if (debug && logger && startTime) {
                const duration = Math.round(performance.now() - startTime);
                logger.addTableRow(
                    _getFileName(url),
                    _extractSourceLabel(url),
                    exportName || '-',
                    'ESM',
                    duration
                );
            }
            return module;
        } catch (e) {
            // import 失败 → 降级到 <script> 标签
            if (debug && logger) {
                logger.log(`  ⚠️ ESM import 失败: ${e.message}`, 'warn');
                logger.log(`  → 降级到 <script> 标签加载`, 'log');
            }
            
            // 继续执行下面的 <script> 标签逻辑
            return _loadViaScript(
                url,
                domId,
                exportName,
                'umd',  // 降级后认为是 UMD
                debug,
                logger,
                startTime
            );
        }
    }
    // ✅ 策略2：UMD 格式或 forceTag=true → 直接用 <script> 标签
    return _loadViaScript(url, domId, exportName, format, debug, logger, startTime);
}
/**
 * 通过 <script> 标签加载（提取为单独函数，便于复用）
 */
function _loadViaScript(
    url,
    domId,
    exportName,
    format,
    debug = false,
    logger = null,
    startTime = null
) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.setAttribute('data-lib-id', domId);
        script.setAttribute('data-loader', 'referLibrary');
        script.onload = async () => {
            try {
                let result = true;
                if (exportName) {
                    const exported = _extractFromGlobal(exportName, debug, logger);
                    result = exported || window[exportName] || true;
                }
                if (debug && logger && startTime) {
                    const duration = Math.round(performance.now() - startTime);
                    logger.addTableRow(
                        _getFileName(url),
                        _extractSourceLabel(url),
                        exportName || '-',
                        format === 'umd' ? 'UMD' : 'Global',
                        duration
                    );
                }
                resolve(result);
            } catch (err) {
                console.error(`脚本处理错误: ${err.message}`);
                reject(err);
            }
        };
        script.onerror = () => {
            const error = new Error(`Failed to load: ${url}`);
            reject(error);
        };
        document.head.appendChild(script);
    });
}

/**
 * 加载 CSS 样式表
 * ✅ 统一使用 link stylesheet
 */
async function _loadCSS(
    url,
    domId,
    debug = false,
    logger = null,
    startTime = null
) {
    if (debug && logger) {
        logger.log(`加载 CSS: ${_getFileName(url)}`, 'log');
    }

    // 检查重复加载
    if (document.getElementById(domId) ||
        document.querySelector(`link[href="${url}"]`)) {
        if (debug && logger) {
            logger.log(`  [已存在] 跳过`, 'log');
        }
        return true;
    }

    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.id = domId;
        link.rel = 'stylesheet';
        link.href = url;

        link.onload = () => {
            if (debug && logger && startTime) {
                const duration = Math.round(performance.now() - startTime);
                logger.addTableRow(
                    _getFileName(url),
                    _extractSourceLabel(url),
                    '-',
                    'link',
                    duration
                );
            }
            resolve(link);
        };

        link.onerror = () => {
            const error = new Error(`Failed to load CSS: ${url}`);
            console.error(error.message);
            reject(error);
        };

        document.head.appendChild(link);
    });
}

// ==================== 主函数 ====================

/**
 * 动态库加载器主函数
 * 
 * @param {string|string[]|object[]} inputs 输入数据
 *   - 单个 URL: 'https://cdn/jquery.min.js'
 *   - URL 数组: ['https://cdn/jquery.min.js', 'https://cdn/bootstrap.css']
 *   - 对象数组: [{url: 'https://...', exportName: 'Name'}]
 *   - URL 查询参数: 'https://cdn/lib.js?exportName=LibName'
 * 
 * @param {object} options 选项
 *   - callback: 加载完成后的回调函数
 *   - forceTag: 强制使用 <script> 标签（跳过 ESM import）
 *   - debug: 启用调试日志
 * 
 * @returns {Promise<any[]>} 加载结果数组
 */
export async function referLibrary(inputs, {
    callback,
    forceTag = false,
    debug = false
} = {}) {

    let logger = null;
    if (debug) {
        logger = new DebugLogger();
        logger.initContainer();

        // 异步初始化 jsPanel（不阻塞主流程）
        setTimeout(() => {
            logger.initJsPanel().catch(() => null);
        }, 100);
    }

    // 规范化输入
    const tasks = _normalizeInputs(inputs);

    if (debug && logger) {
        logger.log(`📦 开始加载 ${tasks.length} 个任务`, 'log');
    }

    // 并行加载所有任务
    const results = await Promise.all(
        tasks.map(async (task) => {
            const { url, domId, exportName, isCSS } = task;
            const startTime = performance.now();

            try {
                if (isCSS) {
                    return await _loadCSS(url, domId, debug, logger, startTime);
                } else {
                    return await _loadJS(
                        url,
                        domId,
                        exportName,
                        forceTag,
                        debug,
                        logger,
                        startTime
                    );
                }
            } catch (err) {
                const errMsg = `❌ 加载失败: ${_getFileName(url)} - ${err.message}`;
                console.error(errMsg);
                if (debug && logger) {
                    logger.log(errMsg, 'error');
                }
                return null;
            }
        })
    );

    if (debug && logger) {
        const loaded = results.filter(r => r !== null).length;
        logger.log(`✅ 加载完成 (成功 ${loaded}/${tasks.length})`, 'success');
    }

    if (callback) callback(results);
    return results;
}

export default referLibrary;
export { DebugLogger };
