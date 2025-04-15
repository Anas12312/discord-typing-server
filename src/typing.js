const puppeteer = require('puppeteer')
const config = require('../config');
const { getServerName, getChannelName } = require('./utils');
async function run(data) {
    console.log("started shitt")
    try {
        const browser = await puppeteer.launch({ headless: false, timeout: 300000000, args: ['--disable-features=site-per-process'] });
        const page = await browser.newPage();
        await page.setBypassCSP(true)
        await page.setViewport({ width: 1200, height: 720 });
        await page.goto(`https://discord.com/channels/${data.target_server_id}/${data.target_channel_id}`, { waitUntil: 'networkidle0' }); // wait until page load
        try {
            const browserBtn = (await page.$$('button'))[1]
            await browserBtn.click({
                delay: 100
            })
            await browserBtn.click({
                delay: 100
            })
        }catch {

        }
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000000 })
        await page.waitForSelector('#uid_32')
        await page.type('#uid_32', config.email);
        await page.type('#uid_34', config.password);
        const loginBtn = (await page.$$('button'))[1]
        console.log(loginBtn)
        try {
            await loginBtn.click({
                delay: 1000
            })
            await loginBtn.click({
                delay: 1000
            })
        } catch(e) {

        }     
        const outside_data = {
            tg_bot: data.bot_token,
            tg_chat: data.chat_id,
            target_nickname: data.target_nickname,
            server_id: data.target_server_id,
            channel_id: data.target_channel_id,
            server_name: await getServerName(data.target_server_id),
            channel_name: await getChannelName(data.target_channel_id)
        }
        await page.exposeFunction('sendTelegramMessage', async (message, botToken, chatId) => {
            console.log(message, botToken, chatId)
            try {
                const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "chat_id": chatId,
                        "text": message
                    })
                });
                return await response.json();
            } catch (error) {
                console.error('Error sending Telegram message:', error);
                return { error: error.message };
            }
        });
        await page.evaluate((outside_data) => {
            let last = undefined
            setInterval(() => {
                const form = document.querySelectorAll('form')
                console.log(form)
                console.log("aaa")
                const element = form[0]?.querySelector("strong")
                console.log(element)
                if (element) {
                    const data = element?.innerHTML
                    console.log(data, outside_data.target_nickname, last)
                    if (last !== data && data === outside_data.target_nickname) {
                        const message = data + " is typing in: " + outside_data.server_name + ": " + outside_data.channel_name + "\n click: " + `https://discord.com/channels/${outside_data.server_id}/${outside_data.channel_id}`
                        last = data
                        console.log("hab3at")
                        window.sendTelegramMessage(message, outside_data.tg_bot, outside_data.tg_chat)
                          .then(result => console.log('Telegram API response:', result))
                          .catch(err => console.error('Failed to send message:', err));
                    }
                } else {
                    last = undefined
                }
            }, 2000)
        }, outside_data)
        return browser;
    }catch(e) {
        throw e
    }
}

module.exports = run