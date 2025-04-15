const { WebSocket } = require("ws");
const config = require('../config');
const { getActiveServers, getActiveChannels, getActiveUsernames, getState } = require("./states");
const { getServerName, getChannelName } = require("./utils");
const token = config.token
let ws;
const initialUrl = "wss://gateway-us-east1-b.discord.gg"
let url = initialUrl, sessionId = "";
let interval = 0, seq = -1;
function send(message, bot_token, chat_id) {
    console.log(bot_token, chat_id)
    fetch(`https://api.telegram.org/bot${bot_token}/sendMessage`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "chat_id": chat_id,
            "text": message
        })
    });
}
let payload = {
    op: 2,
    d: {
        token,
        intents: 1 << 11 | 1 << 12 | 1 << 13 | 1 << 1 | 1 << 9 | 1 << 15 | 1 << 14,
        properties: {
            os: "windows",
            browser: "chrome",
            device: "chrome"
        }
    }

}
const heartbeat = (ms) => {
    return setInterval(() => {
        ws.send(JSON.stringify({ op: 1, d: null }))
    }, ms)
}
const initWS = () => {
    if (ws && ws.readyState !== 3) ws.close();

    let wasReady = false
    if (!url) url = initialUrl

    ws = new WebSocket(url + "/?encoding=json&v=9")

    ws.on("open", function open() {
        if (url !== initialUrl) {
            const resumePayload = {
                op: 6,
                d: {
                    token,
                    sessionId,
                    seq
                }
            }

            ws.send(JSON.stringify(resumePayload))
        }
    })

    ws.on("error", function error(e) {
        console.log(e)
    })

    ws.on("close", function close() {
        if (wasReady) console.log("Gateway Connection Closed!")

        setTimeout(() => {
            initWS();
        }, 2500)
    })

    ws.on("message", async function incoming(data) {
        let p = JSON.parse(data)
        // console.log(p)
        const { t, op, d, s } = p;

        switch (op) {
            case 10:
                const { heartbeat_interval } = d;
                interval = heartbeat(heartbeat_interval);
                wasReady = true;

                if (url === initialUrl) ws.send(JSON.stringify(payload))
                break;
            case 0:
                seq = s;
                break;
        }
        console.log("T: " + t)
        switch (t) {
            case "READY":
                console.log("Gateway Connection Ready!")
                url = d.resume_gatway_url
                sessionId = d.session_id
                break
            case "RESUMED":
                console.log("Gateway Connection Resumed!")
                break;
            case "MESSAGE_CREATE":
                let author = d.author.username
                let content = d.content
                let channel_id = d.channel_id
                let server_id = d.guild_id
                console.log(server_id + " : " + channel_id + " : " + author)
                console.log(getActiveUsernames())
                console.log(getActiveServers(), getActiveChannels(), getActiveUsernames(), server_id, channel_id, author)
                if(getActiveServers().includes(server_id) && getActiveChannels().includes(channel_id) && getActiveUsernames().includes(author)) {
                    console.log("anaaaaa")
                    const data = getState(server_id, channel_id, author)
                    console.log(data)
                    if(data) {
                        const message = author + ` has sent the following message:\n${content}\n in server: ${await getServerName(server_id)}, channel: ${await getChannelName(channel_id)}`  + "\n click: " + `https://discord.com/channels/${data.server_id}/${data.channel_id}`
                        send(message, data.bot_token, data.chat_id);
                    }
                }
                break;
        }
    })
}

module.exports = initWS