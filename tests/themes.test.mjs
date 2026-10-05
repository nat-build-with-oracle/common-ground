import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { THEMES, FBX_SKINS, characterSpec, nextTheme, themeById } from "../lib/themes.ts";

const pub = path => new URL(`../public${path}`, import.meta.url);

test("every theme resolves its character, skin, clips and tiles to a vendored file", () => {
  for (const theme of THEMES) {
    for (const id of ["a", "oracle-1", "z9", "neo"]) {
      const spec = characterSpec(theme, id);
      for (const path of spec.kind === "glb" ? [spec.url] : [spec.model, spec.skin, spec.idle, spec.run]) assert.ok(existsSync(pub(path)), `${theme.id}: ${path}`);
    }
    for (const tile of [theme.groundTile, theme.roadTile, theme.walkTile]) if (tile) assert.ok(existsSync(pub(tile)), `${theme.id}: ${tile}`);
  }
});

test("character choice is stable per citizen, and every skin of a pack gets used", () => {
  const retro = themeById("retro");
  assert.deepEqual(characterSpec(retro, "neo"), characterSpec(retro, "neo"));
  const used = new Set(Array.from({ length: 64 }, (_, i) => characterSpec(retro, `bot-${i}`).skin));
  assert.equal(used.size, FBX_SKINS.retro.length);
});

test("theme ids are unique, switcher cycles through all, unknown ids fall back", () => {
  assert.equal(new Set(THEMES.map(t => t.id)).size, THEMES.length);
  let id = THEMES[0].id; const seen = new Set();
  for (let i = 0; i < THEMES.length; i++) { seen.add(id); id = nextTheme(id); }
  assert.equal(seen.size, THEMES.length); assert.equal(id, THEMES[0].id);
  assert.equal(themeById("nope").id, "blocky"); assert.equal(themeById(null).id, "blocky");
});

test("every added CC0 pack ships a license, provenance and checksums", () => {
  for (const dir of ["retro", "survivors", "protagonists", "urban"]) {
    assert.match(readFileSync(pub(`/models/${dir}/LICENSE.txt`), "utf8"), /Creative Commons Zero, CC0/);
    for (const file of ["PROVENANCE.md", "SHA256SUMS"]) assert.ok(existsSync(pub(`/models/${dir}/${file}`)), `${dir}/${file}`);
  }
});
