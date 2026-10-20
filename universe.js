(function () {
  "use strict";

  var WORLDS = {
    chemistry: {
      th: "เคมี",
      en: "Chemistry",
      color: "#ffc56b",
      url: "https://chemistry11.vercel.app/#home"
    },
    physics: {
      th: "ฟิสิกส์",
      en: "Physics",
      color: "#7ad7ff",
      url: "https://physics-omega-lemon.vercel.app/"
    },
    biology: {
      th: "ชีววิทยา",
      en: "Biology",
      color: "#5ef0b0",
      url: "https://bio-learning.vercel.app"
    }
  };

  var HOME_TITLE = "Science Learning | จักรวาลของวิทยาศาสตร์";
  var viewer = document.getElementById("viewer");
  var frame = document.getElementById("frame");
  var warp = document.getElementById("warp");
  var warpText = document.getElementById("warp-text");
  var openFull = document.getElementById("open-full");
  var orrery = document.getElementById("orrery");
  var intro = document.getElementById("intro");
  var openId = "";
  var token = 0;
  var lastFocus = null;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function hashId() {
    return (location.hash || "").replace("#", "");
  }

  function dismissIntro() {
    if (intro) intro.classList.add("done");
  }

  if (intro) {
    intro.addEventListener("click", dismissIntro);
    if (reduce || WORLDS[hashId()]) dismissIntro();
    else setTimeout(dismissIntro, 1700);
  }

  var helix = document.querySelector(".helix");
  if (helix) {
    for (var i = 0; i < 12; i++) {
      var a = document.createElement("span");
      var b = document.createElement("span");
      a.style.setProperty("--i", i);
      b.className = "b";
      b.style.setProperty("--i", i);
      helix.appendChild(a);
      helix.appendChild(b);
    }
  }

  function mark(id) {
    var current = WORLDS[id] ? id : "home";
    document.querySelectorAll(".navlink").forEach(function (link) {
      var on = link.dataset.nav === current;
      link.classList.toggle("is-on", on);
      if (on) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
      if (link.getAttribute("role") === "tab") {
        link.setAttribute("aria-selected", on ? "true" : "false");
      }
    });
  }

  function finishWarp(my, started) {
    if (my !== token) return;
    var wait = Math.max(0, 720 - (performance.now() - started));
    setTimeout(function () {
      if (my === token) warp.hidden = true;
    }, wait);
  }

  function startWarp(world) {
    var my = ++token;
    var started = performance.now();
    warpText.textContent = "กำลังเดินทางสู่โลก" + world.th;
    warp.hidden = false;
    frame.onload = function () { finishWarp(my, started); };
    setTimeout(function () { finishWarp(my, started); }, 5200);
  }

  function show(id) {
    var world = WORLDS[id];
    var first = !openId;
    var changed = openId !== id;
    if (first) lastFocus = document.activeElement;
    openId = id;
    dismissIntro();
    document.body.classList.add("in-world");
    document.documentElement.dataset.world = id;
    viewer.hidden = false;
    viewer.setAttribute("aria-hidden", "false");
    viewer.style.setProperty("--accent", world.color);
    requestAnimationFrame(function () { viewer.classList.add("open"); });
    openFull.href = world.url;
    document.title = world.th + " · Science Learning";
    frame.title = "โลก" + world.th + " · " + world.en;
    if (!changed) return;
    startWarp(world);
    frame.src = world.url;
    if (first) document.getElementById("back-home").focus();
  }

  function hide() {
    var was = openId;
    token++;
    openId = "";
    document.body.classList.remove("in-world");
    delete document.documentElement.dataset.world;
    viewer.classList.remove("open");
    viewer.setAttribute("aria-hidden", "true");
    warp.hidden = true;
    if (was) {
      frame.onload = null;
      frame.src = "about:blank";
    }
    setTimeout(function () {
      if (!openId) viewer.hidden = true;
    }, 380);
    document.title = HOME_TITLE;
    if (was && lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function render() {
    var id = hashId();
    if (WORLDS[id]) show(id);
    else hide();
    mark(id);
  }

  window.addEventListener("hashchange", render);
  render();
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && openId) location.hash = "#top";
  });

  document.querySelectorAll("[data-world]").forEach(function (el) {
    el.addEventListener("pointerenter", function () {
      orrery.dataset.hover = el.dataset.world;
    });
    el.addEventListener("pointerleave", function () {
      if (orrery.dataset.hover === el.dataset.world) orrery.dataset.hover = "";
    });
  });

  var comet = document.querySelector(".scroll-comet span");
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (comet) comet.style.top = p + "%";
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  var canvas = document.getElementById("sky");
  var ctx = canvas.getContext("2d");
  var glow = document.querySelector(".cursor-glow");
  var stars = [];
  var shoots = [];
  var nextShoot = 800;
  var raf = 0;
  var w = 0;
  var h = 0;
  var mx = 0.5;
  var my = 0.5;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.max(180, Math.min(560, Math.floor((w * h) / 2800)));
    stars = [];
    for (var i = 0; i < count; i++) {
      var z = Math.random();
      z = z * z;
      stars.push({
        x: Math.random(),
        y: Math.random(),
        z: z,
        r: z > 0.82 ? 1.25 + Math.random() * 1.05 : 0.55 + Math.random() * 0.95,
        p: Math.random() * Math.PI * 2,
        vy: 0.00022 + z * 0.00105,
        vx: (Math.random() - 0.5) * (0.00005 + z * 0.00012),
        warm: Math.random()
      });
    }
  }

  function drawMilky() {
    if (w < 2 || h < 2) return;
    ctx.save();
    ctx.translate(w * 0.5, h * 0.42);
    ctx.rotate(-0.45);
    var g = ctx.createLinearGradient(-w, 0, w, 0);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.5, "rgba(170, 180, 255, 0.07)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(-w, -90, w * 2, 180);
    ctx.restore();
  }

  function drawShooters() {
    for (var i = shoots.length - 1; i >= 0; i--) {
      var shoot = shoots[i];
      shoot.x += shoot.vx;
      shoot.y += shoot.vy;
      shoot.life -= 0.012;
      var x2 = shoot.x - shoot.vx * 10;
      var y2 = shoot.y - shoot.vy * 10;
      var g = ctx.createLinearGradient(shoot.x, shoot.y, x2, y2);
      g.addColorStop(0, "rgba(255,255,255," + Math.max(shoot.life, 0) + ")");
      g.addColorStop(1, "rgba(180,210,255,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(shoot.x, shoot.y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      if (shoot.life <= 0 || shoot.x > w + 80 || shoot.y > h + 80) shoots.splice(i, 1);
    }
  }

  function frame(t) {
    if (w < 2 || h < 2) {
      if (!reduce) raf = requestAnimationFrame(frame);
      return;
    }
    ctx.clearRect(0, 0, w, h);
    drawMilky();
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      if (!reduce) {
        s.y -= s.vy;
        s.x += s.vx;
        if (s.y < 0) s.y += 1;
        if (s.x < 0) s.x += 1;
        if (s.x > 1) s.x -= 1;
      }
      var tw = reduce ? 0.85 : 0.35 + Math.sin(t / (420 + s.z * 500) + s.p) * 0.55;
      var px = s.x * w + (mx - 0.5) * s.z * 22;
      var py = s.y * h + (my - 0.5) * s.z * 14;
      var radius = s.r * (0.45 + s.z * 0.7);
      ctx.globalAlpha = Math.max(0.42, (0.5 + s.z * 0.5) * (0.62 + tw * 0.38));
      ctx.fillStyle = s.warm > 0.86 ? "#ffe3b0" : s.warm > 0.7 ? "#d5e8ff" : "#ffffff";
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
      if (s.z > 0.9) {
        ctx.globalAlpha *= 0.4;
        ctx.fillRect(px - radius * 3.2, py - 0.35, radius * 6.4, 0.7);
        ctx.fillRect(px - 0.35, py - radius * 3.2, 0.7, radius * 6.4);
      }
    }
    ctx.globalAlpha = 1;
    if (!reduce) {
      if (t > nextShoot && shoots.length < 3) {
        shoots.push({
          x: Math.random() * w * 0.8,
          y: Math.random() * h * 0.55,
          vx: 6 + Math.random() * 7,
          vy: 2.2 + Math.random() * 4,
          life: 1
        });
        nextShoot = t + 1600 + Math.random() * 2200;
      }
      drawShooters();
      raf = requestAnimationFrame(frame);
    }
  }

  try {
    resize();
    if (reduce) frame(0);
    else raf = requestAnimationFrame(frame);
  } catch (err) { /* ท้องฟ้าเป็นฉากหลัง ถ้าวาดไม่ได้ เมนูยังใช้ได้ */ }

  window.addEventListener("resize", function () {
    resize();
    if (reduce) frame(0);
  });

  document.addEventListener("visibilitychange", function () {
    if (reduce) return;
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(frame);
  });

  window.addEventListener("pointermove", function (event) {
    mx = event.clientX / Math.max(window.innerWidth, 1);
    my = event.clientY / Math.max(window.innerHeight, 1);
    if (glow && !reduce) glow.style.translate = event.clientX + "px " + event.clientY + "px";
    document.querySelectorAll(".nebula").forEach(function (el, index) {
      var depth = (index + 1) * 14;
      el.style.translate = ((mx - 0.5) * depth) + "px " + ((my - 0.5) * depth) + "px";
    });
  });
})();
