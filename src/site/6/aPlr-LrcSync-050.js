import initPlayer from "./aPlr-LrcSync-Mdl-050.js";

export async function initModule() {
  const target =
    document.querySelector("main.content") ||
    document.querySelector("article.popover-hint") ||
    document.querySelector("div.markdown-body") ||
    document.body;

  /* ======================================================
   * UI: toggle + panel
   * ====================================================== */

  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "toggle";
  toggleBtn.style.marginBottom = "0.5em";

  const panel = document.createElement("div");
  panel.style.border = "1px solid #ddd";
  panel.style.padding = "0.5em";
  panel.style.marginBottom = "1em";

  const input = document.createElement("input");
  input.style.width = "100%";
  input.value =
    "https://gcore.jsdelivr.net/gh/qqvvv/o/src/site/6/3.md";

  const loadBtn = document.createElement("button");
  loadBtn.textContent = "load";
  loadBtn.style.margin = "0.5em 0";

  const textarea = document.createElement("textarea");
  textarea.style.width = "100%";
  textarea.style.height = "200px";

  panel.append(input, loadBtn, textarea);

  toggleBtn.onclick = () => {
    panel.style.display = panel.style.display === "none" ? "" : "none";
  };

  /* ======================================================
   * Player containers
   * ====================================================== */

  const playerMount = document.createElement("div");
  const lyricsMount = document.createElement("div");

  target.prepend(toggleBtn, panel, playerMount, lyricsMount);

  let destroyPlayer = null;

  async function reload(mdText) {
    destroyPlayer?.();
    const { destroy } = await initPlayer({
      mount: playerMount,
      lyricsMount,
      mdText
    });
    destroyPlayer = destroy;

    // 数据齐备后默认隐藏面板
    panel.style.display = "none";
  }

  loadBtn.onclick = async () => {
    const res = await fetch(input.value);
    const md = await res.text();
    textarea.value = md;
    reload(md);
  };

  textarea.addEventListener("input", () => {
    clearTimeout(textarea._t);
    textarea._t = setTimeout(() => reload(textarea.value), 600);
  });

  if (input.value) {
    loadBtn.click();
  }

  async function destroy() {
    if (destroyPlayer) {
      destroyPlayer();
      destroyPlayer = null;
    }
  }

  return { destroy };

}