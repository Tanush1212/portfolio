const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const hasIO = "IntersectionObserver" in window;

// Footer year
$("#year").textContent = new Date().getFullYear();

// Runs fn once, the first time el is on screen
function onceVisible(el, fn, options = { threshold: 0.35 }) {
  if (!el || !hasIO) return;
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      fn();
    }
  }, options);
  io.observe(el);
}

// ---------- toast messages ----------
const toastEl = $("#toast");
let toastTimer;
function toast(text, ms = 2800) {
  toastEl.textContent = text;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
}

// ---------- hero: type the intro line, then drop in the name ----------
const hero = $(".hero");
const eyebrow = $(".eyebrow");
const title = $(".hero h1");
const late = $$(".hero .late");

let letter = 0;
function splitLetters(node) {
  [...node.childNodes].forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      [...child.textContent].forEach((ch) => {
        if (!ch.trim()) return frag.append(ch);
        const span = document.createElement("span");
        span.className = "ch";
        span.textContent = ch;
        span.setAttribute("aria-hidden", "true");
        span.style.setProperty("--i", letter++);
        frag.append(span);
      });
      child.replaceWith(frag);
    } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") {
      splitLetters(child);
    }
  });
}
title.setAttribute("aria-label", "Tanush Pillai");
splitLetters(title);

function typeInto(el, text, speed) {
  return new Promise((done) => {
    let i = 0;
    el.classList.add("typing");
    const step = () => {
      el.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(step, speed);
      else {
        el.classList.remove("typing");
        done();
      }
    };
    step();
  });
}

if (!reduceMotion) {
  const intro = eyebrow.textContent;
  title.classList.add("armed");
  late.forEach((el) => el.classList.add("armed"));
  const showAll = () => {
    title.classList.add("go");
    setTimeout(() => late.forEach((el) => el.classList.add("go")), letter * 35 + 200);
  };
  const safety = setTimeout(showAll, 2500); // never leave the hero hidden
  typeInto(eyebrow, intro, 22).then(() => {
    clearTimeout(safety);
    showAll();
  });
}

// ---------- hero starfield ----------
const canvas = $(".stars");
if (canvas && canvas.getContext && !reduceMotion) {
  const ctx = canvas.getContext("2d");
  const colors = ["#e8eaf6", "#e8eaf6", "#e8eaf6", "#4dd6ff", "#ff6b35"];
  let w = 0, h = 0, stars = [], running = true, heroOnScreen = true, mx = 0, my = 0;

  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(110, (w * h) / 9000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      z: 0.2 + Math.random() * 0.8,
      c: colors[Math.floor(Math.random() * colors.length)],
    }));
  };
  resize();
  addEventListener("resize", resize);

  hero.addEventListener("pointermove", (e) => {
    mx = e.clientX / innerWidth - 0.5;
    my = e.clientY / innerHeight - 0.5;
  });

  const frame = () => {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      s.y += s.z * 0.3;
      if (s.y > h) { s.y = 0; s.x = Math.random() * w; }
      ctx.globalAlpha = 0.25 + s.z * 0.6;
      ctx.fillStyle = s.c;
      const size = s.z > 0.8 ? 2 : 1;
      ctx.fillRect(s.x + mx * 40 * s.z, s.y + my * 24 * s.z, size, size);
    }
    requestAnimationFrame(frame);
  };
  const setRunning = () => {
    const should = heroOnScreen && !document.hidden;
    if (should && !running) { running = true; requestAnimationFrame(frame); }
    running = should;
  };
  requestAnimationFrame(frame);
  if (hasIO) {
    new IntersectionObserver(([e]) => { heroOnScreen = e.isIntersecting; setRunning(); }).observe(hero);
  }
  document.addEventListener("visibilitychange", setRunning);
}

// ---------- "Press start": quick loading screen, then the status screen ----------
const boot = $("#boot");
$(".press-start .btn").addEventListener("click", (e) => {
  if (reduceMotion) return;
  e.preventDefault();
  boot.classList.add("on");
  setTimeout(() => {
    $("#about").scrollIntoView({ behavior: "instant" });
    history.replaceState(null, "", "#about");
    boot.classList.add("out");
  }, 650);
  setTimeout(() => boot.classList.remove("on", "out"), 1100);
});

// ---------- stats: tap to train, STUDY WILL refuses ----------
const card = $(".stat-card");
const statBtns = $$(".stat-btn");
const levelEl = $("#level");

function updateLevel(bump) {
  const vals = statBtns.map((b) => Number(b.dataset.v));
  levelEl.textContent = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  if (bump) {
    levelEl.classList.remove("bump");
    void levelEl.offsetWidth;
    levelEl.classList.add("bump");
  }
}
function setStat(btn, v) {
  btn.dataset.v = v;
  btn.querySelector("b").textContent = v;
  btn.querySelector(".bar i").style.setProperty("--v", v);
  btn.setAttribute("aria-label", `Train ${btn.querySelector("span").textContent}, currently ${v}`);
}
function floatText(btn, text, cls = "") {
  const f = document.createElement("span");
  f.className = `float ${cls}`;
  f.textContent = text;
  f.setAttribute("aria-hidden", "true");
  btn.append(f);
  setTimeout(() => f.remove(), 900);
}
updateLevel(false);

statBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const name = btn.querySelector("span").textContent;
    const v = Number(btn.dataset.v);
    if (btn.classList.contains("low") && !btn.classList.contains("cheat")) {
      card.classList.remove("shake");
      void card.offsetWidth;
      card.classList.add("shake");
      toast("STUDY WILL can't be trained. It only regenerates during exam week.");
      return;
    }
    if (v >= 100) {
      floatText(btn, "MAX", "max");
      toast(`${name} is already maxed out.`, 1800);
      return;
    }
    setStat(btn, v + 1);
    floatText(btn, "+1");
    updateLevel(true);
  });
});

// Count the numbers up the first time the card is seen
onceVisible(card, () => {
  if (reduceMotion) return;
  statBtns.forEach((btn) => {
    const b = btn.querySelector("b");
    const end = Number(btn.dataset.v);
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / 900);
      b.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
      else b.textContent = btn.dataset.v;
    };
    requestAnimationFrame(tick);
  });
});

// Older browsers without scroll-driven animation: fill the bars when the card is seen
if (!CSS.supports("animation-timeline: view()") && !reduceMotion && hasIO) {
  card.classList.add("arm");
  onceVisible(card, () => card.classList.add("on"));
}

// Cheat code: ↑ ↑ ↓ ↓ ← → ← → B A
const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
let konamiPos = 0;
let cheating = false;
addEventListener("keydown", (e) => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  konamiPos = key === konami[konamiPos] ? konamiPos + 1 : key === konami[0] ? 1 : 0;
  if (konamiPos === konami.length) {
    konamiPos = 0;
    if (cheating) return;
    cheating = true;
    const will = $(".stat-btn.low");
    will.classList.add("cheat");
    setStat(will, 100);
    updateLevel(true);
    toast("Cheat code accepted. STUDY WILL is 100 for 6 seconds.");
    setTimeout(() => {
      setStat(will, 6);
      will.classList.remove("cheat");
      updateLevel(true);
      toast("Cheat expired. STUDY WILL is back to 6.");
      cheating = false;
    }, 6000);
  }
});

// ---------- cards tilt toward the cursor ----------
if (finePointer && !reduceMotion) {
  $$(".quest, .stat-card").forEach((el) => {
    const strength = el.classList.contains("stat-card") ? 4 : 7;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
      el.style.setProperty("--ry", `${(x - 0.5) * strength}deg`);
      el.style.setProperty("--rx", `${(0.5 - y) * strength}deg`);
    });
    el.addEventListener("pointerleave", () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    });
  });
}

// ---------- skill chips pop in one after another ----------
$$(".chips li").forEach((li, i) => li.style.setProperty("--i", i));

// ---------- side quests: typed reply plus a little burst ----------
const msg = $("#interest-msg");
const live = $("#interest-live");
let typingTimer;

function burst(el) {
  if (reduceMotion) return;
  const r = el.getBoundingClientRect();
  for (let i = 0; i < 12; i++) {
    const s = document.createElement("i");
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 45;
    s.className = "spark";
    s.style.left = `${r.left + r.width / 2}px`;
    s.style.top = `${r.top + r.height / 2}px`;
    s.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    s.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
    s.style.background = i % 3 ? "var(--accent-2)" : "var(--accent)";
    document.body.append(s);
    setTimeout(() => s.remove(), 700);
  }
}

$$(".interest").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".interest").forEach((b) => {
      b.classList.remove("picked");
      b.setAttribute("aria-pressed", "false");
    });
    btn.classList.add("picked");
    btn.setAttribute("aria-pressed", "true");
    const text = btn.dataset.msg;
    live.textContent = text;
    clearTimeout(typingTimer);
    burst(btn);
    if (reduceMotion) {
      msg.textContent = text;
      return;
    }
    let i = 0;
    msg.classList.add("typing");
    const step = () => {
      msg.textContent = text.slice(0, ++i);
      if (i < text.length) typingTimer = setTimeout(step, 22);
      else msg.classList.remove("typing");
    };
    step();
  });
});

// ---------- contact: copy email ----------
$$("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      toast("Email copied. Party invite ready to send.");
    } catch {
      toast(`Couldn't copy it. The email is ${btn.dataset.copy}`);
    }
  });
});

// Level up when the visitor reaches the end
onceVisible($("#contact"), () => {
  $(".xp").classList.add("max");
  toast("LEVEL UP! You reached the end of the quest log.");
}, { threshold: 0.5 });

// ---------- nav: highlight the section on screen ----------
if (hasIO) {
  const links = new Map($$("nav a").map((a) => [a.getAttribute("href").slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.remove("active"));
      links.get(e.target.id)?.classList.add("active");
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => io.observe(s));
}
