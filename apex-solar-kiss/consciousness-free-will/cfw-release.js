/* cfw-release.js — ASK-local release behaviour.
 *
 * Boots the vendored engine, renders the orientation surface FROM THE PUBLISHED
 * PAYLOAD (so the six rulings cannot drift from the data they describe), and
 * implements the responsive contract. The engine itself is not modified.
 */
(function () {
  "use strict";

  var SMALL = window.matchMedia("(max-width: 767px)");
  var TABLET = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
  var D = window.CFW_ATLAS;

  /* ---- boot the vendored engine ---------------------------------------- */
  var themer = document.getElementById("themer");
  CFWAtlas.initTheme(themer);
  /* initTheme writes the action word ("light"/"dark") as the button text. On its own
     that does not say whether it names the current theme or the one it switches to. */
  function themeLabel() {
    if (themer) themer.setAttribute("aria-label", "switch to " + themer.textContent.trim() + " theme");
  }
  themeLabel();
  if (themer) themer.addEventListener("click", function () { setTimeout(themeLabel, 0); });
  var P = CFWProjection.build(D);
  CFWAtlas.mount({ projection: P });

  /* ---- orientation: the six rulings, rendered from the payload ---------- */
  var ORDER = ["ruled", "retained", "adopted", "re-held", "residual", "NOT"];
  var LABEL = {
    "ruled": "ruled", "retained": "retained", "adopted": "adopted",
    "re-held": "re-held", "residual": "residual", "NOT": "not ruled"
  };

  function text(el, s) { el.textContent = s == null ? "" : String(s); return el; }
  function el(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; }

  var questions = D.objects.filter(function (o) { return o.class === "CFW-Q"; })
    .sort(function (a, b) { return a.id < b.id ? -1 : 1; });

  var list = document.getElementById("rulings");
  questions.forEach(function (q) {
    var li = el("li");
    li.appendChild(text(el("span", "rq"), q.id));
    li.appendChild(text(el("strong", "rtitle"), q.question || q.label));
    if (q.disposition) li.appendChild(text(el("span", "rdisp"), q.disposition));
    var ar = q.ask_ruled || {};
    var keys = ORDER.filter(function (k) { return ar[k]; })
      .concat(Object.keys(ar).filter(function (k) { return ORDER.indexOf(k) === -1; }));
    if (keys.length) {
      var dl = el("dl");
      keys.forEach(function (k) {
        dl.appendChild(text(el("dt"), LABEL[k] || k));
        dl.appendChild(text(el("dd"), ar[k]));
      });
      li.appendChild(dl);
    }
    li.appendChild(text(el("p", "ask-note"),
      "Fields above are ASK's rulings of 2026-08-23. Rationale ASK did not rule is not published."));
    list.appendChild(li);
  });

  /* ---- counts ---------------------------------------------------------- */
  var byClass = {};
  D.objects.forEach(function (o) { byClass[o.class] = (byClass[o.class] || 0) + 1; });
  var primary = Object.keys(byClass).reduce(function (s, k) {
    return k === "CFW-S" ? s : s + byClass[k];
  }, 0);
  var COUNTS = [
    [primary, "primary objects on the map"],
    [byClass["CFW-S"] || 0, "evidence owners, opened by exact identifier"],
    [D.registered.length, "registered relations — the only relation encoding drawn"],
    [D.recorded.length, "recorded references between objects and evidence"],
    [D.unedged.length, "explicit non-linkages: recorded as NOT a relation"],
    [questions.length, "held questions"]
  ];
  var counts = document.getElementById("counts");
  COUNTS.forEach(function (row) {
    var li = el("li");
    li.appendChild(text(el("span", "n"), row[0].toLocaleString()));
    li.appendChild(text(el("span", "w"), row[1]));
    counts.appendChild(li);
  });

  /* ---- orientation search ---------------------------------------------- */
  var oq = document.getElementById("oq"), ores = document.getElementById("ores");
  var INDEX = D.objects.map(function (o) {
    return { o: o, hay: ((o.id || "") + " " + (o.label || "") + " " + (o.work || "") + " " + (o.author || "")).toLowerCase() };
  });
  function search() {
    var q = oq.value.trim().toLowerCase();
    ores.textContent = "";
    if (q.length < 2) return;
    var hits = INDEX.filter(function (r) { return r.hay.indexOf(q) !== -1; }).slice(0, 25);
    if (!hits.length) {
      ores.appendChild(text(el("p", "ores-none"), "No object or evidence owner matches that."));
      return;
    }
    hits.forEach(function (r) {
      /* A result is a CONTROL, not a caption. It was a div, so the orientation
         surface listed matches a keyboard or screen-reader user could never open —
         the one route to the atlas that did not lead anywhere. */
      var d = el("button", "ores-r");
      d.type = "button";
      d.setAttribute("data-open", r.o.id);
      var title = el("span", "ores-title");
      text(title, r.o.label || r.o.work || r.o.id);
      d.appendChild(text(el("span", "ores-id"), r.o.id + "  ·  " + r.o.class));
      d.appendChild(title);
      var meta = [r.o.author, r.o.evidence_class, r.o.access, r.o.fidelity]
        .filter(Boolean).join("  ·  ");
      if (meta) d.appendChild(text(el("span", "ores-meta"), meta));
      d.setAttribute("aria-label", "open " + r.o.id + ", " +
        String(r.o.label || r.o.work || "").slice(0, 90) + ", in the inspector");
      ores.appendChild(d);
    });
  }
  oq.addEventListener("input", search);

  /* Opening a record from orientation: enter the map if it has not been entered,
     close the orientation layer, then hand the id to the engine. */
  ores.addEventListener("click", function (ev) {
    var b = ev.target.closest ? ev.target.closest("button[data-open]") : null;
    if (!b) return;
    openRecord(b.getAttribute("data-open"));
  });

  /* ---- responsive contract --------------------------------------------- */
  var orient = document.getElementById("orient");
  var orientBtn = document.getElementById("orientbtn");
  var enterBtn = document.getElementById("entermap");

  // autoOpen tracks WHY the orientation is open. A small-screen landing is
  // automatic and must close again when the viewport leaves small; a user
  // pressing "what this concluded" is explicit and must survive a resize.
  var autoOpen = false;

  var lastFocus = null;

  var bar = document.querySelector(".bar");
  var mapMain = document.getElementById("canvaswrap");

  function openOrient(open, auto) {
    var was = orient.getAttribute("data-open") === "1";
    /* The overlay covers the viewport. Leaving the surfaces behind it in the tab order
       sends a keyboard user to controls they cannot see. `inert` removes them from both
       the tab order and the accessibility tree, and Escape plus the overlay's own close
       control keep a way out — so nothing is trapped. */
    [bar, mapMain].forEach(function (n) {
      if (!n) return;
      if (open) n.setAttribute("inert", "");
      else n.removeAttribute("inert");
    });
    orient.setAttribute("data-open", open ? "1" : "0");
    orient.setAttribute("aria-hidden", open ? "false" : "true");
    orientBtn.setAttribute("aria-expanded", open ? "true" : "false");
    autoOpen = open ? !!auto : false;
    if (open) {
      orient.scrollTop = 0;
      /* Focus follows the surface, or a keyboard user is left on a button behind a
         full-screen layer. `auto` is the small-screen landing, which is where the
         page already starts — moving focus there would fight the reader. */
      if (!was && !auto) {
        lastFocus = document.activeElement;
        var h = document.getElementById("orient-title");
        if (h && h.focus) h.focus();
      }
    } else if (was && lastFocus && lastFocus.focus) {
      lastFocus.focus(); lastFocus = null;
    }
  }

  /* The orientation surface and the map are two views of one payload. Activating a
     search result there must land in the inspector here. */
  function openRecord(id) {
    if (document.body.getAttribute("data-map") !== "1" && SMALL.matches) enterMap();
    else openOrient(false);
    var V = window.CFW_VIEW;
    if (!V) return;
    var o = (V.projection && V.projection.byId) ? V.projection.byId[id] : null;
    if (o && o.class === "CFW-S") V.inspectSource(id, null);
    else { V.select(id); if (V.centreOn) V.centreOn(id, Math.max(V.view.k, 1.35)); }
    /* land the reader ON the panel that just changed, not back at the top of the page */
    var insp = document.getElementById("insp");
    if (insp) { insp.setAttribute("tabindex", "-1"); insp.focus(); }
  }
  function enterMap() {
    document.body.setAttribute("data-map", "1");
    openOrient(false);
    if (window.dispatchEvent) window.dispatchEvent(new Event("resize"));
  }

  orientBtn.addEventListener("click", function () {
    openOrient(orient.getAttribute("data-open") !== "1");
  });
  enterBtn.addEventListener("click", enterMap);
  /* The skip link's target lives inside the orientation, which is display:none while
     closed — so the link has to OPEN the surface it skips to, not just jump at it. */
  var skip = document.getElementById("skip");
  if (skip) skip.addEventListener("click", function (e) {
    e.preventDefault();
    if (orient.getAttribute("data-open") !== "1") openOrient(true);
    var h = document.getElementById("orient-title");
    if (h && h.focus) h.focus();
  });

  var closeBtn = document.getElementById("orientclose");
  if (closeBtn) closeBtn.addEventListener("click", function () { openOrient(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && orient.getAttribute("data-open") === "1") openOrient(false);
  });

  function applyMode() {
    var small = SMALL.matches;
    var entered = document.body.getAttribute("data-map") === "1";
    if (small && !entered) {
      // small: orientation IS the landing surface until the map is entered
      openOrient(true, true);
    } else if (!small && autoOpen) {
      // left small: retract the automatic landing, but never a user-opened panel
      openOrient(false);
    }
    // tablet: overlays collapsed by default, never auto-expanded
    document.body.setAttribute("data-overlays", TABLET.matches ? "0" : "1");
  }
  applyMode();
  // matchMedia "change" is the semantically right signal, but it does not fire
  // reliably under emulated viewport resizing, which would strand the page in
  // whichever mode it loaded in. window.resize is the dependable backstop; both
  // are wired, and applyMode is idempotent so double-firing is harmless.
  if (SMALL.addEventListener) {
    SMALL.addEventListener("change", applyMode);
    TABLET.addEventListener("change", applyMode);
  } else if (SMALL.addListener) {
    SMALL.addListener(applyMode); TABLET.addListener(applyMode);
  }
  var modeTimer = null;
  window.addEventListener("resize", function () {
    if (modeTimer) clearTimeout(modeTimer);
    modeTimer = setTimeout(applyMode, 60);
  });
})();
