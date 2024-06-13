const puppeteer = require('puppeteer')
const config = require('../config');
const { getServerName, getChannelName } = require('./utils');
async function run(data) {
    console.log("started shitt")
    try {
        const browser = await puppeteer.launch({ headless: true, timeout: 300000000, args: ['--disable-features=site-per-process'] });
        const page = await browser.newPage();
        await page.setBypassCSP(true)
        await page.setViewport({ width: 1200, height: 720 });
        await page.goto(`https://discord.com/channels/${data.target_server_id}/${data.target_channel_id}`, { waitUntil: 'networkidle0' }); // wait until page load
        // await page.click(".marginTop8__7da6c")
        // page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000000 })
        await page.waitForSelector('#uid_7')
        await page.type('#uid_7', config.email);
        await page.type('#uid_9', config.password);
        await page.click('.button__5573c', { delay: 1000 });
        await page.click('.button__5573c');
        // click and wait for navigation
        await Promise.all([
            page.click('.button__5573c'),
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 300000000 }),
        ]);
        const outside_data = {
            tg_bot: config.telegram_bot_id,
            tg_chat: config.telegram_chat_id,
            target_nickname: data.target_nickname,
            server_id: data.target_server_id,
            channel_id: data.target_channel_id,
            server_name: await getServerName(data.target_server_id),
            channel_name: await getChannelName(data.target_channel_id)
        }
        await page.evaluate((outside_data) => {
            let last = undefined
            setInterval(() => {
                const element = document.querySelector(".text_eb454c")
                if (element) {
                    const data = element?.querySelector("strong").innerHTML
                    if (last !== data && data === outside_data.target_nickname) {
                        const message = data + " is typing in: " + outside_data.server_name + ": " + outside_data.channel_name
                        last = data
                        fetch(`https://api.telegram.org/bot${outside_data.tg_bot}/sendMessage`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                "chat_id": outside_data.tg_chat,
                                "text": message
                            })
                        });
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