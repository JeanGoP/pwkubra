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
