
const express = require('express')
const { checkIfExists, getIdsFromUrl, getServerName, getChannelName } = require('./utils')
const { getAllStates, pushNewState, activate, setStateBrowser, deactivate, deleteState } = require('./states')
const initWS = require('./messages')
const run = require('./typing')
const app = express()
const cors = require('cors')
app.use(cors())
app.use(express.json())
app.get("/", (req, res) => {
    res.send("Hello World!")
})
app.get("/current", (req, res) => {
    res.send(getAllStates())
})
app.post("/add", async (req, res) => {
    const { target_nickname, target_username, target_url } = req.body
    if (!target_nickname || !target_username || !target_url) return res.status(400).send({
        message: "Target Information missing"
    })

    const { target_server_id, target_channel_id } = getIdsFromUrl(target_url)
    if (!target_server_id || !target_channel_id) return res.status(400).send({
        message: "Not a valid URL"
    })

    const data = {
        target_nickname,
        target_username,
        target_server_id,
        target_channel_id,
        target_url,
        target_server_name: await getServerName(target_server_id),
        target_channel_name: await getChannelName(target_channel_id),
        active: false
    }

    const states = getAllStates()
    if (checkIfExists(data, states)) return res.status(400).send({
        message: "Already exists"
    })

    pushNewState(data)

    res.send({
        message: "Added successfully"
    })
})
app.post('/activate/:id', async (req, res) => {
    const id = req.params.id
    const result = activate(id);
    if(!result) return res.status(400).send({
        message: "this id doesn't exist"
    })

    try {
        res.send({
            message: "Started Tracking..."
        })
        const browser = await run(getAllStates()[id]);
        setStateBrowser(id, browser)
    } catch(e) {
        console.log(e)
        deactivate(id);
    }
})

app.post('/deactivate/:id', async (req, res) => {
    const id = req.params.id
    const result = deactivate(id);
    if(!result) return res.status(400).send({
        message: "this id doesn't exist"
    })

    res.send({
        message: "Deactivated"
    })
})
app.delete('/rm/:id', (req, res) => {
    const id = req.params.id
    const result = deleteState(id);
    if(!result) return res.status(400).send({
        message: "this id doesn't exist"
    })

    res.send({
        message: "Deleted"
    })
})
app.listen(3000, () => {
    initWS()
    console.log("Server is up and running on port: 3000")
})