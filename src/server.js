// Supports ES6
// import { create, Whatsapp } from 'venom-bot';
var venom = require("venom-bot");
var globalClient;
var QR_PATH = "/tmp/out.png";
var API_TOKEN = process.env.API_TOKEN;
var qrBuffer;
var request = require("request");
//const { decode } = require("punycode");
var webhookUrl = "https://crm-c1.axioma.bio/inboundchat";

const messageHandler = (message) => {
  if (message.type !== "chat") {
    decodedMessage =
      message.type +
      " - Tipo de mensaje aun no soportado - " +
      message.timestamp;
  }
  var options = {
    method: "POST",
    url: webhookUrl,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      instanceId: "12689",
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
  request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(response.body);
  });
};

venom
  .create({
    session: "session-name3",
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
    useChrome: false,
    browserArgs: ["--no-sandbox"],
    multidevice: true, // for version not multidevice use false.(default: true)
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

app.get("/qr2", function (req, res) {
  res.send(qrBuffer);
});

router.post("/:instanceNumber/sendMessage", function (req, res) {
  res.send(globalClient.sendText(req.body.chatId, req.body.body));
});
app.use(router);
app.listen(3001, function () {
  console.log("Node server running on http://localhost:3001");
});