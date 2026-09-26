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

     PASSAGE_ROLE. The payload types a block "quote" whenever the source set a
     passage apart, and every such passage keeps a boundary: none falls back
     to plain prose. Its role is WHOSE VOICE the passage is in, an editorial
     assignment recorded here and never inferred from the payload type, the
     element, boldness or a pair of quotation marks. "voice" is represented
     voice — words the prose presents as someone else's — and renders as a
     quotation (.doc-quote, the violet rail). "callout" is the document's own
     thesis, posed question or contrast at one point in a section, in ASK's
     voice, and renders as a paragraph of document body on the magenta
     emphasis rail (.surface-emphasis-rail): it keeps its prose semantics and
     is not a blockquote. (A part's opening statement, which frames the whole
     part, is "framing", below.) "synthesis" is the document's own conclusion
     of the sections before it — the statement section 8, "The conclusion",
     opens with — and renders as the same panel each compression takes
     (below), its chip naming it "conclusion". No other set-apart passage in a
     section plays that role: the compression of one step ("The cleanest
     compression is:"), the conclusion of one analysis (the simulation
     contrast), a posed question (conclusion 9's, and the next axis's closing
     one) and the next axis's proposal each state one part of the argument,
     not what the sections before it come to, and stay callouts; each part's
     compression is its closing synthesis. PULL_ROLE assigns the opening
     statement of each part — the ASK conclusion and the ASK prospective axis.
     Both are "framing": the statement that frames a whole part, set out
     before the sections that argue or ask it — the conclusion's thesis and
     the next axis's question-space. A framing opening takes the same panel as
     a synthesis, its chip naming its own role ("thesis", "question-space"):
     the panel sets the passage apart as its part's frame, and the chip keeps
     the two roles distinct. A framing opening is not a synthesis — it frames
     the sections after it rather than concluding the sections before it — and
     the panel does not raise its status: the chip and the part's own wording
     carry that. No passage inside a section is framing. "framing" is the
     vendored register's section framing: its catalog (surface-document.css)
     owns the role and its composition — a section synthesis's panel,
     unchanged, whose classes the panel rule and the surface treatments own,
     with the chip naming the framing — and keeps a thesis, question or
     contrast set apart inside the argument an authorial callout. This page
     owns which passages take the role — PULL_ROLE gives it the two part
     openings, each of which frames a whole part, not one point in a section
     — and the chip's word. PASSAGE_POPULATION records how
     many of each role, the framing openings included, and how many attention
     passages, each payload holds.
     ATTENTION. The magenta attention rail is assigned to the asymmetry passage:
     its lead-in and its diagram, as one unit.
     THE COMPRESSION of each section is a section synthesis: one flat summary
     panel — the panel material, free corners, flush elevation, document
     grouping — with a chip whose border alone takes the magenta accent, and the
     compression on document body. The two compressions take the same
     composition; their wording, and so their different status, is the payload's.
     COMPACT. The named diagrams render tight within a group and separated
     between groups. A single blank source line — after a label, before the
     ">>" that closes a statement, between two lines of one group — is not
     rendered: it splits one group into fragments. A run of two or more, the
     space between two groups, marks a boundary: each group is declared as the
     register's peer group (.doc-pre-group), its label and its lines, and the
     register sets one line between successive groups, the shape of the
     diagrams whose source already has it (conclusion 6's substrate
     question, whose groups GROUPED declares the same way). The payload is
     unchanged. The set
     is chosen by STRUCTURAL FAMILY, not by which diagrams a review happened
     to mark: every labeled diagram whose groups are a label, a blank, its
     lines and two blanks before the next label (twelve, in both payloads,
     of two to ten groups), the three sibling simulation diagrams of
     conclusion 6, and every lead-labeled diagram — a label, one blank, then
     only indented lines (FORK, MERGE, SUSPEND + RESTORE and ROLLBACK in the
     next axis), whose one blank reads as a gap after its label rather than
     as structure. The siblings and the lead-labeled diagrams hold no space
     between groups, so they render with no blank line. The rule is the same
     for every diagram, whatever its number of groups.

     PASSAGE_ROLE and ATTENTION are keyed by payload, then section; PULL_ROLE
     and PASSAGE_POPULATION by payload alone. All four FAIL CLOSED, as COMPACT
     does: before anything renders, every section they name must be in the
     payload; every PASSAGE_ROLE entry must name a quote block at its index that
     opens with its words, the block before it must open with its lead-in (or,
     where the entry names none, the passage must open its run); every quote
     block the payload holds must be named; the number of each role must be
     PASSAGE_POPULATION's; each opening statement must open with its PULL_ROLE
     words, and names voice, callout or framing — a framing opening with its
     chip — and never a synthesis; the number of framing openings must be
     PASSAGE_POPULATION's; ATTENTION must name PASSAGE_POPULATION's number of
     attention passages; and each one's two blocks must open and close with
     theirs. Any mismatch fails the section with its error line, so a moved,
     demoted, re-anchored or newly set-apart passage can never silently take
     another passage's voice, fall back to plain prose, or lose its rail or
     its panel. The anchors are the opening words: a change later in a
     passage's text keeps its reviewed voice and is not detected here. The
     check proves the table still covers the payload; it does not decide who
     is speaking — that decision is the table's, and it is reviewed with it.
     Each entry is [role, opening words, lead-in words or null]; the
     conclusion's distinctions run, which has no section id, is keyed
     "ask_conclusion-distinctions". A PULL_ROLE entry is [role, opening
     words], and a framing opening's adds its chip.
     COMPACT is keyed by payload, then section,
     then block index, to the block's opening words, and it FAILS CLOSED: before
     anything renders, each entry must name a code block at its index that opens
     with its words and holds a blank line. The family is then read from the
     payload itself, independently of the table: a labeled diagram is a code
     block holding a run of two or more blank lines (the space between two
     groups). Every labeled diagram the payload holds must be named, and their
     number must be COMPACT_FAMILY's. The simulation siblings are read from the
     payload the same way: a sibling is a code block that is not a labeled
     diagram, holds a blank line and closes a statement with a line that is
     exactly ">>" — at the left edge, with nothing else on it. That is the shape
     of the three variants in conclusion 6, and of no other block in either
     payload. Every sibling the payload holds must be named, and their number
     must be COMPACT_FAMILY's siblings. A lead-labeled diagram is read the same
     way: a code block that is not a labeled diagram, whose first line is
     unindented, whose second line is blank, and whose every later line is
     indented and not blank. Every one the payload holds must be named, and
     their number must be COMPACT_FAMILY's lead. Every named entry must be a
     labeled diagram, a sibling or a lead-labeled diagram. Every labeled
     diagram must also keep its shape: each group opens with an unindented
     label, one blank and an indented line, and every space between groups is
     exactly two blank lines, after a line and before the next group's label.
     Any mismatch fails the section with its error line, so a payload edit can
     never silently restore a loose diagram, open a gap after a label or
     inside a group (which would render as a space between groups), or leave a
     new labeled diagram, a new simulation variant or a new lead-labeled
     diagram loose. The sibling family ends where its shape ends: a block
     whose closer is indented or carries anything else on its line, or that has
     none, is outside it. */
  var PASSAGE_ROLE = {
    ask_conclusion: {
      "ask-conclusion-2": { 1: ["callout", "How do I know ", "The interesting question is not:"],
                            4: ["callout", "How can I know that ", "The harder question is:"],
                            7: ["voice", "I am conscious.", "When another person or system says:"] },
      "ask-conclusion-3": { 4: ["callout", "Across the subject boundary, proof becomes evidence.", "The cleanest compression is:"] },
      "ask-conclusion-6": { 14: ["callout", "\"It is simulated, therefore it cannot be conscious\"", "Therefore:"] },
      "ask-conclusion-8": { 0: ["synthesis", "Consciousness is self-authenticating to the subject", null] },
      "ask-conclusion-9": { 4: ["callout", "Have we proved that this system is conscious?", "For artificial systems, the decisive issue may never be:"],
                            6: ["callout", "Has the evidence become strong enough", "It may instead be:"] }
    },
    ask_next_axis: {
      "ask-next-axis-7": { 9: ["callout", "Copyability does not negate rights.", "The proposal, stated once:"] },
      "ask-next-axis-9": { 1: ["callout", "What is the morally + legally relevant unit of identity", "The conclusion ends by asking who has authority"] }
    }
  };
  var PULL_ROLE = {
    ask_conclusion: ["framing", "Consciousness may be directly known with certainty only from the first-person position.", "thesis"],
    ask_next_axis:  ["framing", "The ASK conclusion asks whether anyone is home.", "question-space"]
  };
  var PASSAGE_POPULATION = {
    ask_conclusion: { voice: 1, callout: 6, synthesis: 1, framing: 1, attention: 1 },
    ask_next_axis:  { voice: 0, callout: 2, synthesis: 0, framing: 1, attention: 0 }
  };
  var ATTENTION = {
    ask_conclusion: {
      "ask-conclusion-2": { from: 10, to: 11, opens: "The asymmetry is:", closes: "INSIDE THE OCCURRENCE", accent: "magenta" }
    }
  };
  var COMPACT = {
    ask_conclusion: {
      "ask_conclusion-distinctions": { 3: "CONSTITUTIVE QUESTION" },
      "ask-conclusion-1": { 2: "FUNCTIONAL THINKING" },
      "ask-conclusion-2": { 11: "INSIDE THE OCCURRENCE" },
      "ask-conclusion-3": { 1: "SUBJECT S" },
      "ask-conclusion-4": { 1: "CARTESIAN CERTAINTY" },
      "ask-conclusion-5": { 3: "ANOTHER HUMAN" },
      "ask-conclusion-6": { 2: "a rendered world is fed to an external conscious observer",
                            5: "a simulated environment mediates interactions",
                            7: "agents exist as causally organized processes" },
      "ask-conclusion-8": { 2: "within a conscious occurrence" }
    },
    ask_next_axis: {
      "ask-next-axis-1": { 2: "PRESENCE" },
      "ask-next-axis-3": { 1: "SUSPEND + RESTORE", 3: "SUSPENSION" },
      "ask-next-axis-4": { 1: "ROLLBACK" },
      "ask-next-axis-5": { 2: "FORK", 4: "SUPPOSE BOTH ARE NUMERICALLY THE PREDECESSOR" },
      "ask-next-axis-6": { 1: "MERGE" },
      "ask-next-axis-7": { 5: "PROTECTION AGAINST SUFFERING" },
      "ask-next-axis-8": { 1: "ACTIVE PATIENT" }
    }
  };
  var COMPACT_FAMILY = { ask_conclusion: { labeled: 7, siblings: 3, lead: 0 }, ask_next_axis: { labeled: 5, siblings: 0, lead: 4 } };
  /* GROUPED names each diagram outside COMPACT whose source already sets its peer
     groups one blank line apart, keyed by payload, then section, then block index,
     to [opening words, number of groups]. See PEER GROUPS, below. */
  var GROUPED = { ask_conclusion: { "ask-conclusion-6": { 11: ["substrate-bound", 3] } }, ask_next_axis: {} };

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
       index AND opening words. All three must still match; the checks below fail
       the section rather than give a block another block's treatment. */
    function acOpening(b) {
      if (!b) return "";
      if (Array.isArray(b.spans)) return b.spans.map(function (s) { return s && typeof s.v === "string" ? s.v : ""; }).join("");
      if (Array.isArray(b.lines)) return String(b.lines[0]);
      return "";
    }
    function acOpens(b, words) {
      return typeof words === "string" && acOpening(b).indexOf(words) === 0;
    }

    /* COMPACT is checked whole before anything renders; see its note above. */
    function acCompactCheck(AC) {
      var table = COMPACT[key] || {};
      var family = COMPACT_FAMILY[key] || { labeled: 0, siblings: 0, lead: 0 };
      var runs = {};
      runs[key + "-distinctions"] = AC.distinctions;
      if (Array.isArray(AC.sections)) AC.sections.forEach(function (s) { if (s && s.id) runs[s.id] = s.blocks; });
      function labeled(b) {
        if (!b || b.type !== "code" || !Array.isArray(b.lines)) return false;
        for (var i = 1; i < b.lines.length; i++) if (b.lines[i] === "" && b.lines[i - 1] === "") return true;
        return false;
      }
      function sibling(b) {
        return !!b && b.type === "code" && Array.isArray(b.lines) && !labeled(b) &&
          b.lines.indexOf(">>") >= 0 && b.lines.indexOf("") >= 0;
      }
      /* the shape a labeled diagram keeps: each group an unindented label, one blank and an indented line;
         every run of two or more blanks exactly two, after a line and before the next group's label */
      function shaped(b) {
        var L = b.lines, starts = [0], i = 0;
        while (i < L.length) {
          if (L[i] !== "") { i++; continue; }
          var n = 0;
          while (i + n < L.length && L[i + n] === "") n++;
          if (n >= 2) { if (n !== 2 || i === 0 || i + n >= L.length) return false; starts.push(i + n); }
          i += n;
        }
        return starts.every(function (s) { return /^\S/.test(L[s]) && L[s + 1] === "" && /^  \S/.test(L[s + 2] || ""); });
      }
      function leadLabeled(b) {
        if (!b || b.type !== "code" || !Array.isArray(b.lines) || labeled(b) || b.lines.length < 3) return false;
        if (typeof b.lines[0] !== "string" || b.lines[0] === "" || /^\s/.test(b.lines[0]) || b.lines[1] !== "") return false;
        for (var i = 2; i < b.lines.length; i++)
          if (typeof b.lines[i] !== "string" || b.lines[i].indexOf("  ") !== 0 || b.lines[i].trim() === "") return false;
        return true;
      }
      Object.keys(table).forEach(function (sid) {
        var run = runs[sid];
        if (!Array.isArray(run)) acFail("COMPACT names " + sid + ", which is not in the payload");
        Object.keys(table[sid]).forEach(function (j) {
          var b = run[j];
          if (!b || b.type !== "code" || !Array.isArray(b.lines)) acFail("COMPACT " + sid + "[" + j + "] is not a code block");
          if (!acOpens(b, table[sid][j])) acFail("COMPACT " + sid + "[" + j + "] no longer opens with its words");
          if (b.lines.indexOf("") < 0) acFail("COMPACT " + sid + "[" + j + "] holds no blank line");
          if (!labeled(b) && !sibling(b) && !leadLabeled(b)) acFail("COMPACT " + sid + "[" + j + "] is neither a labeled diagram, a simulation sibling nor a lead-labeled diagram");
        });
      });
      var found = 0, siblings = 0, leads = 0;
      Object.keys(runs).forEach(function (sid) {
        if (!Array.isArray(runs[sid])) return;
        runs[sid].forEach(function (b, j) {
          var kind = labeled(b) ? "labeled" : sibling(b) ? "sibling" : leadLabeled(b) ? "lead-labeled" : "";
          if (!kind) return;
          if (kind === "labeled") found++; else if (kind === "sibling") siblings++; else leads++;
          if (!(table[sid] && Object.prototype.hasOwnProperty.call(table[sid], String(j)))) acFail("the payload holds a " + kind + " diagram COMPACT does not name: " + sid + "[" + j + "]");
          if (kind === "labeled" && !shaped(b)) acFail("COMPACT " + sid + "[" + j + "] is a labeled diagram out of shape: a gap after a label or inside a group");
        });
      });
      if (found !== family.labeled) acFail("the payload holds " + found + " labeled diagrams where " + family.labeled + " are expected");
      if (siblings !== family.siblings) acFail("the payload holds " + siblings + " sibling diagrams where " + family.siblings + " are expected");
      if (leads !== family.lead) acFail("the payload holds " + leads + " lead-labeled diagrams where " + family.lead + " are expected");
      /* GROUPED: each entry names a code block outside COMPACT that opens with its words and
         keeps the one-apart shape with its number of groups; every block of that shape the
         payload holds outside COMPACT must be named. The shape: an unindented label first;
         every blank line single, after an indented line and before an unindented label
         with an indented line beneath it; no blank line last. */
      var grouped = GROUPED[key] || {};
      function oneApart(b) {
        if (!b || b.type !== "code" || !Array.isArray(b.lines) || b.lines.indexOf("") < 0) return 0;
        var L = b.lines, n = 1;
        if (typeof L[0] !== "string" || !/^\S/.test(L[0]) || L[L.length - 1] === "") return 0;
        for (var i = 1; i < L.length; i++) {
          if (L[i] !== "") continue;
          if (!/^  \S/.test(L[i - 1]) || !/^\S/.test(L[i + 1] || "") || !/^  \S/.test(L[i + 2] || "")) return 0;
          n++;
        }
        return n;
      }
      Object.keys(grouped).forEach(function (sid) {
        if (!Array.isArray(runs[sid])) acFail("GROUPED names " + sid + ", which is not in the payload");
        Object.keys(grouped[sid]).forEach(function (j) {
          var b = runs[sid][j], want = grouped[sid][j];
          if (table[sid] && Object.prototype.hasOwnProperty.call(table[sid], j)) acFail("GROUPED " + sid + "[" + j + "] is also named by COMPACT");
          if (!acOpens(b, want[0])) acFail("GROUPED " + sid + "[" + j + "] no longer opens with its words");
          if (oneApart(b) !== want[1]) acFail("GROUPED " + sid + "[" + j + "] is not " + want[1] + " groups one blank line apart");
        });
      });
      Object.keys(runs).forEach(function (sid) {
        if (!Array.isArray(runs[sid])) return;
        runs[sid].forEach(function (b, j) {
          if (oneApart(b) && !(table[sid] && Object.prototype.hasOwnProperty.call(table[sid], String(j))) &&
              !(grouped[sid] && Object.prototype.hasOwnProperty.call(grouped[sid], String(j))))
            acFail("the payload holds a grouped diagram GROUPED does not name: " + sid + "[" + j + "]");
        });
      });
    }

    /* PASSAGE_ROLE, PULL_ROLE and ATTENTION are checked whole before anything
       renders; see their note above. */
    function acPassageCheck(AC) {
      var table = PASSAGE_ROLE[key] || {}, attention = ATTENTION[key] || {};
      var count = { voice: 0, callout: 0, synthesis: 0 };
      var want = PASSAGE_POPULATION[key] || { voice: 0, callout: 0, synthesis: 0, framing: 0, attention: 0 };
      var runs = {};
      runs[key + "-distinctions"] = AC.distinctions;
      if (Array.isArray(AC.sections)) AC.sections.forEach(function (s) { if (s && s.id) runs[s.id] = s.blocks; });
      Object.keys(table).forEach(function (sid) {
        if (!Array.isArray(runs[sid])) acFail("PASSAGE_ROLE names " + sid + ", which is not in the payload");
        Object.keys(table[sid]).forEach(function (j) {
          var e = table[sid][j], b = runs[sid][j], i = Number(j);
          if (!b || b.type !== "quote") acFail("PASSAGE_ROLE " + sid + "[" + j + "] is not a quote block");
          if (!acOpens(b, e[1])) acFail("PASSAGE_ROLE " + sid + "[" + j + "] no longer opens with its words");
          if (e[2] === null ? i !== 0 : !acOpens(runs[sid][i - 1], e[2]))
            acFail("PASSAGE_ROLE " + sid + "[" + j + "]'s lead-in no longer opens with its words");
          if (e[0] !== "voice" && e[0] !== "callout" && e[0] !== "synthesis") acFail("PASSAGE_ROLE " + sid + "[" + j + "] names no known role");
          count[e[0]]++;
        });
      });
      Object.keys(runs).forEach(function (sid) {
        if (!Array.isArray(runs[sid])) return;
        runs[sid].forEach(function (b, j) {
          if (b && b.type === "quote" && !(table[sid] && Object.prototype.hasOwnProperty.call(table[sid], String(j))))
            acFail("the payload holds a set-apart passage PASSAGE_ROLE does not name: " + sid + "[" + j + "]");
        });
      });
      if (count.voice !== want.voice || count.callout !== want.callout || count.synthesis !== (want.synthesis || 0))
        acFail("PASSAGE_ROLE names " + count.voice + " voice, " + count.callout + " callout and " + count.synthesis +
          " synthesis passages where " + want.voice + ", " + want.callout + " and " + (want.synthesis || 0) + " are expected");
      var pull = PULL_ROLE[key];
      if (!pull || (pull[0] !== "voice" && pull[0] !== "callout" && pull[0] !== "framing")) acFail("the opening statement has no role");
      if (pull[0] === "framing" ? !(typeof pull[2] === "string" && pull[2]) : pull.length > 2)
        acFail(pull[0] === "framing" ? "the framing opening names no chip" : "the opening statement names a chip but is not framing");
      if ((pull[0] === "framing" ? 1 : 0) !== (want.framing || 0))
        acFail("PULL_ROLE names " + (pull[0] === "framing" ? 1 : 0) + " framing opening where " + (want.framing || 0) + " is expected");
      if (!acOpens({ spans: AC.pull_quote }, pull[1])) acFail("the opening statement no longer opens with its words");
      if (Object.keys(attention).length !== want.attention)
        acFail("ATTENTION names " + Object.keys(attention).length + " passages where " + want.attention + " are expected");
      Object.keys(attention).forEach(function (sid) {
        var a = attention[sid];
        if (!Array.isArray(runs[sid])) acFail("ATTENTION names " + sid + ", which is not in the payload");
        if (!acOpens(runs[sid][a.from], a.opens) || !acOpens(runs[sid][a.to], a.closes))
          acFail("ATTENTION " + sid + " no longer opens and closes with its words");
      });
    }

    /* STRUCTURED TEXT. A code block whose indentation is structure is drawn on the
       hierarchy rail: its lines sit in parts, and the lines beneath a line sit in a
       rail, one rail per two-space level, nested in source order. The two spaces a
       level carries are drawn by the rail rather than typed; blank lines between
       two lines at one level stay typed inside their part; blank lines before a
       new part or rail are recorded as data-lead-lines. So every source line keeps
       its line slot, and the source sequence can be rebuilt from the markup exactly
       — except in a COMPACT diagram, whose blank lines inside a group are
       dropped and whose space between two groups becomes a declared group
       boundary (PEER GROUPS, below).
       A block with no indented line, or whose lines this cannot represent exactly —
       an odd indent, a level skipped, a line that is only spaces or starts with
       another space character, more than three blank lines before a part, blank
       lines at the end — is written as ONE preformatted text node, as before. It is
       never failed for its shape. */
    function acStructured(lines, groups, where) {
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
      return groups ? acGroups(root, groups, where) : root;
    }

    /* PEER GROUPS. A grouped diagram declares each of its groups as the register's
       peer group, a .doc-pre-group: the group opens on its unindented label and holds
       what follows it until the next label, and the register sets exactly one line
       between successive groups. The grouped diagrams are the labeled COMPACT diagrams
       and the diagrams GROUPED names. The one blank line between two groups — the one
       COMPACT keeps, or the one the source already has — is the boundary read here,
       so it becomes the group boundary and is not recorded again. The number of groups
       must be the one expected: a labeled diagram's runs of two blank lines plus one,
       or GROUPED's number. A grouped diagram whose groups cannot be declared exactly,
       or that cannot be drawn as structured text, fails its section. The check runs as
       the block is built, inside the same detached fragment, so nothing reaches the
       page unless all of it does. */
    function acGroups(root, want, where) {
      var out = el("div", root.className), group = null, n = 0;
      Array.prototype.slice.call(root.childNodes).forEach(function (k, i) {
        var lead = k.getAttribute("data-lead-lines"), label = k.classList.contains("doc-pre-part");
        if (i === 0 ? (!label || lead) : (lead && (lead !== "1" || !label)))
          acFail("PEER GROUPS " + where + ": a boundary does not fall before a label");
        if (i === 0 || lead) { group = out.appendChild(el("div", "doc-pre-group")); n++; k.removeAttribute("data-lead-lines"); }
        group.appendChild(k);
      });
      if (n !== want || out.querySelector("[data-lead-lines]"))
        acFail("PEER GROUPS " + where + ": " + n + " groups where " + want + " are expected");
      return out;
    }

    /* COMPACT keeps a named diagram tight within a group and separated between
       groups: a single blank source line is dropped, and a run of two or more
       — the space between two groups — stays as one blank line, which
       acGroups reads as the boundary between two declared groups. */
    function acCompact(lines) {
      var out = [], run = 0;
      lines.forEach(function (l) {
        if (l === "") { run++; return; }
        if (run >= 2 && out.length) out.push("");
        run = 0; out.push(l);
      });
      return out;
    }
    /* A PANEL: one flat panel — the panel material, free corners, flush
       elevation, document grouping — with a chip naming the passage's role,
       whose border alone takes the magenta accent, and the text on document
       body. Two roles take this one composition, and the chip keeps them
       apart: a section synthesis (section 8's conclusion, both compressions)
       and a framing opening (the conclusion's thesis, the next axis's
       question-space). The panel names no role itself; its caller does. */
    function acPanel(tag, hook, chip, spans) {
      var panel = el(tag, hook + " surface-separate surface-material-panel surface-attach-free surface-elevation-flush doc-group");
      panel.appendChild(text(el("p", "askc-label surface-emphasis-chip surface-emphasis--magenta"), chip));
      acSpans(panel.appendChild(el("p", "askc-p doc-body")), spans);
      return panel;
    }

    function acBlock(b, role, compact, named, where) {
      if (!b || typeof b.type !== "string") acFail("malformed block");
      if (b.type === "paragraph") return acSpans(el("p", "askc-p doc-body"), b.spans);
      if (b.type === "quote") return acPassage(b.spans, role, "askc-q", "askc-p");
      if (b.type === "code") {
        if (!Array.isArray(b.lines)) acFail("code block without lines");
        var lines = compact ? acCompact(b.lines) : b.lines;
        var groups = 0;
        if (named) groups = named[1];
        else if (compact) b.lines.forEach(function (l, i) {
          if (l === "" && b.lines[i - 1] === "" && b.lines[i - 2] !== "") groups += groups ? 1 : 2;
        });
        var drawn = acStructured(lines, groups, where);
        if (groups && !drawn) acFail("PEER GROUPS " + where + ": the grouped diagram cannot be drawn as structured text");
        return drawn || text(el("pre", "askc-pre doc-pre"), lines.join("\n"));
      }
      if (b.type === "list") {
        if (!Array.isArray(b.items)) acFail("list block without items");
        var ul = el("ul", "askc-ul doc-body");
        b.items.forEach(function (it) { ul.appendChild(acSpans(el("li"), it)); });
        return ul;
      }
      acFail('unknown block type "' + b.type + '"');
    }
    /* A set-apart passage, by its assigned voice. "callout" is ASK's own voice:
       a paragraph of document body on the magenta emphasis rail. "voice" is
       represented voice: a quotation on the violet rail. "synthesis" is the
       document's own conclusion: the panel each compression takes (below),
       its chip naming it. "framing" is a part's opening statement: the same
       panel, its chip naming its own role, which only PULL_ROLE assigns.
       There is no default. */
    function acPassage(spans, role, quoteHook, calloutHook, chip) {
      if (role === "callout") return acSpans(el("p", calloutHook + " doc-body surface-emphasis-rail surface-emphasis--magenta"), spans);
      if (role === "synthesis") return acPanel("div", "askc-synthesis", "conclusion", spans);
      if (role === "framing") return acPanel("div", quoteHook + " askc-framing", chip, spans);
      if (role === "voice") {
        var bq = el("blockquote", quoteHook + " doc-quote");
        acSpans(bq.appendChild(el("p")), spans);
        return bq;
      }
      acFail("a set-apart passage has no assigned voice");
    }
    function acAppend(target, blocks, sectionId) {
      if (!Array.isArray(blocks)) acFail("block run is not an array");
      var roles = (sectionId && (PASSAGE_ROLE[key] || {})[sectionId]) || {};
      var compact = (sectionId && (COMPACT[key] || {})[sectionId]) || {};
      var grouped = (sectionId && (GROUPED[key] || {})[sectionId]) || {};
      var att = (sectionId && (ATTENTION[key] || {})[sectionId]) || null;
      if (att && !(acOpens(blocks[att.from], att.opens) && acOpens(blocks[att.to], att.closes))) acFail("ATTENTION " + sectionId + " no longer matches");
      var into = target;
      blocks.forEach(function (b, j) {
        if (att && j === att.from) {
          into = target.appendChild(el("div", "askc-attention doc-group surface-emphasis-rail surface-emphasis--" + att.accent));
        }
        var entry = roles[j];
        into.appendChild(acBlock(b, entry && acOpens(b, entry[1]) ? entry[0] : null, Object.prototype.hasOwnProperty.call(compact, j),
          Object.prototype.hasOwnProperty.call(grouped, j) ? grouped[j] : null, sectionId + "[" + j + "]"));
        if (att && j === att.to) into = target;
      });
    }

    /* Built into a DETACHED fragment: nothing reaches the page unless all of it does. */
    var frag = document.createDocumentFragment();
    try {
      if (!AC) acFail("payload object absent");
      if (typeof AC.title !== "string" || !AC.title) acFail("missing title");
      acCompactCheck(AC);
      acPassageCheck(AC);
      acSpans(frag.appendChild(el("p", "askc-intro doc-lede")), AC.introduction);
      frag.appendChild(acPassage(AC.pull_quote, PULL_ROLE[key][0], "askc-pull", "askc-pull", PULL_ROLE[key][2]));
      acAppend(frag, AC.distinctions, key + "-distinctions");

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

      /* The compression is the section's synthesis: one flat summary panel, the
         same composition for both sections, not a quotation, not a heading and
         not a rail. "compression" names what kind of passage it is, so it is a
         label: the chip, whose border alone takes the magenta accent. */
      frag.appendChild(acPanel("section", "askc-sec askc-compress", "compression", AC.compression));

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
      var title = el("span", "ores-title doc-entry-title");
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
