// imageLoader.js
/**
 * ImageLoader 模块 - 图片加载容器
 * 依赖: imagesLoaded, Fancybox (可选)
 */
export const ImageLoader = (() => {
  /**
   * 创建图片加载器容器
   * @param {Array<string>} imageUrls - 图片网址数组
   * @param {Object} options - 配置选项
   * @param {Function} options.onProgress - 进度回调
   * @param {Function} options.onComplete - 完成回调
   * @returns {HTMLElement} 包含图片容器的 div
   */
  function create(imageUrls, options = {}) {
    // 创建主容器
    const wrapper = document.createElement('div');
    wrapper.className = 'image-loader-container';

    // 创建状态显示元素
    const statusElem = document.createElement('div');
    statusElem.className = 'image-loader-status';

    const progressElem = document.createElement('progress');
    progressElem.className = 'image-loader-progress';
    progressElem.max = imageUrls.length;
    progressElem.value = 0;

    const statusText = document.createElement('div');
    statusText.textContent = '0 / ' + imageUrls.length;

    statusElem.appendChild(progressElem);
    statusElem.appendChild(statusText);

    // 创建图片容器
    const container = document.createElement('ul');
    container.className = 'image-loader-ul';

    // 为 Fancybox 准备数据
    const gallery_items = imageUrls.map(src => ({ src, type: "image" }));

    // 🔑 获取 Fancybox 实例（优先级：options > 全局）
    const FancyboxLib = options.Fancybox || (typeof Fancybox !== "undefined" ? Fancybox : null);

    // 添加图片元素
    const fragment = document.createDocumentFragment();
    imageUrls.forEach(url => {
      const li = document.createElement('li');
      li.className = 'is-loading';

      const img = document.createElement('img');
      img.src = url;

      // ✅ Fancybox 交互（防守式）改进的
      if (FancyboxLib) {
        img.addEventListener("click", (event) => {
          try {
            const elem = event.target.closest("li:has(img)");
            if (!elem) return;

            const imageContainer = elem.closest("ul.image-loader-ul");
            const idxOfCall = Array.from(imageContainer.children).indexOf(elem);

            // 🔑 调用 Fancybox（支持两种来源）
            Fancybox.show(gallery_items, {
              slug: "gallery",
              startIndex: idxOfCall,
            });
          } catch (error) {
            console.warn("Gallery init failed:", error);
          }
        });
      } else {
        console.warn("Fancybox 未加载 - 图片库功能不可用");
        img.style.cursor = "default";
      }

      li.appendChild(img);
      fragment.appendChild(li);
    });

    container.appendChild(fragment);
    wrapper.appendChild(statusElem);
    wrapper.appendChild(container);

    // ✅ 监测加载进度（imagesLoaded）
    let loadedCount = 0;
    const supportsProgress = progressElem &&
      progressElem.toString().indexOf('Unknown') === -1;

    // ✅ 正确的 imagesLoaded 处理
    const imagesLoadedLib = options.imagesLoaded;  // 🔑 从 options 获取

    if (imagesLoadedLib && typeof imagesLoadedLib === 'function') {
      try {
        const imgLoad = imagesLoadedLib(container);

        imgLoad.on('progress', function(instance, image) {
          // 更新单张图片状态
          image.img.parentNode.className = image.isLoaded ? '' : 'is-broken';

          // 更新进度
          loadedCount++;
          if (supportsProgress) {
            progressElem.value = loadedCount;
          }
          statusText.textContent = loadedCount + ' / ' + imageUrls.length;

          // 触发进度回调
          options.onProgress?.({
            current: loadedCount,
            total: imageUrls.length,
            percentage: (loadedCount / imageUrls.length * 100).toFixed(2)
          });
        });

        imgLoad.on('always', function() {
          // 加载完成，隐藏状态栏
          setTimeout(() => {
            statusElem.style.opacity = '0';
          }, 500);

          // 触发完成回调
          options.onComplete?.({
            total: imageUrls.length,
            loaded: loadedCount
          });
        });

        statusElem.style.opacity = '1';
      } catch (error) {
        console.warn('imagesLoaded 执行失败:', error);
      }
    } else {
      console.warn('imagesLoaded 库未加载 - 进度监测不可用');
    }

    return wrapper;
  }

  return { create };
})();
