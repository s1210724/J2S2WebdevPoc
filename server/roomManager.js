function getGameRoom(games, game) {

    if (!games[game] || Object.keys(games[game]).length === 0) {
        return createRoom(games, game);
    }

    for (let roomId in games[game]) {
        if (game == 'movingSquares' && Object.keys(games[game][roomId]['players']).length < 5 || game == 'clickGame' && Object.keys(games[game][roomId]['players']).length < 2) {
            return roomId;
        }
    }

    return createRoom(games, game);
}

function createRoom(games, game) {

    const roomId = Math.random().toString(36).slice(2, 10);

    games[game] = games[game] || {};
    games[game][roomId] = {};

    if (game == 'movingSquares') {
        games[game][roomId]['serverData'] = {
            powerup: {
                active: false,
                lastPowerup: Date.now(),
                attackingPlayer: null,
                displayAttr: {
                    x: Math.random() * 760,
                    y: Math.random() * 560,
                    size: 5,
                    opacity: 0,
                },
            }
        };
    }

    return roomId;
}

module.exports = { getGameRoom };