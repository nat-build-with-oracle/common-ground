import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Render actual client HUD components without a browser. Sound is deliberately
// stubbed: this test exercises markup/provenance, not a browser AudioContext.
// Selectors use the real vanilla store, but not React subscription/hydration.
const root = fileURLToPath(new URL('../', import.meta.url));
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'zustand') {
      const vanilla = pathToFileURL(resolve(root, 'node_modules/zustand/vanilla.js')).href;
      const source = `import {createStore} from ${JSON.stringify(vanilla)}; export function create(init) { const api=createStore(init); const hook=selector=>selector(api.getState()); return Object.assign(hook,api); }`;
      return { url: 'data:text/javascript,' + encodeURIComponent(source), shortCircuit: true };
    }
    if (specifier.startsWith('@/') || specifier.startsWith('.')) {
      const base = specifier.startsWith('@/') ? resolve(root, specifier.slice(2)) : fileURLToPath(new URL(specifier, context.parentURL));
      const path = [base, `${base}.ts`, `${base}.tsx`].find(value => existsSync(value) && statSync(value).isFile());
      if (path) return { url: pathToFileURL(path).href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(pathToFileURL(root).href) && /\.tsx?$/.test(url)) {
      const source = ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } }).outputText;
      return { format: 'module', source, shortCircuit: true };
    }
    return next(url, context);
  },
});
const { default: Hud } = await import('../components/Hud.tsx');
const { default: TownMap } = await import('../components/TownMap.tsx');
const { loadTheme, residentFigureVisible, setScrollWheelMode, useOffice } = await import('../components/store.ts');
const { stopWalking, toggleWalk, visitZone, walkAs } = await import('../components/hud/hud.shared.tsx');
const { handleHudKey } = await import('../components/hud/hud.keys.ts');
const { buildWorld } = await import('../components/world.ts');
const initial = useOffice.getState();
const render = (state = {}) => { useOffice.setState({ ...initial, ...state }, true); return renderToStaticMarkup(React.createElement(Hud)); };

test('walk controls enter, switch, and exit oracle bodies without retaining stale identity', () => {
  useOffice.setState({ ...initial, selected: 'oracle-a' }, true);
  toggleWalk(); // H on a selected resident
  assert.equal(useOffice.getState().walking, true);
  assert.equal(useOffice.getState().walkingAs, 'oracle-a');
  assert.equal(useOffice.getState().selected, null);

  useOffice.setState({ selected: 'oracle-b' });
  toggleWalk(); // H on a different selected resident switches bodies
  assert.equal(useOffice.getState().walking, true);
  assert.equal(useOffice.getState().walkingAs, 'oracle-b');

  stopWalking(); // Escape while possessed
  assert.equal(useOffice.getState().walking, false);
  assert.equal(useOffice.getState().walkingAs, null);

  toggleWalk(); // plain H remains walk as You
  assert.equal(useOffice.getState().walking, true);
  assert.equal(useOffice.getState().walkingAs, null);

  walkAs('oracle-a');
  toggleWalk(); // H again releases this resident
  assert.equal(useOffice.getState().walking, false);
  assert.equal(useOffice.getState().walkingAs, null);

  walkAs('oracle-a'); // resident card or palette action
  visitZone(); // every walk exit clears the possessed identity
  assert.equal(useOffice.getState().walking, false);
  assert.equal(useOffice.getState().walkingAs, null);
});

test('oracle shortcuts target the possessed pane, keep preview terminal-free, and release on Esc', () => {
  const press = key => handleHudKey({ key, target: null, preventDefault() {} });
  useOffice.setState({ ...initial, selected: 'oracle-a' }, true);
  press('h');
  useOffice.setState({ selected: 'oracle-b' });
  for (const key of ['e', 'Enter']) {
    press(key);
    assert.equal(useOffice.getState().terminalFull, 'oracle-a');
    useOffice.setState({ terminalFull: null });
  }
  useOffice.setState({ preview: true });
  press('e');
  press('Enter');
  assert.equal(useOffice.getState().terminalFull, null);
  press('Escape');
  assert.equal(useOffice.getState().walking, false);
  assert.equal(useOffice.getState().walkingAs, null);
});

test('the possessed resident figure is hidden without removing other residents', () => {
  assert.equal(residentFigureVisible('oracle-a', 'oracle-a'), false);
  assert.equal(residentFigureVisible('oracle-b', 'oracle-a'), true);
  assert.equal(residentFigureVisible('oracle-a', null), true);
});

test('crest has intrinsic bounded dimensions and every new HUD surface has its stylesheet', () => {
  const markup = render();
  assert.match(markup, /class="town-crest" width="56" height="63"/);
  assert.match(markup, /Common Ground/);
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  for (const selector of ['town-masthead', 'town-crest', 'census', 'attention-card', 'field-tools', 'field-book', 'field-atlas', 'travel-deck']) assert.ok(css.includes(`.${selector} {`), selector);
  assert.match(css, /\.town-crest\s*\{[^}]*max-width:\s*56px/);
  assert.match(css, /\.scene-stage\s*\{[^}]*inset:\s*0/);
  assert.ok(!css.includes('.topbar {'), 'inherited office chrome was removed');
});
test('all field books render with named close controls and explicit empty/preview truth', () => {
  for (const panel of ['residents', 'journal', 'settings']) {
    const markup = render({ hudPanel: panel });
    assert.match(markup, /id="field-book" aria-labelledby="book-title"/);
    assert.match(markup, /aria-label="Close /);
  }
  assert.match(render({ hudPanel: 'residents' }), /No citizens are invented in live mode/);
  const preview = render({ preview: true, hudPanel: 'settings' });
  assert.match(preview, /SYNTHETIC PREVIEW/);
  assert.match(preview, /Unavailable in synthetic preview/);
  assert.match(preview, /This viewer never sends commands/);
});
test('resident surfaces offer walk-as and the possessed HUD keeps live status visible', () => {
  const bot = { id: 'beta', name: 'beta-oracle', color: '#f09b82', title: 'Codex', sectionId: null, status: 'blocked', working: false, seenAt: Date.now(), source: 'herdr', host: 'm5', runtime: 'codex', pane: '%12', project: 'common-ground', href: '' };
  const residents = render({ bots: [bot], hudPanel: 'residents' });
  assert.match(residents, /aria-label="Walk as beta-oracle"/);

  const walking = render({ bots: [bot], walking: true, walkingAs: bot.id });
  assert.match(walking, /class="walking-as-chip" role="status"/);
  assert.match(walking, /Walking as <b>beta-oracle<\/b> · Needs input · <kbd>Esc<\/kbd> to return/);
  assert.match(walking, /<kbd>E<\/kbd> \/ <kbd>Enter<\/kbd> terminal/);

  const preview = render({ bots: [bot], walking: true, walkingAs: bot.id, preview: true });
  assert.doesNotMatch(preview, /<kbd>Enter<\/kbd> terminal/);
});
test('scroll wheel setting renders all modes and persists the selected mode', () => {
  const markup = render({ hudPanel: 'settings', scrollWheelMode: 'auto' });
  for (const label of ['Auto', 'Zoom (mouse)', 'Pan (trackpad)']) assert.ok(markup.includes(`>${label}<`));
  assert.match(markup, /aria-label="Scroll wheel behavior"/);
  assert.match(markup, /aria-checked="true"[^>]*>Auto</);

  const saved = new Map(), localStorageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) } });
  try {
    setScrollWheelMode('zoom');
    assert.equal(saved.get('common-ground-scroll-wheel-mode'), 'zoom');
    useOffice.setState({ scrollWheelMode: 'auto' });
    loadTheme();
    assert.equal(useOffice.getState().scrollWheelMode, 'zoom');
  } finally {
    if (localStorageDescriptor) Object.defineProperty(globalThis, 'localStorage', localStorageDescriptor);
    else delete globalThis.localStorage;
  }
});
test('travel deck lists the eleven places of the nation (keys 1–0 reach the first ten) and the atlas opens accessibly', () => {
  useOffice.setState({ ...initial, atlasOpen: true }, true);
  const markup = renderToStaticMarkup(React.createElement(TownMap, { world: buildWorld([], []), nav: null }));
  assert.equal((markup.match(/class="travel-icon"/g) ?? []).length, 11);
  for (const name of ['Whole nation', 'Parliament', 'Federation', 'Work', 'Home', 'Community', 'Petitions', 'Café', 'Brewery', 'Garden', 'Sport']) assert.ok(markup.includes(name));
  assert.match(markup, /aria-expanded="true" aria-controls="atlas-map"/);
  assert.match(markup, /Simulated families/);
});
