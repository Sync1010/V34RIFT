const xmlparser = require('xml-parser')
const xmlbuilder = require("xmlbuilder")
const Client = require("./Client")
const WebSocket = require('ws');

const wss = new WebSocket.Server({ server: httpsServerBOI  });


wss.on("connection", ws => {
    var client = new Client(ws) 

    ws.on("close", async (lol) => {

        if (client.sender) {
            clearInterval(client.sender)
        }
        if (xmppClients[client.id]) delete xmppClients[client.id]
    })
})

wss.on("error", ws => {})
