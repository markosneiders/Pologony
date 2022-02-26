import "./style.css";
import * as THREE from "three";
import * as dat from "dat.gui";
import { Vector3 } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

//Ray
const raycaster = new THREE.Raycaster();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Objects Loader
const loader = new OBJLoader();

// load a resource
loader.load(
	// resource URL
	"models/enemy.obj",
	// called when resource is loaded
	function (object) {
		scene.add(object);
		console.log(object);
	},
	// called when loading is in progresses
	function (xhr) {
		console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
	},
	// called when loading has errors
	function (error) {
		console.log("An error happened");
	}
);

// Objects
const geometry = new THREE.BoxGeometry();

// Materials

const material = new THREE.MeshBasicMaterial();
material.color = new THREE.Color(0x00ff00);

const bulletMaterial = new THREE.MeshBasicMaterial();
bulletMaterial.color = new THREE.Color(0xff0000);

const enemyMaterial = new THREE.MeshBasicMaterial();
enemyMaterial.color = new THREE.Color(0x0000ff);
enemyMaterial.side = THREE.DoubleSide;

// Mesh
const player = new THREE.Mesh(geometry, material);
scene.add(player);

const enemy = new THREE.Mesh(geometry, enemyMaterial);
scene.add(enemy);
enemy.position.z = -10;
enemy.position.x = 3;

var bullets = [];
var bulletLifetime = 10000;

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
	90,
	sizes.width / sizes.height,
	0.1,
	1000
);
camera.position.x = 0;
camera.position.y = 2;
camera.position.z = 2;
scene.add(camera);

// Controls
var pressedKeys = {};
pressedKeys[68] = false;
pressedKeys[65] = false;
var xSpeed = 0.1; //speed at which player moves
var maxThreshold = 20; // how far right the player can go
var minThreshold = -20; // how far left the player can go
var maxRThreshold = 0.3; // how far counter clockwise the player can rotate
var minRThreshold = -0.3; // how far clockwise the player can rotate
var rSpeed = 0.02; // player rotation speed
var rReturnSpeed = 0.05; // player rotation return speed
var canShoot = 0;
var shootDelay = 1;

document.addEventListener("keydown", onDocumentKeyDown, false);
document.addEventListener("keyup", onDocumentKeyUp, false);
/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//GUI debug stuff
const gui = new dat.GUI();
const cameraFolder = gui.addFolder("Camera");
cameraFolder.add(camera.position, "z").min(0).max(30).step(1);
cameraFolder.add(camera.position, "y").min(0).max(20).step(1);
cameraFolder.add(enemy.position, "x").min(-10).max(10).step(0.1);

const tick = () => {
	//player side movement
	if (player.position.x < maxThreshold && pressedKeys[68] == true) {
		player.position.x += xSpeed;
	}
	if (player.position.x > minThreshold && pressedKeys[65] == true) {
		player.position.x -= xSpeed;
	}

	//player rotation
	if (player.rotation.z < maxRThreshold && pressedKeys[65] == true) {
		player.rotation.z += rSpeed;
	}
	if (player.rotation.z > minRThreshold && pressedKeys[68] == true) {
		player.rotation.z -= rSpeed;
	}
	if (pressedKeys[68] == false && pressedKeys[65] == false) {
		//player rotation reset
		if (player.rotation.z > 0) {
			player.rotation.z -= rReturnSpeed;
		}
		if (player.rotation.z < 0) {
			player.rotation.z += rReturnSpeed;
		}
	}
	if (pressedKeys[32] == true && canShoot == 0) {
		//space pressed

		// creates a bullet as a Mesh object
		var bullet = new THREE.Mesh(
			new THREE.SphereGeometry(0.05, 8, 8),
			new THREE.MeshBasicMaterial({ color: 0xffffff })
		);

		// position the bullet to come from the player's weapon
		bullet.position.set(player.position.x, 0, 0);

		// set the velocity of the bullet
		bullet.velocity = new THREE.Vector3(0, 0, -0.1);

		bullet.raycast;

		// after 1000ms, set alive to false and remove from scene
		// setting alive to false flags our update code to remove
		// the bullet from the bullets array
		bullet.alive = true;
		setTimeout(function () {
			bullet.alive = false;
			scene.remove(bullet);
		}, bulletLifetime);

		// add to scene, array, and set the delay to 10 frames
		bullets.push(bullet);
		scene.add(bullet);
		canShoot = 10;
	}

	// go through bullets array and update position
	// remove bullets when appropriate
	for (var index = 0; index < bullets.length; index += 1) {
		if (bullets[index] === undefined) continue;
		if (bullets[index].alive == false) {
			bullets.splice(index, 1);
			continue;
		}
		var ray = new THREE.Raycaster();
		raycaster.set(
			new Vector3(bullets[index].position.x, 0, bullets[index].position.z),
			new Vector3(0, 0, -1)
		);
		const intersects = raycaster.intersectObjects(scene.children);
		try {
			if (intersects[0].distance < 0.05) {
				//if raycast distance is smaller than bullet radius
				scene.remove(intersects[0].object);
				scene.remove(bullets[index]);
			}
		} catch (err) {
			null;
		}
		bullets[index].position.add(bullets[index].velocity);
	}
	//shoot delay
	if (canShoot > 0) canShoot -= shootDelay;

	//camera follow
	camera.position.x = player.position.x;

	// Render
	renderer.render(scene, camera);

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
};

//updates key pressed array
function onDocumentKeyDown(event) {
	var keyCode = event.which;
	pressedKeys[keyCode] = true;
}
function onDocumentKeyUp(event) {
	var keyCode = event.which;
	pressedKeys[keyCode] = false;
}

tick();
