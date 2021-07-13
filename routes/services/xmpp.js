const express = require("express")
const app = express.Router()

app.all("/clients", async (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("friends", "prod"))
    res.json(xmppClients)
})

module.exports = app
