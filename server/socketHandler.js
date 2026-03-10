const { getGameRoom } = require("./roomManager");
const movingSquares = require("./games/movingSquares");
const clickGame = require("./games/clickGame");
const numbers = require("./utils/numbers");

const games = {};

module.exports = function(io) {

    io.on("connection", (socket) => {

        /* -----------  general controls  ----------- */

        socket.on("join", (playerData) => {

            const roomId = getGameRoom(games, playerData.game);

            socket.join(roomId);

            socket.data.game = playerData.game;
            socket.data.roomId = roomId;

            if (playerData.game === "movingSquares") {
                movingSquares.addPlayer(
                    games,
                    playerData.game,
                    roomId,
                    socket.id,
                    playerData.name
                );
            }

            if (playerData.game === "clickGame") {
                clickGame.addPlayer(
                    games,
                    playerData.game,
                    roomId,
                    socket.id,
                    playerData.name
                );
                
                // check if room is full and send start signal
                if (Object.keys(games[playerData.game][roomId]['players']).length === 2) {
                    io.to(roomId).emit("startGame");
                }
            }

            socket.emit("yourId", roomId, socket.id);
        });

        socket.on("disconnect", () => {

            const gameName = socket.data.game;
            const roomId = socket.data.roomId;

            if (!gameName || !roomId) return;

            delete games[gameName]?.[roomId]?.['players'][socket.id];

            if (
                games[gameName] &&
                games[gameName][roomId] &&
                games[gameName][roomId]['players'] &&
                Object.keys(games[gameName][roomId]['players']).length === 0
            ) {
                delete games[gameName][roomId];
            }

            if (
                games[gameName] &&
                Object.keys(games[gameName]).length === 0
            ) {
                delete games[gameName];
            }
        });

        /* -----------  Game 1 inputs  ----------- */

        socket.on("g1Input", (roomId, keys) => {
            const gameName = socket.data.game;

            movingSquares.handleInput(
                games,
                gameName,
                roomId,
                socket.id,
                keys
            );
        });

        socket.on("g1NewNum", (index, ack) => {
            const num = numbers.getNumber(index);

            if (typeof ack === "function") {
                ack(num);
            }
        });

        /* -----------  Game 2 inputs  ----------- */
        
        socket.on("g2Click", (roomId) => {
            const gameName = socket.data.game;

            clickGame.handleClick(
                games, 
                gameName, 
                roomId, 
                socket.id
            );
        });
    });


    // broadcast state
    setInterval(() => {

        for (let game in games) {
            for (let roomId in games[game]) {

                io.to(roomId).emit(
                    "state",
                    games[game][roomId]
                );

            }
        }

    }, 1000 / 60);
};