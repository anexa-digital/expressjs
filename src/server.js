// Supports ES6
// import { create, Whatsapp } from 'venom-bot';
var venom = require("venom-bot");
var globalClient;


var API_TOKEN = process.env.API_TOKEN;
var PORT = process.env.PORT || 3333;
var BASE_URL = process.env.BASE_URL;
var INSTANCE_ID = process.env.INSTANCE_ID || "123";
var TEMP_PATH = '/tmpapp'
var QR_PATH = `${TEMP_PATH}/qr${INSTANCE_ID}.png`;
var SESSION_NAME = process.env.SESSION_NAME || INSTANCE_ID;
var webhookUrl = process.env.WEBHOOK_URL || "http://192.168.21.128:8080/inboundchat";
var qrBuffer;
var request = require("request");
var mime = require('mime-types');
const fs = require('fs');
//const { decode } = require("punycode");


const messageHandler = async (message) => {
  //console.log(message);
  decodedMessage = message.body;
  if (message.type == 'ptt' || message.type =='document' || message.isMedia === true || message.isMMS === true) {
    const buffer = await globalClient.decryptFile(message);
    const fileName = `${message.id}.${mime.extension(message.mimetype)}`;
    await fs.writeFile(`${TEMP_PATH}/${fileName}`, buffer, (err) => {
      console.log(err);
    });
    decodedMessage = `${BASE_URL}/media?file=${fileName}`
  }
  

  var options = {
    method: "POST",
    url: webhookUrl,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      instanceId: INSTANCE_ID,
      messages: [
        {
          id: message.id,
          body: decodedMessage,
          type: message.type,
          senderName: message.notifyName,
          fromMe: message.fromMe,
          author: message.from,
          time: message.timestamp,
          chatId: message.chatId,
          messageNumber: message.timestamp,
        },
      ],
    }),
  };

  await request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(response.body);
  });
};

venom
  .create({
    session: "session-" + SESSION_NAME,
    catchQR: function (base64Qr, asciiQR) {
      //console.log(asciiQR); // Optional to log the QR in the terminal
      var matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};
      if (matches.length !== 3) {
        return new Error("Invalid input string");
      }
      response.type = matches[1];
      response.data = new Buffer.from(matches[2], "base64");
      qrBuffer = response.data;
      var imageBuffer = response;
      require("fs").writeFile(
        QR_PATH,
        imageBuffer["data"],
        "binary",
        function (err) {
          if (err != null) {
            console.log(err);
          }
        }
      );
    },
    multidevice: true,
    folderNameToken: 'tokens',
    mkdirFolderToken: '/tmpapp',
  })
  .then(function (client) {
    return start(client);
  })
  ["catch"](function (erro) {
    console.log(erro);
  });

function start(client) {
  console.log("hhhhhhhhhhhhhhhhhstart(client)hhhhhhhhhhhhhhhhhh");
  globalClient = client;
  globalClient.onMessage(messageHandler);
}

function auth(req, res) {
  console.log(API_TOKEN);
  console.log(req.query.token);
  if (req.query.token !== API_TOKEN) {
    res.send("404");
  }
}

var express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  methodOverride = require("method-override");
//mongoose = require("mongoose");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride());
var router = express.Router();

router.get("/", function (req, res) {
  res.send({ uno: "Hello World!" });
});

app.get("/qr", function (req, res) {
  auth(req, res);
  res.sendFile(QR_PATH);
});

app.get("/media", function (req, res) {
  res.sendFile(`${TEMP_PATH}/${req.query.file}`);
});

router.post("/:instanceNumber/sendMessage", function (req, res) {
  var recipient = req.body.chatId || req.body.phone;
  res.send(globalClient.sendText(recipient, req.body.body));
});
app.use(router);
app.listen(PORT, function () {
  console.log("Node server running on http://localhost:" + PORT);
});
