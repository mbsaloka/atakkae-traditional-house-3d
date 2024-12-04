import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio * 0.5);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

// Create a simple gradient background
const vertexShader = `
varying vec3 vWorldPosition;
void main() {
	vWorldPosition = position;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragmentShader = `
varying vec3 vWorldPosition;
void main() {
	float y = normalize(vWorldPosition).y;

	// Create sharper transition at horizon
	vec3 skyColor = vec3(0.75, 0.85, 0.9);    // Light blue-gray for sky
	vec3 horizonColor = vec3(0.9, 0.9, 0.9);  // Almost white for horizon
	vec3 groundColor = vec3(0.9, 0.9, 0.9);  // Similar to sky for smooth bottom

	// Create sharper transition near horizon (y = 0)
	float horizonSharpness = 8.0;  // Increase for sharper horizon line
	float t = pow(1.0 - abs(y), horizonSharpness);

	// Mix colors based on height and horizon transition
	vec3 finalColor;
	if (y > 0.0) {
		finalColor = mix(skyColor, horizonColor, t);
	} else {
		finalColor = mix(groundColor, horizonColor, t);
	}

	gl_FragColor = vec4(finalColor, 1.0);
}`;

// Create sky sphere with proper size and position
const skyGeo = new THREE.SphereGeometry(1000, 32, 32);
const skyMat = new THREE.ShaderMaterial({
	vertexShader: vertexShader,
	fragmentShader: fragmentShader,
	side: THREE.BackSide,
	depthWrite: false,
	fog: false
});

const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

// Camera setup
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1500);
camera.position.set(20, 5, -5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = true;
controls.minDistance = 5;
controls.maxDistance = 100;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.5;
controls.autoRotate = false;
controls.target = new THREE.Vector3(-20, 1, 30);
controls.update();

// Ground
const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 32, 32); // Increased size
groundGeometry.rotateX(-Math.PI / 2);
const groundMaterial = new THREE.MeshStandardMaterial({
	color: 0x364531,
	side: THREE.DoubleSide,
	roughness: 0.8,
	metalness: 0.2
});

const textureLoader = new THREE.TextureLoader();
const groundTexture = textureLoader.load('textures/ground.jpeg');
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(100, 100);

const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.receiveShadow = true;
scene.add(ground);

scene.fog = new THREE.Fog(0xe5e5e5, 200, 300);

// Basic ambient light for overall scene illumination
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Reduced intensity for more contrast
scene.add(ambientLight);

// Directional light (sun)
const sunLight = new THREE.DirectionalLight(0xFFFFFA, 4);
sunLight.position.set(20, 100, 20);
sunLight.castShadow = true;

// Improve shadow quality and range
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 500;

// Expand shadow camera frustum to cover more of the scene
sunLight.shadow.camera.left = -50;
sunLight.shadow.camera.right = 50;
sunLight.shadow.camera.top = 50;
sunLight.shadow.camera.bottom = -50;

// Improve shadow quality
sunLight.shadow.bias = -0.0000001;
sunLight.shadow.normalBias = 0.02;
sunLight.shadow.radius = 3;

scene.add(sunLight);

// Optional: Add a helper to visualize the shadow camera (comment out in production)
const helper = new THREE.CameraHelper(sunLight.shadow.camera);
scene.add(helper);

// // Add some fill light from the opposite direction
// const fillLight = new THREE.DirectionalLight(0x8088ff, 0.3); // Slight blue tint
// fillLight.position.set(-20, 20, -20);
// scene.add(fillLight);

// const helper1 = new THREE.CameraHelper(fillLight.shadow.camera);
// scene.add(helper1);

// Model loading
const loader = new GLTFLoader().setPath('models/');
loader.load('bugis-v2.glb', (gltf) => {
	const mesh = gltf.scene;

	mesh.traverse((child) => {
		if (child.isMesh) {
			child.castShadow = true;
			child.receiveShadow = true;

			if (child.material instanceof THREE.MeshStandardMaterial) {
			  child.material.roughness = 0.7;
			  child.material.metalness = 0.2;
			}
		}
	});

	mesh.position.set(-10, 0.7, 30);
	scene.add(mesh);

	document.getElementById('progress-container').style.display = 'none';
}, (xhr) => {
	document.getElementById('progress').innerHTML = `LOADING ${Math.max(xhr.loaded / xhr.total, 1) * 100}/100`;
});

// Window resize handler
window.addEventListener('resize', () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

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

// Add buttons for new camera movements
const buttonContainer = document.createElement('div');
buttonContainer.style.position = 'fixed';
buttonContainer.style.top = '10px';
buttonContainer.style.left = '10px';
buttonContainer.style.zIndex = '1000';

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

document.body.appendChild(buttonContainer);
document.body.appendChild(overlay);

// Animation loop
function animate() {
	requestAnimationFrame(animate);
	controls.update();
	renderer.render(scene, camera);
}

animate();