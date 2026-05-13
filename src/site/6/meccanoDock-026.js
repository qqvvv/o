/**
 * meccanoDock
 * 0.26
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

    const behaviours = {
      syncPlay: async () => {
        const aplayerLrc = [
          "https://cdnjs.cloudflare.com/ajax/libs/aplayer/1.10.1/APlayer.min.css",
          "https://cdnjs.cloudflare.com/ajax/libs/aplayer/1.10.1/APlayer.min.js",
          "https://rra.pages.dev/6/aPlr-LrcSync-050.js?exportName=initModule",
        ];
        const aplay = await behaviours.refer(aplayerLrc);
        const initModule = aplay.aplr_lrcsync_050_js.initModule;
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

        // ✨ 调用 ImageLoader 接口
        const imageContainer = panel.imageloader_js.ImageLoader.create(imageUrls, {
          imagesLoaded: panel.imagesloaded_mjs.default,
          Fancybox: panel.fancybox_esm.Fancybox,
        });

        jsPanel.create({
          callback: (panel) => {
            const contentDiv = panel.querySelector(".jsPanel-content");
            contentDiv?.appendChild(imageContainer);
          },
        });
      },

      '层二折叠1': () => console.log('执行: 层二折叠1'),
      '层三功能1': () => console.log('执行: 层三功能1'),
      '层三功能2': () => console.log('执行: 层三功能2'),
      '层二功能1': () => console.log('执行: 层二功能1'),

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
    };
    try {
      const refer = await import(core);
      const init = await refer.default(libs);
      behaviours.refer = refer.default;
      // 创建命令执行器
      const executor = new init.commandexecutor_js.CommandExecutor({
        globalScope: behaviours,
        debug: true,
      });

      // 使用
      restrictDomain(document.URL);
      init.menuui_js.initializeApp ( yggd, executor );

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
