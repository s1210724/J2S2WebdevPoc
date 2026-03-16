import * as THREE from "three";
import { Capsule } from "three/addons/math/Capsule.js";

export function createPlayer(camera) {
    const player = {
        collider: new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1.7, 0), 0.35),
        velocity: new THREE.Vector3(),
        onFloor: false,
        keys: {},
        yaw: 0,
        pitch: 0,
        moveSpeed: 8,
        airControl: 5,
        gravity: 30,
        jumpVelocity: 10,
    };

    camera.position.copy(player.collider.end);
    return player;
}

export function setupPlayerInput(camera, player) {
    document.addEventListener("keydown", (event) => {
        player.keys[event.code] = true;

        if (event.code === "Space" && player.onFloor) {
            player.velocity.y = player.jumpVelocity;
        }
    });

    document.addEventListener("keyup", (event) => {
        player.keys[event.code] = false;
    });

    document.body.addEventListener("click", () => {
        document.body.requestPointerLock();
    });

    document.addEventListener("mousemove", (event) => {
        if (document.pointerLockElement !== document.body) {
            return;
        }

        player.yaw -= event.movementX * 0.002;
        player.pitch -= event.movementY * 0.002;
        player.pitch = Math.max(-1.5, Math.min(1.5, player.pitch));

        camera.rotation.order = "YXZ";
        camera.rotation.y = player.yaw;
        camera.rotation.x = player.pitch;
    });
}

export function setupPlayerActions(camera, hittableObjects) {
    const raycaster = new THREE.Raycaster();

    document.addEventListener("mousedown", () => {
        raycaster.setFromCamera({ x: 0, y: 0 }, camera);

        const hits = raycaster.intersectObjects(hittableObjects, true);
        if (!hits.length) {
            return;
        }

        const hitMaterial = hits[0].object.material;
        if (Array.isArray(hitMaterial)) {
            hitMaterial.forEach((material) => material.color?.set(0x0000ff));
            return;
        }

        hitMaterial?.color?.set(0x0000ff);
    });
}

export function updatePlayer(player, camera, worldOctree, delta) {
    applyMovement(player, camera, delta);

    if (!player.onFloor) {
        player.velocity.y -= player.gravity * delta;
    }

    const deltaPosition = player.velocity.clone().multiplyScalar(delta);
    player.collider.translate(deltaPosition);

    player.onFloor = resolvePlayerCollisions(player, worldOctree);

    if (player.onFloor && player.velocity.y < 0) {
        player.velocity.y = 0;
    }

    camera.position.copy(player.collider.end);
}

function applyMovement(player, camera, delta) {
    let forward = 0;
    let side = 0;

    if (player.keys.KeyW) {
        forward += 1;
    }
    if (player.keys.KeyS) {
        forward -= 1;
    }
    if (player.keys.KeyA) {
        side -= 1;
    }
    if (player.keys.KeyD) {
        side += 1;
    }

    const forwardVector = getForwardVector(camera);
    const sideVector = getSideVector(camera);
    const desiredVelocity = new THREE.Vector3();

    desiredVelocity.add(forwardVector.multiplyScalar(forward * player.moveSpeed));
    desiredVelocity.add(sideVector.multiplyScalar(side * player.moveSpeed));

    if (desiredVelocity.length() > player.moveSpeed) {
        desiredVelocity.setLength(player.moveSpeed);
    }

    if (player.onFloor) {
        player.velocity.x = desiredVelocity.x;
        player.velocity.z = desiredVelocity.z;
        return;
    }

    player.velocity.x += (desiredVelocity.x - player.velocity.x) * player.airControl * delta;
    player.velocity.z += (desiredVelocity.z - player.velocity.z) * player.airControl * delta;
}

function resolvePlayerCollisions(player, worldOctree) {
    let onFloor = false;
    const result = worldOctree.capsuleIntersect(player.collider);

    if (result) {
        if (result.normal.y > 0) {
            onFloor = true;
        }

        player.collider.translate(result.normal.multiplyScalar(result.depth));
    }

    if (!onFloor) {
        const down = new THREE.Vector3(0, -0.1, 0);
        const colliderProbe = player.collider.clone();
        colliderProbe.translate(down);

        const floorProbe = worldOctree.capsuleIntersect(colliderProbe);
        if (floorProbe && floorProbe.normal.y > 0) {
            onFloor = true;
        }
    }

    return onFloor;
}

function getForwardVector(camera) {
    const vector = new THREE.Vector3();
    camera.getWorldDirection(vector);
    vector.y = 0;
    vector.normalize();
    return vector;
}

function getSideVector(camera) {
    const vector = getForwardVector(camera);
    vector.cross(camera.up);
    return vector;
}