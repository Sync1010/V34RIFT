const cookieParser = require("cookie-parser")
const request = require("request")
const express = require("express")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const uuid = require("uuid").v4
const app = express.Router()
const fs = require("fs")

const CommonCore = require(`${__dirname}/../model/CommonCore`)
const caching = require(`${__dirname}/../structs/caching`)
const Friends = require(`${__dirname}/../model/Friends`)
const Athena = require(`${__dirname}/../model/Athena`)
const logging = require(`${__dirname}/../structs/logs`)
const User = require(`${__dirname}/../model/User`)

var tokens = {}

app.use(cookieParser())

/**
 * Virgin Slayer v2.0
 * Created to stop virgins (makks, kemo, fuck all) from getting into our servers and spamming the fuck out of it.
 * @param {String} gcaptcha 
 */
function virginSlayerv2(gcaptcha) {
    return new Promise((resolve, reject) => {
        request.post("https://www.google.com/recaptcha/api/siteverify", {json: true, form: {
            secret: "insert captha here",
            response: gcaptcha
        }}, (err, res, body) => {
            try {
                if (err) resolve(false)
                resolve(body.success)
            } catch {resolve(false)}
        })
    })
}
/* this is disable for no account expect the bot
app.post("/api/register", async (req, res) => {

    var yeah = req.body.email && req.body.username && req.body.password

    if (!yeah) return res.status(400).json({
        error: `Missing '${[req.body.email ? null : "email", req.body.username ? null : "username", req.body.password ? null : "password",  
        //req.body.captcha ? null : "captcha"
        ].filter(x => x != null).join(", ")}' field(s).`,
        errorCode: "dev.cloudfn.id.register.invalid_fields",
        statusCode: 400
    })

    /*
    var bIsVirgin = await virginSlayerv2(req.body.captcha)
    if (!bIsVirgin) return res.status(400).json({
        error: "Recaptcha response is invalid.",
        errorCode: "dev.cloudfn.id.register.invalid_captcha",
        statusCode: 400
    })
    

    if (req.body.username.length > 32 || req.body.email.length > 50) return res.status(400).json({
        error: `Field '${req.body.username.length > 32 ? "Username" : "Email"}' is too big.`,
        errorCode: `dev.cloudfn.id.register.${req.body.username.length > 32 ? "username" : "email"}_too_big`,
        statusCode: 400
    })

    var check1 = await User.findOne({displayName: new RegExp(`^${req.body.username}$`, 'i')}).lean().catch(e => next(e))
    var check2 = await User.findOne({email: new RegExp(`^${req.body.email}$`, 'i')}).lean().catch(e => next(e))

    if (check1 != null || check2 != null) return res.status(400).json({
        error: `${check2 != null ? "Email" : "Username"} '${check2 != null ? req.body.email : req.body.username}' already exists`,
        errorCode: `dev.cloudfn.id.register.${check2 != null ? "email" : "username"}_already_exists`,
        statusCode: 400
    })

    /*
    var ip = req.headers["x-real-ip"] || req.ip
    if (ip.substr(0, 7) == "::ffff:") ip = ip.substr(7)

    var check3 = await User.find({ip: ip})

    if (check3.length >= 3) return res.status(400).json({
        error: `Too many accounts have been created under your IP.`,
        errorCode: `dev.cloudfn.id.register.account_limit_reached`,
        statusCode: 400
    })
    
   
    var id = crypto.randomBytes(16).toString('hex')

    var user = new User({id: id,displayName: req.body.username, email: req.body.email, password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10))})
    user.save()
    var friends = new Friends({id: id})
    friends.save()
    var commoncore = new CommonCore({id: id})
    commoncore.save()
    var athena = new Athena({id: id})
    athena.save()

    logging.accounts(`Created account \x1b[36m${req.body.username}\x1b[0m with the ID \x1b[36m${id}`)
})*/
app.get("/api/epicdomains/ssodomains", (req, res) => res.json([]))

app.post("/api/login", async (req, res) => {
    var bIsValid = req.body.email && req.body.password

    if (!bIsValid) return res.status(400).json({
        error: `Missing '${[req.body.email ? null : "email", req.body.password ? null : "password"].filter(x => x != null).join(", ")}`,
        errorCode: "dev.cloudfn.id.login.invalid_fields",
        statusCode: 400
    })

    var check = await User.findOne({email: new RegExp(`^${req.body.email}$`, 'i')}).lean()

    if (check) {
        if (bcrypt.compareSync(req.body.password, check.password)) {
            var token = crypto.randomBytes(16).toString("hex")
            tokens[check.id] = token

            res.cookie("ClOUD_ID", check.id)
            res.cookie("ClOUD_TOKEN", token)

            if (req.query.redirect) res.redirect("/login")
            else res.json({
                status: "success",
                access_token: token,
                account_id: check.id,
                statusCode: 200
            })
        } else return res.status(401).json({
            status: "failed",
            error: `Incorrect password for the account '${req.body.email}'.`,
            errorCode: "dev.cloudfn.id.login.password_incorrect",
            statusCode: 401
        })
    } else return res.status(404).json({
        status: "failed", // for the launcher ig
        error: `Account under the email '${req.body.email} not found.`,
        errorCode: "dev.cloudfn.id.login.account_not_found",
        statusCode: 404
    })
    
})

app.get("/api/me", async (req, res) => {
    var bIsValid = req.cookies["ClOUD_ID"] && req.cookies["ClOUD_TOKEN"]
    if (!bIsValid) return res.status(400).json({
        error: `Missing cookies '${[req.cookies["ClOUD_ID"] ? null : "ClOUD_ID", req.cookies["ClOUD_TOKEN"] ? null : "ClOUD_TOKEN"].filter(x => x != null).join(", ")}'.`,
        errorCode: "dev.cloudfn.id.me.invalid_fields",
        statusCode: 400
    })

    if (tokens[req.cookies["ClOUD_ID"]] == req.cookies["ClOUD_TOKEN"]) {
        var user = await User.findOne({id: req.cookies["ClOUD_ID"]}).lean()
        var athena = await Athena.findOne({id: req.cookies["ClOUD_ID"]}).lean()
        var commoncore = await CommonCore.findOne({id: req.cookies["ClOUD_ID"]}).lean()

        res.json({
            id: req.cookies["ClOUD_ID"],
            displayName: user.displayName,
            email: user.email,
            athena: {
                stage: athena.stage,
                level: athena.level
            },
            commoncore: {
                vbucks: commoncore.vbucks
            },
            misc: {
                allowsGifts: user.allowsGifts
            }           
        })
    } else return res.status(401).json({
        error: `Invalid auth token '${req.cookies["ClOUD_TOKEN"]}'.`,
        errorCode: "dev.cloudfn.id.me.invalid_auth_token",
        statusCode: 401
    })
})

app.get("/api/kill", (req, res) => {
    if (tokens[req.cookies["ClOUD_ID"]] == req.cookies["ClOUD_TOKEN"]) delete tokens[req.cookies["ClOUD_ID"]]
    res.clearCookie("ClOUD_ID")
    res.clearCookie("ClOUD_TOKEN")

    if (req.query.redirect) res.redirect("/login")
    else res.status(204).end()
})

app.post("/api/update", async (req, res) => {
    
    var bIsValid = req.cookies["ClOUD_ID"] && req.cookies["ClOUD_TOKEN"]

    if (!bIsValid) return res.status(400).json({
        error: `Missing cookies '${[req.cookies["ClOUD_ID"] ? null : "ClOUD_ID", req.cookies["ClOUD_TOKEN"] ? null : "ClOUD_TOKEN"].filter(x => x != null).join(", ")}'.`,
        errorCode: "dev.cloudfn.id.update.invalid_fields",
        statusCode: 400
    })

    if (tokens[req.cookies["ClOUD_ID"]] != req.cookies["ClOUD_TOKEN"]) return res.status(401).json({
        error: `Invalid auth token '${req.cookies["ClOUD_TOKEN"]}'.`,
        errorCode: "dev.cloudfn.id.me.invalid_auth_token",
        statusCode: 401
    })

    var pattern = new RegExp('^[0-9]+$')
    var stages = JSON.parse(fs.readFileSync(`${__dirname}/../public/files/stages.json`))

    var updated = {}

    if (req.body.level) {
        if (pattern.test(req.body.level)) {
            await Athena.updateOne({id: req.cookies["ClOUD_ID"]}, {level: Number(req.body.level) > 9999 ? 9999 : Number(req.body.level)})
            updated["level"] = Number(req.body.level) > 9999 ? 9999 : Number(req.body.level)
        } 
    }

    if (req.body.vbucks) {
        if (pattern.test(req.body.vbucks)) {
            await CommonCore.updateOne({id: req.cookies["ClOUD_ID"]}, {vbucks: Number(req.body.vbucks) > 2147483647 ? 2147483647 : Number(req.body.vbucks)})
            updated["vbucks"] =  Number(req.body.vbucks) > 2147483647 ? 2147483647 : Number(req.body.vbucks)
        } 
    }

    if (req.body.stage) {
        if (stages[req.body.stage]) {
            var yes = await Athena.updateOne({id: req.cookies["ClOUD_ID"]}, {stage: req.body.stage})
            updated["stage"] = req.body.stage
        } else {
            return res.status(400).json({
                error: `Invalid stage '${req.body.stage}'. Valid stages are [${Object.keys(stages).join(", ")}].`,
                errorCode: "dev.cloudfn.id.update.invalid_stage",
                statusCode: 400
            })
        }
    }

    if (req.body.allowsGifts != undefined) {
        if (req.body.allowsGifts == true) {
            await User.updateOne({id: req.cookies["ClOUD_ID"]}, {allowsGifts: true})
            updated.allowsGifts = true
        } else if (req.body.allowsGifts == false) {
            await User.updateOne({id: req.cookies["ClOUD_ID"]}, {allowsGifts: false})
            updated.allowsGifts = false
        }
    }

    res.json({
        updated: updated,
        statusCode: 200
    })
})

app.post("/api/gifts", async (req, res) => {
    var bIsValid = req.cookies["ClOUD_ID"] && req.cookies["ClOUD_TOKEN"]

    if (!bIsValid) return res.status(400).json({
        error: `Missing cookies '${[req.cookies["ClOUD_ID"] ? null : "ClOUD_ID", req.cookies["ClOUD_TOKEN"] ? null : "ClOUD_TOKEN"].filter(x => x != null).join(", ")}'.`,
        errorCode: "dev.cloudfn.id.update.invalid_fields",
        statusCode: 400
    })

    if (tokens[req.cookies["ClOUD_ID"]] != req.cookies["ClOUD_TOKEN"]) return res.status(401).json({
        error: `Invalid auth token '${req.cookies["ClOUD_TOKEN"]}'.`,
        errorCode: "dev.cloudfn.id.me.invalid_auth_token",
        statusCode: 401
    })

    var bIsValid = req.body.item && req.body.to && req.body.box

    if (!bIsValid) return res.status(400).json({
        error: `Missing fields '${[
            req.body.item ? null : "item", 
            req.body.to ? null : "to", 
            req.body.box ? null : "box", 
        ].filter(x => x != null).join(", ")}'.`,
        errorCode: "dev.cloudfn.id.gift.invalid_fields",
        statusCode: 400
    })

    var giftboxes = JSON.parse(fs.readFileSync(`${__dirname}/../public/files/giftboxes.json`))
    if (!giftboxes[req.body.box]) return res.status(404).json({
        error: `Giftbox '${req.body.box}' not found.`,
        errorCode: "dev.cloudfn.id.gift.giftbox_not_found",
        statusCode: 404
    })

    var cosmetics = caching.getCosmetics()
    if (!cosmetics.find(x => x.name.toLowerCase().includes(req.body.item.toLowerCase()))) return res.status(404).json({
        error: `Cosmetic '${req.body.item}' not found.`,
        errorCode: "dev.cloudfn.id.gift.cosmetic_not_found",
        statusCode: 404
    })

    var cosmetic = cosmetics.find(x => x.name.toLowerCase().includes(req.body.item.toLowerCase()))

    var user = await User.findOne({displayName: new RegExp(`^${req.body.to}$`, 'i')}).lean()
    if (!user) return res.status(404).json({
        error: `Account under the username '${req.body.to} not found.`,
        errorCode: "dev.cloudfn.id.gift.account_not_found",
        statusCode: 404
    })

    if (!user.allowsGifts) return res.status(404).json({
        error: `Account has gifting disabled.`,
        errorCode: "dev.cloudfn.id.gift.account_gifting_disabled",
        statusCode: 404
    })

    if (req.cookies["ClOUD_ID"] != user.id) {
        var friends = await Friends.findOne({id: user.id}).lean()

        if(!friends.accepted.find(x => x.id == req.cookies["ClOUD_ID"])) return res.status(404).json({
            error: `Friendship between '${req.cookies["ClOUD_ID"]}' and '${req.body.to}' does not exist.`,
            errorCode: "dev.cloudfn.id.gift.friendship_not_found",
            statusCode: 404
        })
    }

    var commoncore = await CommonCore.findOne({id: user.id}).lean()
    if (commoncore.gifts.length >= 3) return res.status(409).json({
        error: `Account '${user.id}' has too many gifts.`,
        errorCode: "dev.cloudfn.id.gift.account_too_many_gifts",
        statusCode: 409
    })

    await CommonCore.updateOne({id: user.id}, {$push: {gifts: {
        from: req.cookies["ClOUD_ID"],
        id: uuid(),
        box: req.body.box,
        items: [
            {
                id: `${cosmetic.backendType}:${cosmetic.id.toLowerCase()}`,
                profile: cosmetic.backendType.includes("Athena") ? "athena" : "common_core",
                quantity: req.body.quantity || 1
            }
        ],
        giftedAt: new Date(),
        message: req.body.message || ""
    }}})

    if (xmppClients[user.id]) xmppClients[user.id].client.sendMessage("xmpp-admin@prod.ol.epicgames.com", JSON.stringify({
        type: "com.epicgames.gift.received",
        payload: "",
        timestamp: new Date()
    }))

    res.status(204).end()
})


app.delete("/api/gifts", async (req, res) => {
    var bIsValid = req.cookies["ClOUD_ID"] && req.cookies["ClOUD_TOKEN"]

    if (!bIsValid) return res.status(400).json({
        error: `Missing cookies '${[req.cookies["ClOUD_ID"] ? null : "ClOUD_ID", req.cookies["ClOUD_TOKEN"] ? null : "ClOUD_TOKEN"].filter(x => x != null).join(", ")}'.`,
        errorCode: "dev.cloudfn.id.update.invalid_fields",
        statusCode: 400
    })

    if (tokens[req.cookies["ClOUD_ID"]] != req.cookies["ClOUD_TOKEN"]) return res.status(401).json({
        error: `Invalid auth token '${req.cookies["ClOUD_TOKEN"]}'.`,
        errorCode: "dev.cloudfn.id.me.invalid_auth_token",
        statusCode: 401
    })

    var yes = await CommonCore.updateOne({id: req.cookies["ClOUD_ID"]}, {$set: {gifts: []}})
    res.status(204).end()
})


app.get("/api/parties", (req, res) => {
    res.setHeader("content-type", "text/plain")
    res.send(parties.length.toString())
})

app.get("/api/clients", (req, res) => {
    res.setHeader("content-type", "text/plain")
    res.send(Object.keys(xmppClients).length.toString())
})


module.exports = app
