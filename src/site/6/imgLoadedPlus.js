(async () => {
  const coreModule = await import("https://rra.pages.dev/6/referLibrary.js");
  try {
    window.referLibrary = coreModule.referLibrary;
    await referLibrary({
      0: "https://gcore.jsdelivr.net/gh/Flyer53/jsPanel4/es6module/jspanel.min.css",
      "jsPanel": "https://gcore.jsdelivr.net/gh/Flyer53/jsPanel4/es6module/jspanel.min.js",
      "imagesLoaded": "https://esm.sh/imagesloaded@5.0.0",
      1: "https://rra.pages.dev/6/imgsLoadFancy.js",
      2: "https://cdnjs.cloudflare.com/ajax/libs/fancyapps-ui/6.0.33/fancybox/fancybox.min.css",
      3: "https://cdnjs.cloudflare.com/ajax/libs/fancyapps-ui/6.0.33/fancybox/fancybox.umd.min.js",
    });
    const imageUrls = [
      "https://s2.loli.net/2023/03/01/dYQMrXeK8GVihP3.jpg",
      "https://i.ibb.co/xSt0Rdk/95433208113.jpg",
      "https://i.postimg.cc/ppCsnWdr/Windows-booting.png",
      "https://i.loli.net/2018/05/08/5af11396cf460.gif",
      "https://gcore.jsdelivr.net/gh/6cc/c/m/y/19/97.jpg",
    ];
    const container = ImageLoader.create(imageUrls);
    // ✅ 正确：在 callback 中获取内容区
    jsPanel.create({
      callback: (panel) => {
        const contentDiv = panel.querySelector(".jsPanel-content");
        contentDiv?.appendChild(container);
      },
    });
  } catch (error) {
    console.error(error);
  }
})();