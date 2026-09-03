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

  /* ---- theme: a three-state CURRENT-MODE selector ------------------------
     auto >> light >> dark >> auto. The visible word always names the state the
     surface is IN, never the state a click would move to — which is what the
     engine's own two-state control did, so it read "light" while painting dark.

     AUTO removes data-theme entirely and lets colors_and_type.css resolve the
     mode from prefers-color-scheme under its :not([data-theme]) guard. It is the
     default on every load: an explicit light or dark is a deliberate override for
     as long as the reader is here, not a new default, so nothing is persisted and
     nothing is read back. The engine's legacy `cfw-theme` localStorage key is left
     alone rather than cleaned up — it simply stops being consulted.

     This reproduces the design-system style guide's ruled behaviour locally. That
     controller declares itself style-guide-only and is deliberately NOT vendored,
     and the vendored map engine is not modified to carry it. */
  var themer = document.getElementById("themer");
  var themeLbl = document.getElementById("themelabel");
  (function () {
    var STATES = ["auto", "light", "dark"];
    var root = document.documentElement;
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var state = "auto";
    function apply(next) {
      state = next;
      if (state === "auto") root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", state);
      if (themeLbl) themeLbl.textContent = state;
    }
    if (themer) themer.addEventListener("click", function () {
      apply(STATES[(STATES.indexOf(state) + 1) % STATES.length]);
    });
    /* while auto is active an OS flip changes the painted mode with no click; the
       label stays "auto" by design, but the attribute state must stay coherent */
    var onSystem = function () { if (state === "auto") apply("auto"); };
    if (mq.addEventListener) mq.addEventListener("change", onSystem);
    else if (mq.addListener) mq.addListener(onSystem);
    apply("auto");
  })();

  /* ---- boot the vendored engine ---------------------------------------- */
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


  /* ---- ASK conclusion --------------------------------------------------
     Rendered from the generated payload's ask_conclusion field. There is NO
     second prose copy in index.html: everything below is built from the data,
     via textContent only, so nothing in the payload can inject markup. An
     unrecognised inline kind, block kind or malformed section FAILS THE COMPLETE
     ASK-conclusion render: one bounded error is shown and no partial conclusion
     is attached. */
  var AC = D.ask_conclusion;
  if (AC) {
    var acRoot = document.getElementById("askc");

    /* Inline runs arrive already structured: {t:"plain"|"strong"|"em"|"code", v:"..."}.
       Each becomes a real element via createElement + textContent. No markup is parsed
       here and none can be injected.

       UNKNOWN SPAN KIND, UNKNOWN BLOCK KIND OR A MALFORMED SECTION FAILS THE WHOLE RENDER.
       Nothing is skipped, coerced or counted: the conclusion is built into a detached
       fragment and attached only if all of it succeeds, otherwise one bounded error replaces
       it. Part of a conclusion is not the conclusion.

       THE VOCABULARY IS CLOSED AT RUNTIME TOO. The derivation refuses an unknown span or
       block kind at build time; if one reached the browser anyway, rendering a coerced or
       partial conclusion would present an incomplete projection as complete. acFail throws,
       the whole conclusion is replaced by one bounded error, and nothing half-built is
       left on the page. */
    function acFail(why) { throw new Error("ask_conclusion: " + why); }

    function acSpans(target, spans) {
      if (!Array.isArray(spans)) acFail("spans is not an array");
      spans.forEach(function (s) {
        if (!s || typeof s.v !== "string") acFail("malformed span");
        if (s.t === "strong")     target.appendChild(text(el("strong"), s.v));
        else if (s.t === "em")    target.appendChild(text(el("em"), s.v));
        else if (s.t === "code")  target.appendChild(text(el("code", "askc-code"), s.v));
        else if (s.t === "plain") target.appendChild(document.createTextNode(s.v));
        else acFail('unknown inline kind "' + s.t + '"');
      });
      return target;
    }
    function acBlock(b) {
      if (!b || typeof b.type !== "string") acFail("malformed block");
      if (b.type === "paragraph") return acSpans(el("p", "askc-p"), b.spans);
      if (b.type === "quote")     return acSpans(el("blockquote", "askc-q"), b.spans);
      if (b.type === "code") {
        if (!Array.isArray(b.lines)) acFail("code block without lines");
        return text(el("pre", "askc-pre"), b.lines.join("\n"));
      }
      if (b.type === "list") {
        if (!Array.isArray(b.items)) acFail("list block without items");
        var ul = el("ul", "askc-ul");
        b.items.forEach(function (it) { ul.appendChild(acSpans(el("li"), it)); });
        return ul;
      }
      acFail('unknown block type "' + b.type + '"');
    }
    function acAppend(target, blocks) {
      if (!Array.isArray(blocks)) acFail("block run is not an array");
      blocks.forEach(function (b) { target.appendChild(acBlock(b)); });
    }

    if (acRoot) {
      /* Built into a DETACHED fragment: nothing reaches the page unless all of it does. */
      var frag = document.createDocumentFragment();
      try {
        /* The section's real name comes from the payload, never from the markup. The h2
           in index.html carries only a generic fallback so the heading is never blank. */
        if (typeof AC.title !== "string" || !AC.title) acFail("missing title");
        var h2 = document.getElementById("askc-title");
        if (h2) text(h2, AC.title);
        acSpans(frag.appendChild(el("p", "askc-intro")), AC.introduction);
        acSpans(frag.appendChild(el("blockquote", "askc-pull")), AC.pull_quote);
        acAppend(frag, AC.distinctions);

        if (!Array.isArray(AC.sections) || AC.sections.length === 0) acFail("no sections");
        AC.sections.forEach(function (s, i) {
          if (!s || typeof s.heading !== "string" || s.number !== i + 1 || !s.id)
            acFail("malformed section at index " + i);
          var sec = el("section", "askc-sec");
          sec.id = s.id;
          sec.appendChild(text(el("h3", "askc-h"), String(s.number) + " // " + s.heading));
          acAppend(sec, s.blocks);
          frag.appendChild(sec);
        });

        var cmp = el("section", "askc-sec askc-compress");
        cmp.appendChild(text(el("h3", "askc-h"), "compression"));
        acSpans(cmp.appendChild(el("blockquote", "askc-pull")), AC.compression);
        frag.appendChild(cmp);

        acRoot.appendChild(frag);
      } catch (e) {
        while (acRoot.firstChild) acRoot.removeChild(acRoot.firstChild);
        acRoot.appendChild(text(el("p", "askc-error"),
          "The ASK conclusion could not be displayed: this page received it in a form it does " +
          "not recognise. Nothing partial is shown, because part of a conclusion is not the " +
          "conclusion. The research findings above are unaffected."));
        if (window.console && console.error) console.error(e);
      }
    }
  }

  /* ---- top orientation action: dual-purpose ----------------------------
     The orientation now carries a nine-section conclusion. A first-run reader at 375px
     must be able to reach the map from the TOP rather than scrolling all of it. Before
     the map has been entered the top control ENTERS the map; afterwards it CLOSES the
     orientation. The bottom "explore the map" action is retained either way. */
  (function () {
    var top = document.getElementById("orientclose");
    if (!top) return;
    function syncTop() {
      var entered = document.body.getAttribute("data-map") === "1";
      text(top, entered ? "close and return to the map" : "explore the map");
      top.setAttribute("data-mode", entered ? "close" : "enter");
    }
    syncTop();
    top.addEventListener("click", function (ev) {
      if (top.getAttribute("data-mode") === "enter") {
        ev.stopImmediatePropagation();
        var enter = document.getElementById("entermap");
        if (enter) enter.click();
        syncTop();
      }
    }, true);
    var mo = new MutationObserver(syncTop);
    mo.observe(document.body, { attributes: true, attributeFilter: ["data-map"] });
  })();

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
  /* On a small screen the reader lands with the orientation open and the map still
     gated behind `data-map`. Closing the overlay there has to enter the map, or Escape
     dismisses the only thing on screen and leaves nothing behind it. */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || orient.getAttribute("data-open") !== "1") return;

    if (SMALL.matches && document.body.getAttribute("data-map") !== "1") {
      enterMap();
    } else {
      openOrient(false);
    }
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
