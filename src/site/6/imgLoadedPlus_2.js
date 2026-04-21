(async () => {
  const progress = new LoadingProgressManager();

  try {
    // 初始化进度面板（先初始化 jsPanel 再用）
    let jsPanelLoaded = false;

    // 步骤 1: 加载核心模块
    let step = progress.startStep("📦 加载 referLibrary");
    const coreModule = await import(
      "https://rra.pages.dev/6/referLibrary.js"
    );
    window.referLibrary = coreModule.referLibrary;
    progress.endStep(step);

    // 步骤 2: 开始加载所有库
    step = progress.startStep("🔄 初始化库加载");
    const libraryConfig = {
      imagesLoaded: "https://esm.sh/imagesloaded@5.0.0",
      0: "https://rra.pages.dev/6/imgsLoadFancy.js",
      panelCss:
        "https://gcore.jsdelivr.net/gh/Flyer53/jsPanel4/es6module/jspanel.min.css",
      jsPanel:
        "https://gcore.jsdelivr.net/gh/Flyer53/jsPanel4/es6module/jspanel.min.js",
      Fancybox:
        "https://cdnjs.cloudflare.com/ajax/libs/fancyapps-ui/6.0.33/fancybox/fancybox.umd.min.js",
      1: "https://cdnjs.cloudflare.com/ajax/libs/fancyapps-ui/6.0.33/fancybox/fancybox.min.css",
    };
    progress.endStep(step);

    // 步骤 3: 加载 jsPanel 以便显示进度
    step = progress.startStep("📱 加载 jsPanel");
    await referLibrary({
      panelCss: libraryConfig.panelCss,
      jsPanel: libraryConfig.jsPanel,
    });
    jsPanelLoaded = true;
    progress.initPanel(); // 现在可以显示进度面板了
    progress.endStep(step);

    // 步骤 4: 加载其他库
    step = progress.startStep("📚 加载 imagesLoaded");
    await referLibrary({ imagesLoaded: libraryConfig.imagesLoaded });
    progress.endStep(step);

    step = progress.startStep("🖼️ 加载 Fancybox");
    await referLibrary({
      Fancybox: libraryConfig.Fancybox,
      1: libraryConfig[1],
    });
    progress.endStep(step);

    step = progress.startStep("🎨 加载 ImageLoader");
    await referLibrary({
      0: libraryConfig[0],
    });
    progress.endStep(step);

    // 步骤 5: 使用加载的库
    step = progress.startStep("🚀 初始化 ImageLoader");
    const imageUrls = [
      "https://picsum.photos/200/140/?1",
      "https://picsum.photos/210/140/?2",
    ];
    const container = ImageLoader.create(imageUrls);
    progress.endStep(step);

    // 步骤 6: 显示在面板中
    step = progress.startStep("📌 渲染到 jsPanel");
    jsPanel.create({
      callback: (panel) => panel.content.appendChild(container),
    });
    progress.endStep(step);

    progress.finish();
  } catch (error) {
    console.error("❌ 加载失败:", error);
    if (progress.panel) {
      progress.panel.querySelector(".jsPanel-hdr").innerHTML =
        "❌ 加载失败";
      progress.panel.querySelector("#loading-progress").innerHTML =
        `<div style="padding: 10px; color: red;">${error.message}</div>`;
    }
  }
})();
