/* cfw-export-png.js — CFW-LOCAL PNG export adapter.

   WHY THIS IS LOCAL AND NOT THE DESIGN-SYSTEM EXPORTER. The shared
   interactive-spine exporter cannot serve this artifact: it measures a single
   coordinate space with getBBox(), and this atlas draws its figure in WORLD
   space inside a zoom transform while drawing its labels in SCREEN space
   outside it. Its neutralize pass would also delete this map's payload relation
   graph, and its label handling would drop the layer that carries the
   diagram's semantics. Vendoring it would therefore produce a wrong picture,
   so the adapter is written here, against this engine's own public surface.

   WHAT IT MAY TOUCH. window.CFW_VIEW only — the runtime surface cfw-atlas.js
   already publishes for its validation harness. This file adds NO engine
   behaviour, mutates NO application state, and holds no reference into any
   engine closure. The atlas cannot tell that an export happened: view, filter,
   selection, level of detail and the live label layer are all left exactly as
   the reader had them.

   DETERMINISM CONTRACT. One page state produces one EXPORT MODEL. The export
   always renders the FULL atlas at its own fit, in its own coordinate system,
   with the page's DEFAULT edge policy — never the reader's pan, zoom, level of
   detail, filter or selection. The only live input is the ACTIVE THEME, which
   is intentional: a reader on the dark surface expects a dark export.

   WHAT THAT DOES AND DOES NOT COVER. Deterministic: the neutral export model,
   the serialized SVG, the plate dimensions, the label set and its placement,
   the relation policy and the resolved theme. One page state serializes to one
   byte-identical SVG. PNG byte identity is NOT claimed — it is engine- and
   lifecycle-bounded. A browser may rasterize that identical SVG into pixel-near
   variants: WebKit resolves the embedded @font-face metrics differently before
   and after those faces finish loading, which leaves glyph advances, wrapping
   and placement untouched and moves a handful of antialiased subpixels.
   Compare two exports by their SVG bytes, or by pixels with a tolerance —
   a PNG hash is not a determinism test.

   LABELS ARE REGENERATED, NEVER CLONED. The live label layer is positioned in
   screen space for the reader's viewport, so cloning it would bake that
   viewport into the file. The placement pass below is a port of the engine's
   own algorithm, run against the export's virtual viewport. It is the one
   deliberate duplication in this file, and it is why the export reads like the
   map rather than like a screenshot of one window size.

   FONTS FAIL CLOSED. Rasterizing an SVG through a canvas does not carry the
   document's webfonts, so both faces are fetched and embedded as data URIs. If
   either fetch fails the export ABORTS. A silently substituted system font
   would change every measured label width and every de-collision decision, so
   a wrong-typeface PNG is a worse outcome than no PNG.                       */

(function (root) {
  "use strict";

  var NS  = "http://www.w3.org/2000/svg";
  var DOC = root.document;

  /* ---- the page export is a fixed plate; the diagram export is not ------- */
  var PAGE_W = 3840, PAGE_H = 2880;
  var DEVICE_SCALE = 2;                       /* virtual 1920x1440, drawn at 2x */
  /* The diagram plate is bounded on its LONG edge only. There is deliberately no
     minimum short edge: clamping one would change the ratio between the two, and
     "natural aspect" would quietly stop being true on any layout elongated enough
     to trigger it. The current bounds are 0.9648, nowhere near that, which is
     exactly why a clamp here would have sat unexercised and wrong. */
  var DIAGRAM_LONG_EDGE = 3840;

  /* Chrome bands for the page plate, in VIRTUAL px. The plate carries the route's
     real chrome — mark, title block, stamp, canonical route, the full caption and
     the full legend — so the figure is fitted into what remains, not the reverse. */
  var HEAD_H = 116, FOOT_H = 244, SIDE_PAD = 64;
  var LEGEND_W = 330, LEGEND_GAP = 44;

  /* Callouts are NOT inside the figure's bounds: a region or branch label is
     pushed out past its own concept fan, then ellipsized to whatever room is
     left. The live page gets that room from the fit helper's panel-band
     reservation; an export has no panels to reserve against, so the figure is
     fitted inside this gutter and the labels live in it.

     WHAT THIS DOES AND DOES NOT DO. It does NOT keep labels on the plate — the
     ellipsizer does that, and a control run with the gutter at zero still
     placed every label inside the drawing area. What the gutter buys is
     LEGIBILITY, and the trade is measurable:

       diagram plate   gutter 190 -> fit 0.796,  5 of 41 callouts ellipsized
                       gutter   0 -> fit 0.960,  8 of 41 callouts ellipsized
       page plate      no effect either way — that fit is height-bound, so the
                       horizontal gutter never binds

     Three more branch names kept whole, against 17% of figure scale on a plate
     already 3,705px wide. The names are worth more than the scale. */
  var LABEL_GUTTER_X = 190, LABEL_GUTTER_Y = 40;

  /* The export's declared level of detail. FIXED, and deliberately not read
     from the reader's zoom — a plate is not a screenshot of one moment.

     It is the engine's own LOD[1], named as the engine names it: every region
     and EVERY branch, no concept labels, no identifiers. The level above it was
     built and measured before being rejected. 548 concept labels sit on a leaf
     ring roughly 2,800 virtual px in circumference — about five px of arc each —
     and the engine does not de-collide leaf labels, because on the live page
     they appear only once the reader has zoomed past them. At any plate size
     this format allows they overlap into an unreadable band, so `concepts`
     would have made the export worse, not richer. Branch callouts ARE
     de-collided, and 36 of them at h=30-38 fit the plate's vertical run. */
  var EXPORT_LOD = { name: "branches", leafLabels: false, ids: false, branchMin: 0 };

  /* EXPORT-ONLY FAMILY NAMES. The export never renders through the document's own
     `Inter` / `JetBrains Mono` faces, and that is the whole point.

     v4 embedded the right bytes under the page's own family names and then
     measured against whatever the DOCUMENT had resolved those names to. On a
     fresh page that is the real face, so ordinary exports were correct. After a
     font outage the document's faces are missing, the names fall back to
     ui-sans-serif, and a retry measured and rasterized with FALLBACK METRICS —
     producing a downloadable file that differed from the ordinary output:

       Chromium   fresh probe 150.16 / 6,131,477 B   retry 140.47 / 6,134,263 B
       WebKit     fresh probe 153.29 / 10,315,426 B  retry 143.19 / 10,320,614 B

     A correctly reported failure became a silently wrong success. Under distinct
     names nothing can fall back to a page face, because no page rule mentions
     them; the face is either the loaded export face or the export aborts. */
  var FONT_FILES = [
    { family: "Inter",          exportFamily: "CFWExport Sans", url: "/fonts/InterVariable.woff2" },
    { family: "JetBrains Mono", exportFamily: "CFWExport Mono", url: "/fonts/JetBrainsMono.woff2" }
  ];

  var TOKENS = ["--fg-1", "--fg-2", "--fg-3", "--bg-from", "--bg-to",
                "--state-earned", "--state-structural", "--state-partial",
                "--state-proposed", "--state-deflated", "--state-held",
                "--state-external", "--state-neutral"];

  function el(n, a) {
    var e = DOC.createElementNS(NS, n);
    if (a) for (var k in a) if (a[k] !== null && a[k] !== undefined) e.setAttribute(k, a[k]);
    return e;
  }

  /* ---------------------------------------------------------------- tokens */
  /* Custom properties are substituted at computed-value time, so this reads
     the ACTIVE theme's resolved colours. A value that still contains var() has
     not resolved and is reported rather than written into the file. */
  function readTokens() {
    var cs = root.getComputedStyle(DOC.documentElement), out = {}, bad = [];
    TOKENS.forEach(function (t) {
      var v = String(cs.getPropertyValue(t) || "").trim();
      if (!v || v.indexOf("var(") >= 0) bad.push(t);
      out[t] = v;
    });
    if (bad.length) throw new Error("unresolved design tokens: " + bad.join(", "));
    return out;
  }

  function isDark() {
    var t = DOC.documentElement.getAttribute("data-theme");
    if (t === "dark") return true;
    if (t === "light") return false;
    return !!(root.matchMedia && root.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  /* ----------------------------------------------------------------- fonts */
  var fontCache = null;
  function loadFonts() {
    if (fontCache) return fontCache;
    fontCache = Promise.all(FONT_FILES.map(function (f) {
      return fetch(f.url).then(function (r) {
        if (!r.ok) throw new Error(f.url + " -> HTTP " + r.status);
        return r.arrayBuffer();
      }).then(function (buf) {
        var bytes = new Uint8Array(buf), s = "", CH = 0x8000;
        for (var i = 0; i < bytes.length; i += CH)
          s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
        /* the raw buffer is retained: the SAME bytes are used to construct the
           FontFace that measurement uses AND to serialize the @font-face that
           rasterization uses, so the two cannot diverge */
        return { family: f.family, exportFamily: f.exportFamily,
                 b64: root.btoa(s), bytes: bytes.length, buffer: buf };
      });
    })).catch(function (e) {
      fontCache = null;                         /* a failure must not be cached */
      throw new Error("font embedding failed, export aborted: " + e.message);
    });
    return fontCache;
  }

  function fontFaceCSS(faces) {
    return faces.map(function (f) {
      return "@font-face{font-family:'" + f.exportFamily + "';" +
             "src:url(data:font/woff2;base64," + f.b64 + ") format('woff2');" +
             "font-weight:100 900;font-style:normal;font-display:block}";
    }).join("\n");
  }

  /* ------------------------------------------------- export face readiness */
  /* Registers the export faces from the ALREADY FETCHED BYTES and proves they
     are usable before a single character is measured. Returns a disposer that
     must run on every exit path — the document's font set is shared, and the
     export has no business leaving entries in it.

     Readiness is established two ways, because neither alone is sufficient:
       1. FontFace.load() resolving, and document.fonts.check() reporting the
          family available — the standard gate;
       2. A POSITIVE CONTROL: the same string measured under the export family
          must differ from the same string measured under a deliberately
          nonexistent family. If they are equal, the export family is NOT being
          applied and the first check passed on a fallback. That is exactly the
          v4 condition, and it is the one that shipped a wrong file. */
  function registerExportFaces(faces, host) {
    if (!root.FontFace || !DOC.fonts || !DOC.fonts.add)
      return Promise.reject(new Error("FontFace API unavailable; cannot prove export font readiness"));
    var added = [];
    function dispose() {
      added.forEach(function (ff) { try { DOC.fonts.delete(ff); } catch (e) {} });
      added.length = 0;
    }
    return Promise.all(faces.map(function (f) {
      var ff = new root.FontFace(f.exportFamily, f.buffer,
                                 { weight: "100 900", style: "normal" });
      return ff.load().then(function (loaded) {
        DOC.fonts.add(loaded); added.push(loaded); return loaded;
      });
    })).then(function () {
      var bad = faces.filter(function (f) {
        return !DOC.fonts.check('16px "' + f.exportFamily + '"');
      });
      if (bad.length) throw new Error("export font not usable after load: " +
        bad.map(function (f) { return f.exportFamily; }).join(", "));
      return dispose;
    }).catch(function (e) { dispose(); throw e; });
  }

  /* The positive control described above. Runs inside the mounted export tree. */
  function assertFacesApplied(svg, faces) {
    var probe = el("text", { x: -9999, y: -9999 });
    svg.appendChild(probe);
    probe.textContent = "measurement probe";
    var report = [];
    try {
      faces.forEach(function (f) {
        probe.setAttribute("style", 'font-size:16px;font-family:"' + f.exportFamily + '"');
        var withFace = probe.getComputedTextLength();
        probe.setAttribute("style", 'font-size:16px;font-family:"CFWExportNotAFamily-' +
                                     f.exportFamily.replace(/\W/g, "") + '"');
        var withoutFace = probe.getComputedTextLength();
        if (!(withFace > 0))
          throw new Error("export face " + f.exportFamily + " measured zero width");
        if (Math.abs(withFace - withoutFace) < 0.01)
          throw new Error("export face " + f.exportFamily +
            " is NOT being applied — it measures identically to a nonexistent family (" +
            withFace.toFixed(2) + "), so text would rasterize with fallback metrics");
        report.push({ family: f.exportFamily, withFace: +withFace.toFixed(2),
                      fallback: +withoutFace.toFixed(2) });
      });
    } finally { svg.removeChild(probe); }
    return report;
  }

  /* ------------------------------------------------------------ export fit */
  /* Computed here rather than through DIAGRAM_FIT.compute, which reserves
     bands by reading LIVE panel rectangles. The export has no panels, and a
     fit that consults the live DOM would not be deterministic. */
  function fitBounds(b, vw, vh, padX, padY) {
    var k = Math.min((vw - padX * 2) / b.w, (vh - padY * 2) / b.h);
    return { k: k,
             x: (vw - b.w * k) / 2 - b.x * k,
             y: (vh - b.h * k) / 2 - b.y * k };
  }

  /* ------------------------------------------------- world layer, rebuilt */
  /* The spine / edge / node groups live in WORLD coordinates inside the zoom
     transform, so their geometry is viewport-independent and safe to carry
     over. What is NOT carried over is live STATE: selection, hover proximity,
     filter dimming and sectional hiding are stripped, and edge visibility is
     reset to the artifact's neutral default.

     THE NEUTRAL RELATION POLICY, stated exactly, because "not drawn" and
     "not present" are different claims and only one of them is true here:

       registered   VISIBLE — the eight canonical relations the live artifact
                    draws at rest
       recorded     RETAINED IN THE EXPORTED SVG, HIDDEN AT REST — present in
                    the model with their class and geometry, painted only when
                    the reader activates them, exactly as on the page
       unedged      OMITTED — never rendered, on the page or here. An unedged
                    declaration RECORDS A DECLARED NON-LINKAGE, so drawing a
                    line would assert the relation the record denies

     Recorded relations are therefore neither missing, nor emitted visibly, nor
     deleted. Exporting them visibly would invent a relation view the artifact
     does not have; dropping them from the SVG would lose data. The counts are
     reported per export so the distinction cannot be misread either way. */
  function worldLayer() {
    var stage = DOC.getElementById("stage");
    var live  = stage && stage.querySelector("svg");
    if (!live) throw new Error("atlas svg not found");
    var gRoot = live.querySelector("g");
    if (!gRoot) throw new Error("atlas world group not found");

    var g = gRoot.cloneNode(true);
    g.removeAttribute("transform");

    Array.prototype.forEach.call(g.querySelectorAll(".node, .spine, .leader"), function (n) {
      n.classList.remove("dim", "sel", "near", "out");
      n.style.removeProperty("display");
    });
    var counts = { registeredVisible: 0, recordedRetainedHidden: 0, otherEdges: 0 };
    Array.prototype.forEach.call(g.querySelectorAll(".edge"), function (p) {
      p.classList.remove("out", "dim");
      p.style.removeProperty("display");
      if (p.classList.contains("registered")) { p.classList.add("on"); counts.registeredVisible++; }
      else if (p.classList.contains("recorded")) { p.classList.remove("on"); counts.recordedRetainedHidden++; }
      else { p.classList.remove("on"); counts.otherEdges++; }
    });
    return { g: g, counts: counts };
  }

  /* ------------------------------------------------------ label placement */
  /* A port of the engine's screen-space placement, run against the export's
     VIRTUAL viewport. Same numbers, same relaxation, same clamping, same
     ellipsization — the only difference is which viewport it is solving for.
     Kept structurally parallel to cfw-atlas.js placeLabels() on purpose: when
     that changes, the diff should be readable against this. */
  function buildLabels(V, view, env, host) {
    var gLead  = el("g"), gLabel = el("g");
    host.appendChild(gLead); host.appendChild(gLabel);

    function project(n) { return { x: n.x * view.k + view.x, y: n.y * view.k + view.y }; }
    var sides = { l: [], r: [] }, rootObstacle = null;
    var cx0 = view.x, cy0 = view.y;
    var made = [];

    V.labels.forEach(function (le) {
      var n = le.n, show;
      if (n.kind === "leaf")        show = EXPORT_LOD.leafLabels;
      else if (n.kind === "branch") show = (n.count || 0) >= (EXPORT_LOD.branchMin || 0);
      else show = true;
      if (!show) return;

      var t = el("text", { "class": (n.kind === "root" ? "lbl-root"
                                   : n.kind === "region" ? "lbl-region"
                                   : n.kind === "branch" ? "lbl-branch" : "lbl-leaf")
                                   + " lbl-halo" });
      gLabel.appendChild(t);
      var rec = { n: n, t: t, cnt: null, idl: null, lead: null };
      made.push(rec);

      var p = project(n);
      if (n.kind === "root") {
        var ry = p.y + n.r * view.k + 30;
        t.setAttribute("x", p.x); t.setAttribute("y", ry);
        t.setAttribute("text-anchor", "middle"); t.textContent = n.label;
        rootObstacle = { y: ry, halfW: n.label.length * 6.0 + 14, x: p.x };
        return;
      }
      if (n.kind === "leaf") {
        var left = Math.cos(n.ang) < 0, deg = n.ang * 180 / Math.PI;
        var lx = p.x + (left ? -9 : 9), ly = p.y + 3.5;
        t.setAttribute("x", lx); t.setAttribute("y", ly);
        t.setAttribute("text-anchor", left ? "end" : "start");
        t.setAttribute("transform", "rotate(" + (left ? deg + 180 : deg) + " " + lx + " " + ly + ")");
        t.textContent = n.label;
        if (EXPORT_LOD.ids) {
          var idl = el("text", { "class": "lbl-id lbl-halo" });
          gLabel.appendChild(idl); rec.idl = idl;
          idl.setAttribute("x", lx); idl.setAttribute("y", ly + 11);
          idl.setAttribute("text-anchor", left ? "end" : "start");
          idl.setAttribute("transform", "rotate(" + (left ? deg + 180 : deg) + " " + lx + " " + (ly + 11) + ")");
          idl.textContent = n.obj ? n.obj.id : n.id;
        }
        return;
      }

      var cnt = el("text", { "class": "lbl-count lbl-halo" });
      gLabel.appendChild(cnt); rec.cnt = cnt;
      var lead = el("path", { "class": "leader" });
      gLead.appendChild(lead); rec.lead = lead;

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
      if (rootObstacle && Math.abs(ay - rootObstacle.y) < 30 &&
          Math.abs(ax - rootObstacle.x) < rootObstacle.halfW + 16)
        ay = rootObstacle.y + (ay >= rootObstacle.y ? 30 : -30);
      sides[side].push({ rec: rec, n: n, x: ax, wantY: ay, mx: p.x, my: p.y,
                         h: n.kind === "region" ? 38 : 30 });
    });

    ["l", "r"].forEach(function (s) {
      var list = sides[s];
      if (rootObstacle)
        list.push({ pinned: true, x: rootObstacle.x, wantY: rootObstacle.y, h: 32 });
      list.sort(function (a, b) { return a.wantY - b.wantY; });
      var pin = -1;
      for (var pi = 0; pi < list.length; pi++) if (list[pi].pinned) { pin = pi; break; }
      if (pin < 0) {
        var y = -1e9;
        list.forEach(function (it) { it.y = Math.max(it.wantY, y + it.h); y = it.y; });
      } else {
        list[pin].y = list[pin].wantY;
        var yd = list[pin].y;
        for (var i2 = pin + 1; i2 < list.length; i2++) {
          list[i2].y = Math.max(list[i2].wantY, yd + list[i2].h); yd = list[i2].y; }
        var yu = list[pin].y;
        for (var i3 = pin - 1; i3 >= 0; i3--) {
          list[i3].y = Math.min(list[i3].wantY, yu - list[i3].h); yu = list[i3].y; }
      }
      list = list.filter(function (it) { return !it.pinned; });

      function clampInto(arr, top, bot) {
        if (!arr.length) return;
        arr.sort(function (a, b) { return a.y - b.y; });
        var need = arr.reduce(function (t, it) { return t + it.h; }, 0);
        if (need > (bot - top)) {
          var step = (bot - top) / arr.length;
          arr.forEach(function (it, i) { it.y = top + step * (i + 0.5); });
          return;
        }
        var prev = top - arr[0].h * 0.4;
        arr.forEach(function (it) { it.y = Math.max(it.y, prev + it.h); prev = it.y; });
        var next = bot;
        for (var i = arr.length - 1; i >= 0; i--) {
          arr[i].y = Math.min(arr[i].y, next); next = arr[i].y - arr[i].h;
        }
      }

      if (list.length) {
        var TOP = env.top + 16, BOT = env.bottom - 14, band = null;
        if (rootObstacle) {
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
          clampInto(list.filter(function (it) { return it.y <  rootObstacle.y; }), TOP, band.t);
          clampInto(list.filter(function (it) { return it.y >= rootObstacle.y; }), band.b, BOT);
        } else {
          clampInto(list, TOP, BOT);
        }
      }

      list.forEach(function (it) {
        var rec = it.rec, n = it.n;
        rec.t.setAttribute("text-anchor", s === "r" ? "start" : "end");
        rec.t.textContent = n.label;
        var natural = rec.t.getComputedTextLength();
        var lim   = s === "r" ? (env.right - 8) : (env.left + 8);
        var avail = s === "r" ? lim - it.x : it.x - lim;
        var want  = Math.min(natural, 150);
        if (avail < want) { it.x += (s === "r" ? -(want - avail) : (want - avail)); avail = want; }
        rec.t.setAttribute("x", it.x); rec.t.setAttribute("y", it.y);
        if (natural > avail) {
          var txt = n.label;
          while (txt.length > 2 && rec.t.getComputedTextLength() > avail) {
            txt = txt.slice(0, -2);
            rec.t.textContent = txt.replace(/[\s\/,–—-]+$/, "") + "…";
          }
        }
        rec.cnt.setAttribute("x", it.x);
        rec.cnt.setAttribute("y", it.y + (n.kind === "region" ? 15 : 12));
        rec.cnt.setAttribute("text-anchor", s === "r" ? "start" : "end");
        rec.cnt.textContent = n.count + (n.kind === "region" ? " objects" : "");
        var mx = it.mx + Math.cos(n.ang) * (n.r * view.k);
        var my = it.my + Math.sin(n.ang) * (n.r * view.k);
        rec.lead.setAttribute("d", "M" + mx + " " + my +
          " L" + (it.x - (s === "r" ? 7 : -7)) + " " + it.y);
      });
    });

    return made.length;
  }

  /* ------------------------------------------------------------ stylesheet */
  function exportCSS(tok, faces) {
    var t = "";
    TOKENS.forEach(function (k) { t += k + ":" + tok[k] + ";"; });
    return fontFaceCSS(faces) + "\n" +
      "svg{" + t + "font-family:'CFWExport Sans',sans-serif}" +
      ".spine{stroke:var(--fg-3);stroke-width:1;fill:none;opacity:.42}" +
      ".spine.limb{opacity:.6;stroke-width:1.3}" +
      ".leader{stroke:var(--fg-3);stroke-width:1;fill:none;opacity:.5}" +
      ".edge{fill:none;opacity:0}" +
      ".edge.on{opacity:.8}" +
      ".edge.registered{stroke:var(--fg-1);stroke-width:1.9;marker-end:url(#arrow)}" +
      ".edge.recorded{stroke:var(--fg-2);stroke-width:1.15;stroke-dasharray:5 4}" +
      ".node .box{fill:var(--st);fill-opacity:.15;stroke:var(--st);stroke-width:1.5}" +
      ".node .chip{fill:var(--st)}" +
      ".lbl-root{fill:var(--fg-1);font-size:23px;font-weight:400;letter-spacing:-.01em}" +
      ".lbl-region{fill:var(--fg-1);font-size:16px;font-weight:500;letter-spacing:-.01em}" +
      ".lbl-branch{fill:var(--fg-1);font-size:13px;font-weight:400}" +
      ".lbl-leaf{fill:var(--fg-1);font-size:11px;font-weight:200}" +
      ".lbl-count{fill:var(--fg-3);font-family:'CFWExport Mono',monospace;font-size:9px;letter-spacing:.06em}" +
      ".lbl-id{fill:var(--fg-3);font-family:'CFWExport Mono',monospace;font-size:8px;letter-spacing:.04em}" +
      ".lbl-halo{stroke:var(--bg-from);stroke-width:4.2;stroke-linejoin:round;paint-order:stroke fill}" +
      ".ch-t{fill:var(--fg-1);font-size:30px;font-weight:500;letter-spacing:-.01em}" +
      ".ch-s{fill:var(--fg-2);font-family:'CFWExport Mono',monospace;font-size:14px;letter-spacing:.06em}" +
      ".ch-k{fill:var(--fg-3);font-family:'CFWExport Mono',monospace;font-size:12px;letter-spacing:.09em}" +
      ".ch-lh{fill:var(--fg-3);font-family:'CFWExport Mono',monospace;font-size:10px;letter-spacing:.16em}" +
      ".ch-ll{fill:var(--fg-1);font-size:13px;font-weight:500}" +
      ".ch-ls{fill:var(--fg-2);font-size:11.5px}" +
      ".ch-c{fill:var(--fg-2);font-size:13.5px}" +
      ".ch-cb{fill:var(--fg-1);font-size:13.5px;font-weight:600}";
  }

  /* --------------------------------------------------------------- chrome */
  /* THE PAGE PLATE CARRIES THE ROUTE'S ACTUAL CHROME, and every string in it is
     READ FROM THE LIVE DOM rather than restated here. An earlier version wrote
     its own title, its own summary lines and its own count stack, which quietly
     turned `PNG page` into a custom poster: no ASK mark, no legend, and a
     paraphrase where the caption should have been. A plate without the legend
     cannot be decoded — state colour, relation-line grammar and object shape all
     lose their key — and a plate without the caption drops the reading-surface /
     machinery distinction and the level-of-detail-is-not-filtering bound.

     Deriving from the DOM also means the plate cannot drift: when the caption or
     the legend changes on the page, the export changes with it, because there is
     no second copy of either. */

  function readPageChrome() {
    function txt(sel) { var e = DOC.querySelector(sel); return e ? e.textContent.trim() : ""; }
    var legend = DOC.getElementById("legend");
    var caption = DOC.querySelector(".cfw-caption");
    if (!legend || !caption) throw new Error("page chrome not found (legend / caption)");

    /* the legend is grouped: heading, then its rows, until the next heading */
    var groups = [], cur = null;
    Array.prototype.forEach.call(legend.children, function (el) {
      if (el.classList.contains("panel-h")) { cur = { head: el.textContent.trim(), rows: [] }; groups.push(cur); }
      else if (el.classList.contains("row") && cur) {
        var sw = el.querySelector(".sw"), kl = el.querySelector(".kline");
        cur.rows.push({
          swatch: sw ? root.getComputedStyle(sw).backgroundColor : null,
          line:   kl ? (kl.classList.contains("registered") ? "registered"
                      : kl.classList.contains("recorded") ? "recorded" : "unedged") : null,
          label:  (el.querySelector(".lbl") || {}).textContent || "",
          sub:    (el.querySelector(".sub") || {}).textContent || ""
        });
      }
    });
    var boundEl = legend.querySelector(".bound");

    /* the caption's own paragraph structure, with its <b> lead-ins preserved */
    var paras = [];
    var buf = "", lead = "";
    Array.prototype.forEach.call(caption.childNodes, function (n) {
      if (n.nodeName === "BR") { if (buf.trim() || lead) { paras.push({ lead: lead, body: buf.trim() }); buf = ""; lead = ""; } return; }
      /* A <b> only opens a paragraph when nothing precedes it in that paragraph.
         The caption also uses <b> INLINE ("two sectors that touch carry <b>no</b>
         relation"), and treating that as a lead split one sentence into three
         fragments with "no" standing alone as a heading. */
      if (n.nodeName === "B") {
        if (buf.trim()) { buf += n.textContent; return; }   /* inline emphasis */
        lead = n.textContent.trim(); return;                /* paragraph lead */
      }
      buf += n.textContent;
    });
    if (buf.trim() || lead) paras.push({ lead: lead, body: buf.trim() });

    var markImg = null;
    Array.prototype.forEach.call(DOC.querySelectorAll(".rel-mark img"), function (i) {
      if (root.getComputedStyle(i).display !== "none") markImg = i;
    });
    var canon = DOC.querySelector('link[rel="canonical"]');

    return {
      title: txt(".bar .title-block .t"),
      subtitle: txt(".bar .title-block .s"),
      /* stamp: textContent + the COMPUTED text-transform, never innerText.
         innerText applies text-transform only when the element is RENDERED, and
         `.bar .stamp` is display:none below 768px — so an innerText read gave
         "RELEASE 1.0 …" on desktop and "release 1.0 …" on mobile, making the
         PLATE DEPEND ON THE READER'S VIEWPORT. The transform itself is declared
         unconditionally, so reading it and applying it is both DOM-derived and
         viewport-independent. */
      stamp: (function () {
        var e = DOC.querySelector(".bar .stamp");
        if (!e) return "";
        var s = e.textContent.replace(/\s+/g, " ").trim();
        var tt = root.getComputedStyle(e).textTransform;
        if (tt === "uppercase") return s.toUpperCase();
        if (tt === "lowercase") return s.toLowerCase();
        return s;
      })(),
      canonical: canon ? canon.getAttribute("href").replace(/^https?:\/\//, "").replace(/\/$/, "") : "",
      legendGroups: groups,
      legendBound: boundEl ? boundEl.textContent.trim() : "",
      captionParas: paras,
      markSrc: markImg ? markImg.getAttribute("src") : null,
      markW: markImg ? markImg.naturalWidth : 0,
      markH: markImg ? markImg.naturalHeight : 0
    };
  }

  /* The ASK mark is embedded, never referenced: a remote or same-origin URL in
     the SVG would not survive rasterisation through a canvas. Failure to embed
     ABORTS, because a page plate without the mark is not the requested artifact. */
  function loadMark(src) {
    if (!src) return Promise.reject(new Error("no ASK mark is displayed for this theme"));
    return fetch(src).then(function (r) {
      if (!r.ok) throw new Error(src + " -> HTTP " + r.status);
      return r.arrayBuffer();
    }).then(function (buf) {
      var b = new Uint8Array(buf), s = "", CH = 0x8000;
      for (var i = 0; i < b.length; i += CH) s += String.fromCharCode.apply(null, b.subarray(i, i + CH));
      return "data:image/png;base64," + root.btoa(s);
    }).catch(function (e) {
      throw new Error("ASK mark embedding failed, export aborted: " + e.message);
    });
  }

  /* SVG has no line wrapping, so it is done here against real measured widths. */
  function wrapInto(host, cls, text, maxW) {
    var probe = el("text", { "class": cls, x: -9999, y: -9999 });
    host.appendChild(probe);
    var words = String(text).split(/\s+/).filter(Boolean), lines = [], cur = "";
    for (var i = 0; i < words.length; i++) {
      var trial = cur ? cur + " " + words[i] : words[i];
      probe.textContent = trial;
      if (probe.getComputedTextLength() > maxW && cur) { lines.push(cur); cur = words[i]; }
      else cur = trial;
    }
    if (cur) lines.push(cur);
    host.removeChild(probe);
    return lines;
  }

  function addChrome(svg, tok, vw, vh, V, C2, markURI, layout) {
    function T(cls, x, y, s, anchor) {
      var e = el("text", { "class": cls, x: x, y: y });
      if (anchor) e.setAttribute("text-anchor", anchor);
      e.textContent = s; svg.appendChild(e); return e;
    }
    function rule(x1, y1, x2, y2, op) {
      var p = el("path", { d: "M" + x1 + " " + y1 + " L" + x2 + " " + y2,
                           stroke: tok["--fg-3"], "stroke-width": 1, fill: "none" });
      p.setAttribute("opacity", op || 0.5); svg.appendChild(p); return p;
    }

    /* ---- header: ASK mark, title block, stamp, canonical route ---- */
    var markH = 34, markW = C2.markH ? markH * (C2.markW / C2.markH) : 75;
    var img = el("image", { x: SIDE_PAD, y: 26, width: markW, height: markH,
                            preserveAspectRatio: "xMinYMid meet" });
    img.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", markURI);
    img.setAttribute("href", markURI);
    svg.appendChild(img);

    var tx = SIDE_PAD + markW + 26;
    T("ch-t", tx, 46, C2.title);
    T("ch-s", tx, 70, C2.subtitle);
    T("ch-k", vw - SIDE_PAD, 44, C2.stamp, "end");
    T("ch-k", vw - SIDE_PAD, 68, C2.canonical, "end");
    rule(SIDE_PAD, HEAD_H - 18, vw - SIDE_PAD, HEAD_H - 18, 0.4);

    /* ---- legend: the actual decoding grammar, rebuilt from the live panel ---- */
    var lx = layout.legend.x, ly = layout.legend.y, lw = layout.legend.w;
    var y = ly;
    /* The live legend states the shape grammar as one prose run. The plate draws the
       shapes instead, so that group is dropped here and rebuilt below as marks — a
       reader cannot decode a shape channel from a sentence naming the shapes. */
    var groups = C2.legendGroups.filter(function (g) { return !/^shape/i.test(g.head); });
    groups.forEach(function (g, gi) {
      if (gi) y += 16;
      T("ch-lh", lx, y, g.head.toUpperCase());
      y += 20;
      g.rows.forEach(function (r) {
        if (r.swatch) {
          svg.appendChild(el("rect", { x: lx, y: y - 9, width: 11, height: 11, rx: 2,
                                       fill: r.swatch }));
        } else if (r.line === "registered") {
          svg.appendChild(el("path", { d: "M" + lx + " " + (y - 4) + " L" + (lx + 13) + " " + (y - 4),
            stroke: tok["--fg-1"], "stroke-width": 2.2, fill: "none", "marker-end": "url(#arrow)" }));
        } else if (r.line === "recorded") {
          svg.appendChild(el("path", { d: "M" + lx + " " + (y - 4) + " L" + (lx + 13) + " " + (y - 4),
            stroke: tok["--fg-2"], "stroke-width": 1.4, "stroke-dasharray": "4 3", fill: "none" }));
        } else if (r.line === "unedged") {
          svg.appendChild(el("path", { d: "M" + lx + " " + (y - 4) + " L" + (lx + 13) + " " + (y - 4),
            stroke: tok["--fg-3"], "stroke-width": 1, "stroke-dasharray": "1 3", fill: "none",
            opacity: 0.5 }));
        }
        var hasMark = r.swatch || r.line;
        var textX = hasMark ? lx + 20 : lx;
        if (r.label) { T("ch-ll", textX, y, r.label); y += 15; }
        if (r.sub) {
          var subLines = wrapInto(svg, "ch-ls", r.sub, lw - (textX - lx));
          subLines.forEach(function (line, i) { T("ch-ls", textX, y + i * 13, line); });
          y += subLines.length * 13;
        }
        y += 7;
      });
    });

    /* shape grammar drawn as marks, not only named: a shape key that spells the
       shapes in prose does not let a reader decode the plate */
    y += 8;
    T("ch-lh", lx, y, "SHAPE = OBJECT CLASS"); y += 22;
    var shapes = [["circle","node"],["square","claim + frame"],["diamond","ASK articulation"],
                  ["hex","held question"],["tri","cross-cutting"],["ring","topology"]];
    var col = 0, sx = lx, sy = y;
    shapes.forEach(function (s, i) {
      var cx = sx + (col * (lw / 2)) + 7, cy = sy + 1;
      var r = 6, kind = s[0];
      if (kind === "square")
        svg.appendChild(el("rect", { x: cx - r, y: cy - r, width: r * 2, height: r * 2, rx: 1.6,
          fill: tok["--fg-1"], "fill-opacity": 0.15, stroke: tok["--fg-1"], "stroke-width": 1.3 }));
      else if (kind === "diamond")
        svg.appendChild(el("polygon", { points: [cx, cy - r * 1.25, cx + r * 1.25, cy, cx, cy + r * 1.25, cx - r * 1.25, cy].join(" "),
          fill: tok["--fg-1"], "fill-opacity": 0.15, stroke: tok["--fg-1"], "stroke-width": 1.3 }));
      else if (kind === "hex") {
        var pts = [];
        for (var q = 0; q < 6; q++) { var a = Math.PI / 6 + q * Math.PI / 3;
          pts.push((cx + Math.cos(a) * r * 1.3) + "," + (cy + Math.sin(a) * r * 1.3)); }
        svg.appendChild(el("polygon", { points: pts.join(" "), fill: tok["--fg-1"],
          "fill-opacity": 0.15, stroke: tok["--fg-1"], "stroke-width": 1.3 }));
      } else if (kind === "tri")
        svg.appendChild(el("polygon", { points: [cx, cy - r * 1.35, cx + r * 1.2, cy + r * 0.85, cx - r * 1.2, cy + r * 0.85].join(" "),
          fill: tok["--fg-1"], "fill-opacity": 0.15, stroke: tok["--fg-1"], "stroke-width": 1.3 }));
      else if (kind === "ring") {
        svg.appendChild(el("circle", { cx: cx, cy: cy, r: r * 1.2, fill: tok["--fg-1"],
          "fill-opacity": 0.15, stroke: tok["--fg-1"], "stroke-width": 1.3 }));
        svg.appendChild(el("circle", { cx: cx, cy: cy, r: r * 0.34, fill: tok["--fg-1"] }));
      } else
        svg.appendChild(el("circle", { cx: cx, cy: cy, r: r, fill: tok["--fg-1"],
          "fill-opacity": 0.15, stroke: tok["--fg-1"], "stroke-width": 1.3 }));
      T("ch-ls", cx + 14, cy + 4, s[1]);
      col++; if (col === 2) { col = 0; sy += 26; }
    });
    y = sy + (col ? 26 : 0) + 10;

    if (C2.legendBound) {
      rule(lx, y, lx + lw, y, 0.35); y += 16;
      wrapInto(svg, "ch-ls", C2.legendBound, lw).forEach(function (line, i) {
        T("ch-ls", lx, y + i * 13, line);
      });
    }

    /* ---- caption: the reading-surface / machinery distinction, verbatim ---- */
    var cx0 = layout.caption.x, cy0 = layout.caption.y, cw = layout.caption.w;
    rule(cx0, cy0 - 26, cx0 + cw, cy0 - 26, 0.4);
    var cy = cy0;
    C2.captionParas.forEach(function (p) {
      if (p.lead) {
        wrapInto(svg, "ch-cb", p.lead, cw).forEach(function (line) {
          T("ch-cb", cx0, cy, line); cy += 19;
        });
      }
      if (p.body) {
        wrapInto(svg, "ch-c", p.body, cw).forEach(function (line) {
          T("ch-c", cx0, cy, line); cy += 19;
        });
      }
      cy += 9;
    });

    /* ---- the census, kept: it is route truth, not decoration ---- */
    var c = V.projection.counts;
    var stats = [
      c.primary + " primary objects // " + c.evidence + " evidence owners",
      c.regions + " regions // " + c.branches + " branches",
      c.registered + " registered drawn // " + c.recorded + " recorded retained, hidden at rest // " +
        c.unedged + " unedged, never drawn",
      "level of detail: " + EXPORT_LOD.name + " // full atlas, unfiltered, neutral state"
    ];
    stats.forEach(function (s, i) {
      T("ch-k", vw - SIDE_PAD, vh - 74 + i * 18, s, "end");
    });
  }

  /* --------------------------------------------------------------- export */
  function buildSVG(mode, faces, chrome, markURI) {
    var V = root.CFW_VIEW;
    if (!V || !V.layout || !V.projection || !V.labels)
      throw new Error("CFW_VIEW is not available");
    var tok = readTokens();
    var b = V.layout.bounds;

    var W, H, vw, vh, area, layout = null;
    if (mode === "page") {
      W = PAGE_W; H = PAGE_H;
      vw = W / DEVICE_SCALE; vh = H / DEVICE_SCALE;
      /* the legend takes a right column, as it does on the page; the caption takes
         a bottom band; the atlas is fitted into what is left */
      var legendX = vw - SIDE_PAD - LEGEND_W;
      area = { x: SIDE_PAD, y: HEAD_H,
               w: legendX - LEGEND_GAP - SIDE_PAD, h: vh - HEAD_H - FOOT_H };
      layout = {
        legend:  { x: legendX, y: HEAD_H + 26, w: LEGEND_W },
        caption: { x: SIDE_PAD, y: vh - FOOT_H + 30, w: legendX - LEGEND_GAP - SIDE_PAD }
      };
    } else {  /* natural aspect: the canvas takes the FIGURE's own proportions */
      var ar = b.w / b.h;
      if (ar >= 1) { W = DIAGRAM_LONG_EDGE; H = Math.round(DIAGRAM_LONG_EDGE / ar); }
      else         { H = DIAGRAM_LONG_EDGE; W = Math.round(DIAGRAM_LONG_EDGE * ar); }
      vw = W / DEVICE_SCALE; vh = H / DEVICE_SCALE;
      area = { x: 0, y: 0, w: vw, h: vh };
    }

    /* The FIGURE is fitted inside the drawing area minus the label gutter; the
       LABELS are solved against the drawing area itself. That is the whole
       reason the two numbers differ: a callout is allowed into the gutter and
       is ellipsized at the drawing area's edge, so nothing leaves the plate. */
    var f = fitBounds(b, area.w, area.h, LABEL_GUTTER_X, LABEL_GUTTER_Y);
    var view = { k: f.k, x: f.x + area.x, y: f.y + area.y };
    var env = { left: area.x, right: area.x + area.w,
                top: area.y, bottom: area.y + area.h };

    var svg = el("svg", { xmlns: NS, "xmlns:xlink": "http://www.w3.org/1999/xlink",
                          width: W, height: H, viewBox: "0 0 " + W + " " + H });
    var defs = el("defs"); svg.appendChild(defs);
    var st = DOC.createElementNS(NS, "style");
    st.textContent = exportCSS(tok, faces);
    defs.appendChild(st);

    var grad = el("linearGradient", { id: "bg", x1: "0", y1: "1", x2: "1", y2: "0" });
    grad.appendChild(el("stop", { offset: "0", "stop-color": tok["--bg-from"] }));
    grad.appendChild(el("stop", { offset: "1", "stop-color": tok["--bg-to"] }));
    defs.appendChild(grad);

    var mk = el("marker", { id: "arrow", viewBox: "0 0 10 10", refX: 9, refY: 5,
                            markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" });
    mk.appendChild(el("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: tok["--fg-1"] }));
    defs.appendChild(mk);

    svg.appendChild(el("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#bg)" }));

    /* everything above the plate is authored at virtual scale and drawn at 2x */
    var gScale = el("g", { transform: "scale(" + DEVICE_SCALE + ")" });
    svg.appendChild(gScale);

    var wl = worldLayer();
    wl.g.setAttribute("transform",
      "translate(" + view.x + "," + view.y + ") scale(" + view.k + ")");
    gScale.appendChild(wl.g);
    var relations = {
      registeredVisible:      wl.counts.registeredVisible,
      recordedRetainedHidden: wl.counts.recordedRetainedHidden,
      unedgedOmitted:         V.projection.counts.unedged,
      otherEdges:             wl.counts.otherEdges,
      declaredLinksTotal:     V.projection.counts.links
    };

    /* CHROME IS DEFERRED, NOT DRAWN HERE. Every wrapped string in it is sized with
       getComputedTextLength(), which returns 0 until the tree is mounted — the same
       condition that once silently disabled the label ellipsizer. buildSVG runs
       before the mount, so drawing chrome here produced a plate whose legend and
       caption ran straight off the edge, unwrapped. renderSVG invokes this after
       the mount AND after the measurability probe. */
    var drawChrome = (mode === "page")
      ? function () { addChrome(gScale, tok, vw, vh, V, chrome, markURI, layout); }
      : function () {};

    return { svg: svg, gScale: gScale, view: view, env: env, relations: relations,
             area: area, W: W, H: H, V: V, drawChrome: drawChrome };
  }

  /* Labels need a rendered context: the engine ellipsizes a callout by measuring
     it with getComputedTextLength() and trimming until it fits. The export tree
     is therefore measured in an offscreen host, removed in every exit path.

     THE HOST MUST NOT COLLAPSE THE SVG'S CONTAINING BLOCK. An earlier version
     used a 1px `contain: strict` box, on the reasoning that a hidden measuring
     surface should influence nothing. It influenced the measurement. Measured
     across both engines with one string at one size:

       host style                     Chromium    WebKit
       contain:strict, 1px                   0       334
       visibility:hidden                     0       334
       1px + overflow:hidden                 0       334
       offscreen, zero-size, unclipped   329.2       330

     The mechanism, isolated afterwards rather than assumed: THIS SVG CARRIES A
     viewBox, so it scales to its containing block. Collapse that block and the
     scale goes to zero, and Chromium reports zero-width text. Removing the
     viewBox makes the same contained host measure 329.2 — so it is the viewBox
     plus the collapsed container, not layout suppression in general. WebKit
     measures either way.

     The consequence was that `natural > avail` was never true, no callout was
     ever ellipsized, and the longest region labels ran off the left edge of the
     plate — IN CHROMIUM ONLY, while PLAYWRIGHT WEBKIT produced a correct file.
     (Playwright's WebKit build, not Safari: Safari was never tested and nothing
     here is evidence about it.) Nothing threw and the PNG looked almost right,
     which is why the guard below is code and not a comment. `display: none`
     zeroes the measurement in BOTH engines, which is how the guard is exercised
     cross-engine.

     Offscreen positioning alone keeps the host out of the reader's way; it is
     inert in every other respect — no listeners, no application state, no
     scroll or focus effect. */
  /* ONE definition of the measurement host, used by the only path that mounts an
     export tree. An earlier revision left a second, unused host factory behind
     after renderSVG was rewritten; a fault-injection control went on patching
     that dead copy and silently stopped injecting anything, so the control
     reported a passing export while testing nothing. One definition, one place
     to patch, one place to be wrong. */
  var MEASURE_HOST_CSS = "position:absolute;left:-100000px;top:0;width:0;height:0;" +
                         "overflow:visible;pointer-events:none";

  function makeMeasureHost() {
    var host = DOC.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = MEASURE_HOST_CSS;
    DOC.body.appendChild(host);
    return host;
  }

  /* Fail closed on an unmeasurable host. A zero here means the ellipsizer is
     about to no-op silently, and a plate with labels hanging off its edge is
     worse than an export that says it could not be produced. */
  function assertMeasurable(svg) {
    var probe = el("text", { x: 0, y: 0, "class": "lbl-region" });
    probe.setAttribute("style", 'font-family:"CFWExport Sans"');
    probe.textContent = "measurement probe";
    svg.appendChild(probe);
    var w = probe.getComputedTextLength();
    svg.removeChild(probe);
    if (!(w > 0))
      throw new Error("text measurement unavailable in the export host " +
                      "(getComputedTextLength returned " + w + "); export aborted");
    return w;
  }

  /* NOTHING IS MEASURED UNTIL THE EXPORT FACES ARE PROVEN USABLE. The order is
     load -> add -> check -> mount -> POSITIVE CONTROL -> measure, and the faces
     are removed from the document in a finally on every path, success or not. */
  function renderSVG(mode, faces, chrome, markURI) {
    var host = makeMeasureHost();
    var dispose = null;
    function cleanup() {
      if (dispose) { try { dispose(); } catch (e) {} dispose = null; }
      if (host.parentNode) host.parentNode.removeChild(host);
    }
    return registerExportFaces(faces, host).then(function (d) {
      dispose = d;
      var b = buildSVG(mode, faces, chrome, markURI);
      host.appendChild(b.svg);
      b.fontProof = assertFacesApplied(b.svg, faces);   /* positive control */
      b.probeWidth = assertMeasurable(b.svg);
      b.drawChrome();                      /* mounted and measurable: wrapping works */
      b.labelCount = buildLabels(b.V, b.view, b.env, b.gScale);
      b.overflow = labelOverflow(b.svg, b.env);
      b.chromeIssues = (mode === "page")
        ? chromeOverflow(b.gScale, b.W / DEVICE_SCALE, b.H / DEVICE_SCALE) : [];
      b.svg.parentNode.removeChild(b.svg);
      b.disposeFaces = function () { cleanup(); };
      return b;
    }).catch(function (e) { cleanup(); throw e; });
  }

  /* The export's own acceptance test, run on every export rather than only in a
     harness: no label may leave the drawing area. It is checked here because the
     ellipsizer has already failed once in a way that produced a plausible file. */
  /* The plate's chrome is wrapped against measured widths, so a clipped caption or
     legend means the measurement was wrong, not that the text was long. Checked on
     every export for the same reason the label check exists: the failure is silent
     and the file still looks almost right. */
  function chromeOverflow(svg, vw, vh) {
    var bad = [];
    Array.prototype.forEach.call(svg.querySelectorAll("text"), function (t) {
      if (!/ch-/.test(t.getAttribute("class") || "")) return;
      var b = t.getBBox();
      if (!(b.width > 0)) { bad.push({ text: t.textContent, reason: "unmeasurable chrome" }); return; }
      if (b.x < 0 || b.y < 0 || b.x + b.width > vw + 1 || b.y + b.height > vh + 1)
        bad.push({ text: (t.textContent || "").slice(0, 48), reason: "chrome outside plate",
                   x: Math.round(b.x), y: Math.round(b.y),
                   right: Math.round(b.x + b.width), bottom: Math.round(b.y + b.height) });
    });
    Array.prototype.forEach.call(svg.querySelectorAll("image"), function (im) {
      var b = im.getBBox();
      if (!(b.width > 0)) { bad.push({ text: "ASK mark", reason: "mark has no extent" }); return; }
      if (b.x < 0 || b.y < 0 || b.x + b.width > vw + 1 || b.y + b.height > vh + 1)
        bad.push({ text: "ASK mark", reason: "mark outside plate" });
    });
    return bad;
  }

  function labelOverflow(svg, env) {
    var bad = [];
    Array.prototype.forEach.call(svg.querySelectorAll("text"), function (t) {
      if (/ch-/.test(t.getAttribute("class") || "")) return;   /* chrome is placed, not solved */
      var b = t.getBBox();
      if (!(b.width > 0)) { bad.push({ text: t.textContent, reason: "unmeasurable" }); return; }
      if (b.x < env.left - 1 || b.x + b.width > env.right + 1 ||
          b.y < env.top - 1 || b.y + b.height > env.bottom + 1)
        bad.push({ text: t.textContent, reason: "outside drawing area",
                   x: Math.round(b.x), right: Math.round(b.x + b.width) });
    });
    return bad;
  }

  function serialize(svg) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
           new XMLSerializer().serializeToString(svg);
  }

  function toPNG(built) {
    var src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(serialize(built.svg));
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var cv = DOC.createElement("canvas");
        cv.width = built.W; cv.height = built.H;
        var cx = cv.getContext("2d");
        cx.drawImage(img, 0, 0, built.W, built.H);
        cv.toBlob(function (blob) {
          if (blob) resolve(blob); else reject(new Error("canvas produced no PNG blob"));
        }, "image/png");
      };
      img.onerror = function () { reject(new Error("the export SVG did not rasterize")); };
      img.decoding = "sync";
      img.src = src;
    });
  }

  function filename(mode) {
    return "cfw-mind-map-" + (mode === "page" ? "page-" + PAGE_W + "x" + PAGE_H : "diagram") +
           "-" + (isDark() ? "dark" : "light") + ".png";
  }

  function save(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = DOC.createElement("a");
    a.href = url; a.download = name;
    DOC.body.appendChild(a); a.click();
    DOC.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  var busy = false;
  function announce(msg) {
    var live = DOC.getElementById("live");
    if (live) live.textContent = msg;
  }

  /* ------------------------------------------------- visible failure state */
  /* WHY THE BUTTON REPORTS FAILURE. Every abort path in this file is real:
     fonts, the ASK mark, unmeasurable text, label overflow, chrome overflow and
     a canvas that yields no blob. An earlier version reported all of them
     through the page's live region and the console — and the live region is
     `.sr-only`. A sighted reader could click an export, receive no file, watch
     the button return to its ordinary label, and be told nothing. Failing
     closed and failing silently are not the same property, and only the first
     one was implemented.

     The active button IS the failure surface. No toast, no modal, no error
     panel, no extra row, no new colour: the control the reader just pressed
     says what happened, for five seconds, then restores itself exactly. */
  var FAIL_MS = 5000;
  var restoreTimer = {};                 /* button id -> pending timeout handle */

  function approvedLabel(btn) { return btn.getAttribute("data-approved-label"); }
  function approvedTitle(btn) { return btn.getAttribute("data-approved-title"); }

  /* Restoration is to the APPROVED strings, not to "whatever was there before".
     Reading the previous value back would faithfully restore a failure message
     if two failures overlapped. */
  function restoreButton(btn) {
    if (!btn) return;
    if (restoreTimer[btn.id]) { root.clearTimeout(restoreTimer[btn.id]); delete restoreTimer[btn.id]; }
    btn.textContent = approvedLabel(btn);
    btn.title = approvedTitle(btn);
    btn.setAttribute("aria-label", approvedTitle(btn));
    btn.classList.remove("is-failed");
    btn.removeAttribute("aria-live");
  }

  /* One line, bounded. The underlying Error keeps its full text for the console
     and for __CFW_EXPORT_ERROR; the button gets something a person can read at
     a glance without the control changing size unpredictably. */
  function briefReason(e) {
    var m = String((e && e.message) || e || "unknown error");
    m = m.replace(/\s+/g, " ").trim();
    var cut = m.indexOf(":");
    if (cut > 12 && cut < 60) m = m.slice(0, cut);        /* keep the cause, drop the detail */
    m = m.replace(/,?\s*export aborted\.?$/i, "");
    if (m.length > 72) m = m.slice(0, 71).replace(/\s+\S*$/, "") + "…";
    return m || "unknown error";
  }

  function showFailure(btn, e) {
    if (!btn) return;
    var reason = briefReason(e);
    btn.textContent = "export failed";
    var t = "PNG export failed — " + reason;
    btn.title = t;
    btn.setAttribute("aria-label", t);
    /* A class hook only — NO stylesheet rule is added for it. The contract's
       visible surface is the LABEL, and cfw-release.css must stay byte-identical
       to the accepted v3 postimage, so the failure does not get a colour. The
       hook exists so a future authorized style change has somewhere to attach
       and so tests can assert the state without parsing text. */
    btn.classList.add("is-failed");
    /* the button announces itself once, so a screen reader is told too without
       depending on the separate live region */
    btn.setAttribute("aria-live", "assertive");
    restoreTimer[btn.id] = root.setTimeout(function () {
      delete restoreTimer[btn.id];
      restoreButton(btn);
    }, FAIL_MS);
  }

  function run(mode, opts) {
    opts = opts || {};
    if (busy) return Promise.resolve(null);
    busy = true;
    var btn = DOC.getElementById(mode === "page" ? "exportPng" : "exportPngDiagram");
    /* a new attempt cancels any pending restoration and clears a failed state
       first, so the reader never sees "export failed" while a retry is running */
    if (btn) { restoreButton(btn); btn.disabled = true; btn.textContent = "…"; }
    root.__CFW_EXPORT_ERROR = null;
    announce("preparing PNG export");
    return loadFonts()
      .then(function (faces) {
        if (mode !== "page") return renderSVG(mode, faces, null, null);
        var chrome = readPageChrome();
        return loadMark(chrome.markSrc).then(function (markURI) {
          return renderSVG(mode, faces, chrome, markURI);
        });
      })
      .then(function (built) {
        /* ONE OWNER FOR THE WHOLE POST-BUILD LIFECYCLE.
           renderSVG() hands back a built object holding two disposable
           resources — the registered export FontFaces and the offscreen
           measurement host — and everything from here can fail: chrome
           validation, label validation, SVG decode, canvas draw, toBlob.

           v5 disposed inside the SUCCESS callback of toPNG(), so a REJECTION
           there skipped disposal entirely: the outer catch could show the
           visible failure but no longer owned `built`, and the faces and host
           survived into the next attempt. The export would then run against
           accumulated same-named faces and leaked hosts, and the package's
           "cleanup on every exit path" claim was false for exactly the two
           paths hardest to reach.

           disposeOnce is idempotent and the chain ends in .finally, so every
           outcome — resolve, reject, or a throw between them — releases both
           resources exactly once. No caller downstream is trusted to do it. */
        var disposed = false;
        function disposeOnce() {
          if (disposed) return;
          disposed = true;
          if (built.disposeFaces) built.disposeFaces();
        }
        return Promise.resolve()
          .then(function () {
            if (built.chromeIssues.length)
              throw new Error("page chrome left the plate (" + built.chromeIssues.length +
                              "), export aborted: " + built.chromeIssues.slice(0, 3).map(function (o) {
                                return o.reason + " :: " + o.text; }).join(" | "));
            if (built.overflow.length)
              throw new Error("label placement left the drawing area (" +
                              built.overflow.length + "), export aborted: " +
                              built.overflow.slice(0, 3).map(function (o) {
                                return o.reason + " :: " + o.text; }).join(" | "));
            return toPNG(built);
          })
          .then(function (blob) {
            var name = filename(mode);
            root.__CFW_EXPORT_LAST = {
              mode: mode, width: built.W, height: built.H, bytes: blob.size,
              labels: built.labelCount, lod: EXPORT_LOD.name,
              theme: isDark() ? "dark" : "light", filename: name,
              probeWidth: +built.probeWidth.toFixed(2), overflow: 0,
              relations: built.relations,
              fontProof: built.fontProof,
              exportFamilies: FONT_FILES.map(function (f) { return f.exportFamily; })
            };
            if (!opts.noSave) save(blob, name);
            announce("PNG export ready: " + name);
            return blob;
          })
          .finally(disposeOnce);
      })
      .catch(function (e) {
        root.__CFW_EXPORT_ERROR = String(e && e.message || e);
        root.__CFW_EXPORT_LAST_FAILURE = {
          mode: mode, reason: briefReason(e), full: root.__CFW_EXPORT_ERROR
        };
        announce("PNG export failed: " + root.__CFW_EXPORT_ERROR);   /* secondary */
        if (root.console) root.console.error("[cfw-export-png]", e); /* secondary */
        busy = false;
        if (btn) { btn.disabled = false; showFailure(btn, e); }      /* primary */
        return null;
      })
      .then(function (r) {
        if (r !== null) {
          busy = false;
          if (btn) { btn.disabled = false; restoreButton(btn); }
        }
        return r;
      });
  }

  /* ------------------------------------------------------------------ HUD */
  function mkButton(id, label, title) {
    var b = DOC.createElement("button");
    b.type = "button"; b.id = id; b.className = "hud-export";
    b.textContent = label; b.title = title; b.setAttribute("aria-label", title);
    /* the approved strings are carried on the element, so restoration after a
       failure is to the CONTRACT rather than to a remembered previous value */
    b.setAttribute("data-approved-label", label);
    b.setAttribute("data-approved-title", title);
    return b;
  }

  function mount() {
    var hud = DOC.querySelector(".hud");
    if (!hud || DOC.getElementById("exportPng")) return false;

    /* THE EXPORT PAIR IS A SECOND ROW, OUT OF FLOW, AND THAT IS A MEASURED
       DECISION rather than a stylistic one.

       Inline, these two labels widen the HUD from 304px to 482px and run it
       under the centred caption panel that shares its bottom edge. Making the
       HUD a two-row flex container fixes the WIDTH but not the HARM: the HUD
       grows upward, the caption spans that whole band, and the obscured caption
       area measured at 1024 goes from 2,895.64 px^2 to 4,869.94 px^2 — a 68%
       regression that a width-only check reports as clean.

       Out of flow, the HUD's own box is untouched at 304x44, so its overlap with
       the caption is exactly the baseline's, and the export row is ~175px wide
       against a caption that starts at x=256 — so it adds no new overlap either.
       Both halves are measured in VERIFICATION, because the second one is what
       stops this being a trick played on the metric.

       Nothing existing is moved, reordered or rewrapped: the HUD's children are
       left exactly as the release wrote them, and this appends one element. */
    var row = DOC.createElement("span");
    row.className = "hud-row-export";
    var a = mkButton("exportPng", "PNG page",
      "Export " + PAGE_W + "\u00d7" + PAGE_H + " chromed page PNG");
    var d = mkButton("exportPngDiagram", "PNG diagram",
      "Export diagram-only PNG \u2014 no chrome, natural aspect");
    row.appendChild(a); row.appendChild(d);
    hud.appendChild(row);

    a.addEventListener("click", function () { run("page"); });
    d.addEventListener("click", function () { run("diagram"); });
    return true;
  }

  function boot() {
    if (!mount()) return;
    var q = String(root.location && root.location.search || "");
    if (/[?&]export=png-diagram(&|$)/.test(q)) run("diagram");
    else if (/[?&]export=png(&|$)/.test(q)) run("page");
  }

  if (DOC.readyState === "loading") DOC.addEventListener("DOMContentLoaded", boot);
  else boot();

  /* the same entry points the buttons use, for verification */
  /* The verification entry point returns the BUILT object with its faces still
     registered, so a harness can measure it; disposeFaces() is on the object and
     the harness is expected to call it. run() always disposes for itself. */
  root.CFW_EXPORT = { run: run, render: function (mode) {
    return loadFonts().then(function (f) {
      if (mode !== "page") return renderSVG(mode, f, null, null);
      var c = readPageChrome();
      return loadMark(c.markSrc).then(function (m) { return renderSVG(mode, f, c, m); });
    }); },
    readChrome: readPageChrome,
    PAGE: { width: PAGE_W, height: PAGE_H }, LOD: EXPORT_LOD };

})(typeof window !== "undefined" ? window : globalThis);
