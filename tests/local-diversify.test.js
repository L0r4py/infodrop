import test from 'node:test';
import assert from 'node:assert/strict';
import { diversifyLocalArticles } from '../lib/local/diversify.js';

test('diversification limitée aux articles presque aussi récents, sans perte', () => {
  const items = [
    {id:1,source:'A',territory_zone:'comminges',heure:'2026-09-27T12:00:00Z'},
    {id:2,source:'A',territory_zone:'comminges',heure:'2026-09-27T11:59:00Z'},
    {id:3,source:'B',territory_zone:'barousse',heure:'2026-09-27T11:55:00Z'},
    {id:4,source:'C',territory_zone:'val_aran',heure:'2026-09-27T09:00:00Z'},
  ];
  assert.deepEqual(diversifyLocalArticles(items).map(i=>i.id),[1,3,2,4]);
  assert.deepEqual(items.map(i=>i.id),[1,2,3,4]);
});
