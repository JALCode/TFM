const express = require("express");
const fs = require("fs");
const app = express();
const path = require('path')

const port = 443;

//const http = require("http");
//const server = http.createServer(app);


const https = require("https");
const secureServer = https.createServer({
key: fs.readFileSync("server.key"),
cert: fs.readFileSync("server.crt")
}, app);

const io = require("socket.io")(secureServer);
app.use(express.static(__dirname + ""));
// app.use('/build/', express.static(path.join(__dirname, 'node_modules/three/build')));
// app.use('/jsm/', express.static(path.join(__dirname, 'node_modules/three/examples/jsm')));
// app.use('/ecsy/', express.static(path.join(__dirname, 'node_modules/ecsy/build')));
// app.use('/troika-three-text/', express.static(path.join(__dirname, 'node_modules/troika-three-text')));

io.sockets.on("error", e => console.log(e));
secureServer.listen(port,'192.168.1.34', () => console.log(`Server is running on port ${port}`));

let broadcaster;

io.sockets.on("connection", socket => {
    socket.on("broadcaster", () => {
        broadcaster = socket.id;
        socket.broadcast.emit("broadcaster");
    });
    socket.on("watcher", () => {
        socket.to(broadcaster).emit("watcher", socket.id);
    });
    socket.on("disconnect", () => {
        socket.to(broadcaster).emit("disconnectPeer", socket.id);
    });

    socket.on("offer", (id, message) => {
        socket.to(id).emit("offer", socket.id, message);
    });
    socket.on("answer", (id, message) => {
        socket.to(id).emit("answer", socket.id, message);
    });
    socket.on("candidate", (id, message) => {
        socket.to(id).emit("candidate", socket.id, message);
    });
});