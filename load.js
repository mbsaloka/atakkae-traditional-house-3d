import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio * 0.5);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(4, 5, 11);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = true;
controls.keyPanSpeed = 50;
controls.minDistance = 5;
controls.maxDistance = 50;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.5;
controls.autoRotate = false;
controls.target = new THREE.Vector3(0, 1, 0);
controls.update();

const groundGeometry = new THREE.PlaneGeometry(20, 20, 32, 32);
groundGeometry.rotateX(-Math.PI / 2);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x555555,
  side: THREE.DoubleSide
});

// scene.background = new THREE.Color(0xFFFFFF);
const loaderBackground = new THREE.TextureLoader();
loaderBackground.load('textures/morning.jpg', (background) => {
  scene.background = background;
});

// const spotLight = new THREE.SpotLight(0x7F7FFF, 100, 100, 0.30, 1);
// spotLight.position.set(10, 60, 5);
// spotLight.castShadow = true;
// spotLight.shadow.bias = -0.0001;
// scene.add(spotLight);

// const spotLight1 = new THREE.SpotLight(0xDA70D6, 100, 100, 0.30, 1);
// spotLight1.position.set(0, 30, 5);
// spotLight1.castShadow = true;
// spotLight1.shadow.bias = -0.0001;
// scene.add(spotLight1);

// Menambahkan DirectionalLight (cahaya matahari)
const sunLight = new THREE.DirectionalLight(0xFFFFFF, 1); // Warna putih, intensitas 1
sunLight.position.set(10, 20, 10); // Posisi cahaya
sunLight.castShadow = true; // Jika menggunakan shadow

// Konfigurasi bayangan (jika diaktifkan)
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 50;

scene.add(sunLight);

// Menambahkan AmbientLight (pencahayaan latar)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Cahaya tambahan redup
scene.add(ambientLight);

const loader = new GLTFLoader().setPath('models/');
loader.load('bugis-v1.glb', (gltf) => {
  const mesh = gltf.scene;

  mesh.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  mesh.position.set(0, 1.05, -1);
  scene.add(mesh);

  document.getElementById('progress-container').style.display = 'none';
}, ( xhr ) => {
  document.getElementById('progress').innerHTML = `LOADING ${Math.max(xhr.loaded / xhr.total, 1) * 100}/100`;
},);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();

// Predefined Camera Movements
function orbitCamera(target, duration = 3) {
  const angle = { theta: 0 };
  gsap.to(angle, {
    theta: Math.PI * 2,
    duration: duration,
    ease: 'power1.inOut',
    onUpdate: () => {
      const radius = 10;
      camera.position.x = target.x + radius * Math.cos(angle.theta);
      camera.position.z = target.z + radius * Math.sin(angle.theta);
      camera.lookAt(target);
    }
  });
}

function zoomCamera(distance, duration = 2) {
  gsap.to(camera.position, {
    z: distance,
    duration: duration,
    ease: 'power1.inOut'
  });
}

function moveCamera(position, target, duration = 2) {
  gsap.to(camera.position, {
    x: position.x,
    y: position.y,
    z: position.z,
    duration: duration,
    ease: 'power1.inOut',
    onUpdate: () => {
      camera.lookAt(target);
    }
  });
}

// Add Buttons for Camera Movements
const buttonContainer = document.createElement('div');
buttonContainer.style.position = 'fixed';
buttonContainer.style.top = '10px';
buttonContainer.style.left = '10px';
buttonContainer.style.zIndex = '1000';

const orbitButton = document.createElement('button');
orbitButton.textContent = 'Orbit';
orbitButton.onclick = () => orbitCamera(new THREE.Vector3(0, 1, 0));
buttonContainer.appendChild(orbitButton);

const zoomButton = document.createElement('button');
zoomButton.textContent = 'Zoom In';
zoomButton.onclick = () => zoomCamera(5);
buttonContainer.appendChild(zoomButton);

const moveButton = document.createElement('button');
moveButton.textContent = 'Move';
moveButton.onclick = () => moveCamera({ x: 0, y: 5, z: 10 }, new THREE.Vector3(0, 1, 0));
buttonContainer.appendChild(moveButton);

document.body.appendChild(buttonContainer);