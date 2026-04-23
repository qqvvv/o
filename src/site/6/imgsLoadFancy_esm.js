/**
 * ImageLoader 模块 (ESM)
 * 输入图片网址数组，返回包含加载进度的容器
 */

/**
 * 创建样式（首次调用时）
 */
function _createStyles() {
  if (!document.querySelector('style[data-image-loader]')) {
    const style = document.createElement('style');
    style.setAttribute('data-image-loader', 'true');
    style.textContent = `
      .image-loader-container {
        font-family: sans-serif;
      }

      .image-loader-container ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }

      .image-loader-container li {
        height: 140px;
        min-width: 100px;
        display: block;
        list-style: none;
        background-color: black;
        background-position: center center;
        background-repeat: no-repeat;
        border-radius: 5px;
        overflow: hidden;
      }

      .image-loader-container img {
        max-height: 140px;
        border-radius: 5px;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .image-loader-container img,
      .image-loader-status {
        -webkit-transition: opacity 0.4s;
        -moz-transition: opacity 0.4s;
        -ms-transition: opacity 0.4s;
        transition: opacity 0.4s;
      }

      .image-loader-container li.is-loading {
        background-color: black;
        background-image: url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/82/loading.gif');
      }

      .image-loader-container li.is-broken {
        background-image: url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/82/broken.png');
        background-color: #be3730;
        width: 120px;
      }

      .image-loader-container li.is-loading img,
      .image-loader-container li.is-broken img {
        opacity: 0;
      }

      .image-loader-status {
        opacity: 0;
        position: fixed;
        right: 20px;
        top: 20px;
        background: hsla(0, 0%, 0%, 0.8);
        padding: 20px;
        border-radius: 10px;
        z-index: 2;
        color: white;
        min-width: 100px;
        text-align: center;
      }

      .image-loader-progress {
        width: 100%;
        height: 4px;
        margin-bottom: 10px;
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * 创建图片加载器
 * @param {Array<string>} imageUrls - 图片网址数组
 * @param {Object} options - 配置选项
 * @returns {HTMLElement} 包含图片容器的 div
 */
function create(imageUrls, options = {}) {
  // 创建样式（首次调用时）
  _createStyles();

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

  // 添加图片
  const fragment = document.createDocumentFragment();
  const gallery_items = imageUrls.map(src => ({ src, type: "image" }));
  
  imageUrls.forEach(url => {
    const li = document.createElement('li');
    li.className = 'is-loading';

    const img = document.createElement('img');
    img.src = url;
    
    // ✅ 正确：防守式编程
    if (typeof Fancybox !== "undefined" && Fancybox) {
      img.addEventListener("click", (event) => {
        try {
          const elem = event.target.closest("li:has(img)");
          if (!elem) return;

          const container = elem.closest("ul.image-loader-ul");
          const idxOfCall = Array.from(container.children).indexOf(elem);

          Fancybox.show(gallery_items, {
            slug: "gallery",
            startIndex: idxOfCall,
          });
        } catch (error) {
          console.warn("Gallery init failed:", error);
          // 只有 Fancybox 功能失效，不影响页面
        }
      });
    } else {
      console.error("Fancybox 未加载");
      // ✅ 提前禁用图片交互或显示提示
      img.style.cursor = "default";
    }

    li.appendChild(img);
    fragment.appendChild(li);
  });

  container.appendChild(fragment);
  wrapper.appendChild(statusElem);
  wrapper.appendChild(container);

  // 监测进度
  let loadedCount = 0;
  const supportsProgress = progressElem &&
    progressElem.toString().indexOf('Unknown') === -1;

  // 监听图片加载
  if (window.imagesLoaded) {
    const imgLoad = window.imagesLoaded(container);

    imgLoad.on('progress', function(instance, image) {
      // 更新图片状态
      image.img.parentNode.className = image.isLoaded ? '' : 'is-broken';

      // 更新进度
      loadedCount++;
      if (supportsProgress) {
        progressElem.value = loadedCount;
      }
      statusText.textContent = loadedCount + ' / ' + imageUrls.length;
    });

    imgLoad.on('always', function() {
      // 加载完成，隐藏状态
      setTimeout(() => {
        statusElem.style.opacity = '0';
      }, 500);
    });

    // 初始化进度显示
    statusElem.style.opacity = '1';
  } else {
    console.warn('imagesLoaded 库未加载');
  }

  return wrapper;
}

// ✅ ESM 导出
export default create;
export { create as ImageLoader };
