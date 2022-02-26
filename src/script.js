import "./style.css";
import * as THREE from "three";
import * as dat from "dat.gui";
import { Vector3 } from "three";

// Debug

//Ray
const raycaster = new THREE.Raycaster();

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

const enemyMaterial = new THREE.MeshBasicMaterial();
enemyMaterial.color = new THREE.Color(0x0000ff);

// Mesh
const player = new THREE.Mesh(geometry, material);
scene.add(player);

const enemy = new THREE.Mesh(geometry, enemyMaterial);
scene.add(enemy);
enemy.position.z = -30;
enemy.position.x = 3;

var bullets = [];

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
	alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */

const clock = new THREE.Clock();

//GUI stuff
const gui = new dat.GUI();
const cameraFolder = gui.addFolder("Camera");
cameraFolder.add(camera.position, "z").min(0).max(30).step(1);
cameraFolder.add(camera.position, "y").min(0).max(20).step(1);
cameraFolder.add(enemy.position, "x").min(-10).max(10).step(0.1);

const tick = () => {
	//const elapsedTime = clock.getElapsedTime();
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
			console.log(intersects[0].distance);
		} catch (err) {
			null;
		}
		bullets[index].position.add(bullets[index].velocity);
	}

	//camera follow
	camera.position.x = player.position.x;

	//raycasting
	// raycaster.set(new Vector3(player.position.x, 0, 0), new Vector3(0, 0, -1));

	// const intersects = raycaster.intersectObjects(scene.children);
	// try {
	// 	console.log(intersects[0].distance);
	// } catch (err) {
	// 	null;
	// }

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
		console.log("Shoot");

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
		}, 10000);

		// add to scene, array, and set the delay to 10 frames
		bullets.push(bullet);
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
