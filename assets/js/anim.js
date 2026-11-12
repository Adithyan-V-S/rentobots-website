/*!
 * anim.js — Rentobots scroll animations (no dependencies)
 * 1. Fade-up reveal: sections and cards slide up as they scroll into view.
 * 2. Count-up: elements with data-count="N" count from 0 to N when visible.
 * The hero entrance and card hover lift are pure CSS (see styles.css).
 *
 * Safety: nothing is hidden that is already on screen; elements are revealed
 * by a plain scroll/resize position check (no IntersectionObserver needed);
 * a counter only changes its number once counting has really started.
 * Does nothing when the visitor has "reduce motion" turned on.
 * Interactive pages may redraw and strip the classes added here; that only
 * means the content shows without animation, never that it stays hidden.
 */
(function () {
  'use strict';
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!document.documentElement.classList) return;

  function vh() { return window.innerHeight || document.documentElement.clientHeight; }
  function rect(el) { return el.getBoundingClientRect(); }
  function onScreen(el, frac) {
    var r = rect(el), h = vh();
    return r.top < h * (frac || 1) && r.bottom > 0;
  }
  function isGrid(el) { return (el.getAttribute('style') || '').indexOf('display: grid') !== -1; }

  // ---- collect reveal targets --------------------------------------------
  var targets = [];
  function collect(el) {
    if (el.nodeType !== 1 || el.tagName === 'TEMPLATE' || el.tagName === 'SCRIPT') return;
    if (isGrid(el)) {
      for (var c = el.firstElementChild; c; c = c.nextElementSibling) targets.push(c);
      return;
    }
    var kids = el.children; // a list of FAQ rows reveals row by row
    if (kids.length >= 3 && kids[0].tagName === 'DETAILS') {
      for (var j = 0; j < kids.length; j++) targets.push(kids[j]);
      return;
    }
    targets.push(el);
  }
  var sections = document.querySelectorAll('section:not(#top)');
  for (var s = 0; s < sections.length; s++) {
    var inner = sections[s].firstElementChild;
    if (!inner) continue;
    if (inner.tagName !== 'DIV' || sections[s].children.length > 1) inner = sections[s];
    for (var k = inner.firstElementChild; k; k = k.nextElementSibling) collect(k);
  }

  var pending = [];
  targets.forEach(function (el) {
    if (onScreen(el)) return; // already visible: never hide it
    el.classList.add('rb-rv');
    pending.push(el);
  });

  function reveal(el, order) {
    el.style.setProperty('--rb-d', Math.min(order, 6) * 80 + 'ms');
    el.classList.add('rb-in');
    // Remove our classes once the animation has had time to finish, so hover
    // effects and the page's own styles are untouched afterwards.
    setTimeout(function () {
      el.classList.remove('rb-rv', 'rb-in');
      el.style.removeProperty('--rb-d');
    }, 700 + Math.min(order, 6) * 80 + 150);
  }

  // ---- counters ----------------------------------------------------------
  var counters = [].slice.call(document.querySelectorAll('[data-count]'));
  function countUp(el) {
    var end = parseInt(el.getAttribute('data-count'), 10);
    if (!(end > 1)) return;
    var dur = Math.min(1400, 500 + end * 40), t0 = Date.now();
    (function step() {
      var p = Math.min(1, (Date.now() - t0) / dur);
      el.textContent = String(Math.round((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) setTimeout(step, 30);
    })();
  }

  // ---- position check on scroll/resize -----------------------------------
  var queued = false;
  function check() {
    queued = false;
    var order = 0;
    for (var i = 0; i < pending.length; i++) {
      var el = pending[i];
      if (!el.isConnected) { pending.splice(i--, 1); continue; }
      if (!el.classList.contains('rb-rv')) { pending.splice(i--, 1); continue; } // stripped by a redraw
      if (onScreen(el, 0.92)) { reveal(el, order++); pending.splice(i--, 1); }
    }
    for (var c = 0; c < counters.length; c++) {
      var n = counters[c];
      var r = rect(n);
      if (r.bottom > 0 && r.bottom < vh()) {
        counters.splice(c--, 1);
        if (n.closest('#top')) setTimeout(countUp.bind(null, n), 600); // after the hero entrance
        else countUp(n);
      }
    }
    if (!pending.length && !counters.length) {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    }
  }
  function schedule() {
    if (queued) return;
    queued = true;
    setTimeout(check, 60);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  check();
})();
