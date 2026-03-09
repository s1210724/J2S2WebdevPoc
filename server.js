const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let players = {};

io.on("connection", (socket) => {

    players[socket.id] = {
        x: 200,
        y: 200,
        rgb: `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`
    };

    socket.on("move", (data) => {
        players[socket.id].x = data.x;
        players[socket.id].y = data.y;
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
    });
});

setInterval(() => {
    io.emit("state", players);
}, 1000 / 60);

http.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});