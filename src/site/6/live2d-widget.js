(async () => {
  const url = "https://gcore.jsdelivr.net/gh/qqvvv/o/src/site/6/referLibrary.js";
  const core = await import( url );
  window.referLibrary = core.referLibrary;
  await referLibrary({
    'L2Dwidget': 'https://unpkg.2333332.xyz/live2d-widget@3.x/lib/L2Dwidget.min.js'
  });
  try {
    L2Dwidget.init({
      "pluginRootPath":"live2dw/",
      "pluginJsPath":"lib/",
      "pluginModelPath":"assets/",
      "tagMode":true,
      "debug":true,
      "model":{
        "jsonPath":"https://unpkg.2333332.xyz/live2d-widget-model-mashiro-seifuku@1.0.1/assets/seifuku.model.json"},
        "display":{
          "position":"right",
          "width":480,
          "height":960,
          "hOffset":0,
          "vOffset":0
        },
      "mobile":{"show":true},
      "react":{"opacity":0.8},
      "log":true});
  } catch (error) {
    console.error(error);
  }
})();