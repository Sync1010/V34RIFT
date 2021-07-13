const express = require("express")
//const axios = require('axios').default;
const app = express.Router()
const fs = require("fs")
const jwt = require("jsonwebtoken");
const checkToken = require(`${__dirname}/../../middleware/checkToken`)
const cache = require(`${__dirname}/../../structs/caching`)
const errors = require(`${__dirname}/../../structs/errors`)
var builder = require('xmlbuilder');
app.use(require(`${__dirname}/cloudstorage.js`))
app.use(require(`${__dirname}/timeline.js`))
app.use(require(`${__dirname}/mcp.js`))

app.all("/api/v2/versioncheck/Windows", (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("fortnite", "prod-live"))
    res.json({type: "NO_UPDATE"})
})

app.all("/api/receipts/v1/account/:accountId/receipts", checkToken, (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("fortnite", "prod-live"))
    res.json({})
})

app.all("/api/game/v2/tryPlayOnPlatform/account/:accountId", checkToken, (req, res) => {
    if(req.method != "POST") return res.status(405).json(errors.method("fortnite", "prod-live"))
    res.setHeader('Content-Type', 'text/plain')
    res.send(true)
})

app.all("/api/game/v2/enabled_features", checkToken,  (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("fortnite", "prod-live"))
    res.json([])
})

app.all("/api/storefront/v2/keychain", checkToken, (req, res) => {
    if(req.method != "GET") return res.status(405).json(errors.method("fortnite", "prod-live"))
  //  axios.get("https://api.glitchlux1.repl.co/keychain", { timeout: 3000 }).then(response => {
		//	res.json(response.data);
		//}).catch(e => {
		//	res.json(["74AF07F9A2908BB2C32C9B07BC998560:V0Oqo/JGdPq3K1fX3JQRzwjCQMK7bV4QoyqQQFsIf0k=:Glider_ID_158_Hairy"])
		//})

    res.json(cache.getKeychain())
})

app.all("/fortnite/api/game/v2/matchmakingservice/ticket/player/:accountId", (req, res) => {
		var ParsedBckt = {
			NetCL: "",
			Region: "",
			Playlist: "",
			HotfixVerion: -1
		}

		try {
			var splitted = req.query.bucketId.split(':');
			ParsedBckt.NetCL = splitted[0];
			ParsedBckt.HotfixVerion = splitted[1];
			ParsedBckt.Region = splitted[2];
			ParsedBckt.Playlist = splitted[3];
		}
		catch {
			throw new ApiException(errors.com.epicgames.fortnite.invalid_bucket_id);
		}
		finally {
			if (ParsedBckt.NetCL === "" || ParsedBckt.Region === "" || ParsedBckt.Playlist === "" || ParsedBckt.Region === -1) {
				throw new ApiException(errors.com.epicgames.fortnite.invalid_bucket_id).withMessage(`Failed to parse bucketId: '${req.query.bucketId}'`).with(req.query.bucketId)
			}
		}

		res.cookie("NetCL", ParsedBckt.NetCL);

		var data = {
			"playerId": req.params.accountId,
			"partyPlayerIds": [
				req.params.accountId,
			],
			"bucketId": `FN:Live:${ParsedBckt.NetCL}:${ParsedBckt.HotfixVerion}:${ParsedBckt.Region}:${ParsedBckt.Playlist}:PC:public:1`,
			"attributes": {
				"player.userAgent": req.headers["user-agent"],
				"player.preferredSubregion": "None",
				"player.option.spectator": "false",
				"player.inputTypes": "",
				"playlist.revision": "1",
				"player.teamFormat": "fun"
			},
			"expireAt": new Date().addHours(1),
			"nonce": RandomString(32)
		}

		Object.entries(req.query).forEach(([key, value]) => {
			if (key == "player.subregions" && value.includes(',')) {
				data.attributes["player.preferredSubregion"] = value.split(',')[0];
			}

			data.attributes[key] = value;
		});

		var payload = Buffer.from(JSON.stringify(data, null, 0)).toString('base64');

		res.json({
			"serviceUrl": "wss://matchmaking-fn.herokuapp.com/",
			"ticketType": "mms-player",
			"payload": payload,
			"signature": "CloudBOI"
		});

	});

	app.get("/fortnite/api/game/v2/matchmaking/account/:accountId/session/:sessionId", (req, res) =>
		res.json({
			"accountId": req.params.accountId,
			"sessionId": req.params.sessionId,
			"key": "none"
		})
	)

	app.post("/fortnite/api/matchmaking/session/:SessionId/join", (req, res) => res.status(204).end())

	app.get("/fortnite/api/matchmaking/session/:sessionId", (req, res) => {
		var BuildUniqueId = req.cookies["NetCL"];

		res.json({
			"id": req.params.sessionId,
			"ownerId": "Cloud",
			"ownerName": "Cloud",
			"serverName": "CloudFN",
			"serverAddress": "wss://192.223.24.145:1194",
			"serverPort": 1194,
			"totalPlayers": 0,
			"maxPublicPlayers": 50,
			"openPublicPlayers": 10,
			"maxPrivatePlayers": 10,
			"openPrivatePlayers": 10,
			"attributes": {},
			"publicPlayers": [],
			"privatePlayers": [],
			"allowJoinInProgress": true,
			"shouldAdvertise": false,
			"isDedicated": false,
			"usesStats": false,
			"allowInvites": true,
			"usesPresence": true,
			"allowJoinViaPresence": true,
			"allowJoinViaPresenceFriendsOnly": false,
			"buildUniqueId": BuildUniqueId || "00000000",
			"lastUpdated": "2020-11-09T00:40:28.878Z",
			"started": false
		});
	});

app.all("/api/game/v2/privacy/account/:accountId", checkToken, (req, res) => {
    res.json({
        acceptInvites: "public"
    })
})

app.all("/api/game/v2/world/info", checkToken, (req, res) => {
    res.json({})
})


module.exports = app
