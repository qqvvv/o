/**
 * meccanoDock
 * 0.23
 */

(() => {
  'use strict';

  const method = async () => {
    const core = "https://rra.pages.dev/6/library-loader_230.js";
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

    try {
      // ✓ 第一步：导入core库
      const rl = await import(core);

      // ✓ 第二步：创建module并立即绑定refer
      const module = new Object();
      module.refer = rl.default;  // 【关键位置】在这里绑定！

      // ✓ 第三步：导入其他库
      const mn = await rl.default(libs);

      // ✓ 第四步：现在behaviours可以安全访问module.refer
      const behaviours = {
        module: module,

        syncPlay: async function () {
          const aplayerLrc = [
            "https://cdnjs.cloudflare.com/ajax/libs/aplayer/1.10.1/APlayer.min.css",
            "https://cdnjs.cloudflare.com/ajax/libs/aplayer/1.10.1/APlayer.min.js",
            "https://rra.pages.dev/6/aPlr-LrcSync-050.js?exportName=initModule",
          ];
          const aplay = await this.module.refer(aplayerLrc);
          const initModule = aplay[2].initModule;
          initModule();
        },

        attachPanel: async function() {
          const jsPanel4 = [
            "https://gcore.jsdelivr.net/gh/Flyer53/jsPanel4/es6module/jspanel.min.css",
            "https://gcore.jsdelivr.net/gh/Flyer53/jsPanel4/es6module/jspanel.min.js",
          ];
          const panel = await this.module.refer(jsPanel4);
          const jsPanel = panel[1].jsPanel;
          jsPanel.create();
        },

        '层二功能1': () => behaviours.attachPanel(),
        '层三功能1': () => console.log('▶ 层三功能1'),
      };

      // ✓ 第五步：创建执行器
      const executor = new CommandExecutor({ 
        globalScope: behaviours,  // ✅ 传入隔离的对象
        debug: true 
      });
      // window.executor = executor;
      // 如果需要特殊处理，显式注册
      executor.register('attachPanel', () => {
        console.log('自定义的 attachPanel');
        behaviours.attachPanel();
        // ... 其他逻辑
      });

      // ✓ 第六步：初始化应用
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
