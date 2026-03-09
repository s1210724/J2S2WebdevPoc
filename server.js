const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

let numbers = [];

app.use(express.static("public"));

let players = {};

io.on("connection", (socket) => {

    socket.on("join", (name) => {
        const rgb = `rgb(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)})`;
        players[socket.id] = { x: 200, y: 200, rgb, name };
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

    socket.on("disconnect", () => delete players[socket.id]);
});

// broadcast state 30 times/sec
setInterval(() => {
    io.emit("state", players);
}, 1000 / 60);

http.listen(3000, () => console.log("Server running on http://localhost:3000"));