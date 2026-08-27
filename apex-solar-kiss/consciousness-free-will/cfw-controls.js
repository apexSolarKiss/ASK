/* cfw-controls.js — the atlas navigation layer: search index, bounded sectional
   projections, and relation view.

   PURE LOGIC, NO DOM. It is required directly by the validation harness in node,
   so every claim the chrome makes about search and filtering is tested against the
   same functions the page runs — not against a re-implementation of them.

   READ-ONLY over the projection, exactly as cfw-projection.js is read-only over
   the payload. It derives no CFW identifier, relation, typing or ruling, creates
   no edge, and changes no governed state.

   THE ONE DISTINCTION THIS FILE EXISTS TO KEEP:

     LEVEL OF DETAIL   zoom-driven. Changes how much TEXT is drawn.
                       Never changes membership. Nothing is ever removed.
     FILTER            explicit. Changes PROJECTION MEMBERSHIP — which objects
                       are in this bounded section, and which existing edges are
                       drawn between them.
     Neither one changes governed relation status. An edge that is not drawn in a
     section is still a registered or recorded relation, and the inspector still
     reports it in full.

   FILTERS ARE BUILT ONLY FROM STRUCTURED FIELDS THE PAYLOAD ALREADY CARRIES.
   Where a dimension is not reliably encoded, it is declared NOT STRUCTURED and
   not offered, rather than manufactured from prose to satisfy a list.          */

(function (root) {
  "use strict";

  function norm(s) {
    return String(s === null || s === undefined ? "" : s)
      .toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  }
  function rxEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  /* ===================================================================
     SEARCH INDEX — every object in the payload, plus the map groupings.
     CFW-S evidence owners ARE indexed: they are searchable and openable,
     and they still never enter the graph.
     =================================================================== */
  function buildIndex(P) {
    var idx = [];
    P.regions.forEach(function (r) {
      idx.push({ key: r.id, kind: "region", label: r.label, sub: "conceptual region",
                 count: r.count, hay: norm(r.label + " " + r.owner) });
      r.branches.forEach(function (b) {
        idx.push({ key: b.id, kind: "branch", label: b.label, sub: r.label,
                   count: b.leaves.length,
                   hay: norm(b.label + " " + b.rawLabel + " " + r.label) });
      });
    });
    Object.keys(P.byId).forEach(function (id) {
      var o = P.byId[id], isS = o.class === "CFW-S";
      idx.push({
        key: o.id, kind: isS ? "source" : "object", label: String(o.label || o.id),
        obj: o, cls: o.class,
        sub: isS ? String(o.author || o.work || o.region || "") : String(o.region || o.owner || ""),
        hay: norm([o.id, o.label, o.section, o.node_type, o.field_domain, o.author,
                   o.work, o.question, o.region, o.evidence_class]
                  .filter(Boolean).join(" "))
      });
    });
    return idx;
  }

  var KIND_RANK = { object: 0, region: 1, branch: 2, source: 3 };

  /* Ranked match. An EXACT IDENTIFIER always wins outright — that is the whole
     point of exact-ID access, and it must not be outranked by a label that
     happens to contain the same characters. */
  function search(idx, q, limit) {
    var raw = String(q || "").trim();
    if (!raw) return [];
    var n = norm(raw), wb = new RegExp("\\b" + rxEsc(n)), out = [];
    for (var i = 0; i < idx.length; i++) {
      var e = idx[i], sc = -1;
      var kid = norm(e.key), lab = norm(e.label);
      if (kid === n) sc = 0;
      else if (kid.indexOf(n) === 0 && /^cfw-/.test(kid)) sc = 1;
      else if (lab === n) sc = 2;
      else if (lab.indexOf(n) === 0) sc = 3;
      else if (wb.test(lab)) sc = 4;
      else if (lab.indexOf(n) >= 0) sc = 5;
      else if (e.hay.indexOf(n) >= 0) sc = 6;
      if (sc >= 0) out.push({ e: e, sc: sc });
    }
    out.sort(function (a, b) {
      if (a.sc !== b.sc) return a.sc - b.sc;
      var ka = KIND_RANK[a.e.kind], kb = KIND_RANK[b.e.kind];
      if (ka !== kb) return ka - kb;
      if (a.e.label.length !== b.e.label.length) return a.e.label.length - b.e.label.length;
      return String(a.e.key).localeCompare(String(b.e.key));
    });
    return out.slice(0, limit || 40).map(function (x) { return x.e; });
  }

  /* ===================================================================
     QUESTION BEARING — derived from GOVERNED LINKS, never from prose.
     An object bears on a held question if it IS one, or if a registered or
     recorded relation connects it to one. Unedged is excluded: a declared
     NON-linkage is not a bearing.
     =================================================================== */
  function questionBearing(P) {
    var s = {};
    Object.keys(P.byId).forEach(function (id) {
      if (P.byId[id].class === "CFW-Q") s[id] = true;
    });
    P.links.forEach(function (l) {
      if (l.plane === "unedged") return;
      if (/^CFW-Q-/.test(l.to)) s[l.from] = true;
      if (/^CFW-Q-/.test(l.from)) s[l.to] = true;
    });
    return s;
  }

  /* ===================================================================
     DIMENSIONS — two families, kept apart on purpose.
       object    changes which OBJECTS are in the bounded section
       relation  changes which EXISTING edges are drawn between them
     =================================================================== */
  function dimensions(P, CLASS_NAME) {
    var qb = questionBearing(P);
    var prim = [];
    Object.keys(P.byId).forEach(function (id) {
      if (P.byId[id].class !== "CFW-S") prim.push(P.byId[id]);
    });
    function tally(fn) {
      var m = {};
      prim.forEach(function (o) { var v = fn(o); if (v) m[v] = (m[v] || 0) + 1; });
      return m;
    }
    var dims = [];

    dims.push({ key: "region", family: "object", title: "conceptual region",
      note: "the conceptual region the object is recorded in",
      options: P.regions.map(function (r) {
        return { v: r.owner, label: r.label, n: r.count }; }) });

    var cc = tally(function (o) { return o.class; });
    dims.push({ key: "cls", family: "object", title: "object class",
      note: "the CFW class the payload assigns",
      options: Object.keys(cc).sort().map(function (c) {
        return { v: c, label: c + " — " + String(CLASS_NAME[c] || "").split(" — ")[0], n: cc[c] }; }) });

    var sc = tally(function (o) { return P.governedState(o); });
    dims.push({ key: "state", family: "object", title: "governed state",
      note: "read off status / state / disposition — the same field colour encodes",
      options: P.states.filter(function (s) { return sc[s.role]; }).map(function (s) {
        return { v: s.role, label: s.label, n: sc[s.role], swatch: s.role }; }) });

    var qn = prim.filter(function (o) { return qb[o.id]; }).length;
    dims.push({ key: "qbear", family: "object", title: "held-question bearing",
      note: "IS a held question, or carries a governed relation to one — declared non-linkages excluded",
      options: [{ v: "yes", label: "bears on a held question", n: qn },
                { v: "no",  label: "no question relation", n: prim.length - qn }] });

    var fd = tally(function (o) { return o.field_domain; });
    var fdKeys = Object.keys(fd).sort(function (a, b) { return fd[b] - fd[a]; });
    dims.push({ key: "fdom", family: "object", title: "field domain",
      note: "SPARSE — only " + fdKeys.reduce(function (t, k) { return t + fd[k]; }, 0) +
            " of " + prim.length + " primary objects carry this field. Filtering on it " +
            "bounds the section to those that do; it does not mean the rest are unclassified.",
      options: fdKeys.map(function (k) { return { v: k, label: k, n: fd[k] }; }) });

    var pl = {};
    P.links.forEach(function (l) { pl[l.plane] = (pl[l.plane] || 0) + 1; });
    dims.push({ key: "plane", family: "relation", title: "relationship plane",
      note: "which existing edges are DRAWN. Unedged context is never drawn at any setting — " +
            "a line would assert the linkage the record denies.",
      options: [
        { v: "registered", label: "registered relation — CFW-R, canonical, directed", n: pl.registered || 0 },
        { v: "recorded",   label: "recorded reference — a carrier field", n: pl.recorded || 0 },
        { v: "unedged",    label: "unedged context — never drawn, inspector only",
          n: pl.unedged || 0, locked: true }
      ] });

    var rt = {};
    P.links.forEach(function (l) { if (l.plane === "registered" && l.type) rt[l.type] = (rt[l.type] || 0) + 1; });
    dims.push({ key: "rtype", family: "relation", title: "registered relation type",
      note: "the type recorded on the eight canonical CFW-R relations",
      options: Object.keys(rt).sort().map(function (t) { return { v: t, label: t, n: rt[t] }; }) });

    return dims;
  }

  /* Dimensions named by the ratified plan that this family does NOT encode
     reliably. Declared, not manufactured. */
  function notOffered(P) {
    var prim = 0, axes = 0;
    Object.keys(P.byId).forEach(function (id) {
      var o = P.byId[id];
      if (o.class === "CFW-S") return;
      prim++;
      if (o.axes_addressed && String(o.axes_addressed).trim()) axes++;
    });
    return [{
      key: "axes", title: "axes addressed",
      reason: "NOT STRUCTURED on primary objects — " + axes + " of " + prim + " carry it. " +
              "It is a CFW-S ledger field; it is shown in the evidence-owner inspector instead."
    }];
  }

  /* ===================================================================
     PREDICATES — an empty selection means the dimension is INACTIVE, which
     is not the same as selecting nothing. Default load is therefore the
     complete map with no exclusion.
     =================================================================== */
  function objectPredicate(P, sel, qb) {
    qb = qb || questionBearing(P);
    var on = function (k) { return sel[k] && sel[k].length; };
    return function (o) {
      if (on("region") && sel.region.indexOf(o.region || o.owner) < 0) return false;
      if (on("cls")    && sel.cls.indexOf(o.class) < 0) return false;
      if (on("state")  && sel.state.indexOf(P.governedState(o)) < 0) return false;
      if (on("fdom")   && sel.fdom.indexOf(o.field_domain) < 0) return false;
      if (on("qbear")) {
        var v = qb[o.id] ? "yes" : "no";
        if (sel.qbear.indexOf(v) < 0) return false;
      }
      return true;
    };
  }

  /* UNEDGED IS STRUCTURALLY UNDRAWABLE. It is offered in the plane list so the
     reader can see it exists and read its count, but selecting it can never
     produce a line — the predicate refuses it regardless of selection. */
  function relationPredicate(sel) {
    var on = function (k) { return sel[k] && sel[k].length; };
    return function (l) {
      if (l.plane === "unedged") return false;
      if (on("plane") && sel.plane.indexOf(l.plane) < 0) return false;
      if (on("rtype")) {
        if (l.plane !== "registered") return false;
        if (sel.rtype.indexOf(l.type) < 0) return false;
      }
      return true;
    };
  }

  function activeCount(sel) {
    var n = 0;
    Object.keys(sel).forEach(function (k) { if (sel[k] && sel[k].length) n++; });
    return n;
  }
  function emptySelection() {
    return { region: [], cls: [], state: [], qbear: [], fdom: [], plane: [], rtype: [] };
  }

  root.CFWControls = {
    norm: norm, buildIndex: buildIndex, search: search,
    questionBearing: questionBearing, dimensions: dimensions, notOffered: notOffered,
    objectPredicate: objectPredicate, relationPredicate: relationPredicate,
    activeCount: activeCount, emptySelection: emptySelection
  };
})(typeof window !== "undefined" ? window : globalThis);
