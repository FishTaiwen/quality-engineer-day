(function (root) {
  'use strict';
  const D = root.QEData || require('./data.js');
  const VERSION = 1;
  function newGame(seed = Date.now()) {
    let n = Number(seed) >>> 0;
    const pool = D.random.map(e => e.id);
    const draw = () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return pool.splice(n % pool.length, 1)[0]; };
    return { version: VERSION, seed, slot: 0, stats: { quality: 70, stress: 24, credit: 50, downtime: 0, overtime: 0 }, role: 'QE', unlocked: ['QE'], permanent: ['QE'], assignments: {}, quests: { supplier: 0, trace: 0, boundary: 0 }, flags: {}, randomIds: [draw(), draw()], log: [], phase: 'event', result: null, ended: false, ending: null };
  }
  function event(s) {
    const base = s.slot < 12 ? D.day[s.slot] : D.night[s.slot - 12];
    if (!base) return null;
    let e = base.random ? { ...D.random.find(r => r.id === s.randomIds[s.slot === 2 ? 0 : 1]), time: base.time } : base;
    e = { ...e, options: [...e.options] };
    if (e.id === 'nightCustomer' && s.flags.promised8d) e.body += '\n\n你下午承諾的完整 8D，現在成了對方追問的第一句。承諾比證據更早到場。';
    if (e.id === 'nightSupplier' && s.flags.hero) e.body += '\n\n你自願帶回家的待辦又收到一份附件。群組說：「既然你還在線上……」';
    if (e.id === 'ec' && s.quests.trace >= 2) {
      e.hidden = '隱藏事件 · 幽靈版本';
      e.body += '\n\n你從箱號與測試序號查到一份舊版 EC 簽核履歷。原來「沒有變更」只是有人沒看到變更。';
      e.options.unshift(D.option('封存版本履歷，核對切換點', '你保存了舊版履歷與切換證據。這次，記憶有了可追溯的檔案。', { quality: 10, stress: 6, credit: 6, downtime: 18 }, { quest: ['trace', 2], flag: 'archive' }));
    }
    if (e.id === 'off' && s.quests.boundary >= 2) {
      e.hidden = '隱藏事件 · 門禁真的可以刷出去';
      e.body += '\n\n交接窗口回覆：「清單收到，這邊接手。」門禁突然不像一道擺設。';
      e.options.unshift(D.option('確認窗口接手，關閉通知並離場', '你刷出門禁。沒有奇蹟，只有清楚的交接，以及一個不再震動的晚上。', { stress: -12, credit: 4 }, { quest: ['boundary', 2], finish: true, flag: 'left' }));
    }
    if (e.id === 'nightCustomer' && s.quests.trace === 3 && !s.flags.archive) {
      e.hidden = '隱藏事件 · 幽靈版本的備份';
      e.options.unshift(D.option('封存完整履歷，附上版本時間線', '你保存了串起來的證據。文件可以自己說話，你終於不用替每個版本背台詞。', { quality: 7, stress: 3, credit: 7, overtime: 60 }, { flag: 'archive' }));
    }
    return e;
  }
  function enter(s) {
    const e = event(s);
    if (!e || s.ended) return;
    if (!s.permanent.includes(s.role)) s.role = 'QE';
    if (!s.unlocked.includes(e.role)) s.unlocked.push(e.role);
    s.role = e.role;
    s.phase = 'event';
  }
  function effect(s, o) {
    const d = { ...o.delta };
    if (s.role === event(s).role) {
      d.quality = (d.quality || 0) + 2;
      d.credit = (d.credit || 0) + 2;
      d.stress = (d.stress || 0) - 2;
    }
    if (o.quest) {
      const [key, stage] = o.quest;
      if (s.quests[key] === stage && stage === 2) {
        for (const [k, v] of Object.entries(D.quests[key].reward)) d[k] = (d[k] || 0) + v;
      }
    }
    return d;
  }
  function ending(s) {
    if (s.flags.left && s.quests.boundary === 3) return 'boundary';
    if (s.flags.archive && s.quests.trace === 3) return 'archive';
    if (s.stats.quality < 45) return 'recall';
    if (s.stats.stress >= 80 || s.stats.overtime >= 200) return 'burnout';
    if (s.stats.quality >= 80 && s.stats.credit >= 65) return 'stable';
    return 'ordinary';
  }
  function choose(s, index) {
    if (s.ended || s.phase !== 'event') return false;
    const e = event(s), o = e.options[index];
    if (!o) return false;
    const delta = effect(s, o), before = { ...s.stats };
    for (const [k, v] of Object.entries(delta)) s.stats[k] = Math.max(0, ['quality', 'stress', 'credit'].includes(k) ? Math.min(100, s.stats[k] + v) : s.stats[k] + v);
    let questNote = '';
    if (o.quest) {
      const [key, stage] = o.quest;
      if (s.quests[key] === stage) {
        s.quests[key]++;
        questNote = s.quests[key] === 3 ? `支線完成：${D.quests[key].name}（獎勵已計入）` : `支線推進：${D.quests[key].steps[stage]}`;
      } else questNote = `前段線索未完成，這次處置仍有效，但「${D.quests[key].name}」無法接續。`;
    }
    if (o.flag) s.flags[o.flag] = true;
    s.assignments[e.role] = (s.assignments[e.role] || 0) + 1;
    let mastered = '';
    if (s.assignments[e.role] >= 2 && !s.permanent.includes(e.role)) {
      s.permanent.push(e.role);
      mastered = `${e.role} 已取得永久資格。薪資系統：謝謝你的努力。`;
    }
    const actual = Object.fromEntries(Object.keys(s.stats).map(k => [k, s.stats[k] - before[k]]).filter(([, v]) => v));
    s.result = { text: o.text, questNote, mastered, delta: actual, finishing: !!o.finish };
    s.log.push({ time: e.time, title: e.title, role: s.role, choice: o.label, text: o.text, delta: actual, questNote });
    s.phase = 'result';
    if (o.overtime) s.flags.overtime = true;
    return true;
  }
  function advance(s) {
    if (s.ended || s.phase !== 'result') return false;
    if (s.result.finishing || s.slot >= 14) {
      s.ended = true; s.ending = ending(s); s.phase = 'ended'; return true;
    }
    s.slot++; s.result = null; enter(s); return true;
  }
  function switchRole(s, role) {
    if (s.phase !== 'event' || !s.unlocked.includes(role)) return false;
    s.role = role; return true;
  }
  function valid(s) {
    // localStorage 並非可信輸入；拒絕失效版本與不完整狀態。
    if (!s || s.version !== VERSION || !Number.isInteger(s.slot) || s.slot < 0 || s.slot > 14 || !['event', 'result', 'ended'].includes(s.phase)) return false;
    if (!s.stats || !Object.keys(newGame(1).stats).every(k => Number.isFinite(s.stats[k]) && s.stats[k] >= 0 && (!['quality', 'stress', 'credit'].includes(k) || s.stats[k] <= 100))) return false;
    if (!['unlocked', 'permanent'].every(k => Array.isArray(s[k]) && s[k].includes('QE') && s[k].every(r => Object.hasOwn(D.roles, r))) || !s.unlocked.includes(s.role) || !s.permanent.every(r => s.unlocked.includes(r))) return false;
    if (!s.quests || !Object.keys(D.quests).every(k => Number.isInteger(s.quests[k]) && s.quests[k] >= 0 && s.quests[k] <= 3)) return false;
    if (!Array.isArray(s.randomIds) || s.randomIds.length !== 2 || new Set(s.randomIds).size !== 2 || !s.randomIds.every(id => D.random.some(e => e.id === id))) return false;
    if (!Array.isArray(s.log) || s.log.length > 15 || !s.log.every(l => l && ['time', 'title', 'role', 'choice', 'text'].every(k => typeof l[k] === 'string') && l.delta && typeof l.delta === 'object')) return false;
    if (!s.flags || typeof s.flags !== 'object' || Array.isArray(s.flags) || !s.assignments || typeof s.assignments !== 'object') return false;
    if (s.phase === 'result' && (!s.result || typeof s.result.text !== 'string' || !s.result.delta || typeof s.result.delta !== 'object')) return false;
    if (typeof s.ended !== 'boolean' || (s.ended !== (s.phase === 'ended')) || (s.ended && !Object.hasOwn(D.endings, s.ending))) return false;
    return true;
  }
  root.QEEngine = { newGame, event, enter, effect, choose, advance, switchRole, ending, valid, VERSION };
  if (typeof module !== 'undefined') module.exports = root.QEEngine;
})(typeof window !== 'undefined' ? window : globalThis);
