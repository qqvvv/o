// imageLoader.js
/**
 * ImageLoader 模块 - 图片加载容器
 * 依赖: imagesLoaded, Fancybox (可选)
 */
export const ImageLoader = (() => {
  /**
   * 创建图片加载器容器（顺序加载版本）
   * @param {Array<string>} imageUrls - 图片网址数组
   * @param {Object} options - 配置选项
   * @param {Function} options.onProgress - 进度回调
   * @param {Function} options.onComplete - 完成回调
   * @param {Boolean} options.sequential - 是否顺序加载（默认 false）
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

    // 🔑 获取 Fancybox 实例
    const FancyboxLib = options.Fancybox || 
      (typeof Fancybox !== "undefined" ? Fancybox : null);

    // 添加图片元素
    const fragment = document.createDocumentFragment();
    const imgElements = []; // 🆕 保存 img 元素引用

    imageUrls.forEach((url, idx) => {
      const li = document.createElement('li');
      li.className = 'is-loading';
      li.dataset.index = idx; // 🆕 添加索引标记

      const img = document.createElement('img');
      img.src = url;
      img.dataset.index = idx; // 🆕 添加索引标记
      imgElements.push(img); // 🆕 保存引用

      // ✅ Fancybox 交互
      if (FancyboxLib) {
        img.addEventListener("click", (event) => {
          try {
            const elem = event.target.closest("li:has(img)");
            if (!elem) return;

            const imageContainer = elem.closest("ul.image-loader-ul");
            const idxOfCall = Array.from(imageContainer.children).indexOf(elem);

            FancyboxLib.show(gallery_items, {
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

    container.insertBefore(fragment, container.firstChild);
    wrapper.appendChild(statusElem);
    wrapper.appendChild(container);

    // 🆕 选择加载策略
    const isSequential = options.sequential === true;

    if (isSequential) {
      // ✅ 【顺序加载】方案
      _sequentialLoad(
        imgElements,
        container,
        progressElem,
        statusText,
        statusElem,
        options
      );
    } else {
      // ✅ 【并发加载】方案（保留原逻辑）
      _concurrentLoad(
        container,
        progressElem,
        statusText,
        statusElem,
        imageUrls.length,
        options
      );
    }

    return wrapper;
  }

  /**
   * 🆕 顺序加载实现
   */
  function _sequentialLoad(imgElements, container, progressElem, statusText, statusElem, options) {
    let loadedCount = 0;
    const total = imgElements.length;
    const supportsProgress = progressElem &&
      progressElem.toString().indexOf('Unknown') === -1;

    // 🆕 递归加载函数
    function loadNext(index) {
      if (index >= total) {
        // 全部完成
        setTimeout(() => {
          statusElem.style.opacity = '0';
        }, 500);

        options.onComplete?.({
          total: total,
          loaded: loadedCount
        });
        return;
      }

      const img = imgElements[index];
      const li = img.parentNode;

      // 创建临时 Image 对象来检测加载状态
      const tempImg = new Image();
      let loadTimeout;

      // 🔑 成功回调
      tempImg.onload = () => {
        clearTimeout(loadTimeout);
        li.className = ''; // 清除加载状态
        loadedCount++;

        // 更新进度
        if (supportsProgress) {
          progressElem.value = loadedCount;
        }
        statusText.textContent = loadedCount + ' / ' + total;

        // 触发进度回调
        options.onProgress?.({
          current: loadedCount,
          total: total,
          percentage: (loadedCount / total * 100).toFixed(2),
          index: index
        });

        // 加载下一张
        loadNext(index + 1);
      };

      // 🔑 失败回调
      tempImg.onerror = () => {
        clearTimeout(loadTimeout);
        li.className = 'is-broken'; // 标记失败
        loadedCount++;

        // 更新进度
        if (supportsProgress) {
          progressElem.value = loadedCount;
        }
        statusText.textContent = loadedCount + ' / ' + total;

        // 触发进度回调
        options.onProgress?.({
          current: loadedCount,
          total: total,
          percentage: (loadedCount / total * 100).toFixed(2),
          index: index,
          error: true
        });

        // 继续加载下一张
        loadNext(index + 1);
      };

      // 🔑 超时控制（可选，防止永久卡死）
      loadTimeout = setTimeout(() => {
        tempImg.onerror?.();
      }, options.timeout || 30000); // 默认 30 秒超时

      // 开始加载
      statusElem.style.opacity = '1';
      tempImg.src = img.src;
    }

    // 开始顺序加载
    loadNext(0);
  }

  /**
   * ✅ 并发加载实现（原逻辑）
   */
  function _concurrentLoad(container, progressElem, statusText, statusElem, total, options) {
    let loadedCount = 0;
    const supportsProgress = progressElem &&
      progressElem.toString().indexOf('Unknown') === -1;

    const imagesLoadedLib = options.imagesLoaded;

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
          statusText.textContent = loadedCount + ' / ' + total;

          // 触发进度回调
          options.onProgress?.({
            current: loadedCount,
            total: total,
            percentage: (loadedCount / total * 100).toFixed(2)
          });
        });

        imgLoad.on('always', function() {
          // 加载完成
          setTimeout(() => {
            statusElem.style.opacity = '0';
          }, 500);

          // 触发完成回调
          options.onComplete?.({
            total: total,
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
  }

  return { create };
})();
