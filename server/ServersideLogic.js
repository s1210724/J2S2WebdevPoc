function updateServerState(sockets, Games) {
    const io = sockets;
    for (let gameType in Games) {
        for (let roomId in Games[gameType]) {
            const roomData = Games[gameType][roomId];
            const playerData = roomData['players'] || {};
            const serverData = roomData['serverData'] || {};
            if (gameType === "movingSquares") {

                if (!serverData.powerup.active == true) {
                    checkPowerupTime(serverData);
                } else if(serverData.powerup.attackingPlayer != null) {
                    checkPlayerCollisions(io, playerData, serverData);
                } else {
                    // If the powerup is active, increase its opacity until it reaches 1
                    if (serverData.powerup.displayAttr.opacity < 1) {
                       serverData.powerup.displayAttr.opacity += 0.001; // Adjust the increment as needed
                    }
                    if (serverData.powerup.displayAttr.size < 50) {
                       serverData.powerup.displayAttr.size += 0.005; // Increase the size of the powerup
                    }
                    checkPlayerOnPowerup(playerData, serverData.powerup);
                }
                
            }
        }
    }
}

function checkPowerupTime(serverData) {
    if (serverData.powerup) {
        const timeSinceLastPowerup = Date.now() - serverData.powerup.lastPowerup;

        if (timeSinceLastPowerup > 15000) { // 15 seconds
            serverData.powerup.active = true;
        }
    }
}

function checkPlayerOnPowerup(playerData, powerup) {
    for (let playerId in playerData) {
        const player = playerData[playerId];

        // get distance from player center to powerup center
        const dx = (player.x + player.size / 2) - (powerup.displayAttr.x + powerup.displayAttr.size / 2);
        const dy = (player.y + player.size / 2) - (powerup.displayAttr.y + powerup.displayAttr.size / 2);

        // check if player center is within powerup radius
        if (dx < player.size / 2 && dy < player.size / 2 && dx > 0 - player.size / 2 && dy > 0 - player.size / 2) {
            // Player is on the powerup
            powerup.lastPowerup = Date.now();
            powerup.displayAttr.opacity = 0;
            powerup.active = false;
            powerup.attackingPlayer = playerId;
            break;
        }
    }
}

function resetPowerup(powerup) {
    powerup.displayAttr.x = Math.random() * 760;
    powerup.displayAttr.y = Math.random() * 560;
    powerup.displayAttr.size = 5;
    powerup.attackingPlayer = null;
    powerup.active = false;
    powerup.lastPowerup = Date.now();
}

// check if attacking player is on other player and disconnect the player if so
function checkPlayerCollisions(io, playerData, serverData) {
    const attackingPlayer = serverData.powerup.attackingPlayer;
    const player = playerData[attackingPlayer];
    for (let victim in playerData) {
        if (victim !== attackingPlayer) {

            // get distance from player center to other player center
            const otherPlayer = playerData[victim];
            const dx = player.x - otherPlayer.x;
            const dy = player.y - otherPlayer.y;

            // check if player center is within other player bounds
            if (dx < player.size && dy < player.size && dx > 0 - player.size && dy > 0 - player.size) {
                io.to(victim).emit('killed', {});
                resetPowerup(serverData.powerup);
            }
        }
    }

    // If 5 seconds have passed since the powerup was activated, reset the attacking player
    const timeSinceLastPowerup = Date.now() - serverData.powerup.lastPowerup;

    if (timeSinceLastPowerup > 5000) { // 5 seconds
        resetPowerup(serverData.powerup);
    }
}

module.exports = {
    updateServerState
};