const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let player = { x: 200, y: 200 };
let players = {};

document.addEventListener("keydown", (e) => {

    if (e.key === "w") player.y -= 5;
    if (e.key === "s") player.y += 5;
    if (e.key === "a") player.x -= 5;
    if (e.key === "d") player.x += 5;

    socket.emit("move", player);

});

socket.on("state", (serverPlayers) => {
    players = serverPlayers;
});

function gameLoop() {

    ctx.clearRect(0,0,canvas.width,canvas.height);

    for (let id in players) {

        let p = players[id];

        ctx.fillStyle = p.rgb;
        ctx.fillRect(p.x, p.y, 40, 40);

    }

    requestAnimationFrame(gameLoop);
}

gameLoop();