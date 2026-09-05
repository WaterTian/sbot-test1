import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.167.1/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.167.1/examples/jsm/controls/OrbitControls.js';

const host = document.querySelector('#canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x071018, 0.048);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(4.9, -5.5, 3.3);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.append(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 3.1;
controls.maxDistance = 9;
controls.maxPolarAngle = Math.PI * .77;
controls.target.set(0, 0, .15);

const satellite = new THREE.Group();
satellite.rotation.set(.12, .18, -.45);
scene.add(satellite);

const mat = (color, metalness = .5, roughness = .45) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
const graphite = mat(0x11161a, .8, .3);
const darkMetal = mat(0x23282d, .85, .25);
const solar = mat(0x061828, .7, .22);
const gold = mat(0xc18a16, .86, .22);
const silver = mat(0xb6b8ae, .82, .28);
const sensorRed = mat(0xbd351e, .65, .3);
const cable = mat(0x511a12, .35, .6);

function mesh(geometry, material, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  object.castShadow = object.receiveShadow = true;
  satellite.add(object);
  return object;
}

// Main disc and the two exposed structural rings visible in the reference photos.
mesh(new THREE.CylinderGeometry(2.02, 2.02, .28, 96), graphite, 0, 0, 0);
mesh(new THREE.TorusGeometry(2.04, .065, 12, 96), gold, 0, 0, .08);
mesh(new THREE.TorusGeometry(2.08, .048, 10, 96), gold, 0, 0, -.12);
mesh(new THREE.TorusGeometry(1.93, .035, 10, 96), darkMetal, 0, 0, .13);

// Dense, slightly irregular photovoltaic tile field. The footprint is clipped to the disc.
const panelGeo = new THREE.BoxGeometry(.265, .16, .017);
for (let row = -10; row <= 10; row += 1) {
  for (let col = -10; col <= 10; col += 1) {
    const x = col * .175 + (row % 2 ? .04 : 0);
    const y = row * .152;
    if (x * x + y * y < 3.45) {
      const cell = mesh(panelGeo, solar, x, y, .158 + ((row + col) % 5) * .001);
      cell.rotation.z = -.14;
    }
  }
}

// Silver plates break up the photovoltaic field as on the photographed flight article.
const plateGeo = new THREE.BoxGeometry(.48, .17, .045);
[
  [-.92, .63, -.10], [-.28, .77, -.10], [.59, .65, -.10], [1.05, .22, -.10],
  [-1.25, .12, -.10], [-.75, -.42, -.10], [.05, -.58, -.10], [.72, -.53, -.10],
].forEach(([x, y, a]) => { const plate = mesh(plateGeo, silver, x, y, .19); plate.rotation.z = a; });

// Perimeter brackets and the prominent front equipment box.
const bracketGeo = new THREE.BoxGeometry(.16, .24, .24);
for (let i = 0; i < 14; i += 1) {
  const a = i / 14 * Math.PI * 2;
  const bracket = mesh(bracketGeo, gold, 2.1 * Math.cos(a), 2.1 * Math.sin(a), -.1);
  bracket.rotation.z = a;
}
const frontBox = mesh(new THREE.BoxGeometry(.48, .38, .27), silver, 0, -2.16, -.16);
frontBox.rotation.z = .03;

// Two angled optical heads, plus smaller peripheral housings.
function opticalHead(angle) {
  const arm = new THREE.Group();
  arm.position.set(1.92 * Math.cos(angle), 1.92 * Math.sin(angle), .23);
  arm.rotation.z = angle;
  arm.rotation.y = -.65;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.115, .115, .42, 20), silver);
  body.rotation.x = Math.PI / 2;
  body.position.z = .18;
  arm.add(body);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .055, 20), sensorRed);
  cap.rotation.x = Math.PI / 2;
  cap.position.z = .41;
  arm.add(cap);
  satellite.add(arm);
}
opticalHead(.62);
opticalHead(3.72);

for (let i = 0; i < 7; i += 1) {
  const a = .18 + i * .82;
  const housing = mesh(new THREE.BoxGeometry(.2, .18, .16), darkMetal, 2.02 * Math.cos(a), 2.02 * Math.sin(a), .03);
  housing.rotation.z = a;
}

// Loose harness loops: intentionally asymmetric to avoid a generic, "perfect" look.
function cableLoop(start, c1, c2, end) {
  const curve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(...start), new THREE.Vector3(...c1), new THREE.Vector3(...c2), new THREE.Vector3(...end)
  );
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, .018, 7, false), cable);
  tube.castShadow = true;
  satellite.add(tube);
}
cableLoop([-1.8, -1.0, -.12], [-2.7, -1.25, -.55], [-2.55, -.28, -.65], [-2.0, .12, -.15]);
cableLoop([1.75, -.58, -.12], [2.75, -.92, -.6], [2.6, .15, -.67], [1.9, .38, -.14]);
cableLoop([-.48, -2.04, -.16], [-1.05, -2.85, -.56], [.54, -2.72, -.63], [1.15, -1.82, -.12]);

const floor = new THREE.Mesh(new THREE.CircleGeometry(7, 96), new THREE.MeshStandardMaterial({ color: 0x0b2233, metalness: .55, roughness: .28, transparent: true, opacity: .75 }));
floor.receiveShadow = true;
floor.position.z = -1.04;
scene.add(floor);

scene.add(new THREE.HemisphereLight(0x9ac9e5, 0x071018, 1.35));
const key = new THREE.DirectionalLight(0xd7edff, 2.7); key.position.set(4, -5, 7); key.castShadow = true; scene.add(key);
const rimLight = new THREE.PointLight(0xe4a529, 18, 12); rimLight.position.set(-4, 3, 2); scene.add(rimLight);
const coolLight = new THREE.PointLight(0x3fa8de, 10, 10); coolLight.position.set(2, 3, -1); scene.add(coolLight);

let autoRotate = true;
document.querySelector('#resetView').addEventListener('click', () => {
  camera.position.set(4.9, -5.5, 3.3);
  controls.target.set(0, 0, .15);
  controls.update();
});
document.querySelector('#toggleRotate').addEventListener('click', (event) => {
  autoRotate = !autoRotate;
  event.currentTarget.textContent = autoRotate ? '暂停自转' : '开启自转';
  event.currentTarget.setAttribute('aria-pressed', String(autoRotate));
});

function resize() {
  const { width, height } = host.getBoundingClientRect();
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(host);
resize();

function animate() {
  requestAnimationFrame(animate);
  if (autoRotate) satellite.rotation.z += .00135;
  controls.update();
  renderer.render(scene, camera);
}
animate();
