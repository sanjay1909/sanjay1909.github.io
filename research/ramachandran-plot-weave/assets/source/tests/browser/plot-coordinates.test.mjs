import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { renderPlot } from '../../browser/render.mjs';

const rows = JSON.parse(readFileSync(new URL('../../science/data/1crn-residues.json', import.meta.url), 'utf8')).rows;
class Element {
  constructor() { this.attrs = new Map(); this.children = []; this.listeners = {}; }
  setAttribute(key, value) { this.attrs.set(key, String(value)); }
  getAttribute(key) { return this.attrs.get(key) ?? null; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  addEventListener(key, handler) { this.listeners[key] = handler; }
}
globalThis.document = { createElementNS: () => new Element() };

// This stub models the browser's xMidYMid/meet screen transform. It exercises
// the real plot handlers, not a second implementation of their hit testing.
function makePlot({ width, height, left = 40, top = 30 }) {
  const scale = Math.min(width / 560, height / 540);
  const dx = left + (width - 560 * scale) / 2;
  const dy = top + (height - 540 * scale) / 2;
  const svg = new Element();
  const captures = new Set();
  svg.getBoundingClientRect = () => ({ left, top, width, height });
  svg.getScreenCTM = () => ({ inverse: () => ({ a: 1 / scale, b: 0, c: 0, d: 1 / scale, e: -dx / scale, f: -dy / scale }) });
  svg.createSVGPoint = () => ({ x: 0, y: 0, matrixTransform(m) { return { x: m.a * this.x + m.c * this.y + m.e, y: m.b * this.x + m.d * this.y + m.f }; } });
  svg.setPointerCapture = id => captures.add(id);
  svg.hasPointerCapture = id => captures.has(id);
  svg.releasePointerCapture = id => captures.delete(id);
  const event = (x, y, target = svg) => ({ clientX: dx + x * scale, clientY: dy + y * scale, button: 0, pointerId: 1, target });
  const angleEvent = (phi, psi, target) => event(64 + (phi + 180) / 360 * 460, 28 + (180 - psi) / 360 * 460, target);
  return { svg, event, angleEvent, captures };
}
const snapshot = { hasSelection: false, selectedIds: rows.map(row => row.id) };

for (const box of [{ width: 560, height: 540 }, { width: 1120, height: 540 }, { width: 560, height: 1080 }, { width: 1120, height: 1080, left: 123, top: 333 }]) {
  test(`actual brush handlers preserve angle bounds at ${box.width} by ${box.height}`, () => {
    const { svg, angleEvent, captures } = makePlot(box);
    const selections = [];
    renderPlot(svg, rows, snapshot, { onBrush: ids => selections.push(ids) });
    svg.onpointerdown(angleEvent(-150, 170));
    svg.onpointermove(angleEvent(-30, -100));
    svg.onpointerup(angleEvent(-30, -100));
    const expected = rows.filter(row => row.phi !== null && row.psi !== null && row.phi >= -150 && row.phi <= -30 && row.psi >= -100 && row.psi <= 170).map(row => row.id);
    assert(expected.length > 0 && expected.length < 44);
    assert.deepEqual(selections, [expected]);
    assert.equal(captures.size, 0);
  });
}

test('letterbox and plot margins cannot start a brush; cancellation emits no selection', () => {
  const { svg, event, angleEvent, captures } = makePlot({ width: 1120, height: 540 });
  const selections = [];
  renderPlot(svg, rows, snapshot, { onBrush: ids => selections.push(ids) });
  svg.onpointerdown(event(-50, 200));
  svg.onpointermove(angleEvent(-30, -100));
  svg.onpointerup(angleEvent(-30, -100));
  assert.equal(captures.size, 0);
  assert.deepEqual(selections, []);
  svg.onpointerdown(angleEvent(-150, 170));
  svg.onpointermove(angleEvent(-30, -100));
  svg.onpointercancel();
  svg.onpointerup(angleEvent(-30, -100));
  assert.deepEqual(selections, []);
});

test('point click uses the target stable ID under letterboxing', () => {
  const { svg, angleEvent } = makePlot({ width: 560, height: 1080 });
  const picked = [];
  renderPlot(svg, rows, snapshot, { onPick: row => picked.push(row.id) });
  const row = rows.find(item => item.phi !== null && item.psi !== null);
  const target = svg.children.find(node => node.getAttribute('data-row-id') === row.id);
  assert(target);
  svg.onpointerdown(angleEvent(row.phi, row.psi, target));
  svg.onpointerup(angleEvent(row.phi, row.psi, target));
  assert.deepEqual(picked, [row.id]);
});
