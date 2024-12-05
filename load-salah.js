import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Setup renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio * 0.5);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Setup scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 200);
camera.position.set(20, 8, -15);
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

scene.background = new THREE.Color(0xFFFFFF);
const loaderBackground = new THREE.TextureLoader();
loaderBackground.load('textures/morning.jpg', (background) => {
  scene.background = background;
});

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

// Load 3D model
const loader = new GLTFLoader().setPath('models/');
loader.load('bugis-v2.glb', (gltf) => {
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

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Predefined camera movements
function orbitCamera(target, height, radius, duration = 15, direction = 1) {
  return new Promise((resolve) => {
    const angle = { theta: 0 };
    gsap.to(angle, {
      theta: Math.PI * 2 * direction,
      duration: duration,
      ease: 'linear',
      onUpdate: () => {
        camera.position.x = target.x + radius * Math.cos(angle.theta);
        camera.position.y = target.y + height;
        camera.position.z = target.z + radius * Math.sin(angle.theta);
        camera.lookAt(target);
        if (direction === 1) {
          if (angle.theta >= Math.PI * 2 * 0.9) {
            fadeTransition(0.5).then(resolve);
          }
        } else if (direction === -1) {
          if (angle.theta <= Math.PI * 2 * 0.9 * -1) {
            fadeTransition(0.5).then(resolve);
          }
        }
        console.log(angle.theta);
      },
    });
  });
}

function truckCamera(start, end, duration) {
  gsap.to(camera.position, {
    x: end.x,
    z: end.z,
    duration: duration,
    ease: 'power1.inOut',
    onUpdate: () => {
      camera.lookAt(new THREE.Vector3(0, 1, 0));
    }
  });
}

function dollyCamera(position, target, duration) {
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

// Add buttons for new camera movements
const buttonContainer = document.createElement('div');
buttonContainer.style.position = 'fixed';
buttonContainer.style.top = '10px';
buttonContainer.style.left = '10px';
buttonContainer.style.zIndex = '1000';

// Extreme wide shot
const wideOrbitButton = document.createElement('button');
wideOrbitButton.textContent = 'Wide Orbit';
wideOrbitButton.onclick = () => orbitCamera(new THREE.Vector3(0, 1, -20), 20, 60, 30);
buttonContainer.appendChild(wideOrbitButton);

// Truck movement
const truckButton = document.createElement('button');
truckButton.textContent = 'Truck/Crab';
truckButton.onclick = () => {
  const positions = [
    { x: -10, z: -10 },
    { x: 10, z: -10 },
    { x: 10, z: 10 },
    { x: -10, z: 10 },
    { x: -10, z: -10 }
  ];
  positions.reduce((prev, curr, i) => {
    return prev.then(() => {
      return new Promise((resolve) => {
        truckCamera(camera.position, curr, 3);
        setTimeout(resolve, 3000);
      });
    });
  }, Promise.resolve());
};
buttonContainer.appendChild(truckButton);

// Dolly movement
const dollyButton = document.createElement('button');
dollyButton.textContent = 'Dolly';
dollyButton.onclick = () => dollyCamera({ x: 0, y: 15, z: 15 }, new THREE.Vector3(0, 1, -1), 5);
buttonContainer.appendChild(dollyButton);

document.body.appendChild(buttonContainer);





function fadeTransition(duration = 1) {
  const overlay = document.getElementById('overlay');
  overlay.style.transition = `opacity ${duration}s`;
  overlay.style.opacity = 1;

  return new Promise((resolve) => {
    setTimeout(() => {
      overlay.style.opacity = 0;
      resolve();
    }, duration * 1000);
  });
}

// Gabungkan beberapa gerakan kamera
function combinedCameraMovement() {
  orbitCamera(new THREE.Vector3(0, 1, -20), 20, 60, 30).then(() => {
    // fadeTransition(0.1);

    return orbitCamera(new THREE.Vector3(0, 1, -10), 10, 30, 20, -1); // Orbit lebih dekat dengan rotasi berlawanan
  });
}


// Tambahkan tombol untuk gerakan kombinasi
const combinedButton = document.createElement('button');
combinedButton.textContent = 'Combined Movement';
combinedButton.onclick = combinedCameraMovement;
buttonContainer.appendChild(combinedButton);

// Tambahkan overlay untuk efek fade
const overlay = document.createElement('div');
overlay.id = 'overlay';
overlay.style.position = 'fixed';
overlay.style.top = '0';
overlay.style.left = '0';
overlay.style.width = '100%';
overlay.style.height = '100%';
overlay.style.backgroundColor = 'black';
overlay.style.opacity = '0';
overlay.style.pointerEvents = 'none';
overlay.style.transition = 'opacity 1s';
document.body.appendChild(overlay);