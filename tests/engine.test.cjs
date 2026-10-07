const assert = require('node:assert/strict');
const D = require('../js/data.js');
const E = require('../js/engine.js');
function play(select, seed = 47) {
  const s = E.newGame(seed); E.enter(s);
  let turns = 0;
  while (!s.ended) {
    assert.ok(E.valid(s), `valid at ${s.slot}`);
    const e = E.event(s), i = select(e,s);
    assert.ok(E.choose(s,i), `${e.id}: option ${i}`);
    assert.ok(!E.choose(s,i), 'double submission rejected');
    assert.ok(E.valid(s));
    E.advance(s); turns++;
    assert.ok(turns <= 15);
  }
  assert.ok(E.valid(s));
  return s;
}
const hiddenBoundary = play(() => 0);
assert.equal(hiddenBoundary.ending, 'boundary');
assert.deepEqual(hiddenBoundary.quests, {supplier:3, trace:3, boundary:3});
assert.equal(hiddenBoundary.stats.overtime, 0);
assert.equal(hiddenBoundary.log.length,12);
assert.equal(hiddenBoundary.unlocked.length,8);
const archive = play((e) => e.id === 'lunch' ? 1 : 0);
assert.equal(archive.ending,'archive');
assert.ok(archive.flags.archive);
const night = play((e) => e.id === 'off' ? e.options.findIndex(o=>o.overtime) : 0);
assert.equal(night.log.length,15);
assert.ok(night.stats.overtime > 0);
assert.ok(night.permanent.includes('SQE'));
assert.ok(night.permanent.includes('CQE'));
assert.ok(E.event(night).id === 'midnight');
const backup = play(e => e.id === 'ec' ? e.options.findIndex(o=>o.quest && !o.flag) : e.id === 'off' ? e.options.findIndex(o=>o.overtime) : 0);
assert.equal(backup.ending,'archive');
assert.ok(backup.flags.archive);
const s = E.newGame(100); E.enter(s);
const o = E.event(s).options[0], matching = E.effect(s,o);
E.switchRole(s,'QE');
assert.equal(E.effect(s,o).quality, matching.quality-2);
assert.equal(E.switchRole(s,'SQE'),false);
assert.equal(E.switchRole(s,'INVALID'),false);
assert.deepEqual(E.newGame(100).randomIds, s.randomIds);
const altered = JSON.parse(JSON.stringify(s)); altered.randomIds=['bad','bad']; assert.equal(E.valid(altered),false);
assert.equal(E.valid({version:1}),false);
const reached = new Set();
let rng = 59132;
for (let run=0; run<4000; run++) {
  const result = play((e) => { rng=(Math.imul(rng,1664525)+1013904223)>>>0; return rng%e.options.length; }, run);
  reached.add(result.ending);
  for (const k of ['quality','stress','credit']) assert.ok(result.stats[k]>=0 && result.stats[k]<=100);
}
assert.deepEqual([...reached].sort(),Object.keys(D.endings).sort(),'all six endings reachable');
assert.equal(D.random.length,8);
assert.equal(D.day.length,12);
assert.equal(D.night.length,3);
console.log('PASS: 4,000 complete simulated workdays; 6 reachable endings; 3 complete quests; 8 roles; overtime, mastery, seed, caps and save validation.');
