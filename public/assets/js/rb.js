/*!
 * rb.js — Rentobots micro-runtime (no dependencies, ~3 KB minified)
 * Renders a page's <template id="rb-view"> with data from a `Component` class,
 * keeps it in sync with state, and wires events. Pages are pre-rendered to static
 * HTML at build time; this script only "hydrates" pages that have interactive parts.
 *
 * Template syntax
 *   {{ path.to.value }}                  text or attribute value
 *   <sc-for list="{{ items }}" as="it">  repeat children for each item
 *   <sc-if value="{{ flag }}">           render children when truthy
 *   onclick / oninput / onchange="{{ fn }}"   event handlers from renderVals()
 */
(function () {
  'use strict';
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var WHOLE = /^\{\{\s*([^}]+?)\s*\}\}$/;

  function lookup(path, scope) {
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    if (/^(['"]).*\1$/.test(path)) return path.slice(1, -1);
    var parts = path.split('.'), v = scope;
    for (var i = 0; i < parts.length; i++) {
      if (v == null) return undefined;
      v = v[parts[i]];
    }
    return v;
  }
  function str(v) { return v == null ? '' : String(v); }
  function interpolate(text, scope) {
    return text.replace(HOLE, function (_, p) { return str(lookup(p, scope)); });
  }

  function renderChildren(src, scope, out) {
    for (var n = src.firstChild; n; n = n.nextSibling) renderNode(n, scope, out);
  }

  function renderNode(src, scope, out) {
    if (src.nodeType === 3) {
      out.push(document.createTextNode(src.data.indexOf('{{') < 0 ? src.data : interpolate(src.data, scope)));
      return;
    }
    if (src.nodeType !== 1) return;
    var tag = src.localName;
    if (tag === 'sc-for') {
      var m = WHOLE.exec(src.getAttribute('list') || '');
      var list = m ? lookup(m[1], scope) : null;
      var as = src.getAttribute('as') || 'item';
      if (list && list.length) {
        for (var i = 0; i < list.length; i++) {
          var s = Object.create(scope);
          s[as] = list[i];
          s.$index = i;
          renderChildren(src, s, out);
        }
      }
      return;
    }
    if (tag === 'sc-if') {
      var mv = WHOLE.exec(src.getAttribute('value') || '');
      if (mv && lookup(mv[1], scope)) renderChildren(src, scope, out);
      return;
    }
    var el = src.namespaceURI && src.namespaceURI !== 'http://www.w3.org/1999/xhtml'
      ? document.createElementNS(src.namespaceURI, src.tagName)
      : document.createElement(tag);
    var on = null, value;
    for (var a = 0; a < src.attributes.length; a++) {
      var attr = src.attributes[a], name = attr.name, raw = attr.value;
      if (name.indexOf('hint-') === 0) continue;
      var whole = WHOLE.exec(raw);
      if (name.length > 2 && name.slice(0, 2) === 'on' && whole) {
        var fn = lookup(whole[1], scope);
        if (typeof fn === 'function') (on || (on = {}))[name.slice(2)] = fn;
        continue;
      }
      var v;
      if (whole) {
        v = lookup(whole[1], scope);
        if (v == null || v === false) continue;
        v = v === true ? '' : String(v);
      } else {
        v = raw.indexOf('{{') < 0 ? raw : interpolate(raw, scope);
      }
      if (name === 'value') value = v;
      el.setAttribute(name, v);
    }
    if (on) el.__rbOn = on;
    var kids = [];
    renderChildren(src, scope, kids);
    for (var k = 0; k < kids.length; k++) el.appendChild(kids[k]);
    if (value !== undefined && 'value' in el) el.value = value;
    out.push(el);
  }

  function bind(el) {
    var on = el.__rbOn;
    if (!on) return;
    el.__rbBound = el.__rbBound || {};
    Object.keys(on).forEach(function (type) {
      if (el.__rbBound[type]) return;
      el.__rbBound[type] = true;
      el.addEventListener(type, function (e) {
        var h = el.__rbOn && el.__rbOn[type];
        if (h) h(e);
      });
    });
  }

  // Patch `a` (live DOM) to match `b` (fresh render) without replacing nodes,
  // so focus, cursor position and scroll survive re-renders.
  function morph(a, b) {
    if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) {
      a.parentNode.replaceChild(b, a);
      walkBind(b);
      return;
    }
    if (a.nodeType === 3) { if (a.data !== b.data) a.data = b.data; return; }
    if (a.nodeType !== 1) return;
    var i, at;
    for (i = a.attributes.length - 1; i >= 0; i--) {
      at = a.attributes[i].name;
      if (!b.hasAttribute(at)) a.removeAttribute(at);
    }
    for (i = 0; i < b.attributes.length; i++) {
      at = b.attributes[i];
      if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
    }
    a.__rbOn = b.__rbOn;
    bind(a);
    var ac = a.childNodes, bc = Array.prototype.slice.call(b.childNodes);
    for (i = 0; i < bc.length; i++) {
      if (i < ac.length) morph(ac[i], bc[i]);
      else { a.appendChild(bc[i]); walkBind(bc[i]); }
    }
    while (a.childNodes.length > bc.length) a.removeChild(a.lastChild);
    if ('value' in a && b.hasAttribute('value') && a !== document.activeElement) {
      var nv = b.getAttribute('value');
      if (a.value !== nv) a.value = nv;
    }
  }
  function walkBind(n) {
    if (n.nodeType !== 1) return;
    bind(n);
    for (var c = n.firstElementChild; c; c = c.nextElementSibling) walkBind(c);
  }

  function DCLogic(props) {
    this.props = props || {};
    this.state = {};
  }
  DCLogic.prototype.setState = function (patch) {
    var next = typeof patch === 'function' ? patch(this.state, this.props) : patch;
    this.state = Object.assign({}, this.state, next);
    if (this.__rbSchedule) this.__rbSchedule();
  };
  DCLogic.prototype.forceUpdate = function () { if (this.__rbSchedule) this.__rbSchedule(); };
  window.DCLogic = DCLogic;

  function renderRoot(tpl, inst) {
    var out = [];
    renderChildren(tpl.content, inst.renderVals() || {}, out);
    for (var i = 0; i < out.length; i++) if (out[i].nodeType === 1) return out[i];
    return null;
  }

  window.RB = {
    // Pre-render (build time) and hydrate (in the browser) share this path.
    render: function (Component, props, tpl) {
      tpl = tpl || document.getElementById('rb-view');
      return renderRoot(tpl, new Component(props || {}));
    },
    mount: function (Component, props, opts) {
      opts = opts || {};
      var tpl = document.getElementById('rb-view');
      var root = document.querySelector(opts.root || '[data-rb-root]');
      if (!tpl || !root) return;
      var inst = new Component(props || {});
      var queued = false;
      inst.__rbSchedule = function () {
        if (queued) return;
        queued = true;
        (window.requestAnimationFrame || setTimeout)(function () {
          queued = false;
          var next = renderRoot(tpl, inst);
          next.setAttribute('data-rb-root', '');
          morph(root, next);
        });
      };
      var first = renderRoot(tpl, inst);
      first.setAttribute('data-rb-root', '');
      morph(root, first);
      if (typeof inst.componentDidMount === 'function') inst.componentDidMount();
    }
  };
})();
