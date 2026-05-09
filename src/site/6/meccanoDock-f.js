(() => {
  'use strict';

  const method = async () => {
    const core = "https://rra.pages.dev/6/adDlibs-f1.js";

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

        // ✨ 自动挂载到 behaviours
        await behaviours.refer(aplayerLrc, {
          mountTarget: behaviours,  // this 指向 behaviours
        });

        // 现在可以直接调用挂载的函数
        behaviours.aplr_lrcsync_050_js.initModule?.();  // initModule 已挂载
      },

      attachPanel: async () => {
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
          mountTarget: behaviours,  // this 指向 behaviours
        });

        // ✨ 调用 ImageLoader 接口
        const imageContainer = behaviours.imageloader_js.ImageLoader.create(imageUrls, {
          imagesLoaded: behaviours["imagesloaded@5_0_0"].default,
        });

        // 现在可以直接调用挂载的函数
        behaviours.jspanel.jsPanel?.create({
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
      '层一功能1': () => console.log('执行: 层一功能1'),
      '层二功能1': async () => {
        const aplayerLrc = [
          "https://unpkg.com/live2d-widget@3.1.4/lib/L2Dwidget.min.js",
        ];

        await behaviours.refer(aplayerLrc, {
          mountTarget: behaviours,  // this 指向 behaviours
          debug: true,
        });
        
        L2Dwidget.init();
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
