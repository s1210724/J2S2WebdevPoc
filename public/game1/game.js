// client side moving squares game logic

const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const pressedKeys = new Set();
const SMOOTHING = .6;

let animationFrame;
let newNumPending = false;
let numIndex = 0;
let player = {};
let players = {}; // stores all player data needed for rendering: { id: { lastpos, target, rgb, name } }
let powerup = {};

// handle key presses
document.addEventListener("keydown", (event) => pressedKeys.add(event.code));
document.addEventListener("keyup", (event) => pressedKeys.delete(event.code));

// get name and join game
socket.emit("join", {
    game: 'movingSquares',
    name: prompt("Enter your name:")
});

// store your own ID
socket.on("yourId", (roomId, socketId) => player = { room: roomId, socket: socketId });

// send input to server at fixed interval
setInterval(() => {
    if (pressedKeys.size > 0 && player) {
        socket.emit("g1Input", player.room, Array.from(pressedKeys));
    }
}, 1000 / 30);

// get new number from server on enter press
document.addEventListener("keydown", (event) => {
    if (event.code === "Enter") {
        // only request when no request is pending and increment the index
        // only after the server acknowledges so other keydowns (movement)
        // won't advance the index
        if (!newNumPending) {
            newNumPending = true;
            socket.emit("g1NewNum", numIndex, (num) => {
                newNumPending = false;
                // increment index only after successful response
                numIndex++;
            });
        }

        // prevent default Enter behavior
        event.preventDefault();
    }
});

// receive server state
socket.on("state", (serverData) => {
    for (let id in serverData['players']) {
        const serverP = serverData['players'][id];
        powerup = serverData['serverData']['powerup'];

        if (!players[id]) {
            // initialize lastpos and target
            players[id] = {
                lastpos: { x: serverP.x, y: serverP.y },
                target: { x: serverP.x, y: serverP.y },
                rgb: serverP.rgb,
                name: serverP.name,
                size: serverP.size
            };
        } else {
            players[id].target.x = serverP.x;
            players[id].target.y = serverP.y;
            players[id].rgb = serverP.rgb;
            players[id].name = serverP.name;
            players[id].size = serverP.size;
        }
    }

    // remove disconnected players
    for (let id in players) {
        if (!serverData['players'][id]) delete players[id];
    }
});

socket.on("killed", () => {
    cancelAnimationFrame(animationFrame);
    socket.disconnect();
    location.reload();
});

// linear interpolation helper
function lerp(a, b, t) {
    return a + (b - a) * t;
}

// continuous render loop for smooth movement
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // draw powerup
    if (powerup.displayAttr) {
        ctx.fillStyle = `rgba(255,0,0,${powerup.displayAttr.opacity})`;
        ctx.beginPath();
        ctx.fillRect(powerup.displayAttr.x, powerup.displayAttr.y, powerup.displayAttr.size, powerup.displayAttr.size);
        ctx.fill();
    }

    // draw all individual players
    for (let id in players) {
        const p = players[id];

        // interpolate lastpos towards target
        p.lastpos.x = lerp(p.lastpos.x, p.target.x, SMOOTHING);
        p.lastpos.y = lerp(p.lastpos.y, p.target.y, SMOOTHING);

        // draw player
        ctx.fillStyle = p.rgb;
        ctx.fillRect(p.lastpos.x, p.lastpos.y, p.size, p.size);

        // draw player name
        ctx.fillStyle = "black";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(p.name, p.lastpos.x + p.size / 2, p.lastpos.y - 5);
    }

    animationFrame = requestAnimationFrame(gameLoop);
}

// start the loop
gameLoop();