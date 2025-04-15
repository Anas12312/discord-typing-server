const fs = require('fs')
const run = require('./typing')
let states = []
let activeServers = []
let activeChannels = []
let activeUsernames = []
function refresh() {
    console.log(states)
    activeServers = states.filter(s => s.active === true).map(s => s.target_server_id)
    activeChannels = states.filter(s => s.active === true).map(s => s.target_channel_id)
    activeUsernames = states.filter(s => s.active === true).map(s => s.target_username)
    console.log("active servers:" + activeServers)
    console.log("active channels:" + activeChannels)
    console.log("active users:" + activeUsernames)

    for (let s in states) {
        states[s].id = s
    }

    saveData()

}
async function loadData() {
    const data = fs.readFileSync('./data.txt')
    states = JSON.parse(data)
    for (let state of states) {
        if (state.active) {
            console.log("activating old...")
            const browser = await run(getAllStates()[state.id]);
            setStateBrowser(state.id, browser)
        }
    }
    refresh()
}
function saveData() {
    fs.writeFileSync('./data.txt', JSON.stringify(states))
}
function pushNewState(data) {
    data.id = states.length
    states.push(data)
    refresh()
}
function activate(id) {
    if (!states[id]) return false

    states[id].active = true
    refresh()
    return true
}
function deactivate(id) {
    if (!states[id]) return false

    states[id].active = false
    if (states[id].browser) {
        console.log("ha2fel")
        states[id].browser.close()
    }
    states[id].browser = undefined
    refresh()
    return true
}
function setStateBrowser(id, browser) {
    states[id].browser = browser
}
function deleteState(id) {
    if (!states[id]) return false

    deactivate(id)
    states.splice(id, 1)
    refresh()
    return true
}
function getState(server_id, channel_id, author) {
    return states.filter((s) => {
        return s.target_server_id === server_id && s.target_channel_id === channel_id && s.target_username === author && s.active
    })[0]
}
const getAllStates = () => states
const getActiveServers = () => activeServers
const getActiveChannels = () => activeChannels
const getActiveUsernames = () => activeUsernames
module.exports = {
    getAllStates,
    getActiveServers,
    getActiveChannels,
    getActiveUsernames,
    pushNewState,
    setStateBrowser,
    activate,
    deactivate,
    deleteState,
    getState,
    loadData
}