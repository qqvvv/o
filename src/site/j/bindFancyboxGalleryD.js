/**
 * 为图片容器绑定 Fancybox 事件委托
 * @param {HTMLElement} container - 图片容器（ul 或其他）
 * @param {Array} imageData - 图片数据数组 [{ src, ... }, ...]
 * @param {Object} options - Fancybox 选项
 */
import Fancybox_css from 'https://cdnjs.cloudflare.com/ajax/libs/fancyapps-ui/5.0.36/fancybox/fancybox.min.css' with { type: "css" };
import { Fancybox } from 'https://cdnjs.cloudflare.com/ajax/libs/fancyapps-ui/5.0.36/fancybox/fancybox.esm.min.js';
import { urlParse } from './urlParse.js';
import { render } from './render.js';

document.adoptedStyleSheets.push(Fancybox_css);

export const bindFancyboxGallery = (container, srcMapedArray, options = {}) => {
  if (!container) {
    console.warn("❌ bindFancyboxGallery: 容器不存在");
    return false;
  }

  if (!Fancybox) {
    console.warn("⚠️ Fancybox 未加载");
    return false;
  }

  if (!Array.isArray(srcMapedArray) || srcMapedArray.length === 0) {
    console.warn("❌ bindFancyboxGallery: 图片数据为空");
    return false;
  }

  // 事件委托：单一监听器
  container.addEventListener('click', (event) => {
    // 向上查找图片单元（li:has(img)）
    const unit = event.target.closest('li:has(img)');
    if (!unit) return;

    // 获取被点击单元在容器中的索引
    const startIndex = Array.from(container.children).indexOf(unit);

    // 打开 Fancybox
    Fancybox.show(srcMapedArray, {
      slug: 'gallery',
      startIndex: startIndex,
      // 合并用户传入的选项
      ...options,
      caption: (fancybox, slide) => {
        const img = slide.imageEl;
        const obj = {
          '宽高': `${img.naturalWidth} x ${img.naturalHeight}`,
          '自动': `${((img.height / img.naturalHeight) * 100).toFixed(2)} %`,
          '来源': urlParse.getCoreDomain(img.src),
          '文件': urlParse.getFileName(img.src),
        };
        const tag = render.renderStyledTags(obj);
        return tag;
      },
    });
  });

  console.log("✅ Fancybox 事件绑定成功");
  return true;
};
