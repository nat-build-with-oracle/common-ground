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
const { selectCitizen, stopWalking, toggleWalk, visitZone, walkAs } = await import('../components/hud/hud.shared.tsx');
const { runAction } = await import('../components/palette/palette.run.ts');
const { paletteItems } = await import('../components/palette/palette.items.ts');
const { handleHudKey } = await import('../components/hud/hud.keys.ts');
const { useFootball } = await import('../components/game/football/football.store.ts');
const { buildWorld } = await import('../components/world.ts');
const initial = useOffice.getState();
const initialFootball = useFootball.getState();
const render = (state = {}) => { useOffice.setState({ ...initial, ...state }, true); return renderToStaticMarkup(React.createElement(Hud)); };

test('walk controls enter, switch, and exit oracle bodies without retaining stale identity', () => {
  const bots = ['oracle-a', 'oracle-b'].map(id => ({ id, name: id, status: 'idle', href: '' }));
  useOffice.setState({ ...initial, bots, selected: 'oracle-a' }, true);
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

test('palette walking actions are explicit and ignore the selected dossier', () => {
  const bot = { id: 'oracle-a', name: 'oracle-a', status: 'idle', href: '' };
  useOffice.setState({ ...initial, bots: [bot], selected: bot.id }, true);
  const start = paletteItems({ bots: [bot], zones: [], preview: false, walking: false, music: false }).find(item => item.key === 'walk');
  assert.equal(start.action.kind, 'walkYourself');
  runAction(start.action);
  assert.equal(useOffice.getState().walking, true);
  assert.equal(useOffice.getState().walkingAs, null);

  const other = { ...bot, id: 'oracle-b', name: 'oracle-b' };
  useOffice.setState({ bots: [bot, other], selected: other.id, walkingAs: bot.id });
  const stop = paletteItems({ bots: [bot, other], zones: [], preview: false, walking: true, music: false }).find(item => item.key === 'walk');
  assert.equal(stop.action.kind, 'stopWalking');
  runAction(stop.action);
  assert.equal(useOffice.getState().walking, false);
  assert.equal(useOffice.getState().walkingAs, null);
});

test('in-page resident picks are remembered per id with a fresh signal for repeat picks', () => {
  const bot = { id: 'oracle-a', name: 'oracle-a', status: 'idle', href: '' };
  useOffice.setState({ ...initial, bots: [bot], pickedResidentIds: new Set() }, true);
  selectCitizen(bot);
  const first = useOffice.getState().pickedResidentIds;
  assert.deepEqual([...first], [bot.id]);
  selectCitizen(bot);
  assert.notEqual(useOffice.getState().pickedResidentIds, first);

  const other = { ...bot, id: 'oracle-b', name: 'oracle-b' };
  useOffice.setState({ bots: [bot, other] });
  runAction({ kind: 'follow', id: other.id });
  assert.deepEqual([...useOffice.getState().pickedResidentIds], [bot.id, other.id]);

  const beforeTerminalPick = useOffice.getState().pickedResidentIds;
  runAction({ kind: 'terminal', id: other.id });
  assert.notEqual(useOffice.getState().pickedResidentIds, beforeTerminalPick);
  assert.equal(useOffice.getState().terminalInput, null, 'a palette terminal pick still opens read-only');
});

test('Enter targets the visible dossier and E targets the possessed pane', () => {
  const press = key => handleHudKey({ key, target: null, preventDefault() {} });
  const bots = ['oracle-a', 'oracle-b'].map(id => ({ id, name: id, status: 'idle', href: '' }));
  useOffice.setState({ ...initial, bots, selected: 'oracle-a' }, true);
  press('h');
  useOffice.setState({ selected: 'oracle-b' });
  const dossier = renderToStaticMarkup(React.createElement(Hud));
  assert.match(dossier, /<h3>oracle-b<\/h3>/);
  assert.match(dossier, /Open full terminal <kbd>Enter<\/kbd>/);
  press('Enter');
  assert.equal(useOffice.getState().terminalFull, 'oracle-b');
  useOffice.setState({ terminalFull: null });
  press('e');
  assert.equal(useOffice.getState().terminalFull, 'oracle-a');
  useOffice.setState({ terminalFull: null, selected: null });
  press('Enter');
  assert.equal(useOffice.getState().terminalFull, 'oracle-a');
  useOffice.setState({ terminalFull: null });
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
  const other = { ...bot, id: 'gamma', name: 'gamma-oracle', pane: '%13' };
  const residents = render({ bots: [bot], hudPanel: 'residents' });
  assert.match(residents, /aria-label="Walk as beta-oracle"/);

  const walking = render({ bots: [bot], walking: true, walkingAs: bot.id });
  assert.match(walking, /class="walking-as-chip" role="status"/);
  assert.match(walking, /Walking as <b>beta-oracle<\/b> · Needs input · <kbd>Esc<\/kbd> return to overview/);
  assert.match(walking, /<kbd>E<\/kbd> \/ <kbd>Enter<\/kbd> terminal/);

  const selected = render({ bots: [bot, other], walking: true, walkingAs: bot.id, selected: other.id });
  assert.match(selected, /<kbd>E<\/kbd> beta-oracle terminal · <kbd>Enter<\/kbd> gamma-oracle terminal/);
  assert.match(selected, /<kbd>H<\/kbd> walk as gamma-oracle/);
  assert.equal((selected.match(/<kbd>Esc<\/kbd> return to overview/g) ?? []).length, 1);
  assert.doesNotMatch(selected, /<kbd>H<\/kbd> stop/);

  const walkingAsYourself = render({ bots: [bot], walking: true, walkingAs: null, selected: bot.id });
  assert.match(walkingAsYourself, /<kbd>H<\/kbd> walk as beta-oracle/);

  const currentDossier = render({ bots: [bot], walking: true, walkingAs: bot.id, selected: bot.id });
  assert.match(currentDossier, /Return to overview <kbd>H<\/kbd>/);
  assert.doesNotMatch(currentDossier, /> Walk as beta-oracle <kbd>H<\/kbd>/);

  const preview = render({ bots: [bot], walking: true, walkingAs: bot.id, preview: true });
  assert.doesNotMatch(preview, /<kbd>Enter<\/kbd> terminal/);
});

test('offline residents cannot be walked as', () => {
  const offline = { id: 'offline', name: 'offline-oracle', color: '#aaa', title: 'Codex', sectionId: null, status: 'offline', working: false, seenAt: Date.now(), source: 'herdr', host: 'm5', runtime: 'codex', pane: '%12', project: 'common-ground', href: '' };
  useOffice.setState({ ...initial, bots: [offline], selected: offline.id }, true);
  walkAs(offline.id);
  assert.equal(useOffice.getState().walkingAs, null);
  const residents = render({ bots: [offline], hudPanel: 'residents' });
  assert.match(residents, /class="resident-walk" disabled="" aria-label="Walk as offline-oracle"/);
  assert.equal(paletteItems({ bots: [offline], zones: [], preview: false, walking: false, music: false }).find(item => item.action.kind === 'walkAs').disabled, true);

  const live = { ...offline, id: 'live', name: 'live-oracle', status: 'idle' };
  useOffice.setState({ ...initial, bots: [live, offline], walking: true, walkingAs: live.id, selected: offline.id }, true);
  const hints = renderToStaticMarkup(React.createElement(Hud));
  assert.match(hints, /<kbd>E<\/kbd> live-oracle terminal/);
  assert.doesNotMatch(hints, /<kbd>Enter<\/kbd> offline-oracle terminal/);
  assert.doesNotMatch(hints, /<kbd>H<\/kbd> walk as offline-oracle/);
  assert.match(hints, /<kbd>H<\/kbd> stop/);
  assert.match(hints, /<kbd>Esc<\/kbd> return to overview/);
  toggleWalk();
  assert.equal(useOffice.getState().walking, false);
});

test('football disables walk-as entry points and explains why', () => {
  const bot = { id: 'beta', name: 'beta-oracle', color: '#f09b82', title: 'Codex', sectionId: null, status: 'idle', working: false, seenAt: Date.now(), source: 'herdr', host: 'm5', runtime: 'codex', pane: '%12', project: 'common-ground', href: '' };
  useFootball.setState({ ...initialFootball, match: { ...initialFootball.match, phase: 'playing' } }, true);
  try {
    const residents = render({ bots: [bot], hudPanel: 'residents', walking: true, walkingAs: null });
    assert.match(residents, /Walk as unavailable during a match/);
    assert.match(residents, /class="resident-walk" disabled="" aria-label="Walk as beta-oracle"/);
    walkAs(bot.id);
    assert.equal(useOffice.getState().walkingAs, null);

    const dossier = render({ bots: [bot], selected: bot.id, walking: true, walkingAs: null });
    assert.match(dossier, /disabled=""[^>]*>.*Walk as unavailable during a match/);
  } finally {
    useFootball.setState(initialFootball, true);
  }
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

test('session links survive a failed roster request, a fresh tab and terminal history traversal', async () => {
  const { followSessionUrl } = await import('../components/SessionUrl.tsx');
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const initialUrl = 'https://town.test/s/herdr%3AB?host=http%3A%2F%2F127.0.0.1%3A3457&walk=1&as=herdr%3AA';
  let location = new URL(initialUrl);
  const history = [location.href];
  let index = 0;
  const browser = new EventTarget();
  Object.assign(browser, {
    history: {
      pushState(_, __, url) {
        location = new URL(url, location);
        history.splice(++index, Infinity, location.href);
      },
      replaceState(_, __, url) {
        location = new URL(url, location);
        history[index] = location.href;
      },
    },
  });
  Object.defineProperty(browser, 'location', { get: () => location });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: browser });
  const roster = {
    updatedAt: 3, loading: false, preview: false,
    sources: [{ id: 'herdr', status: 'connected' }],
    bots: [{ id: 'herdr:A', status: 'idle' }, { id: 'herdr:B', status: 'idle' }],
  };
  const identities = () => {
    const { selected, walkingAs, terminalFull } = useOffice.getState();
    return [selected, walkingAs, terminalFull];
  };
  let stop;
  try {
    useOffice.setState(initial, true);
    stop = followSessionUrl();
    // A tokenless hosted tab may show the synthetic town, but it must retain the live route.
    useOffice.setState({ preview: true, updatedAt: 1, loading: false, bots: [{ id: 'herdr:A', status: 'idle' }, { id: 'herdr:B', status: 'idle' }] });
    assert.equal(location.href, initialUrl);
    assert.deepEqual(identities(), [null, null, null]);
    assert.equal(useOffice.getState().pendingWalkId, 'herdr:A');
    // A timestamped response whose requested source failed is still not a roster for that source.
    useOffice.setState({ preview: false, updatedAt: 2, sources: [{ id: 'herdr', status: 'error' }], error: 'Temporary network failure' });
    assert.equal(location.href, initialUrl);
    assert.deepEqual(identities(), [null, null, null]);
    useOffice.setState({ ...roster, error: '' });
    assert.deepEqual(identities(), ['herdr:B', 'herdr:A', null]);
    handleHudKey({ key: 'e', target: null, preventDefault() {} });
    assert.equal(useOffice.getState().terminalInput, null, 'the restored walk opens read-only');
    assert.equal(location.searchParams.get('t'), '1');
    assert.equal(index, 1);
    stop();
    useOffice.setState({ ...initial, ...roster }, true);
    stop = followSessionUrl();
    assert.deepEqual(identities(), ['herdr:B', 'herdr:A', 'herdr:A']);
    location = new URL(history[--index]);
    browser.dispatchEvent(new Event('popstate'));
    assert.deepEqual(identities(), ['herdr:B', 'herdr:A', null]);
    location = new URL(history[++index]);
    browser.dispatchEvent(new Event('popstate'));
    assert.deepEqual(identities(), ['herdr:B', 'herdr:A', 'herdr:A']);
    assert.equal(useOffice.getState().terminalInput, null);
    // Returning to the same pane from history must also revoke an existing typing grant.
    useOffice.setState({ terminalInput: 'herdr:A' });
    browser.dispatchEvent(new Event('popstate'));
    assert.equal(useOffice.getState().terminalInput, null);
    assert.equal(history.length, 2);

    // History can enter a route whose provider is currently failed. Revoke input at once,
    // retain that route, and wait for a connected roster before resolving it.
    useOffice.setState({ terminalInput: 'herdr:A', sources: [...roster.sources, { id: 'maw', status: 'error' }] });
    location = new URL('https://town.test/s/maw%3AA?walk=1&as=maw%3AA&t=1');
    browser.dispatchEvent(new Event('popstate'));
    assert.equal(useOffice.getState().terminalInput, null);
    assert.equal(useOffice.getState().terminalFull, null);
    assert.equal(location.pathname, '/s/maw%3AA');

    assert.equal(useOffice.getState().pendingWalkId, 'maw:A');
    walkAs('herdr:B');
    assert.equal(useOffice.getState().pendingWalkId, null);
    assert.equal(location.searchParams.get('as'), 'herdr:B');
    useOffice.setState({ sources: [...roster.sources, { id: 'maw', status: 'connected' }], bots: [...roster.bots, { id: 'maw:A', status: 'idle' }] });
    assert.deepEqual(identities(), [null, 'herdr:B', null]);

    for (const reason of ['missing', 'offline']) {
      stop();
      location = new URL('https://town.test/?walk=1&as=A');
      const bots = reason === 'offline' ? [{ id: 'A', name: 'A', status: 'offline' }] : [];
      useOffice.setState({ ...initial, ...roster, preview: reason === 'missing', bots }, true);
      stop = followSessionUrl();
      assert.deepEqual(useOffice.getState().sessionNotice, { target: 'walk', id: 'A', reason });
      assert.equal(useOffice.getState().walking, false);
      assert.equal(location.search, '');
      const { Overlays } = await import('../components/hud/hud.overlays.tsx');
      const markup = renderToStaticMarkup(React.createElement(Overlays));
      assert.match(markup, reason === 'offline' ? /A is offline/ : /A wasn&#x27;t found/);
      assert.match(markup, />Walk as yourself<\/button>/);
    }
  } finally {
    stop?.();
    useOffice.setState(initial, true);
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else delete globalThis.window;
  }
});

test('the delayed visitor walk is cancelled by selection or navigation', async () => {
  const { requestedSessionIds, startWalking } = await import('../components/SessionUrl.tsx');
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  let location = new URL('https://town.test/');
  const browser = new EventTarget();
  Object.assign(browser, { setTimeout, clearTimeout });
  Object.defineProperty(browser, 'location', { get: () => location });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: browser });
  try {
    assert.deepEqual(requestedSessionIds('/s/herdr%3AB', '?host=http://127.0.0.1:3457&walk=1&as=herdr%3AA'), ['herdr:B', 'herdr:A']);
    useOffice.setState(initial, true);
    startWalking(5);
    useOffice.setState({ selected: 'B' });
    await new Promise(resolve => setTimeout(resolve, 15));
    assert.equal(useOffice.getState().walking, false);

    useOffice.setState({ ...initial }, true);
    startWalking(5);
    location = new URL('https://town.test/s/B');
    browser.dispatchEvent(new Event('popstate'));
    await new Promise(resolve => setTimeout(resolve, 15));
    assert.equal(useOffice.getState().walking, false);

    useOffice.setState({ ...initial }, true);
    location = new URL('https://town.test/');
    startWalking(5);
    useOffice.setState({ hudPanel: 'residents' });
    await new Promise(resolve => setTimeout(resolve, 15));
    assert.equal(useOffice.getState().walking, false);

    useOffice.setState({ ...initial }, true);
    startWalking(5);
    useOffice.setState({ atlasOpen: true });
    await new Promise(resolve => setTimeout(resolve, 15));
    assert.equal(useOffice.getState().walking, false);
  } finally {
    useOffice.setState(initial, true);
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else delete globalThis.window;
  }
});

test('roster removal releases possession and its open terminal in the same update', async t => {
  const { refreshFleet } = await import('../components/store.ts');
  const bots = ['A', 'B'].map(id => ({ id, status: 'idle', source: 'herdr' }));
  useOffice.setState({ ...initial, bots, walking: true, walkingAs: 'A', terminalFull: 'A', selected: 'B' }, true);
  const remaining = bots.slice(1);
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    bots: remaining, sections: [], sources: [{ id: 'herdr', status: 'connected' }], readOnly: true, updatedAt: 1,
  }));
  const observed = [];
  const unsubscribe = useOffice.subscribe(state => {
    if (state.updatedAt) observed.push([state.walkingAs, state.terminalFull, state.selected]);
  });
  try {
    await refreshFleet();
    assert.deepEqual(observed, [[null, null, 'B']]);
  } finally {
    unsubscribe();
    useOffice.setState(initial, true);
  }
});

const { closeTerminal, enableTerminalInput, openTerminal } = await import('../components/term/term.actions.ts');
const live = { id: 'live', name: 'Live Oracle', status: 'idle' };
const offline = { id: 'offline', name: 'Offline Oracle', status: 'offline' };
const press = key => handleHudKey({ key, target: null, preventDefault() {} });

test('terminal views remain read-only until the resident is explicitly authorized', () => {
  useOffice.setState({ ...initial, bots: [live, offline], terminalFull: null, terminalInput: null }, true);
  assert.equal(openTerminal(live.id), true);
  assert.equal(useOffice.getState().terminalFull, live.id);
  assert.equal(useOffice.getState().terminalInput, null);

  assert.equal(enableTerminalInput(live.id), true);
  assert.equal(useOffice.getState().terminalInput, live.id);
  closeTerminal();
  assert.equal(useOffice.getState().terminalFull, null);
  assert.equal(useOffice.getState().terminalInput, null);
});

test('URL-picked residents stay read-only until the visitor explicitly enables input', () => {
  const other = { id: 'other-live', name: 'Other Live Oracle', status: 'idle' };
  useOffice.setState({ ...initial, bots: [live, other], walking: true, walkingAs: live.id, selected: null, pickedResidentIds: new Set() }, true);
  selectCitizen(other);
  press('e');
  assert.equal(useOffice.getState().terminalFull, live.id);
  assert.equal(useOffice.getState().terminalInput, null, 'picking B does not authorize URL-picked A');

  closeTerminal();
  useOffice.setState({ selected: live.id, hudPanel: null });
  press('Enter');
  assert.equal(useOffice.getState().terminalFull, live.id);
  assert.equal(useOffice.getState().terminalInput, null, 'Enter opens a URL-picked dossier read-only');

  assert.equal(enableTerminalInput(live.id), true);
  assert.equal(useOffice.getState().terminalInput, live.id, 'the explicit Type into button still grants input');
});

test('E and Enter authorize residents the visitor picked in the page', () => {
  useOffice.setState({ ...initial, bots: [live], walking: true, walkingAs: live.id, selected: null, pickedResidentIds: new Set() }, true);
  selectCitizen(live);
  press('Enter');
  assert.equal(useOffice.getState().terminalFull, live.id);
  assert.equal(useOffice.getState().terminalInput, live.id, 'Enter authorizes the dossier selected in-page');

  closeTerminal();
  useOffice.setState({ selected: live.id, hudPanel: 'residents' });
  press('Enter');
  assert.equal(useOffice.getState().terminalInput, null, 'a covered dossier is not visible');

  closeTerminal();
  useOffice.setState({ hudPanel: null });
  press('Enter');
  assert.equal(useOffice.getState().terminalInput, live.id);

  closeTerminal();
  useOffice.setState({ selected: null });
  press('e');
  assert.equal(useOffice.getState().terminalInput, live.id);
});

test('offline residents cannot be opened or authorized for terminal input', () => {
  useOffice.setState({ ...initial, bots: [live, offline], terminalFull: null, terminalInput: null }, true);
  assert.equal(openTerminal(offline.id), false);
  assert.equal(useOffice.getState().terminalFull, null);

  useOffice.setState({ terminalFull: offline.id });
  assert.equal(enableTerminalInput(offline.id), false);
  assert.equal(useOffice.getState().terminalInput, null);
});

test('a failed source or disconnected fleet revokes input before the next keystroke', async t => {
  const { refreshFleet } = await import('../components/store.ts');
  const resident = { ...live, source: 'herdr' };
  const fetch = t.mock.method(globalThis, 'fetch');
  for (const response of [
    async () => Response.json({ readOnly: true, updatedAt: 1, bots: [], sections: [], sources: [{ id: 'herdr', status: 'error' }] }),
    async () => { throw new Error('Disconnected'); },
  ]) {
    useOffice.setState({ ...initial, bots: [resident], walking: true, walkingAs: live.id, terminalFull: live.id, terminalInput: live.id }, true);
    fetch.mock.mockImplementation(response);
    await refreshFleet();
    const state = useOffice.getState();
    assert.equal(state.bots[0].status, 'offline');
    assert.deepEqual([state.walkingAs, state.terminalFull, state.terminalInput], [null, null, null]);
  }
});
