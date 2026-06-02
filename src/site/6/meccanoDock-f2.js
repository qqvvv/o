// ==UserScript==
// @name        meccanoDock-f2
// @namespace   Violentmonkey Scripts
// @match       *://*/*
// @grant       none
// @version     0.3.6.2
// @author      -
// @description 2026/6/2 00:00:00
// ==/UserScript==

(() => {
  'use strict';

  const primaryFunction = async () => {
    const menuSuite = [
      "https://rra.pages.dev/6/vectorMenu/menuUI.css",
      "https://rra.pages.dev/6/vectorMenu/menuUI.js?exportName=initializeApp",
      "https://rra.pages.dev/6/vectorMenu/commandExecutor.js?exportName=CommandExecutor",
    ];

    const yggd = `
    - workF_Interface
    - virtual_JsonLd
    - feature_Knit
    - folderPath_file
    - syncPlay
    - 层一折叠1
      - 层二折叠1
        - 层三功能1
        - 层三功能2
      - 层二功能1 #?<endCluster=true &simpleAnchor=alias
    - attachPanel #?<comment= #YggdrAML
    - live2d_widget
    - wFlow_Visual
    `;

    const menuMethods = {
      workF_Interface: () => {
        const nterface = visualizeInterface();
        const out = behaviours.assembleComponent(nterface);
      },

      feature_Knit: async () => {
        const ld = document.querySelectorAll("script[type='application/ld+json']");
        const jsonData = JSON.parse(ld[0].textContent);
        const urls = jsonData.itemListElement.map(i => i.contentUrl);
        const imgsLFancy = await behaviours.attachPanel(urls);
        const out = behaviours.assembleComponent(imgsLFancy);
      },

      syncPlay: async () => {
        const aplayerLrc = [
          "https://cdnjs.cloudflare.com/ajax/libs/aplayer/1.10.1/APlayer.min.css",
          "https://rra.pages.dev/6/aPlr-LrcSync-050.js?exportName=initModule",
        ];

        // semi自动挂载到 refer（obj），弃用this 指向 behaviours
        const aplay = await refer.adDlibs(aplayerLrc);
        const initModule = aplay.aplr_lrcsync_050_js.initModule;
        // 已承接主函数，现在可以直接调用挂载
        initModule?.();
      },

      wFlow_Visual: async () => {
        const urlsArr = generateUrls(folderPath, fileNames);
        const imgsLFancy = await behaviours.attachPanel(urlsArr);
        const out = behaviours.assembleComponent(imgsLFancy);
      },

      live2d_widget: async () => {
        const live2d = await refer.adDlibs(
          "https://unpkg.com/live2d-widget@3.1.4/lib/L2Dwidget.min.js",
        );

        L2Dwidget.init({
          "pluginRootPath":"live2dw/",
          "pluginJsPath":"lib/",
          "pluginModelPath":"assets/",
          "tagMode":true,
          "debug":true,
          "model":{
            "jsonPath":"https://unpkg.com/live2d-widget-model-mashiro-seifuku@1.0.1/assets/seifuku.model.json"},
            "display":{
              "position":"right",
              "width":420,
              "height":840,
              "hOffset":0,
              "vOffset":0
            },
          "mobile":{"show":true},
          "react":{"opacity":0.8},
          "log":true,
        });
      },

      virtual_JsonLd: () => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.textContent = `
        {
           "@context":"https://schema.org",
           "@type":"ImageGallery",
           "name":"[写] ",
           "description":"桜",
           "keywords":"桃",
           "mainEntityOfPage":{
              "@type":"WebPage",
              "@id":"https://xx.knit.bid/article/30687/"
           },
           "numberOfItems":20,
           "pagination":{
              "@type":"Pagination",
              "currentPage":1,
              "totalPages":2
           },
           "itemListElement":[
              {
                 "@type":"ImageObject",
                 "position":1,
                 "contentUrl":"https://xx.knit.bid/static/images/2026/03/15/[%E5%86%99%E7%9C%9F]%20%E6%A1%9C%E6%A1%83%E5%96%B5%20-%20%E8%93%9D%EF%BC%9A%E6%B5%B7%E8%BE%B9%E8%A1%97%E6%8B%8D%E8%93%9D%E8%89%B2%E5%8D%AB%E8%A1%A3%20%E7%99%BD%E8%A2%9C%E7%BE%8E%E8%85%BF%E6%B8%85%E7%BA%AF%E5%86%99%E7%9C%9F%2020P/Cosplayer-Sakura-peach-meow-blue-lovecutes.com-001.jpg"
              },
              {
                 "@type":"ImageObject",
                 "position":10,
                 "contentUrl":"https://xx.knit.bid/static/images/2026/03/15/[%E5%86%99%E7%9C%9F]%20%E6%A1%9C%E6%A1%83%E5%96%B5%20-%20%E8%93%9D%EF%BC%9A%E6%B5%B7%E8%BE%B9%E8%A1%97%E6%8B%8D%E8%93%9D%E8%89%B2%E5%8D%AB%E8%A1%A3%20%E7%99%BD%E8%A2%9C%E7%BE%8E%E8%85%BF%E6%B8%85%E7%BA%AF%E5%86%99%E7%9C%9F%2020P/Cosplayer-Sakura-peach-meow-blue-lovecutes.com-010.jpg"
              }
           ]
        }
        `;
        document.getElementsByTagName('head')[0].appendChild(script);
      },
    };

    const refer = new Object();
    const behaviours = {
      attachContainer: async (param) => {
        const jsPanel4 = [
          "https://gcore.jsdelivr.net/gh/Flyer53/jsPanel4/es6module/jspanel.min.css",
          "https://gcore.jsdelivr.net/gh/Flyer53/jsPanel4/es6module/jspanel.min.js",
        ];

        // ✨ 自动挂载到 behaviours
        const panel = await refer.adDlibs(jsPanel4);
        const jsPanel = panel.jspanel.jsPanel;

        // 现在可以直接调用挂载的函数
        jsPanel?.create({
          callback: (panel) => {
            const contentDiv = panel.querySelector(".jsPanel-content");
            contentDiv?.appendChild(param);
          },
        });
      },

      attachPanel: async (urls) => {
        const graphicSuite = [
          "https://rra.pages.dev/6/imgload.css",
          "https://rra.pages.dev/6/imageLoader-f2.js?exportName=ImageLoader",
          "https://cdnjs.cloudflare.com/ajax/libs/fancyapps-ui/5.0.36/fancybox/fancybox.min.css",
        ];

        // ✨ 自动挂载到 behaviours
        const imgsLFancy = await refer.adDlibs(graphicSuite);
        
        // ✨ 调用 ImageLoader 接口
        const imageContainer = imgsLFancy.imageloader_f2_js.ImageLoader.create(urls, {
          sequential: true,  // 🆕 启用顺序加载
          timeout: 5000,    // 🆕 单张超时时间（毫秒）
        });
        return imageContainer;
      },

      assembleComponent: (imgsContainer, targetElem) => {
        if (targetElem) {
          targetElem.appendChild(imgsContainer);
        } else {
          const target = behaviours.attachContainer(imgsContainer);
        }
      },
    };

    const generateUrls = (folderPath, fileNames) => {
      // ✅ 确保 folderPath 以 '/' 结尾
      const normalizedPath = folderPath.endsWith('/') ? folderPath : folderPath + '/';
      // ✅ 用 map 生成 URLs 数组
      return fileNames.map(fileName => normalizedPath + fileName);
    };

    const folderPath = "https://gcore.jsdelivr.net/gh/6cc/c/p/j/";

    const fileNames = [
      "mmexport1756210129175.jpg",
      "mmexport1756210136134.jpg",
      "mmexport1756210140711.jpg",
      "mmexport1756210208094.jpg",
      "mmexport1778395329236.jpg",
      "mmexport1778401748418.jpg",
      "mmexport1778401761154.jpg",
      "mmexport1778402184909.jpg",
      "mmexport1778402196829.jpg",
      "mmexport1778402242718-rl.jpg",
      "mmexport1778402255773-rl.jpg",
      "mmexport1778402301501-rl.jpg",
    ];

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

    const trimQueryPara = (urlIn) => {
      const url = new URL(urlIn);
      const urlOut = url.origin + url.pathname;
      return urlOut;
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
        
        return allImages.map(img => trimQueryPara(img.src));
    };

    /**
     * 获取分页页码
     */
    function getPageCount(html) {
        const pageMatch = html.match(/共\s*(\d+)\s*页/);
        if (pageMatch) {
            return parseInt(pageMatch[1]);
        }
        return 1;
    }

    /**
     * 从HTML中提取图片地址数组
     */
    function extractImageUrls(html) {
        const jsonMatch = html.match(/let\s+urls\s*=\s*(\[.*?\]);/s);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[1]);
            } catch (e) {
                console.error('JSON解析失败:', e);
                return [];
            }
        }
        return [];
    }

    /**
     * 主函数：获取所有页面的图片
     */
    async function getAllImages(baseUrl) {
      const allImages = [];
      let pageCount = 1;
      const span = document.createElement("div");
      const div = document.createElement("div");

      try {
            // 第一步：获取初始页面，确定总页数
            console.log('📖 正在获取初始页面...');
          span.textContent = "📖 正在获取初始页面...";
            let html = await fetch(baseUrl).then(r => r.text());
            pageCount = getPageCount(html);
            console.log(`✅ 共找到 ${pageCount} 页`);
          span.textContent = `✅ 共找到 ${pageCount} 页`;

            // 第二步：逐页获取
            for (let page = 1; page <= pageCount; page++) {
                // 首页不需要添加 page 参数
                const url = page === 1
                    ? baseUrl
                    : `${baseUrl}&page=${page}`;

                console.log(`📄 正在获取第 ${page}/${pageCount} 页: ${url}`);
              span.textContent = `📄 正在获取第 ${page}/${pageCount} 页: ${url}`;

                try {
                    html = await fetch(url).then(r => r.text());
                    const images = extractImageUrls(html);
                    allImages.push(...images);
                    console.log(`   ✓ 此页获得 ${images.length} 张图片，总计 ${allImages.length} 张`);
                  div.textContent = `🔔此页获得 ${images.length} 张图片，总计 ${allImages.length} 张`;

                    // 延迟，避免请求过快
                    await new Promise(resolve => setTimeout(resolve, 1));
                } catch (error) {
                    console.error(`   ✗ 第 ${page} 页获取失败:`, error);
                }
            }

            console.log(`\n✨ 完成！共获得 ${allImages.length} 张图片`);
          span.textContent = `\n✨ 完成！共获得 ${allImages.length} 张图片`;
          const trgtContainer = document.querySelector(".jsPanel-content");
          trgtContainer.appendChild(span);
          trgtContainer.appendChild(div);
          return allImages;
        } catch (error) {
            console.error('❌ 获取初始页面失败:', error);
            return [];
        }
    }

    const visualizeInterface = () => {
      const input = document.createElement("input");
      input.id = "urlBar";
      input.style.width = "100%";
      input.value = "https://www.antbyw.com/plugin.php?id=jameson_manhua&a=read&kuid=185545&zjid=1412432";
      const button = document.createElement("button");
      button.textContent = "retrieve";
      button.addEventListener("click", async () => {
        const urls = await getAllImages(input.value);
        const imgsLFancy = await behaviours.attachPanel(urls);
        const output = behaviours.assembleComponent(imgsLFancy);
      });
      const newDiv = document.createElement("div");
      newDiv.appendChild(input);
      newDiv.appendChild(button);
      return newDiv;
    };

    /**
     * 域名配置
     */
    const domainConfig = [
      {
        name: "antbyw",
        test: (dest) => /\bhttps?:\/\/www\.antbyw\.com/i.test(dest),
        action: () => menuMethods.workF_Interface(),
      },

      {
        name: "ghPage",
        test: (dest) => /\bhttps?:\/\/\S+\.github\.io/i.test(dest),
        action: () => console.log("GitHub Pages"),
      },

      {
        name: "lovecutes",
        test: (dest) => /\bhttps?:\/\/(www\.lovecutes\.com|xx\.knit\.bid)/i.test(dest),
        action: () => menuMethods.feature_Knit(),
      },

      {
        name: "msnCn",
        test: (dest, referrer) => {
          const pattern = /\bhttps?:\/\/www\.msn\.cn\/+/i;
          // referrer 优先，其次当前 URL
          return (referrer && pattern.test(referrer)) || pattern.test(dest);
        },
        action: async () => {
          const urls = await getImageUrls();
          const imgsLFancy = await behaviours.attachPanel(urls);
          const out = behaviours.assembleComponent(imgsLFancy);
        },
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

    try {
      const coreUnit = await import(
        "https://rra.pages.dev/6/adDlibs.js"
      );
      refer.adDlibs = coreUnit.default;
      // mountTarget: behaviours, 弃用初始化时自动挂载到 behaviours
      const menuFeature = await refer.adDlibs(menuSuite);
      
      // 创建命令执行器✨ 现在可以直接访问（已自动挂载）
      const executor = new menuFeature.commandexecutor_js.CommandExecutor({
        globalScope: menuMethods,
        debug: true,
      });

      // 域名identify
      restrictDomain(document.URL);
      menuFeature.menuui_js.initializeApp(yggd, executor);
    } catch (error) {
      console.error("initialization failed:", error);
      throw error;
    }
  };

  const readyDOM_Adapter = () => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", primaryFunction);
    } else {
      primaryFunction();
    }
  };

  const initial_Unique = () => {
    if (window.meLoaded) {
      console.warn("Instance already running. Aborting.");
      return;
    }
    window.meLoaded = true; // 立即标记，防止并发

    try {
      readyDOM_Adapter();
    } catch (error) {
      console.error("Initialization failed:", error);
      window.meLoaded = false; // 失败时释放，允许重试
    }
  };

  initial_Unique();
})();
