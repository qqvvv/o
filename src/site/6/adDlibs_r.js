/**
 * 改进的动态库加载器 v0.28
 * 
 * 重大变更（相比 v0.27）：
 * ✅ 彻底分离 ESM 和 IIFE 加载路径（不再混淆）
 * ✅ ESM 模块：使用 import()，返回模块对象
 * ✅ IIFE 脚本：使用 <script>，依赖全局变量
 * ✅ 移除自动降级逻辑（失败即失败，防止假成功）
 * ✅ 清晰的调试输出，区分加载方式
 */

import { DebugLogger } from './debug-logger.js';

// ==================== 规则表 ====================

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
 * 生成对象 key（基于文件名）
 */
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

/**
 * 查找导出规则
 */
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
 * 
 * 规则：
 * - 包含 umd/pkgd → UMD（IIFE 包装的全局脚本）
 * - 否则 → ESM（标准模块）
 */
function _detectLibraryFormat(url) {
    if (url.includes('umd') || url.includes('.umd.') ||
        url.includes('pkgd') || url.includes('.pkgd.')) {
        return 'umd';
    }
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
        
        // 确定导出名（仅 JS 文件）
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
        
        // 生成对象 key
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

// ==================== 加载函数（分离设计） ====================

/**
 * 加载 ESM 模块
 * 
 * 特点：
 * - 使用 import()
 * - 返回模块对象或导出值
 * - 不依赖全局变量
 * - 失败时直接抛错，不降级
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
        logger.log(`  [ESM] 开始加载...`, 'log');
    }
    
    try {
        // ✅ import() 加载
        const module = await import(url);
        
        // ✅ 查找导出值（优先级：命名导出 > 默认导出 > 整个模块）
        let exported;
        
        if (exportName) {
            // 1. 查找命名导出
            exported = module[exportName];
            
            // 2. 如果没有，查找默认导出
            if (exported === undefined) {
                exported = module.default;
            }
            
            // 3. 如果还是没有，返回整个模块（可能是命名空间）
            if (exported === undefined) {
                exported = module;
            }
        } else {
            // 没指定导出名，优先返回默认导出
            exported = module.default || module;
        }
        
        // ❌ 最后的检查
        if (exported === undefined || exported === null) {
            throw new Error(
                `ESM export not found: ${exportName || 'default'}`
            );
        }
        
        if (debug && logger) {
            logger.log(
                `  ✓ ESM 加载成功${exportName ? `: ${exportName}` : ''}`,
                'success'
            );
            
            if (startTime) {
                const duration = Math.round(performance.now() - startTime);
                logger.addTableRow(
                    _getFileName(url),
                    _extractSourceLabel(url),
                    exportName || 'default',
                    'ESM',
                    duration
                );
            }
        }
        
        return exported;
        
    } catch (e) {
        // ❌ ESM 加载失败，直接抛错（不降级）
        const errMsg = `ESM 加载失败: ${e.message}`;
        
        if (debug && logger) {
            logger.log(`  ❌ ${errMsg}`, 'error');
        }
        
        throw new Error(errMsg);
    }
}

/**
 * 加载 IIFE 脚本（通过 <script> 标签）
 * 
 * 特点：
 * - 使用 <script> 标签
 * - 脚本执行时自动挂载到 window
 * - 返回全局变量或 true
 * - 失败时返回 null（防止未定义的导出名）
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
                `  [IIFE] 开始加载 (格式: ${format.toUpperCase()})...`,
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
                    // ✅ 从全局对象读取（脚本已自动挂载）
                    result = window[exportName];
                    
                    if (result === undefined) {
                        throw new Error(
                            `Global variable not found: window.${exportName}`
                        );
                    }
                }
                
                if (debug && logger) {
                    logger.log(
                        `  ✓ IIFE 加载成功${exportName ? `: window.${exportName}` : ''}`,
                        'success'
                    );
                    
                    if (startTime) {
                        const duration = Math.round(performance.now() - startTime);
                        logger.addTableRow(
                            _getFileName(url),
                            _extractSourceLabel(url),
                            exportName || '-',
                            format === 'umd' ? 'UMD' : 'IIFE',
                            duration
                        );
                    }
                }
                
                resolve(result);
                
            } catch (e) {
                reject(new Error(`Script post-process error: ${e.message}`));
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
 * 根据格式自动选择加载方式：
 * - ESM → _loadESMModule()
 * - UMD → _loadIIFEScript()
 * - forceTag=true → 强制 _loadIIFEScript()
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
    
    // ✅ 路由分发
    if (forceTag || format === 'umd') {
        // ❌ 强制 IIFE 或已识别为 UMD
        return _loadIIFEScript(
            url,
            domId,
            exportName,
            format,
            debug,
            logger,
            startTime
        );
    } else {
        // ✅ 尝试 ESM（默认）
        return _loadESMModule(
            url,
            domId,
            exportName,
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
                    'CSS',
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
 *   - callback: 加载完成后的回调
 *   - forceTag: 强制使用 <script> 标签
 *   - forceGlobal: 强制挂载到 window（仅 exportName）
 *   - mountTarget: 挂载目标对象
 *   - debug: 启用调试
 * 
 * @returns {Promise<object>} 加载结果（key: objectKey, value: module）
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
            return { objectKey, result, success: true };
            
        } catch (err) {
            const errMsg = `❌ 加载失败: ${_getFileName(url)} - ${err.message}`;
            console.error(errMsg);
            
            if (debug && logger) {
                logger.log(errMsg, 'error');
            }
            
            resultObject[objectKey] = null;
            return { objectKey, result: null, success: false };
        }
    });
    
    const results = await Promise.all(loadPromises);
    
    if (debug && logger) {
        const successCount = results.filter(r => r.success).length;
        logger.log(`✅ 加载完成 (成功 ${successCount}/${tasks.length})`, 'success');
    }
    
    // 自动挂载到目标对象
    if (mountTarget && typeof mountTarget === 'object') {
        tasks.forEach(task => {
            const { objectKey, isCSS } = task;
            const moduleOrLib = resultObject[objectKey];
            
            if (moduleOrLib && !isCSS) {
                mountTarget[objectKey] = moduleOrLib;
                
                if (debug && logger) {
                    logger.log(
                        `  → 已挂载到 ${mountTarget.constructor.name}.${objectKey}`,
                        'log'
                    );
                }
            }
        });
    }
    
    // 可选挂载到 window
    if (forceGlobal) {
        tasks.forEach(task => {
            const { objectKey, exportName, isCSS } = task;
            const moduleOrLib = resultObject[objectKey];
            
            if (moduleOrLib && !isCSS && exportName) {
                window[exportName] = moduleOrLib;
                
                if (debug && logger) {
                    logger.log(
                        `  → 已挂载到 window.${exportName}`,
                        'log'
                    );
                }
            }
        });
    }
    
    if (callback) callback(resultObject);
    
    return resultObject;
}

export default referLibrary;
export { DebugLogger };
