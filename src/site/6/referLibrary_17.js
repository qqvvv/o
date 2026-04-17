/**
 * 改进的动态库加载器
 * 支持：ESM、UMD、Global、PKGD 等格式
 */
export async function referLibrary(inputs, { 
    callback, 
    forceTag = false,
    debug = false 
} = {}) {
    
    // 1. 标准化输入
    let tasks = [];
    if (typeof inputs === 'string') {
        tasks = [{ name: null, url: inputs }];
    } else if (Array.isArray(inputs)) {
        tasks = inputs.filter(u => u && typeof u === 'string')
            .map(u => ({ name: null, url: u }));
    } else {
        tasks = Object.entries(inputs).map(([name, url]) => {
            // 支持对象格式：{ name: 'url' } 或 { name: { url: 'xxx', globalName: 'yyy' } }
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

    // 2. 并行执行任务
    const results = await Promise.all(tasks.map(async (task) => {
        const { name, url, globalName, forceTag: taskForceTag } = task;
        const isCSS = url.match(/\.(css|CSS)($|\?)/) || url.includes('_CSS.md');

        try {
            if (isCSS) {
                return await _loadCSS(url, name, taskForceTag ?? forceTag);
            } else {
                return await _loadJS(
                    url, 
                    name, 
                    taskForceTag ?? forceTag,
                    globalName,
                    debug
                );
            }
        } catch (err) {
            console.error(`[Loader] Failed to load: ${url}`, err);
            return null;
        }
    }));

    if (callback) callback(results);
    return results;
}

// ==================== 内部核心逻辑 ====================

/**
 * 检测库的模块格式（ESM / UMD / Global）
 * 注：pkgd 视为 UMD 的变体
 */
function _detectLibraryFormat(url) {
    // UMD 和 PKGD 同等处理
    if (url.includes('umd') || url.includes('.umd.') || 
        url.includes('pkgd') || url.includes('.pkgd.')) {
        return 'umd';
    }
    // ESM 检测
    if (url.includes('esm') || url.includes('.esm.')) {
        return 'esm';
    }
    // 默认自动检测
    return 'auto';
}

/**
 * 智能推断导出名称（当未显式指定时）
 * 示例：
 *   live2d-widget.min.js -> L2dwidget
 *   axios.min.js -> Axios
 *   popper.pkgd.min.js -> Popper
 */
function _inferExportName(url) {
    const match = url.match(/\/([a-zA-Z0-9\-_]+)(?:\.(?:esm|umd|pkgd))?(?:\.min)?\.js/);
    if (!match) return null;

    const name = match[1];

    // 已知库的特殊大小写规则
    const specialCases = {
        'live2d-widget': 'L2Dwidget',
        'live2d': 'L2D',
        'popper': 'Popper',
        'highlight': 'hljs',
        'marked': 'marked',
        'prismjs': 'Prism',
        'three': 'THREE',
        'chart.js': 'Chart',
        'echarts': 'echarts',
        'vue': 'Vue',
        'react': 'React',
        'axios': 'axios',
        'lodash': '_',
    };

    const lowerName = name.toLowerCase();
    if (specialCases[lowerName]) {
        return specialCases[lowerName];
    }

    // 默认：将连字符/下划线分隔的单词转为 PascalCase
    const pascalCase = name
        .split(/[-_]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');

    return pascalCase;
}

/**
 * 从全局命名空间中提取导出
 * 尝试多种命名约定
 */
function _extractFromGlobal(name, url, debug = false) {
    if (!name) return null;

    // 从 URL 推断额外的候选名称
    const urlInferred = url ? _inferExportName(url) : null;

    // 构建候选列表（优先级顺序）
    const candidates = [
        name,                                           // 原始指定的名称
        urlInferred,                                    // 从 URL 推断
        name.charAt(0).toUpperCase() + name.slice(1),  // 首字母大写
        name.toUpperCase(),                             // 全大写
        name.toLowerCase(),                             // 全小写
        `$${name}`,                                    // 带 $ 前缀
        `__${name}`,                                   // 带 __ 前缀
    ].filter(Boolean);

    // 去重
    const uniqueCandidates = [...new Set(candidates)];

    for (const candidate of uniqueCandidates) {
        if (window[candidate] !== undefined) {
            if (debug) {
                console.log(`[Loader] ✓ Found global: window.${candidate}`);
            }
            return window[candidate];
        }
    }

    if (debug) {
        console.warn(
            `[Loader] ✗ Global variable not found. Tried: ${uniqueCandidates.join(', ')}`
        );
    }

    return null;
}

/**
 * 等待全局变量出现（异步轮询）
 */
function _waitForGlobal(name, url, timeout = 5000, debug = false) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            const value = _extractFromGlobal(name, url, debug);
            if (value !== null) {
                clearInterval(checkInterval);
                if (debug) {
                    console.log(`[Loader] ✓ Global variable appeared: ${name}`);
                }
                resolve(value);
                return;
            }

            if (Date.now() - startTime > timeout) {
                clearInterval(checkInterval);
                reject(new Error(
                    `[Loader] Timeout waiting for global "${name}" (${timeout}ms). ` +
                    `URL: ${url}`
                ));
            }
        }, 50);
    });
}

/**
 * 加载 JavaScript 库
 */
async function _loadJS(url, name, forceTag, globalName, debug = false) {
    if (debug) {
        console.group(`[Loader] Loading JS: ${url}`);
        console.log(`  name: ${name}, globalName: ${globalName}`);
    }

    // 检查是否已存在
    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing) {
        if (debug) console.log(`  [已存在] 跳过加载`);
        if (debug) console.groupEnd();
        
        if (name || globalName) {
            return _extractFromGlobal(globalName || name, url, debug) || 
                   window[globalName || name] || 
                   true;
        }
        return true;
    }

    const format = _detectLibraryFormat(url);
    if (debug) console.log(`  format: ${format}`);

    // 确定目标名称（优先级：globalName > 推断 > 指定的 name）
    let targetName = globalName || name;
    if (!targetName && format === 'esm') {
        targetName = _inferExportName(url);
        if (debug) console.log(`  inferred name: ${targetName}`);
    }

    // 策略 1：尝试 ESM import
    if (!forceTag && format !== 'umd') {
        try {
            if (debug) console.log(`  [尝试] ESM import()`);
            const module = await import(url);

            if (targetName) {
                let exportObj;

                // 优先级：同名导出 > default 导出 > 整个 module
                if (module[targetName]) {
                    exportObj = module[targetName];
                    if (debug) console.log(`  ✓ Found named export: ${targetName}`);
                } else if (module.default) {
                    exportObj = module.default;
                    if (debug) console.log(`  ✓ Found default export`);
                } else {
                    exportObj = module;
                    if (debug) console.log(`  ✓ Using module as export`);
                }

                // 挂载到全局
                window[targetName] = exportObj;
            }

            if (debug) console.groupEnd();
            return module;
        } catch (e) {
            // 如果明确是 ESM，失败就 throw
            if (format === 'esm') {
                if (debug) console.error(`  ✗ ESM import failed:`, e);
                if (debug) console.groupEnd();
                throw e;
            }
            // 否则继续尝试 UMD
            if (debug) console.warn(`  ⚠ ESM import failed, trying script tag...`);
        }
    }

    // 策略 2：通过 script 标签加载（UMD / PKGD / 回退）
    if (debug) console.log(`  [尝试] script 标签加载`);
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.setAttribute('data-loader', 'referLibrary');

        script.onload = async () => {
            try {
                let result = true;

                if (targetName) {
                    let exported = _extractFromGlobal(targetName, url, debug);

                    // 如果同步未找到，等待异步出现
                    if (!exported) {
                        if (debug) console.log(`  [等待] 全局变量 ${targetName} 出现...`);
                        exported = await _waitForGlobal(targetName, url, 2000, debug)
                            .catch(() => null);
                    }

                    result = exported || window[targetName] || true;

                    if (!exported && debug) {
                        console.warn(`  ⚠ 未找到全局变量: ${targetName}`);
                    }
                }

                if (debug) {
                    console.log(`  ✓ 加载成功`);
                    console.groupEnd();
                }
                resolve(result);
            } catch (err) {
                if (debug) console.error(`  ✗ onload 处理错误:`, err);
                if (debug) console.groupEnd();
                reject(err);
            }
        };

        script.onerror = () => {
            const error = new Error(`[Loader] Failed to load script: ${url}`);
            if (debug) console.error(`  ✗ Script loading failed`);
            if (debug) console.groupEnd();
            reject(error);
        };

        document.head.appendChild(script);
    });
}

/**
 * 加载 CSS 文件
 */
async function _loadCSS(url, name, forceTag) {
    const styleId = name ? `style-${name}` : `style-css-${Math.random().toString(36).substr(2, 5)}`;

    // 检查是否已存在
    if (document.getElementById(styleId) || 
        document.querySelector(`link[href="${url}"]`)) {
        return true;
    }

    const isStandard = url.match(/\.css($|\?)/);
    
    // 标准 CSS 且未强制用 link 标签
    if (!forceTag && isStandard) {
        return new Promise((resolve) => {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `@import url("${url}");`;
            document.head.appendChild(style);

            requestAnimationFrame(() => resolve(style));
        });
    }

    // 使用 link 标签加载
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.id = styleId;
        link.rel = 'stylesheet';
        link.href = url;
        link.onload = () => resolve(link);
        link.onerror = () => {
            reject(new Error(`[Loader] Failed to load CSS: ${url}`));
        };
        document.head.appendChild(link);
    });
}
