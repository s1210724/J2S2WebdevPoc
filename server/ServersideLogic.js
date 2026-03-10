function updateServerState(Games) {
    for (let gameType in Games) {
        for (let roomId in Games[gameType]) {
            const serverData = Games[gameType][roomId]['serverData'] || {};
            if (gameType === "movingSquares") {
                 const serverData = Games[gameType][roomId]['serverData'] || {};
            }
        }
    }
}

function timedEventsCheck(serverData) {
    
}

module.exports = {
    updateServerState
};