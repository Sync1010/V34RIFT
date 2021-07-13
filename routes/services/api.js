const express = require("express")
const app = express.Router()
const fs = require("fs")
const cache = require("../../")

app.get("/fltoken/16-30", (req, res) => {
      res.json({"fltoken": "5dh74c635862g575778132fb"})
})

app.get("/items/main", (req, res) => {
      var done
      fs.readFile(`.${__dirname}/../../cache/cosmetics.json`, (err, data) => {
            if (err) throw err;
            done = JSON.parse(data);
      });
     res.json(done)
})

module.exports = app
