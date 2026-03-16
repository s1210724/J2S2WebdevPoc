function addPlayer(games, game, roomId, socketId, playerName) {
    games[game] = games[game] || {};
    games[game][roomId] = games[game][roomId] || {};
    games[game][roomId]['players'] = games[game][roomId]['players'] || {};

    games[game][roomId]['players'][socketId] = {
        name: playerName,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
    };
}

function handleUpdate(games, game, roomId, socketId, position, rotation) {
    const player = games[game][roomId]['players'][socketId];
    if (!player) return;

    // Update player position and rotation
    player.position = position;
    player.rotation = rotation;

}

module.exports = { 
    addPlayer,
    handleUpdate
};