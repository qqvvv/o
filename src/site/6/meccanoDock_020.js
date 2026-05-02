(() => {
  'use strict';

  const method = async () => {
    const core = "https://rra.pages.dev/6/library-loader_230.js";
    const libs = [
      "https://rra.pages.dev/6/vectorMenu/menuUI.css",
      "https://rra.pages.dev/6/vectorMenu/menuUI.js?exportName=initializeApp",
      "https://rra.pages.dev/6/vectorMenu/commandExecutor_esm.js?exportName=CommandExecutor",
    ];
    const yggd = `
- 层一功能1
- 层一折叠1
  - 层二折叠1
    - 层三功能1
    - 层三功能2
  - 层二功能1 #?<endCluster=true &simpleAnchor=alias
- 层一功能2 #?<comment= #YggdrAML
`;

    const syncPlay = async () => {
      const aplayerLrc = [
        "https://cdnjs.cloudflare.com/ajax/libs/aplayer/1.10.1/APlayer.min.css",
        "https://cdnjs.cloudflare.com/ajax/libs/aplayer/1.10.1/APlayer.min.js?exportName=APlayer",
        "https://rra.pages.dev/6/aPlr-LrcSync-050.js",

      ];
      await referLibrary(aplayerLrc);
      initModule();
    };

    const attachPanel = async () => {
      const jsPanel4 = [
        "https://gcore.jsdelivr.net/gh/Flyer53/jsPanel4/es6module/jspanel.min.css",
        "https://gcore.jsdelivr.net/gh/Flyer53/jsPanel4/es6module/jspanel.min.js",
      ];
      await referLibrary(jsPanel4);
      jsPanel.create();
    };

    const behaviours = {
      '层一功能1': () => syncPlay(),
      '层二折叠1': () => console.log('执行: 层二折叠1'),
      '层三功能1': () => console.log('执行: 层三功能1'),
      '层三功能2': () => console.log('执行: 层三功能2'),
      '层二功能1': () => console.log('执行: 层二功能1'),
      '层一功能2': () => attachPanel(),
    };
    try {
      const { referLibrary } = await import(core);
      await referLibrary(libs);
      // 创建命令执行器
      const executor = new CommandExecutor({ debug: true });
      // window.executor = executor;
      executor.registerBatch(behaviours);
      initializeApp ( yggd, executor );
      window.referLibrary = referLibrary;
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

  const initial_Unique = async () => {
    if (window.meLoaded) {
      console.warn("Instance already running. Aborting.");
      return;
    }

    window.meLoaded = true; // 立即标记，防止并发

    try {
      await readyDOM_Adapter();
    } catch (error) {
      console.error("Initialization failed:", error);
      window.meLoaded = false; // 失败时释放，允许重试
    }
  };

  initial_Unique();
})();
