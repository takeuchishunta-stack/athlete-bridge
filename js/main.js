(function () {
  'use strict';

  var state = {
    articles: [],
    activeCategory: 'all',
    subscribed: false
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatDate(isoDate) {
    return isoDate.replace(/-/g, '.');
  }

  function sortedArticles() {
    return state.articles.slice().sort(function (a, b) {
      return b.date.localeCompare(a.date);
    });
  }

  function categoryList() {
    var seen = [];
    sortedArticles().forEach(function (a) {
      if (seen.indexOf(a.category) === -1) seen.push(a.category);
    });
    return seen;
  }

  function articleById(id) {
    return state.articles.find(function (a) { return a.id === id; });
  }

  // ---- Card / block rendering ----

  function renderCardImage(article, imgClass, phClass) {
    if (article.image) {
      return '<img class="' + imgClass + '" src="' + escapeHtml(article.image) + '" alt="' + escapeHtml(article.personName) + '">';
    }
    return '<div class="ph-img ' + phClass + '"><span>写真: ' + escapeHtml(article.personName) + '様</span></div>';
  }

  function renderArticleCard(article) {
    return (
      '<a class="article-card" href="#' + escapeHtml(article.id) + '">' +
      renderCardImage(article, 'article-card-img', '') +
      '<div class="article-card-body">' +
        '<div class="article-card-meta">' + escapeHtml(article.category) + ' ｜ ' + formatDate(article.date) + '</div>' +
        '<h3 class="article-card-title">' + escapeHtml(article.title) + '</h3>' +
        '<p class="article-card-excerpt">' + escapeHtml(article.excerpt) + '</p>' +
        '<div class="article-card-byline">' + escapeHtml(article.company) + ' ' + escapeHtml(article.personRole) + '　' + escapeHtml(article.personName) + '</div>' +
      '</div>' +
      '</a>'
    );
  }

  function renderRelatedCard(article) {
    return (
      '<a class="related-card" href="#' + escapeHtml(article.id) + '">' +
      renderCardImage(article, 'related-card-img', '') +
      '<div class="related-card-body">' +
        '<div class="related-card-meta">' + escapeHtml(article.category) + ' ｜ ' + formatDate(article.date) + '</div>' +
        '<h3 class="related-card-title">' + escapeHtml(article.title) + '</h3>' +
      '</div>' +
      '</a>'
    );
  }

  function renderBlock(block) {
    switch (block.type) {
      case 'h':
        return '<h2>' + escapeHtml(block.text) + '</h2>';
      case 'quote':
        return '<blockquote>' + escapeHtml(block.text) + '</blockquote>';
      case 'link':
        return '<p class="article-link"><a href="' + escapeHtml(block.url) + '" target="_blank" rel="noopener">' + escapeHtml(block.text) + '</a></p>';
      case 'p':
      default:
        var label = block.label ? '<strong>' + escapeHtml(block.label) + '：</strong>' : '';
        return '<p>' + label + escapeHtml(block.text) + '</p>';
    }
  }

  // ---- View renderers ----

  function renderTop() {
    var cats = categoryList();
    var chips = ['<button class="filter-chip' + (state.activeCategory === 'all' ? ' is-active' : '') + '" data-category="all">すべて</button>']
      .concat(cats.map(function (c) {
        return '<button class="filter-chip' + (state.activeCategory === c ? ' is-active' : '') + '" data-category="' + escapeHtml(c) + '">' + escapeHtml(c) + '</button>';
      }));

    var filtered = sortedArticles().filter(function (a) {
      return state.activeCategory === 'all' || a.category === state.activeCategory;
    });

    document.getElementById('filter-bar').innerHTML = chips.join('');
    document.getElementById('article-grid').innerHTML = filtered.map(renderArticleCard).join('');
    document.getElementById('no-results').textContent = filtered.length === 0 ? 'この条件の記事はまだありません。' : '';

    document.getElementById('newsletter-submit').textContent = state.subscribed ? '登録済み' : '登録する';
  }

  function renderArticle(article) {
    var related = sortedArticles().filter(function (a) { return a.id !== article.id; });

    document.getElementById('article-hero-wrap').innerHTML = renderCardImage(article, 'article-hero-img', '');
    document.getElementById('article-meta').textContent = article.category + ' ｜ ' + formatDate(article.date);
    document.getElementById('article-title').textContent = article.title;
    document.getElementById('article-byline').textContent = article.company + '　' + article.personRole + '　' + article.personName;
    document.getElementById('article-body').innerHTML = article.blocks.map(renderBlock).join('');
    document.getElementById('related-grid').innerHTML = related.map(renderRelatedCard).join('');
  }

  // ---- Routing ----

  function currentRouteId() {
    var hash = window.location.hash.replace(/^#/, '');
    return hash || null;
  }

  function setActiveNav(isTop) {
    var navHome = document.getElementById('nav-home');
    navHome.classList.toggle('is-active', isTop);
  }

  var skipScrollTop = false;

  function route() {
    var id = currentRouteId();
    var article = id ? articleById(id) : null;

    var viewTop = document.getElementById('view-top');
    var viewArticle = document.getElementById('view-article');

    if (article) {
      viewTop.classList.add('is-hidden');
      viewArticle.classList.remove('is-hidden');
      renderArticle(article);
      setActiveNav(false);
    } else {
      viewArticle.classList.add('is-hidden');
      viewTop.classList.remove('is-hidden');
      renderTop();
      setActiveNav(true);
    }

    if (skipScrollTop) {
      skipScrollTop = false;
    } else {
      window.scrollTo(0, 0);
    }
  }

  // ---- Events ----

  function goTop(e) {
    if (e) e.preventDefault();
    if (window.location.hash) {
      window.location.hash = '';
    } else {
      route();
    }
  }

  function scrollToFilter(e) {
    if (e) e.preventDefault();
    var scrollNow = function () {
      var el = document.getElementById('filter-bar');
      if (el) el.scrollIntoView({ block: 'start' });
    };
    if (window.location.hash) {
      skipScrollTop = true;
      window.location.hash = '';
      setTimeout(scrollNow, 0);
    } else {
      scrollNow();
    }
  }

  function bindStaticEvents() {
    document.getElementById('nav-home').addEventListener('click', goTop);
    document.getElementById('logo-link').addEventListener('click', goTop);
    document.getElementById('nav-category').addEventListener('click', scrollToFilter);
    document.getElementById('article-back-link').addEventListener('click', goTop);

    document.getElementById('filter-bar').addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-chip');
      if (!btn) return;
      state.activeCategory = btn.getAttribute('data-category');
      renderTop();
    });

    document.getElementById('newsletter-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('newsletter-email');
      if (input.value.trim()) {
        state.subscribed = true;
        renderTop();
      }
    });

    window.addEventListener('hashchange', route);
  }

  function init(articles) {
    state.articles = articles;
    bindStaticEvents();
    route();
  }

  fetch('js/articles.json')
    .then(function (res) { return res.json(); })
    .then(init)
    .catch(function (err) {
      console.error('Failed to load articles.json', err);
    });
})();
