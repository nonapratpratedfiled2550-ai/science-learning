(function () {
  "use strict";

  var WORLDS = {
    chemistry: {
      th: "เคมี",
      en: "Chemistry",
      color: "#ffc56b",
      url: "https://chem-lab-sigma.vercel.app/"
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
  var cursorRing = document.querySelector(".cursor-ring");
  var stars = [];
  var motes = [];
  var links = [];
  var shoots = [];
  var nextShoot = 280;
  var raf = 0;
  var w = 0;
  var h = 0;
  var mx = 0.5;
  var my = 0.5;
  var aimX = 0;
  var aimY = 0;
  var ringX = 0;
  var ringY = 0;
  var pointerOn = false;
  var HUES = [38, 196, 156, 272];

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = w < 760
      ? 150
      : Math.max(260, Math.min(620, Math.floor((w * h) / 3200)));
    stars = [];
    for (var i = 0; i < count; i++) {
      var z = Math.random();
      z = z * z;
      stars.push({
        x: Math.random(),
        y: Math.random(),
        z: z,
        r: z > 0.82 ? 1.35 + Math.random() * 1.35 : 0.45 + Math.random() * 1.05,
        p: Math.random() * Math.PI * 2,
        vy: 0.00018 + z * 0.00095,
        vx: (Math.random() - 0.5) * (0.00004 + z * 0.00014),
        warm: Math.random()
      });
    }
    motes = [];
    var moteCount = w < 760 ? 18 : 42;
    for (var m = 0; m < moteCount; m++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: 1.4 + Math.random() * 2.4,
        hue: HUES[m % HUES.length],
        speed: 0.00012 + Math.random() * 0.00035,
        phase: Math.random() * Math.PI * 2
      });
    }
    buildLinks();
  }

  function buildLinks() {
    links = [];
    if (w < 760) return;
    var ids = [];
    for (var i = 0; i < stars.length; i++) if (stars[i].z > 0.8) ids.push(i);
    for (var a = 0; a < ids.length; a++) {
      var joined = 0;
      for (var b = a + 1; b < ids.length; b++) {
        var dx = (stars[ids[a]].x - stars[ids[b]].x) * w;
        var dy = (stars[ids[a]].y - stars[ids[b]].y) * h;
        var dist = Math.hypot(dx, dy);
        if (dist > 40 && dist < 150) {
          links.push(ids[a], ids[b]);
          joined++;
          if (joined >= 2) break;
        }
      }
    }
  }

  function starColor(s) {
    if (s.warm > 0.9) return "#ffe7c2";
    if (s.x < 0.34 && s.warm > 0.62) return "#ffd59a";
    if (s.x > 0.68) return "#c9ecff";
    if (s.y > 0.7 && s.warm > 0.45) return "#b8ffdf";
    if (s.warm > 0.75) return "#e4d4ff";
    return "#ffffff";
  }

  function drawMilky(t) {
    ctx.save();
    ctx.translate(w * 0.52, h * 0.4);
    ctx.rotate(-0.42 + Math.sin(t * 0.00008) * 0.04);
    var glowBand = ctx.createLinearGradient(-w, 0, w, 0);
    glowBand.addColorStop(0, "rgba(0,0,0,0)");
    glowBand.addColorStop(0.35, "rgba(120, 90, 255, 0.08)");
    glowBand.addColorStop(0.5, "rgba(210, 220, 255, 0.2)");
    glowBand.addColorStop(0.68, "rgba(80, 190, 255, 0.08)");
    glowBand.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glowBand;
    ctx.fillRect(-w, -130, w * 2, 260);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(-w * 0.7, -18, w * 1.4, 36);
    ctx.restore();
  }

  function drawSpiral(t) {
    var cx = w * 0.8;
    var cy = h * 0.16;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.00012);
    ctx.globalCompositeOperation = "lighter";
    var core = ctx.createRadialGradient(0, 0, 0, 0, 0, 90);
    core.addColorStop(0, "rgba(255, 230, 190, 0.28)");
    core.addColorStop(0.45, "rgba(140, 100, 255, 0.12)");
    core.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, 90, 0, Math.PI * 2);
    ctx.fill();
    for (var arm = 0; arm < 3; arm++) {
      for (var i = 8; i < 78; i++) {
        var angle = i * 0.28 + arm * ((Math.PI * 2) / 3);
        var radius = i * 1.55;
        ctx.globalAlpha = 0.05 + (i / 78) * 0.22;
        ctx.fillStyle = arm === 0 ? "#d7c6ff" : arm === 1 ? "#9fd4ff" : "#ffe0ae";
        ctx.fillRect(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.62, 1.7, 1.7);
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function drawAurora(t) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (var i = 0; i < 3; i++) {
      ctx.beginPath();
      var base = h * (0.06 + i * 0.07);
      var x;
      for (x = 0; x <= w; x += 16) {
        var y = base
          + Math.sin(x * 0.006 + t * 0.00035 + i * 1.4) * (26 + i * 8)
          + Math.sin(x * 0.018 - t * 0.0006 + i) * 12;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = i === 0
        ? "rgba(90, 220, 255, 0.09)"
        : i === 1
          ? "rgba(150, 100, 255, 0.08)"
          : "rgba(90, 255, 180, 0.07)";
      ctx.lineWidth = 46 - i * 8;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPulse(t) {
    var span = Math.min(w, h) * 0.62;
    ctx.save();
    ctx.translate(w * 0.5, h * 0.42);
    for (var i = 0; i < 2; i++) {
      var p = ((t * 0.00016) + i * 0.5) % 1;
      ctx.beginPath();
      ctx.arc(0, 0, 40 + p * span, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(190, 220, 255, " + ((1 - p) * 0.16) + ")";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawStars(t) {
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      if (!reduce) {
        s.y -= s.vy;
        s.x += s.vx;
        if (s.y < 0) s.y += 1;
        if (s.x < 0) s.x += 1;
        if (s.x > 1) s.x -= 1;
      }
      var tw = reduce ? 0.85 : 0.28 + Math.abs(Math.sin(t / (380 + s.z * 520) + s.p)) * 0.72;
      var sx = s.x * w + (mx - 0.5) * s.z * 36;
      var sy = s.y * h + (my - 0.5) * s.z * 22;
      var radius = s.r * (0.5 + s.z * 0.85);
      ctx.globalAlpha = Math.max(0.28, (0.35 + s.z * 0.65) * tw);
      ctx.fillStyle = starColor(s);
      if (s.z > 0.84) {
        ctx.globalAlpha = 0.16 * tw;
        ctx.beginPath();
        ctx.arc(sx, sy, radius * 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = Math.max(0.45, tw);
      }
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fill();
      if (s.z > 0.88) {
        ctx.globalAlpha *= 0.55;
        var arm = radius * (4.2 + tw);
        ctx.fillRect(sx - arm, sy - 0.45, arm * 2, 0.9);
        ctx.fillRect(sx - 0.45, sy - arm, 0.9, arm * 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawLinks(t) {
    if (!links.length) return;
    var alpha = 0.08 + Math.sin(t * 0.001) * 0.04;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(190, 220, 255, " + Math.max(alpha, 0.04) + ")";
    ctx.beginPath();
    for (var i = 0; i < links.length; i += 2) {
      var a = stars[links[i]];
      var b = stars[links[i + 1]];
      var x1 = a.x * w + (mx - 0.5) * a.z * 36;
      var y1 = a.y * h + (my - 0.5) * a.z * 22;
      var x2 = b.x * w + (mx - 0.5) * b.z * 36;
      var y2 = b.y * h + (my - 0.5) * b.z * 22;
      if (Math.hypot(x1 - x2, y1 - y2) > 170) continue;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();
  }

  function drawMotes(t) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < motes.length; i++) {
      var mote = motes[i];
      if (!reduce) {
        mote.y -= mote.speed;
        if (mote.y < -0.05) mote.y = 1.05;
      }
      var x = mote.x * w + Math.sin(t * 0.0006 + mote.phase) * 26;
      var y = mote.y * h;
      ctx.globalAlpha = 0.35 + Math.sin(t * 0.002 + mote.phase) * 0.25;
      ctx.fillStyle = "hsl(" + mote.hue + " 100% 72%)";
      ctx.beginPath();
      ctx.arc(x, y, mote.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawShooters() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (var i = shoots.length - 1; i >= 0; i--) {
      var shoot = shoots[i];
      shoot.x += shoot.vx;
      shoot.y += shoot.vy;
      shoot.life -= shoot.fade;
      shoot.hist.push(shoot.x, shoot.y);
      if (shoot.hist.length > 36) shoot.hist.splice(0, 2);
      for (var p = 2; p < shoot.hist.length; p += 2) {
        var fade = (p / shoot.hist.length) * shoot.life;
        ctx.strokeStyle = "hsla(" + shoot.hue + ", 100%, 78%, " + Math.max(fade, 0) + ")";
        ctx.lineWidth = 0.6 + fade * 2.6;
        ctx.beginPath();
        ctx.moveTo(shoot.hist[p - 2], shoot.hist[p - 1]);
        ctx.lineTo(shoot.hist[p], shoot.hist[p + 1]);
        ctx.stroke();
      }
      ctx.globalAlpha = Math.max(shoot.life, 0);
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(shoot.x, shoot.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (shoot.life <= 0 || shoot.x > w + 120 || shoot.y > h + 120 || shoot.x < -120) shoots.splice(i, 1);
    }
    ctx.restore();
  }

  function spawnShoot(t) {
    if (t < nextShoot || shoots.length >= 5) return;
    var fast = Math.random() > 0.72;
    shoots.push({
      x: Math.random() * w * 0.75,
      y: Math.random() * h * 0.45,
      vx: (fast ? 10 : 5.5) + Math.random() * 6,
      vy: (fast ? 3.4 : 1.8) + Math.random() * 3.2,
      life: 1,
      fade: fast ? 0.018 : 0.01,
      hue: HUES[(Math.random() * HUES.length) | 0],
      hist: []
    });
    nextShoot = t + (fast ? 420 : 900) + Math.random() * 1100;
  }

  function paintSky(t) {
    if (w < 2 || h < 2) {
      if (!reduce) raf = requestAnimationFrame(paintSky);
      return;
    }
    if (document.body.classList.contains("in-world")) {
      if (!reduce) raf = requestAnimationFrame(paintSky);
      return;
    }
    ctx.clearRect(0, 0, w, h);
    drawMilky(t);
    if (w >= 760) drawSpiral(t);
    drawStars(t);
    drawLinks(t);
    drawMotes(t);
    drawAurora(t);
    drawPulse(t);
    if (!reduce) {
      spawnShoot(t);
      drawShooters();
      if (cursorRing && pointerOn) {
        ringX += (aimX - ringX) * 0.12;
        ringY += (aimY - ringY) * 0.12;
        cursorRing.style.translate = ringX + "px " + ringY + "px";
      }
      raf = requestAnimationFrame(paintSky);
    }
  }

  try {
    resize();
    if (reduce) {
      paintSky(0);
      if (cursorRing) cursorRing.style.display = "none";
    } else raf = requestAnimationFrame(paintSky);
  } catch (err) { /* ท้องฟ้าเป็นฉากหลัง ถ้าวาดไม่ได้ เมนูยังใช้ได้ */ }

  window.addEventListener("resize", function () {
    resize();
    if (reduce) paintSky(0);
  });

  document.addEventListener("visibilitychange", function () {
    if (reduce) return;
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(paintSky);
  });

  window.addEventListener("pointermove", function (event) {
    mx = event.clientX / Math.max(window.innerWidth, 1);
    my = event.clientY / Math.max(window.innerHeight, 1);
    aimX = event.clientX;
    aimY = event.clientY;
    pointerOn = true;
    if (!reduce && glow) {
      var palette = [[255, 197, 107], [122, 215, 255], [94, 240, 176]];
      var ink = palette[Math.min(2, (mx * 3) | 0)];
      glow.style.opacity = "1";
      glow.style.translate = aimX + "px " + aimY + "px";
      glow.style.background = "radial-gradient(circle, rgba(" + ink[0] + "," + ink[1] + "," + ink[2] + ",0.24), transparent 68%)";
    }
    if (!reduce && cursorRing) cursorRing.style.opacity = "1";
    document.querySelectorAll(".nebula, .aurora").forEach(function (el, index) {
      var depth = (index + 1) * 12;
      el.style.translate = ((mx - 0.5) * depth) + "px " + ((my - 0.5) * depth) + "px";
    });
  });
})();
