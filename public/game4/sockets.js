import * as THREE from "three";
import { io } from "https://cdn.jsdelivr.net/npm/socket.io-client@4.7.2/dist/socket.io.esm.min.js";

import { createOtherPlayerMesh } from "./shapes.js";

export function createSocketController(scene, camera, player, hittableObjects, options = {}) {
    const socket = io();
    const roomData = {};
    const otherPlayers = {};
    const { onRoomState } = options;

    socket.emit("join", {
        game: "multiplayerFPS",
        name: prompt("Enter your name:"),
    });

    socket.on("yourId", (roomId, socketId) => {
        roomData.room = roomId;
        roomData.socket = socketId;
    });

    socket.on("state", (nextRoomData) => {
        onRoomState?.(nextRoomData);

        for (const id in nextRoomData.players) {
            if (id === socket.id) {
                continue;
            }

            const playerData = nextRoomData.players[id];
            const entry = ensureOtherPlayer(otherPlayers, id, scene, hittableObjects);
            entry.mesh.position.set(playerData.position.x, playerData.position.y, playerData.position.z);
            entry.mesh.rotation.set(playerData.rotation.x, playerData.rotation.y, playerData.rotation.z);
        }

        sendPlayerUpdate(socket, roomData, player, camera);
    });

    socket.on("playerJoined", (id) => {
        if (id === socket.id) {
            return;
        }

        ensureOtherPlayer(otherPlayers, id, scene, hittableObjects);
    });

    socket.on("playerUpdate", (id, data) => {
        const entry = otherPlayers[id];
        if (!entry) {
            return;
        }

        entry.mesh.position.lerp(new THREE.Vector3(data.position.x, data.position.y, data.position.z), 0.2);
        entry.mesh.rotation.y = THREE.MathUtils.lerp(entry.mesh.rotation.y, data.rotation.y, 0.2);
        addHittableOnce(hittableObjects, entry.mesh);
    });

    socket.on("playerLeft", (id) => {
        const entry = otherPlayers[id];
        if (!entry) {
            return;
        }

        scene.remove(entry.mesh);

        const hittableIndex = hittableObjects.indexOf(entry.mesh);
        if (hittableIndex !== -1) {
            hittableObjects.splice(hittableIndex, 1);
        }

        delete otherPlayers[id];
    });

    return {
        socket,
        otherPlayers,
        roomData,
        sendPlayerUpdate: () => sendPlayerUpdate(socket, roomData, player, camera),
    };
}

function ensureOtherPlayer(otherPlayers, id, scene, hittableObjects) {
    if (otherPlayers[id]) {
        addHittableOnce(hittableObjects, otherPlayers[id].mesh);
        return otherPlayers[id];
    }

    const mesh = createOtherPlayerMesh(scene);
    const entry = { mesh };
    otherPlayers[id] = entry;
    addHittableOnce(hittableObjects, mesh);
    return entry;
}

function addHittableOnce(hittableObjects, mesh) {
    if (!hittableObjects.includes(mesh)) {
        hittableObjects.push(mesh);
    }
}

function sendPlayerUpdate(socket, roomData, player, camera) {
    if (!roomData.room) {
        return;
    }

    socket.emit("g4UpdatePos", {
        roomId: roomData.room,
        position: {
            x: player.collider.end.x,
            y: player.collider.end.y,
            z: player.collider.end.z,
        },
        rotation: {
            x: camera.rotation.x,
            y: camera.rotation.y,
            z: camera.rotation.z,
        },
    });
}