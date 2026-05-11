export default async function initPlayer({ mount, lyricsMount, mdText }) {
  // ✅ 在需要时动态导入
  const { default: APlayer } = await import('https://esm.sh/aplayer@1.10.1');
  const { audioList, autoplay } = parseMdonLite(mdText);

  mount.innerHTML = "";
  lyricsMount.innerHTML = "";

  const ap = new APlayer({
    container: mount,
    audio: audioList,
    autoplay: 1,
    lrcType: 0
  });

  const lyricBox = createLyricsView();
  lyricsMount.appendChild(lyricBox.el);

  let lyrics = [];
  let active = -1;

  async function loadLyrics() {
    lyricBox.clear();
    lyrics = [];
    active = -1;

    const item = audioList[ap.list.index];
    if (!item?.lrc) return;

    const text = await (await fetch(item.lrc)).text();
    lyrics = parseLrc(text);
    lyricBox.setLines(lyrics);
  }

  function syncHighlight() {
    if (!lyrics.length) return;

    const t = ap.audio.currentTime;
    const n = lyrics.length;

    for (let i = 0; i < n - 1; i++) {
      if (t >= lyrics[i].time && t < lyrics[i + 1].time) {
        if (i !== active) {
          active = i;
          lyricBox.highlight(i);
        }
        return;
      }
    }
  }

  lyricBox.onLineClick(i => {
    const line = lyrics[i];
    if (line) ap.seek(line.time);
  });

  ap.on("timeupdate", syncHighlight);
  ap.on("listswitch", () => Promise.resolve().then(loadLyrics));

  await loadLyrics();

  return {
    destroy() {
      ap.destroy();
      lyricBox.destroy();
      mount.innerHTML = "";
      lyricsMount.innerHTML = "";
    }
  };
}

/* ======================================================
 * mdonLite parser
 * ====================================================== */

function parseMdonLite(md) {
  const lines = md.split(/\r?\n/);
  const list = [];
  let cur = null;
  let field = null;
  let autoplay = false;

  for (const l of lines) {
    if (l.startsWith("## autoplay")) {
      autoplay = /true/i.test(l);
      continue;
    }
    if (l.startsWith("## ")) {
      if (cur?.audio) list.push(cur);
      cur = { name: l.slice(3).trim() };
      field = null;
      continue;
    }
    if (l.startsWith("### ") && cur) {
      field = l.slice(4).trim();
      cur[field] = "";
      continue;
    }
    if (cur && field && l.trim()) {
      cur[field] += l.trim();
    }
  }
  if (cur?.audio) list.push(cur);

  return {
    autoplay,
    audioList: list.map(t => ({
      name: t.name || "",
      artist: t.artist || "",
      url: t.audio || "",
      cover: t.cover || "",
      lrc: t.lrc || ""
    }))
  };
}

/* ======================================================
 * LRC
 * ====================================================== */

function parseLrc(text) {
  const out = [];
  const re = /\[(\d+):(\d+(?:\.\d+)?)\](.*)/;
  text.split(/\r?\n/).forEach(l => {
    const m = re.exec(l);
    if (m)
      out.push({
        time: +m[1] * 60 + +m[2],
        text: m[3].trim()
      });
  });
  return out.sort((a, b) => a.time - b.time);
}

/* ======================================================
 * Lyrics view（debug-02 滚动模型）
 * ====================================================== */

function createLyricsView() {
  const el = document.createElement("div");
  el.style.maxHeight = "23em";
  el.style.overflowY = "auto";
  el.style.marginTop = "1em";

  let ps = [];
  let active = null;
  let clickCb = null;

  function setLines(lines) {
    el.innerHTML = "";
    ps = lines.map((l, i) => {
      const p = document.createElement("p");
      p.textContent = l.text;
      p.onclick = () => clickCb?.(i);
      el.appendChild(p);
      return p;
    });
  }

  function highlight(i) {
    if (active) active.style.color = "";
    const p = ps[i];
    if (!p) return;
    p.style.color = "#f55";
    active = p;

    const lineRect = p.getBoundingClientRect();
    const boxRect = el.getBoundingClientRect();

    const target =
      lineRect.top -
      boxRect.top +
      el.scrollTop -
      el.clientHeight / 2 +
      lineRect.height / 2;

    // debug-02 核心：条件滚动
    if (Math.abs(target - el.scrollTop) > el.clientHeight * 0.25) {
      el.scrollTo({ top: target, behavior: "smooth" });
    }
  }
  
  return {
    el,
    setLines,
    highlight,
    onLineClick(fn) {
      clickCb = fn;
    },
    clear() {
      el.innerHTML = "";
      ps = [];
      active = null;
    },
    destroy() {
      try {
        ap.pause();   // ← 必须
        ap.destroy();
      } catch (e) {}
    }
  };
}