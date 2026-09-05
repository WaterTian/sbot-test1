import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const host = document.querySelector('#canvas');
const scene = new THREE.Scene();


const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.up.set(0, 0, 1);
camera.position.set(4.9, -5.5, 5.3);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.append(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 3.1;
controls.maxDistance = 9;
controls.maxPolarAngle = Math.PI * .94;
controls.enablePan = false;
controls.target.set(0, 0, .15);

const satellite = new THREE.Group();
satellite.rotation.set(.12, .18, -.45);
scene.add(satellite);

const mat = (color, metalness = .5, roughness = .45) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
const graphite = mat(0x11161a, .8, .3);
const darkMetal = mat(0x23282d, .85, .25);
const solar = new THREE.MeshStandardMaterial({
  color: 0x0b4e78,
  metalness: .74,
  roughness: .18,
  emissive: 0x021725,
  emissiveIntensity: .7,
});
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
const mainBus = mesh(new THREE.CylinderGeometry(2.02, 2.02, .28, 96), graphite, 0, 0, 0);
mainBus.rotation.x = Math.PI / 2;
mesh(new THREE.TorusGeometry(2.04, .065, 12, 96), gold, 0, 0, .08);
mesh(new THREE.TorusGeometry(2.08, .048, 10, 96), gold, 0, 0, -.12);
mesh(new THREE.TorusGeometry(1.93, .035, 10, 96), darkMetal, 0, 0, .13);

// Repeated solar cells share geometry and one draw call.
const panelGeo = new THREE.BoxGeometry(.155, .132, .017);
const cellPositions = [];
for (let row = -10; row <= 10; row++) {
  for (let col = -10; col <= 10; col++) {
    const x = col * .175 + (row % 2 ? .04 : 0);
    const y = row * .152;
    if (x*x + y*y < 3.45) cellPositions.push([x, y, .158]);
  }
}
const cells = new THREE.InstancedMesh(panelGeo, solar, cellPositions.length);
const cellTransform = new THREE.Object3D();
cellPositions.forEach((position, index) => {
  cellTransform.position.set(...position);
  cellTransform.updateMatrix();
  cells.setMatrixAt(index, cellTransform.matrix);
});
cells.castShadow = cells.receiveShadow = true;
satellite.add(cells);

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

scene.add(new THREE.AmbientLight(0xcfe5ff, 1.7));
scene.add(new THREE.HemisphereLight(0x9ac9e5, 0x071018, 1.35));
const key = new THREE.DirectionalLight(0xd7edff, 2.7); key.position.set(4, -5, 7); key.castShadow = true; scene.add(key);
const rimLight = new THREE.PointLight(0xe4a529, 18, 12); rimLight.position.set(-4, 3, 2); scene.add(rimLight);
const coolLight = new THREE.PointLight(0x3fa8de, 10, 10); coolLight.position.set(2, 3, -1); scene.add(coolLight);

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let autoRotate = !reducedMotion;
let transition = null;
function markView(id, label) {
  ['resetView', 'topView', 'sideView'].forEach(key => document.getElementById(key).setAttribute('aria-pressed', String(key === id)));
  document.querySelector('#viewLabel').textContent = label;
}
function moveCamera(position) {
  const target = new THREE.Vector3(...position).setLength(fitDistance).add(controls.target);
  if (reducedMotion) camera.position.copy(target);
  else transition = { from: camera.position.clone(), to: target, progress: 0 };
}
function syncRotate() {
  const button = document.querySelector('#toggleRotate');
  button.textContent = autoRotate ? '暂停自转' : '开启自转';
  button.setAttribute('aria-pressed', String(autoRotate));
}
syncRotate();
const originalRotation = satellite.rotation.clone();
function setView(position) {
  autoRotate = false;
  syncRotate();
  satellite.rotation.set(0, 0, 0);
  moveCamera(position);
  controls.target.set(0, 0, .15);
  controls.update();
}
document.querySelector('#topView').addEventListener('click', () => { setView([0, -.001, 7.5]); markView('topView', '02 / 正面视角'); });
document.querySelector('#sideView').addEventListener('click', () => { setView([0, -7.5, .3]); markView('sideView', '03 / 侧面视角'); });
function zoom(factor) {
  transition = null;
  const offset = camera.position.clone().sub(controls.target);
  offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
  camera.position.copy(controls.target).add(offset);
  controls.update();
}
document.querySelector('#zoomIn').addEventListener('click', () => zoom(.85));
document.querySelector('#zoomOut').addEventListener('click', () => zoom(1.18));
controls.addEventListener('start', () => { transition = null; autoRotate = false; syncRotate(); markView('', '01 / 自由视角'); });
host.addEventListener('keydown', event => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'Home'].includes(event.key)) {
    event.preventDefault(); transition = null; autoRotate = false; syncRotate(); markView('', '01 / 自由视角');
    if (event.key === 'Home') document.querySelector('#resetView').click();
    else if (event.key === '+' || event.key === '=') zoom(.85);
    else if (event.key === '-') zoom(1.18);
    else satellite.rotation[event.key === 'ArrowUp' || event.key === 'ArrowDown' ? 'x' : 'z'] += (event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 1) * .12;
  }
});
document.querySelector('#resetView').addEventListener('click', () => {
  satellite.rotation.copy(originalRotation);
  moveCamera([4.9, -5.5, 5.3]);
  markView('resetView', '01 / 透视视角');
  controls.target.set(0, 0, .15);
  controls.update();
});
document.querySelector('#toggleRotate').addEventListener('click', (event) => {
  autoRotate = !autoRotate;
  syncRotate();
  if (autoRotate) markView('', '01 / 自由视角');
});

let fitDistance = 9;
let lastAspect = 0;
function resize() {
  const { width, height } = host.getBoundingClientRect();
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  const vertical = THREE.MathUtils.degToRad(camera.fov / 2);
  fitDistance = 2.8 / Math.sin(Math.min(vertical, Math.atan(Math.tan(vertical) * camera.aspect)));
  controls.maxDistance = fitDistance * 1.8;
  if (Math.abs(lastAspect - camera.aspect) > .1) {
    transition = null;
    camera.position.sub(controls.target).setLength(fitDistance).add(controls.target);
    lastAspect = camera.aspect;
  }
}
new ResizeObserver(resize).observe(host);
resize();


let previousTime = 0;
let firstFrame = true;
renderer.domElement.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  renderer.setAnimationLoop(null);
  window.viewerFailure('三维渲染连接已中断，请重新加载。');
});
function animate(time) {
  const delta = Math.min((time - previousTime) / 1000 || 0, .05);
  previousTime = time;
  if (document.hidden) return;
  if (transition) {
    transition.progress = Math.min(1, transition.progress + delta / .45);
    const t = transition.progress * transition.progress * (3 - 2 * transition.progress);
    camera.position.lerpVectors(transition.from, transition.to, t);
    if (transition.progress === 1) transition = null;
  }
  if (autoRotate) satellite.rotation.z += delta * .08;
  controls.update();
  renderer.render(scene, camera);
  if (firstFrame) { firstFrame = false; window.viewerReady(); }
}
renderer.setAnimationLoop(animate);

const materialGroups = { solar: [solar], frame: [gold], equipment: [silver, sensorRed, cable, darkMetal] };
const materialDefaults = new Map(Object.values(materialGroups).flat().map(material => [material, { emissive: material.emissive.clone(), intensity: material.emissiveIntensity }]));
const partDescriptions = {
  solar: '已高亮电池阵列。单元布局依据参考图推定，不代表实际电气分区。',
  frame: '已高亮环形边框与支架。连接方式与结构尺寸未经确认。',
  equipment: '已高亮外露壳体和线束。组件功能与内部结构未经确认。'
};
let selectedPart = null;
document.querySelectorAll('[data-part]').forEach(button => button.addEventListener('click', () => {
  selectedPart = selectedPart === button.dataset.part ? null : button.dataset.part;
  materialDefaults.forEach((value, material) => { material.emissive.copy(value.emissive); material.emissiveIntensity = value.intensity; });
  if (selectedPart) materialGroups[selectedPart].forEach(material => { material.emissive.set(0x2dd4bf); material.emissiveIntensity = .55; });
  document.querySelectorAll('[data-part]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.part === selectedPart)));
  document.querySelector('#partDetail').textContent = selectedPart ? partDescriptions[selectedPart] : '点击同一部件可取消高亮。';
  autoRotate = false; syncRotate();
}));
document.querySelector('#exposure').addEventListener('input', event => {
  renderer.toneMappingExposure = 1.5 * Number(event.target.value) / 100;
  document.querySelector('#exposureValue').textContent = event.target.value + '%';
});
document.querySelector('#gridToggle').addEventListener('change', event => { document.querySelector('#stageGrid').hidden = !event.target.checked; });
const fullscreen = document.querySelector('#fullscreen');
const viewerPanel = document.querySelector('.viewer-panel');
if (!document.fullscreenEnabled) fullscreen.hidden = true;
fullscreen.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await viewerPanel.requestFullscreen();
  } catch { document.querySelector('#partDetail').textContent = '当前浏览器不支持全屏，可继续在页面内查看。'; }
});
document.addEventListener('fullscreenchange', () => { fullscreen.textContent = document.fullscreenElement ? '退出全屏' : '全屏'; });
