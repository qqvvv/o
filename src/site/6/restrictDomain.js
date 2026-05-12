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

// 使用
restrictDomain(document.URL);
