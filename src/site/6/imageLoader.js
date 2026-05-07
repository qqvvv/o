/**
 * ImageLoader 模块 - 图片加载容器
 * 依赖库（需通过加载器加载）:
 *   - imagesLoaded: 图片加载进度检测
 *   - Fancybox: 图片灯箱展示
 */

/**
 * 创建图片加载容器
 * @param {Array<string>} imageUrls - 图片网址数组
 * @param {Object} options - 配置选项
 * @param {Function} options.onProgress - 进度回调 (current, total, percentage)
 * @param {Function} options.onComplete - 完成回调 (total, loaded)
 * @param {number} options.hideStatusDelay - 加载完成后隐藏状态栏的延迟（ms，默认500）
 * @returns {HTMLElement} 包含图片容器的 div
 */
export function createImageLoader(imageUrls, options = {}) {
  // 参数验证
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    console.warn('ImageLoader: 无效的图片网址数组');
    return document.createElement('div');
  }

  const {
    onProgress,
    onComplete,
    hideStatusDelay = 500
  } = options;

  // ==================== 创建 DOM 结构 ====================

  // 创建主容器
  const wrapper = document.createElement('div');
  wrapper.className = 'image-loader-container';
  wrapper.setAttribute('data-loader', 'imageLoader');

  // 创建状态显示元素
  const statusElem = document.createElement('div');
  statusElem.className = 'image-loader-status';

  const progressElem = document.createElement('progress');
  progressElem.className = 'image-loader-progress';
  progressElem.max = imageUrls.length;
  progressElem.value = 0;

  const statusText = document.createElement('div');
  statusText.className = 'image-loader-text';
  statusText.textContent = `0 / ${imageUrls.length}`;

  statusElem.appendChild(progressElem);
  statusElem.appendChild(statusText);

  // 创建图片容器
  const container = document.createElement('ul');
  container.className = 'image-loader-ul';
  container.setAttribute('role', 'list');

  // ==================== 为 Fancybox 准备数据 ====================

  const gallery_items = imageUrls.map(src => ({
    src,
    type: "image"
  }));

  // ==================== 添加图片元素 ====================

  const fragment = document.createDocumentFragment();

  imageUrls.forEach((url, index) => {
    const li = document.createElement('li');
    li.className = 'image-loader-item is-loading';
    li.setAttribute('data-index', index);
    li.setAttribute('role', 'listitem');

    const img = document.createElement('img');
    img.src = url;
    img.alt = `Gallery image ${index + 1}`;
    img.decoding = 'async';  // 异步解码

    // ✅ Fancybox 交互（防守式编程）
    _setupFancyboxInteraction(img, gallery_items, container, index);

    li.appendChild(img);
    fragment.appendChild(li);
  });

  container.appendChild(fragment);
  wrapper.appendChild(statusElem);
  wrapper.appendChild(container);

  // ==================== 监测加载进度 ====================

  let loadedCount = 0;
  const supportsProgress = progressElem &&
    progressElem.toString().indexOf('Unknown') === -1;

  // 检查 imagesLoaded 依赖
  if (typeof window.imagesLoaded === 'undefined') {
    console.error('ImageLoader: imagesLoaded 库未加载');
    statusElem.style.display = 'none';
    return wrapper;
  }

  // 初始化进度监测
  const imgLoad = window.imagesLoaded(container);

  imgLoad.on('progress', function(instance, image) {
    // 更新单张图片的加载状态
    const itemElem = image.img.closest('.image-loader-item');
    if (itemElem) {
      itemElem.classList.toggle('is-loading', !image.isLoaded);
      itemElem.classList.toggle('is-broken', !image.isLoaded && image.img.naturalWidth === 0);
    }

    // 更新进度计数
    loadedCount++;

    if (supportsProgress) {
      progressElem.value = loadedCount;
    }

    const percentage = ((loadedCount / imageUrls.length) * 100).toFixed(2);
    statusText.textContent = `${loadedCount} / ${imageUrls.length}`;

    // 触发进度回调
    if (typeof onProgress === 'function') {
      onProgress({
        current: loadedCount,
        total: imageUrls.length,
        percentage: parseFloat(percentage)
      });
    }
  });

  imgLoad.on('always', function(instance) {
    // 加载完成，延迟隐藏状态栏
    setTimeout(() => {
      statusElem.style.opacity = '0';
      statusElem.style.pointerEvents = 'none';
    }, hideStatusDelay);

    // 触发完成回调
    if (typeof onComplete === 'function') {
      onComplete({
        total: imageUrls.length,
        loaded: loadedCount,
        failed: imageUrls.length - loadedCount
      });
    }
  });

  // 初始显示状态
  statusElem.style.opacity = '1';
  statusElem.style.transition = 'opacity 0.5s ease-out';

  return wrapper;
}

// ==================== 辅助函数 ====================

/**
 * 设置 Fancybox 交互
 */
function _setupFancyboxInteraction(img, gallery_items, container, index) {
  if (typeof window.Fancybox === 'undefined') {
    console.warn('ImageLoader: Fancybox 未加载 - 图片灯箱功能不可用');
    img.style.cursor = 'default';
    return;
  }

  img.style.cursor = 'pointer';

  img.addEventListener('click', (event) => {
    try {
      const elemLi = event.target.closest('li.image-loader-item');
      if (!elemLi) return;

      const imageContainer = elemLi.closest('ul.image-loader-ul');
      const idxOfCall = Array.from(imageContainer.children).indexOf(elemLi);

      // 使用 Fancybox 显示灯箱
      window.Fancybox.show(gallery_items, {
        slug: 'gallery',
        startIndex: idxOfCall,
        on: {
          init: (fancybox) => {
            console.log('Fancybox 已初始化');
          }
        }
      });
    } catch (error) {
      console.error('ImageLoader: Fancybox 交互出错:', error);
      // 错误不影响页面展示
    }
  });
}

/**
 * 导出对象接口（兼容旧式调用）
 */
export const ImageLoader = {
  create: createImageLoader
};

export default ImageLoader;
