/**
 * 改进的动态库加载器 v0.29
 * 
 * 核心修复：
 * ✅ 彻底分离 ESM 模块 和 IIFE 脚本加载
 * ✅ ESM: import() → 返回模块对象
 * ✅ IIFE: <script> → 自动挂载 window，返回全局引用
 * ✅ 修复 mountTarget 挂载逻辑（正确区分模块和全局变量）
 * ✅ 详细的加载类型日志，便于调试
 */

import { DebugLogger } from './debug-logger.js';

// ==================== 库规则表 ====================

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

function _generateObjectKey(url) {
    try {
        const fileName = url.split('/').pop().split('?')[0];
        const isCSS = fileName.match(/\.css$/i);
        
        let libName = fileName
            .replace(/\.(min|umd|esm|pkgd)?\.(js|css)$/i, '')
            .replace(/[.-]/g, '_')
            .toLowerCase();
        
        if (isCSS) {
            libName = `${libName}_css`;
        }
        
        return libName || 'lib_unknown';
    } catch {
        return 'lib_unknown';
    }
}

function _findExportRule(url) {
    const { fileName, libName } = _extractLibInfo(url);
    
    for (const rule of LIBRARY_RULES) {
        let matched = false;
        
        if (rule.pattern instanceof RegExp) {
            matched = rule.pattern.test(fileName) || rule.pattern.test(libName);
        }
        
        if (matched) {
            return rule;
        }
    }
    
    return null;
}

function _extractExportNameFromQuery(url) {
    try {
        const urlObj = new URL(url, 'https://dummy.com');
        return urlObj.searchParams.get('exportName');
    } catch {
        return null;
    }
}

function _getFileName(url) {
    try {
        return url.split('/').pop().split('?')[0];
    } catch {
        return url;
    }
}

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
 * 
 * 返回值：
 * - 'umd': 包含 .umd. 或 .pkgd. 标记 → 使用 <script> 加载
 * - 'esm': 其他情况 → 优先用 import()，失败降级 <script>
 */
function _detectLibraryFormat(url) {
    if (url.includes('umd') || url.includes('.umd.') ||
        url.includes('pkgd') || url.includes('.pkgd.')) {
        return 'umd';
    }
    return 'esm';
}

// ==================== 输入规范化 ====================

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
        
        const { fileName, libName } = _extractLibInfo(url);
        const isCSS = url.match(/\.css($|\?)/i);
        
        let exportName = userExportName || _extractExportNameFromQuery(url);
        if (!exportName && !isCSS) {
            const rule = _findExportRule(url);
            exportName = rule?.exportName || null;
        }
        
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
            objectKey,
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
 * 加载 ESM 模块（使用 import()）
 * 
 * 返回：模块对象或导出值
 * 特点：不会修改 window，返回值需要调用方处理
 */
async function _loadESMModule(
    url,
    domId,
    exportName,
    debug = false,
    logger = null,
    startTime = null
) {
    if (debug && logger) {
        logger.log(`  ├─ [ESM] 尝试 import()...`, 'log');
    }
    
    const module = await import(url);
    
    // ✅ 查找导出值
    let exported;
    
    if (exportName) {
        exported = module[exportName] || module.default;
    } else {
        exported = module.default || module;
    }
    
    if (exported === undefined) {
        throw new Error(`No export found in ESM module: ${exportName || 'default'}`);
    }
    
    if (debug && logger && startTime) {
        const duration = Math.round(performance.now() - startTime);
        logger.addTableRow(
            _getFileName(url),
            _extractSourceLabel(url),
            exportName || 'default',
            'ESM import()',
            duration
        );
    }
    
    return exported;
}

/**
 * 加载 IIFE 脚本（使用 <script> 标签）
 * 
 * 返回：全局变量引用（window[exportName]）或 true
 * 特点：脚本执行时自动初始化并挂载到 window
 */
function _loadIIFEScript(
    url,
    domId,
    exportName,
    format,
    debug = false,
    logger = null,
    startTime = null
) {
    return new Promise((resolve, reject) => {
        if (debug && logger) {
            logger.log(
                `  ├─ [IIFE] 使用 <script> 标签加载 (${format.toUpperCase()})...`,
                'log'
            );
        }
        
        const script = document.createElement('script');
        script.src = url;
        script.setAttribute('data-lib-id', domId);
        script.setAttribute('data-loader', 'referLibrary');
        
        script.onload = () => {
            try {
                let result = true;
                
                if (exportName) {
                    // ✅ 从全局对象读取（脚本自动挂载）
                    result = window[exportName];
                    
                    if (result === undefined) {
                        throw new Error(
                            `IIFE script loaded but global variable not found: window.${exportName}`
                        );
                    }
                }
                
                if (debug && logger && startTime) {
                    const duration = Math.round(performance.now() - startTime);
                    const typeLabel = format === 'umd' ? 'UMD' : 'IIFE';
                    logger.addTableRow(
                        _getFileName(url),
                        _extractSourceLabel(url),
                        exportName || '-',
                        typeLabel,
                        duration
                    );
                }
                
                resolve(result);
                
            } catch (err) {
                reject(new Error(`Script processing error: ${err.message}`));
            }
        };
        
        script.onerror = () => {
            reject(new Error(`Failed to load script: ${url}`));
        };
        
        document.head.appendChild(script);
    });
}

/**
 * 加载 JS 脚本（路由分发）
 * 
 * 策略：
 * 1. 检查 DOM 是否已存在（避免重复加载）
 * 2. 根据格式选择加载方式：
 *    - UMD 标记 → 直接用 <script>
 *    - forceTag=true → 强制用 <script>
 *    - 否则 → 优先尝试 ESM import()，失败降级 <script>
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
    
    // ✅ 检查重复
    const existing = document.querySelector(`script[data-lib-id="${domId}"]`);
    if (existing) {
        if (debug && logger) {
            logger.log(`  └─ [缓存] 脚本已加载，跳过`, 'log');
        }
        return exportName ? window[exportName] : true;
    }
    
    const format = _detectLibraryFormat(url);
    
    // ✅ 如果是 UMD 或强制 script，直接用 <script>
    if (format === 'umd' || forceTag) {
        return _loadIIFEScript(
            url,
            domId,
            exportName,
            format,
            debug,
            logger,
            startTime
        );
    }
    
    // ✅ 否则优先尝试 ESM import()
    try {
        return await _loadESMModule(
            url,
            domId,
            exportName,
            debug,
            logger,
            startTime
        );
    } catch (e) {
        // ESM import() 失败 → 降级到 <script>
        if (debug && logger) {
            logger.log(
                `  ├─ ⚠️ ESM import() 失败: ${e.message}`,
                'warn'
            );
            logger.log(`  └─ 自动降级到 <script> 标签加载`, 'log');
        }
        
        return _loadIIFEScript(
            url,
            domId,
            exportName,
            'iife',  // 降级后标记为 IIFE
            debug,
            logger,
            startTime
        );
    }
}

/**
 * 加载 CSS 样式表
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
    
    if (document.getElementById(domId) ||
        document.querySelector(`link[href="${url}"]`)) {
        if (debug && logger) {
            logger.log(`  └─ [缓存] 样式表已加载，跳过`, 'log');
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
                    'CSS link',
                    duration
                );
            }
            resolve(link);
        };
        
        link.onerror = () => {
            reject(new Error(`Failed to load CSS: ${url}`));
        };
        
        document.head.appendChild(link);
    });
}

// ==================== 主函数 ====================

/**
 * 动态库加载器主函数
 * 
 * @param {string|string[]|object[]} inputs 输入数据
 * @param {object} options 选项
 *   - callback: 完成回调
 *   - forceTag: 强制 <script> 标签
 *   - forceGlobal: 强制挂载到 window（仅 exportName）
 *   - mountTarget: 挂载目标对象
 *   - debug: 启用调试
 * 
 * @returns {Promise<object>} 结果对象 {objectKey: module/lib}
 */
export async function referLibrary(inputs, {
    callback,
    forceTag = false,
    forceGlobal = false,
    mountTarget = null,
    debug = false
} = {}) {
    
    let logger = null;
    if (debug) {
        logger = new DebugLogger();
        logger.initContainer();
        
        setTimeout(() => {
            logger.initJsPanel().catch(() => null);
        }, 100);
    }
    
    const tasks = _normalizeInputs(inputs);
    
    if (debug && logger) {
        logger.log(`📦 开始加载 ${tasks.length} 个任务`, 'log');
    }
    
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
            
            resultObject[objectKey] = result;
            return { objectKey, result, success: true, task };
            
        } catch (err) {
            const errMsg = `❌ 加载失败: ${_getFileName(url)} - ${err.message}`;
            console.error(errMsg);
            
            if (debug && logger) {
                logger.log(errMsg, 'error');
            }
            
            resultObject[objectKey] = null;
            return { objectKey, result: null, success: false, task };
        }
    });
    
    const results = await Promise.all(loadPromises);
    
    if (debug && logger) {
        const successCount = results.filter(r => r.success).length;
        logger.log(
            `✅ 加载完成 (成功 ${successCount}/${tasks.length})`,
            'success'
        );
    }
    
    // ✨ v0.29 关键修复：正确处理 mountTarget 挂载
    if (mountTarget && typeof mountTarget === 'object') {
        results.forEach(({ task, result, success }) => {
            const { objectKey, exportName, isCSS } = task;
            
            if (!success || !result || isCSS) {
                return;  // 失败、空值、CSS 都不挂载
            }
            
            // ✅ 区分挂载内容：
            // - 如果 result 是从全局变量读取的（exportName 对应 window[exportName]）
            //   → 直接挂载 result（已经是正确的库实例）
            // - 如果 result 是 ESM 模块对象
            //   → 挂载导出值或整个模块
            
            let toMount = result;
            
            if (debug && logger) {
                const resultType = Array.isArray(result) ? 'Array' :
                                   result === null ? 'null' :
                                   typeof result === 'object' && result.constructor
                                       ? result.constructor.name
                                       : typeof result;
                
                logger.log(
                    `  → 已挂载到 ${mountTarget.constructor.name}.${objectKey} ` +
                    `(${resultType})`,
                    'log'
                );
            }
            
            mountTarget[objectKey] = toMount;
        });
    }
    
    // 可选挂载到 window
    if (forceGlobal) {
        results.forEach(({ task, result, success }) => {
            const { objectKey, exportName, isCSS } = task;
            
            if (!success || !result || isCSS || !exportName) {
                return;
            }
            
            window[exportName] = result;
            
            if (debug && logger) {
                logger.log(
                    `  → 已挂载到 window.${exportName}`,
                    'log'
                );
            }
        });
    }
    
    if (callback) callback(resultObject);
    
    return resultObject;
}

export default referLibrary;
export { DebugLogger };
