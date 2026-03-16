import * as Player from "./player.js";
import * as Rendering from "./rendering.js";
import * as Shapes from "./shapes.js";
import * as Sockets from "./sockets.js";

const { scene, camera, renderer } = Rendering.createRenderingContext();
const arena = Shapes.createArena(scene);
let worldOctree = Shapes.buildWorldOctree(arena.collisionNodes);
let obstacleRoot = null;
let obstacleSignature = "";

const hittableObjects = [];

const player = Player.createPlayer(camera);
Player.setupPlayerInput(camera, player);
Player.setupPlayerActions(camera, hittableObjects);

Sockets.createSocketController(scene, camera, player, hittableObjects, {
    onRoomState: (roomData) => {
        const nextObstacles = roomData.serverData?.obstacles || [];
        const nextSignature = JSON.stringify(nextObstacles);

        if (nextSignature === obstacleSignature) {
            return;
        }

        obstacleSignature = nextSignature;

        if (obstacleRoot) {
            const existingIndex = hittableObjects.indexOf(obstacleRoot);
            if (existingIndex !== -1) {
                hittableObjects.splice(existingIndex, 1);
            }
        }

        obstacleRoot = Shapes.replaceArenaObstacles(scene, obstacleRoot, nextObstacles);

        if (obstacleRoot) {
            hittableObjects.push(obstacleRoot);
        }

        worldOctree = Shapes.buildWorldOctree([
            ...arena.collisionNodes,
            obstacleRoot,
        ]);
    },
});

Rendering.startRenderLoop((delta) => {
    Player.updatePlayer(player, camera, worldOctree, delta);
}, renderer, scene, camera);