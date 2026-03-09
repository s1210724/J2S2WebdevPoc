function addPlayer(games, game, roomId, socketId, name) {

    games[game] = games[game] || {};
    games[game][roomId] = games[game][roomId] || {};

    games[game][roomId][socketId] = {
        name,
        score: 0
    };
}

function handleClick(games, game, roomId, socketId) {
    const player = games[game]?.[roomId]?.[socketId];
    if (player) {
        player.score += 1;
    }
}

module.exports = {
    addPlayer,
    handleClick
};