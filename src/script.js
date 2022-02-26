import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";

// Debug
//const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Objects
const geometry = new THREE.BoxGeometry();

// Materials

const material = new THREE.MeshBasicMaterial();
material.color = new THREE.Color(0x00ff00);

const bulletMaterial = new THREE.MeshBasicMaterial();
bulletMaterial.color = new THREE.Color(0xff0000);

// Mesh
const player = new THREE.Mesh(geometry, material);
scene.add(player);

const bullet = new THREE.Mesh(geometry, bulletMaterial);

// Lights

const pointLight = new THREE.PointLight(0xffffff, 0.1);
pointLight.position.x = 2;
pointLight.position.y = 3;
pointLight.position.z = 4;
scene.add(pointLight);

/**
 * Sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

window.addEventListener("resize", () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	// Update camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
	75,
	sizes.width / sizes.height,
	0.1,
	100
);
camera.position.x = 0;
camera.position.y = 10;
camera.position.z = 20;
scene.add(camera);

// Controls
//const controls = new OrbitControls(camera, canvas);
//controls.enableDamping = true;
var xSpeed = 0.1; //speed at which player moves
var maxThreshold = 20; // how far right the player can go
var minThreshold = -20; // how far left the player can go
var maxRThreshold = 0.3; // how far counter clockwise the player can rotate
var minRThreshold = -0.3; // how far clockwise the player can rotate
var rSpeed = 0.02; // player rotation speed
var rReturnSpeed = 0.05; // player rotation return speed

var rMove = 0;
var xMove = 0;
document.addEventListener("keydown", onDocumentKeyDown, false);
document.addEventListener("keyup", onDocumentKeyUp, false);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */

const clock = new THREE.Clock();

const tick = () => {
	const elapsedTime = clock.getElapsedTime();

	// Update objects
	// player.rotation.y = 0.1 * elapsedTime;
	// player.rotation.x = 0.1 * elapsedTime;
	player.position.x += xMove;

	if (player.rotation.z > maxRThreshold) {
		player.rotation.z -= rSpeed;
	} else if (player.rotation.z < minRThreshold) {
		player.rotation.z += rSpeed;
	}
	if (player.rotation.z > 0 && rMove == 0) {
		player.rotation.z -= rReturnSpeed;
	} else if (player.rotation.z < 0 && rMove == 0) {
		player.rotation.z += rReturnSpeed;
	}
	if (player.rotation.z < 1 && player.rotation.z > -1) {
		player.rotation.z += rMove;
	}

	// Update Orbital Controls
	//controls.update();

	// Render
	renderer.render(scene, camera);

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
};

function onDocumentKeyDown(event) {
	var keyCode = event.which;

	//Movement ifs
	if (keyCode == 65 && player.position.x > minThreshold) {
		xMove = -xSpeed;
	} else if (keyCode == 68 && player.position.x < maxThreshold) {
		xMove = +xSpeed;
	} else if (keyCode == 32) {
		scene.add(bullet);
	} else {
		xMove = 0;
	}

	if (keyCode == 65) {
		rMove = rSpeed;
	} else if (keyCode == 68) {
		rMove = -rSpeed;
	}
}
function onDocumentKeyUp(event) {
	var keyCode = event.which;
	if (keyCode == 65 && player.position.x > minThreshold) {
		xMove = 0;
	} else if (keyCode == 68 && player.position.x < maxThreshold) {
		xMove = 0;
	}
	if (keyCode == 65) {
		rMove = 0;
	} else if (keyCode == 68) {
		rMove = 0;
	}
}

tick();
