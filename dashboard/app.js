// Launch Radar: renders window.RADAR (written beside this page as data.js) as a sortable, filterable
// board with a detail view per protocol. No network, no framework: the page is the board.
(function () {
  const R = window.RADAR;
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get('q') || '',
    cat: params.get('cat') || '',
    chain: params.get('chain') || '',
    sort: params.get('sort') || 'implied',
    watch: params.get('watch') === '1',
    view: params.get('view') || 'radar',
    slug: params.get('slug') || '',
  };

  const money = (v) => {
    if (v === null || v === undefined) return '—';
    if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
    return '$' + Math.round(v);
  };
  const pct = (v) => (v === null || v === undefined ? '—' : (v > 0 ? '+' : '') + (v * 100).toFixed(1) + '%');
  const pctClass = (v) => (v === null || v === undefined || v === 0 ? '' : v > 0 ? 'pos' : 'neg');
  const ageText = (d) => (d === null || d === undefined ? 'unknown' : d >= 730 ? (d / 365).toFixed(1) + ' yrs' : d + ' days');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Masthead and the model card: the model is stated on the page, exactly as lib/model.ts runs it.
  $('masthead-meta').innerHTML =
    '<strong>' + R.board_size + ' protocols ranked</strong>' +
    'snapshot ' + esc(R.as_of) + ' · ' + R.watchlist_size + ' on the watchlist · ' + R.early_size + ' early finds below it';
  $('model-card').innerHTML =
    '<h2>How the implied value is worked out — model ' + esc(R.model_version) + '</h2>' +
    'Implied value = <code>TVL × category multiple × growth × maturity</code>. The category multiple is the ' +
    'median market-cap-to-TVL ratio of the snapshot\u2019s own tokenised protocols in that category (the ' +
    'all-category median when a category has fewer than ' + R.model.min_peers + ' traded peers), clamped to ' +
    R.model.multiple_floor + '\u2013' + R.model.multiple_cap + '. Growth is the 7-day TVL change clamped to ' +
    R.model.growth_floor + '%\u2026+' + R.model.growth_cap + '%, weighted ' + R.model.growth_weight + '. Maturity runs from ' +
    R.model.maturity_floor + ' to ' + (R.model.maturity_floor + R.model.maturity_range) + ' over ' + R.model.maturity_days +
    ' days with no token. No name is special-cased: one function scores every row, and every row shows its multiple.';
  $('foot-note').textContent =
    'Data: ' + R.source + ' (snapshot of ' + R.as_of + '). Implied values are this radar\u2019s own model claims, ' +
    'not predictions that a token will launch. Protocols whose token already trades are listed under \u201cLive tokens, for scale\u201d and never ranked here.';

  // Filter option lists, from the data itself.
  const cats = [...new Set(R.rows.map((r) => r.category || 'Uncategorised'))].sort();
  for (const c of cats) $('cat').appendChild(new Option(c, c));
  const chains = [...new Set(R.rows.flatMap((r) => r.chains))].sort();
  for (const c of chains) $('chain').appendChild(new Option(c, c));

  $('q').value = state.q;
  $('cat').value = state.cat;
  $('chain').value = state.chain;
  $('sort').value = state.sort;
  $('watch').checked = state.watch;

  function syncUrl() {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.cat) p.set('cat', state.cat);
    if (state.chain) p.set('chain', state.chain);
    if (state.sort !== 'implied') p.set('sort', state.sort);
    if (state.watch) p.set('watch', '1');
    if (state.view !== 'radar') p.set('view', state.view);
    if (state.slug) p.set('slug', state.slug);
    history.replaceState(null, '', p.toString() ? '?' + p.toString() : location.pathname);
  }

  function visibleRows() {
    let rows = R.rows.filter((r) =>
      (!state.watch || r.watchlist) &&
      (!state.cat || (r.category || 'Uncategorised') === state.cat) &&
      (!state.chain || r.chains.includes(state.chain)) &&
      (!state.q || (r.name + ' ' + r.slug).toLowerCase().includes(state.q.toLowerCase())));
    const by = {
      implied: (a, b) => b.implied_value_usd - a.implied_value_usd,
      tvl: (a, b) => b.tvl_usd - a.tvl_usd,
      growth: (a, b) => (b.change_7d ?? -Infinity) - (a.change_7d ?? -Infinity),
      age: (a, b) => (b.age_days ?? -1) - (a.age_days ?? -1),
      multiple: (a, b) => b.base_multiple - a.base_multiple,
    }[state.sort];
    return rows.sort(by);
  }

  function renderBoard() {
    const rows = visibleRows();
    $('count').textContent = 'Showing ' + rows.length + ' of ' + R.rows.length + ' ranked protocols';
    $('board-body').innerHTML = rows.map((r) =>
      '<tr data-slug="' + esc(r.slug) + '">' +
      '<td class="num">' + r.rank + '</td>' +
      '<td><span class="name">' + esc(r.name) + '</span>' + (r.watchlist ? '<span class="badge">watchlist</span>' : '') +
      '<br><span class="slug">' + esc(r.slug) + '</span></td>' +
      '<td>' + esc(r.category || 'Uncategorised') + '</td>' +
      '<td>' + esc(r.chains.join(', ') || '—') + '</td>' +
      '<td class="num">' + money(r.tvl_usd) + '</td>' +
      '<td class="num ' + pctClass(r.change_7d) + '">' + pct(r.change_7d) + '</td>' +
      '<td class="num">' + ageText(r.age_days) + '</td>' +
      '<td class="num">' + r.base_multiple.toFixed(2) + '×</td>' +
      '<td class="num implied">' + money(r.implied_value_usd) + '</td></tr>').join('');
    for (const tr of document.querySelectorAll('#board-body tr')) {
      tr.addEventListener('click', () => openDetail(tr.getAttribute('data-slug')));
    }
  }

  function renderLive() {
    $('live-body').innerHTML = R.live.map((r) =>
      '<tr><td><span class="name">' + esc(r.name) + '</span><br><span class="slug">' + esc(r.slug) + '</span></td>' +
      '<td>' + esc(r.category || 'Uncategorised') + '</td>' +
      '<td>' + esc(r.chains.join(', ') || '—') + '</td>' +
      '<td class="num">' + money(r.tvl_usd) + '</td>' +
      '<td class="num ' + pctClass(r.change_7d) + '">' + pct(r.change_7d) + '</td>' +
      '<td class="num">' + money(r.mcap_usd) + '</td>' +
      '<td class="num">' + (r.mcap_usd && r.tvl_usd ? (r.mcap_usd / r.tvl_usd).toFixed(2) + '×' : '—') + '</td></tr>').join('');
  }

  function openDetail(slug) {
    const r = R.rows.find((x) => x.slug === slug);
    if (!r) return;
    state.slug = slug;
    state.view = 'detail';
    syncUrl();
    show();
    const raw = R.rows.find((x) => x.slug === slug);
    $('detail-view').innerHTML =
      '<button class="back" type="button" id="back">← Back to the board</button>' +
      '<h2>' + esc(r.name) + (r.watchlist ? '<span class="badge">watchlist</span>' : '') + '</h2>' +
      '<div class="sub">' + esc(r.slug) + ' · ' + esc(r.category || 'Uncategorised') + ' · ' +
      esc(r.chains.join(', ') || 'no chains recorded') + ' · tracked since ' + esc(r.listed_at || 'an unknown date') + '</div>' +
      '<div class="stat-grid">' +
      '<div class="stat"><div class="k">Implied value</div><div class="v">' + money(r.implied_value_usd) + '</div></div>' +
      '<div class="stat"><div class="k">TVL</div><div class="v">' + money(r.tvl_usd) + '</div></div>' +
      '<div class="stat"><div class="k">7-day change</div><div class="v">' + pct(r.change_7d) + '</div></div>' +
      '<div class="stat"><div class="k">Age, no token</div><div class="v">' + ageText(r.age_days) + '</div></div>' +
      '<div class="stat"><div class="k">Board rank</div><div class="v">#' + r.rank + ' of ' + R.board_size + '</div></div>' +
      '</div>' +
      '<div class="formula">How #' + r.rank + ' is priced: <code>' + money(r.tvl_usd) + ' TVL × ' + r.base_multiple.toFixed(2) +
      ' (median market-cap/TVL of traded ' + esc(r.category || 'Uncategorised') + ' protocols) × ' + r.growth_multiplier.toFixed(2) +
      ' (7-day growth) × ' + r.maturity_multiplier.toFixed(2) + ' (maturity) = ' + money(r.implied_value_usd) + '</code>. ' +
      'If ' + esc(r.name) + ' launched at that value, a farmer holding a qualifying position from the plan below would be farming a ' +
      money(raw.implied_value_usd) + ' launch.</div>' +
      '<h3 class="farm-title">Farm plan — do these before the token lands</h3>' +
      '<ol class="farm">' + r.farm_steps.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>';
    $('back').addEventListener('click', () => {
      state.view = 'radar';
      state.slug = '';
      syncUrl();
      show();
    });
  }

  function show() {
    const detail = state.view === 'detail' && state.slug;
    $('board-view').hidden = detail || state.view === 'live';
    $('live-view').hidden = detail || state.view !== 'live';
    $('detail-view').hidden = !detail;
    $('controls').style.display = detail ? 'none' : '';
    $('tab-radar').classList.toggle('active', state.view !== 'live');
    $('tab-live').classList.toggle('active', state.view === 'live');
    if (!detail) {
      if (state.view === 'live') renderLive();
      else renderBoard();
    }
  }

  $('tab-radar').addEventListener('click', () => { state.view = 'radar'; state.slug = ''; syncUrl(); show(); });
  $('tab-live').addEventListener('click', () => { state.view = 'live'; state.slug = ''; syncUrl(); show(); });
  for (const [id, key] of [['q', 'q'], ['cat', 'cat'], ['chain', 'chain'], ['sort', 'sort']]) {
    $(id).addEventListener('input', (e) => { state[key] = e.target.value; syncUrl(); renderBoard(); });
    $(id).addEventListener('change', (e) => { state[key] = e.target.value; syncUrl(); renderBoard(); });
  }
  $('watch').addEventListener('change', (e) => { state.watch = e.target.checked; syncUrl(); renderBoard(); });

  if (state.view === 'detail' && state.slug) openDetail(state.slug);
  else show();
})();
