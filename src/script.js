import "./style.css";
import * as THREE from "three";
import * as dat from "dat.gui";
import * as TWEEN from "@tweenjs/tween.js";
import { Vector3 } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";

//Ray
const raycaster = new THREE.Raycaster();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Objects Definitions
let player = new THREE.Object3D();
let enemy = new THREE.Object3D();

// Objects Loader
const loader = new OBJLoader();
const mtlLoader = new MTLLoader();

mtlLoader.load("models/craft_speederA.mtl", function (materials) {
  materials.preload();

  const objLoader = new OBJLoader();
  objLoader.setMaterials(materials);
  objLoader.load(
    "models/craft_speederA.obj",
    function (object) {
      player = object;
      player.rotation.y = Math.PI;
      scene.add(player);
    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    function (error) {
      console.log("An error happened");
    }
  );
});

// Objects
const geometry = new THREE.BoxGeometry();

// Materials

const material = new THREE.MeshBasicMaterial();
material.color = new THREE.Color(0x00ff00);

const enemyMaterial = new THREE.MeshBasicMaterial();
enemyMaterial.color = new THREE.Color(0x0000ff);
enemyMaterial.side = THREE.DoubleSide;

// UI elements

let score = 0;

// Mesh
// const player = new THREE.Mesh(geometry, material);
// scene.add(player);

var bullets = [];
var bulletLifetime = 5000;
var bulletVelocity = 0.5;
var enemies = [];
var enemyScale = 0.2;

// Lights

const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0.5);
scene.add(hemisphereLight);

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
camera.position.y = 25;
camera.position.z = 30;
camera.rotation.x = -1.14;
scene.add(camera);
var cameraPositionTarget = new THREE.Vector3(0, 3, 5); // create on init
var cameraRotationTarget = new THREE.Vector3(0, 0, 0); // create on init

//Audio
const listener = new THREE.AudioListener();
camera.add(listener);

const audioLoader = new THREE.AudioLoader();

// Music
audioLoader.load("sounds/rickroll.ogg", function (buffer) {
  const rickrollSound = new THREE.Audio(listener);
  rickrollSound.setBuffer(buffer);
  rickrollSound.setVolume(0.5);
  rickrollSound.play(); //play shoot sound
});

// Controls
var pressedKeys = {};
pressedKeys[68] = false; //set key state at start to avoid funky behaviour from undefined
pressedKeys[65] = false;
pressedKeys[81] = false;

var xSpeed = 0.1; //speed at which player moves
var maxThreshold = 20; // how far right the player can go
var minThreshold = -20; // how far left the player can go
var maxRThreshold = 0.3; // how far counter clockwise the player can rotate
var minRThreshold = -0.3; // how far clockwise the player can rotate
var rSpeed = 0.02; // player rotation speed
var rReturnSpeed = 0.05; // player rotation return speed
var canShoot = 0;
var shootDelay = 0.5; //smaller means longer delay
var canMove = 0;
var moveDelay = 0.2; //smaller means longer delay
var moveCount = 0;
var moveThreshold = 3;
var moveThing = 1;
var moveHang = false;

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
cameraFolder.add(camera.position, "x").min(-20).max(20).step(1);
cameraFolder.add(camera.position, "y").min(-5).max(40).step(1);
cameraFolder.add(camera.position, "z").min(0).max(40).step(1);
cameraFolder.add(camera.rotation, "x").min(-2).max(2).step(0.01);

const tick = () => {
  TWEEN.update();
  //player side movement
  if (player.position.x < maxThreshold && pressedKeys[68] == true) {
    player.position.x += xSpeed;
  }
  if (player.position.x > minThreshold && pressedKeys[65] == true) {
    player.position.x -= xSpeed;
  }

  //player rotation
  if (player.rotation.z > minRThreshold && pressedKeys[65] == true) {
    player.rotation.z -= rSpeed;
  }
  if (player.rotation.z < maxRThreshold && pressedKeys[68] == true) {
    player.rotation.z += rSpeed;
  }
  if (pressedKeys[68] == false && pressedKeys[65] == false) {
    //player rotation reset
    if (player.rotation.z > 0) {
      player.rotation.z -= rReturnSpeed;
    }
    if (player.rotation.z < 0) {
      player.rotation.z += rReturnSpeed;
    }
    if (player.rotation.z < 0.05 && player.rotation.z > -0.05) {
      player.rotation.z = 0;
    }
  }
  if (pressedKeys[32] == true && canShoot == 0) {
    //space pressed
    audioLoader.load("sounds/laserSmall_000.ogg", function (buffer) {
      const shootSound = new THREE.Audio(listener);
      shootSound.setBuffer(buffer);
      shootSound.setVolume(0.5);
      shootSound.play(); //play shoot sound
      // Game start update
      document.getElementById("textPologony").innerHTML = "";
      document.getElementById("textStart").innerHTML = "";
    });
    // creates a bullet as a Mesh object
    var bullet = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 1),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );

    // position the bullet to come from the player's weapon
    bullet.position.set(player.position.x, 0, 0);

    // set the velocity of the bullet
    bullet.velocity = new THREE.Vector3(0, 0, -bulletVelocity);

    bullet.raycast;

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
    const intersects = raycaster.intersectObjects(scene.children, true);

    try {
      if (intersects[0].distance < 0.4) {
        //if raycast distance is smaller than bullet radius
        score += 1;
        const killSound = intersects[0].object.parent.children[2];
        killSound.play();
        scene.remove(intersects[0].object.parent);
        bullets[index].alive = false;
        scene.remove(bullets[index]);
      }
    } catch (err) {
      null;
    }
    bullets[index].position.add(bullets[index].velocity);
  }
  //shoot delay
  if (canShoot > 0) canShoot -= shootDelay;
  if (canShoot < 0) canShoot = 0;

  if (canMove > 0) canMove -= moveDelay;
  if (canMove < 0) canMove = 0;

  //debug enemy spawn
  if (pressedKeys[81] == true && canShoot == 0) {
    spawnEnemyArray(3, 3, -10, 3, -10, 5); //spawnEnemyArray(col, row, innerZ, zSpace, leftX, xSpace)
    //spawnEnemy(0, -10);
    canShoot = 10;
  }
  if (pressedKeys[69] == true && canShoot == 0) {
    enemies.forEach((element, index) => {
      enemies[index].position.x += 1;
    });
  }

  //enemy moving logic
  if (canMove == 0) {
    if (moveHang == false) {
      enemies.forEach((element, index) => {
        enemies[index].position.x += moveThing;
      });
    }

    if (moveCount == moveThreshold) {
      moveCount = 0;
      moveHang = false;
      enemies.forEach((element, index) => {
        enemies[index].position.z += 1;
        if (enemies[0].position.z == -5) {
          gameOver();
        }
      });

      if (moveThing == 1) {
        moveThing = -1;
      } else {
        moveThing = 1;
      }
    }
    if (moveCount == moveThreshold - 1) {
      moveHang = true;
      console.log(moveHang);
    }
    moveCount++;
    canMove = 10;
  }

  //camera follow
  camera.position.x = player.position.x;

  if (pressedKeys[32] == true) {
    cameraIntro();
  }
  //check for win
  if (score == enemies.length && score != 0) {
    nextWave();
  }

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);

  // Score update
  document.getElementById("output").innerHTML = score;
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

function spawnEnemy(x, z) {
  audioLoader.load("sounds/explosionCrunch_001.ogg", function (buffer) {
    loader.load(
      "models/enemy.obj",
      function (object) {
        enemy = object;
        enemy.scale.set(enemyScale, enemyScale, enemyScale);
        const geometry = new THREE.BoxGeometry(10.3, 7.8, 0.5);
        const material = new THREE.MeshBasicMaterial({
          color: 0xffff00,
        });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0.5, -1, 1);
        mesh.material.visible = false;
        enemy.add(mesh);
        const killSound = new THREE.Audio(listener);
        killSound.setBuffer(buffer);
        killSound.setVolume(0.5);
        enemy.add(killSound);
        enemy.position.set(x, 0.2, z);
        enemies.push(enemy);
        scene.add(enemy);
      },
      function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      function (error) {
        console.log("An error happened");
      }
    );
  });
}
function spawnEnemyArray(col, row, innerZ, zSpace, leftX, xSpace) {
  for (let i = leftX; i < col + leftX; i++) {
    for (let j = innerZ; j > innerZ - row; j--) {
      spawnEnemy((i - leftX) * xSpace + leftX, (j - innerZ) * zSpace + innerZ);
    }
  }
}
function gameOver() {
  console.log("Gameover");
}
function nextWave() {
  console.log("next wave");
}
function cameraIntro() {
  animateVector3(camera.position, cameraPositionTarget, {
    duration: 5000,

    easing: TWEEN.Easing.Quadratic.InOut,
  });
  animateVector3(camera.rotation, cameraRotationTarget, {
    duration: 5000,

    easing: TWEEN.Easing.Quadratic.InOut,
  });
}
function animateVector3(vectorToAnimate, cameraPositionTarget, options) {
  options = options || {};
  // get targets from options or set to defaults
  var to = cameraPositionTarget || THREE.Vector3(),
    easing = options.easing || TWEEN.Easing.Quadratic.In,
    duration = options.duration || 2000;
  // create the tween
  var tweenVector3 = new TWEEN.Tween(vectorToAnimate)
    .to({ x: to.x, y: to.y, z: to.z }, duration)
    .easing(easing)
    .onUpdate(function (d) {
      if (options.update) {
        options.update(d);
      }
    })
    .onComplete(function () {
      if (options.callback) options.callback();
    });
  // start the tween
  tweenVector3.start();
  // return the tween in case we want to manipulate it later on
  return tweenVector3;
}
/* How to use */

tick();
