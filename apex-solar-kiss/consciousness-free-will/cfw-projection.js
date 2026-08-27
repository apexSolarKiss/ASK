/* cfw-projection.js — conceptual projection of the CFW relation atlas.

   READ-ONLY over window.CFW_ATLAS. It mutates no source object and derives no new
   CFW identifier, relation, typing or ruling. It is a PROJECTION CHOICE about how
   to READ the existing payload, not a change to the payload. Semantic-payload
   parity against the v4 prototype is proven in PARITY-RECEIPT.md.

   THE DECLARED GROUPING RULE, applied uniformly to every non-CFW-S object:

     REGION  = the conceptual region (public `region`; internally the owner carrier)
     BRANCH  = first available of:  field_domain
                                 -> the SECTION-NUMBER SPINE (a shared roman or
                                    numeric section prefix, >= 2 in the region)
                                 -> a SHARED full section (>= 2, and not a
                                    per-object legacy register ID)
                                 -> node_type
                                 -> "unsectioned"
     LEAF    = the object itself, read by its human `label`

   The fallback ladder is VISIBLE, not hidden: each branch reports the key that
   produced it, and the surface says so. That matters, because the corpus is not
   uniform. `free-will-agency` carries a genuine topical section spine (II.1-II.5)
   and its branches read as theories. `consciousness` carries a per-object legacy
   register ID and no topical spine, so its branches fall back to node_type and
   read as a TYPOLOGY. The map reports that difference rather than inventing a
   topical structure the carrier does not have.

   CFW-S evidence owners stay in the DATA + INSPECTOR plane rather than as primary
   graph nodes. That is v4's declared plane assignment, PRESERVED here unchanged:
   it is not an exclusion filter, and every CFW-S referenced by an edge remains
   resolvable by exact ID in the inspector.                                      */

(function (root) {
  "use strict";

  var REGION_LABEL = {
    "consciousness_master-context-note.md":               "Consciousness",
    "free-will-agency_master-context-note.md":            "Free will + agency",
    "machine-personhood-recourse_master-context-note.md": "Machine personhood + recourse",
    "consciousness-free-will_master-context-note.md":     "The hub // shared frame",
    "consciousness-free-will_relation-map.md":            "Relation map",
    "consciousness-free-will_source-ledger.md":           "Evidence ledger"
  };
  var REGION_ORDER = [
    "consciousness_master-context-note.md",
    "free-will-agency_master-context-note.md",
    "machine-personhood-recourse_master-context-note.md",
    "consciousness-free-will_master-context-note.md",
    "consciousness-free-will_relation-map.md"
  ];

  /* REGION KEY.  The region partition is TOPOLOGY: it is the first level of the
     projection tree and the map is drawn from it. The internal payload keys it on
     `owner`, an internal carrier filename. The PUBLIC payload denies that filename
     and carries `region` — the same partition, named by its public label.

     Reading `owner` directly therefore breaks on public data: every object resolves
     to `undefined`, all 548 collapse into one unnamed region, and the five named
     regions render empty. Both payload shapes resolve through this one accessor. */
  function regionKeyOf(o) { return o.region || REGION_LABEL[o.owner] || o.owner; }
  var REGION_ORDER_KEYS = REGION_ORDER.map(function (f) { return REGION_LABEL[f] || f; });

  /* GOVERNED STATE -> Spectral State role. Color encodes governed state ONLY.
     Every mapping below is read off a field the payload already carries. */
  var STATES = [
    { role: "earned",     label: "ASK-ruled",        meaning: "adjudicated by a ruling" },
    { role: "held",       label: "re-held",          meaning: "re-held in sharper form" },
    { role: "partial",    label: "partially tested", meaning: "an open obligation" },
    { role: "deflated",   label: "contested",        meaning: "recorded and contested" },
    { role: "external",   label: "unclassified",     meaning: "admitted, untyped" },
    { role: "structural", label: "ASK-typed",        meaning: "an ASK mapping row" },
    { role: "neutral",    label: "recorded",         meaning: "no governed state" }
  ];

  function governedState(o) {
    var s = [o.status, o.state, o.disposition].filter(Boolean).join(" - ");
    if (!s) return (o.class === "CFW-M" || o.class === "CFW-A") ? "structural" : "neutral";
    var u = s.toUpperCase();
    if (u.indexOf("UNCLASSIFIED") >= 0)        return "external";
    if (u.indexOf("RE-HELD") >= 0)             return "held";
    if (u.indexOf("ASK-RULED") >= 0 ||
        u.indexOf("RULED CONDITIONALLY") >= 0) return "earned";
    if (u.indexOf("PARTIALLY TESTED") >= 0)    return "partial";
    if (u.indexOf("CONTESTED") >= 0)           return "deflated";
    if (u.indexOf("RECORDED") >= 0)            return "neutral";
    return "neutral";
  }

  function humanizeBranch(key, alreadyComposed) {
    if (!key) return "unsectioned";
    var s = String(key).replace(/^[§\s]+/, "").trim();
    if (!alreadyComposed)
      s = s.replace(/^([IVXLC]+(?:\.\d+)*[a-z]?)\s*[—–-]?\s*/, "$1 / ");
    s = s.replace(/\s*\/\s*/g, " / ").replace(/(\s\/\s)+/g, " / ")
         .replace(/\s*\/\s*$/, "").trim();
    return s.length > 62 ? s.slice(0, 60).replace(/[\s/,-]+$/, "") + "…" : s;
  }

  function build(A) {
    var objs = A.objects, byId = {};
    for (var i = 0; i < objs.length; i++) byId[objs[i].id] = objs[i];

    var primary  = objs.filter(function (o) { return o.class !== "CFW-S"; });
    var evidence = objs.filter(function (o) { return o.class === "CFW-S"; });

    /* --- pass 1: section-number spine + shared full sections --- */
    function sectionPrefix(s) {
      var m = String(s || "").match(/^\s*(?:§\s*)?([IVXLC]+(?:\.\d+)*|\d+(?:\.\d+)+)(?![\w])/);
      return m ? m[1] : null;
    }
    /* head phrase = the descriptive text after the number, before the first
       separator. Used to give a numbered branch a HUMAN name. */
    function sectionHead(s) {
      var p = sectionPrefix(s); if (!p) return null;
      var rest = String(s).replace(/^\s*(?:§\s*)?/, "").slice(p.length);
      rest = rest.replace(/^[\s/—–-]+/, "").split(/[—–,;:]|\s\/\s/)[0].trim();
      return rest ? rest.replace(/\s+/g, " ") : null;
    }
    var secCount = {}, preCount = {}, preHeads = {};
    primary.forEach(function (o) {
      var s = (o.section || "").trim();
      if (!s || /^legacy register ID/i.test(s)) return;
      var rk = regionKeyOf(o);
      secCount[rk + " " + s] = (secCount[rk + " " + s] || 0) + 1;
      var p = sectionPrefix(s);
      if (p) {
        var pk = rk + " " + p;
        preCount[pk] = (preCount[pk] || 0) + 1;
        var h = sectionHead(s);
        if (h) { preHeads[pk] = preHeads[pk] || {}; preHeads[pk][h] = (preHeads[pk][h] || 0) + 1; }
      }
    });
    /* a numbered branch is named by its two most frequent head phrases */
    function prefixLabel(pk, p) {
      var hs = preHeads[pk] ? Object.keys(preHeads[pk])
                 .sort(function (a, b) { return preHeads[pk][b] - preHeads[pk][a]; }) : [];
      if (!hs.length) return p;
      var pick = hs.slice(0, 2).map(function (h) {
        h = h.replace(/^[§\s]+/, "");
        return h.length > 30 ? h.slice(0, 29).replace(/[\s/,-]+$/, "") + "…" : h;
      });
      return p + " / " + pick.join(" + ");
    }

    function branchKey(o) {
      if (o.field_domain && String(o.field_domain).trim())
        return { k: "fd:" + o.field_domain, src: "field_domain", raw: o.field_domain, pre: false };
      var s = (o.section || "").trim();
      if (s && !/^legacy register ID/i.test(s)) {
        var p = sectionPrefix(s), pk = regionKeyOf(o) + " " + p;
        if (p && preCount[pk] >= 2)
          return { k: "pre:" + p, src: "section-spine", raw: prefixLabel(pk, p), pre: true };
        if (secCount[regionKeyOf(o) + " " + s] >= 2)
          return { k: "sec:" + s, src: "section", raw: s, pre: false };
      }
      if (o.node_type && String(o.node_type).trim())
        return { k: "nt:" + o.node_type, src: "node_type", raw: o.node_type, pre: false };
      return { k: "un:", src: "unsectioned", raw: "unsectioned", pre: false };
    }

    /* --- build the region -> branch -> leaf tree --- */
    var regions = [], regionIdx = {};
    REGION_ORDER_KEYS.forEach(function (key) {
      var r = { kind: "region", id: "REGION::" + key, owner: key,
                label: REGION_LABEL[key] || key, branches: [], count: 0 };
      regionIdx[key] = r; regions.push(r);
    });

    primary.forEach(function (o) {
      var rkey = regionKeyOf(o);
      var r = regionIdx[rkey];
      if (!r) {                                   // fail-open, never silently drop
        r = { kind: "region", id: "REGION::" + rkey, owner: rkey,
              label: REGION_LABEL[rkey] || rkey, branches: [], count: 0 };
        regionIdx[rkey] = r; regions.push(r);
      }
      var bk = branchKey(o), bid = r.id + "|" + bk.k;
      var b = null;
      for (var j = 0; j < r.branches.length; j++) if (r.branches[j].id === bid) { b = r.branches[j]; break; }
      if (!b) {
        b = { kind: "branch", id: bid, label: humanizeBranch(bk.raw, bk.pre),
              rawLabel: String(bk.raw), src: bk.src, region: r, leaves: [] };
        r.branches.push(b);
      }
      b.leaves.push(o); r.count++;
    });

    regions = regions.filter(function (r) { return r.count > 0; });
    regions.forEach(function (r) {
      r.branches.sort(function (a, b) { return b.leaves.length - a.leaves.length; });
      r.branches.forEach(function (b) {
        b.leaves.sort(function (x, y) { return String(x.id).localeCompare(String(y.id)); });
      });
    });

    /* --- typed cross-links between PRIMARY objects (evidence links stay in the
           inspector plane). Plane is encoded by LINE, never by hue. --- */
    var links = [];
    (A.registered || []).forEach(function (e) {
      if (byId[e.from] && byId[e.to])
        links.push({ plane: "registered", from: e.from, to: e.to, type: e.type,
                     id: e.id, note: e.prose_home_register || e.prose_home || "" });
    });
    (A.recorded || []).forEach(function (e) {
      var a = byId[e.from], b = byId[e.to];
      if (!a || !b || a.class === "CFW-S" || b.class === "CFW-S") return;  // evidence -> inspector
      links.push({ plane: "recorded", from: e.from, to: e.to, type: e.kind,
                   id: null, note: e.source_field || "" });
    });
    (A.unedged || []).forEach(function (e) {
      if (byId[e.from] && byId[e.to])
        links.push({ plane: "unedged", from: e.from, to: e.to, type: "declared non-linkage",
                     id: null, note: e.reason || "" });
    });

    /* --- evidence index: every CFW-S referenced by an edge stays resolvable --- */
    var evidenceFor = {};
    (A.recorded || []).forEach(function (e) {
      var a = byId[e.from], b = byId[e.to];
      if (a && b && b.class === "CFW-S") (evidenceFor[e.from] = evidenceFor[e.from] || []).push(b);
      else if (a && b && a.class === "CFW-S") (evidenceFor[e.to] = evidenceFor[e.to] || []).push(a);
    });

    /* --- always-labelled spine: the governed objects the family turns on --- */
    var pinned = {};
    primary.forEach(function (o) {
      if (o.class === "CFW-Q" || o.class === "CFW-A" || o.class === "CFW-X") pinned[o.id] = true;
    });

    var degree = {};
    links.forEach(function (l) { degree[l.from] = (degree[l.from] || 0) + 1;
                                 degree[l.to]   = (degree[l.to]   || 0) + 1; });

    return {
      root: { kind: "root", id: "ROOT", label: "Consciousness + free will" },
      regions: regions, links: links, byId: byId, evidenceFor: evidenceFor,
      pinned: pinned, degree: degree, states: STATES,
      governedState: governedState,
      counts: {
        objects: objs.length, primary: primary.length, evidence: evidence.length,
        regions: regions.length,
        branches: regions.reduce(function (n, r) { return n + r.branches.length; }, 0),
        links: links.length,
        registered: links.filter(function (l) { return l.plane === "registered"; }).length,
        recorded:   links.filter(function (l) { return l.plane === "recorded"; }).length,
        unedged:    links.filter(function (l) { return l.plane === "unedged"; }).length
      }
    };
  }

  root.CFWProjection = { build: build, STATES: STATES, REGION_LABEL: REGION_LABEL };
})(typeof window !== "undefined" ? window : globalThis);
