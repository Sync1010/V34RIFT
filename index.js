const bodyparser = require("body-parser")
const xmlparser = require('xml-parser')
const xmlbuilder = require("xmlbuilder")
const Client = require("./xmpp/Client")
const WebSocket = require('ws');
const mongoose = require("mongoose")
const express = require("express")
const http = require('http')
const fs = require("fs")
const path = require("path")
const Friends = require(`${__dirname}/model/Friends`)
const { setInterval } = require("timers")
const app = express()
const httpServer = http.createServer(app)

//Main

const logging = require(`${__dirname}/structs/logs`)
const config = require(`${__dirname}/config.json`)
//i know global isn't the best practice, but it works good enough
global.exchangeCodes = {}
global.clientTokens = []
global.accessTokens = []
global.xmppClients = {}
global.parties = []
global.invites = []
global.pings = []
global.httpsServerBOI = httpServer

app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended: true}))

//db
mongoose.connect("mongodb+srv://gooat:daron1@dynamite.nji6r.mongodb.net/Rift?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: true}, async e => {
    if (e) throw e
    logging.fdev(`Connected to Mongo DB`)
})

app.use(require(`${__dirname}/routes`))
app.get("/CLICENSE", (req, res) => res.sendFile(path.join(__dirname, "/LICENSE.txt")))
setInterval(() => {
    parties.forEach(party => {
        party.members.forEach(member => {
            //this should delete member from party and then check if party size is 1 or smaller
            if (!xmppClients[member]) {
                let index = party.members.indexOf(member);
                if (!index) {
                    party.members.splice(index, 1);
                }
            }
        })

        if (party.members.length <= 0) {
            let index = parties.indexOf(party)
            if (!index) {
                parties.splice(index, 1)
            }
        }
    })
}, 3000)

//gets the services working n shit
app.use("/waitingroom", require(`${__dirname}/routes/services/waitingroom`))
app.use("/lightswitch", require(`${__dirname}/routes/services/lightswitch`))
app.use("/datarouter", require(`${__dirname}/routes/services/datarouter`))
app.use("/fortnite", require(`${__dirname}/routes/services/fortnite`))
app.use("/presence", require(`${__dirname}/routes/services/presence`))
app.use("/content", require(`${__dirname}/routes/services/content`))
app.use("/account", require(`${__dirname}/routes/services/account`))
app.use("/friends", require(`${__dirname}/routes/services/friends`))
app.use("/party", require(`${__dirname}/routes/services/party`))
app.use(require(`${__dirname}/routes/services/misc`))
app.use(require(`${__dirname}/routes/shop`))
require('./xmpp')
require('./party')

global.serverversion = "1.0"
const PORT = process.env.PORT || 3000
httpServer.listen(PORT)
