const OBSTACLE_TYPES = ["i", "j", "l", "o", "s", "t", "z"];
const ROTATION_OPTIONS = [0, 90, 180, 270];
const ARENA_GRID_MIN = -15;
const ARENA_GRID_MAX = 15;
const ARENA_GRID_STEP = 1;
const MIN_OBSTACLE_COUNT = 150;
const MAX_OBSTACLE_COUNT = 300;
const MIN_OBSTACLE_Y = 0;
const MAX_OBSTACLE_Y = 30;

function addPlayer(games, game, roomId, socketId, playerName) {
    games[game] = games[game] || {};
    games[game][roomId] = games[game][roomId] || {};
    games[game][roomId]['players'] = games[game][roomId]['players'] || {};
    games[game][roomId]['serverData'] = games[game][roomId]['serverData'] || {
        obstacles: createRandomArenaObstacles(),
    };

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

function createRandomArenaObstacles() {
    const availablePositions = [];

    for (let x = ARENA_GRID_MIN; x <= ARENA_GRID_MAX; x += ARENA_GRID_STEP) {
        for (let z = ARENA_GRID_MIN; z <= ARENA_GRID_MAX; z += ARENA_GRID_STEP) {
            availablePositions.push({ x, z });
        }
    }

    shuffleArray(availablePositions);

    const obstacleCount = randomInt(MIN_OBSTACLE_COUNT, MAX_OBSTACLE_COUNT);
    console.log(obstacleCount);
    const obstacles = [];

    for (let index = 0; index < obstacleCount && index < availablePositions.length; index += 1) {
        const { x, z } = availablePositions[index];
        obstacles.push({
            id: `obstacle-${index + 1}`,
            type: randomItem(OBSTACLE_TYPES),
            x,
            y: randomInt(MIN_OBSTACLE_Y, MAX_OBSTACLE_Y),
            z,
            rotationYDegrees: randomItem(ROTATION_OPTIONS),
            rotationXDegrees: randomItem(ROTATION_OPTIONS),
        });
    }

    console.log(obstacles.length);

    return obstacles;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * ((max - min) + 1)) + min;
}

function randomItem(items) {
    return items[randomInt(0, items.length - 1)];
}

function shuffleArray(items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
        const swapIndex = randomInt(0, index);
        const currentItem = items[index];
        items[index] = items[swapIndex];
        items[swapIndex] = currentItem;
    }
}

module.exports = { 
    addPlayer,
    handleUpdate
};