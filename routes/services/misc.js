const express = require("express")
const app = express.Router()
const checkToken = require("../../middleware/checkToken")
const User = require("../../model/User")

app.post('/fortnite/api/game/v2/grant_access/:accountId', (req, res) => {
		res.status(204).end();
});

app.get("/eulatracking/api/public/agreements/*/account/:accountId", (req, res) => { res.status(204).end() })

app.get("/api/v1/Fortnite/get", (req, res) => {res.status(204).end() })

app.post("/api/v1/user/setting", (req, res) => {
    res.json([
        {
            "accountId": req.body.accountId,
            "key": "avatar",
            "value": "cid_003_athena_commando_f_default"
        },
        {
            "accountId": req.body.accountId,
            "key": "avatarBackground",
            "value": "[\"#B4F2FE\",\"#00ACF2\",\"#005679\"]"
        },
        {
            "accountId": req.body.accountId,
            "key": "appInstalled",
            "value": "init"
        }
    ])
})

app.post("/api/v1/assets/Fortnite/:version/:netcl", (req, res) => {
    res.json({
        "FortPlaylistAthena": {
            "meta": {
                "promotion": 0
            },
            "assets": {}
        }
    })
})

app.get("/api/v1/events/Fortnite/download/:id", (req, res) => {
    res.status(204).end()
})

app.get("/socialban/api/public/v1/*", (req, res) => {
    res.status(204).end()
})

app.get("/fortnite/api/game/v2/br-inventory/account/*", (req, res) => {
    res.status(204).end()
})

app.get("/statsproxy/api/statsv2/account/*", (req, res) => {
    res.status(204).end()
})

app.get("/api/v1/search/:accountId", async (req, res) => {
    var user = await User.findOne({displayName: req.query.prefix}).lean()

    if (!user) {
        res.json([])
    } else {
        res.json([
            {
                "accountId": user.id,
                "matches": [{
                    "value": user.displayName,
                    "platform": "EpicPC"
                }],
                "matchType": "prefix",
                "epicMutuals": 0,
                "sortPosition": 1
            }
        ])
    }
})

module.exports = app
