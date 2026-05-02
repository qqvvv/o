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
    const behaviours = {
      '层一功能1': () => console.log('执行: 层一功能1'),
      '层二折叠1': () => console.log('执行: 层二折叠1'),
      '层三功能1': () => console.log('执行: 层三功能1'),
      '层三功能2': () => console.log('执行: 层三功能2'),
      '层二功能1': () => console.log('执行: 层二功能1'),
      '层一功能2': () => console.log('执行: 层一功能2'),
    };
    try {
      const { referLibrary } = await import(core);
      await referLibrary(libs);
      // 创建命令执行器
      const executor = new CommandExecutor({ debug: true });
      window.executor = executor;
      executor.registerBatch(behaviours);
      initializeApp ( yggd, executor );
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
