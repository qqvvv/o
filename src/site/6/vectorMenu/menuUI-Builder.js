// menuUI.js（或拆分为 menuBuilder.js）

import { parse } from './dataParser.js';

function createStyles() {
  const style = document.createElement("style");
  style.textContent = `
    :root {
      --bgColor: #0fddaf;
      --txtColor: #ffffff;
      --sizeVar: 8px;
      --textPrimary: #4b4760;
      --textSecondary: #7f7989;
      --borderColor: #cccccc;
    }
    
    body {
      font-family: "Roboto", sans-serif;
      font-size: calc(var(--sizeVar) * 1.75);
    }
    
    .flexDiv {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      position: fixed;
      right: 0;
      bottom: 0;
      margin: 32px;
    }
    
    .selectWrapper {
      width: calc(var(--sizeVar) * 20);
      opacity: 0;
      pointer-events: none;
      transition: opacity 100ms linear;
    }
    
    .multiSelect {
      border: 1px solid var(--borderColor);
      border-radius: calc(var(--sizeVar) / 2);
      background: #ffffff;
      position: absolute;
      overflow: hidden;
    }
    
    .multiSelect div {
      color: var(--textPrimary);
      padding: 16px;
      cursor: pointer;
    }
    
    .multiSelect div:hover {
      background-color: #f6f6f6;
    }
    
    .multiSelect div[data-node-type="leaf"] {
      padding: 10px 16px;
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
      font-weight: 700;
      pointer-events: none;
    }
    
    .justHover i {
      opacity: 0;
    }
    
    .justHover:hover i {
      opacity: 1;
    }
    
    button {
      font-family: "Roboto", sans-serif;
      font-size: calc(var(--sizeVar) * 1.75);
      font-weight: 500;
      border: none;
      padding: var(--sizeVar) calc(var(--sizeVar) * 2);
      border-radius: calc(var(--sizeVar) / 2);
      cursor: pointer;
      background-color: var(--bgColor);
      color: var(--txtColor);
    }
    
    button:hover {
      --bgColor: #1fcc9e;
    }
    
    .sec_btn {
      --bgColor: #869cff;
      width: calc(var(--sizeVar) * 4);
      height: calc(var(--sizeVar) * 4);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .sec_btn:hover {
      --bgColor: #6279e7;
    }
  `;
  document.head.appendChild(style);
}

/**
 * 菜单生成器类
 */
class MenuBuilder {
  constructor(options = {}) {
    this.config = {
      selectorWrapper: null,
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
   * 前进菜单
   */
  nextMenu(e) {
    const menuIndex = parseInt(e.target.parentNode.id.slice(-1));
    const multiSelects = document.querySelectorAll(".multiSelect");

    if (multiSelects[menuIndex + 1]) {
      multiSelects[menuIndex].style.transform = "translateX(-100%)";
      multiSelects[menuIndex].style.clipPath = "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)";
      multiSelects[menuIndex + 1].style.transform = "translateX(0)";
      multiSelects[menuIndex + 1].style.clipPath = "polygon(0 0, 100% 0, 100% 100%, 0% 100%)";
    }
  }

  /**
   * 返回菜单
   */
  prevMenu(e) {
    const menuIndex = parseInt(e.target.parentNode.id.slice(-1));
    const multiSelects = document.querySelectorAll(".multiSelect");

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
      const multiSelects = document.querySelectorAll(".multiSelect");
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
          commandExecutor.execute(node.text);  // ✅ 注意：commandExecutor 是实例
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
   * 创建完整的UI
   */
  create(treeData, commandExecutor) {
    const flexDiv = document.createElement("div");
    flexDiv.className = "flexDiv";

    // 主按钮
    const button = document.createElement("button");
    button.className = "sec_btn";
    button.textContent = "≡";
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
    return flexDiv;
  }
}

/**
 * 初始化应用
 */
export function initializeApp(data, commandExecutor) {
  createStyles();

  // 解析数据
  const result = parse(data);
  console.log('解析结果:', JSON.stringify(result, null, 2));

  // 创建菜单UI
  const builder = new MenuBuilder();
  const ui = builder.create(result, commandExecutor);

  document.body.appendChild(ui);
}
