/* cfw-atlas.js — the CFW mind map + typed relation atlas.

   Direction A's radial architecture, carried into the interactive artifact:
   one centre, one weighted angular sector per conceptual region, branches on a
   staggered ring inside their sector, concepts fanned beyond their branch.

   v2 adds the ATLAS NAVIGATION LAYER over that unchanged composition — search
   across all 1,027 objects, exact-identifier access to every evidence owner, and
   bounded sectional projections. The geometry, the grouping, the encoding
   contract and the projection module itself are unchanged from v1;
   cfw-projection.js is carried byte-identical, which is the proof.

   It consumes design-system-ASK Tier 1 + Tier 2 BY REFERENCE from the pinned
   ./_dsa-tokens/ mirror, consumes Spectral State by reference, vendors the
   DS-owned shared fit helper byte-identical, and follows the interactive-diagram
   family grammar. It is a PROJECT-LOCAL engine, claims no conformance to
   `diagram-interactive-spine`, and asserts no reusable-pattern status.

   GEOMETRY CLAIM BOUND — true of this layout, and stated in the legend:
     radial distance    PROJECTION LEVEL only  (centre / region / branch / concept)
     sector width       CORPUS WEIGHT only     — never importance, never authority
     angular placement  compositional only
     sector adjacency   NO semantic relation
     governed edges     the ONLY relation encoding on this surface

   LEVEL OF DETAIL IS NOT FILTERING, and v2 keeps them visibly apart in the HUD.
   LOD is zoom-driven and removes nothing. A FILTER is explicit, changes which
   objects are in the bounded section, and always reports its census. Neither
   changes governed relation status: an edge outside the current section is still
   a registered or recorded relation, and the inspector still reports it.        */

(function (root) {
  "use strict";

  if (!root.DIAGRAM_FIT || typeof root.DIAGRAM_FIT.compute !== "function")
    throw new Error("Diagram fit support is missing. Load diagrams-fit.js before cfw-atlas.js.");
  if (!root.CFWControls)
    throw new Error("Atlas controls are missing. Load cfw-controls.js before cfw-atlas.js.");

  var C = root.CFWControls;
  var NS = "http://www.w3.org/2000/svg";
  function el(n, a) { var e = document.createElementNS(NS, n);
    if (a) for (var k in a) if (a[k] !== null && a[k] !== undefined) e.setAttribute(k, a[k]);
    return e; }
  function esc(s) { return String(s === null || s === undefined ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;"); }

  /* SHAPE IS THE OBJECT-CLASS CHANNEL, and this table is its whole definition.
     It is pinned byte-for-byte against interactive v1 by the parity harness. v2
     silently moved CFW-F from square to diamond while rewriting this file, which
     rendered six frame objects with the mark the legend reserves for an ASK
     articulation — a semantic mutation inside a round authorized only to add
     navigation. Proving the PROJECTION module byte-identical did not catch it,
     because the encoding tables live here, in the renderer. */
  var CLASS_SHAPE = {
    "CFW-N": "circle", "CFW-C": "square", "CFW-B": "square", "CFW-M": "square",
    "CFW-F": "square", "CFW-A": "diamond", "CFW-Q": "hex", "CFW-X": "tri",
    "CFW-T": "ring", "CFW-S": "circle"
  };
  var CLASS_NAME = {
    "CFW-N": "node — a survey position, argument, tradition or distinction",
    "CFW-C": "claim card", "CFW-B": "bounded claim", "CFW-M": "ASK mapping row",
    "CFW-F": "frame object", "CFW-A": "ASK articulation", "CFW-Q": "held question",
    "CFW-X": "cross-cutting object", "CFW-T": "topology object",
    "CFW-S": "evidence owner (inspector plane)"
  };

  /* Level of detail. `branchMin` is the honest part: at Fit the overview names
     every region and every MAJOR branch, and the rest resolve one zoom step in.
     Nothing is removed at any level. */
  var LOD = [
    { k: 0,    name: "regions",  leafLabels: false, ids: false, branchMin: 16 },
    { k: 0.58, name: "branches", leafLabels: false, ids: false, branchMin: 0  },
    { k: 1.05, name: "concepts", leafLabels: true,  ids: false, branchMin: 0  },
    { k: 2.30, name: "records",  leafLabels: true,  ids: true,  branchMin: 0  }
  ];
  function lodFor(k) { var L = LOD[0];
    for (var i = 0; i < LOD.length; i++) if (k >= LOD[i].k) L = LOD[i];
    return L; }

  function initTheme(btn) {
    var stored = null;
    try { stored = localStorage.getItem("cfw-theme"); } catch (e) { stored = null; }
    if (stored === "light" || stored === "dark")
      document.documentElement.setAttribute("data-theme", stored);
    function label() {
      var t = document.documentElement.getAttribute("data-theme");
      var dark = t === "dark" || (!t && window.matchMedia &&
                 window.matchMedia("(prefers-color-scheme: dark)").matches);
      if (btn) btn.textContent = dark ? "light" : "dark";
      return dark;
    }
    label();
    if (btn) btn.addEventListener("click", function () {
      var next = label() ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("cfw-theme", next); } catch (e) {}
      label();
    });
  }

  /* =====================================================================
     LAYOUT — Direction A, radial. UNCHANGED from v1 except that each spine
     now records the child it belongs to, so a bounded section can hide a
     limb with its object instead of leaving a line to nothing.
     ===================================================================== */
  var R_ROOT = 44, R_REGION = 76, R_BRANCH = 15, R_LEAF = 5.2;

  function layout(P) {
    var nodes = [], spines = [];
    var R1 = 250, R2 = 610, R3 = 800;
    var total = P.regions.reduce(function (s, r) { return s + Math.sqrt(r.count); }, 0);
    var a = -Math.PI / 2;                                    // start at 12 o'clock

    nodes.push({ kind: "root", id: "ROOT", x: 0, y: 0, r: R_ROOT, ang: -Math.PI / 2,
                 label: P.root.label, count: 0 });

    P.regions.forEach(function (reg) {
      /* SECTOR WIDTH ENCODES CORPUS WEIGHT ONLY. sqrt keeps a small region
         legible without letting a large one swamp the field; it is a scale
         choice about readability, and it still encodes nothing but weight. */
      var span = (Math.sqrt(reg.count) / total) * Math.PI * 2;
      var mid = a + span / 2;
      var rx = Math.cos(mid) * R1, ry = Math.sin(mid) * R1;
      nodes.push({ kind: "region", id: reg.id, x: rx, y: ry, r: R_REGION, ang: mid,
                   label: reg.label, count: reg.count, owner: reg.owner });
      spines.push({ d: "M0 0 L" + rx + " " + ry, cls: "spine limb", id: reg.id });

      var inset = span * 0.06, bSpan = span - inset * 2;
      var nb = reg.branches.length;
      reg.branches.forEach(function (br, bi) {
        var ba = a + inset + (nb === 1 ? bSpan / 2 : (bi + 0.5) * (bSpan / nb));
        var brad = R2 - (bi % 2) * 96;                        // staggered ring
        var bx = Math.cos(ba) * brad, by = Math.sin(ba) * brad;
        nodes.push({ kind: "branch", id: br.id, x: bx, y: by, r: R_BRANCH, ang: ba,
                     label: br.label, count: br.leaves.length, src: br.src,
                     owner: reg.owner, region: reg.id });
        spines.push({ d: "M" + rx + " " + ry + " L" + bx + " " + by, cls: "spine", id: br.id });

        var nL = br.leaves.length;
        var perRow = Math.max(3, Math.ceil(Math.sqrt(nL * 1.9)));
        var lSpan = (bSpan / nb) * 0.9;
        var bnode = nodes[nodes.length - 1];
        /* how far this branch's own concept fan reaches — its callout sits beyond it */
        bnode.outerR = R3 + Math.max(0, Math.ceil(nL / perRow) - 1) * 34 + 18;
        br.leaves.forEach(function (o, li) {
          var rowN = Math.floor(li / perRow), col = li % perRow;
          var inRow = Math.min(perRow, nL - rowN * perRow);
          var t = inRow === 1 ? 0.5 : col / (inRow - 1);
          var la = ba - lSpan / 2 + t * lSpan;
          var lr = R3 + rowN * 34;
          var lx = Math.cos(la) * lr, ly = Math.sin(la) * lr;
          nodes.push({ kind: "leaf", id: o.id, obj: o, x: lx, y: ly, r: R_LEAF, ang: la,
                       state: P.governedState(o), branch: br.id, region: reg.id,
                       label: String(o.label || o.id).slice(0, 74) });
          spines.push({ d: "M" + bx + " " + by + " L" + lx + " " + ly, cls: "spine", id: o.id });
        });
      });
      a += span;
    });

    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    nodes.forEach(function (n) {
      x0 = Math.min(x0, n.x - n.r * 2); y0 = Math.min(y0, n.y - n.r * 2);
      x1 = Math.max(x1, n.x + n.r * 2); y1 = Math.max(y1, n.y + n.r * 2);
    });
    /* Labels live in SCREEN space, so the world bounds reserve only a small
       structural margin; the screen room labels need is supplied by the fit
       helper's clearance. A large world pad here just shrinks the figure. */
    var pad = 45;
    return { nodes: nodes, spines: spines,
             bounds: { x: x0 - pad, y: y0 - pad, w: (x1 - x0) + pad * 2, h: (y1 - y0) + pad * 2 } };
  }

  /* =====================================================================
     MOUNT
     ===================================================================== */
  function mount(opts) {
    var P = opts.projection;
    var stage = document.getElementById("stage");
    var wrapEl = stage.closest(".canvas-wrap") || stage.parentNode || stage;
    var liveEl = document.getElementById("live");
    function announce(msg) { if (liveEl) liveEl.textContent = msg; }

    var svg = el("svg", { xmlns: NS });
    stage.appendChild(svg);
    var defs = el("defs"); svg.appendChild(defs);
    var mk = el("marker", { id: "arrow", viewBox: "0 0 10 10", refX: 9, refY: 5,
                            markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" });
    mk.appendChild(el("path", { d: "M 0 0 L 10 5 L 0 10 z" }));
    defs.appendChild(mk);

    var gRoot  = el("g"); svg.appendChild(gRoot);
    var gSpine = el("g"); gRoot.appendChild(gSpine);
    var gEdge  = el("g"); gRoot.appendChild(gEdge);
    var gNode  = el("g"); gRoot.appendChild(gNode);
    /* Labels live OUTSIDE the zoom transform, in screen space, so they can be
       upright, constant-size and de-collided against each other. */
    var gLead  = el("g"); svg.appendChild(gLead);
    var gLabel = el("g"); svg.appendChild(gLabel);

    var L = layout(P);
    var byId = {}; L.nodes.forEach(function (n) { byId[n.id] = n; });
    var index = C.buildIndex(P);
    var qBear = C.questionBearing(P);
    var DIMS  = C.dimensions(P, CLASS_NAME);
    var NOTOFFERED = C.notOffered(P);
    var sel = C.emptySelection();

    var spineEls = {};
    L.spines.forEach(function (s) {
      var p = el("path", { "class": s.cls, d: s.d });
      gSpine.appendChild(p);
      spineEls[s.id] = p;
    });

    /* typed cross-links. UNEDGED IS NEVER DRAWN: it records a declared
       non-linkage, and a line would assert the linkage the record denies. */
    var edgeEls = [];
    P.links.forEach(function (lk) {
      if (lk.plane === "unedged") return;
      var A = byId[lk.from], B = byId[lk.to];
      if (!A || !B) return;
      var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      var dx = B.x - A.x, dy = B.y - A.y;
      var bow = Math.sqrt(dx * dx + dy * dy) * 0.15;
      var nx = -dy, ny = dx, nl = Math.sqrt(nx * nx + ny * ny) || 1;
      var p = el("path", { "class": "edge " + lk.plane,
        d: "M" + A.x + " " + A.y + " Q" + (mx + nx / nl * bow) + " " + (my + ny / nl * bow) +
           " " + B.x + " " + B.y });
      if (lk.plane === "registered") p.classList.add("on");   // 8 canonical, quiet by default
      gEdge.appendChild(p);
      edgeEls.push({ p: p, from: lk.from, to: lk.to, lk: lk });
    });

    /* nodes */
    var nodeEls = [], labelEls = [];
    L.nodes.forEach(function (n) {
      var g = el("g", { "class": "node", "data-id": n.id });
      g.style.setProperty("--st", n.kind === "leaf"
        ? "var(--state-" + n.state + ")" : "var(--state-neutral)");
      var r = n.r;
      if (n.kind === "root")
        g.appendChild(el("circle", { "class": "box", cx: n.x, cy: n.y, r: r }));
      else if (n.kind === "region")
        g.appendChild(el("rect", { "class": "box", x: n.x - r, y: n.y - r * 0.62,
                                   width: r * 2, height: r * 1.24, rx: r * 0.5, ry: r * 0.5 }));
      else if (n.kind === "branch")
        g.appendChild(el("circle", { "class": "box", cx: n.x, cy: n.y, r: r }));
      else {
        var sh = CLASS_SHAPE[n.obj.class] || "circle";
        if (sh === "square")
          g.appendChild(el("rect", { "class": "box", x: n.x - r, y: n.y - r,
                                     width: r * 2, height: r * 2, rx: r * 0.28, ry: r * 0.28 }));
        else if (sh === "diamond")
          g.appendChild(el("polygon", { "class": "box", points:
            [n.x, n.y - r * 1.25, n.x + r * 1.25, n.y, n.x, n.y + r * 1.25, n.x - r * 1.25, n.y].join(" ") }));
        else if (sh === "hex") {
          var pts = [];
          for (var i = 0; i < 6; i++) { var t = Math.PI / 6 + i * Math.PI / 3;
            pts.push((n.x + Math.cos(t) * r * 1.3) + "," + (n.y + Math.sin(t) * r * 1.3)); }
          g.appendChild(el("polygon", { "class": "box", points: pts.join(" ") }));
        } else if (sh === "tri")
          g.appendChild(el("polygon", { "class": "box", points:
            [n.x, n.y - r * 1.35, n.x + r * 1.2, n.y + r * 0.85, n.x - r * 1.2, n.y + r * 0.85].join(" ") }));
        else if (sh === "ring") {
          g.appendChild(el("circle", { "class": "box", cx: n.x, cy: n.y, r: r * 1.2 }));
          g.appendChild(el("circle", { "class": "chip", cx: n.x, cy: n.y, r: r * 0.34 }));
        } else
          g.appendChild(el("circle", { "class": "box", cx: n.x, cy: n.y, r: r }));
      }
      gNode.appendChild(g);
      nodeEls.push({ g: g, n: n });
      g.addEventListener("click", function (ev) { ev.stopPropagation(); select(n.id); });
      g.addEventListener("mouseenter", function () { if (!locked) preview(n.id); });
      g.addEventListener("mouseleave", function () { if (!locked) preview(null); });

      /* screen-space label + leader, built once and positioned on every apply() */
      var cls = n.kind === "root" ? "lbl-root" : n.kind === "region" ? "lbl-region"
              : n.kind === "branch" ? "lbl-branch" : "lbl-leaf";
      var t = el("text", { "class": cls + " lbl-halo" });
      gLabel.appendChild(t);
      var cnt = null, idl = null, lead = null;
      if (n.kind === "region" || n.kind === "branch") {
        cnt = el("text", { "class": "lbl-count lbl-halo" }); gLabel.appendChild(cnt);
        lead = el("path", { "class": "leader" }); gLead.appendChild(lead);
      }
      if (n.kind === "leaf") { idl = el("text", { "class": "lbl-id lbl-halo" }); gLabel.appendChild(idl); }
      labelEls.push({ n: n, t: t, cnt: cnt, idl: idl, lead: lead });
    });

    /* =====================================================================
       BOUNDED SECTIONAL PROJECTION
       The layout is NEVER recomputed. A section is the same radial map with a
       declared membership; geometry, identity and grouping are untouched.
       ===================================================================== */
    var visible = {};          // node id -> true
    var visLeaf = 0, visEdge = 0;
    var branchVis = {}, regionVis = {};

    function computeVisible() {
      var objPred = C.objectPredicate(P, sel, qBear);
      var relPred = C.relationPredicate(sel);
      visible = { ROOT: true }; branchVis = {}; regionVis = {}; visLeaf = 0;

      L.nodes.forEach(function (n) {
        if (n.kind !== "leaf") return;
        if (objPred(n.obj)) {
          visible[n.id] = true; visLeaf++;
          branchVis[n.branch] = (branchVis[n.branch] || 0) + 1;
          regionVis[n.region] = (regionVis[n.region] || 0) + 1;
        }
      });
      L.nodes.forEach(function (n) {
        if (n.kind === "branch" && branchVis[n.id]) visible[n.id] = true;
        if (n.kind === "region" && regionVis[n.id]) visible[n.id] = true;
      });

      visEdge = 0;
      edgeEls.forEach(function (e) {
        /* An edge is drawn only when the relation view admits it AND both of its
           objects are inside the section. That is MEMBERSHIP, not status: the
           relation is unchanged, and the inspector still reports it in full. */
        e.vis = relPred(e.lk) && !!visible[e.from] && !!visible[e.to];
        if (e.vis) visEdge++;
      });
    }

    function paintVisibility() {
      nodeEls.forEach(function (ne) {
        var on = !!visible[ne.n.id];
        ne.g.classList.toggle("out", !on);
        var sp = spineEls[ne.n.id];
        if (sp) sp.classList.toggle("out", !on);
      });
      edgeEls.forEach(function (e) { e.p.classList.toggle("out", !e.vis); });
    }

    function visibleBounds() {
      var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, n = 0;
      L.nodes.forEach(function (nd) {
        if (!visible[nd.id]) return;
        n++;
        x0 = Math.min(x0, nd.x - nd.r * 2); y0 = Math.min(y0, nd.y - nd.r * 2);
        x1 = Math.max(x1, nd.x + nd.r * 2); y1 = Math.max(y1, nd.y + nd.r * 2);
      });
      if (!n || !isFinite(x0)) return L.bounds;
      var pad = 45;
      return { x: x0 - pad, y: y0 - pad, w: (x1 - x0) + pad * 2, h: (y1 - y0) + pad * 2 };
    }

    function filtering() { return C.activeCount(sel) > 0; }

    function censusText() {
      if (!filtering()) return visLeaf + " / " + P.counts.primary + " objects — complete map, no filter";
      return visLeaf + " / " + P.counts.primary + " objects · " + visEdge + " edges drawn · " +
             C.activeCount(sel) + " filter" + (C.activeCount(sel) === 1 ? "" : "s") + " active";
    }

    function updateCensus() {
      var c = document.getElementById("census");
      if (c) {
        c.textContent = censusText();
        c.classList.toggle("active", filtering());
      }
      var f = document.getElementById("filterstate");
      if (f) {
        f.textContent = filtering()
          ? "filtered " + visLeaf + "/" + P.counts.primary
          : "no filter";
        f.classList.toggle("active", filtering());
      }
      document.body.classList.toggle("filtering", filtering());
    }

    function applySection(refit) {
      computeVisible();
      paintVisibility();
      updateCensus();
      if (refit !== false) fitTo(visibleBounds());
      else apply();
      if (locked && !visible[locked]) { locked = null; paint(null); inspect(null); }
      else paint(locked);
    }

    /* ---------------- view ---------------- */
    var view = { k: 1, x: 0, y: 0 }, fitK = 1, lastFit = null;
    function project(n) { return { x: n.x * view.k + view.x, y: n.y * view.k + view.y }; }

    /* Upright callout labels, de-collided in SCREEN space.
       Overview labels never rotate: the reader should not have to turn their head. */
    function placeLabels(L2) {
      var W = stage.clientWidth, H = stage.clientHeight;
      var sides = { l: [], r: [] }, rootObstacle = null;
      var cx0 = view.x, cy0 = view.y;                 /* world origin, projected */
      labelEls.forEach(function (le) {
        var n = le.n, show;
        if (!visible[n.id]) show = false;             /* outside the section */
        else if (n.kind === "leaf")      show = L2.leafLabels;
        else if (n.kind === "branch") show = (branchVis[n.id] || n.count) >= (L2.branchMin || 0);
        else show = true;
        le.show = show;
        if (!show) {
          le.t.style.display = "none";
          if (le.cnt) le.cnt.style.display = "none";
          if (le.idl) le.idl.style.display = "none";
          if (le.lead) le.lead.style.display = "none";
          return;
        }
        var p = project(n);
        le.p = p;
        if (n.kind === "root") {
          var ry = p.y + n.r * view.k + 30;
          le.t.style.display = ""; le.t.setAttribute("x", p.x); le.t.setAttribute("y", ry);
          le.t.setAttribute("text-anchor", "middle"); le.t.textContent = n.label;
          le.t.removeAttribute("transform");
          /* The centre label sits ON the vertical axis, where callouts from the
             inner ring also want to be. Pin it into both side lists so the
             relaxation displaces them around it rather than through it. */
          rootObstacle = { y: ry, halfW: n.label.length * 6.0 + 14, x: p.x };
          return;
        }
        if (n.kind === "leaf") {
          /* concepts stay on their own radius and read along it — a concentric
             fan is what a radial dendrogram labels this way, and they appear
             only once the reader has zoomed in. */
          var left = Math.cos(n.ang) < 0, deg = n.ang * 180 / Math.PI;
          var lx = p.x + (left ? -9 : 9), ly = p.y + 3.5;
          le.t.style.display = ""; le.t.setAttribute("x", lx); le.t.setAttribute("y", ly);
          le.t.setAttribute("text-anchor", left ? "end" : "start");
          le.t.setAttribute("transform", "rotate(" + (left ? deg + 180 : deg) + " " + lx + " " + ly + ")");
          le.t.textContent = n.label;
          if (le.idl) {
            var on = L2.ids;
            le.idl.style.display = on ? "" : "none";
            if (on) { le.idl.setAttribute("x", lx); le.idl.setAttribute("y", ly + 11);
              le.idl.setAttribute("text-anchor", left ? "end" : "start");
              le.idl.setAttribute("transform", "rotate(" + (left ? deg + 180 : deg) + " " + lx + " " + (ly + 11) + ")");
              le.idl.textContent = n.obj.id; }
          }
          return;
        }
        /* region + branch: upright callout, side chosen by the marker's bearing.
           A BRANCH callout is pushed out PAST ITS OWN CONCEPT FAN, so a label
           never sits on the dots it names. */
        var side = Math.cos(n.ang) >= 0 ? "r" : "l";
        var ax, ay;
        if (n.kind === "branch" && n.outerR) {
          var rr = n.outerR * view.k;
          ax = cx0 + Math.cos(n.ang) * rr + (side === "r" ? 10 : -10);
          ay = cy0 + Math.sin(n.ang) * rr + 4;
        } else {
          var off = (n.r * view.k) + 16;
          ax = p.x + (side === "r" ? off : -off);
          ay = p.y + 5;
        }
        /* the centre label is wide and sits ON the horizontal axis; a callout
           whose x falls inside its span is displaced clear of its band before
           relaxation, which only separates labels vertically */
        if (rootObstacle && Math.abs(ay - rootObstacle.y) < 30 &&
            Math.abs(ax - rootObstacle.x) < rootObstacle.halfW + 16)
          ay = rootObstacle.y + (ay >= rootObstacle.y ? 30 : -30);
        sides[side].push({ le: le, n: n, x: ax, wantY: ay, mx: p.x, my: p.y,
          /* label ascender + the count line beneath it + breathing room */
          h: n.kind === "region" ? 38 : 30 });
      });

      ["l", "r"].forEach(function (s) {
        var list = sides[s];
        /* the centre label participates as an IMMOVABLE member on both sides */
        if (rootObstacle) {
          list.push({ pinned: true, x: rootObstacle.x, wantY: rootObstacle.y, h: 32,
                      halfW: rootObstacle.halfW });
        }
        list.sort(function (a, b) { return a.wantY - b.wantY; });
        var pin = -1;
        for (var pi = 0; pi < list.length; pi++) if (list[pi].pinned) { pin = pi; break; }
        if (pin < 0) {
          var y = -1e9;
          list.forEach(function (it) { it.y = Math.max(it.wantY, y + it.h); y = it.y; });
        } else {
          list[pin].y = list[pin].wantY;
          var yd = list[pin].y;                       /* downward from the pin */
          for (var i2 = pin + 1; i2 < list.length; i2++) {
            list[i2].y = Math.max(list[i2].wantY, yd + list[i2].h); yd = list[i2].y; }
          var yu = list[pin].y;                       /* upward from the pin */
          for (var i3 = pin - 1; i3 >= 0; i3--) {
            list[i3].y = Math.min(list[i3].wantY, yu - list[i3].h); yu = list[i3].y; }
        }
        list = list.filter(function (it) { return !it.pinned; });
        /* Clamp into the viewport on BOTH edges. Two earlier versions of this
           failed in the same place for different reasons: a one-sided clamp
           pushed the topmost label off the top, and a two-sided clamp then
           TRANSLATED the whole relaxed stack — after the pinned centre label had
           been filtered out of it — which slid labels straight back through the
           band the pin had just cleared. It surfaced only where vertical room ran
           short, so a 1600x1000 viewport looked clean and a 1280x800 one did not.
           The band is therefore honoured as a hard boundary: each zone is
           clamped independently and nothing is ever moved across it. */
        function clampInto(arr, top, bot) {
          if (!arr.length) return;
          arr.sort(function (a, b) { return a.y - b.y; });
          var need = arr.reduce(function (t, it) { return t + it.h; }, 0);
          if (need > (bot - top)) {
            /* genuinely more labels than room in this zone: distribute evenly,
               drop none */
            var step = (bot - top) / arr.length;
            arr.forEach(function (it, i) { it.y = top + step * (i + 0.5); });
            return;
          }
          /* Bounded two-pass separation. A single directional shift is what went
             wrong before: pulling a stack down off the top edge had no upper
             bound, so it pushed the last label straight through the far edge of
             the zone — which is how a label ended up inside the centre-label band
             the zone split existed to protect. Each pass therefore bounds one
             edge, and the feasibility test above guarantees they converge. */
          var prev = top - arr[0].h * 0.4;
          arr.forEach(function (it) { it.y = Math.max(it.y, prev + it.h); prev = it.y; });
          var next = bot;
          for (var i = arr.length - 1; i >= 0; i--) {
            arr[i].y = Math.min(arr[i].y, next); next = arr[i].y - arr[i].h;
          }
        }
        if (list.length) {
          var TOP = 16, BOT = H - 14, band = null;
          if (rootObstacle) {
            /* only labels that can actually reach the centre label in x are
               constrained by it; a callout far out on the flank is not */
            var reach = list.some(function (it) {
              var w = String(it.n.label).length * 6.2;
              var lo = s === "r" ? it.x : it.x - w;
              var hi = s === "r" ? it.x + w : it.x;
              return hi > rootObstacle.x - rootObstacle.halfW &&
                     lo < rootObstacle.x + rootObstacle.halfW;
            });
            if (reach) band = { t: rootObstacle.y - 24, b: rootObstacle.y + 24 };
          }
          if (band && band.t > TOP + 24 && band.b < BOT - 24) {
            clampInto(list.filter(function (it) { return it.y < rootObstacle.y; }), TOP, band.t);
            clampInto(list.filter(function (it) { return it.y >= rootObstacle.y; }), band.b, BOT);
          } else {
            clampInto(list, TOP, BOT);
          }
        }
        list.forEach(function (it) {
          var le = it.le, n = it.n;
          /* Keep the callout inside the panel-safe envelope. Labels live in
             SCREEN space, outside the zoom transform, so the fit helper's band
             reservation — which sizes the FIGURE — does not constrain them, and a
             callout could and did run underneath the legend. Pull the anchor off
             the panel edge first, THEN ellipsize to whatever room is genuinely
             left. An earlier version bailed out when the room was very small,
             which is exactly when it mattered: with 13px of space it did nothing
             and let the whole label run under the panel. */
          le.t.style.display = "";
          le.t.setAttribute("text-anchor", s === "r" ? "start" : "end");
          le.t.removeAttribute("transform");                 // UPRIGHT, always
          le.t.textContent = n.label;
          /* Measure the REAL text, then give it the room it actually needs, up to
             a cap. Pulling the anchor back by a fixed floor truncated readable
             branch names to five characters; sizing the pull-back to the label
             keeps them legible and still never crosses a panel edge. */
          var natural = le.t.getComputedTextLength();
          var fr = root.__FITREPORT || {};
          var lim = s === "r" ? (W - (fr.rightBand || 0) - 8) : ((fr.leftBand || 0) + 8);
          var avail = s === "r" ? lim - it.x : it.x - lim;
          var want = Math.min(natural, 150);
          if (avail < want) {
            it.x += (s === "r" ? -(want - avail) : (want - avail));
            avail = want;
          }
          le.t.setAttribute("x", it.x); le.t.setAttribute("y", it.y);
          if (natural > avail) {
            var txt = n.label;
            while (txt.length > 2 && le.t.getComputedTextLength() > avail) {
              txt = txt.slice(0, -2);
              le.t.textContent = txt.replace(/[\s\/,–—-]+$/, "") + "…";
            }
          }
          if (le.cnt) {
            le.cnt.style.display = "";
            le.cnt.setAttribute("x", it.x);
            le.cnt.setAttribute("y", it.y + (n.kind === "region" ? 15 : 12));
            le.cnt.setAttribute("text-anchor", s === "r" ? "start" : "end");
            /* under a filter the count reports VISIBLE of TOTAL, so a bounded
               section never looks like the whole corpus shrank */
            var vc = n.kind === "region" ? (regionVis[n.id] || 0) : (branchVis[n.id] || 0);
            le.cnt.textContent = filtering()
              ? vc + " / " + n.count + (n.kind === "region" ? " objects" : "")
              : n.count + (n.kind === "region" ? " objects" : "");
          }
          if (le.lead) {
            var mx = it.mx + Math.cos(n.ang) * (n.r * view.k);
            var my = it.my + Math.sin(n.ang) * (n.r * view.k);
            le.lead.style.display = "";
            le.lead.setAttribute("d", "M" + mx + " " + my +
              " L" + (it.x - (s === "r" ? 7 : -7)) + " " + it.y);
          }
        });
      });
    }

    function apply() {
      gRoot.setAttribute("transform",
        "translate(" + view.x + "," + view.y + ") scale(" + view.k + ")");
      var L2 = lodFor(view.k);
      document.getElementById("pct").textContent = Math.round(view.k * 100) + "%";
      document.getElementById("lod").textContent = L2.name;
      placeLabels(L2);
    }

    /* The atlas panel is an OVERLAY on the left. When it is open the fit helper
       reserves its band too, so opening the controls never puts chrome over the
       map. When it is closed the reservation set is exactly v1's. */
    function fitTo(b) {
      var open = document.body.classList.contains("atlas-open");
      var r = root.DIAGRAM_FIT.compute({
        wrap: wrapEl,
        bounds: { minX: b.x, minY: b.y, maxX: b.x + b.w, maxY: b.y + b.h },
        viewport: { width: stage.clientWidth, height: stage.clientHeight },
        clearanceX: 22, clearanceY: 22, gutter: 16, maxScale: 1.2,
        rightSelector: ".inspector, .legend",
        bottomSelector: ".hud, .cfw-caption",
        topSelector: null,
        leftSelector: open ? ".atlas-panel" : null
      });
      view.k = r.scale; view.x = r.tx; view.y = r.ty;
      fitK = r.scale; lastFit = r; root.__FITREPORT = r; apply();
    }
    function fit() { fitTo(filtering() ? visibleBounds() : L.bounds); }

    function zoom(f, cx, cy) {
      var W = stage.clientWidth, H = stage.clientHeight;
      cx = cx === undefined ? W / 2 : cx; cy = cy === undefined ? H / 2 : cy;
      var nk = Math.max(Math.min(fitK, 0.24), Math.min(view.k * f, 14));
      view.x = cx - (cx - view.x) * (nk / view.k);
      view.y = cy - (cy - view.y) * (nk / view.k);
      view.k = nk; apply();
    }

    /* centre one object, at a scale where its own name is legible */
    function centreOn(id, k) {
      var n = byId[id]; if (!n) return false;
      var W = stage.clientWidth, H = stage.clientHeight;
      var nk = Math.max(Math.min(k || 1.35, 14), 0.24);
      view.k = nk;
      /* bias off the reserved right band so the focused object is not under the
         inspector it just populated */
      var fr = root.__FITREPORT || {};
      var cx = (W - (fr.rightBand || 0) + (document.body.classList.contains("atlas-open")
                 ? (fr.leftBand || 0) : 0)) / 2;
      var cy = (H - (fr.bottomBand || 0)) / 2;
      view.x = cx - n.x * nk; view.y = cy - n.y * nk;
      apply(); return true;
    }

    /* frame a whole region or branch — the same map, framed on that grouping */
    function focusGroup(id) {
      var kids = L.nodes.filter(function (n) {
        return n.id === id || n.branch === id || n.region === id;
      });
      if (!kids.length) return false;
      var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      kids.forEach(function (n) {
        x0 = Math.min(x0, n.x - n.r * 2); y0 = Math.min(y0, n.y - n.r * 2);
        x1 = Math.max(x1, n.x + n.r * 2); y1 = Math.max(y1, n.y + n.r * 2);
      });
      var pad = 60;
      fitTo({ x: x0 - pad, y: y0 - pad, w: (x1 - x0) + pad * 2, h: (y1 - y0) + pad * 2 });
      select(id);
      return true;
    }

    var drag = null;
    stage.addEventListener("mousedown", function (e) {
      drag = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
      stage.classList.add("panning");
    });
    window.addEventListener("mousemove", function (e) {
      if (!drag) return;
      view.x = drag.vx + (e.clientX - drag.x); view.y = drag.vy + (e.clientY - drag.y); apply();
    });
    window.addEventListener("mouseup", function () { drag = null; stage.classList.remove("panning"); });
    stage.addEventListener("wheel", function (e) {
      e.preventDefault();
      var rect = stage.getBoundingClientRect();
      zoom(e.deltaY < 0 ? 1.13 : 1 / 1.13, e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: false });
    stage.addEventListener("click", function () { select(null); });
    window.addEventListener("resize", fit);

    /* ---------------- reveal ---------------- */
    var locked = null, sourceOrigin = null;
    function neighbours(id) {
      var s = {}; s[id] = true;
      edgeEls.forEach(function (e) {
        if (e.from === id) s[e.to] = true; else if (e.to === id) s[e.from] = true; });
      return s;
    }
    function paint(id) {
      var near = id ? neighbours(id) : null;
      nodeEls.forEach(function (ne) {
        ne.g.classList.toggle("sel",  !!id && ne.n.id === id);
        ne.g.classList.toggle("near", !!id && ne.n.id !== id && !!near[ne.n.id]);
        /* unrelated material FADES, it is never removed */
        ne.g.classList.toggle("dim",  !!id && !near[ne.n.id] && ne.n.kind === "leaf");
      });
      edgeEls.forEach(function (e) {
        var hot = !!id && (e.from === id || e.to === id);
        if (e.lk.plane === "registered") e.p.classList.toggle("on", !id || hot);
        else e.p.classList.toggle("on", hot);        // recorded: quiet until asked
      });
    }
    function preview(id) { if (sourceOrigin) return; paint(id); inspect(id); }
    function select(id) { sourceOrigin = null; locked = id; paint(id); inspect(id); }

    function authorityBlock(title, val, cls) {
      if (val === null || val === undefined || val === "") return "";
      var h = '<div class="' + cls + '"><span class="lbl">' + esc(title) + '</span>';
      if (typeof val === "string") h += '<span class="val">' + esc(val) + '</span>';
      else if (Array.isArray(val))
        val.forEach(function (v) { h += '<div class="val">' + esc(typeof v === "string" ? v : JSON.stringify(v)) + '</div>'; });
      else for (var k in val) {
        var v = val[k];
        h += '<div class="field"><span class="lbl">' + esc(k.replace(/_/g, " ")) + '</span>' +
             '<span class="val">' + esc(typeof v === "string" ? v : JSON.stringify(v)) + '</span></div>';
      }
      return h + '</div>';
    }

    /* A locator is usually a MIXED string: a citation, a DOI, sometimes two URLs and
       prose between them. It must never be turned into one href. This linkifies only
       the spans that are valid standalone URLs and escapes everything else, so a
       reader can tell a source LINK from a source CITATION.

       A token is a link only if it parses, its host is a real dotted host, and it
       carries no elision. Trailing prose punctuation is left outside the anchor. */
    var HOST_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}(?::\d+)?$/i;
    function linkURL(tok) {
      var m = /^(https?:\/\/[^\s]*?)([.,;:)\]]*)$/.exec(tok);
      if (!m) return null;
      var u = m[1], tail = m[2];
      if (/…|\.\.\./.test(u)) return null;                     // elided, not a route
      var h = /^https?:\/\/([^/?#]*)/i.exec(u);
      if (!h || !HOST_RE.test(h[1])) return null;
      return { url: u, tail: tail };
    }
    function linkify(v) {
      var parts = String(v).split(/(\s+)/), out = "", links = 0;
      for (var i = 0; i < parts.length; i++) {
        var t = parts[i], L = /^https?:\/\//i.test(t) ? linkURL(t) : null;
        if (L) { links++;
          out += '<a class="loc" href="' + esc(L.url) + '" target="_blank" rel="noopener noreferrer">' +
                 esc(L.url) + '</a>' + esc(L.tail); }
        else out += esc(t);
      }
      return { html: out, links: links };
    }
    function locatorField(v) {
      if (v === null || v === undefined || String(v).trim() === "") return "";
      var r = linkify(v);
      return '<div class="field"><span class="lbl">' + (r.links ? "source link" : "citation") +
             '</span><span class="ptr">' + r.html + '</span></div>';
    }

    function field(lbl, v, cls) {
      if (v === null || v === undefined || String(v).trim() === "") return "";
      return '<div class="field"><span class="lbl">' + esc(lbl) + '</span><span class="' +
             (cls || "val") + '">' + esc(v) + '</span></div>';
    }

    /* =====================================================================
       EVIDENCE-OWNER INSPECTOR — every CFW-S-001..479, by exact identifier.
       v1 kept the evidence owners in the payload but gave the reader no route
       to them: it listed the first eight as static text and told them the rest
       were "resolvable by exact ID" while providing no resolver. This is that
       resolver.
       ===================================================================== */
    function inspectSource(id, originId) {
      var o = P.byId[id];
      var box = document.getElementById("insp");
      if (!o || o.class !== "CFW-S") return false;
      sourceOrigin = originId || sourceOrigin || null;
      var h = '<div class="panel-h">CFW-S — evidence owner · inspector plane</div>';
      if (sourceOrigin && P.byId[sourceOrigin]) {
        h += '<button class="backlink" type="button" data-back="' + esc(sourceOrigin) + '">' +
             '&larr; back to ' + esc(String(P.byId[sourceOrigin].label || sourceOrigin).slice(0, 52)) +
             '</button>';
      }
      h += '<div class="name">' + esc(o.work || o.label) + '</div>';
      /* NO SPECTRAL ROLE HERE. Evidence class and verification depth are their own
         axes; a coloured state dot beside them would read as a governed state the
         owner does not have. They stay textual, in the verification block below. */
      h += field("identifier", o.id, "ptr");
      h += field("source type", o.source_type);
      h += field("author", o.author);
      h += field("exact work", o.work);
      h += field("edition / version", o.edition);
      h += field("access", o.access);
      h += field("licence", o.licence);
      h += '<div class="rule"></div><div class="panel-h">verification</div>';
      h += field("verification depth", o.verification_depth);
      h += field("quotation fidelity", o.fidelity);
      h += field("evidence class", o.evidence_class);
      h += field("last verified", o.last_verified);
      h += field("read scope", o.read_scope);
      h += field("strongest", o.strongest);
      if (o.canonical_destination || o.bears_on || o.relation_ids) {
        h += '<div class="rule"></div><div class="panel-h">governed placement</div>';
        h += field("canonical destination", o.canonical_destination);
        h += field("bears on", o.bears_on, "ptr");
        h += field("relation IDs", o.relation_ids, "ptr");
        h += field("canonical row", o.canonical_row_id, "ptr");
      }
      h += '<div class="rule"></div><div class="panel-h">carrier</div>';
      h += field("region", String(o.region || o.owner || "") + (o.section ? "  " + o.section : ""), "ptr");
      h += field("generation", o.generation, "ptr");
      h += locatorField(o.locator);
      if (Array.isArray(o.fields_present) && o.fields_present.length)
        h += field("fields present", o.fields_present.join(" · "));
      /* which primary objects this owner is evidence for */
      var back = [];
      Object.keys(P.evidenceFor).forEach(function (k) {
        if (P.evidenceFor[k].some(function (s) { return s.id === id; })) back.push(k);
      });
      if (back.length) {
        h += '<div class="rule"></div><div class="panel-h">evidence for — ' + back.length + '</div>';
        back.forEach(function (k) {
          h += '<div class="field"><button class="idlink" type="button" data-goto="' + esc(k) + '">' +
               esc(k) + '</button> <span class="val">' +
               esc(String((P.byId[k] || {}).label || "").slice(0, 90)) + '</span></div>';
        });
      }
      h += '<div class="note">This evidence owner sits in the inspector plane by the atlas\u2019s ' +
           'declared plane assignment. It is searchable and resolvable by exact identifier, and ' +
           'it is never promoted into the graph.</div>';
      box.innerHTML = h;
      box.style.removeProperty("--st");          // neutral chrome, no governed state
      box.scrollTop = 0;
      wireInspector();
      announce("Evidence owner " + o.id + ", " + String(o.work || o.label).slice(0, 80));
      return true;
    }

    function wireInspector() {
      var box = document.getElementById("insp");
      box.querySelectorAll("[data-goto]").forEach(function (b) {
        b.addEventListener("click", function (ev) {
          ev.stopPropagation();
          var t = b.getAttribute("data-goto");
          if (P.byId[t] && P.byId[t].class === "CFW-S") inspectSource(t, locked);
          else { select(t); centreOn(t, Math.max(view.k, 1.35)); }
        });
      });
      box.querySelectorAll("[data-src]").forEach(function (b) {
        b.addEventListener("click", function (ev) {
          ev.stopPropagation(); inspectSource(b.getAttribute("data-src"), locked);
        });
      });
      box.querySelectorAll("[data-back]").forEach(function (b) {
        b.addEventListener("click", function (ev) {
          ev.stopPropagation();
          var t = b.getAttribute("data-back");
          sourceOrigin = null; select(t);
        });
      });
      var more = box.querySelector("[data-showall]");
      if (more) more.addEventListener("click", function (ev) {
        ev.stopPropagation(); evShowAll = true; inspect(locked);
      });
    }

    var evShowAll = false;
    var EV_HEAD = 8;

    function inspect(id) {
      var box = document.getElementById("insp");
      if (id !== locked) evShowAll = false;
      if (!id || !byId[id]) {
        box.innerHTML = '<div class="panel-h">inspector</div>' +
          '<div class="idle">Hover a concept to preview it. Click to lock. Evidence owners, ' +
          'quotation fidelity and authority detail resolve here — never in hue, and never ' +
          'in position.<br><br>Use <b>atlas</b> in the top bar to search all 1,027 objects by ' +
          'name or exact identifier, or to bound the map to a section.</div>';
        box.style.removeProperty("--st"); return;
      }
      var n = byId[id];
      if (n.kind !== "leaf") {
        var vc = n.kind === "region" ? (regionVis[n.id] || 0) : (branchVis[n.id] || 0);
        box.innerHTML = '<div class="panel-h">' + esc(n.kind) + '</div>' +
          '<div class="name">' + esc(n.label) + '</div>' +
          '<div class="field"><span class="lbl">objects under it</span><span class="val">' +
          (filtering() ? vc + " in this section, of " + n.count : n.count) + '</span></div>' +
          (n.src ? '<div class="field"><span class="lbl">grouped by</span><span class="ptr">' +
                   esc(n.src) + '</span></div>' : "") +
          (n.kind === "branch" && n.region ?
             '<div class="field"><span class="lbl">region</span><span class="ptr">' +
             esc(n.region.label) + '</span></div>' : "");
        box.style.setProperty("--st", "var(--state-neutral)");
        announce(n.kind + " " + n.label + ", " + n.count + " objects");
        return;
      }
      var o = n.obj, st = n.state, sd = null;
      P.states.forEach(function (s) { if (s.role === st) sd = s; });
      var ev = P.evidenceFor[o.id] || [];
      var lks = P.links.filter(function (l) { return l.from === o.id || l.to === o.id; });
      var h = '<div class="panel-h">' + esc(o.class) + ' — ' + esc(CLASS_NAME[o.class] || "") + '</div>';
      h += '<div class="name">' + esc(o.label) + '</div>';
      h += '<div class="state-row"><span class="dot"></span><span class="state-name">' +
           esc(sd ? sd.label : st) + '</span><span class="state-mean">' +
           esc(sd ? sd.meaning : "") + '</span></div>';
      if (o.ask_ruled || o.not_ask_ruled || o.authority_note) {
        h += '<div class="rule"></div><div class="panel-h">authority</div>';
        h += authorityBlock("ASK ruled", o.ask_ruled, "ruled");
        h += authorityBlock("NOT ASK ruled", o.not_ask_ruled, "notruled");
        if (o.authority_note)
          h += field("authority note", o.authority_note);
      }
      h += field("identifier", o.id, "ptr");
      h += field("region", String(o.region || o.owner || "") + (o.section ? "  " + o.section : ""), "ptr");
      h += field("node type", o.node_type);
      h += field("field domain", o.field_domain);
      h += field("status", o.status);
      if (o.disposition && String(o.disposition).toUpperCase() !== String(sd ? sd.meaning : "").toUpperCase())
        h += field("disposition", o.disposition);
      /* the question IS the name for a CFW-Q; repeating it verbatim pushed the
         authority block below the panel's scroll boundary, where a reader saw an
         empty "ASK ruled" heading */
      if (o.question && o.question !== o.label) h += field("question", o.question);
      if (o.claim_text && o.claim_text !== o.label) h += field("claim", o.claim_text);
      h += field("logical form", o.logical_form);
      h += field("schema depth", o.schema, "ptr");
      h += field("source basis", o.source_basis);

      if (lks.length) {
        h += '<div class="rule"></div><div class="panel-h">typed relations — ' + lks.length + '</div>';
        lks.forEach(function (l) {
          var other = l.from === o.id ? l.to : l.from;
          var outside = filtering() && l.plane !== "unedged" && !visible[other];
          h += '<div class="field"><span class="plane-tag">' + esc(l.plane) + '</span> ' +
               '<span class="ptr">' + esc(l.type) + ' &rarr; </span>' +
               '<button class="idlink" type="button" data-goto="' + esc(other) + '">' +
               esc(other) + '</button>' +
               (l.plane === "unedged"
                 ? '<span class="lbl">declared non-linkage — deliberately not drawn</span>' : "") +
               (outside ? '<span class="lbl">outside this section — the relation is unchanged</span>' : "") +
               '</div>';
        });
      }
      if (ev.length) {
        var shown = evShowAll ? ev : ev.slice(0, EV_HEAD);
        h += '<div class="rule"></div><div class="panel-h">evidence owners — ' + ev.length + '</div>';
        shown.forEach(function (s) {
          h += '<div class="field"><button class="idlink" type="button" data-src="' + esc(s.id) + '">' +
               esc(s.id) + '</button> <span class="val">' +
               esc(String(s.label || "").slice(0, 120)) + '</span>' +
               (s.fidelity ? '<span class="lbl">fidelity ' + esc(s.fidelity) + '</span>' : "") + '</div>';
        });
        if (ev.length > shown.length)
          h += '<button class="showall" type="button" data-showall="1">show all ' + ev.length +
               ' evidence owners</button>';
      }
      box.innerHTML = h;
      box.style.setProperty("--st", "var(--state-" + st + ")");
      box.scrollTop = 0;
      wireInspector();
      announce(o.class + " " + o.id + ", " + String(o.label).slice(0, 90) +
               (ev.length ? ", " + ev.length + " evidence owners" : ""));
    }

    /* ---------------- legend ---------------- */
    (function legend() {
      var g = document.getElementById("legend");
      var h = '<div class="panel-h">colour = governed state</div>';
      P.states.forEach(function (s) {
        h += '<div class="row"><span class="sw" style="background:var(--state-' + s.role + ')"></span>' +
             '<span class="txt"><span class="lbl">' + esc(s.label) + '</span>' +
             '<span class="sub">' + esc(s.meaning) + '</span></span></div>';
      });
      h += '<div class="grp panel-h">line = relationship plane</div>';
      h += '<div class="row"><span class="kline registered"></span><span class="txt">' +
           '<span class="lbl">registered relation</span>' +
           '<span class="sub">CFW-R, canonical, directed</span></span></div>';
      h += '<div class="row"><span class="kline recorded"></span><span class="txt">' +
           '<span class="lbl">recorded reference</span>' +
           '<span class="sub">a carrier field — resolves on selection</span></span></div>';
      h += '<div class="row"><span class="kline" style="border-top:1px solid transparent"></span>' +
           '<span class="txt"><span class="lbl">unedged context</span>' +
           '<span class="sub">a declared NON-linkage — never drawn; in the inspector</span>' +
           '</span></div>';
      h += '<div class="grp panel-h">shape = object class</div>' +
           '<div class="row"><span class="txt"><span class="sub">circle node &middot; square claim ' +
           'and frame families &middot; diamond ASK articulation &middot; hexagon question ' +
           '&middot; triangle cross-cutting &middot; ring topology</span></span></div>';
      h += '<div class="bound"><b>Edges are the only relation encoding.</b> ' +
           'Distance, width, position and adjacency claim nothing — see the caption.</div>';
      g.innerHTML = h;
    })();

    /* =====================================================================
       ATLAS CONTROL — one compact overlay, CLOSED BY DEFAULT.
       The mind map is the front door; this is a drawer behind one button,
       not a restored dashboard column.
       ===================================================================== */
    var panel = document.getElementById("atlas");
    var btn   = document.getElementById("atlasbtn");
    var qInp, resBox;

    (function buildPanel() {
      var h = '<div class="ap-head"><span class="panel-h">atlas</span>' +
              '<button class="ap-close" id="atlasclose" type="button" aria-label="close atlas controls">&times;</button></div>';
      h += '<label class="ap-lbl" for="q">search — name or exact identifier</label>';
      h += '<input id="q" class="ap-q" type="search" autocomplete="off" spellcheck="false" ' +
           'placeholder="recourse · CFW-Q-001 · CFW-S-479" role="combobox" aria-expanded="false" ' +
           'aria-controls="results" aria-autocomplete="list">';
      h += '<div id="results" class="ap-res" role="listbox" aria-label="search results"></div>';
      h += '<div class="ap-census" id="census"></div>';
      h += '<div class="ap-note">A filter bounds the map to a section and always reports its ' +
           'census. It is not level of detail, and it never changes a governed relation.</div>';

      DIMS.forEach(function (d) {
        h += '<details class="ap-dim" data-dim="' + esc(d.key) + '">' +
             '<summary><span class="ap-dt">' + esc(d.title) + '</span>' +
             '<span class="ap-fam">' + (d.family === "relation" ? "relation view" : "projection") +
             '</span></summary>';
        h += '<div class="ap-dn">' + esc(d.note) + '</div>';
        d.options.forEach(function (o) {
          var oid = "f-" + d.key + "-" + String(o.v).replace(/[^a-zA-Z0-9]+/g, "_");
          h += '<label class="ap-opt' + (o.locked ? " locked" : "") + '" for="' + oid + '">' +
               '<input type="checkbox" id="' + oid + '" data-dim="' + esc(d.key) + '" ' +
               'value="' + esc(o.v) + '"' + (o.locked ? " disabled" : "") + '>' +
               (o.swatch ? '<span class="sw" style="background:var(--state-' + esc(o.swatch) + ')"></span>' : "") +
               '<span class="ap-ol">' + esc(o.label) + '</span>' +
               '<span class="ap-on">' + o.n + '</span></label>';
        });
        h += '</details>';
      });

      NOTOFFERED.forEach(function (d) {
        h += '<div class="ap-off"><span class="ap-dt">' + esc(d.title) +
             '</span><span class="ap-offtag">NOT STRUCTURED / NOT OFFERED</span>' +
             '<div class="ap-dn">' + esc(d.reason) + '</div></div>';
      });

      h += '<button class="ap-reset" id="reset" type="button">reset to complete map</button>';
      panel.innerHTML = h;
      qInp = document.getElementById("q");
      resBox = document.getElementById("results");
    })();

    function openPanel(on) {
      document.body.classList.toggle("atlas-open", on);
      panel.setAttribute("aria-hidden", on ? "false" : "true");
      btn.setAttribute("aria-expanded", on ? "true" : "false");
      fit();
      if (on) qInp.focus();
    }
    btn.addEventListener("click", function () {
      openPanel(!document.body.classList.contains("atlas-open"));
    });
    document.getElementById("atlasclose").addEventListener("click", function () {
      openPanel(false); btn.focus();
    });

    /* ---- search ---- */
    var results = [], activeRes = -1;
    function kindTag(k) {
      return k === "source" ? "CFW-S" : k === "region" ? "region" : k === "branch" ? "branch" : "object";
    }
    function renderResults() {
      if (!results.length) {
        resBox.innerHTML = qInp.value.trim()
          ? '<div class="ap-none">no match in 1,027 objects, 5 regions or 36 branches</div>' : "";
        qInp.setAttribute("aria-expanded", "false");
        return;
      }
      var h = "";
      results.forEach(function (e, i) {
        h += '<button class="ap-r" type="button" role="option" aria-selected="false" ' +
             'data-i="' + i + '" data-key="' + esc(e.key) + '" data-kind="' + esc(e.kind) + '">' +
             '<span class="ap-rk">' + esc(kindTag(e.kind)) + '</span>' +
             '<span class="ap-rl">' + esc(String(e.label).slice(0, 88)) + '</span>' +
             '<span class="ap-rs">' + esc(e.kind === "object" || e.kind === "source"
               ? e.key : e.count + " objects") + '</span></button>';
      });
      resBox.innerHTML = h;
      qInp.setAttribute("aria-expanded", "true");
      resBox.querySelectorAll(".ap-r").forEach(function (b) {
        b.addEventListener("click", function () { activate(+b.getAttribute("data-i")); });
      });
    }
    function runSearch() {
      results = C.search(index, qInp.value, 40);
      activeRes = -1;
      renderResults();
      announce(results.length + " result" + (results.length === 1 ? "" : "s"));
    }
    function activate(i) {
      var e = results[i]; if (!e) return;
      if (e.kind === "source") {
        inspectSource(e.key, null);
      } else if (e.kind === "region" || e.kind === "branch") {
        focusGroup(e.key);
        announce("focused " + e.label + ", " + e.count + " objects");
      } else {
        if (!visible[e.key]) {
          announce(e.key + " is outside the current section — resetting to the complete map");
          resetFilters(false);
        }
        select(e.key);
        centreOn(e.key, Math.max(view.k, 1.35));
      }
    }
    qInp.addEventListener("input", runSearch);
    qInp.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowDown" && results.length) {
        ev.preventDefault(); focusRes(0);
      } else if (ev.key === "Enter" && results.length) {
        ev.preventDefault(); activate(0);
      }
    });
    function focusRes(i) {
      var bs = resBox.querySelectorAll(".ap-r");
      if (!bs.length) return;
      i = Math.max(0, Math.min(i, bs.length - 1));
      bs.forEach(function (b, j) { b.setAttribute("aria-selected", j === i ? "true" : "false"); });
      activeRes = i; bs[i].focus();
    }
    resBox.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowDown") { ev.preventDefault(); focusRes(activeRes + 1); }
      else if (ev.key === "ArrowUp") {
        ev.preventDefault();
        if (activeRes <= 0) { qInp.focus(); activeRes = -1; } else focusRes(activeRes - 1);
      }
    });

    /* ---- filters ---- */
    function readSelection() {
      sel = C.emptySelection();
      panel.querySelectorAll('input[type="checkbox"][data-dim]').forEach(function (cb) {
        if (cb.checked && !cb.disabled) sel[cb.getAttribute("data-dim")].push(cb.value);
      });
    }
    panel.addEventListener("change", function (ev) {
      if (!ev.target.matches('input[type="checkbox"][data-dim]')) return;
      readSelection();
      applySection(true);
      announce(censusText());
    });
    function resetFilters(refit) {
      panel.querySelectorAll('input[type="checkbox"][data-dim]').forEach(function (cb) { cb.checked = false; });
      sel = C.emptySelection();
      applySection(refit !== false);
      announce("reset to the complete map, " + P.counts.primary + " objects");
    }
    document.getElementById("reset").addEventListener("click", function () { resetFilters(true); });

    /* ---- keyboard: Escape peels back one layer at a time ---- */
    document.addEventListener("keydown", function (ev) {
      if (ev.key !== "Escape") return;
      if (qInp.value.trim()) { qInp.value = ""; runSearch(); qInp.focus(); announce("search cleared"); }
      else if (sourceOrigin || locked) { select(null); announce("selection cleared"); }
      else if (filtering()) { resetFilters(true); }
      else if (document.body.classList.contains("atlas-open")) { openPanel(false); btn.focus(); }
    });

    document.getElementById("zin").addEventListener("click", function () { zoom(1.3); });
    document.getElementById("zout").addEventListener("click", function () { zoom(1 / 1.3); });
    document.getElementById("zfit").addEventListener("click", fit);

    inspect(null);
    computeVisible();
    paintVisibility();
    updateCensus();
    fit();

    root.CFW_VIEW = {
      fit: fit, select: select, view: view, layout: L, projection: P,
      lodFor: lodFor, labels: labelEls, edges: edgeEls, nodes: nodeEls,
      /* exposed so the validation harness exercises the SAME code the page runs */
      controls: C, index: index, dims: DIMS, notOffered: NOTOFFERED,
      search: function (q, n) { return C.search(index, q, n || 40); },
      searchUI: function (q) { qInp.value = q; runSearch(); return results; },
      activate: activate,
      inspectSource: inspectSource,
      centreOn: centreOn, focusGroup: focusGroup,
      openPanel: openPanel,
      setFilter: function (dim, vals) {
        panel.querySelectorAll('input[data-dim="' + dim + '"]').forEach(function (cb) {
          if (!cb.disabled) cb.checked = vals.indexOf(cb.value) >= 0;
        });
        readSelection(); applySection(true); return census();
      },
      reset: function () { resetFilters(true); return census(); },
      selection: function () { return JSON.parse(JSON.stringify(sel)); },
      filtering: filtering,
      census: census,
      visibleIds: function () { return Object.keys(visible); },
      showAllEvidence: function () { evShowAll = true; inspect(locked); }
    };
    function census() {
      return { visibleLeaves: visLeaf, totalPrimary: P.counts.primary,
               visibleEdges: visEdge, totalEdgesDrawable: edgeEls.length,
               activeFilters: C.activeCount(sel), text: censusText(),
               lod: lodFor(view.k).name, k: view.k };
    }
  }

  root.CFWAtlas = { mount: mount, initTheme: initTheme, layout: layout, LOD: LOD,
                    CLASS_SHAPE: CLASS_SHAPE, CLASS_NAME: CLASS_NAME };
})(typeof window !== "undefined" ? window : globalThis);
