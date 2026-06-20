/**
 * 菜单
 * menuUI.js
 */

import { parse } from './dataParser.js';

/**
 * 菜单生成器类 - Shadow DOM 版本
 */
class MenuBuilder {
  constructor(options = {}) {
    this.config = {
      selectorWrapper: null,
      shadowRoot: null,
      ...options
    };
  }

  /**
   * 切换菜单显示/隐藏
   */
  toggleMenu() {
    const selectWrapper = this.config.selectorWrapper;
    if (!selectWrapper) return;

    if (selectWrapper.style.pointerEvents === "all") {
      selectWrapper.style.opacity = "0";
      selectWrapper.style.pointerEvents = "none";
      this._resetAllMenus();
    } else {
      selectWrapper.style.opacity = "1";
      selectWrapper.style.pointerEvents = "all";
    }
  }

  /**
   * 前进菜单 - 改进版（在 Shadow DOM 内查询）
   */
  nextMenu(e) {
    const menuIndex = parseInt(e.target.parentNode.id.slice(-1));
    const multiSelects = this.config.shadowRoot.querySelectorAll(".multiSelect");

    if (multiSelects[menuIndex + 1]) {
      multiSelects[menuIndex].style.transform = "translateX(-100%)";
      multiSelects[menuIndex].style.clipPath = "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)";
      multiSelects[menuIndex + 1].style.transform = "translateX(0)";
      multiSelects[menuIndex + 1].style.clipPath = "polygon(0 0, 100% 0, 100% 100%, 0% 100%)";
    }
  }

  /**
   * 返回菜单 - 改进版（在 Shadow DOM 内查询）
   */
  prevMenu(e) {
    const menuIndex = parseInt(e.target.parentNode.id.slice(-1));
    const multiSelects = this.config.shadowRoot.querySelectorAll(".multiSelect");

    if (multiSelects[menuIndex - 1]) {
      multiSelects[menuIndex].style.transform = "translateX(100%)";
      multiSelects[menuIndex].style.clipPath = "polygon(0 0, 0 0, 0 100%, 0% 100%)";
      multiSelects[menuIndex - 1].style.transform = "translateX(0)";
      multiSelects[menuIndex - 1].style.clipPath = "polygon(0 0, 100% 0, 100% 100%, 0% 100%)";
    }
  }

  /**
   * 重置所有菜单
   */
  _resetAllMenus() {
    setTimeout(() => {
      const multiSelects = this.config.shadowRoot.querySelectorAll(".multiSelect");
      for (let i = 1; i < multiSelects.length; i++) {
        multiSelects[i].style.transform = "translateX(100%)";
        multiSelects[i].style.clipPath = "polygon(0 0, 0 0, 0 100%, 0% 100%)";
      }
      multiSelects[0].style.transform = "translateX(0)";
      multiSelects[0].style.clipPath = "polygon(0 0, 100% 0, 100% 100%, 0% 100%)";
    }, 300);
  }

  /**
   * 创建菜单项DOM
   */
  _createMenuItems(nodeArray, menuLevel, commandExecutor) {
    const items = [];

    nodeArray.forEach((node, index) => {
      const isLeaf = node.nodeChildren === 0;
      const isNode = node.nodeChildren > 0;

      if (isNode) {
        // 分支节点
        const div = document.createElement("div");
        div.className = "iconDiv justHover";
        div.dataset.nodeType = "branch";
        div.dataset.depth = menuLevel;

        if (index < nodeArray.length - 1) {
          div.classList.add("bottomBorder");
        }

        div.id = `menu-${menuLevel}-nav`;
        div.onclick = this.nextMenu.bind(this);
        div.innerHTML = `${node.text}<i class="material-icons">arrow_right</i>`;
        items.push(div);
      } else if (isLeaf) {
        // 叶子节点（功能项）
        const div = document.createElement("div");
        div.className = "narrow";
        div.dataset.nodeType = "leaf";
        div.dataset.depth = menuLevel;

        if (index < nodeArray.length - 1) {
          div.classList.add("bottomBorder");
        }

        div.textContent = node.text;
        div.onclick = () => {
          commandExecutor.execute(node.text, {
            funcName: node.funcName,
          });
          this.toggleMenu();
        };
        items.push(div);
      }
    });

    return items;
  }

  /**
   * 递归创建所有菜单
   */
  _createMenusRecursive(dataArray, selectWrapper, menuLevel, commandExecutor) {
    dataArray.forEach(node => {
      const isNode = node.nodeChildren > 0;

      if (isNode && node.children?.length) {
        const menu = document.createElement("div");
        menu.className = "multiSelect";
        menu.id = `menu-${menuLevel + 1}`;
        menu.dataset.level = menuLevel + 1;

        // 标题
        const titleDiv = document.createElement("div");
        titleDiv.className = "bottomBorder titleDiv";
        titleDiv.textContent = node.text;
        menu.appendChild(titleDiv);

        // 菜单项
        const items = this._createMenuItems(
          node.children,
          menuLevel + 1,
          commandExecutor
        );
        items.forEach(item => menu.appendChild(item));

        // 返回按钮
        const backDiv = document.createElement("div");
        backDiv.className = "topBorder iconDiv noSpace";
        backDiv.id = `menu-${menuLevel}`;
        backDiv.onclick = this.prevMenu.bind(this);
        backDiv.innerHTML = '<i class="material-icons">arrow_back</i>Back';
        menu.appendChild(backDiv);

        selectWrapper.appendChild(menu);

        // 递归处理子节点
        this._createMenusRecursive(
          node.children,
          selectWrapper,
          menuLevel + 1,
          commandExecutor
        );
      }
    });
  }

  /**
   * 获取样式字符串（从外部 CSS 文件复制）
   */
  _getStyleSheet() {
    return `
      :host {
        --bgColor: #0fddaf;
        --txtColor: #ffffff;
        --borColor: rgba(0, 0, 0, 0);
        --sizeVar: 8px;
        --textPrimary: #4b4760;
        --textSecondary: #7f7989;
        --borderColor: #cccccc;
      }

      * {
        font-family: "Roboto", sans-serif;
        font-weight: 400;
        font-size: calc(var(--sizeVar) * 1.75);
        box-sizing: border-box;
      }

      .flexDiv {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        width: fit-content;
        margin: 32px;
        position: fixed;
        right: 0;
        bottom: 0;
      }

      .selectWrapper {
        width: calc(var(--sizeVar) * 25);
        position: relative;
        opacity: 0;
        pointer-events: none;
        transition: opacity 100ms linear 0s;
        filter: drop-shadow(0 6px 26px rgba(0, 0, 0, 0.24));
        padding-top: calc(var(--sizeVar) / 2);
        bottom: calc(var(--sizeVar) * 4.5);
      }

      .multiSelect {
        clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);
        border: 1px solid var(--borderColor);
        box-sizing: border-box;
        border-radius: calc(var(--sizeVar) / 2);
        position: absolute;
        width: auto;
        left: 0;
        right: 0;
        overflow: hidden;
        background: #ffffff;
        transition: transform 300ms ease-in-out 0s, clip-path 300ms ease-in-out 0s;
        bottom: 100%;
      }

      .multiSelect div {
        color: var(--textPrimary);
        padding: 16px;
        width: auto;
        cursor: pointer;
      }

      .multiSelect div:hover {
        background-color: #f6f6f6;
      }

      .bottomBorder {
        border-bottom: 1px solid var(--borderColor);
      }

      .topBorder {
        border-top: 1px solid var(--borderColor);
      }

      .iconDiv {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .noSpace {
        justify-content: flex-start;
        gap: 6px;
      }

      .titleDiv {
        pointer-events: none;
        font-weight: 700;
      }

      .justHover i {
        opacity: 0;
      }

      .justHover:hover i {
        opacity: 1;
      }

      .multiSelect .placeholder {
        color: var(--textSecondary);
        font-style: italic;
      }

      .multiSelect .narrow {
        padding-top: 10px;
        padding-bottom: 10px;
      }

      .multiSelect i {
        color: var(--textSecondary);
      }

      .multiSelect {
        transform: translateX(100%);
        clip-path: polygon(0 0, 0 0, 0 100%, 0% 100%);
      }

      .multiSelect:nth-of-type(1) {
        transform: translateX(0);
        clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);
      }

      .sec_btn {
        --bgColor: #869cff;
        width: calc(var(--sizeVar) * 4);
        height: calc(var(--sizeVar) * 4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: calc(var(--sizeVar) * 3);
      }

      button {
        font-family: "Roboto", sans-serif;
        font-size: calc(var(--sizeVar) * 1.75);
        font-weight: 500;
        border: none;
        outline: none;
        padding: var(--sizeVar) calc(var(--sizeVar) * 2);
        border-radius: calc(var(--sizeVar) / 2);
        cursor: pointer;
        background-color: var(--bgColor);
        color: var(--txtColor);
        box-shadow: 0 0 0 1px var(--borColor) inset;
      }

      button:focus {
        --borColor: rgba(0, 0, 0, 0.4);
      }

      button:hover {
        --bgColor: #1fcc9e;
      }

      .sec_btn:hover {
        --bgColor: #6279e7;
      }

      .tri_btn:hover {
        --bgColor: #f8f7f8;
      }

      button:active {
        --bgColor: #1db284;
      }

      .sec_btn:active {
        --bgColor: #5468c7;
      }

      .tri_btn:active {
        --bgColor: #e7e7e7;
      }
    `;
  }

  /**
   * 创建完整的UI - Shadow DOM 版本
   */
  create(treeData, commandExecutor) {
    // 创建容器
    const container = document.createElement("div");
    const shadowRoot = container.attachShadow({ mode: 'open' });
    
    // 保存 shadowRoot 引用
    this.config.shadowRoot = shadowRoot;

    // 创建样式标签
    const styleElement = document.createElement('style');
    styleElement.textContent = this._getStyleSheet();
    shadowRoot.appendChild(styleElement);

    // 创建 flexDiv（菜单容器）
    const flexDiv = document.createElement("div");
    flexDiv.className = "flexDiv";

    // 主按钮
    const button = document.createElement("button");
    button.className = "sec_btn";
    button.textContent = "⚍";
    button.onclick = this.toggleMenu.bind(this);
    flexDiv.appendChild(button);

    // 菜单包装
    const selectWrapper = document.createElement("div");
    selectWrapper.className = "selectWrapper";
    this.config.selectorWrapper = selectWrapper;

    // 根菜单
    const rootMenu = document.createElement("div");
    rootMenu.className = "multiSelect";
    rootMenu.id = "menu-0";

    const rootItems = this._createMenuItems(
      treeData,
      0,
      commandExecutor
    );
    rootItems.forEach(item => rootMenu.appendChild(item));

    selectWrapper.appendChild(rootMenu);

    // 递归创建子菜单
    this._createMenusRecursive(
      treeData,
      selectWrapper,
      0,
      commandExecutor
    );

    flexDiv.appendChild(selectWrapper);
    shadowRoot.appendChild(flexDiv);

    return container;
  }
}

/**
 * 初始化应用
 */
export function initializeApp(data, commandExecutor) {
  // 解析数据
  const result = parse(data);
  
  // 创建菜单UI
  const builder = new MenuBuilder();
  const ui = builder.create(result, commandExecutor);

  document.body.appendChild(ui);
}
