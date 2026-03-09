const express = require("express");
const app = express();
app.use(express.static("public"));
const http = require("http").createServer(app);
const io = require("socket.io")(http);

let numbers = [];
let players = {};

io.on("connection", (socket) => {
    socket.on("join", (playerData) => {
        const rgb = `rgb(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)})`;
        players[socket.id] = { x: 200, y: 200, rgb, name: playerData.name };
        socket.emit("yourId", socket.id);
    });

    socket.on("input", (keys) => {
        const player = players[socket.id];
        if (!player) return;

        const speed = 5;
        if (keys.includes("KeyW")) player.y -= speed;
        if (keys.includes("KeyS")) player.y += speed;
        if (keys.includes("KeyA")) player.x -= speed;
        if (keys.includes("KeyD")) player.x += speed;

        // optional bounds
        player.x = Math.max(0, Math.min(player.x, 800 - 40));
        player.y = Math.max(0, Math.min(player.y, 600 - 40));
    });

    // socket handler: client requests next number for an index
    socket.on("newNum", (index, ack) => {
        const num = newNum(index);
        if (typeof ack === "function") {
            ack(num); // send result via acknowledgement callback if provided
            console.log(`total numbers ${numbers.length}`);
        } else {
            ack(0); // or send a default value if no ack provided
        }
    });
    socket.on("disconnect", () => delete players[socket.id]);
});

// get next number for index or create it
function newNum(index) {
    if (index + 1 > numbers.length) {
        numbers.push(Math.floor(Math.random() * 6) + 1);
    }

    return numbers[index];
}

// broadcast state 30 times/sec
setInterval(() => {
    io.emit("state", players);
}, 1000 / 60);

http.listen(3000, () => console.log("Server running on http://localhost:3000"));