const randomColor = require("../utils/randomColor");

function addPlayer(games, game, roomId, socketId, name) {

    const rgb = randomColor();

    games[game] = games[game] || {};
    games[game][roomId] = games[game][roomId] || {};

    games[game][roomId][socketId] = {
        x: 200,
        y: 200,
        rgb,
        name
    };
}

function handleInput(games, game, roomId, socketId, keys) {

    const player = games[game]?.[roomId]?.[socketId];
    if (!player) return;

    const speed = 5;

    if (keys.includes("KeyW")) player.y -= speed;
    if (keys.includes("KeyS")) player.y += speed;
    if (keys.includes("KeyA")) player.x -= speed;
    if (keys.includes("KeyD")) player.x += speed;

    player.x = Math.max(0, Math.min(player.x, 760));
    player.y = Math.max(0, Math.min(player.y, 560));
}

module.exports = {
    addPlayer,
    handleInput
};