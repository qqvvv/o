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
      syncPlay: async() => {
        const aplayerLrc = [
          "https://cdnjs.cloudflare.com/ajax/libs/aplayer/1.10.1/APlayer.min.css",
          "https://cdnjs.cloudflare.com/ajax/libs/aplayer/1.10.1/APlayer.min.js",
          "https://rra.pages.dev/6/aPlr-LrcSync-050.js?exportName=initModule",
        ];
        
        // ✨ 自动挂载到 behaviours
        await behaviours.refer(aplayerLrc, { 
          mountTarget: behaviours  // this 指向 behaviours
        });
        
        // 现在可以直接调用挂载的函数
        behaviours.aPlr_LrcSync_050_js?.();  // initModule 已挂载
      },

      attachPanel: async() => {
        const jsPanel4 = [
          "https://esm.sh/imagesloaded@5.0.0",
          "https://rra.pages.dev/6/imgload.css",
          "https://rra.pages.dev/6/imageLoader.js?exportName=ImageLoader",
          "https://gcore.jsdelivr.net/gh/Flyer53/jsPanel4/es6module/jspanel.min.css",
          "https://gcore.jsdelivr.net/gh/Flyer53/jsPanel4/es6module/jspanel.min.js",
          "https://cdnjs.cloudflare.com/ajax/libs/fancyapps-ui/6.0.33/fancybox/fancybox.min.css",
          "https://cdnjs.cloudflare.com/ajax/libs/fancyapps-ui/6.0.33/fancybox/fancybox.umd.min.js",
        ];
        
        // ✨ 自动挂载到 behaviours
        await behaviours.refer(jsPanel4, { 
          mountTarget: behaviours  // this 指向 behaviours
        });

        // ✨ 调用 ImageLoader 接口
          const imageContainer = ImageLoader.create(imageUrls, {
            onProgress: (progress) => {
              console.log(`加载进度: ${progress.percentage}%`);
            },
            onComplete: (result) => {
              console.log(`加载完成: ${result.loaded}/${result.total}`);
            }
          });
        
        // 现在可以直接调用挂载的函数
        behaviours.jspanel?.create({
          callback: (panel) => {
            const contentDiv = panel.querySelector(".jsPanel-content");
            contentDiv?.appendChild(imageContainer);
          },
        });
      },

      '层一功能1': () => console.log('执行: 层一功能1'),
    };

    try {
      const refer = await import(core);
      
      // ✨ 初始化时自动挂载到 behaviours
      const menu = await refer.default(libs, { 
        mountTarget: behaviours  // ✅ 自动挂载
      });
      
      behaviours.refer = refer.default;

      // ✨ 现在可以直接访问（已自动挂载）
      const executor = new behaviours.commandexecutor_js({
        globalScope: behaviours,
        debug: true,
      });

      behaviours.menuui_js(yggd, executor);

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

    window.meLoaded = true;

    try {
      readyDOM_Adapter();
    } catch (error) {
      console.error("Initialization failed:", error);
      window.meLoaded = false;
    }
  };

  initial_Unique();
})();
