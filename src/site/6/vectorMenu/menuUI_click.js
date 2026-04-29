// menuUI.js
import { parse } from './dataParser.js';
import { CommandExecutor } from './commandExecutor.js';

// 创建样式
function createStyles() {
  const style = document.createElement("style");
  style.textContent = `
    :root {
      --bgColor: #0fddaf;
      --txtColor: #ffffff;
      --borColor: rgba(0, 0, 0, 0);
      --sizeVar: 8px;
      --textPrimary: #4b4760;
      --textSecondary: #7f7989;
      --borderColor: #cccccc;
    }

    body {
      font-family: "Roboto", sans-serif;
      font-weight: 400;
      font-size: calc(var(--sizeVar) * 1.75);
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
      width: calc(var(--sizeVar) * 20);
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
  document.head.appendChild(style);
}

// 通过 DataParser 判断节点类型
function isNode(node) {
  return node.text.includes('折叠');
}

// 通过 DataParser 判断功能类型
function isFeature(node) {
  return node.text.includes('功能');
}

// 切换菜单
function openMulti() {
  const selectWrapper = document.querySelector(".selectWrapper");
  if (selectWrapper.style.pointerEvents === "all") {
    selectWrapper.style.opacity = "0";
    selectWrapper.style.pointerEvents = "none";
    resetAllMenus();
  } else {
    selectWrapper.style.opacity = "1";
    selectWrapper.style.pointerEvents = "all";
  }
}

// 前进菜单
function nextMenu(e) {
  const menuIndex = parseInt(e.target.parentNode.id.slice(-1));
  const multiSelects = document.querySelectorAll(".multiSelect");

  multiSelects[menuIndex].style.transform = "translateX(-100%)";
  multiSelects[menuIndex].style.clipPath = "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)";
  multiSelects[menuIndex + 1].style.transform = "translateX(0)";
  multiSelects[menuIndex + 1].style.clipPath = "polygon(0 0, 100% 0, 100% 100%, 0% 100%)";
}

// 返回菜单
function prevMenu(e) {
  const menuIndex = parseInt(e.target.parentNode.id.slice(-1));
  const multiSelects = document.querySelectorAll(".multiSelect");

  multiSelects[menuIndex].style.transform = "translateX(100%)";
  multiSelects[menuIndex].style.clipPath = "polygon(0 0, 0 0, 0 100%, 0% 100%)";
  multiSelects[menuIndex - 1].style.transform = "translateX(0)";
  multiSelects[menuIndex - 1].style.clipPath = "polygon(0 0, 100% 0, 100% 100%, 0% 100%)";
}

// 重置所有菜单
function resetAllMenus() {
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

// 根据数据创建菜单项
function createMenuItemsFromData(nodeArray, menuLevel) {
  const items = [];
  const executor = new CommandExecutor({ debug: true });

  nodeArray.forEach((node, index) => {
    if (isNode(node)) {
      // 节点 - 显示为可点击项，进入下级菜单
      const div = document.createElement("div");
      div.className = "iconDiv justHover";
      if (index < nodeArray.length - 1) {
        div.classList.add("bottomBorder");
      }
      div.id = `menu-${menuLevel}-nav`;
      div.onclick = nextMenu;
      div.innerHTML = `${node.text}<i class="material-icons">arrow_right</i>`;
      items.push(div);
    } else if (isFeature(node)) {
      // 功能键 - 显示为普通项，点击关闭菜单
      const div = document.createElement("div");
      if (index < nodeArray.length - 1) {
        div.classList.add("bottomBorder");
      }
      div.textContent = node.text;
      div.onclick = function() {
        executor.execute(node.text);
        openMulti();
      };
      items.push(div);
    }
  });

  return items;
}

// 递归创建菜单DOM
function createMenusFromData(dataArray, selectWrapper, menuLevel = 0) {
  dataArray.forEach((node) => {
    if (isNode(node) && node.children && node.children.length > 0) {
      const menu = document.createElement("div");
      menu.className = "multiSelect";
      menu.id = `menu-${menuLevel + 1}`;

      // 添加菜单标题
      const titleDiv = document.createElement("div");
      titleDiv.className = "bottomBorder titleDiv";
      titleDiv.textContent = node.text;
      menu.appendChild(titleDiv);

      // 添加子菜单项
      const items = createMenuItemsFromData(node.children, menuLevel + 1);
      items.forEach(item => menu.appendChild(item));

      // 添加返回按钮
      const backDiv = document.createElement("div");
      backDiv.className = "topBorder iconDiv noSpace";
      backDiv.id = `menu-${menuLevel}`;
      backDiv.onclick = prevMenu;
      backDiv.innerHTML = '<i class="material-icons">arrow_back</i>Back';
      menu.appendChild(backDiv);

      selectWrapper.appendChild(menu);

      // 递归处理子节点
      createMenusFromData(node.children, selectWrapper, menuLevel + 1);
    }
  });
}

// 创建多选UI
function createMultiSelectUI(treeData) {
  // 创建主容器
  const flexDiv = document.createElement("div");
  flexDiv.className = "flexDiv";

  // 创建按钮
  const button = document.createElement("button");
  button.className = "sec_btn";
  button.textContent = "≡";
  button.onclick = openMulti;
  flexDiv.appendChild(button);

  // 创建选择器包装
  const selectWrapper = document.createElement("div");
  selectWrapper.className = "selectWrapper";

  // 创建根菜单
  const rootMenu = document.createElement("div");
  rootMenu.className = "multiSelect";
  rootMenu.id = "menu-0";

  // 添加根菜单项
  const rootItems = createMenuItemsFromData(treeData, 0);
  rootItems.forEach(item => rootMenu.appendChild(item));

  selectWrapper.appendChild(rootMenu);

  // 递归创建子菜单
  createMenusFromData(treeData, selectWrapper, 0);

  flexDiv.appendChild(selectWrapper);

  return flexDiv;
}

// 初始化应用
export function initializeApp( data ) {
  createStyles();

  // 解析数据（使用 DataParser）
  const result = parse(data);

  console.log('解析结果:', result);

  // 创建UI
  const ui = createMultiSelectUI(result);

  document.body.appendChild(ui);
}
