import * as THREE from "three";
import { Octree } from "three/addons/math/Octree.js";

const SHAPE_HEIGHT = 0.5;
const WALL_HEIGHT = 40;
const TETROMINO_DEFINITIONS = {
    z: {
        color: 0xff3333,
        cubes: [[0, 0], [1, 0], [1, 1], [2, 1]],
    },
    s: {
        color: 0x33cc66,
        cubes: [[1, 0], [2, 0], [0, 1], [1, 1]],
    },
    t: {
        color: 0xaa55ff,
        cubes: [[0, 0], [1, 0], [2, 0], [1, 1]],
    },
    l: {
        color: 0xff9933,
        cubes: [[0, 0], [0, 1], [0, 2], [1, 2]],
    },
    j: {
        color: 0x3366ff,
        cubes: [[1, 0], [1, 1], [1, 2], [0, 2]],
    },
    o: {
        color: 0xffdd33,
        cubes: [[0, 0], [1, 0], [0, 1], [1, 1]],
    },
    i: {
        color: 0x33ddff,
        cubes: [[0, 0], [0, 1], [0, 2], [0, 3]],
    },
};

export function createArena(scene, worldOctree = null) {
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const walls = [
        createWall(scene, null, 0, -20, 40, 1),
        createWall(scene, null, 0, 20, 40, 1),
        createWall(scene, null, -20, 0, 1, 40),
        createWall(scene, null, 20, 0, 1, 40),
    ];

    const collisionNodes = [floor, ...walls];

    if (worldOctree) {
        populateOctree(worldOctree, collisionNodes);
    }

    return { floor, walls, collisionNodes };
}

export function createWall(scene, worldOctree = null, x, z, width, depth) {
    const geometry = new THREE.BoxGeometry(width, WALL_HEIGHT, depth);
    const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(x, WALL_HEIGHT / 2, z);
    scene.add(wall);

    if (worldOctree) {
        worldOctree.fromGraphNode(wall);
    }

    return wall;
}

export function createZBlock(scene, worldOctree = null, x = 0, z = 0, rotationYDegrees = 0, rotationXDegrees = 0) {
    return createTetromino(scene, worldOctree, { type: "z", x, z, rotationYDegrees, rotationXDegrees });
}

export function createSBlock(scene, worldOctree = null, x = 0, z = 0, rotationYDegrees = 0, rotationXDegrees = 0) {
    return createTetromino(scene, worldOctree, { type: "s", x, z, rotationYDegrees, rotationXDegrees });
}

export function createTBlock(scene, worldOctree = null, x = 0, z = 0, rotationYDegrees = 0, rotationXDegrees = 0) {
    return createTetromino(scene, worldOctree, { type: "t", x, z, rotationYDegrees, rotationXDegrees });
}

export function createLBlock(scene, worldOctree = null, x = 0, z = 0, rotationYDegrees = 0, rotationXDegrees = 0) {
    return createTetromino(scene, worldOctree, { type: "l", x, z, rotationYDegrees, rotationXDegrees });
}

export function createJBlock(scene, worldOctree = null, x = 0, z = 0, rotationYDegrees = 0, rotationXDegrees = 0) {
    return createTetromino(scene, worldOctree, { type: "j", x, z, rotationYDegrees, rotationXDegrees });
}

export function createOBlock(scene, worldOctree = null, x = 0, z = 0, rotationYDegrees = 0, rotationXDegrees = 0) {
    return createTetromino(scene, worldOctree, { type: "o", x, z, rotationYDegrees, rotationXDegrees });
}

export function createIBlock(scene, worldOctree = null, x = 0, z = 0, rotationYDegrees = 0, rotationXDegrees = 0) {
    return createTetromino(scene, worldOctree, { type: "i", x, z, rotationYDegrees, rotationXDegrees });
}

export function createObstacleFromData(scene, worldOctree = null, obstacleData = {}) {
    const { type = "o", x = 0, y = 0, z = 0, rotationYDegrees = 0, rotationXDegrees = 0 } = obstacleData;
    return createTetromino(scene, worldOctree, { type, x, y, z, rotationYDegrees, rotationXDegrees });
}

export function replaceArenaObstacles(scene, existingObstacleRoot, obstacleData = []) {
    if (existingObstacleRoot) {
        scene.remove(existingObstacleRoot);
    }

    if (!Array.isArray(obstacleData) || obstacleData.length === 0) {
        return null;
    }

    const obstacleRoot = new THREE.Group();
    obstacleRoot.name = "arena-obstacles";

    for (const shapeData of obstacleData) {
        const shapeMesh = createObstacleMesh(shapeData);
        obstacleRoot.add(shapeMesh);
    }

    scene.add(obstacleRoot);
    return obstacleRoot;
}

export function buildWorldOctree(collisionNodes = []) {
    const worldOctree = new Octree();
    populateOctree(worldOctree, collisionNodes);
    return worldOctree;
}

export function createOtherPlayerMesh(scene) {
    const geometry = new THREE.CapsuleGeometry(0.35, 1.3, 4, 8);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    return mesh;
}

function createTetromino(scene, worldOctree, obstacleData) {
    const group = createObstacleMesh(obstacleData);
    scene.add(group);

    if (worldOctree) {
        worldOctree.fromGraphNode(group);
    }

    return group;
}

function createObstacleMesh({ type = "o", x = 0, y = 0, z = 0, rotationYDegrees = 0, rotationXDegrees = 0 }) {
    const definition = getTetrominoDefinition(type);
    const material = new THREE.MeshStandardMaterial({ color: definition.color });
    const group = new THREE.Group();

    for (const [cubeX, cubeZ] of definition.cubes) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(cubeX, SHAPE_HEIGHT, cubeZ);
        group.add(mesh);
    }

    group.position.set(x, y, z);
    group.rotation.y = THREE.MathUtils.degToRad(rotationYDegrees);
    group.rotation.x = THREE.MathUtils.degToRad(rotationXDegrees);

    return group;
}

function getTetrominoDefinition(type) {
    const normalizedType = String(type).toLowerCase();
    return TETROMINO_DEFINITIONS[normalizedType] || TETROMINO_DEFINITIONS.o;
}

function populateOctree(worldOctree, collisionNodes) {
    for (const node of collisionNodes) {
        if (node) {
            worldOctree.fromGraphNode(node);
        }
    }
}