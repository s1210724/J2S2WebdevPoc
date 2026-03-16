const socket = io();

const canvas = document.getElementById("fps");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const TILE = 64;

const map = [
[1,1,1,1,1,1,1,1],
[1,0,0,0,0,0,0,1],
[1,0,0,1,0,0,0,1],
[1,0,0,1,0,0,0,1],
[1,0,0,0,0,0,0,1],
[1,0,0,0,0,1,0,1],
[1,0,0,0,0,0,0,1],
[1,1,1,1,1,1,1,1]
];

let player = {
x:160,
y:160,
angle:0,
speed:3
};

const keys = {};

document.addEventListener("keydown", e=>{
keys[e.code] = true;
});

document.addEventListener("keyup", e=>{
keys[e.code] = false;
});

canvas.onclick = ()=>{
canvas.requestPointerLock();
};

document.addEventListener("mousemove", e=>{
if(document.pointerLockElement === canvas){
player.angle += e.movementX * 0.003;
}
});

function movePlayer(){

let moveX = 0;
let moveY = 0;

if(keys["KeyW"]){
moveX += Math.cos(player.angle) * player.speed;
moveY += Math.sin(player.angle) * player.speed;
}

if(keys["KeyS"]){
moveX -= Math.cos(player.angle) * player.speed;
moveY -= Math.sin(player.angle) * player.speed;
}

if(keys["KeyA"]){
moveX += Math.cos(player.angle - Math.PI/2) * player.speed;
moveY += Math.sin(player.angle - Math.PI/2) * player.speed;
}

if(keys["KeyD"]){
moveX += Math.cos(player.angle + Math.PI/2) * player.speed;
moveY += Math.sin(player.angle + Math.PI/2) * player.speed;
}

let newX = player.x + moveX;
let newY = player.y + moveY;

let mapX = Math.floor(newX / TILE);
let mapY = Math.floor(newY / TILE);

if(map[mapY][mapX] === 0){
player.x = newX;
player.y = newY;
}

}

function castRay(angle){

let sin = Math.sin(angle);
let cos = Math.cos(angle);

for(let depth = 0; depth < 800; depth++){

let x = player.x + cos * depth;
let y = player.y + sin * depth;

let mapX = Math.floor(x / TILE);
let mapY = Math.floor(y / TILE);

if(map[mapY] && map[mapY][mapX] === 1){
return depth;
}

}

return 800;

}

const FOV = Math.PI/3;

function render(){

ctx.fillStyle = "#87ceeb";
ctx.fillRect(0,0,canvas.width,canvas.height/2);

ctx.fillStyle = "#333";
ctx.fillRect(0,canvas.height/2,canvas.width,canvas.height/2);

for(let i=0;i<canvas.width;i++){

let rayAngle =
player.angle - FOV/2 + (i/canvas.width)*FOV;

let depth = castRay(rayAngle);

let corrected = depth *
Math.cos(rayAngle - player.angle);

let wallHeight =
(64 * canvas.height) / corrected;

let shade = 255 - corrected * 0.3;

ctx.fillStyle =
`rgb(${shade},${shade},${shade})`;

ctx.fillRect(
i,
canvas.height/2 - wallHeight/2,
1,
wallHeight
);

}

}

function gameLoop(){

movePlayer();
render();

requestAnimationFrame(gameLoop);

}

gameLoop();