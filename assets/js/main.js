/* Metal World — interactions */
(() => {
  // Single place to change the contact address once the domain mailbox is live.
  const DESK_EMAIL = "desk@metalworld.example";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------------- Nav ---------------- */
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const burger = $("#burger");
  const drawer = $("#drawer");
  const setDrawer = open => {
    burger.setAttribute("aria-expanded", open);
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", !open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => setDrawer(burger.getAttribute("aria-expanded") !== "true"));
  $$("a", drawer).forEach(a => a.addEventListener("click", () => setDrawer(false)));

  /* ---------------- Contact links ---------------- */
  $$(".mailto").forEach(a => { a.href = `mailto:${DESK_EMAIL}`; a.textContent = DESK_EMAIL; });
  $$(".ticket").forEach(a => {
    a.href = `mailto:${DESK_EMAIL}?subject=${encodeURIComponent(a.dataset.subject)}`;
  });

  /* ---------------- Reveal ---------------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const siblings = $$(".reveal", e.target.parentElement);
      e.target.style.transitionDelay = `${Math.min(siblings.indexOf(e.target), 6) * 80}ms`;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach(el => io.observe(el));

  /* ---------------- Elements: tap to reveal on touch ---------------- */
  $$(".el").forEach(el => el.addEventListener("click", () => {
    const was = el.classList.contains("is-active");
    $$(".el").forEach(x => x.classList.remove("is-active"));
    if (!was) el.classList.add("is-active");
  }));

  /* ---------------- Hero spread canvas ---------------- */
  const canvas = $("#spreadCanvas");
  const ctx = canvas.getContext("2d");
  const rO = $("#rOrigin"), rD = $("#rDest"), rDelta = $("#rDelta");
  const N = 140;
  const fmt = n => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  let origin = [], dest = [];
  let o = 8420, s = 410;
  for (let i = 0; i < N; i++) step();
  function step() {
    o += (Math.random() - 0.5) * 38 + (8420 - o) * 0.02;
    s += (Math.random() - 0.5) * 30 + (420 - s) * 0.04;
    s = Math.max(180, s);
    origin.push(o); dest.push(o + s);
    if (origin.length > N) { origin.shift(); dest.shift(); }
  }

  let W, H, dpr;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener("resize", size);

  let phase = 0, last = performance.now();
  function draw(now) {
    const dt = Math.min(now - last, 60); last = now;
    phase += dt / 420;
    while (phase >= 1) { phase -= 1; step(); }

    ctx.clearRect(0, 0, W, H);
    const all = origin.concat(dest);
    const min = Math.min(...all) - 120, max = Math.max(...all) + 160;
    const gx = W / (N - 2);
    const X = i => (i - phase) * gx;
    const Y = v => H - ((v - min) / (max - min)) * (H - 40) - 6;

    // vertical hairlines
    ctx.strokeStyle = "rgba(236,232,223,0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < N; i += 10) {
      const x = Math.round(X(i)) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    // filled spread
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, "rgba(208,106,50,0)");
    grad.addColorStop(0.55, "rgba(208,106,50,0.18)");
    grad.addColorStop(1, "rgba(242,164,108,0.42)");
    ctx.beginPath();
    for (let i = 0; i < N; i++) ctx.lineTo(X(i), Y(dest[i]));
    for (let i = N - 1; i >= 0; i--) ctx.lineTo(X(i), Y(origin[i]));
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    const line = (arr, color, width) => {
      ctx.beginPath();
      for (let i = 0; i < N; i++) ctx.lineTo(X(i), Y(arr[i]));
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
    };
    line(origin, "#9aa4a9", 1.2);
    line(dest, "#d06a32", 1.8);

    // live head marker + delta bracket
    const hi = N - 2;
    const hx = X(hi), oy = Y(origin[hi]), dy = Y(dest[hi]);
    ctx.strokeStyle = "rgba(242,164,108,0.9)";
    ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(hx, dy); ctx.lineTo(hx, oy); ctx.stroke();
    ctx.setLineDash([]);
    [[oy, "#9aa4a9"], [dy, "#d06a32"]].forEach(([y, c]) => {
      ctx.beginPath(); ctx.arc(hx, y, 3.5, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
    });

    rO.textContent = fmt(origin[hi]);
    rD.textContent = fmt(dest[hi]);
    rDelta.textContent = `+${fmt(dest[hi] - origin[hi])} / t`;

    if (!reduceMotion) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  /* ---------------- Ticker ---------------- */
  const corridors = [
    ["EU → S. Asia", "HMS 1&2 80:20", 62],
    ["UK → S. Asia", "Shredded 211", 54],
    ["USEC → S. Asia", "Birch / Cliff", 410],
    ["GCC → S. Asia", "Taint / Tabor", 145],
    ["W. Africa → S. Asia", "Millberry", 520],
    ["EU → S. Asia", "UBC Talap", 118],
    ["ANZ → S. Asia", "SS 304 Solids", 96],
    ["USWC → S. Asia", "Rains", 74],
    ["GCC → S. Asia", "No.1 Busheling", 48],
    ["S. Africa → S. Asia", "Zinc Dross", 88],
  ];
  const ticker = $("#ticker");
  const renderTicker = () => {
    const items = corridors.map(([lane, grade, v]) => {
      const chg = (Math.random() - 0.45) * 2.4;
      const cls = chg >= 0 ? "up" : "dn";
      return `<span class="tick"><span>${lane}</span><b>${grade}</b><b>Δ ${v}</b><span class="${cls}">${chg >= 0 ? "▲" : "▼"} ${Math.abs(chg).toFixed(1)}%</span></span>`;
    }).join("");
    ticker.innerHTML = items + items; // duplicated for a seamless loop
  };
  renderTicker();
  if (!reduceMotion) setInterval(() => {
    corridors.forEach(c => { c[2] = Math.max(20, Math.round(c[2] * (1 + (Math.random() - 0.5) * 0.04))); });
    renderTicker();
  }, 7000);

  /* ---------------- Route chart ---------------- */
  const svg = $("#routeMap");
  const NS = "http://www.w3.org/2000/svg";
  const LON0 = -110, LAT0 = 72, K = 1200 / 270;
  const P = (lat, lon) => [(lon - LON0) * K, (LAT0 - lat) * K];
  const mk = (tag, attrs, parent = svg) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n);
    return n;
  };

  const defs = mk("defs", {});
  const lg = mk("linearGradient", { id: "routeGrad", x1: "0", y1: "0", x2: "1", y2: "0" }, defs);
  mk("stop", { offset: "0", "stop-color": "#9aa4a9", "stop-opacity": ".5" }, lg);
  mk("stop", { offset: "1", "stop-color": "#d06a32" }, lg);

  // graticule
  for (let lon = -105; lon <= 160; lon += 15) {
    const [x] = P(0, lon);
    mk("line", { x1: x, y1: 0, x2: x, y2: 560, class: "grat" });
    if (lon % 30 === 0) mk("text", { x: x + 4, y: 552, class: "glab" }).textContent = `${Math.abs(lon)}°${lon < 0 ? "W" : lon > 0 ? "E" : ""}`;
  }
  for (let lat = -45; lat <= 60; lat += 15) {
    const [, y] = P(lat, 0);
    mk("line", { x1: 0, y1: y, x2: 1200, y2: y, class: lat === 0 ? "grat grat--eq" : "grat" });
    mk("text", { x: 6, y: y - 5, class: "glab" }).textContent = `${Math.abs(lat)}°${lat > 0 ? "N" : lat < 0 ? "S" : ""}`;
  }

  const DEST = { lat: 24.8, lon: 66.98 };
  const ports = [
    ["Houston", 29.76, -95.37, 8, 4],
    ["Newark", 40.7, -74.1, 8, -6],
    ["Savannah", 32.08, -81.09, 8, 12],
    ["Santos", -23.96, -46.33, 8, 4],
    ["Felixstowe", 51.96, 1.35, -84, -8],
    ["Rotterdam", 51.92, 4.48, -60, 20],
    ["Hamburg", 53.55, 9.99, 10, -6],
    ["Lagos", 6.45, 3.39, 8, 4],
    ["Durban", -29.86, 31.02, 8, 4],
    ["Mombasa", -4.04, 39.67, 8, 4],
    ["Dammam", 26.43, 50.1, -62, -6],
    ["Jebel Ali", 25.01, 55.06, -72, 14],
    ["Singapore", 1.29, 103.85, 8, 4],
    ["Busan", 35.1, 129.04, 8, 4],
    ["Melbourne", -37.81, 144.96, 8, 4],
  ];

  const [dx, dy] = P(DEST.lat, DEST.lon);
  const routes = [];
  const gRoutes = mk("g", {});
  const gPorts = mk("g", {});

  ports.forEach(([name, lat, lon, lx, ly]) => {
    const [x, y] = P(lat, lon);
    const dist = Math.hypot(dx - x, dy - y);
    const mx = (x + dx) / 2, my = (y + dy) / 2 - dist * 0.28;
    const path = mk("path", { d: `M${x},${y} Q${mx},${my} ${dx},${dy}`, class: "route" }, gRoutes);
    const len = path.getTotalLength();
    path.style.setProperty("--len", len);
    path.style.transitionDelay = `${Math.random() * 0.8}s`;
    const dot = mk("circle", { r: 2.2, class: "pulse", opacity: 0 }, gRoutes);
    routes.push({ path, len, dot, t: Math.random() });

    mk("circle", { cx: x, cy: y, r: 7, class: "port-ring" }, gPorts);
    mk("circle", { cx: x, cy: y, r: 3, class: "port" }, gPorts);
    mk("text", { x: x + lx, y: y + ly, class: "plab" }, gPorts).textContent = name;
  });

  mk("circle", { cx: dx, cy: dy, r: 6, class: "dest-ring" });
  mk("circle", { cx: dx, cy: dy, r: 5, class: "dest" });
  mk("text", { x: dx + 12, y: dy + 22, class: "dlab" }).textContent = "24.8°N 66.9°E";

  // On narrow screens the chart scrolls sideways; open it centred on the discharge point.
  const chartBox = svg.parentElement;
  if (chartBox.scrollWidth > chartBox.clientWidth) {
    chartBox.scrollLeft = (dx / 1200) * svg.clientWidth - chartBox.clientWidth / 2;
  }

  let drawn = false;
  const mapIO = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting || drawn) return;
    drawn = true;
    svg.classList.add("is-drawn");
    if (!reduceMotion) setTimeout(() => requestAnimationFrame(animatePulses), 2400);
    mapIO.disconnect();
  }, { threshold: 0.3 });
  mapIO.observe(svg);

  let lastP = performance.now();
  function animatePulses(now) {
    const dt = Math.min(now - lastP, 60); lastP = now;
    routes.forEach(r => {
      r.t = (r.t + dt / 5200) % 1;
      const pt = r.path.getPointAtLength(r.t * r.len);
      r.dot.setAttribute("cx", pt.x);
      r.dot.setAttribute("cy", pt.y);
      r.dot.setAttribute("opacity", Math.sin(r.t * Math.PI).toFixed(2));
    });
    requestAnimationFrame(animatePulses);
  }

  /* ---------------- Clocks ---------------- */
  const clocks = $$("#clocks [data-tz]").map(el => ({
    b: $("b", el),
    f: new Intl.DateTimeFormat("en-GB", { timeZone: el.dataset.tz, hour: "2-digit", minute: "2-digit", hour12: false }),
  }));
  const tickClocks = () => clocks.forEach(c => { c.b.textContent = c.f.format(new Date()); });
  tickClocks();
  setInterval(tickClocks, 15000);

  $("#yr").textContent = new Date().getFullYear();
})();
