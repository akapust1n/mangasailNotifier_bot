const cloudscraper = require('cloudscraper');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

const $ = jQuery = require('jquery')(window);
const Telegraf = require('telegraf')
const fs = require('fs');
//---------------------------------------

//global vars
const token = fs.readFileSync('token', 'utf8');
const telegramId = fs.readFileSync('telegramId', 'utf8');
//slow access
let chapterStore =
{
    "https://www.mangasail.co/content/one-punch-man": "",
    "https://www.mangasail.co/content/tower-god-manga": "",
    "https://www.mangasail.co/content/made-abyss": "",
    "https://www.mangasail.co/content/one-piece-manga": "",
    "https://www.mangasail.co/content/hunter-x-hunter-manga": "",
}

//bot -----------------
const bot = new Telegraf(token)

bot.start((ctx) => ctx.reply('Welcome!'))
bot.hears('hi', (ctx) => { ctx.reply(chapterStore); })
bot.launch();

//main logic ----------------------
function extractChapter(manga, htmlPage) {
    const elements = $(htmlPage);
    const listOfChapters = elements.find('tbody').html();
    if (listOfChapters == undefined) {
        console.log("cant find chapters");
        return;
    }
    const lastChapter = listOfChapters.split('\n').filter(chapterStr => chapterStr.length > 5)[0];

    if (lastChapter == undefined) {
        console.log("cant find last chapter");
        return;
    }
    const cleanText = lastChapter.replace("</a>", " || ").replace(/<\/?[^>]+(>|$)/g, "");
    if (cleanText == undefined) {
        console.log("cant find cleanText");
        return;
    }
    const oldChapter = chapterStore[manga];
    if (oldChapter > 0 && oldChapter != cleanText) {
        bot.telegram.sendMessage(telegramId, cleanText);
    }
    else {
        chapterStore[manga] = cleanText;
    }
}


function poll() {
    for (let key in chapterStore) {
        const extractChapterBinded = extractChapter.bind(null, key);
        cloudscraper.get(key).then(extractChapterBinded, console.error);
    }
    setTimeout(poll, 5000);
}

poll();
