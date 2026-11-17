/* Brasil × Vietnã 1990–2023 — lógica do site (d3 v7) */
(() => {
  'use strict';

  const NOME = { BRA: 'Brasil', VNM: 'Vietnã' };
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const C = () => ({ BRA: css('--br'), VNM: css('--vn') });
  const fmtN = (v, dec) => (v == null || Number.isNaN(v)) ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const DEC = { idh: 3, eci_score: 2, ied_pct_pib: 2, pd_pct_pib: 2, fbcf_pct_pib: 1, juros_emprestimo: 1, juros_real: 1, inflacao_ipc: 1, inflacao_deflator: 1, pib_crescimento: 1, taxa_basica: 2 };
  const decFor = (ind) => DEC[ind] ?? (['pib_pc_nominal', 'pib_pc_ppp', 'eci_ranking', 'manuf_pct_expo'].includes(ind) ? 0 : 1);
  const ZERO = new Set(['eci_score', 'resultado_nominal', 'resultado_primario']);
  const sg = (v, dec = 1) => (v == null || Number.isNaN(v)) ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + fmtN(Math.abs(v), dec);
  const fmtInd = (ind, v) => ind === 'eci_ranking' ? (v == null ? '—' : v + 'º') : fmtN(v, decFor(ind));

  // ── theme toggle
  const toggle = document.getElementById('theme-toggle');
  const applyThemeLabel = () => { const t = document.documentElement.getAttribute('data-theme'); toggle.textContent = t === 'dark' ? 'Claro' : t === 'light' ? 'Escuro' : (matchMedia('(prefers-color-scheme: dark)').matches ? 'Claro' : 'Escuro'); };
  toggle.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('bv-theme', next); } catch (e) {}
    applyThemeLabel(); redrawAll();
  });
  applyThemeLabel();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { applyThemeLabel(); redrawAll(); });

  // ── state
  let ROWS = [], META = [], DECS = [];
  const state = { ind: 'pib_pc_ppp', y0: 1990, y1: 2023, escala: 'lin', tab: 'pib_pc_ppp', m0: 1996, m1: 2023, j0: 1999, j1: 2023, decPais: 'todos', decMud: false };
  const readHash = () => { const h = location.hash.replace('#', ''); if (h && document.getElementById(h)) return h; return null; };

  // ── data
  const toRows = (raw) => raw.map(r => ({ pais: r.pais, ano: +r.ano, indicador: r.indicador, valor: r.valor === '' || r.valor == null ? null : +r.valor })).filter(r => r.valor != null && !Number.isNaN(r.valor));
  const series = (ind) => { const o = { BRA: [], VNM: [] }; ROWS.filter(d => d.indicador === ind).forEach(d => o[d.pais].push({ ano: d.ano, valor: d.valor })); o.BRA.sort((a, b) => a.ano - b.ano); o.VNM.sort((a, b) => a.ano - b.ano); return o; };
  const pick = (p, ind, y) => { const r = ROWS.find(d => d.pais === p && d.indicador === ind && d.ano === y); return r ? r.valor : null; };
  const first = (p, ind) => ROWS.filter(d => d.pais === p && d.indicador === ind).sort((a, b) => a.ano - b.ano)[0] || null;
  const last = (p, ind) => ROWS.filter(d => d.pais === p && d.indicador === ind).sort((a, b) => b.ano - a.ano)[0] || null;

  // ── generic two-country line chart
  function lineChart(el, opts) {
    const s = series(opts.ind);
    const y0 = opts.y0 ?? 1990, y1 = opts.y1 ?? 2023;
    let pts = { BRA: s.BRA.filter(p => p.ano >= y0 && p.ano <= y1), VNM: s.VNM.filter(p => p.ano >= y0 && p.ano <= y1) };
    el.replaceChildren();
    let all = [...pts.BRA, ...pts.VNM];
    if (!all.length) { const d = document.createElement('div'); d.className = 'empty'; d.textContent = 'Sem dados no período'; el.appendChild(d); return; }
    let vals = all.map(p => p.valor), yMin = d3.min(vals), yMax = d3.max(vals);
    let useLog = !!opts.log;
    if (useLog) { pts = { BRA: pts.BRA.filter(p => p.valor > 0), VNM: pts.VNM.filter(p => p.valor > 0) }; const pos = [...pts.BRA, ...pts.VNM].map(p => p.valor); if (!pos.length) useLog = false; else { yMin = d3.min(pos); yMax = d3.max(pos); } }
    const W = Math.max(el.clientWidth || 600, 280), H = opts.small ? 230 : 340;
    const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', `Evolução de ${opts.label || opts.ind} para Brasil e Vietnã, ${y0}–${y1}`);
    const x = d3.scaleLinear().domain([y0, y1]);
    let y;
    if (useLog) y = d3.scaleLog().domain([yMin / 1.15, yMax * 1.15]);
    else { const pad = (yMax - yMin) * 0.08 || Math.abs(yMax) * 0.1 || 1; const lo = opts.refZero ? Math.min(0, yMin - pad) : (yMin >= 0 && yMin - pad < 0 && yMin / yMax < 0.25 ? 0 : yMin - pad); y = d3.scaleLinear().domain([lo, yMax + pad]).nice(); }
    const ticksY = useLog ? (() => { const [lo, hi] = y.domain(); const t = []; for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++) { const v = 10 ** e; if (v >= lo && v <= hi) t.push(v); } return t.length >= 2 ? t : y.ticks(3); })() : y.ticks(5);
    const fmtTick = useLog ? (v => fmtN(v, 0)) : (v => fmtN(v, decFor(opts.ind) > 1 ? 2 : decFor(opts.ind)));
    const tmp = svg.append('g').attr('class', 'axis'); let maxW = 0;
    ticksY.forEach(t => { const tx = tmp.append('text').text(fmtTick(t)); maxW = Math.max(maxW, tx.node().getComputedTextLength()); tx.remove(); }); tmp.remove();
    const m = { top: 12, right: 16, bottom: 28, left: Math.ceil(maxW) + 12 };
    const iw = W - m.left - m.right, ih = H - m.top - m.bottom;
    x.range([0, iw]); y.range([ih, 0]);
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);
    g.append('g').attr('class', 'grid').call(d3.axisLeft(y).tickValues(ticksY).tickSize(-iw).tickFormat('')).call(a => a.select('.domain').remove());
    if (opts.refZero && y.domain()[0] < 0) g.append('line').attr('class', 'ref').attr('x1', 0).attr('x2', iw).attr('y1', y(0)).attr('y2', y(0));
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x).ticks(Math.max(3, Math.min(8, Math.floor(iw / 70)))).tickFormat(d3.format('d')));
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).tickValues(ticksY).tickFormat(fmtTick));
    const col = C();
    const line = d3.line().defined(p => p.valor != null).x(p => x(p.ano)).y(p => y(p.valor));
    ['BRA', 'VNM'].forEach(k => {
      if (!pts[k].length) return;
      g.append('path').datum(pts[k]).attr('fill', 'none').attr('stroke', col[k]).attr('stroke-width', 2).attr('d', line);
      if (opts.dots || pts[k].length < 12) g.append('g').selectAll('circle').data(pts[k]).join('circle').attr('cx', p => x(p.ano)).attr('cy', p => y(p.valor)).attr('r', 3).attr('fill', col[k]).attr('stroke', css('--surface')).attr('stroke-width', 1.5);
      const lastP = pts[k][pts[k].length - 1];
      g.append('text').attr('class', 'endlbl').attr('x', x(lastP.ano) + 5).attr('y', y(lastP.valor)).attr('dy', '.35em').attr('fill', col[k]).text(fmtInd(opts.ind, lastP.valor));
    });
    const lbls = g.selectAll('.endlbl').nodes();
    if (lbls.length === 2) { const a = +lbls[0].getAttribute('y'), b = +lbls[1].getAttribute('y'); if (Math.abs(a - b) < 12) { const mid = (a + b) / 2; lbls[0].setAttribute('y', a < b ? mid - 6 : mid + 6); lbls[1].setAttribute('y', a < b ? mid + 6 : mid - 6); } }
    g.selectAll('.endlbl').each(function () { const w = this.getComputedTextLength(); const xx = +this.getAttribute('x'); if (xx + w > iw + m.right - 2) this.setAttribute('x', iw + m.right - 2 - w); });
    // tooltip + crosshair
    const tip = d3.select(el).append('div').attr('class', 'tip');
    const hover = g.append('line').attr('class', 'ref').attr('y1', 0).attr('y2', ih).style('opacity', 0);
    const dotsH = { BRA: g.append('circle').attr('r', 4).attr('fill', col.BRA).style('opacity', 0), VNM: g.append('circle').attr('r', 4).attr('fill', col.VNM).style('opacity', 0) };
    svg.append('rect').attr('x', m.left).attr('y', m.top).attr('width', iw).attr('height', ih).attr('fill', 'transparent')
      .on('pointermove', (ev) => {
        const [mx] = d3.pointer(ev, g.node()); const yr = Math.round(x.invert(mx));
        const bp = pts.BRA.find(p => p.ano === yr), vp = pts.VNM.find(p => p.ano === yr);
        if (!bp && !vp) return;
        hover.attr('x1', x(yr)).attr('x2', x(yr)).style('opacity', 1);
        [['BRA', bp], ['VNM', vp]].forEach(([k, p]) => dotsH[k].style('opacity', p ? 1 : 0).attr('cx', x(yr)).attr('cy', p ? y(p.valor) : 0));
        tip.html(''); tip.append('div').attr('class', 'yr').text(yr);
        if (bp) { const r = tip.append('div').attr('class', 'row'); r.append('i').style('background', col.BRA); r.append('span').text(`Brasil: ${fmtInd(opts.ind, bp.valor)}`); }
        if (vp) { const r = tip.append('div').attr('class', 'row'); r.append('i').style('background', col.VNM); r.append('span').text(`Vietnã: ${fmtInd(opts.ind, vp.valor)}`); }
        const tw = tip.node().offsetWidth; const left = m.left + x(yr) + 12;
        tip.style('left', (left + tw > W ? m.left + x(yr) - tw - 12 : left) + 'px').style('top', (m.top + 8) + 'px').style('opacity', 1);
      })
      .on('pointerleave', () => { tip.style('opacity', 0); hover.style('opacity', 0); dotsH.BRA.style('opacity', 0); dotsH.VNM.style('opacity', 0); });
  }

  // ── macro synthesis facets
  const MSERIES = [
    { id: 'pib_crescimento', label: 'Crescimento do PIB', v: '--s1', chk: 'chk-pib' },
    { id: 'taxa_basica', label: 'Taxa básica de juros', v: '--s2', chk: 'chk-juros' },
    { id: 'fbcf_pct_pib', label: 'FBCF / PIB', v: '--s3', chk: 'chk-fbcf' },
    { id: 'inflacao_ipc', label: 'Inflação (IPC)', v: '--s4', chk: 'chk-infl' },
  ];
  const activeM = () => MSERIES.filter(sr => { const cb = document.getElementById(sr.chk); return !cb || cb.checked; });
  function macroFacet(el, pais) {
    const y0 = state.m0, y1 = state.m1, log = y0 < 1995;
    const vals = []; activeM().forEach(sr => ROWS.filter(r => r.indicador === sr.id && r.ano >= y0 && r.ano <= y1 && (!log || r.valor > 0)).forEach(r => vals.push(r.valor)));
    el.replaceChildren();
    if (!vals.length) { const d = document.createElement('div'); d.className = 'empty'; d.textContent = 'Sem dados no período'; el.appendChild(d); return; }
    const dom = [d3.min(vals), d3.max(vals)];
    const W = Math.max(el.clientWidth || 400, 260), H = 320;
    const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', `${NOME[pais]}: crescimento do PIB, taxa básica de juros, FBCF e inflação, ${y0}–${y1}`);
    const x = d3.scaleLinear().domain([y0, y1]);
    let y;
    if (log) y = d3.scaleLog().domain([Math.max(0.5, dom[0] / 1.3), dom[1] * 1.3]);
    else { const pad = (dom[1] - dom[0]) * 0.08 || 1; y = d3.scaleLinear().domain([Math.min(0, dom[0] - pad), dom[1] + pad]).nice(); }
    const ticksY = log ? (() => { const [lo, hi] = y.domain(); const t = []; for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++) { const v = 10 ** e; if (v >= lo && v <= hi) t.push(v); } return t; })() : y.ticks(6);
    const fmtT = v => fmtN(v, 0) + '%';
    const tmp = svg.append('g').attr('class', 'axis'); let maxW = 0;
    ticksY.forEach(t => { const tx = tmp.append('text').text(fmtT(t)); maxW = Math.max(maxW, tx.node().getComputedTextLength()); tx.remove(); }); tmp.remove();
    const m = { top: 10, right: 14, bottom: 28, left: Math.ceil(maxW) + 10 };
    const iw = W - m.left - m.right, ih = H - m.top - m.bottom;
    x.range([0, iw]); y.range([ih, 0]);
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);
    g.append('g').attr('class', 'grid').call(d3.axisLeft(y).tickValues(ticksY).tickSize(-iw).tickFormat('')).call(a => a.select('.domain').remove());
    if (!log && y.domain()[0] < 0) g.append('line').attr('class', 'ref').attr('x1', 0).attr('x2', iw).attr('y1', y(0)).attr('y2', y(0));
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x).ticks(Math.max(3, Math.min(7, Math.floor(iw / 60)))).tickFormat(d3.format('d')));
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).tickValues(ticksY).tickFormat(fmtT));
    const line = d3.line().defined(pt => pt.valor != null && (!log || pt.valor > 0)).x(pt => x(pt.ano)).y(pt => y(pt.valor));
    const byS = {};
    activeM().forEach(sr => {
      const pts = ROWS.filter(r => r.pais === pais && r.indicador === sr.id && r.ano >= y0 && r.ano <= y1).sort((a, b) => a.ano - b.ano);
      byS[sr.id] = pts; if (!pts.length) return;
      const colr = css(sr.v);
      g.append('path').datum(pts).attr('fill', 'none').attr('stroke', colr).attr('stroke-width', sr.id === 'taxa_basica' ? 2.4 : 1.8).attr('d', line);
      if (pts.length < 10) g.append('g').selectAll('circle').data(pts.filter(line.defined())).join('circle').attr('cx', pt => x(pt.ano)).attr('cy', pt => y(pt.valor)).attr('r', 2.5).attr('fill', colr);
    });
    const tip = d3.select(el).append('div').attr('class', 'tip');
    const hover = g.append('line').attr('class', 'ref').attr('y1', 0).attr('y2', ih).style('opacity', 0);
    svg.append('rect').attr('x', m.left).attr('y', m.top).attr('width', iw).attr('height', ih).attr('fill', 'transparent')
      .on('pointermove', ev => {
        const [mx] = d3.pointer(ev, g.node()); const yr = Math.round(x.invert(mx));
        hover.attr('x1', x(yr)).attr('x2', x(yr)).style('opacity', 1);
        tip.html(''); tip.append('div').attr('class', 'yr').text(`${NOME[pais]} · ${yr}`);
        let any = false;
        activeM().forEach(sr => { const pt = (byS[sr.id] || []).find(q => q.ano === yr); if (pt) { any = true; const r = tip.append('div').attr('class', 'row'); r.append('i').style('background', css(sr.v)); r.append('span').text(`${sr.label}: ${fmtN(pt.valor, 1)}%`); } });
        if (!any) { tip.style('opacity', 0); return; }
        const tw = tip.node().offsetWidth; const left = m.left + x(yr) + 12;
        tip.style('left', (left + tw > W ? m.left + x(yr) - tw - 12 : left) + 'px').style('top', (m.top + 6) + 'px').style('opacity', 1);
      })
      .on('pointerleave', () => { tip.style('opacity', 0); hover.style('opacity', 0); });
  }

  // ── tiles
  const TILES = [
    ['PIB per capita PPP · 2023', 'pib_pc_ppp', (p) => fmtN(pick(p, 'pib_pc_ppp', 2023), 0), (p) => `1990: ${fmtN(pick(p, 'pib_pc_ppp', 1990), 0)} · ×${fmtN(pick(p, 'pib_pc_ppp', 2023) / pick(p, 'pib_pc_ppp', 1990), 1)}`],
    ['Exportações · 2023 (US$ bi)', 'exportacoes', (p) => fmtN(pick(p, 'exportacoes', 2023), 1), (p) => `1990: ${fmtN(pick(p, 'exportacoes', 1990), 1)} · ×${fmtN(pick(p, 'exportacoes', 2023) / pick(p, 'exportacoes', 1990), 1)}`],
    ['Manufaturados nas exportações · 2023', 'manuf_pct_expo', (p) => fmtN(pick(p, 'manuf_pct_expo', 2023), 0) + '%', (p) => { const f = first(p, 'manuf_pct_expo'); const a = pick(p, 'manuf_pct_expo', 2023); return `${f.ano}: ${fmtN(f.valor, 0)}% · ${a - f.valor > 0 ? '+' : ''}${fmtN(a - f.valor, 0)} p.p.`; }],
    ['Ranking ECI · 2023', 'eci_ranking', (p) => pick(p, 'eci_ranking', 2023) + 'º', (p) => { const b = pick(p, 'eci_ranking', 1995), a = pick(p, 'eci_ranking', 2023); return `1995: ${b}º · ${b - a > 0 ? 'subiu' : 'caiu'} ${Math.abs(b - a)}`; }],
    ['IDH · 2023', 'idh', (p) => fmtN(pick(p, 'idh', 2023), 3), (p) => `1990: ${fmtN(pick(p, 'idh', 1990), 3)} · +${fmtN((pick(p, 'idh', 2023) / pick(p, 'idh', 1990) - 1) * 100, 1)}%`],
    ['Gini · último ano', 'gini', (p) => fmtN(last(p, 'gini').valor, 1), (p) => `${last(p, 'gini').ano} · início: ${fmtN(first(p, 'gini').valor, 1)}`],
  ];
  function drawTiles() {
    const host = document.getElementById('resumo'); host.replaceChildren();
    TILES.forEach(([label, ind, fmt, dfmt]) => {
      const t = document.createElement('div'); t.className = 'tile';
      const l = document.createElement('span'); l.className = 'l'; l.textContent = label; t.appendChild(l);
      const pair = document.createElement('div'); pair.className = 'pair';
      [['BRA', 'br'], ['VNM', 'vn']].forEach(([p, cls]) => {
        const d = document.createElement('div');
        const c = document.createElement('span'); c.className = 'c ' + cls; c.textContent = NOME[p];
        const n = document.createElement('div'); n.className = 'n'; n.textContent = fmt(p);
        const dd = document.createElement('div'); dd.className = 'd'; dd.textContent = dfmt(p);
        d.append(c, n, dd); pair.appendChild(d);
      });
      t.appendChild(pair); host.appendChild(t);
    });
  }

  // ── selects
  function fillSelect(sel, key) {
    sel.replaceChildren();
    d3.group(META, r => (r.ala === 'Causal' ? 'Causais · ' : 'Resultados · ') + r.grupo).forEach((items, grupo) => { const og = document.createElement('optgroup'); og.label = grupo; items.forEach(r => og.appendChild(new Option(r.rotulo, r.indicador))); sel.appendChild(og); });
    sel.value = state[key];
  }

  // ── explorer
  const metaOf = (ind) => META.find(r => r.indicador === ind) || null;
  function drawExplorer() {
    const mt = metaOf(state.ind);
    document.getElementById('m-unid').textContent = mt ? mt.unidade : '—';
    document.getElementById('m-fonte').textContent = mt ? mt.fonte : '—';
    document.getElementById('m-cod').textContent = mt ? mt.codigo : '—';
    document.getElementById('m-nota').textContent = mt && mt.nota ? 'Nota: ' + mt.nota : '';
    lineChart(document.getElementById('chart-main'), { ind: state.ind, y0: state.y0, y1: state.y1, log: state.escala === 'log', refZero: ZERO.has(state.ind), label: mt ? mt.rotulo : state.ind });
  }

  // ── painéis: ala causal e ala de resultados
  const PANELS = {
    causal: [
      ['Política monetária · Taxa básica de juros (% a.a.)', 'taxa_basica', 'A partir de 1996. Selic (BCB) e taxa de refinanciamento (SBV), médias anuais.', 1996],
      ['Política monetária · Juros de empréstimo bancário (% a.a.)', 'juros_emprestimo', 'Taxa média ao tomador final (FMI/IFS), não a taxa básica. Brasil a partir de 1997.'],
      ['Política fiscal · Resultado nominal (% do PIB)', 'resultado_nominal', 'Negativo = déficit, com os juros da dívida. Brasil a partir de 2001.', 1998],
      ['Política fiscal · Resultado primário (% do PIB)', 'resultado_primario', 'O mesmo resultado sem os juros da dívida.', 1998],
      ['Política fiscal · Juros líquidos da dívida (% do PIB)', 'juros_divida', 'Diferença entre o resultado primário e o nominal.', 1998],
      ['Política fiscal · Dívida bruta do governo geral (% do PIB)', 'divida_bruta', 'Série a partir de 2000 nos dois países.', 1998],
      ['Investimento · Formação bruta de capital fixo / PIB (%)', 'fbcf_pct_pib'],
      ['Investimento · Gasto em P&D / PIB (%)', 'pd_pct_pib', 'Vietnã: observações bienais.'],
      ['Inserção externa · IED líquido / PIB (%)', 'ied_pct_pib'],
      ['Inserção externa · Comércio / PIB (%)', 'comercio_pct_pib'],
    ],
    resultado: [
      ['Renda · PIB per capita PPP (Int$)', 'pib_pc_ppp'],
      ['Renda · Crescimento real do PIB (% a.a.)', 'pib_crescimento'],
      ['Comércio · Exportações (US$ bi)', 'exportacoes', 'Vietnã à frente em 2016–17 e 2019–22; Brasil lidera em 2018 e 2023.'],
      ['Estrutura · Manufaturados / exportações (%)', 'manuf_pct_expo'],
      ['Estrutura · Manufatura / PIB (%)', 'manufatura_pct_pib'],
      ['Estrutura · Alta tecnologia / manufaturados (%)', 'alta_tec_pct_manuf'],
      ['Complexidade · ECI score', 'eci_score', 'Linha tracejada = média global (0).'],
      ['Estabilidade · Inflação IPC (% a.a., escala log)', 'inflacao_ipc', 'Escala logarítmica: Brasil 1990–1994 em hiperinflação (até 2.948%). Valores ≤ 0 do Vietnã ficam fora da escala log.'],
      ['Vulnerabilidade · Reservas (US$ bi)', 'reservas_usd'],
      ['Vulnerabilidade · Dívida externa / RNB (%)', 'divida_externa_pct_rnb'],
      ['Social · IDH', 'idh'],
      ['Social · Gini (anos de pesquisa)', 'gini'],
    ],
  };
  function buildPanels() {
    Object.entries(PANELS).forEach(([ala, lista]) => {
      const host = document.getElementById('panels-' + ala); if (!host) return; host.replaceChildren();
      lista.forEach(([title, ind, note, y0]) => {
        const card = document.createElement('div'); card.className = 'card'; card.id = 'p-' + ind;
        const [eixo, ...rest] = title.split(' · ');
        const h = document.createElement('h4');
        const tg = document.createElement('span'); tg.className = 'ptag'; tg.textContent = eixo; h.append(tg, rest.join(' · '));
        card.appendChild(h);
        const ch = document.createElement('div'); ch.className = 'chart small'; ch.dataset.ind = ind; if (y0) ch.dataset.y0 = y0; card.appendChild(ch);
        if (note) { const p = document.createElement('p'); p.className = 'note'; p.textContent = note; card.appendChild(p); }
        host.appendChild(card);
      });
    });
  }
  function drawPanels() {
    document.querySelectorAll('.panels .chart').forEach(el => {
      const ind = el.dataset.ind;
      lineChart(el, { ind, small: true, y0: el.dataset.y0 ? +el.dataset.y0 : undefined, refZero: ZERO.has(ind) || ind === 'pib_crescimento', dots: ind === 'gini', log: ind === 'inflacao_ipc', label: (metaOf(ind) || {}).rotulo || ind });
    });
  }

  // ── alas: lista os indicadores de cada lado e leva ao explorador
  function drawAlas() {
    const host = document.getElementById('alas'); if (!host) return; host.replaceChildren();
    const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
    [['Causal', 'causal', 'Ala causal', 'Instrumentos e condições: o que a política econômica decide ou enfrenta.'],
     ['Resultado', 'resultado', 'Ala de resultados', 'O que se observa depois: renda, comércio, estrutura produtiva, estabilidade e bem-estar.']].forEach(([ala, cls, titulo, desc]) => {
      const items = META.filter(r => r.ala === ala);
      const box = el('div', 'ala ' + cls);
      const h = el('h3', null, titulo); h.appendChild(el('small', null, items.length + ' indicadores')); box.appendChild(h);
      box.appendChild(el('p', null, desc));
      d3.group(items, r => r.grupo).forEach((lista, grupo) => {
        const g = el('div', 'ala-g'); g.appendChild(el('span', 'g', grupo));
        const chips = el('div', 'chips');
        lista.forEach(r => {
          const b = el('button', 'chip', r.rotulo); b.type = 'button';
          b.addEventListener('click', () => { state.ind = r.indicador; document.getElementById('sel-ind').value = r.indicador; drawExplorer(); document.getElementById('explorar').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
          chips.appendChild(b);
        });
        g.appendChild(chips); box.appendChild(g);
      });
      host.appendChild(box);
    });
  }

  // ── decisões de juros: meta Selic (Copom) × taxa de refinanciamento (SBV)
  const parseD = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const fmtD = (s) => s ? s.split('-').reverse().join('/') : '—';
  const toDecs = (raw) => raw.map(r => ({ pais: r.pais, dec: r.data_decisao, vig: r.data_vigencia, t: parseD(r.data_vigencia), taxa: +r.taxa, varpp: r.variacao_pp === '' ? null : +r.variacao_pp, doc: r.documento })).sort((a, b) => a.t - b.t);
  const decsOf = (p) => DECS.filter(d => d.pais === p);
  const jRange = () => [new Date(state.j0, 0, 1), new Date(state.j1, 11, 31)];
  function stepPts(p, t0, t1) {
    const all = decsOf(p), pts = [];
    const before = all.filter(d => d.t < t0);
    if (before.length) pts.push({ t: t0, taxa: before[before.length - 1].taxa });
    all.filter(d => d.t >= t0 && d.t <= t1).forEach(d => pts.push({ t: d.t, taxa: d.taxa, d }));
    if (pts.length) pts.push({ t: t1, taxa: pts[pts.length - 1].taxa });
    return pts;
  }
  const JNOME = { BRA: 'Brasil · meta Selic', VNM: 'Vietnã · refinanciamento' };
  function drawJuros() {
    const el = document.getElementById('chart-juros'); if (!el || !DECS.length) return;
    const [t0, t1] = jRange();
    const pts = { BRA: stepPts('BRA', t0, t1), VNM: stepPts('VNM', t0, t1) };
    el.replaceChildren();
    const all = [...pts.BRA, ...pts.VNM];
    if (!all.length) { const d = document.createElement('div'); d.className = 'empty'; d.textContent = 'Sem decisões no período'; el.appendChild(d); return; }
    const W = Math.max(el.clientWidth || 600, 280), H = 360;
    const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', `Meta da taxa Selic e taxa de refinanciamento do State Bank of Vietnam, decisão a decisão, ${state.j0}–${state.j1}`);
    const x = d3.scaleTime().domain([t0, t1]);
    const y = d3.scaleLinear().domain([0, d3.max(all, p => p.taxa) * 1.06]).nice();
    const ticksY = y.ticks(6), fmtT = v => fmtN(v, 0) + '%';
    const tmp = svg.append('g').attr('class', 'axis'); let maxW = 0;
    ticksY.forEach(t => { const tx = tmp.append('text').text(fmtT(t)); maxW = Math.max(maxW, tx.node().getComputedTextLength()); tx.remove(); }); tmp.remove();
    let endW = 0; const tmp2 = svg.append('g'); ['BRA', 'VNM'].forEach(k => { if (!pts[k].length) return; const tx = tmp2.append('text').attr('class', 'endlbl').text(fmtN(pts[k][pts[k].length - 1].taxa, 2) + '%'); endW = Math.max(endW, tx.node().getComputedTextLength()); }); tmp2.remove();
    const m = { top: 12, right: Math.ceil(endW) + 10, bottom: 28, left: Math.ceil(maxW) + 12 };
    const iw = W - m.left - m.right, ih = H - m.top - m.bottom;
    x.range([0, iw]); y.range([ih, 0]);
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);
    g.append('g').attr('class', 'grid').call(d3.axisLeft(y).tickValues(ticksY).tickSize(-iw).tickFormat('')).call(a => a.select('.domain').remove());
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x).ticks(Math.max(3, Math.min(9, Math.floor(iw / 70)))).tickFormat(d3.timeFormat('%Y')));
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).tickValues(ticksY).tickFormat(fmtT));
    const col = C();
    const line = d3.line().x(p => x(p.t)).y(p => y(p.taxa)).curve(d3.curveStepAfter);
    ['BRA', 'VNM'].forEach(k => {
      if (!pts[k].length) return;
      g.append('path').datum(pts[k]).attr('fill', 'none').attr('stroke', col[k]).attr('stroke-width', 2).attr('d', line);
      g.append('g').selectAll('circle').data(pts[k].filter(p => p.d && p.d.varpp !== 0 && (k === 'VNM' || W >= 560))).join('circle').attr('cx', p => x(p.t)).attr('cy', p => y(p.taxa)).attr('r', k === 'BRA' || W < 560 ? 2 : 2.8).attr('fill', col[k]).attr('stroke', css('--surface')).attr('stroke-width', 1);
      const lastP = pts[k][pts[k].length - 1];
      g.append('text').attr('class', 'endlbl').attr('x', iw + 5).attr('y', y(lastP.taxa)).attr('dy', '.35em').attr('fill', col[k]).text(fmtN(lastP.taxa, 2) + '%');
    });
    const lbls = g.selectAll('.endlbl').nodes();
    if (lbls.length === 2) { const a = +lbls[0].getAttribute('y'), b = +lbls[1].getAttribute('y'); if (Math.abs(a - b) < 12) { const mid = (a + b) / 2; lbls[0].setAttribute('y', a < b ? mid - 6 : mid + 6); lbls[1].setAttribute('y', a < b ? mid + 6 : mid - 6); } }
    const tip = d3.select(el).append('div').attr('class', 'tip');
    const hover = g.append('line').attr('class', 'ref').attr('y1', 0).attr('y2', ih).style('opacity', 0);
    const fD = d3.timeFormat('%d/%m/%Y');
    const emVigor = (k, t) => { let cur = null; for (const d of decsOf(k)) { if (d.t <= t) cur = d; else break; } return cur; };
    svg.append('rect').attr('x', m.left).attr('y', m.top).attr('width', iw).attr('height', ih).attr('fill', 'transparent')
      .on('pointermove', (ev) => {
        const [mx] = d3.pointer(ev, g.node()); const t = x.invert(mx);
        hover.attr('x1', mx).attr('x2', mx).style('opacity', 1);
        tip.html(''); tip.append('div').attr('class', 'yr').text(fD(t));
        ['BRA', 'VNM'].forEach(k => { const d = emVigor(k, t); if (!d) return; const r = tip.append('div').attr('class', 'row'); r.append('i').style('background', col[k]); r.append('span').text(`${JNOME[k]}: ${fmtN(d.taxa, 2)}% (desde ${fmtD(d.vig)})`); });
        const tw = tip.node().offsetWidth; const left = m.left + mx + 12;
        tip.style('left', (left + tw > W ? Math.max(0, m.left + mx - tw - 12) : left) + 'px').style('top', (m.top + 8) + 'px').style('opacity', 1);
      })
      .on('pointerleave', () => { tip.style('opacity', 0); hover.style('opacity', 0); });
    drawJurosStats();
  }
  function drawJurosStats() {
    const host = document.getElementById('juros-stats'); if (!host) return; host.replaceChildren();
    const [t0, t1] = jRange();
    const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
    [['BRA', 'br', 'Copom · meta Selic'], ['VNM', 'vn', 'State Bank of Vietnam · taxa de refinanciamento']].forEach(([p, cls, nome]) => {
      const ds = decsOf(p).filter(d => d.t >= t0 && d.t <= t1);
      const box = el('div', 'jstat ' + cls); box.appendChild(el('span', 'who', nome));
      if (!ds.length) { box.appendChild(el('span', 'd', 'Sem decisões registradas no período')); host.appendChild(box); return; }
      const up = ds.filter(d => d.varpp > 0).length, dn = ds.filter(d => d.varpp < 0).length, eq = ds.filter(d => d.varpp === 0).length;
      const taxas = stepPts(p, t0, t1).map(q => q.taxa);
      box.appendChild(el('span', 'n', p === 'BRA' ? `${ds.length} decisões` : `${up + dn} mudanças de taxa`));
      box.appendChild(el('span', 'd', `${up} altas · ${dn} cortes` + (p === 'BRA' ? ` · ${eq} manutenções` : '')));
      box.appendChild(el('span', 'd', `Faixa no período: ${fmtN(d3.min(taxas), 2)}% a ${fmtN(d3.max(taxas), 2)}%`));
      host.appendChild(box);
    });
  }
  function drawDecisoes() {
    const tb = document.getElementById('dec-body'); if (!tb) return; tb.replaceChildren();
    const [t0, t1] = jRange();
    const rows = DECS.filter(d => d.t >= t0 && d.t <= t1 && (state.decPais === 'todos' || d.pais === state.decPais) && (!state.decMud || d.varpp !== 0)).sort((a, b) => b.t - a.t);
    rows.forEach(d => {
      const tr = document.createElement('tr'); tr.className = d.pais === 'BRA' ? 'br' : 'vn';
      const v = d.varpp == null ? '—' : d.varpp === 0 ? 'mantida' : (d.varpp > 0 ? '▲ ' : '▼ ') + sg(d.varpp, 2);
      [NOME[d.pais], fmtD(d.dec), fmtD(d.vig), fmtN(d.taxa, 2) + '%', v, d.doc || '—'].forEach(t => { const td = document.createElement('td'); td.textContent = t; tr.appendChild(td); });
      tb.appendChild(tr);
    });
    const c = document.getElementById('dec-count'); if (c) c.textContent = `(${rows.length})`;
  }

  // ── resultado fiscal: nominal × primário, com os juros como a distância entre as linhas
  const FY0 = 1998, FY1 = 2023;
  function fiscalFacet(el, pais, dom) {
    const get = (ind) => ROWS.filter(r => r.pais === pais && r.indicador === ind && r.ano >= FY0 && r.ano <= FY1).sort((a, b) => a.ano - b.ano);
    const nom = get('resultado_nominal'), pri = get('resultado_primario');
    el.replaceChildren();
    if (!nom.length) { const d = document.createElement('div'); d.className = 'empty'; d.textContent = 'Sem dados no período'; el.appendChild(d); return; }
    const both = nom.map(n => ({ ano: n.ano, n: n.valor, p: (pri.find(q => q.ano === n.ano) || {}).valor })).filter(d => d.p != null);
    const W = Math.max(el.clientWidth || 400, 260), H = 300;
    const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', `${NOME[pais]}: resultado nominal e resultado primário do governo geral, em % do PIB, ${both[0].ano}–${FY1}`);
    const x = d3.scaleLinear().domain([FY0, FY1]);
    const y = d3.scaleLinear().domain(dom).nice();
    const ticksY = y.ticks(6), fmtT = v => sg(v, 0) + '%';
    const tmp = svg.append('g').attr('class', 'axis'); let maxW = 0;
    ticksY.forEach(t => { const tx = tmp.append('text').text(fmtT(t)); maxW = Math.max(maxW, tx.node().getComputedTextLength()); tx.remove(); }); tmp.remove();
    const m = { top: 10, right: 40, bottom: 28, left: Math.ceil(maxW) + 10 };
    const iw = W - m.left - m.right, ih = H - m.top - m.bottom;
    x.range([0, iw]); y.range([ih, 0]);
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);
    g.append('g').attr('class', 'grid').call(d3.axisLeft(y).tickValues(ticksY).tickSize(-iw).tickFormat('')).call(a => a.select('.domain').remove());
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${ih})`).call(d3.axisBottom(x).ticks(Math.max(3, Math.min(7, Math.floor(iw / 60)))).tickFormat(d3.format('d')));
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).tickValues(ticksY).tickFormat(fmtT));
    const colr = C()[pais];
    g.append('path').datum(both).attr('fill', colr).attr('fill-opacity', .16).attr('d', d3.area().x(d => x(d.ano)).y0(d => y(d.n)).y1(d => y(d.p)));
    g.append('line').attr('x1', 0).attr('x2', iw).attr('y1', y(0)).attr('y2', y(0)).attr('stroke', css('--fg-3')).attr('stroke-width', 1);
    g.append('path').datum(both).attr('fill', 'none').attr('stroke', colr).attr('stroke-width', 1.8).attr('stroke-dasharray', '5 4').attr('d', d3.line().x(d => x(d.ano)).y(d => y(d.p)));
    g.append('path').datum(both).attr('fill', 'none').attr('stroke', colr).attr('stroke-width', 2.4).attr('d', d3.line().x(d => x(d.ano)).y(d => y(d.n)));
    const lastB = both[both.length - 1];
    [['n', lastB.n], ['p', lastB.p]].forEach(([k, v]) => g.append('text').attr('class', 'endlbl').attr('x', x(lastB.ano) + 5).attr('y', y(v)).attr('dy', '.35em').attr('fill', colr).attr('opacity', k === 'p' ? .75 : 1).text(sg(v, 1)));
    const lbls = g.selectAll('.endlbl').nodes();
    if (lbls.length === 2) { const a = +lbls[0].getAttribute('y'), b = +lbls[1].getAttribute('y'); if (Math.abs(a - b) < 12) { const mid = (a + b) / 2; lbls[0].setAttribute('y', a < b ? mid - 6 : mid + 6); lbls[1].setAttribute('y', a < b ? mid + 6 : mid - 6); } }
    const tip = d3.select(el).append('div').attr('class', 'tip');
    const hover = g.append('line').attr('class', 'ref').attr('y1', 0).attr('y2', ih).style('opacity', 0);
    svg.append('rect').attr('x', m.left).attr('y', m.top).attr('width', iw).attr('height', ih).attr('fill', 'transparent')
      .on('pointermove', (ev) => {
        const [mx] = d3.pointer(ev, g.node()); const yr = Math.round(x.invert(mx)); const d = both.find(q => q.ano === yr);
        if (!d) { tip.style('opacity', 0); hover.style('opacity', 0); return; }
        hover.attr('x1', x(yr)).attr('x2', x(yr)).style('opacity', 1);
        tip.html(''); tip.append('div').attr('class', 'yr').text(`${NOME[pais]} · ${yr}`);
        [['Resultado nominal', sg(d.n, 1), 1], ['Resultado primário', sg(d.p, 1), .6], ['Juros da dívida', fmtN(d.p - d.n, 1), .25]].forEach(([lb, v, op]) => { const r = tip.append('div').attr('class', 'row'); r.append('i').style('background', colr).style('opacity', op); r.append('span').text(`${lb}: ${v}% do PIB`); });
        const tw = tip.node().offsetWidth; const left = m.left + x(yr) + 12;
        tip.style('left', (left + tw > W ? Math.max(0, m.left + x(yr) - tw - 12) : left) + 'px').style('top', (m.top + 6) + 'px').style('opacity', 1);
      })
      .on('pointerleave', () => { tip.style('opacity', 0); hover.style('opacity', 0); });
  }
  function drawFiscal() {
    const a = document.getElementById('fiscal-br'), b = document.getElementById('fiscal-vn'); if (!a || !b) return;
    const vals = ROWS.filter(r => (r.indicador === 'resultado_nominal' || r.indicador === 'resultado_primario') && r.ano >= FY0 && r.ano <= FY1).map(r => r.valor);
    if (!vals.length) return;
    const lo = Math.min(0, d3.min(vals)), hi = Math.max(0, d3.max(vals)), pad = (hi - lo) * 0.06;
    fiscalFacet(a, 'BRA', [lo - pad, hi + pad]); fiscalFacet(b, 'VNM', [lo - pad, hi + pad]);
  }
  function drawFiscalResumo() {
    const host = document.getElementById('fiscal-resumo'); if (!host) return; host.replaceChildren();
    const Y0 = 2001, Y1 = 2023;
    const ser = (p, ind) => ROWS.filter(r => r.pais === p && r.indicador === ind && r.ano >= Y0 && r.ano <= Y1);
    const media = (p, ind) => d3.mean(ser(p, ind), r => r.valor);
    const T = [
      [`Resultado nominal · média ${Y0}–${Y1} (% do PIB)`, (p) => sg(media(p, 'resultado_nominal'), 1), (p) => { const w = d3.least(ser(p, 'resultado_nominal'), r => r.valor); return `pior ano: ${w.ano} (${sg(w.valor, 1)})`; }],
      [`Resultado primário · média ${Y0}–${Y1} (% do PIB)`, (p) => sg(media(p, 'resultado_primario'), 1), (p) => { const s = ser(p, 'resultado_primario'); return `superávit em ${s.filter(r => r.valor > 0).length} de ${s.length} anos`; }],
      [`Juros líquidos da dívida · média ${Y0}–${Y1} (% do PIB)`, (p) => fmtN(media(p, 'juros_divida'), 1), (p) => { const w = d3.greatest(ser(p, 'juros_divida'), r => r.valor); return `máximo: ${w.ano} (${fmtN(w.valor, 1)})`; }],
    ];
    T.forEach(([label, fmt, dfmt]) => {
      const t = document.createElement('div'); t.className = 'tile';
      const l = document.createElement('span'); l.className = 'l'; l.textContent = label; t.appendChild(l);
      const pair = document.createElement('div'); pair.className = 'pair';
      [['BRA', 'br'], ['VNM', 'vn']].forEach(([p, cls]) => {
        const d = document.createElement('div');
        const c = document.createElement('span'); c.className = 'c ' + cls; c.textContent = NOME[p];
        const n = document.createElement('div'); n.className = 'n'; n.textContent = fmt(p);
        const dd = document.createElement('div'); dd.className = 'd'; dd.textContent = dfmt(p);
        d.append(c, n, dd); pair.appendChild(d);
      });
      t.appendChild(pair); host.appendChild(t);
    });
  }

  // ── table
  const TYEARS = [1990, 1995, 2000, 2005, 2010, 2015, 2018, 2020, 2022, 2023];
  function drawTable() {
    const tb = document.getElementById('tab-body'); tb.replaceChildren();
    ['BRA', 'VNM'].forEach(p => {
      const tr = document.createElement('tr'); tr.className = p === 'BRA' ? 'br' : 'vn';
      const td0 = document.createElement('td'); td0.textContent = NOME[p]; tr.appendChild(td0);
      TYEARS.forEach(y => { const td = document.createElement('td'); td.textContent = fmtInd(state.tab, pick(p, state.tab, y)); tr.appendChild(td); });
      tb.appendChild(tr);
    });
  }

  // ── header ratios
  function drawHeader() {
    const v = (p, y) => pick(p, 'pib_pc_ppp', y);
    document.querySelectorAll('[data-ratio="90"]').forEach(el => { el.textContent = fmtN(v('BRA', 1990) / v('VNM', 1990), 1); });
    document.querySelectorAll('[data-ratio="23"]').forEach(el => { el.textContent = fmtN(v('BRA', 2023) / v('VNM', 2023), 1); });
  }

  // ── ponto de partida (1990) e de chegada (2023)
  const STARTEND = [
    ['PIB per capita nominal (US$)', 'pib_pc_nominal', 0, 'x'],
    ['Exportações de bens e serviços (US$ bi)', 'exportacoes', 1, 'x'],
    ['IDH', 'idh', 3, 'pct'],
  ];
  function drawStartEnd() {
    const host = document.getElementById('startend'); if (!host) return; host.replaceChildren();
    const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
    STARTEND.forEach(([label, ind, dec, mode]) => {
      const box = el('div', 'se'); box.appendChild(el('span', 'l', label + ' · 1990 → 2023'));
      [['BRA', 'br'], ['VNM', 'vn']].forEach(([p, cls]) => {
        const a = pick(p, ind, 1990), b = pick(p, ind, 2023);
        const ch = (a == null || b == null) ? '—' : mode === 'x' ? '×' + fmtN(b / a, 1) : '+' + fmtN((b / a - 1) * 100, 1) + '%';
        const row = el('div', 'se-row ' + cls);
        row.append(el('span', 'who', NOME[p]), el('span', 'a', fmtN(a, dec)), el('span', 'to', '→'), el('span', 'b', fmtN(b, dec)), el('span', 'ch', ch));
        box.appendChild(row);
      });
      host.appendChild(box);
    });
  }

  // ── menu: destaca a seção visível
  function spyNav() {
    const links = [...document.querySelectorAll('#nav a')];
    const secs = links.map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
    if (!secs.length) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const line = innerHeight * 0.4;
      let cur = null;
      secs.forEach(sc => { if (sc.getBoundingClientRect().top <= line) cur = sc; });
      links.forEach(a => {
        const on = !!cur && a.getAttribute('href') === '#' + cur.id;
        if (on && !a.classList.contains('active')) { const nav = a.parentElement; if (nav.scrollWidth > nav.clientWidth) nav.scrollLeft = a.offsetLeft - nav.offsetLeft - 16; }
        a.classList.toggle('active', on);
      });
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  function drawMacro() { macroFacet(document.getElementById('macro-br'), 'BRA'); macroFacet(document.getElementById('macro-vn'), 'VNM'); }
  function redrawAll() { if (!ROWS.length) return; drawTiles(); drawExplorer(); drawMacro(); drawPanels(); drawTable(); drawJuros(); drawFiscal(); }

  // ── wiring
  function wire() {
    const selInd = document.getElementById('sel-ind'), selTab = document.getElementById('sel-tab');
    fillSelect(selInd, 'ind'); fillSelect(selTab, 'tab');
    selInd.addEventListener('change', () => { state.ind = selInd.value; drawExplorer(); });
    selTab.addEventListener('change', () => { state.tab = selTab.value; drawTable(); });
    const ini = document.getElementById('ano-ini'), fim = document.getElementById('ano-fim'), esc = document.getElementById('sel-escala');
    const pushRange = () => { let a = +ini.value || 1990, b = +fim.value || 2023; a = Math.max(1990, Math.min(2023, a)); b = Math.max(1990, Math.min(2023, b)); if (a > b) [a, b] = [b, a]; ini.value = a; fim.value = b; state.y0 = a; state.y1 = b; state.escala = esc.value; drawExplorer(); };
    [ini, fim, esc].forEach(i => i.addEventListener('change', pushRange));
    const mi = document.getElementById('macro-ini'), mf = document.getElementById('macro-fim');
    const pushMacro = () => { let a = +mi.value || 1996, b = +mf.value || 2023; a = Math.max(1990, Math.min(2023, a)); b = Math.max(1990, Math.min(2023, b)); if (a > b) [a, b] = [b, a]; mi.value = a; mf.value = b; state.m0 = a; state.m1 = b; drawMacro(); };
    [mi, mf].forEach(i => i.addEventListener('change', pushMacro));
    document.querySelectorAll('#macro-chips input').forEach(cb => cb.addEventListener('change', () => { cb.closest('.chip').classList.toggle('off', !cb.checked); drawMacro(); }));
    const ji = document.getElementById('jur-ini'), jf = document.getElementById('jur-fim');
    const pushJ = () => { let a = +ji.value || 1999, b = +jf.value || 2023; a = Math.max(1999, Math.min(2023, a)); b = Math.max(1999, Math.min(2023, b)); if (a > b) [a, b] = [b, a]; ji.value = a; jf.value = b; state.j0 = a; state.j1 = b; drawJuros(); drawDecisoes(); };
    if (ji && jf) [ji, jf].forEach(i => i.addEventListener('change', pushJ));
    const dp = document.getElementById('dec-pais'), dm = document.getElementById('dec-mud');
    if (dp) dp.addEventListener('change', () => { state.decPais = dp.value; drawDecisoes(); });
    if (dm) dm.addEventListener('change', () => { state.decMud = dm.checked; drawDecisoes(); });
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(redrawAll, 120); });
  }

  // ── boot
  Promise.all([d3.csv('data/tcc_dados_long.csv'), d3.csv('data/tcc_metadados.csv'), d3.csv('data/tcc_decisoes_juros.csv')]).then(([raw, meta, decs]) => {
    ROWS = toRows(raw); META = meta; DECS = toDecs(decs);
    buildPanels(); wire(); drawHeader(); drawStartEnd(); drawAlas(); drawFiscalResumo(); redrawAll(); drawDecisoes(); spyNav();
    const h = readHash(); if (h) document.getElementById(h).scrollIntoView();
  }).catch(err => {
    console.error(err);
    const d = document.createElement('p'); d.className = 'empty'; d.textContent = 'Não foi possível carregar os dados (data/tcc_dados_long.csv).'; document.getElementById('explorar').appendChild(d);
  });
})();
