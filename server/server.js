const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const socketHandler = require("./socketHandler");

const app = express();
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server);

socketHandler(io);

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});