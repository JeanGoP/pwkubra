;(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const header = $(".site-header");
  const progress = $(".progress");
  const nav = $(".nav");
  const toggle = $(".nav-toggle");
  const list = $(".nav-list");
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const setProgress = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const y = window.scrollY;
    const p = Math.max(0, Math.min(1, y / h));
    progress.style.width = (p * 100).toFixed(2) + "%";
    header.classList.toggle("scrolled", y > 6);
  };
  window.addEventListener("scroll", setProgress, { passive: true });
  setProgress();

  toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("open");
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    document.documentElement.style.overflow = open ? "hidden" : "";
  });
  list.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menú");
      document.documentElement.style.overflow = "";
    }
  });

  $$('.nav-list a[href^="#"], a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      const offset = header ? header.offsetHeight : 70;
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      const behavior = reduceMotion || a.classList.contains("skip-link") ? "auto" : "smooth";
      window.scrollTo({ top: y, behavior });
      if (a.classList.contains("skip-link")) el.focus({ preventScroll: true });
    });
  });

  if (reduceMotion) {
    $$(".reveal").forEach((el) => el.classList.add("reveal-in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((ent) => {
          if (ent.isIntersecting) {
            ent.target.classList.add("reveal-in");
            io.unobserve(ent.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    $$(".reveal").forEach((el) => io.observe(el));
  }

  const clamp01 = (n) => Math.max(0, Math.min(1, n));
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const mulberry32 = (a) => () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const scatterEls = Array.from(document.querySelectorAll(".section:not(.hero) .reveal"));
  if (!reduceMotion && scatterEls.length) {
    scatterEls.forEach((el) => el.classList.add("scatter"));

    const START_AT = 0.92;
    const END_AT = 0.38;
    const BASE_OPACITY = 0.16;

    const state = scatterEls.map((el) => ({ el, top: 0, x0: 0, y0: 0, rot0: 0, scale0: 1, curve: 0, arc: 0 }));

    const measure = () => {
      const y = window.scrollY;
      const vw = window.innerWidth || document.documentElement.clientWidth || 1;
      const vh = window.innerHeight || document.documentElement.clientHeight || 1;
      const base = Math.min(vw, vh);
      const spread = base * (vw < 480 ? 0.78 : vw < 1024 ? 0.92 : 1.05);

      state.forEach((s, i) => {
        const rect = s.el.getBoundingClientRect();
        const rng = mulberry32(i + 1);
        const xSign = i % 2 === 0 ? 1 : -1;
        const ySign = i % 3 === 0 ? 1 : -1;
        s.top = rect.top + y;
        s.x0 = xSign * (rng() * 0.85 + 0.15) * spread;
        s.y0 = ySign * (rng() * 0.75 + 0.25) * spread * 0.62;
        s.rot0 = (rng() * 2 - 1) * 14;
        s.scale0 = 0.92 + rng() * 0.12;
        s.curve = (rng() * 2 - 1) * spread * 0.22;
        s.arc = (rng() * 2 - 1) * spread * 0.18;
        s.el.style.willChange = "transform,opacity";
      });
    };

    let lastY = window.scrollY;
    let ticking = false;
    const apply = () => {
      ticking = false;
      const y = lastY;
      const vh = window.innerHeight || document.documentElement.clientHeight || 1;

      state.forEach((s) => {
        const start = s.top - vh * START_AT;
        const end = s.top - vh * END_AT;
        const t = clamp01((y - start) / (end - start));
        const e = easeOutCubic(t);
        const inv = 1 - e;
        const curve = Math.sin(Math.PI * e) * s.curve * inv;
        const parab = 1 - Math.pow(2 * e - 1, 2);
        const arc = parab * s.arc * inv;
        const x = s.x0 * inv + curve;
        const yy = s.y0 * inv + arc;
        const rot = s.rot0 * inv;
        const sc = 1 + (s.scale0 - 1) * inv;
        const op = BASE_OPACITY + (1 - BASE_OPACITY) * e;
        s.el.style.opacity = String(op);
        s.el.style.transform = `translate3d(${x.toFixed(2)}px, ${yy.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      });
    };

    const onScroll = () => {
      lastY = window.scrollY;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };
    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("load", onResize, { once: true });
  } else if (reduceMotion && scatterEls.length) {
    scatterEls.forEach((el) => {
      el.classList.add("scatter");
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  }

  const wrap = $(".testi-wrap");
  if (wrap) {
    const items = $$(".testi");
    const dots = $(".dots");
    let idx = 0;

    const makeDots = () => {
      items.forEach((_, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("role", "tab");
        if (i === 0) b.classList.add("active");
        b.addEventListener("click", () => show(i, true));
        dots.appendChild(b);
      });
    };
    const show = (i, manual) => {
      idx = i % items.length;
      items.forEach((el, k) => el.classList.toggle("active", k === idx));
      dots.querySelectorAll("button").forEach((b, k) => b.classList.toggle("active", k === idx));
      if (manual) {
        clearInterval(timer);
        timer = setInterval(next, 6000);
      }
    };
    const next = () => show((idx + 1) % items.length, false);
    makeDots();
    var timer = setInterval(next, 6000);
  }

  const fy = $("#year");
  if (fy) fy.textContent = String(new Date().getFullYear());

  const form = $("#lead-form");
  const note = $("#form-note");
  const wa = $("#wa-direct");

  const sanitize = (s) => String(s || "").trim();

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const hp = sanitize(data.get("website"));
      if (hp) {
        note.textContent = "";
        return;
      }
      const name = sanitize(data.get("full_name"));
      const email = sanitize(data.get("email"));
      const phone = sanitize(data.get("phone"));
      const company = sanitize(data.get("company"));
      const message = sanitize(data.get("message"));
      if (!name || !email || !message) {
        note.style.color = "var(--danger)";
        note.textContent = "Por favor completa nombre, email y mensaje.";
        return;
      }
      const summary =
        "Lead nuevo%0A%0A" +
        "Nombre: " +
        name +
        "%0AEmail: " +
        email +
        "%0ATeléfono: " +
        phone +
        "%0AEmpresa: " +
        company +
        "%0AMensaje: " +
        message;
      const mail =
        "mailto:hola@kubra.agency?subject=" +
        encodeURIComponent("Asesoría KUBRA - " + name) +
        "&body=" +
        summary;
      window.location.href = mail;
      note.style.color = "var(--success)";
      note.textContent = "Gracias. Abre tu cliente de correo para finalizar el envío.";
    });
  }

  const updateWA = () => {
    if (!wa || !form) return;
    const data = new FormData(form);
    const name = sanitize(data.get("full_name"));
    const company = sanitize(data.get("company"));
    const message = sanitize(data.get("message"));
    const text =
      "Hola KUBRA, soy " +
      (name || "—") +
      " de " +
      (company || "—") +
      ". " +
      (message || "Quiero una asesoría gratuita.");
    const url = "https://wa.me/5491112345678?text=" + encodeURIComponent(text);
    wa.setAttribute("href", url);
  };
  ["input", "change"].forEach((ev) => form && form.addEventListener(ev, updateWA));
})();
