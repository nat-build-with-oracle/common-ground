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
const { useOffice } = await import('../components/store.ts');
const { buildWorld } = await import('../components/world.ts');
const initial = useOffice.getState();
const render = (state = {}) => { useOffice.setState({ ...initial, ...state }, true); return renderToStaticMarkup(React.createElement(Hud)); };

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
test('travel deck lists the eleven places of the nation (keys 1–0 reach the first ten) and the atlas opens accessibly', () => {
  useOffice.setState({ ...initial, atlasOpen: true }, true);
  const markup = renderToStaticMarkup(React.createElement(TownMap, { world: buildWorld([], []), nav: null }));
  assert.equal((markup.match(/class="travel-icon"/g) ?? []).length, 11);
  for (const name of ['Whole nation', 'Parliament', 'Federation', 'Work', 'Home', 'Community', 'Petitions', 'Café', 'Brewery', 'Garden', 'Sport']) assert.ok(markup.includes(name));
  assert.match(markup, /aria-expanded="true" aria-controls="atlas-map"/);
  assert.match(markup, /Simulated families/);
});
