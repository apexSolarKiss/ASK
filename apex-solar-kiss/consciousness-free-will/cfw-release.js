/* cfw-release.js — ASK-local release behaviour.
 *
 * ONE renderer for BOTH routes of this release: the conclusions page at the
 * route root, and the map one level deeper. It boots the map engine where
 * a canvas exists, renders the conclusions FROM THE PUBLISHED PAYLOAD (so the
 * six rulings cannot drift from the data they describe), and implements the
 * responsive contract. Every map-only behaviour is guarded on its element being
 * present and no-ops when it is not, which is what lets one file serve two
 * pages without a second copy of anything. It reaches the engine only through the
 * runtime surface the engine publishes.
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
     and the map engine does not carry it. */
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

  /* ---- boot the map engine ---------------------------------------------
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

  /* PRESENTATION. Each element takes a role from the vendored document register
     (surface-document.css), the vendored panel rule (surface-panel.css) or the
     vendored surface treatments (surface-treatments.css); the local class stays
     beside it as a layout hook for cfw-conclusions.css. A class changes how a string
     looks, never which string is written or in what order.
     A held-question ruling is a separate surface set in the reading flow, not a
     raised panel: one material that does not blur, free corners and FLUSH
     elevation, chosen on the owner's three axes. Its content is the collection
     item's anatomy: the identifier as metadata, the question as the panel title,
     the disposition and the field names as operative labels. */
  var list = document.getElementById("rulings");
  if (list) questions.forEach(function (q) {
    var li = el("li", "surface-separate surface-material-panel surface-attach-free surface-elevation-flush doc-group");
    li.appendChild(text(el("span", "rq doc-meta"), q.id));
    li.appendChild(text(el("strong", "rtitle surface-panel-title"), q.question || q.label));
    if (q.disposition) li.appendChild(text(el("span", "rdisp doc-label"), q.disposition));
    var ar = q.ask_ruled || {};
    var keys = ORDER.filter(function (k) { return ar[k]; })
      .concat(Object.keys(ar).filter(function (k) { return ORDER.indexOf(k) === -1; }));
    if (keys.length) {
      var dl = el("dl");
      keys.forEach(function (k) {
        dl.appendChild(text(el("dt", "doc-label"), LABEL[k] || k));
        dl.appendChild(text(el("dd", "doc-body"), ar[k]));
      });
      li.appendChild(dl);
    }
    li.appendChild(text(el("p", "ask-note doc-meta"),
      "Fields above are ASK's rulings of 2026-08-23. Rationale ASK did not rule is not published."));
    list.appendChild(li);
  });


  /* PRESENTATION ASSIGNMENTS, keyed to specific payload blocks. They choose a
     treatment and never a string or an order.

     QUOTE_ROLE. The payload types a block "quote" both when it carries a
     quotation — a question put, or words a speaker says — and when it carries text
     ASK writes in its own voice: a thesis, a compression, a proposal, or the
     prospective axis's own question. Quotation anatomy stays with the first:
     "display" is a SHORT quoted statement whose speaker the prose already names,
     and "quote" is the plain quotation anatomy for a longer one. The second is
     document prose: "prose". A quote block with no assignment keeps the plain
     quotation anatomy.
     ATTENTION. The magenta attention rail is assigned to the asymmetry passage:
     its lead-in and its diagram, as one unit.
     COMPRESSION_ACCENT. The magenta attention rail is assigned to the ASK
     conclusion's compression. No accent is assigned to the prospective axis, so
     its compression takes the label and no rail.

     Each entry is [role, opening words]; it applies only while its section id,
     block index and opening words all still match. */
  var QUOTE_ROLE = {
    "ask-conclusion-2": { 1: ["display", "How do I know "],
                          4: ["display", "How can I know that "],
                          7: ["display", "I am conscious."] },
    "ask-conclusion-3": { 4: ["prose", "Across the subject boundary, proof becomes evidence."] },
    "ask-conclusion-6": { 14: ["prose", "\"It is simulated, therefore it cannot be conscious\""] },
    "ask-conclusion-8": { 0: ["prose", "Consciousness is self-authenticating to the subject"] },
    "ask-conclusion-9": { 4: ["display", "Have we proved that this system is conscious?"],
                          6: ["quote", "Has the evidence become strong enough"] },
    "ask-next-axis-7":  { 9: ["prose", "Copyability does not negate rights."] },
    "ask-next-axis-9":  { 1: ["prose", "What is the morally + legally relevant unit of identity"] }
  };
  var ATTENTION = {
    "ask-conclusion-2": { from: 10, to: 11, opens: "The asymmetry is:", closes: "INSIDE THE OCCURRENCE", accent: "magenta" }
  };
  var COMPRESSION_ACCENT = { ask_conclusion: "magenta" };

  /* ---- ASK structured-text sections ------------------------------------
     ONE renderer, two payload objects. Both the ASK conclusion and the ASK
     prospective next axis are built from the generated payload — there is NO second
     prose copy in index.html — via textContent only, so nothing in the payload can
     inject markup.

     THE VOCABULARY IS CLOSED AT RUNTIME. An unrecognised inline kind, block kind or
     malformed section FAILS THAT SECTION COMPLETELY: the section is built into a
     detached fragment and attached only if all of it succeeds, otherwise one bounded
     error replaces it. Part of a section is not the section.

     CONTAINER FIRST, THEN PAYLOAD. A route that carries no container for a section
     does not own that section — the map has no conclusions DOM and must stay silent.
     But a route that DOES carry the container has already promised the reader a
     section, so a missing payload object there is a failure to REPORT, not a thing to
     skip. Returning silently would leave a generic heading above an empty box.

     THE TITLE IS PART OF THE TRANSACTION. The payload title is written only after the
     whole body validates. A failed section keeps its generic fallback heading rather
     than advertising a payload title for content that never arrived.

     THE TWO SECTIONS FAIL INDEPENDENTLY. Each resolves its own container, builds its
     own fragment, and catches its own error. A malformed or missing ask_next_axis
     cannot erase, truncate or suppress a valid ask_conclusion, and the reverse holds
     equally. The absence of one is not the absence of the other. */
  function renderStructuredSection(key, rootId, titleId, failLine) {
    var acRoot = document.getElementById(rootId);
    if (!acRoot) return;              /* this route does not own the section */
    var AC = D[key];

    function acFail(why) { throw new Error(key + ": " + why); }

    /* Inline runs arrive already structured: {t:"plain"|"strong"|"em"|"code", v:"..."}.
       Each becomes a real element via createElement + textContent. No markup is parsed
       here and none can be injected. */
    function acSpans(target, spans) {
      if (!Array.isArray(spans)) acFail("spans is not an array");
      spans.forEach(function (s) {
        if (!s || typeof s.v !== "string") acFail("malformed span");
        if (s.t === "strong")     target.appendChild(text(el("strong"), s.v));
        else if (s.t === "em")    target.appendChild(text(el("em"), s.v));
        else if (s.t === "code")  target.appendChild(text(el("code", "askc-code doc-code"), s.v));
        else if (s.t === "plain") target.appendChild(document.createTextNode(s.v));
        else acFail('unknown inline kind "' + s.t + '"');
      });
      return target;
    }
    /* Blocks a presentation assignment below names, found by section id, block
       index AND opening words. All three must still match; otherwise the block
       takes its type's default treatment rather than another block's. */
    function acOpening(b) {
      if (!b) return "";
      if (Array.isArray(b.spans)) return b.spans.map(function (s) { return s && typeof s.v === "string" ? s.v : ""; }).join("");
      if (Array.isArray(b.lines)) return String(b.lines[0]);
      return "";
    }
    function acOpens(b, words) {
      return typeof words === "string" && acOpening(b).indexOf(words) === 0;
    }

    /* STRUCTURED TEXT. A code block whose indentation is structure is drawn on the
       hierarchy rail: its lines sit in parts, and the lines beneath a line sit in a
       rail, one rail per two-space level, nested in source order. The two spaces a
       level carries are drawn by the rail rather than typed; blank lines between
       two lines at one level stay typed inside their part; blank lines before a
       new part or rail are recorded as data-lead-lines. So every source line keeps
       its line slot, and the source sequence can be rebuilt from the markup exactly.
       A block with no indented line, or whose lines this cannot represent exactly —
       an odd indent, a level skipped, a line that is only spaces or starts with
       another space character, more than three blank lines before a part, blank
       lines at the end — is written as ONE preformatted text node, as before. It is
       never failed for its shape. */
    function acStructured(lines) {
      var root = el("div", "askc-pre doc-pre doc-pre--structured");
      var stack = [root], depth = 0, open = null, blank = 0, indented = false;
      function lead(node, n) { if (n) node.setAttribute("data-lead-lines", String(n)); }
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (typeof line !== "string") return null;
        if (line === "") { blank++; continue; }
        var body = line.replace(/^ +/, "");
        var indent = line.length - body.length;
        if (indent % 2 || body === "" || /^\s/.test(body)) return null;
        var level = indent / 2;
        if (level > depth + 1) return null;
        if (level > 0) indented = true;
        if (level === depth && open) {
          text(open, open.textContent + new Array(blank + 2).join("\n") + body);
        } else {
          if (blank > 3) return null;
          var part = text(el("pre", "doc-pre-part"), body);
          if (level > depth) {
            var rail = el("div", "doc-hierarchy");
            lead(rail, blank);
            stack[depth].appendChild(rail);
            stack[level] = rail;
          } else {
            lead(part, blank);
          }
          stack.length = level + 1;
          stack[level].appendChild(part);
          open = part;
          depth = level;
        }
        blank = 0;
      }
      if (blank || !indented) return null;
      return root;
    }

    function acBlock(b, role) {
      if (!b || typeof b.type !== "string") acFail("malformed block");
      if (b.type === "paragraph") return acSpans(el("p", "askc-p doc-body"), b.spans);
      if (b.type === "quote") {
        /* Text ASK writes in its own voice is document prose, not quotation. */
        if (role === "prose") return acSpans(el("p", "askc-p doc-body"), b.spans);
        var bq = el("blockquote", "askc-q doc-quote" + (role === "display" ? " doc-quote--display" : ""));
        acSpans(bq.appendChild(el("p")), b.spans);
        return bq;
      }
      if (b.type === "code") {
        if (!Array.isArray(b.lines)) acFail("code block without lines");
        return acStructured(b.lines) || text(el("pre", "askc-pre doc-pre"), b.lines.join("\n"));
      }
      if (b.type === "list") {
        if (!Array.isArray(b.items)) acFail("list block without items");
        var ul = el("ul", "askc-ul doc-body");
        b.items.forEach(function (it) { ul.appendChild(acSpans(el("li"), it)); });
        return ul;
      }
      acFail('unknown block type "' + b.type + '"');
    }
    function acAppend(target, blocks, sectionId) {
      if (!Array.isArray(blocks)) acFail("block run is not an array");
      var roles = (sectionId && QUOTE_ROLE[sectionId]) || {};
      var att = (sectionId && ATTENTION[sectionId]) || null;
      if (att && !(acOpens(blocks[att.from], att.opens) && acOpens(blocks[att.to], att.closes))) att = null;
      var into = target;
      blocks.forEach(function (b, j) {
        if (att && j === att.from) {
          into = target.appendChild(el("div", "askc-attention doc-group surface-emphasis-rail surface-emphasis--" + att.accent));
        }
        var entry = roles[j];
        into.appendChild(acBlock(b, entry && acOpens(b, entry[1]) ? entry[0] : null));
        if (att && j === att.to) into = target;
      });
    }

    /* Built into a DETACHED fragment: nothing reaches the page unless all of it does. */
    var frag = document.createDocumentFragment();
    try {
      if (!AC) acFail("payload object absent");
      if (typeof AC.title !== "string" || !AC.title) acFail("missing title");
      acSpans(frag.appendChild(el("p", "askc-intro doc-lede")), AC.introduction);
      acSpans(frag.appendChild(el("blockquote", "askc-pull doc-quote")).appendChild(el("p")), AC.pull_quote);
      acAppend(frag, AC.distinctions, null);

      if (!Array.isArray(AC.sections) || AC.sections.length === 0) acFail("no sections");
      AC.sections.forEach(function (s, i) {
        if (!s || typeof s.heading !== "string" || s.number !== i + 1 || !s.id)
          acFail("malformed section at index " + i);
        var sec = el("section", "askc-sec doc-section");
        sec.id = s.id;
        sec.appendChild(text(el("h3", "askc-h doc-subsection-title"), String(s.number) + " // " + s.heading));
        acAppend(sec, s.blocks, s.id);
        frag.appendChild(sec);
      });

      /* The compression is a passage in ordinary flow, not a quotation and not a
         heading: "compression" names what kind of passage it is, so it is a label.
         Where an accent is assigned, the passage takes the attention rail in it. */
      var accent = COMPRESSION_ACCENT[key];
      var cmp = el("section", "askc-sec askc-compress doc-section" +
        (accent ? " surface-emphasis-rail surface-emphasis--" + accent : ""));
      cmp.appendChild(text(el("p", "askc-label surface-emphasis-chip"), "compression"));
      acSpans(cmp.appendChild(el("p", "askc-p doc-body")), AC.compression);
      frag.appendChild(cmp);

      /* Everything validated. Only now does the real name replace the fallback. */
      var h2 = document.getElementById(titleId);
      if (h2) text(h2, AC.title);
      acRoot.appendChild(frag);
    } catch (e) {
      while (acRoot.firstChild) acRoot.removeChild(acRoot.firstChild);
      acRoot.appendChild(text(el("p", "askc-error"), failLine));
      if (window.console && console.error) console.error(e);
    }
  }

  renderStructuredSection("ask_conclusion", "askc", "askc-title",
    "The ASK conclusion could not be displayed: this page received it in a form it does " +
    "not recognise, or did not receive it at all. Nothing partial is shown, because part " +
    "of a conclusion is not the conclusion. The research findings above are unaffected.");

  renderStructuredSection("ask_next_axis", "nextaxis", "nextaxis-title",
    "The ASK prospective axis could not be displayed: this page received it in a form it " +
    "does not recognise, or did not receive it at all. Nothing partial is shown. The " +
    "research findings and the ASK conclusion above are unaffected.");

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
      ores.appendChild(text(el("p", "ores-none doc-body"), "No object or evidence owner matches that."));
      return;
    }
    hits.forEach(function (r) {
      /* A result is a CONTROL, not a caption. It was a div, so the orientation
         surface listed matches a keyboard or screen-reader user could never open —
         the one route to the atlas that did not lead anywhere. */
      var d = el("button", "ores-r");
      d.type = "button";
      d.setAttribute("data-open", r.o.id);
      var title = el("span", "ores-title doc-body");
      text(title, r.o.label || r.o.work || r.o.id);
      d.appendChild(text(el("span", "ores-id doc-meta"), r.o.id + "  ·  " + r.o.class));
      d.appendChild(title);
      var meta = [r.o.author, r.o.evidence_class, r.o.access, r.o.fidelity]
        .filter(Boolean).join("  ·  ");
      if (meta) d.appendChild(text(el("span", "ores-meta doc-meta"), meta));
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
