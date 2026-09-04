/* cfw-release.js — ASK-local release behaviour.
 *
 * ONE renderer for BOTH routes of this release: the conclusions page at the
 * route root, and the map one level deeper. It boots the vendored engine where
 * a canvas exists, renders the conclusions FROM THE PUBLISHED PAYLOAD (so the
 * six rulings cannot drift from the data they describe), and implements the
 * responsive contract. Every map-only behaviour is guarded on its element being
 * present and no-ops when it is not, which is what lets one file serve two
 * pages without a second copy of anything. The engine itself is not modified.
 */
(function () {
  "use strict";

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

  /* ---- boot the vendored engine ----------------------------------------
     ONE RENDERER, TWO ROUTES. The conclusions page and the map are separate
     routes and both load THIS file. The map carries the canvas and the engine;
     the conclusions page carries neither, and loads only the payload and this
     renderer. So the boot is conditional on the canvas AND the engine actually
     being here.

     Everything below the boot renders from the published payload and runs on
     either route. Every behaviour that reaches into the map is guarded on the
     element it needs: absent element, NO-OP. That is the whole tolerance
     mechanism — there is no second renderer and no second copy of the
     payload-rendering logic, because there is one source and this is it. */
  if (document.getElementById("stage") && window.CFWProjection && window.CFWAtlas) {
    CFWAtlas.mount({ projection: CFWProjection.build(D) });
  }

  /* ---- conclusions: the six rulings, rendered from the payload --------- */
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
  if (list) questions.forEach(function (q) {
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
  if (counts) COUNTS.forEach(function (row) {
    var li = el("li");
    li.appendChild(text(el("span", "n"), row[0].toLocaleString()));
    li.appendChild(text(el("span", "w"), row[1]));
    counts.appendChild(li);
  });

  /* ---- conclusions search ----------------------------------------------- */
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
      /* The two routes open a record two different ways, so the label must say
         which one this page does. Promising "the inspector" on the conclusions
         page named a panel that lives in the other document. */
      d.setAttribute("aria-label", "open " + r.o.id + ", " +
        String(r.o.label || r.o.work || "").slice(0, 90) +
        (window.CFW_VIEW ? ", in the inspector" : ", on the map"));
      ores.appendChild(d);
    });
  }
  if (oq) oq.addEventListener("input", search);

  /* Opening a record. Where the engine is in this document — the map route — hand
     the id straight to it. On the conclusions route the engine lives in the other
     document, so activating a result NAVIGATES to the map naming the record, and
     the map opens it on arrival (see the arrival handler at the end of this file).
     The split moved the search and the inspector into separate documents; this is
     what keeps a result openable rather than leaving a control that does nothing. */
  if (ores) ores.addEventListener("click", function (ev) {
    var b = ev.target.closest ? ev.target.closest("button[data-open]") : null;
    if (!b) return;
    var id = b.getAttribute("data-open");
    if (window.CFW_VIEW) { openRecord(id); return; }
    location.href = "/apex-solar-kiss/consciousness-free-will/map/" + "#" + encodeURIComponent(id);
  });

  /* ---- opening a record ON THE MAP -------------------------------------
     The engine is in this document, so the id goes straight to it: an evidence
     owner opens in the inspector, any other object is selected and centred.
     There is nothing to enter and nothing to close — the map is its own route,
     so arriving here IS the entry. */
  function openRecord(id) {
    var V = window.CFW_VIEW;
    if (!V) return;
    var o = (V.projection && V.projection.byId) ? V.projection.byId[id] : null;
    if (o && o.class === "CFW-S") V.inspectSource(id, null);
    else { V.select(id); if (V.centreOn) V.centreOn(id, Math.max(V.view.k, 1.35)); }
    /* land the reader ON the panel that just changed, not back at the top of the page */
    var insp = document.getElementById("insp");
    if (insp) { insp.setAttribute("tabindex", "-1"); insp.focus(); }
  }

  /* ---- responsive contract ----------------------------------------------
     TABLET ONLY. Between 768 and 1023 the legend and the caption are collapsed
     by default and expanded again above that; `data-overlays` is the flag the
     stylesheet reads. Nothing here is width-gated on the conclusions any more:
     they are a separate route, so a narrow viewport reaches them by navigating
     rather than by a mode, and there is no landing surface to open, retract or
     track. */
  function applyMode() {
    document.body.setAttribute("data-overlays", TABLET.matches ? "0" : "1");
  }
  applyMode();
  // matchMedia "change" is the semantically right signal, but it does not fire
  // reliably under emulated viewport resizing, which would strand the page in
  // whichever mode it loaded in. window.resize is the dependable backstop; both
  // are wired, and applyMode is idempotent so double-firing is harmless.
  if (TABLET.addEventListener) TABLET.addEventListener("change", applyMode);
  else if (TABLET.addListener) TABLET.addListener(applyMode);
  var modeTimer = null;
  window.addEventListener("resize", function () {
    if (modeTimer) clearTimeout(modeTimer);
    modeTimer = setTimeout(applyMode, 60);
  });

  /* ARRIVAL FROM THE CONCLUSIONS ROUTE. A result activated on the conclusions page
     navigates here naming the record. Nothing else writes the hash, and a hash that
     names no known object is ignored rather than error — a stale or hand-typed link
     lands on the ordinary map instead of failing. */
  (function () {
    if (!window.CFW_VIEW) return;
    var raw = (location.hash || "").replace(/^#/, "");
    if (!raw) return;
    var id;
    try { id = decodeURIComponent(raw); } catch (e) { return; }
    var V = window.CFW_VIEW;
    var known = V.projection && V.projection.byId && V.projection.byId[id];
    if (!known) return;
    openRecord(id);
  })();
})();
