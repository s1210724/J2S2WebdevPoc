const socket = io();

const btn = document.getElementById("btn");
const scoreText = document.getElementById("score");

let score = 0;

socket.emit("join",{game:GAME_ID,name:prompt("Enter your name")});

btn.onclick = () => {
    socket.emit("click");
};

socket.on("score",(data)=>{
    scoreText.innerText = data;
});