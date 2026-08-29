/* ATHLETE BRIDGE
   js/articles.json を読み込んで、トップと記事ページを描画する。
   見た目は Claude Design のキャンバス（Athlete bridge.dc.html）に合わせている。
   スクロール演出（フェードイン・パララックス・進捗バー）もデザイン側の実装を移植した。 */

(function () {
  'use strict';

  var FEATURED_COUNT = 5;   // ヒーローで回す本数（デザインの仕様）
  var ROTATE_MS = 8000;     // 切り替え間隔

  var state = {
    articles: [],
    feat: 0,
    subscribed: false
  };
  var rotateTimer = null;

  // ---- 小道具 ----

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatDate(iso) {
    var p = String(iso).split('-');
    return p.length === 3 ? p[0] + '.' + p[1] + '.' + p[2] : iso;
  }

  function pad3(n) { return ('00' + n).slice(-3); }

  function el(id) { return document.getElementById(id); }

  /* 日付の古い順に 001, 002... と通し番号を振る。
     デザインが INTERVIEW 024 のような号数を前提にしているため。 */
  function withNumbers(articles) {
    var byOld = articles.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    byOld.forEach(function (a, i) { a.no = pad3(i + 1); });
    return articles.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }); // 新しい順
  }

  function articleById(id) {
    return state.articles.find(function (a) { return a.id === id; });
  }

  function bylineOf(a) { return a.company + '　' + a.personRole + '　' + a.personName; }

  // ---- ヒーロー ----

  function featuredList() { return state.articles.slice(0, FEATURED_COUNT); }

  function renderHero() {
    var list = featuredList();
    if (!list.length) return;
    var a = list[state.feat % list.length];

    el('hero-slot').innerHTML =
      '<div class="hero-no-row">' +
        '<span class="hero-no">INTERVIEW ' + escapeHtml(a.no) + '</span>' +
        '<span class="hero-rule"></span>' +
      '</div>' +
      '<h1 class="hero-title">' + escapeHtml(a.title) + '</h1>' +
      '<p class="hero-lead">' + escapeHtml(a.excerpt) + '</p>';

    el('hero-media').innerHTML =
      '<div class="hero-frame">' +
        '<div class="hero-shot">' +
          imgTag(a, 'hero-img', '0.14') +
          '<div class="hero-scrim"></div>' +
          '<div class="hero-frame-meta">' +
            '<span>' + escapeHtml(a.category) + '</span>' +
            '<span class="hero-frame-num">' + escapeHtml(a.no) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="hero-card">' +
        '<div class="hero-name">' + escapeHtml(a.personName) +
          '<span class="hero-role">' + escapeHtml(a.company + ' ' + a.personRole) + '</span>' +
        '</div>' +
      '</div>';

    el('hero-dots').innerHTML = list.map(function (_, i) {
      return '<button type="button" class="hero-dot' + (i === state.feat % list.length ? ' is-active' : '') +
             '" data-feat="' + i + '" aria-label="' + (i + 1) + '本目を表示"></button>';
    }).join('');

    el('hero-read').onclick = function () { location.hash = a.id; };
    bindParallax();
  }

  function imgTag(a, cls, parallax) {
    if (!a.image) return '<div class="' + cls + '"></div>';
    return '<img class="' + cls + '" src="' + escapeHtml(a.image) + '" alt="' + escapeHtml(a.personName) + '"' +
           (parallax ? ' data-parallax="' + parallax + '"' : '') + '>';
  }

  function startRotation() {
    clearInterval(rotateTimer);
    rotateTimer = setInterval(function () {
      var n = featuredList().length;
      if (n < 2) return;
      state.feat = (state.feat + 1) % n;
      renderHero();
    }, ROTATE_MS);
  }

  // ---- ティッカー ----

  function renderTicker() {
    var items = state.articles.reduce(function (acc, a) {
      return acc.concat(['VOL.' + a.no + '  ' + a.personName, '◆', 'EXECUTIVE INTERVIEWS', '◆']);
    }, []);
    var group = '<div class="ticker-group">' +
      items.map(function (t) { return '<span>' + escapeHtml(t) + '</span>'; }).join('') +
      '</div>';
    el('ticker').innerHTML = group + group; // 途切れないよう2つ並べる
  }

  // ---- 一覧 ----

  function renderList() {
    var arr = state.articles;
    el('latest-range').textContent = arr.length
      ? arr[0].no + ' — ' + arr[arr.length - 1].no + ' / 全' + arr.length + '本'
      : '';

    el('list').innerHTML = arr.map(function (a) {
      return '<a class="row" href="#' + escapeHtml(a.id) + '" data-reveal="deep">' +
        '<span class="row-no">' + escapeHtml(a.no) + '</span>' +
        '<div class="row-body">' +
          '<div class="row-meta"><span>' + escapeHtml(a.category) + '</span><span>' + formatDate(a.date) + '</span></div>' +
          '<h3 class="row-title">' + escapeHtml(a.title) + '</h3>' +
          '<p class="row-name">' + escapeHtml(a.personName) + ' — ' + escapeHtml(a.company) + ' ' + escapeHtml(a.personRole) + '</p>' +
        '</div>' +
        '<div class="row-thumb">' + imgTag(a, 'row-img', '0.06') + '</div>' +
      '</a>';
    }).join('');
  }

  // ---- 記事ページ ----

  function renderBlock(b) {
    switch (b.type) {
      case 'h':     return '<h2>' + escapeHtml(b.text) + '</h2>';
      case 'quote': return '<blockquote>' + escapeHtml(b.text) + '</blockquote>';
      case 'link':  return '<p class="article-link"><a href="' + escapeHtml(b.url) + '" target="_blank" rel="noopener">' + escapeHtml(b.text) + '</a></p>';
      case 'p':
      default:
        var label = b.label ? '<strong>' + escapeHtml(b.label) + '：</strong>' : '';
        return '<p>' + label + escapeHtml(b.text) + '</p>';
    }
  }

  function renderArticle(a) {
    el('art-no').textContent = 'INTERVIEW ' + a.no;
    el('art-meta').innerHTML = '<span>' + escapeHtml(a.category) + '</span><span>' + formatDate(a.date) + '</span>';
    el('art-title').textContent = a.title;
    el('art-byline').textContent = bylineOf(a);

    /* 写真は切り取らずに全体を見せ、余る左右は同じ写真のぼかしで埋める */
    el('art-figure').innerHTML = a.image
      ? '<img class="art-figure-bg" src="' + escapeHtml(a.image) + '" alt="" aria-hidden="true">' +
        '<img src="' + escapeHtml(a.image) + '" alt="' + escapeHtml(a.personName) + '">'
      : '';

    el('art-body').innerHTML = a.blocks.map(renderBlock).join('');

    var others = state.articles.filter(function (x) { return x.id !== a.id; }).slice(0, 3);
    el('related').innerHTML = others.map(function (r) {
      return '<a class="rel-card" href="#' + escapeHtml(r.id) + '">' +
        '<div class="rel-thumb">' + imgTag(r, '') + '</div>' +
        '<div class="rel-meta"><span>' + escapeHtml(r.category) + '</span><span>' + formatDate(r.date) + '</span></div>' +
        '<h3 class="rel-title">' + escapeHtml(r.title) + '</h3>' +
        '<p class="rel-name">' + escapeHtml(r.personName) + '</p>' +
      '</a>';
    }).join('');
  }

  // ---- 表示の切り替え ----

  function showTop() {
    el('view-top').classList.remove('is-hidden');
    el('view-article').classList.add('is-hidden');
    document.title = 'ATHLETE BRIDGE｜アスリートのセカンドキャリアを、経営者が語る。';
    startRotation();
    applyReveal();
  }

  function showArticle(a) {
    clearInterval(rotateTimer);
    el('view-top').classList.add('is-hidden');
    el('view-article').classList.remove('is-hidden');
    renderArticle(a);
    document.title = a.title + '｜ATHLETE BRIDGE';
    window.scrollTo(0, 0);
    applyReveal();
  }

  function route() {
    var id = location.hash.replace(/^#/, '');
    var a = id && articleById(id);
    if (a) { showArticle(a); return; }
    showTop();
    // #latest / #newsletter などページ内リンクはそのまま効かせる
    if (id) {
      var target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // ---- スクロール演出（デザイン側の実装を移植） ----

  var EASE = 'cubic-bezier(.19,.9,.22,1)';
  var HIDDEN = {
    up: 'translateY(34px)', left: 'translateX(-38px)',
    right: 'translateX(38px)', deep: 'translateY(56px) scale(.985)'
  };
  var pendingReveal = [];

  /* 画面の下にある要素だけを隠しておき、スクロールで近づいたら表示する。
     判定はスクロール処理と同じ経路で行う。IntersectionObserver は
     描画の直後だと発火しないことがあり、中身が出ないまま残る恐れがあるため使わない。 */
  function applyReveal() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]:not([data-revealed])'));
    var vh = window.innerHeight || 800;

    els.forEach(function (e) {
      if (e.getBoundingClientRect().top > vh * 0.92) {
        var k = e.getAttribute('data-reveal') || 'up';
        e.style.transition = 'opacity 1.05s ' + EASE + ', transform 1.15s ' + EASE + ', clip-path 1.15s ' + EASE;
        if (k === 'mask') { e.style.clipPath = 'inset(0 0 100% 0)'; }
        else { e.style.opacity = '0'; e.style.transform = HIDDEN[k] || HIDDEN.up; }
        if (pendingReveal.indexOf(e) < 0) pendingReveal.push(e);
      } else {
        showReveal(e);
      }
    });
    flushReveal();
  }

  function showReveal(e) {
    e.style.opacity = '1';
    e.style.transform = 'none';
    e.style.clipPath = 'inset(0 0 0 0)';
    e.setAttribute('data-revealed', '1');
  }

  function flushReveal() {
    if (!pendingReveal.length) return;
    var vh = window.innerHeight || 800;
    var shown = 0;
    pendingReveal = pendingReveal.filter(function (e) {
      if (e.getBoundingClientRect().top > vh * 0.9) return true;
      setTimeout(function () { showReveal(e); },
                 parseInt(e.getAttribute('data-delay') || '0', 10) + Math.min(shown++ * 90, 540));
      return false;
    });
  }

  var parallaxEls = [];
  var progressEls = [];
  var queued = false;

  function bindParallax() {
    parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    onScroll();
  }

  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      var vh = window.innerHeight || 800;
      parallaxEls.forEach(function (e) {
        var r = e.getBoundingClientRect();
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        var s = parseFloat(e.getAttribute('data-parallax')) || 0.1;
        e.style.transform = 'translate3d(0,' + (-p * s * 100).toFixed(2) + 'px,0) scale(' + (1 + s * 0.35).toFixed(3) + ')';
      });
      var doc = document.documentElement;
      var t = Math.min(1, Math.max(0, doc.scrollTop / Math.max(1, doc.scrollHeight - doc.clientHeight)));
      progressEls.forEach(function (e) { e.style.transform = 'scaleX(' + t.toFixed(4) + ')'; });
      flushReveal();
    });
  }

  // ---- 起動 ----

  function bindEvents() {
    el('hero-dots').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-feat]');
      if (!b) return;
      state.feat = parseInt(b.getAttribute('data-feat'), 10);
      renderHero();
      startRotation();
    });

    el('art-back').addEventListener('click', function () { location.hash = ''; showTop(); });

    el('newsletter-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (state.subscribed) return;
      var email = el('newsletter-email').value.trim();
      if (!email) return;
      state.subscribed = true;
      el('newsletter-submit').textContent = '登録しました';
      el('newsletter-submit').disabled = true;
    });

    /* 一覧はそれ自体がスクロールする枠なので、ウィンドウのスクロールだけでは
       枠の下に隠れている行の表示判定ができない。枠側のスクロールも見る。 */
    el('list').addEventListener('scroll', flushReveal, { passive: true });

    window.addEventListener('hashchange', route);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  fetch('js/articles.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      state.articles = withNumbers(data);
      progressEls = Array.prototype.slice.call(document.querySelectorAll('[data-progress]'));
      renderTicker();
      renderList();
      renderHero();
      bindEvents();
      route();
      bindParallax();
    })
    .catch(function (err) {
      console.error('Failed to load articles.json', err);
    });
})();
