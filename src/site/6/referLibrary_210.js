/**
 * 改进的动态库加载器 v2.1.0
 * 
 * 变更：
 * - 拆离 DebugLogger 为独立模块
 * - 样式加载统一使用 link stylesheet（移除 @import）
 * - 简化 JS 加载函数名推断（移除 pascalCase 降级）
 * - 调整日志输出格式
 */

import { DebugLogger } from './debug-logger.js';

const LIBRARY_EXPORT_MAP = {
    'imagesloaded': 'imagesLoaded',
    'imagesload': 'imagesLoaded',
    'imageloaded': 'imagesLoaded',

    'fancybox': 'Fancybox',
    'fancy-box': 'Fancybox',
    'fancybox3': 'Fancybox',

    'jspanel': 'jsPanel',
    'js-panel': 'jsPanel',
    'jspanel3': 'jsPanel',
    'jspanel4': 'jsPanel',

    'axios': 'axios',
    'lodash': '_',
    'underscore': '_',
    'gsap': 'gsap',
    'anime': 'anime',
    'three': 'THREE',
    'threejs': 'THREE',
    'bootstrap': 'bootstrap',
    'popper': 'Popper',
    'popperjs': 'Popper',
    'highlight': 'hljs',
    'highlightjs': 'hljs',
    'prismjs': 'Prism',
    'prism': 'Prism',
    'marked': 'marked',
    'chart.js': 'Chart',
    'chartjs': 'Chart',
    'echarts': 'echarts',
    'vue': 'Vue',
    'react': 'React',
    'jquery': 'jQuery',
    'moment': 'moment',
    'dayjs': 'dayjs',
    'live2d-widget': 'L2Dwidget',
    'live2d': 'L2D',
};

/**
 * 从 URL 提取库名
 * 示例：
 *   jspanel.min.css -> jspanel
 *   fancybox.umd.min.js -> fancybox
 *   imagesloaded.js -> imagesloaded
 */
function _extractLibNameFromUrl(url) {
    try {
        const fileName = url.split('/').pop().split('?')[0];
        const match = fileName.match(/^([a-zA-Z0-9\-_]+?)(?:\.(?:min|umd|esm|pkgd))*\.(?:js|css)$/i);
        if (match) {
            return match[1].toLowerCase();
        }
    } catch (e) {}
    return null;
}

/**
 * 生成标准化的 key 值
 * 规则：
 *   - CSS 文件：libname_min_css / libname_css
 *   - JS 文件：对应的导出函数名（如 jsPanel、Fancybox）
 */
function _generateStandardizedKey(url, extractedLibName) {
    const isCSS = url.match(/\.css($|\?)/i);

    if (isCSS) {
        const fileName = url.split('/').pop().split('?')[0];
        const baseName = extractedLibName || 'style';

        if (fileName.includes('.min.')) {
            return `${baseName}_min_css`;
        } else {
            return `${baseName}_css`;
        }
    } else {
        const exportName = LIBRARY_EXPORT_MAP[extractedLibName];
        return exportName || extractedLibName || 'unknown';
    }
}

/**
 * 查找预制表中对应的导出名
 */
function _findExportNameInMap(libName) {
    if (!libName) return null;

    const lowerName = libName.toLowerCase();

    // 直接匹配
    if (LIBRARY_EXPORT_MAP[lowerName]) {
        return LIBRARY_EXPORT_MAP[lowerName];
    }

    // 模糊匹配（包含关系）
    for (const [key, value] of Object.entries(LIBRARY_EXPORT_MAP)) {
        if (lowerName.includes(key) || key.includes(lowerName)) {
            return value;
        }
    }

    return null;
}

/**
 * 检查 key 值是否与预制表的导出名匹配
 */
function _matchesExportName(keyValue, exportName) {
    if (!keyValue || !exportName) return false;
    return keyValue === exportName;
}

// ==================== 源标签提取工具 ====================

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

function _extractFileName(url) {
    try {
        return url.split('/').pop().split('?')[0];
    } catch {
        return url;
    }
}

// ==================== 智能输入规范化 ====================

/**
 * 规范化并检查输入数据
 * 返回带有修正信息的 tasks 数组
 */
function _normalizeInputs(inputs) {
    let tasks = [];

    // 第一步：转换为标准 tasks 格式
    if (typeof inputs === 'string') {
        tasks = [{ name: null, url: inputs }];
    } else if (Array.isArray(inputs)) {
        tasks = inputs.filter(u => u && typeof u === 'string')
            .map(u => ({ name: null, url: u }));
    } else if (typeof inputs === 'object') {
        tasks = Object.entries(inputs).map(([name, url]) => {
            if (typeof url === 'string') {
                return { name, url, globalName: null };
            } else if (typeof url === 'object') {
                return {
                    name,
                    url: url.url,
                    globalName: url.globalName || null,
                    forceTag: url.forceTag ?? false
                };
            }
        }).filter(Boolean);
    }

    // 第二步：逐条检查与修正
    const normalizedTasks = [];
    const usedKeys = new Set();

    tasks.forEach(task => {
        const { name: originalKey, url } = task;
        const isCSS = url.match(/\.css($|\?)/i);

        const libNameFromUrl = _extractLibNameFromUrl(url);

        let finalKey = originalKey;
        let keyWasModified = false;

        if (isCSS) {
            // CSS 文件处理
            const standardCSSKey = _generateStandardizedKey(url, libNameFromUrl);

            if (finalKey !== standardCSSKey) {
                finalKey = standardCSSKey;
                keyWasModified = true;
            }
        } else {
            // JS 文件处理
            if (!finalKey || finalKey.trim() === '') {
                const exportName = _findExportNameInMap(libNameFromUrl);
                finalKey = exportName || libNameFromUrl || 'unnamed';
                keyWasModified = true;
            } else {
                const expectedExportName = _findExportNameInMap(libNameFromUrl);

                if (expectedExportName && !_matchesExportName(finalKey, expectedExportName)) {
                    finalKey = expectedExportName;
                    keyWasModified = true;
                }
            }
        }

        // 处理 key 重复
        let uniqueKey = finalKey;
        if (usedKeys.has(uniqueKey)) {
            let counter = 2;
            while (usedKeys.has(`${finalKey}_${counter}`)) {
                counter++;
            }
            uniqueKey = `${finalKey}_${counter}`;
        }

        usedKeys.add(uniqueKey);

        normalizedTasks.push({
            ...task,
            name: uniqueKey,
            isCSS,
            originalKey,
            keyWasModified: keyWasModified || (uniqueKey !== finalKey)
        });
    });

    return normalizedTasks;
}

// ==================== 主函数 ====================

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

    // 使用智能规范化处理输入
    const tasks = _normalizeInputs(inputs);

    if (debug && logger) {
        logger.log(`开始加载 ${tasks.length} 个任务`, 'log');

        // 输出 key 修正信息
        tasks.forEach(task => {
            if (task.keyWasModified) {
                logger.log(`✓ Key 已修正: "${task.originalKey}" → "${task.name}"`, 'success');
            }
        });
    }

    const results = await Promise.all(tasks.map(async (task) => {
        const { name, url, globalName, forceTag: taskForceTag, isCSS } = task;
        const startTime = performance.now();

        try {
            if (isCSS) {
                return await _loadCSS(url, name, taskForceTag ?? forceTag, debug, logger, startTime);
            } else {
                return await _loadJS(
                    url,
                    name,
                    taskForceTag ?? forceTag,
                    globalName,
                    debug,
                    logger,
                    startTime
                );
            }
        } catch (err) {
            const errMsg = `加载失败: ${_extractFileName(url)} - ${err.message}`;
            console.error(errMsg);
            if (debug && logger) {
                logger.log(errMsg, 'error');
            }
            return null;
        }
    }));

    if (debug && logger) {
        logger.log(`✓ 所有任务加载完成 (共 ${results.filter(r => r !== null).length} 个)`, 'success');
    }

    if (callback) callback(results);
    return results;
}

// ==================== 内部核心逻辑 ====================

function _detectLibraryFormat(url) {
    if (url.includes('umd') || url.includes('.umd.') ||
        url.includes('pkgd') || url.includes('.pkgd.')) {
        return 'umd';
    }
    if (url.includes('es6module') || url.includes('es6') ||
        url.includes('esm') || url.includes('.esm.')) {
        return 'esm';
    }
    return 'auto';
}

/**
 * 推断导出名（查表优先，无则返回 null）
 * 移除了 pascalCase 降级逻辑
 */
function _inferExportName(url) {
    const match = url.match(/\/([a-zA-Z0-9\-_]+)(?:\.(?:esm|umd|pkgd))?(?:\.min)?\.js/);
    if (!match) return null;

    const name = match[1];
    const lowerName = name.toLowerCase();

    // 只查预制表，不做 pascalCase 转换
    return _findExportNameInMap(lowerName);
}

function _extractFromGlobal(name, url, debug = false, logger = null) {
    if (!name) return null;

    const urlInferred = url ? _inferExportName(url) : null;

    // 简化候选项（移除了一些冗余的大小写变体）
    const candidates = [
        name,
        urlInferred,
        name.charAt(0).toUpperCase() + name.slice(1),
        name.toUpperCase(),
        name.toLowerCase(),
    ].filter(Boolean);

    const uniqueCandidates = [...new Set(candidates)];

    for (const candidate of uniqueCandidates) {
        if (window[candidate] !== undefined) {
            if (debug && logger) {
                logger.log(`✓ 找到全局变量: window.${candidate}`, 'success');
            }
            return window[candidate];
        }
    }

    if (debug && logger) {
        logger.log(`✗ 未找到全局变量: ${uniqueCandidates.join(', ')}`, 'warn');
    }

    return null;
}

function _waitForGlobal(name, url, timeout = 5000, debug = false, logger = null) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            const value = _extractFromGlobal(name, url, debug, logger);
            if (value !== null) {
                clearInterval(checkInterval);
                resolve(value);
                return;
            }

            if (Date.now() - startTime > timeout) {
                clearInterval(checkInterval);
                const errMsg = `超时等待全局变量 "${name}" (${timeout}ms)`;
                reject(new Error(errMsg));
            }
        }, 50);
    });
}

/**
 * 加载 JS 脚本
 * 支持：ESM、UMD/PKGD、全局变量三种格式
 */
async function _loadJS(url, name, forceTag, globalName, debug = false, logger = null, startTime = null) {
    if (debug && logger) {
        logger.log(`加载 JS: ${_extractFileName(url)}`, 'log');
    }

    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing) {
        if (debug && logger) {
            logger.log(`  [已存在] 跳过`, 'log');
        }
        if (name || globalName) {
            return _extractFromGlobal(globalName || name, url, debug, logger) ||
                window[globalName || name] ||
                true;
        }
        return true;
    }

    const format = _detectLibraryFormat(url);
    let targetName = globalName || name;

    if (!targetName && format === 'esm') {
        targetName = _inferExportName(url);
    }

    // ESM 模块：优先使用 import()
    if (!forceTag && format === 'esm') {
        try {
            const module = await import(url);

            if (targetName) {
                let exportObj;

                if (module[targetName]) {
                    exportObj = module[targetName];
                } else if (module.default) {
                    exportObj = module.default;
                } else {
                    exportObj = module;
                }

                window[targetName] = exportObj;
            }

            if (debug && logger && startTime) {
                const duration = Math.round(performance.now() - startTime);
                logger.addTableRow(
                    _extractFileName(url),
                    _extractSourceLabel(url),
                    targetName,
                    'ESM',
                    duration
                );
            }

            return module;
        } catch (e) {
            if (debug && logger) {
                logger.log(`  ✗ ESM import 失败: ${e.message}`, 'error');
            }
            throw e;
        }
    }

    // UMD / 全局：使用 script 标签
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.setAttribute('data-loader', 'referLibrary');

        script.onload = async () => {
            try {
                let result = true;

                if (targetName) {
                    let exported = _extractFromGlobal(targetName, url, debug, logger);

                    if (!exported) {
                        exported = await _waitForGlobal(targetName, url, 2000, debug, logger)
                            .catch(() => null);
                    }

                    result = exported || window[targetName] || true;
                }

                if (debug && logger && startTime) {
                    const duration = Math.round(performance.now() - startTime);
                    logger.addTableRow(
                        _extractFileName(url),
                        _extractSourceLabel(url),
                        targetName,
                        format === 'umd' ? 'UMD' : 'Global',
                        duration
                    );
                }

                resolve(result);
            } catch (err) {
                console.error(`加载脚本处理错误: ${err.message}`);
                reject(err);
            }
        };

        script.onerror = () => {
            const error = new Error(`Failed to load script: ${url}`);
            console.error(error.message);
            reject(error);
        };

        document.head.appendChild(script);
    });
}

/**
 * 加载 CSS 样式表
 * ✅ 统一使用 link stylesheet 方案
 * ❌ 移除 @import 方案（无错误反馈）
 */
async function _loadCSS(url, name, forceTag, debug = false, logger = null, startTime = null) {
    const styleId = name ? `style-${name}` : `style-css-${Math.random().toString(36).substr(2, 5)}`;

    if (debug && logger) {
        logger.log(`加载 CSS: ${_extractFileName(url)}`, 'log');
    }

    // 检查重复加载
    if (document.getElementById(styleId) ||
        document.querySelector(`link[href="${url}"]`)) {
        if (debug && logger) {
            logger.log(`  [已存在] 跳过`, 'log');
        }
        return true;
    }

    // ✅ 统一使用 link stylesheet（link 最稳定可靠）
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.id = styleId;
        link.rel = 'stylesheet';
        link.href = url;

        link.onload = () => {
            if (debug && logger && startTime) {
                const duration = Math.round(performance.now() - startTime);
                logger.addTableRow(
                    _extractFileName(url),
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

// 导出
export default referLibrary;
export { DebugLogger };
