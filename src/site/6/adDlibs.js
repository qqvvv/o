/**
 * 改进的动态库加载器 v0.31
 * 
 * 核心改进：
 * ✅ 两段式格式检测（特征检测 + 动态检测）
 * ✅ 修复 Live2D IIFE 伪成功识别
 * ✅ 保留 ESM 的 .default 导出模式
 * ✅ 智能降级逻辑（区分真失败和伪成功）
 */

import { DebugLogger } from './debug-logger.js';

const LIBRARY_RULES = [
    { pattern: /^jquery/i, exportName: 'jQuery', type: 'js' },
    { pattern: /^popper/i, exportName: 'Popper', type: 'js' },
    { pattern: /^bootstrap/i, exportName: 'bootstrap', type: 'both' },
    { pattern: /^chart\.?js/i, exportName: 'Chart', type: 'js' },
    { pattern: /^echarts/i, exportName: 'echarts', type: 'js' },
    { pattern: /^highlight\.?js/i, exportName: 'hljs', type: 'js' },
    { pattern: /^prism(js)?/i, exportName: 'Prism', type: 'both' },
    { pattern: /^lodash/i, exportName: '_', type: 'js' },
    { pattern: /^underscore/i, exportName: '_', type: 'js' },
    { pattern: /^axios/i, exportName: 'axios', type: 'js' },
    { pattern: /^gsap/i, exportName: 'gsap', type: 'js' },
    { pattern: /^anime/i, exportName: 'anime', type: 'js' },
    { pattern: /^marked/i, exportName: 'marked', type: 'js' },
    { pattern: /^three(\.js)?/i, exportName: 'THREE', type: 'js' },
    { pattern: /imagesloaded|imageloaded|imagesload/i, exportName: 'imagesLoaded', type: 'js' },
    { pattern: /imgsfancy|imgsloadfancy|imagefancy|imgsload.*fancy/i, exportName: 'ImageLoader', type: 'js' },
    { pattern: /^fancybox/i, exportName: 'Fancybox', type: 'both' },
    { pattern: /^jspanel/i, exportName: 'jsPanel', type: 'js' },
    { pattern: /^vue/i, exportName: 'Vue', type: 'js' },
    { pattern: /^react/i, exportName: 'React', type: 'js' },
    { pattern: /^moment/i, exportName: 'moment', type: 'js' },
    { pattern: /^dayjs/i, exportName: 'dayjs', type: 'js' },
    { pattern: /^live2d/i, exportName: 'L2Dwidget', type: 'js' },
    { pattern: /fontawesome/i, type: 'css' },
    { pattern: /\.css$/i, type: 'css' },
];

// ==================== 工具函数 ====================

function _extractLibInfo(url) {
    try {
        const fileName = url.split('/').pop().split('?')[0];
        const libName = fileName
            .replace(/\.(min|umd|esm|pkgd|mjs)\.js$/i, '')
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
            .replace(/\.(min|umd|esm|pkgd|mjs)?\.(js|css)$/i, '')
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
        if (rule.pattern instanceof RegExp) {
            if (rule.pattern.test(fileName) || rule.pattern.test(libName)) {
                return rule;
            }
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
 * ✨ 两段式格式检测 v0.30
 * 
 * 第一段：特征检测（100% 确定）
 *   - .umd. / .pkgd. → 'umd'
 *   - .esm. / .mjs → 'esm'
 *   - 否则 → 'unknown'（进入动态检测）
 * 
 * 返回对象：
 *   {
 *     staticType: 'umd' | 'esm' | 'unknown',  // 静态检测结果
 *     needsDynamicCheck: boolean               // 是否需要动态检测
 *   }
 */
function _detectLibraryFormat(url) {
    // 第一段：特征检测
    if (url.includes('.umd.') || url.includes('.umd/') ||
        url.includes('.pkgd.') || url.includes('.pkgd/')) {
        return {
            staticType: 'umd',
            needsDynamicCheck: false
        };
    }
    
    if (url.includes('.esm.') || url.includes('.esm/') ||
        url.includes('.mjs') || url.includes('/esm/')) {
        return {
            staticType: 'esm',
            needsDynamicCheck: false
        };
    }
    
    // 第二段：无特征，需要动态检测
    return {
        staticType: 'unknown',
        needsDynamicCheck: true
    };
}

/**
 * ✨ 检测 import() 返回值是否有意义
 * 
 * 用途：区分"真正的 ESM"和"IIFE 伪成功"
 * 
 * 返回 true：模块有实际内容
 *   - {default: Function/Object/...}（不是空对象）
 *   - {namedExport1: ..., namedExport2: ...}
 * 
 * 返回 false：模块内容为空（IIFE 伪成功）
 *   - {}（完全空）
 *   - {default: undefined}
 */
function _isModuleContentful(module, exportName) {
    if (!module || typeof module !== 'object') {
        return false;
    }

    // 检查默认导出
    if (module.default !== undefined && module.default !== null) {
        return true;
    }
    
    // 检查命名导出
    if (exportName) {
        const named = module[exportName];
        if (named !== undefined && named !== null) {
            return true;
        }
    }

    // 检查是否有其他导出
    const keys = Object.keys(module);
    return keys.length > 0 && !(keys.length === 1 && !module.default);
}

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
 * ✨ ESM 模块加载（import()）
 * 
 * 返回：完整的模块对象（包含 .default）
 * 目的：保留 ESM 的原生导出结构
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
    
    // ✅ 返回完整模块对象，让调用方自己决定用 .default 还是其他
    if (debug && logger && startTime) {
        const duration = Math.round(performance.now() - startTime);
        const logMsg = exportName 
            ? `ESM import() [${exportName}]`
            : 'ESM import() [default]';
        logger.addTableRow(
            _getFileName(url),
            _extractSourceLabel(url),
            exportName || 'default',
            logMsg,
            duration
        );
    }
    
    return module;
}

/**
 * IIFE 脚本加载（<script> 标签）
 * 
 * 返回：全局变量或 true
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
                `  ├─ [IIFE] 使用 <script> 标签 (${format.toUpperCase()})...`,
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
                    result = window[exportName];
                    
                    if (result === undefined) {
                        throw new Error(
                            `IIFE loaded but window.${exportName} is undefined`
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
 * ✨ 智能 JS 加载器（v0.30）
 * 
 * 流程：
 * 1. 检查缓存（已加载过的脚本）
 * 2. 格式检测：
 *    - UMD 标记 → 直接 <script>
 *    - ESM 标记 → 直接 import()
 *    - 无标记 → 尝试 import()，检查结果：
 *      - 有内容 → 返回（成功的 ESM）
 *      - 空对象 → 降级 <script>（IIFE 伪成功）
 *      - 真失败 → 报错
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
    
    const existing = document.querySelector(`script[data-lib-id="${domId}"]`);
    if (existing) {
        if (debug && logger) {
            logger.log(`  └─ [缓存] 已加载，跳过`, 'log');
        }
        return exportName ? window[exportName] : true;
    }
    
    const { staticType, needsDynamicCheck } = _detectLibraryFormat(url);
    
    // ✅ 情况1：静态检测确定是 UMD 或强制 <script>
    if (staticType === 'umd' || forceTag) {
        return _loadIIFEScript(
            url,
            domId,
            exportName,
            staticType,
            debug,
            logger,
            startTime
        );
    }
    
    // ✅ 情况2：静态检测确定是 ESM
    if (staticType === 'esm' && !forceTag) {
        return _loadESMModule(
            url,
            domId,
            exportName,
            debug,
            logger,
            startTime
        );
    }
    
    // ✅ 情况3：需要动态检测（无特征库）
    if (needsDynamicCheck) {
        try {
            if (debug && logger) {
                logger.log(`  ├─ [动态检测] 尝试 import()...`, 'log');
            }
            
            const module = await import(url);
            
            // ✨ 关键判断：检查模块是否有实际内容
            if (_isModuleContentful(module, exportName)) {
                if (debug && logger) {
                    logger.log(`  ├─ [动态检测] 确认为 ESM（有内容）`, 'success');
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
                
                return module;
            } else {
                // IIFE 伪成功：import() 返回空对象
                if (debug && logger) {
                    logger.log(
                        `  ├─ [动态检测] 检测到 IIFE 伪成功（空模块），降级 <script>`,
                        'warn'
                    );
                }
                
                return _loadIIFEScript(
                    url,
                    domId,
                    exportName,
                    'iife',
                    debug,
                    logger,
                    startTime
                );
            }
            
        } catch (e) {
            // import() 真正失败：网络错误、语法错误等
            if (debug && logger) {
                logger.log(
                    `  ├─ [动态检测] import() 失败（可能是 IIFE）: ${e.message}`,
                    'warn'
                );
                logger.log(`  └─ 降级 <script> 标签加载`, 'log');
            }
            
            return _loadIIFEScript(
                url,
                domId,
                exportName,
                'iife',
                debug,
                logger,
                startTime
            );
        }
    }
}

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
            logger.log(`  └─ [缓存] 已加载，跳过`, 'log');
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
    
    // ✨ mountTarget 挂载
    if (mountTarget && typeof mountTarget === 'object') {
        results.forEach(({ task, result, success }) => {
            const { objectKey, isCSS } = task;
            
            if (!success || !result || isCSS) {
                return;
            }
            
            mountTarget[objectKey] = result;
            
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
        });
    }
    
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
