/*
  Shared renderer. Each page defines window SECTIONS before loading this file.
  Item types:
    "video"     → src, poster (optional)
    "image"     → src
    "youtube"   → id
    "instagram" → url, poster (optional)
  Section options:
    vertical: true   → 4 columns, 9:16
    static: true     → 3 columns (for static ads)
    ratio: "4 / 5"   → card aspect ratio (default 16:9, or 9:16 when vertical)
  Sections with no items are hidden.
*/
const root = document.getElementById("sections");
let autoplaySection = false;
const autoplay = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (e.isIntersecting) e.target.play().catch(() => {});
    else e.target.pause();
  }
}, { threshold: 0.4 });
let delay = 0;

if (!SECTIONS.some(s => s.items.length)) {
  root.innerHTML = `<p class="empty">${root.dataset.empty || "Coming soon."}</p>`;
}

for (const s of SECTIONS) {
  if (!s.items.length) continue;
  const sec = document.createElement("section");
  sec.innerHTML = `<div class="section-head"><h2>${s.title}</h2><span class="count">${String(s.items.length).padStart(2, "0")}</span></div>${s.note ? `<p class="note">${s.note}</p>` : ""}`;
  const grid = document.createElement("div");
  grid.className = "grid" + (s.vertical ? " vertical" : "") + (s.static ? " static" : "");
  if (s.ratio) { grid.dataset.ratio = ""; grid.style.setProperty("--ratio", s.ratio); }
  autoplaySection = !!s.vertical;
  for (const it of s.items) grid.appendChild(card(it, delay += 80));
  sec.appendChild(grid);
  root.appendChild(sec);
}

function card(it, d) {
  const el = document.createElement("article");
  el.className = "card";
  el.style.animationDelay = d + "ms";
  const media = document.createElement("div");
  media.className = "media";

  if (it.type === "youtube") {
    const img = new Image();
    img.alt = it.title;
    img.loading = "lazy";
    img.src = `https://i.ytimg.com/vi/${it.id}/maxresdefault.jpg`;
    img.onerror = () => { img.onerror = null; img.src = `https://i.ytimg.com/vi/${it.id}/hqdefault.jpg`; };
    media.append(img, playBtn());
    media.onclick = () => {
      media.innerHTML = `<iframe src="https://www.youtube.com/embed/${it.id}?autoplay=1&rel=0&playsinline=1&origin=${encodeURIComponent(location.origin)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" title="${it.title}"></iframe>`;
      media.style.cursor = "default";
    };
  } else if (it.type === "video") {
    const v = document.createElement("video");
    v.src = it.src; v.playsInline = true;
    if (it.poster) v.poster = it.poster;
    if (autoplaySection) {
      // Short vertical clips play muted in a loop while on screen, like a feed.
      v.muted = true; v.loop = true; v.preload = "none";
      media.append(v, soundBtn());
      autoplay.observe(v);
      media.onclick = () => {
        v.muted = false; v.loop = false; v.controls = true;
        v.currentTime = 0; v.play();
        autoplay.unobserve(v); media.querySelector(".sound")?.remove(); media.onclick = null;
      };
    } else {
      v.preload = "metadata";
      const btn = playBtn();
      media.append(v, btn);
      media.onclick = () => { v.controls = true; btn.remove(); v.play(); media.onclick = null; };
    }
  } else if (it.type === "image") {
    const img = new Image(); img.src = it.src; img.alt = it.title || ""; img.loading = "lazy";
    if (it.w && it.h) { media.classList.add("natural"); media.style.aspectRatio = `${it.w} / ${it.h}`; }
    media.append(img);
    media.onclick = () => openLightbox(it.src);
  } else if (it.type === "instagram") {
    const a = document.createElement("a");
    a.href = it.url; a.target = "_blank"; a.rel = "noopener";
    if (it.poster) { const img = new Image(); img.src = it.poster; img.alt = it.title || ""; a.append(img); }
    a.append(playBtn());
    media.append(a);
  }

  el.appendChild(media);
  if (it.title || it.meta) {
    const c = document.createElement("div");
    c.className = "caption";
    c.innerHTML = `${it.title ? `<div class="title">${it.title}</div>` : ""}${it.meta ? `<div class="meta">${it.meta}</div>` : ""}`;
    el.appendChild(c);
  }
  return el;
}

function soundBtn() { const b = document.createElement("span"); b.className = "sound"; b.textContent = "Sound on"; return b; }

function playBtn() { const b = document.createElement("span"); b.className = "play"; return b; }

function openLightbox(src) {
  const box = document.createElement("div");
  box.className = "lightbox";
  box.innerHTML = `<img src="${src}" alt="">`;
  const close = () => { box.remove(); document.removeEventListener("keydown", onKey); };
  const onKey = e => { if (e.key === "Escape") close(); };
  box.onclick = close;
  document.addEventListener("keydown", onKey);
  document.body.appendChild(box);
}
