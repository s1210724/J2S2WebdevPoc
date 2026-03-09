const express = require("express");
const app = express();
app.use(express.static("public"));
const http = require("http").createServer(app);
const io = require("socket.io")(http);

let numbers = [];
let players = {};
let games = {};

io.on("connection", (socket) => {
    socket.on("join", (playerData) => {
        const rgb = `rgb(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)})`;
        let roomId = getGameRoom(playerData.game);

        socket.join(roomId); // IMPORTANT

        socket.data.game = playerData.game;
        socket.data.roomId = roomId;

        games[playerData.game][roomId][socket.id] = {
            x: 200,
            y: 200,
            rgb,
            name: playerData.name
        };

        socket.emit("yourId", roomId, socket.id);
    });

    socket.on("input", (roomId, keys) => {
        // use stored game name instead of hardcoding
        const gameName = socket.data.game || 'movingSquares';
        const player = games[gameName]?.[roomId]?.[socket.id];
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

    socket.on("newNum", (index, ack) => {
        const num = newNum(index);
        if (typeof ack === "function") {
            ack(num);
            console.log(`total numbers ${numbers.length}`);
        } else {
            ack(0);
        }
    });

    socket.on("disconnect", () => {
        const gameName = socket.data.game;
        const roomId = socket.data.roomId;

        if (gameName && roomId && games[gameName] && games[gameName][roomId]) {
            delete games[gameName][roomId][socket.id];
            if (Object.keys(games[gameName][roomId]).length === 0) {
                delete games[gameName][roomId];
            }
            if (Object.keys(games[gameName]).length === 0) {
                delete games[gameName];
            }
            return;
        }

        // fallback: search and remove if data wasn't set
        for (let g in games) {
            for (let r in games[g]) {
                if (games[g][r][socket.id]) {
                    delete games[g][r][socket.id];
                    if (Object.keys(games[g][r]).length === 0) delete games[g][r];
                }
            }
            if (Object.keys(games[g]).length === 0) delete games[g];
        }
    });
});

// get or create game room/instance
function getGameRoom(game) {
    if (!games[game] || Object.keys(games[game]).length === 0) {
        return createRoom(game);
    }

    // return first room with less than 5 players
    for (let roomId in games[game]) {
        if (Object.keys(games[game][roomId]).length < 5) {
            return roomId;
        }
    }

    // no available room -> create a new one
    return createRoom(game);
}

function createRoom(game) {
    const roomId = Math.random().toString(36).slice(2, 10); // random 8-char id
    games[game] = games[game] || {};
    games[game][roomId] = {};
    console.log(roomId);
    return roomId;
}

// get next number for index or create it
function newNum(index) {
    if (index + 1 > numbers.length) {
        numbers.push(Math.floor(Math.random() * 6) + 1);
    }

    return numbers[index];
}

// broadcast state 30 times/sec
setInterval(() => {
    for (let game in games) {
        for (let roomId in games[game]) {
            io.to(roomId).emit("state", games[game][roomId]);
        }
    }
}, 1000 / 60);

http.listen(3000, () => console.log("Server running on http://localhost:3000"));