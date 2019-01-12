"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cheerio = require("cheerio");
var baseUrl = "https://www.animenewsnetwork.com";
var EncyclopediaSearchName = /** @class */ (function () {
    function EncyclopediaSearchName(page) {
        this.anime = [];
        this.manga = [];
        var $ = cheerio.load(page);
        var thiss = this;
        $('#content-zone > div > a[href]').each(function (i, el) {
            var ref = $(el).attr('href');
            var title = $(el).text();
            if (ref && title) {
                if (ref.match(/\/anime.php/))
                    thiss.anime.push({ ref: baseUrl + ref, title: title });
                else if (ref.match(/\/manga.php/))
                    thiss.manga.push({ ref: baseUrl + ref, title: title });
            }
        });
    }
    return EncyclopediaSearchName;
}());
exports.EncyclopediaSearchName = EncyclopediaSearchName;
var EncyclopediaAnime = /** @class */ (function () {
    function EncyclopediaAnime(page) {
        this.d_genre = [];
        this.d_altTitles = [];
        var $ = cheerio.load(page);
        this.d_mainTitle = ($('#page-title > #page_header').text() || "")
            .replace(/\([a-zA-Z]*\)/, "").trim();
        this.d_genre = $('#infotype-30 > span > a').map(function (i, el) {
            return $(this).text();
        }).get();
        this.d_altTitles = $('div > #infotype-2 > div').map(function (i, el) {
            return $(this).text();
        }).get();
        var ps = $('#infotype-12 > span').text();
        if (ps)
            this.d_plotSummary = ps;
        var _sel = $('#infotype-7 > span').text();
        var _dat = _sel.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}/);
        if (_dat && _dat.length) {
            var date = _dat[0].split('-');
            if (!date[0] || date[0].length === 4) {
                this.d_dateReleased = new Date(+date[0], +(date[1] || '1') - 1, +(date[2] || '1'));
            }
        }
        var _epLink = $('#infotype-25 > a').attr('href');
        if (_epLink)
            this.d_episodesLink = baseUrl + _epLink;
    }
    return EncyclopediaAnime;
}());
exports.EncyclopediaAnime = EncyclopediaAnime;
var EncyclopediaAnimeEpisodes = /** @class */ (function () {
    function EncyclopediaAnimeEpisodes(page) {
        this.d_episodes = [];
        var $ = cheerio.load(page);
        var thiss = this;
        $('.episode-list > tbody > tr').each(function (i, el) {
            var title = $(el).find('td:nth-child(5) > div:first-child').text();
            var _num = ($(el).find('td:nth-child(3)').text() || "").match(/[0-9]+/);
            var num = _num && _num[0] && +_num[0] || null;
            if (title && num !== null)
                thiss.d_episodes.push({ title: title, num: num });
        });
    }
    return EncyclopediaAnimeEpisodes;
}());
exports.EncyclopediaAnimeEpisodes = EncyclopediaAnimeEpisodes;
//# sourceMappingURL=EncyclopediaSearchName.js.map