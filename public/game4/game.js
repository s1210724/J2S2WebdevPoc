// ---------------------- IMPORTS ----------------------
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.183.2/+esm";
import { Octree } from "https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/math/Octree.js";
import { Capsule } from "https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/math/Capsule.js";
import { io } from "https://cdn.jsdelivr.net/npm/socket.io-client@4.7.2/dist/socket.io.esm.min.js";

// ---------------------- SOCKET.IO ----------------------
const socket = io();

// ---------------------- ROOM DATA ----------------------

let RoomData = {};

// ---------------------- SCENE ----------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);

// ---------------------- LIGHT ----------------------
scene.add(new THREE.HemisphereLight(0xffffff,0x444444,1));
const light = new THREE.DirectionalLight(0xffffff,1);
light.position.set(5,10,5);
scene.add(light);

// ---------------------- WORLD ----------------------
const worldOctree = new Octree();

// Floor
const floorGeo = new THREE.PlaneGeometry(40,40);
const floorMat = new THREE.MeshStandardMaterial({color:0x444444});
const floor = new THREE.Mesh(floorGeo,floorMat);
floor.rotation.x = -Math.PI/2;
scene.add(floor);
worldOctree.fromGraphNode(floor);

// Walls
function createWall(x,z,w,d){
    const geo = new THREE.BoxGeometry(w,4,d);
    const mat = new THREE.MeshStandardMaterial({color:0x888888});
    const wall = new THREE.Mesh(geo,mat);
    wall.position.set(x,2,z);
    scene.add(wall);
    worldOctree.fromGraphNode(wall);
}
createWall(0,-20,40,1);
createWall(0,20,40,1);
createWall(-20,0,1,40);
createWall(20,0,1,40);

// Random zigzag block
function createZBlock(){
    const mat = new THREE.MeshStandardMaterial({color:0xff3333});
    const group = new THREE.Group();
    function cube(x,z){
        const geo = new THREE.BoxGeometry(1,1,1);
        const mesh = new THREE.Mesh(geo,mat);
        mesh.position.set(x,0.5,z);
        group.add(mesh);
    }
    cube(0,0);
    cube(1,0);
    cube(1,1);
    cube(2,1);

    group.position.x = (Math.random()*20)-10;
    group.position.z = (Math.random()*20)-10;
    group.rotation.y = Math.random()*Math.PI*2;

    scene.add(group);
    worldOctree.fromGraphNode(group);
    return group;
}
const zigzag = createZBlock();

// ---------------------- PLAYER ----------------------
const playerCollider = new Capsule(new THREE.Vector3(0,0.35,0), new THREE.Vector3(0,1.7,0), 0.35);
camera.position.copy(playerCollider.end);

const playerVelocity = new THREE.Vector3();
let playerOnFloor = false;

// ---------------------- INPUT ----------------------
const keys = {};
document.addEventListener("keydown",e=>keys[e.code]=true);
document.addEventListener("keyup",e=>keys[e.code]=false);

// Pointer lock
document.body.onclick = ()=>document.body.requestPointerLock();
let yaw = 0, pitch = 0;
document.addEventListener("mousemove", e => {
    if(document.pointerLockElement!==document.body) return;
    yaw -= e.movementX*0.002;
    pitch -= e.movementY*0.002;
    pitch = Math.max(-1.5,Math.min(1.5,pitch));
    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
});

// ---------------------- MOVEMENT HELPERS ----------------------
function getForwardVector(){
    const v = new THREE.Vector3();
    camera.getWorldDirection(v);
    v.y = 0; 
    v.normalize();
    return v;
}
function getSideVector(){
    const v = getForwardVector().clone();
    v.cross(camera.up);
    return v;
}

// ---------------------- CONTROLS ----------------------
function controls(delta){
    const speed = 8;
    let forward = 0, side = 0;
    if(keys["KeyW"]) forward += 1;
    if(keys["KeyS"]) forward -= 1;
    if(keys["KeyA"]) side -= 1;
    if(keys["KeyD"]) side += 1;

    const forwardVec = getForwardVector();
    const rightVec = getSideVector();
    const desired = new THREE.Vector3();
    desired.add(forwardVec.multiplyScalar(forward*speed));
    desired.add(rightVec.multiplyScalar(side*speed));
    if(desired.length() > speed) desired.setLength(speed);

    if(playerOnFloor){
        playerVelocity.x = desired.x;
        playerVelocity.z = desired.z;
    } else {
        const airControl = 5;
        playerVelocity.x += (desired.x - playerVelocity.x)*airControl*delta;
        playerVelocity.z += (desired.z - playerVelocity.z)*airControl*delta;
    }
}

// ---------------------- JUMP ----------------------
const GRAVITY = 30;
document.addEventListener("keydown", e=>{
    if(e.code==="Space" && playerOnFloor) playerVelocity.y = 10;
});

// ---------------------- COLLISION ----------------------
function playerCollisions(){
    const result = worldOctree.capsuleIntersect(playerCollider);
    playerOnFloor = false;

    if(result){
        if(result.normal.y>0) playerOnFloor = true;
        playerCollider.translate(result.normal.multiplyScalar(result.depth));
    }

    // extra floor check
    if(!playerOnFloor){
        const down = new THREE.Vector3(0,-0.1,0);
        const cap = playerCollider.clone();
        cap.translate(down);
        const res = worldOctree.capsuleIntersect(cap);
        if(res && res.normal.y>0) playerOnFloor = true;
    }
}

// ---------------------- UPDATE PLAYER ----------------------
function updatePlayer(delta){
    if(!playerOnFloor) playerVelocity.y -= GRAVITY*delta;

    const deltaPosition = playerVelocity.clone().multiplyScalar(delta);
    playerCollider.translate(deltaPosition);

    playerCollisions();

    if(playerOnFloor && playerVelocity.y<0) playerVelocity.y = 0;

    camera.position.copy(playerCollider.end);
}

// ---------------------- MULTIPLAYER ----------------------
const otherPlayers = {};
// array of objects that can be hit by hitscan (add zigzag and player meshes)
const hittableObjects = [];
// ensure zigzag (created earlier) is hittable
hittableObjects.push(zigzag);

function createOtherPlayerMesh(){
    const geo = new THREE.CapsuleGeometry(0.35,1.3,4,8);
    const mat = new THREE.MeshStandardMaterial({color:0x00ff00});
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    return mesh;
}

socket.emit("join", {
    game: 'multiplayerFPS',
    name: prompt("Enter your name:")
});

socket.on("yourId", (roomId, socketId) => RoomData = { room: roomId, socket: socketId });

// Init other players
socket.on("state", roomData=>{
    for(let id in roomData.players){
        if(id===socket.id) continue;
        const pdata = roomData.players[id];
        // If we already have a mesh for this player, update it instead of creating another
        if(otherPlayers[id]){
            const {mesh} = otherPlayers[id];
            mesh.position.set(
                pdata.position.x,
                pdata.position.y,
                pdata.position.z
            );
            mesh.rotation.set(
                pdata.rotation.x,
                pdata.rotation.y,
                pdata.rotation.z
            );
            // ensure mesh is included in hittable objects
            if(!hittableObjects.includes(mesh)) hittableObjects.push(mesh);
        } else {
            // create mesh once
            const mesh = createOtherPlayerMesh();
            mesh.position.set(
                pdata.position.x,
                pdata.position.y,
                pdata.position.z
            );
            mesh.rotation.set(
                pdata.rotation.x,
                pdata.rotation.y,
                pdata.rotation.z
            );
            otherPlayers[id] = {mesh};
            // make new player hittable
            hittableObjects.push(mesh);
        }
    }

    // send position & rotation to server
    sendPlayerUpdate();
});

socket.on("playerJoined", (id, data)=>{
    if(id===socket.id) return;
    const mesh = createOtherPlayerMesh();
    otherPlayers[id] = {mesh};
    // add to hittables
    hittableObjects.push(mesh);
});

socket.on("playerUpdate", (id, data)=>{
    if(otherPlayers[id]){
        const {mesh} = otherPlayers[id];
        mesh.position.lerp(new THREE.Vector3(data.position.x,data.position.y,data.position.z), 0.2);
        mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, data.rotation.y, 0.2);
        // ensure mesh is included in hittable objects
        if(!hittableObjects.includes(mesh)) hittableObjects.push(mesh);
    }
});

socket.on("playerLeft", (id)=>{
    if(otherPlayers[id]){
        // remove from scene
        scene.remove(otherPlayers[id].mesh);
        // remove from hittable objects
        const idx = hittableObjects.indexOf(otherPlayers[id].mesh);
        if(idx !== -1) hittableObjects.splice(idx, 1);
        delete otherPlayers[id];
    }
});

function sendPlayerUpdate(){
    // send position & rotation to server
    socket.emit("g4UpdatePos",{
        roomId: RoomData.room,
        position: playerCollider.end,
        rotation:{
            x: camera.rotation.x,
            y: camera.rotation.y,
            z: camera.rotation.z
        }
    });
};

// ---------------------- SHOOTING (example hitscan) ----------------------
const raycaster = new THREE.Raycaster();
document.addEventListener("mousedown",()=>{
    raycaster.setFromCamera({x:0,y:0}, camera);
    // check all hittable objects
    const hits = raycaster.intersectObjects(hittableObjects, true);
    if(hits.length) hits[0].object.material.color.set(0x0000ff);
});

// ---------------------- ANIMATION LOOP ----------------------
let lastTime = performance.now();
function animate(){
    const now = performance.now();
    let delta = (now-lastTime)/1000;
    lastTime = now;
    delta = Math.min(delta,0.05);

    controls(delta);
    updatePlayer(delta);

    renderer.render(scene,camera);
    requestAnimationFrame(animate);
}
animate();

// ---------------------- WINDOW RESIZE ----------------------
window.addEventListener("resize", ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
});