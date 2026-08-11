
/**
 * imagesBox.js - v0.4.8.9
 * 依赖: imagesLoaded, Fancybox (可选)
 */
import imagesBox_css from './imagesBox.css' with { type: "css" };
import imagesLoaded from 'https://esm.sh/imagesloaded@5.0.0/es2022/imagesloaded.mjs';
import { urlParse } from './urlParseE.js';

/**
 * 创建图片加载器容器（顺序加载版本）
 * @param {Array<string>} imageUrls - 图片网址数组
 * @param {Object} options - 配置选项
 * @param {Function} options.onProgress - 进度回调
 * @param {Function} options.onComplete - 完成回调
 * @param {Boolean} options.genSeq - 是否显示序号（默认 false）
 * @param {Boolean} options.sequential - 是否顺序加载（默认 false）
 * @returns {HTMLElement} 包含图片容器的 div（, toggleSeq 的控制对象）
 */
document.adoptedStyleSheets.push(imagesBox_css);

export const imagesBox = (imageUrls, options = {}) => {
  // 参数提取
  const {
    genSeq = false,
    sequential = false,
    timeout = 3000,
  } = options;

  // 创建状态显示元素
  const statusElem = document.createElement('div');
  statusElem.className = 'imagesloaded-status';

  const progressElem = document.createElement('progress');
  progressElem.className = 'imagesloaded-progress';
  progressElem.max = imageUrls.length;
  progressElem.value = 0;

  const statusText = document.createElement('div');
  statusText.textContent = '0 / ' + imageUrls.length;

  statusElem.appendChild(progressElem);
  statusElem.appendChild(statusText);

  // 创建主容器
  const fragment = new DocumentFragment();
  const units = [];
  const imgElements = []; // 保存 img 元素引用
  // 为 Fancybox 准备数据
  const gallery_items = imageUrls.map(src => ({ src, type: 'image' }));

  imageUrls.forEach((url, idx) => {
    const li = document.createElement('li');
    li.className = 'is-loading';
    li.dataset.index = idx; // 添加索引标记
    // 🆕 统一的 wrapper 结构（支持 genSeq）
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'img-wrapper'
    const img = document.createElement('img');
    img.src = url;
    img.dataset.index = idx; // 添加索引标记
    imgElements.push(img); // 保存引用
    // 🆕 始终创建 label（通过 CSS 控制显示）
    const seq_prefix = document.createElement('span');
    seq_prefix.className = 'seq-prefix';
    seq_prefix.textContent = '#';
    const seq_number = document.createElement('span');
    seq_number.className = 'seq-number';
    seq_number.textContent = idx + 1;
    const seq_label = document.createElement('span');
    seq_label.className = 'seq-label';
    seq_label.textContent = '';
    const labelWrapper = document.createElement('div');
    labelWrapper.append(seq_prefix, seq_number, seq_label);

    // 组装结构
    imgWrapper.append(img, labelWrapper);
    li.appendChild(imgWrapper);
    fragment.appendChild(li);
    units.push(li);
  });

  document.body.appendChild(statusElem);

  // 选择加载策略
  const isSequential = options.sequential === true;

  if (isSequential) {
    // ✅ 【顺序加载】方案
    _sequentialLoad(
      imgElements,
      fragment,
      progressElem,
      statusText,
      statusElem,
      options
    );
  } else {
    // ✅ 【并发加载】方案（保留原逻辑）
    _concurrentLoad(
      fragment,
      progressElem,
      statusText,
      statusElem,
      imageUrls.length,
      options
    );
  }

  return units;
}

/**
 * 顺序加载实现（进度修正）
 */
const _sequentialLoad = (imgElements,
  fragment, progressElem, statusText, statusElem, options) => {
  const total = imgElements.length;
  let loadedCount = 0; // 仅用于完成统计，不用于进度显示
  const supportsProgress = progressElem &&
    progressElem.toString().indexOf('Unknown') === -1;

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
    const li = img.closest("li");
    const tempImg = new Image();
    let loadTimeout;

    // ✅ 成功回调
    tempImg.onload = () => {
      clearTimeout(loadTimeout);
      li.className = ''; // 清除加载状态
      loadedCount++;

      // 基于索引更新进度（永不超限）
      if (supportsProgress) {
        progressElem.value = index + 1;
      }
      statusText.textContent = `${index + 1} / ${total}`;

      options.onProgress?.({
        current: index + 1,
        total: total,
        percentage: ((index + 1) / total * 100).toFixed(2),
        index: index,
        status: 'loaded'
      });

      loadNext(index + 1);
    };

    // ✅ 失败回调
    tempImg.onerror = () => {
      clearTimeout(loadTimeout);
      li.className = 'is-broken';
      loadedCount++;

      // 基于索引更新进度
      if (supportsProgress) {
        progressElem.value = index + 1;
      }
      statusText.textContent = `${index + 1} / ${total}`;

      options.onProgress?.({
        current: index + 1,
        total: total,
        percentage: ((index + 1) / total * 100).toFixed(2),
        index: index,
        status: 'failed'
      });

      loadNext(index + 1);
    };

    // 超时控制
    loadTimeout = setTimeout(() => {
      tempImg.onerror?.();
    }, options.timeout || 3000);

    statusElem.style.opacity = '1';
    tempImg.src = img.src;
  }

  loadNext(0);
}

/**
 * 并发加载实现（原逻辑 + genSeq 支持）
 */
const _concurrentLoad = (fragment,
  progressElem, statusText, statusElem, total, options) => {
  let loadedCount = 0;
  const supportsProgress = progressElem &&
    progressElem.toString().indexOf('Unknown') === -1;

  if (imagesLoaded && typeof imagesLoaded === 'function') {
    try {
      const imgLoad = imagesLoaded(fragment);

      imgLoad.on('progress', function(instance, image) {
        // 更新单张图片状态
        const img = image.img;
        const li = img.closest('li');
        if (li) {
          li.className = image.isLoaded ? '' : 'is-broken';
          const seq_label = li.querySelector('.seq-label');
          if (seq_label && image.isLoaded) {
            const fileName = urlParse.getFileName(img.src);
            const label = `${fileName} ${img.naturalWidth} x ${img.naturalHeight}`;
            seq_label.textContent = label;
          }
        }

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
