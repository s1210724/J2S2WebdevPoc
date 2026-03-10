// client side click game logic

const socket = io();

const btn = document.getElementById("btn");
btn.disabled = true;
const scoreText = document.getElementById("score");

let player = {};

socket.on("yourId", (roomId, socketId) => player = { room: roomId, socket: socketId });

socket.emit("join", {
    game: 'clickGame',
    name: prompt("Enter your name:")
});

btn.onclick = () => {
    socket.emit("g2Click", player.room);
};

socket.on("state", (gameState) => {
    const playerData = gameState['players'];
    updateLeaderboard(playerData);
    updateScore(playerData[player.socket].score);
});

socket.on("startGame", () => {
    const countdownEl = document.getElementById("countdown");

    countdownEl.style.display = "block";

    setTimeout(() => {
        displayCountdown();
    }, 5000);
});

function displayCountdown() {
    let countdown = 3;
    const countdownElement = document.getElementById("countdown");

    const interval = setInterval(() => {
        countdownElement.textContent = countdown;
        countdown--;

        if (countdown < 0) {
            clearInterval(interval);
            countdownElement.style.display = "none";
            btn.disabled = false;
        }
    }, 1000);
}
function updateScore(score) {
    scoreText.textContent = `Score: ${score}`;
}

function updateLeaderboard(players) {
    const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);
    for (let i = 0; i < sortedPlayers.length; i++) {
        document.getElementById(`${i + 1}name`).textContent = sortedPlayers[i]?.name || "Empty";
        document.getElementById(`${i + 1}score`).textContent = sortedPlayers[i]?.score || "0";
    }
}