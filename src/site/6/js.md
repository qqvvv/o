/*
## #jsMeccano
```js
*/

const lego = 42;
// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/const

let mould = 1;
// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/let

console.assert(0)
// https://mdn.org.cn/en-US/docs/Web/API/console/info_static

  if (lego > 0) {
    mould = undefined;
  } else {
    mould = null;
  }
  // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/if...else

console.log(1 === 1);
// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Strict_equality

console.log(1 == 1);
// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Equality

const func2 = (x, y) => {
  console.debug(document.readyState);
  return x + y;
};
// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Functions/Arrow_functions

(() => {
  // 语句……
})();

// 异步 IIFE
(async () => {
  const y = await 20;
})();
// https://developer.mozilla.org/zh-CN/docs/Glossary/IIFE
// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/await

const newDiv = document.createElement("div");
// https://developer.mozilla.org/zh-CN/docs/Web/API/Document/createElement

newDiv.id = "testqq";
// https://developer.mozilla.org/zh-CN/docs/Web/API/Document/getElementById

document.body.appendChild(newDiv);
// https://developer.mozilla.org/zh-CN/docs/Web/API/Node/appendChild

const el = document.querySelector("div.user-panel.main input[name='login']");
// https://developer.mozilla.org/zh-CN/docs/Web/API/Document/querySelector

const matches = container.querySelectorAll("li[data-active='1']");
// https://developer.mozilla.org/zh-CN/docs/Web/API/Document/querySelectorAll

resetButton.addEventListener("click", () => {
  buttonToBeClicked.textContent = initialText;
  addListener();
});
// https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener

var x = 1;
// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/var

if (document.readyState === "loading") {
  // 此时加载尚未完成
  document.addEventListener("DOMContentLoaded", func2);
} else {
  // `DOMContentLoaded` 已经被触发
  console.info(document.readyState);
  func2();
}
// https://developer.mozilla.org/zh-CN/docs/Web/API/Document/DOMContentLoaded_event

  if (document.readyState === "complete") {
    console.count(document.readyState);
    func2();
  }
// https://developer.mozilla.org/zh-CN/docs/Web/API/Document/readyState

export function myFunction() {
  // …
}
// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/export

/*
```
*/