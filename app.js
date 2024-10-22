const express = require("express");
const {Chess} = require("chess.js");
const socket = require("socket.io");
const http = require("http");
const path = require("path");

const app = express();
app.set("view engine","ejs")
app.use(express.static(path.join(__dirname,"public")));
const port = 3000;

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();

let player = {};
let curply = "W";


app.get("/",(req,res)=>{
    res.render("index");
})


io.on("connection",(uqsocket)=>{
    console.log("connected");
    if(!player.white){
        player.white = uqsocket.id;
        uqsocket.emit("playerRole","w");
    }
    else if(!player.black){
        player.black = uqsocket.id;
        uqsocket.emit("playerRole","b");
    }
    else{
        uqsocket.emit("spectatorRole");
    }
    uqsocket.on("disconnect",()=>{
        if(uqsocket.id === player.white){
            delete player.white;
        }
        else if(uqsocket.id == player.black){
            delete player.black;
        }
    })

    uqsocket.on("move",(move)=>{
        try{
            if(chess.turn() === 'w' && uqsocket.id !== player.white) return;
            if(chess.turn() === 'b' && uqsocket.id !== player.black) return;

            const res = chess.move(move);
            if(res){
                curply = chess.turn();
                io.emit("move",move);
                io.emit("boardState",chess.fen());
            }
            else{
                console.log("Wrong MOve");
                uqsocket.emit("invalid",move);
            }

        }
        catch(err){
            console.log(err);
            uqsocket.emit("invalid",move);
        }
    })
})

server.listen(port,()=>{
    console.log("It's Listening....")
})

