const config = require("../config")

function checkIfExists(newState, states) {
    const exists = states.filter((state, index) => {
        return (state.target_url === newState.target_url &&  state.target_nickname === newState.target_nickname &&  state.target_username === newState.target_username)
    })
    return exists.length
}

function getIdsFromUrl(url) {
    const tokens = url.split('/')
    return {
        target_server_id: tokens[4],
        target_channel_id: tokens[5]
    }
}
async function getServerName(server_id) {
    const response = await fetch(`https://discord.com/api/v10/guilds/${server_id}`, {
        headers: {
            'Authorization': config.token 
        }
    });
    if (!response.ok) {
        return
        // throw new Error(`HTTP error! status: ${response.status}`);
    }

    const guild = await response.json();
    console.log(guild.name)
    return guild.name
}
async function getChannelName(channel_id) {
    const response = await fetch(`https://discord.com/api/v10/channels/${channel_id}`, {
        headers: {
            'Authorization': config.token 
        }
    });
    if (!response.ok) {
        return
        // throw new Error(`HTTP error! status: ${response.status}`);
    }

    const channel = await response.json();
    console.log(channel.name)
    return channel.name
}
module.exports = {
    checkIfExists,
    getIdsFromUrl,
    getServerName,
    getChannelName
}