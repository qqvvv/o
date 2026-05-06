(() => {
  'use strict';

  const method = async () => {
    const core = "https://rra.pages.dev/6/adDlabs.js";
    
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

    const behaviours = {
      syncPlay: async() => {
        const aplayerLrc = [
          "https://cdnjs.cloudflare.com/ajax/libs/aplayer/1.10.1/APlayer.min.css",
          "https://cdnjs.cloudflare.com/ajax/libs/aplayer/1.10.1/APlayer.min.js",
          "https://rra.pages.dev/6/aPlr-LrcSync-050.js?exportName=initModule",
        ];
        
        // ✨ 自动挂载到 behaviours
        await behaviours.refer(aplayerLrc, { 
          mountTarget: this  // this 指向 behaviours
        });
        
        // 现在可以直接调用挂载的函数
        this.initModule?.();  // initModule 已挂载
      },

      attachPanel: async() => {
        const jsPanel4 = [
          "https://gcore.jsdelivr.net/gh/Flyer53/jsPanel4/es6module/jspanel.min.css",
          "https://gcore.jsdelivr.net/gh/Flyer53/jsPanel4/es6module/jspanel.min.js",
        ];
        
        // ✨ 自动挂载到 behaviours
        await behaviours.refer(jsPanel4, { 
          mountTarget: this  // this 指向 behaviours
        });
        
        // 现在可以直接调用挂载的函数
        this.jspanel?.create();
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
