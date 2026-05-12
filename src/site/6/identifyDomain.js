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

// 2. 获取图片的函数
const getFirstCardImages = () => {
    // 找到第一个 fluent-design-system-provider
    const firstProvider = querySelectorDeep('fluent-design-system-provider');
    
    if (!firstProvider) {
        console.log("未找到 fluent-design-system-provider");
        return [];
    }
    
    console.log("找到第一个 provider:", firstProvider);
    
    // 在该 provider 内查找所有 img.article-image
    const images = querySelectorAllDeep('img.article-image', firstProvider);
    
    console.log('找到的图片数量:', images.length);
    
    // 只返回前两个
    return images.slice(0, 2);
};

// 3. 改进的 msnBehaviour
const msnBehaviour = (selector) => {
    // 立即尝试一次（以防内容已经加载）
    setTimeout(() => {
        console.log("尝试获取图片...");
        const images = getFirstCardImages();
        if (images.length > 0) {
            console.log('成功获取图片:', images);
            images.forEach((img, index) => {
                console.log(`图片 ${index + 1}:`, {
                    src: img.src,
                    alt: img.alt,
                });
            });
        }
    }, 500);
    
    // 如果第一次失败，继续用 MutationObserver
    const observer = new MutationObserver((mutationsList, observer) => {
        const images = getFirstCardImages();
        if (images.length > 0) {
            console.log('通过 MutationObserver 获取图片:', images);
            observer.disconnect();
        }
    });
    
    const config = { childList: true, subtree: true };
    observer.observe(document.body, config);
};

// 4. 域名配置和执行
const domainConfig = [
    {
        name: "ghPage",
        test: (dest, referrer) => /\bhttps?:\/\/\S+\.github\.io/i.test(dest),
        action: () => console.log("GitHub Pages"),
    },
    {
        name: "msnCn",
        test: (dest, referrer) => {
            const pattern = /\bhttps?:\/\/(www\.)?(msn|btloader)\.(cn|com)\/\w+/i;
            return (referrer && pattern.test(referrer)) || pattern.test(dest);
        },
        action: () => msnBehaviour("fluent-design-system-provider"),
    },
];

const restrictDomain = (dest, referrer = document.referrer) => {
    const config = domainConfig.find(cfg =>
        cfg.test(dest, referrer)
    );
    
    if (config) {
        console.log(`[识别] ${config.name}`);
        config.action();
        return config.name;
    }
    
    console.log("default");
    return "default";
};

// 5. 使用
restrictDomain(document.URL);
