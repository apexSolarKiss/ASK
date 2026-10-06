/* cfw-map.js — the map page's instance: it mounts the design-system interactive radial pattern
   over the published payload with this map's adapter (cfw-map-adapter.js), and keeps the map's
   existing links working.

   EXISTING LINKS. The map has always been opened at a bare identifier, map/#CFW-N-217: the
   conclusions search links that way, and so do published pages elsewhere. The pattern's own
   deep-link form is #node=<id>. A bare hash naming a payload object is rewritten to that form in
   place, before the instance mounts and on every later change, and the pattern's own arrival then
   selects and centres the object, or opens an evidence owner's record. Only a known payload id is
   rewritten: the skip target, an empty hash and an unknown id are left alone, so they land on the
   ordinary map as before. ?export=png and ?export=png-diagram still run the page or the diagram
   plate once the map is drawn, through the pattern's export service.

   ARRIVAL FOCUS. A link lands the reader on the panel it opened, as the map always has: once the
   target the address names has actually opened, a placed object selected or an evidence owner's
   record shown, focus moves to the inspector, without scrolling and without moving the camera. Only
   an arrival does this: the first, which the pattern makes while it mounts, and every later one,
   from a changed address or from history. An empty, malformed or unknown address, an ordinary
   anchor, and every selection, hover, render or resize leave focus where it is.

   It reaches the pattern only through its documented surface: mount, the arrival form and event,
   the reported state, and the export service. */
(function () {
  "use strict";

  var cfg = window.CFW_RADIAL, D = window.CFW_ATLAS;
  var host = document.querySelector("[data-radial]");
  if (!cfg || !D || !host || !window.DIAGRAM_RADIAL) return;

  var known = new Set();
  D.objects.forEach(function (o) { known.add(o.id); });
  function legacy(hash) {
    var m = /^#([^=&]+)$/.exec(hash || "");
    if (!m) return null;
    var id;
    try { id = decodeURIComponent(m[1]); } catch (e) { return null; }
    return known.has(id) ? id : null;
  }

  var first = legacy(location.hash);
  if (first) history.replaceState(history.state, "", location.pathname + location.search + "#node=" + encodeURIComponent(first));

  var map = window.DIAGRAM_RADIAL.mount({ host: host, data: cfg.data, adapter: cfg.adapter, modules: cfg.modules });
  window.CFW_MAP = map;

  /* the target opened is the one the arrival named: a record in the inspector, or a placed object
     selected and shown there */
  var inspector = host.querySelector('[data-radial-slot="inspector"]');
  function opened(id) {
    var s = map.state(), insp = s.inspector;
    if (!id || !insp || insp.target !== id) return false;
    return insp.view === "record" || s.selection.locked === id;
  }
  function land(id) {
    if (!inspector || !opened(id)) return;
    try { inspector.focus({ preventScroll: true }); } catch (e) { inspector.focus(); }
  }
  var initial = map.report().arrival;                  /* made while the pattern mounted */
  if (initial) land(initial.id);
  map.on("arrival", function (ev) { land(ev.id); });

  window.addEventListener("hashchange", function () {
    var id = legacy(location.hash);
    if (id) location.replace("#node=" + encodeURIComponent(id));
  });

  var q = String(location.search || "");
  var plate = /[?&]export=png-diagram(&|$)/.test(q) ? "diagram" : /[?&]export=png(&|$)/.test(q) ? "page" : null;
  var exp = plate && map.service("export");
  if (exp) exp.run(plate, { download: true }).catch(function () { /* the control reports the failure */ });
})();
