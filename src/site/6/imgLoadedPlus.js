(async () => {
  const coreModule = await import("https://rra.pages.dev/6/referLibrary.js");
  try {
    window.referLibrary = coreModule.referLibrary;
    await referLibrary({
      "imagesLoaded": "https://esm.sh/imagesloaded@5.0.0",
      0: "https://rra.pages.dev/6/imgsLoadFancy.js",
    });
    const imageUrls = [
      'https://picsum.photos/200/140/?1',
      'https://picsum.photos/210/140/?2',
      'https://picsum.photos/220/140/?3',
      'https://picsum.photos/230/140/?4',
      'https://picsum.photos/240/140/?5',
    ];
    const container = ImageLoader.create(imageUrls);
    document.body.appendChild(container);
  } catch (error) {
    console.error(error);
  }
})();