import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, PlaneGeometry, Raycaster, Scene, Vector3 } from 'three';
import { townZoomAnchor } from '../components/office/office.camera-anchor.ts';

const material = new MeshBasicMaterial();

function ground(size = 100) {
  const mesh = new Mesh(new PlaneGeometry(size, size), material);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

test('cursor anchor uses the nearest visible roof instead of the ground behind it', () => {
  const scene = new Scene(), roof = new Mesh(new BoxGeometry(4, 1, 4), material);
  roof.position.y = 4.5;
  scene.add(ground(), roof);
  scene.updateMatrixWorld(true);

  const ray = new Raycaster(new Vector3(0, 10, 2), new Vector3(0, -10, -2).normalize());
  const anchor = new Vector3();
  assert.equal(townZoomAnchor(ray, scene, 20, 20, anchor), true);
  assert.ok(anchor.y >= 4, `expected roof hit, got y=${anchor.y}`);
});

test('cursor anchor ignores hidden surfaces', () => {
  const scene = new Scene(), hidden = new Group(), roof = new Mesh(new BoxGeometry(4, 1, 4), material);
  roof.position.y = 4.5;
  hidden.visible = false;
  hidden.add(roof);
  const floor = ground();
  scene.add(floor);
  // A hidden branch under a visible mesh must also be skipped.
  floor.attach(hidden);
  scene.updateMatrixWorld(true);

  const ray = new Raycaster(new Vector3(0, 10, 2), new Vector3(0, -10, -2).normalize());
  const anchor = new Vector3();
  assert.equal(townZoomAnchor(ray, scene, 20, 20, anchor), true);
  assert.ok(Math.abs(anchor.y) < 1e-8, `expected ground hit, got y=${anchor.y}`);
});

test('cursor anchor ignores hidden and fully transparent hit materials, including material arrays', () => {
  const scene = new Scene(), hiddenMaterial = new MeshBasicMaterial({ visible: false });
  const transparent = new MeshBasicMaterial({ transparent: true, opacity: 0 });
  const visible = new MeshBasicMaterial();
  const hiddenRoof = new Mesh(new BoxGeometry(4, 1, 4), hiddenMaterial);
  const arrayRoof = new Mesh(new BoxGeometry(4, 1, 4), [visible, visible, transparent, visible, visible, visible]);
  hiddenRoof.position.y = 6.5;
  arrayRoof.position.y = 4.5;
  scene.add(ground(), hiddenRoof, arrayRoof);
  scene.updateMatrixWorld(true);

  const ray = new Raycaster(new Vector3(0, 10, 0), new Vector3(0, -1, 0));
  const anchor = new Vector3();
  assert.equal(townZoomAnchor(ray, scene, 20, 20, anchor), true);
  assert.ok(Math.abs(anchor.y) < 1e-8, `expected ground hit, got y=${anchor.y}`);

  arrayRoof.material[2] = visible;
  assert.equal(townZoomAnchor(ray, scene, 20, 20, anchor), true);
  assert.ok(anchor.y >= 4, `expected visible array material roof hit, got y=${anchor.y}`);
});

test('shallow ground fallback stays inside the town footprint', () => {
  const ray = new Raycaster(new Vector3(0, 10, 0), new Vector3(1, -.01, .5).normalize());
  const anchor = new Vector3();
  assert.equal(townZoomAnchor(ray, new Scene(), 20, 12, anchor), true);
  assert.deepEqual(anchor.toArray(), [10, 0, 6]);
});
