const SCRIPT_START_TIME = performance.now();
/**
 * 辅助函数 - 深层查询
 */
// 1. 首先，定义这两个辅助函数在外面（全局作用域）
const querySelectorDeep = (selector, root = document) => {
    let element = root.querySelector(selector);
    if (element) return element;
    
    for (let el of root.querySelectorAll('*')) {
        if (el.shadowRoot) {
            element = querySelectorDeep(selector, el.shadowRoot);
            if (element) return element;
        }
    }
    return null;
};

const querySelectorAllDeep = (selector, root = document) => {
    const results = [];
    
    // 在当前 root 查找
    const found = root.querySelectorAll(selector);
    results.push(...found);
    
    // 在所有元素的 shadowRoot 中递归查找
    const allElements = root.querySelectorAll('*');
    for (const el of allElements) {
        if (el.shadowRoot) {
            const foundInShadow = querySelectorAllDeep(selector, el.shadowRoot);
            results.push(...foundInShadow);
        }
    }
    
    return results;
};

/**
 * 等待容器元素出现 - 使用 Promise + MutationObserver
 */
const waitForContainer = (selector) => {
    return new Promise((resolve) => {
        const observerStartTime = performance.now();
        
        // 立即检查一次
        const container = querySelectorDeep(selector);
        if (container && container.shadowRoot) {
            resolve({
                element: container,
                observerTime: 0
            });
            return;
        }
        
        let observer;
        let resolved = false;
        
        // 设置 MutationObserver
        observer = new MutationObserver(() => {
            if (resolved) return;
            
            const found = querySelectorDeep(selector);
            if (found && found.shadowRoot) {
                const observerEndTime = performance.now();
                observer.disconnect();
                resolved = true;
                
                resolve({
                    element: found,
                    observerTime: observerEndTime - observerStartTime
                });
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    });
};
/**
 * 获取图片地址
 */
const getImageUrls = async () => {
    const containerResult = await waitForContainer('cp-article');
    
    console.log(`⏱️  MutationObserver 耗时: ${containerResult.observerTime.toFixed(2)}ms`);
    
    let allImages = [];
    if (containerResult.element.shadowRoot) {
        allImages = querySelectorAllDeep('img.article-image', containerResult.element.shadowRoot);
    } else {
        allImages = querySelectorAllDeep('img.article-image', containerResult.element);
    }
    
    if (allImages.length === 0) {
        allImages = querySelectorAllDeep('img.article-image', document);
    }
    
    return allImages.map(img => img.src);
};
/**
 * msnBehaviour
 */
const msnBehaviour = async () => {
    const urls = await getImageUrls();
    
    if (urls.length > 0) {
        console.log(`✅ 成功获取 ${urls.length} 张图片`);
        urls.forEach((url, index) => {
            console.log(`   [${index + 1}] ${url}`);
        });
    } else {
        console.log(`⚠️  未找到任何图片`);
    }
    
    return urls;
};

/**
 * 域名配置
 */
const domainConfig = [
    {
        name: "ghPage",
        test: (dest, referrer) => /\bhttps?:\/\/\S+\.github\.io/i.test(dest),
        action: () => console.log("GitHub Pages"),
    },
    {
        name: "msnCn",
        test: (dest, referrer) => {
            const pattern = /\bhttps?:\/\/www\.msn\.cn\/+/i;
            // referrer 优先，其次当前 URL
            return (referrer && pattern.test(referrer)) || pattern.test(dest);
        },
        action: () => msnBehaviour(),
    },
];

const restrictDomain = async (dest, referrer = document.referrer) => {
    const config = domainConfig.find(cfg => 
        cfg.test(dest, referrer)
    );
    
    if (config) {
        console.log(`[识别] ${config.name}`);
        await config.action();
        return config.name;
    }
    
    console.log("default");
    return "default";
};

// 使用
restrictDomain(document.URL);
