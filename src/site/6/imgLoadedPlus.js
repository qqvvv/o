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
      'https://picsum.photos/200/140/?1',
      'https://picsum.photos/210/140/?2',
      'https://picsum.photos/220/140/?3',
      'https://picsum.photos/230/140/?4',
      'https://picsum.photos/240/140/?5',
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