/* DOM 呈現與持久化；沒有外部服務、追蹤碼或網路請求。 */
(() => {
  'use strict';
  const D = QEData, E = QEEngine;
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const labels = { quality: '品質', stress: '壓力', credit: '信用', downtime: '停線', overtime: '加班' };
  const SAVE = 'qe-day-save-v1', COLLECTION = 'qe-day-endings-v1';
  let storageOK = true, found = [], state, allLogs = false, toastTimer;
  try {
    const stored = JSON.parse(localStorage.getItem(SAVE));
    if (E.valid(stored)) state = stored;
    const c = JSON.parse(localStorage.getItem(COLLECTION));
    if (Array.isArray(c)) found = [...new Set(c.filter(k => Object.hasOwn(D.endings, k)))];
  } catch (_) { storageOK = false; }
  if (!state) { state = E.newGame(); E.enter(state); }
  function persist() {
    try { localStorage.setItem(SAVE, JSON.stringify(state)); localStorage.setItem(COLLECTION, JSON.stringify(found)); storageOK = true; }
    catch (_) { storageOK = false; }
    $('save-state').textContent = storageOK ? '本機自動存檔' : '存檔不可用 · 本輪仍可遊玩';
  }
  function toast(text) {
    $('toast').textContent = text; $('toast').classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 4200);
  }
  function effectHTML(delta) {
    return Object.entries(delta).filter(([,v]) => v !== 0).map(([k,v]) => {
      const cost = ['downtime', 'overtime'].includes(k);
      const good = k === 'stress' ? v < 0 : v > 0;
      return `<span class="${cost ? 'effect-cost' : good ? 'effect-positive' : 'effect-negative'}">${esc(labels[k] || k)} ${v > 0 ? '+' : ''}${esc(v)}${cost ? ' 分' : ''}</span>`;
    }).join('');
  }
  function preview(o) {
    const raw = E.effect(state,o), actual = {};
    for (const [k,v] of Object.entries(raw)) actual[k] = Math.max(0, ['quality','stress','credit'].includes(k) ? Math.min(100, state.stats[k] + v) : state.stats[k] + v) - state.stats[k];
    return effectHTML(actual) || '<span>數值不變</span>';
  }
  function renderMetrics() {
    const info = [
      ['quality', '批次控制', '--green', state.stats.quality >= 80 ? '守住底線' : state.stats.quality < 45 ? '需要留意' : '持續確認'],
      ['stress', '心裡的待辦', '--pink', state.stats.stress >= 80 ? '快沒有餘裕' : state.stats.stress >= 50 ? '有點想關機' : '還有呼吸空間'],
      ['credit', '交接的信任', '--blue', state.stats.credit >= 65 ? '資料會說話' : '待累積'],
      ['downtime', '保留與查證', '--orange', `加班 ${state.stats.overtime} 分`]
    ];
    $('metrics').innerHTML = info.map(([k, subtitle,color,status]) => `<div class="metric" style="--metric-color:var(${color})"><div class="metric-top"><span>${labels[k]}</span><span>${k === 'downtime' ? 'MIN' : 'INDEX'}</span></div><div class="metric-value">${state.stats[k]}<small>${k === 'downtime' ? '分鐘' : '/ 100'}</small></div><div class="metric-track"><span style="width:${k === 'downtime' ? Math.min(100,state.stats[k]/3) : state.stats[k]}%"></span></div><div class="metric-bottom"><span>${subtitle}</span><span>${status}</span></div></div>`).join('');
  }
  function renderRoles() {
    const role = state.role, [name,quote] = D.roles[role];
    $('role-symbol').textContent = role; $('role-name').textContent = name; $('role-quote').textContent = quote;
    $('role-status').textContent = state.permanent.includes(role) ? '原職 QE · 永久資格 ◆' : `原職 QE · 代班 ${state.assignments[role] || 0} / 2`;
    $('role-count').textContent = `${state.unlocked.length} / 8`;
    $('role-select').innerHTML = state.unlocked.map(r => `<option value="${r}" ${r === role ? 'selected' : ''}>${r} · ${D.roles[r][0]}${state.permanent.includes(r) ? ' ◆' : '（代班）'}</option>`).join('');
    $('role-select').disabled = state.phase !== 'event';
    const e = E.event(state);
    $('role-hint').textContent = state.ended ? '今日派任已結束。資格紀錄保留在本輪報告。' : `本事件指定 ${e.role}；相符時品質 +2、信用 +2、壓力 -2。`;
    $('role-grid').innerHTML = Object.keys(D.roles).map(r => `<button class="role-chip ${state.unlocked.includes(r) ? 'unlocked' : ''} ${state.permanent.includes(r) ? 'permanent' : ''} ${r === role ? 'active' : ''}" data-role="${r}" ${!state.unlocked.includes(r) || state.phase !== 'event' ? 'disabled' : ''} title="${r} · ${D.roles[r][0]} · ${state.unlocked.includes(r) ? state.permanent.includes(r) ? '永久資格' : '可代班，累計兩起指定事件取得永久資格' : '事件派任後解鎖'}">${r}</button>`).join('');
    $('role-grid').querySelectorAll('[data-role]').forEach(b => b.addEventListener('click', () => changeRole(b.dataset.role)));
  }
  function renderQuests() {
    $('quests').innerHTML = Object.entries(D.quests).map(([k,q]) => {
      const n = state.quests[k];
      const passed = n < 3 && (state.ended || state.slot > q.slots[n] || (state.slot === q.slots[n] && state.phase === 'result'));
      const next = n === 3 ? '完成 · 獎勵已計入' : passed ? `本輪錯過：${q.steps[n]}` : `下一步：${q.steps[n]}`;
      return `<div class="quest ${n === 3 ? 'complete' : passed ? 'missed' : ''}"><div class="quest-head"><span class="quest-id">${q.icon}</span><h3>${q.name}</h3><span class="quest-status">${n}/3</span></div><p>${next}</p><div class="quest-track">${q.steps.map((t,i) => `<span class="${i<n ? 'done' : ''}" title="${t}"></span>`).join('')}</div></div>`;
    }).join('');
  }
  function renderEvent() {
    const panel = $('event-panel'), e = E.event(state);
    if (state.ended) {
      const end = D.endings[state.ending];
      panel.innerHTML = `<div class="event-meta"><span>工作日結算</span><span>DAY 01 / FILE CLOSED</span></div><div class="ending-icon">${end.hidden ? '◇' : '▣'}</div><div class="ending-meta">${end.hidden ? '隱藏結局已解鎖' : '今日結局'} · 已收集 ${found.length} / 6</div><h2 id="event-title">${end.title}</h2><p class="event-body">${end.text}</p><div class="ending-summary">${Object.entries(state.stats).map(([k,v]) => `<div>${labels[k]}<b>${v}${['downtime','overtime'].includes(k) ? ' 分' : ''}</b></div>`).join('')}<div>完成支線<b>${Object.values(state.quests).filter(v=>v===3).length} / 3</b></div></div><p class="end-hint">${state.ending === 'boundary' ? '交接與界線可以同時存在。' : '有些線索藏在批號裡，有些藏在你願意為午餐留下的界線裡。'}<br>停線時間是查證的代價，不單獨判定成敗。</p><div class="ending-actions"><button class="primary-button" id="play-again">再過一天，換個選擇</button><button id="end-report">↓ 留下這份交接</button></div>`;
      $('play-again').addEventListener('click', confirmRestart); $('end-report').addEventListener('click', download);
      return;
    }
    if (state.phase === 'result') {
      const r = state.result;
      panel.innerHTML = `<span class="result-tag">DISPOSITION RECORDED / 處置已登錄</span><h2 id="event-title">${r.finishing ? '今日交接，準備結案。' : '紀錄已留下。接著呢？'}</h2><p class="result-body">${esc(r.text)}</p><div class="result-effects">${effectHTML(r.delta)}</div>${r.questNote ? `<div class="result-note">${esc(r.questNote)}</div>` : ''}${r.mastered ? `<div class="result-note">${esc(r.mastered)}</div>` : ''}<button class="primary-button next-button" id="next-event">${r.finishing ? '查看今日結局' : state.slot === 11 ? '進入夜間支援 →' : '前往下一個時段 →'}</button><p class="event-note">實際變化已套用；品質、壓力與信用上限為 100。</p>`;
      $('next-event').addEventListener('click', () => {
        E.advance(state);
        if (state.ended && !found.includes(state.ending)) found.push(state.ending);
        persist(); render(); focusEvent();
      });
      return;
    }
    panel.innerHTML = `<div class="event-meta"><span>${esc(e.tag)}</span><span>${state.slot < 12 ? String(state.slot + 1).padStart(2,'0') + ' / 12' : 'NIGHT ' + (state.slot - 11) + ' / 3'}</span></div>${e.hidden ? `<div class="hidden-label">◇ ${e.hidden}</div>` : ''}<h2 id="event-title">${esc(e.title)}</h2><p class="event-body">${esc(e.body)}</p><div class="event-divider"><span>你打算怎麼處理？</span><span>指定職能 ${e.role} · ${state.role === e.role ? '加成已計入' : '目前未符合'}</span></div><div class="choices">${e.options.map((o,i) => {
      let hint = '';
      if (o.quest) {
        const [k,n] = o.quest;
        hint = state.quests[k] === n ? `↳ 推進「${D.quests[k].name}」${n === 2 ? ' · 完成獎勵已計入' : ''}` : '↳ 前段線索未完成，本輪無法接續此支線';
      }
      return `<button class="choice" data-choice="${i}"><span class="choice-num">${String(i+1).padStart(2,'0')}</span><span class="choice-main"><span class="choice-label">${esc(o.label)}</span><span class="choice-effect">${preview(o)}</span>${hint ? `<span class="quest-hint">${esc(hint)}</span>` : ''}</span><span class="choice-arrow">↗</span></button>`;
    }).join('')}</div><p class="event-note">影響預覽包含職能與支線加成，並已限制數值範圍。沒有完美選項，只有可以交接的選擇。</p>`;
    panel.querySelectorAll('[data-choice]').forEach(b => b.addEventListener('click', () => {
      if (E.choose(state, Number(b.dataset.choice))) { persist(); render(); focusEvent(); }
    }));
  }
  function renderLog() {
    const rows = [...state.log].reverse();
    const shown = allLogs ? rows : rows.slice(0,3);
    $('log-list').innerHTML = shown.length ? shown.map(l => `<div class="log-row"><time>${esc(l.time)}</time><span class="log-role">${esc(l.role)}</span><div><p>${esc(l.choice)}</p><small>${esc(l.text)}</small>${l.questNote ? `<small>${esc(l.questNote)}</small>` : ''}</div></div>`).join('') : '<p class="empty-log">尚無處置紀錄。今天的第一個選擇，會出現在這裡。</p>';
    if (rows.length > 3) {
      const b = document.createElement('button'); b.className = 'log-more'; b.textContent = allLogs ? '收合紀錄 ↑' : `查看全部 ${rows.length} 筆紀錄 ↓`;
      b.addEventListener('click', () => { allLogs = !allLogs; renderLog(); }); $('log-list').appendChild(b);
    }
    $('download-log').disabled = rows.length === 0;
  }
  function render() {
    const e = E.event(state), night = state.slot >= 12;
    $('clock').textContent = state.ended ? '結案' : e.time;
    $('clock-caption').textContent = state.ended ? '今天的你，已完成交接' : night ? '下班後繼續上班' : state.slot >= 10 ? '離下班越近，事情越多' : '表定 18:00 下班';
    $('shift-progress').style.width = `${state.ended ? 100 : (state.slot+1) / (night ? 15 : 12) * 100}%`;
    $('shift-status').textContent = state.ended ? '結案' : night ? '夜間支援' : '日班';
    $('shift-caption').textContent = night ? `已加班 ${state.stats.overtime} 分。讚不是加班費。` : '表定下班，不代表停止收件。';
    $('scene-location').textContent = state.ended ? '工作日已結案' : e.area;
    $('scene-role').textContent = `${state.ended ? '最後職能' : '目前派任'}：${state.role}`;
    $('scene-speech').textContent = state.ended ? '明天的我，先休息一下。' : night ? '公司現在在我家裡。' : state.stats.stress >= 75 ? '我也需要氣密，防止崩潰外洩。' : state.slot >= 8 ? '快下班，是一種敘事技巧。' : '今天應該可以準時吧。';
    $('memo-text').innerHTML = night ? '線上狀態：可聯絡。<br>個人狀態：未確認。' : state.slot >= 8 ? '下班，是一種權限。<br>不是系統自動通知。' : '你的職稱只有一個。<br>你的工作內容不是。';
    $('task-badge').textContent = state.ended ? '✓' : String(state.slot+1).padStart(2,'0');
    $('log-badge').textContent = String(state.log.length).padStart(2,'0'); $('ending-badge').textContent = String(found.length).padStart(2,'0');
    renderMetrics(); renderRoles(); renderQuests(); renderEvent(); renderLog();
  }
  function focusEvent() { $('event-panel').focus({preventScroll:true}); $('event-panel').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'nearest' }); }
  function changeRole(role) { if (E.switchRole(state,role)) { persist(); render(); toast(`目前職能：${role} · ${D.roles[role][0]}`); } }
  function showDialog(title, html) { $('dialog-title').textContent=title; $('dialog-content').innerHTML=html; $('dialog').showModal(); }
  function confirmRestart() {
    showDialog('再過一次這一天？', '<div class="help-content"><p>目前工作日的進度將被新的工作日取代，已收集結局會保留。下一輪會抽出不同插單。</p><button class="primary-button" id="confirm-restart">開始新的工作日</button></div>');
    $('confirm-restart').addEventListener('click', () => { state=E.newGame(); E.enter(state); allLogs=false; $('dialog').close(); persist(); render(); focusEvent(); toast('新工作日已開始。祝你今天的便當是熱的。'); });
  }
  function collection() {
    showDialog(`結局檔案 · ${found.length} / 6`, '<p class="small-note">開新局會保留收藏。兩個隱藏結局的線索與追溯、交接有關。</p>' + Object.entries(D.endings).map(([k,e]) => `<div class="collection-item ${found.includes(k) ? 'found' : ''}"><h3>${found.includes(k) ? (e.hidden ? '◇ ' : '✓ ') + e.title : e.hidden ? '◇ 尚未發現的隱藏結局' : '□ 尚未完成的工作日'}</h3><p>${found.includes(k) ? esc(e.text.split('\n')[0]) : e.hidden ? '有些答案不在加班時數裡。' : '換一種品質、壓力與信用的組合，看看這一天的樣子。'}</p></div>`).join(''));
  }
  function download() {
    const lines = ['《品保工程師的一天》｜虛構工作日交接報告', '第零製造所 · 批次 R-00', `工作日種子：${state.seed}`, `結局：${state.ended ? D.endings[state.ending].title : '尚未結案'}`, Object.entries(state.stats).map(([k,v]) => `${labels[k]} ${v}${['downtime','overtime'].includes(k) ? ' 分鐘' : ''}`).join(' / '), `永久資格：${state.permanent.join('、')}`, '', ...Object.entries(D.quests).map(([k,q]) => `${q.name}：${state.quests[k]}/3`), '', ...state.log.map(l => `${l.time} [${l.role}] ${l.title}\n處置：${l.choice}\n後果：${l.text}\n變化：${Object.entries(l.delta).map(([k,v])=>`${labels[k]} ${v>0?'+':''}${v}`).join('、')}\n${l.questNote || ''}\n`), '全部情節、角色、批次與組織皆為虛構。'];
    const url = URL.createObjectURL(new Blob(['\uFEFF'+lines.join('\n')], {type:'text/plain;charset=utf-8'}));
    showDialog('交接報告已準備好', `<p class="small-note">可以下載文字檔，也可以直接從下方選取、複製整份紀錄。</p><textarea class="report-text" aria-label="完整交接報告" readonly>${esc(lines.join('\n'))}</textarea><a class="primary-button report-download" href="${url}" download="品保工程師的一天-交接紀錄.txt">↓ 下載文字報告</a>`);
    setTimeout(()=>URL.revokeObjectURL(url),300000);
  }
  $('role-select').addEventListener('change', e=>changeRole(e.target.value));
  $('nav-work').addEventListener('click', focusEvent);
  $('nav-quests').addEventListener('click', ()=>$('quests-panel').scrollIntoView({block:'center'}));
  $('nav-roles').addEventListener('click', ()=>$('roles-panel').scrollIntoView({block:'center'}));
  $('nav-log').addEventListener('click', ()=>$('log-panel').scrollIntoView({block:'start'}));
  $('nav-endings').addEventListener('click', collection);
  $('restart-button').addEventListener('click', confirmRestart);
  $('mobile-help').addEventListener('click', () => $('help-button').click());
  $('download-log').addEventListener('click', download);
  $('dialog-close').addEventListener('click', ()=>$('dialog').close());
  $('dialog').addEventListener('click', e=> { const r=$('dialog').getBoundingClientRect(); if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) $('dialog').close(); });
  $('help-button').addEventListener('click', () => showDialog('怎麼過這一天', `<div class="help-content"><p>你是 QE，今天要守住液冷機櫃批次 R-00，也試著守住自己的午餐。</p><ol><li>閱讀事件，選項下方會顯示<strong>實際數值變化</strong>。</li><li>選擇後閱讀後果，再點下一時段。</li><li>新事件會派任職能；可在右側切換已解鎖資格。指定職能處理兩起事件，取得永久資格。</li><li>三條支線須依序完成。錯過節點會標示，新的工作日可以重試。</li><li>18:00 可以離場。接電話會開啟三個夜間時段。</li></ol><p>品質與信用越高越好，壓力越低越有餘裕。<strong>停線是查證的代價</strong>，不是單獨的失敗指標。所有數值僅是敘事模型。</p><p>十二個日班時段、八種職能、三條支線、六個結局，其中兩個藏在線索與界線裡。</p><p class="small-note">自動存檔僅保留於本瀏覽器；清除瀏覽器資料會刪除進度。全部內容與數據皆虛構，不作為實際檢驗、放行或作業指示。</p></div>`));
  persist(); render();
  if (!storageOK) toast('瀏覽器無法儲存進度；仍可完成本輪並匯出交接紀錄。');
})();
