/**
 * 梅花易数 · 字占 - 应用主逻辑
 */
(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const charInput    = $('#charInput');
  const strokeBadge  = $('#strokeBadge');
  const strokeManual = $('#strokeManual');
  const manualStroke = $('#manualStroke');
  const shichenDisp  = $('#shichenDisplay');
  const btnDivine    = $('#btnDivine');
  const btnRetry     = $('#btnRetry');

  let currentChar = '';
  let currentStroke = null;

  // ========== 初始化 ==========
  function init() {
    updateShichen();
    setInterval(updateShichen, 60000);
    bindEvents();
  }

  function updateShichen() {
    const sc = getCurrentShichen();
    const h = new Date().getHours();
    const m = String(new Date().getMinutes()).padStart(2, '0');
    shichenDisp.textContent = `${sc.name}时 (${h}:${m})`;
  }

  // ========== 事件绑定 ==========
  function bindEvents() {
    charInput.addEventListener('input', onCharInput);
    manualStroke.addEventListener('input', onManualStroke);
    btnDivine.addEventListener('click', startDivine);
    btnRetry.addEventListener('click', goHome);

    charInput.addEventListener('compositionstart', () => { charInput._composing = true; });
    charInput.addEventListener('compositionend', () => {
      charInput._composing = false;
      onCharInput();
    });
  }

  function onCharInput() {
    if (charInput._composing) return;
    const raw = charInput.value.trim();
    if (raw.length > 1) charInput.value = raw.charAt(raw.length - 1);
    const c = charInput.value.trim();

    if (!c || !/[\u4e00-\u9fff]/.test(c)) {
      currentChar = '';
      currentStroke = null;
      strokeBadge.textContent = '笔画：-';
      strokeBadge.classList.remove('found');
      strokeManual.classList.remove('show');
      btnDivine.disabled = true;
      return;
    }

    currentChar = c;
    const sc = getStrokeCount(c);

    if (sc) {
      currentStroke = sc;
      strokeBadge.textContent = `笔画：${sc}`;
      strokeBadge.classList.add('found');
      strokeManual.classList.remove('show');
      manualStroke.value = '';
      btnDivine.disabled = false;
    } else {
      currentStroke = null;
      strokeBadge.textContent = '笔画：?';
      strokeBadge.classList.remove('found');
      strokeManual.classList.add('show');
      btnDivine.disabled = true;
    }
  }

  function onManualStroke() {
    const v = parseInt(manualStroke.value);
    if (v > 0 && v <= 64) {
      currentStroke = v;
      strokeBadge.textContent = `笔画：${v}`;
      strokeBadge.classList.add('found');
      btnDivine.disabled = false;
    } else {
      currentStroke = null;
      btnDivine.disabled = true;
    }
  }

  // ========== 起卦流程 ==========
  function startDivine() {
    if (!currentChar || !currentStroke) return;
    showScreen('screen-divining');

    const texts = ['天地感应中…', '阴阳交合…', '卦象初成…', '推演变化…', '解读卦意…'];
    let i = 0;
    const divText = $('#diviningText');
    const timer = setInterval(() => {
      i++;
      if (i < texts.length) divText.textContent = texts[i];
    }, 400);

    setTimeout(() => {
      clearInterval(timer);
      const result = divineBySingleChar(currentStroke);
      renderResult(result);
      showScreen('screen-result');
    }, 2200);
  }

  // ========== 页面切换 ==========
  function showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    $(`#${id}`).classList.add('active');
    window.scrollTo(0, 0);
  }

  function goHome() {
    charInput.value = '';
    currentChar = '';
    currentStroke = null;
    strokeBadge.textContent = '笔画：-';
    strokeBadge.classList.remove('found');
    strokeManual.classList.remove('show');
    btnDivine.disabled = true;
    showScreen('screen-home');
    updateShichen();
  }

  // ========== 渲染结果 ==========
  function renderResult(r) {
    const interp = HEXAGRAM_INTERP[`${r.benGua.upperNum},${r.benGua.lowerNum}`] || {};

    // 顶部信息
    $('#resultChar').textContent = currentChar;
    $('#resultMeta').textContent = `笔画 ${r.strokeCount} · ${r.shichen.name}时 · 动爻第${r.yaoPos}爻`;

    // 卦象图形
    renderHexagramDisplay(r);

    // 运势
    renderLuck(interp, r);

    // 卦辞象辞
    renderGuaci(interp);

    // 体用分析
    renderTiyong(r);

    // 总结
    renderSummary(interp);

    // 分类解读
    renderInterpGrid(interp);
  }

  function renderHexagramDisplay(r) {
    const container = $('#hexagramDisplay');
    container.innerHTML = '';

    const guaData = [
      { label: '本卦', gua: r.benGua, yaoPos: r.yaoPos },
      { label: '互卦', gua: r.huGua, yaoPos: 0 },
      { label: '变卦', gua: r.bianGua, yaoPos: 0 },
    ];

    guaData.forEach(({ label, gua, yaoPos }) => {
      const div = document.createElement('div');
      div.className = 'gua-visual';

      const linesHtml = gua.lines.map((line, idx) => {
        const isDong = (yaoPos > 0 && idx === yaoPos - 1);
        const type = line === 1 ? 'yang' : 'yin';
        return `<div class="yao-line ${type}${isDong ? ' dong' : ''}"></div>`;
      }).join('');

      const upperT = TRIGRAMS[gua.upperNum];
      const lowerT = TRIGRAMS[gua.lowerNum];

      div.innerHTML = `
        <div class="label">${label}</div>
        <div class="gua-lines">${linesHtml}</div>
        <div class="gua-name">${gua.short || gua.name}</div>
        <div class="gua-sub">${upperT.nature}${lowerT.nature} · ${gua.name}</div>
      `;
      container.appendChild(div);
    });
  }

  function renderLuck(interp, r) {
    const card = $('#luckCard');
    const luckText = interp.luck || r.wuxing.luck || '平';
    const luckClass = {
      '大吉': 'daji', '吉': 'ji', '小吉': 'xiaoji',
      '平': 'ping', '小凶': 'xiaoxiong', '凶': 'xiong'
    }[luckText] || 'ping';

    card.innerHTML = `
      <div class="luck-badge ${luckClass}">${luckText}</div>
      <div class="luck-desc">${r.wuxing.relation} · ${r.wuxing.desc}</div>
    `;
  }

  function renderGuaci(interp) {
    const sec = $('#guaciSection');
    sec.innerHTML = `
      <div class="title">【卦辞】</div>
      <div class="text">${interp.guaci || '-'}</div>
      <div class="title" style="margin-top:12px">【象曰】</div>
      <div class="text">${interp.image || '-'}</div>
    `;
  }

  function renderTiyong(r) {
    const card = $('#tiyongCard');
    card.innerHTML = `
      <div class="tiyong-title">体用分析</div>
      <div class="tiyong-row">
        <div class="tiyong-item">
          <div class="role">体卦（我方）</div>
          <div class="info">${r.ti.name}${r.ti.symbol}</div>
          <div class="element">${r.ti.nature} · 五行${r.ti.element}</div>
        </div>
        <div class="tiyong-item">
          <div class="role">用卦（对方/事）</div>
          <div class="info">${r.yong.name}${r.yong.symbol}</div>
          <div class="element">${r.yong.nature} · 五行${r.yong.element}</div>
        </div>
      </div>
      <div class="tiyong-relation">${r.wuxing.relation}：${r.wuxing.desc}</div>
    `;
  }

  function renderSummary(interp) {
    const card = $('#summaryCard');
    card.innerHTML = `
      <div class="summary-text">${interp.summary || ''}</div>
      <div class="advice-text">${interp.advice || ''}</div>
    `;
  }

  function renderInterpGrid(interp) {
    const grid = $('#interpGrid');
    const items = [
      { icon: '💼', cat: '事业', desc: interp.career },
      { icon: '❤️', cat: '感情', desc: interp.love },
      { icon: '💰', cat: '财运', desc: interp.wealth },
      { icon: '🏥', cat: '健康', desc: interp.health },
    ];
    grid.innerHTML = items.map(it => `
      <div class="interp-item">
        <div class="icon">${it.icon}</div>
        <div class="cat">${it.cat}</div>
        <div class="desc">${it.desc || '-'}</div>
      </div>
    `).join('');
  }

  // ========== 启动 ==========
  document.addEventListener('DOMContentLoaded', init);
})();
