/**
 * 改进的动态库加载器 v0.26
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
 * 从 URL 生成对象 key（基于文件名改进版）
 * - CSS 文件：库名 + '_css' 后缀
 * - JS 文件：纯库名（无扩展名）
 */
function _generateObjectKey(url) {
    try {
        const fileName = url.split('/').pop().split('?')[0];
        const isCSS = fileName.match(/\.css$/i);
        
        // 提取库名（移除版本号和 .min 等修饰符）
        let libName = fileName
            .replace(/\.(min|umd|esm|pkgd)?\.(js|css)$/i, '')
            .replace(/[.-]/g, '_')
            .toLowerCase();
        
        // CSS 文件添加 _css 后缀
        if (isCSS) {
            libName = `${libName}_css`;
        }
        
        return libName || 'lib_unknown';
    } catch {
        return 'lib_unknown';
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
 * 规范化输入数据（增强版）
 * 新增：生成 objectKey
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
    const usedObjectKeys = new Set();

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
        // ✨ 新增：生成对象 key（基于文件名，确保唯一）
        let objectKey = _generateObjectKey(url);
        let keyCounter = 2;
        const originalKey = objectKey;
        while (usedObjectKeys.has(objectKey)) {
            objectKey = `${originalKey}_${keyCounter}`;
            keyCounter++;
        }
        usedObjectKeys.add(objectKey);

        tasks.push({
            url,
            domId,
            objectKey,      // ✨ 新字段
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
        return window[exportName] || true;
    }
    const format = _detectLibraryFormat(url);
    // ✅ 策略1：非 UMD 且非强制 script 标签 → 优先尝试 import()
    if (format !== 'umd' && !forceTag) {
        try {
            if (debug && logger) {
                logger.log(`  → 尝试 ESM import()`, 'log');
            }

            const module = await import(url);

            // ✨ 关键改进：检查 import() 是否实际初始化了库
            if (exportName && window[exportName] !== undefined) {
                if (debug && logger) {
                    logger.log(`  ✓ IIFE 自挂载成功: window.${exportName}`, 'success');
                }
                return window[exportName];
            }

            // 检查返回的模块是否有内容
            const exported = module[exportName] || module.default || module;
            if (exported && Object.keys(exported).length > 0) {
                if (debug && logger) {
                    logger.log(`  ✓ ESM export 成功`, 'success');
                }
                return exported;
            }
            // ⚠️ import() 虽然没报错，但库没有被正确初始化
            // 这说明库是 IIFE 类型，需要用 <script> 标签
            throw new Error('Library not properly initialized by import()');
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
            //return module;
        } catch (e) {
            // import 失败 → 降级到 <script> 标签
            if (debug && logger) {
                logger.log(`  ⚠️ import() 加载失败或库未初始化: ${e.message}`, 'warn');
                logger.log(`  → 自动降级到 <script> 标签加载`, 'log');
            }
            
            // 自动降级继续执行下面的 <script> 标签逻辑
            return _loadViaScript(
                url,
                domId,
                exportName,
                'umd（iife）',  // 降级后认为是 UMD标记为 IIFE 类型
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
                    // ✨ 直接从 window 获取（IIFE 已自动挂载）
                    result =  window[exportName];

                    if (result === undefined) {
                        throw new Error(`Library ${exportName} not found in window`);
                    }
                }

                if (debug && logger && startTime) {
                    const duration = Math.round(performance.now() - startTime);
                    logger.addTableRow(
                        _getFileName(url),
                        _extractSourceLabel(url),
                        exportName || '-',
                        format === 'umd' ? 'UMD' : 'Global（IIFE）',
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

// ==================== 主函数（改造版） ====================

/**
 * 动态库加载器主函数（改进版）
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
 *   - forceGlobal: 强制挂载到 window（默认 false，只挂载到返回对象）
 *   - mountTarget: 挂载目标对象（如 behaviours），默认 null
 *   - debug: 启用调试日志
 * 
 * @returns {Promise<object>} 加载结果对象（key: fileName, value: module）
 */
export async function referLibrary(inputs, {
    callback,
    forceTag = false,
    forceGlobal = false,  // ✨ 新参数
    mountTarget = null,      // ✨ 新参数：挂载目标对象
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

    // ✨ 改造：使用对象而非数组存储结果
    const resultObject = {};
    // 并行加载所有任务
    const loadPromises = tasks.map(async (task) => {
        const { url, domId, objectKey, exportName, isCSS } = task;
        const startTime = performance.now();
        try {
            let result;
            if (isCSS) {
                result = await _loadCSS(url, domId, debug, logger, startTime);
            } else {
                result = await _loadJS(
                    url,
                    domId,
                    exportName,
                    forceTag,
                    debug,
                    logger,
                    startTime
                );
            }
            // ✨ 关键改造：按 objectKey 存储到结果对象
            resultObject[objectKey] = result;
            return { objectKey, result };
        } catch (err) {
            const errMsg = `❌ 加载失败: ${_getFileName(url)} - ${err.message}`;
            console.error(errMsg);
            if (debug && logger) {
                logger.log(errMsg, 'error');
            }
            // ✨ 失败也记录到对象
            resultObject[objectKey] = null;
            return { objectKey, result: null };
        }
    });
    await Promise.all(loadPromises);
    if (debug && logger) {
        const loaded = Object.values(resultObject).filter(r => r !== null).length;
        logger.log(`✅ 加载完成 (成功 ${loaded}/${tasks.length})`, 'success');
    }

    // ✨ 新增：自动挂载到目标对象
    if (mountTarget && typeof mountTarget === 'object') {
        tasks.forEach(task => {
            const { objectKey, exportName, isCSS } = task;
            const moduleOrLib = resultObject[objectKey];
            
            if (moduleOrLib && !isCSS) {  // 只挂载 JS 文件
                // 优先挂载导出的函数/类，如果没有则挂载整个模块
                const toMount = (exportName && moduleOrLib[exportName]) || moduleOrLib;
                mountTarget[objectKey] = toMount;
                
                if (debug && logger) {
                    logger.log(`  → 已挂载到 ${mountTarget.constructor.name}.${objectKey}`, 'log');
                }
            }
        });
    }

    // ✨ 新增：可选挂载到 window（由 forceGlobal 控制）
    if (forceGlobal) {
        tasks.forEach(task => {
            const { objectKey, exportName, isCSS } = task;
            const moduleOrLib = resultObject[objectKey];
            if (moduleOrLib && !isCSS && exportName) {
                window[exportName] = moduleOrLib;
                if (debug && logger) {
                    logger.log(`  → 已挂载到 window.${exportName}`, 'log');
                }
            }
        });
    }
    if (callback) callback(resultObject);
    // ✨ 返回对象而非数组
    return resultObject;
}
export default referLibrary;
export { DebugLogger };