const puppeteer = require('puppeteer');

(async () => {
    // setup puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const myanimePage = await browser.newPage();
    var pages = [];
    var broadcasts = [];
    var animeEntries = [];
    var englishTitles = [];

    // myanimeList data
    const listUrl = 'https://myanimelist.net/animelist/Spoochy?status=1';
    await myanimePage.goto(listUrl, { waitUntil: 'networkidle2' });
    let myanimeListData = await myanimePage.evaluate(scrapeMyanimeList);

    // anime pages
    for (let i = 0; i < myanimeListData.animeListUrls.length; i++) {
        pages[i] = await browser.newPage();
        pages[i].goto(`https://myanimelist.net${myanimeListData.animeListUrls[i]}`, { waitUntil: 'networkidle2' });

        let tabs = await browser.pages();
        if (i === 0) { await pages[i].bringToFront(); }
        await pages[i].waitForNavigation({ waitUntil: 'networkidle0' });

        let broadcast = await pages[i].evaluate(() => {
            let broadcastData = document.querySelector('.page-common #contentWrapper #content table h2:nth-of-type(2)+div+div+div+div+div+div').innerHTML.toString();
            broadcastData = broadcastData.split("</span>").pop().substr(3).slice(0, -2);

            let englishTitle = 'null';

            if (document.querySelector('.page-common .h1 .title-english')) {
                englishTitle = document.querySelector('.page-common .h1 .title-english').innerHTML
            }

            return {
                broadcastData,
                englishTitle
            };
        });

        broadcasts.push(broadcast.broadcastData);
        englishTitles.push(broadcast.englishTitle);

        await tabs[i + 1].bringToFront();
    }

    for (let i = 0; i < myanimeListData.animeListTitles.length; i++) {
        animeEntries[i] = {
            Name: myanimeListData.animeListTitles[i],
            English: englishTitles[i],
            Broadcast: broadcasts[i]
        }
    }

    await browser.close();
})();

function scrapeMyanimeList() {
    let animeListTitles = [];
    let animeListUrls = [];

    let entries = document.querySelectorAll('.list-table .list-table-data .data.title .link');
    entries.forEach(entry => {
        animeListTitles.push(entry.innerHTML);
        animeListUrls.push(entry.getAttribute('href'));
    });
    return {
        animeListTitles,
        animeListUrls
    }
}