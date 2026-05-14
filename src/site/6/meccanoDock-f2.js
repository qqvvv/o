/**
 * meccanoDock v0.3.5.14
 */
(() => {
  'use strict';

  const method = async () => {
    const core = "https://rra.pages.dev/6/adDlibs.js";

    const libs = [
      "https://rra.pages.dev/6/vectorMenu/menuUI.css",
      "https://rra.pages.dev/6/vectorMenu/menuUI.js?exportName=initializeApp",
      "https://rra.pages.dev/6/vectorMenu/commandExecutor.js?exportName=CommandExecutor",
    ];

    const yggd = `
    - syncPlay
    - 层一折叠1
      - 层二折叠1
        - 层三功能1
        - 层三功能2
      - 层二功能1 #?<endCluster=true &simpleAnchor=alias
    - attachPanel #?<comment= #YggdrAML
    `;

    const imageUrls = [
      "https://s2.loli.net/2023/03/01/dYQMrXeK8GVihP3.jpg",
      "https://i.ibb.co/xSt0Rdk/95433208113.jpg",
      "https://i.postimg.cc/ppCsnWdr/Windows-booting.png",
      "https://i.loli.net/2018/05/08/5af11396cf460.gif",
      "https://gcore.jsdelivr.net/gh/6cc/c/m/y/19/97.jpg",
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

    /**
     * 获取图片地址
     */
    const trimQueryPara = (urlIn) => {
      const url = new URL(urlIn);
      const urlOut = url.origin + url.pathname;
      return urlOut;
    };
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

        const arrSrcs = allImages.map(img => trimQueryPara(img.src));
        return arrSrcs;
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
            action: () => behaviours.attachPanel(),
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

    const behaviours = {
      syncPlay: async () => {
        const aplayerLrc = [
          "https://cdnjs.cloudflare.com/ajax/libs/aplayer/1.10.1/APlayer.min.css",
          "https://rra.pages.dev/6/aPlr-LrcSync-050.js?exportName=initModule",
        ];

        // ✨ 自动挂载到 behaviours
        const aplay = await behaviours.refer(aplayerLrc);
        // 现在可以直接调用挂载的函数
        const initModule = aplay.aplr_lrcsync_050_js.initModule;  // initModule 已挂载
        initModule();
      },

      attachPanel: async () => {
        const jsPanel4 = [
          "https://esm.sh/imagesloaded@5.0.0/es2022/imagesloaded.mjs",
          "https://rra.pages.dev/6/imgload.css",
          "https://rra.pages.dev/6/imageLoader.js?exportName=ImageLoader",
          "https://gcore.jsdelivr.net/gh/Flyer53/jsPanel4/es6module/jspanel.min.css",
          "https://gcore.jsdelivr.net/gh/Flyer53/jsPanel4/es6module/jspanel.min.js",
          "https://cdnjs.cloudflare.com/ajax/libs/fancyapps-ui/5.0.36/fancybox/fancybox.min.css",
          "https://cdnjs.cloudflare.com/ajax/libs/fancyapps-ui/5.0.36/fancybox/fancybox.esm.min.js",
        ];

        // ✨ 自动挂载到 behaviours
        const panel = await behaviours.refer(jsPanel4);
        const jsPanel = panel.jspanel.jsPanel;

        const urls = await getImageUrls();
        // ✨ 调用 ImageLoader 接口
        const imageContainer = panel.imageloader_js.ImageLoader.create(urls, {
          imagesLoaded: panel.imagesloaded_mjs.default,
          Fancybox: panel.fancybox_esm.Fancybox,
        });

        // 现在可以直接调用挂载的函数
        jsPanel?.create({
          callback: (panel) => {
            const contentDiv = panel.querySelector(".jsPanel-content");
            contentDiv?.appendChild(imageContainer);
          },
        });
      },

      '层二折叠1': () => console.log('执行: 层二折叠1'),
      '层三功能1': () => console.log('执行: 层三功能1'),
      '层三功能2': () => console.log('执行: 层三功能2'),
      '层二功能1': async () => {
        const live2d = [
          "https://unpkg.com/live2d-widget@3.1.4/lib/L2Dwidget.min.js",
        ];

        await behaviours.refer(live2d, {
          mountTarget: behaviours,  // this 指向 behaviours
        });
        
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
          "log":true});
        },
      };
    try {
      const refer = await import(core);

      // ✨ 初始化时自动挂载到 behaviours
      const init = await refer.default(libs, { 
        mountTarget: behaviours,  // ✅ 自动挂载
      });
      behaviours.refer = refer.default;

      // 创建命令执行器✨ 现在可以直接访问（已自动挂载）
      const executor = new behaviours.commandexecutor_js.CommandExecutor({
        globalScope: behaviours,
        debug: true,
      });

      // 使用
      restrictDomain(document.URL);
      behaviours.menuui_js.initializeApp(yggd, executor);
    } catch (error) {
      console.error("jsPanel initialization failed:", error);
      throw error;
    }
  };

  const readyDOM_Adapter = () => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", method);
    } else {
      method();
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
