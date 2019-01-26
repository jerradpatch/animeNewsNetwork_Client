"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var convert = require("xml-js");
var bottleneck_1 = require("bottleneck");
var reqProm = require("request-promise");
var internal_compatibility_1 = require("rxjs/internal-compatibility");
var operators_1 = require("rxjs/operators");
var rxjs_1 = require("rxjs");
var random_useragent = require("random-useragent");
var EncyclopediaSearchName_1 = require("./pageObjects/EncyclopediaSearchName");
var ANN_Client = /** @class */ (function () {
    function ANN_Client(ops) {
        this.ops = ops;
        this.reportsUrl = 'https://www.animenewsnetwork.com/encyclopedia/reports.xml?';
        this.detailsUrl = 'https://cdn.animenewsnetwork.com/encyclopedia/nodelay.api.xml?';
        this.clientId = Math.floor((Math.random() * 10000));
        //needed since searches on this url return more data for anime
        this.encyclopediaSearchAnimeUrl = "https://www.animenewsnetwork.com/encyclopedia/search/name?only=anime&q=";
        this.ops = Object.assign({}, { apiBackOff: 10, useDerivedValues: true }, ops);
        this.limiter = new bottleneck_1.default({
            maxConcurrent: 1,
            minTime: ops.apiBackOff * 1000
        });
    }
    ANN_Client.prototype.request = function (url) {
        var _this = this;
        return rxjs_1.defer(function () { return internal_compatibility_1.fromPromise((_this.ops.requestFn && _this.ops.requestFn(url)) || request.call(_this, url)); }).pipe(operators_1.retry(5))
            .toPromise();
        function request(uri) {
            var _this = this;
            return this.limiter.schedule(function () {
                //when the actual call is made
                if (_this.ops.debug) {
                    var cTime = new Date();
                    console.log('ann_client', 'request', 'id:', _this.clientId, 'Date:', cTime, 'Elapsed Sec:', Math.floor(Date.now() / 1000), 'url:', url);
                }
                //api generates infinite redirect loops when the user agent is not defined ??
                var userAStr = random_useragent.getRandom();
                return reqProm({
                    maxRedirects: '10',
                    followRedirect: true,
                    headers: {
                        'user-agent': userAStr
                    },
                    uri: encodeURI(uri)
                });
            });
        }
    };
    ANN_Client.prototype.parse = function (xmlPage) {
        var ret = convert.xml2js(xmlPage || "", { compact: true, alwaysArray: true, trim: true, nativeType: true });
        return ret.ann && ret.ann[0] || {};
    };
    ANN_Client.prototype.parseSearchPageTitles = function (titles) {
        var _this = this;
        return Promise.all(titles.map(function (title) { return _this.parseSearchPage(title); }))
            .then(function (titleResults) {
            7;
            return titleResults.reduce(function (acc, _a) {
                var anime = _a.anime, manga = _a.manga;
                acc['anime'] = (acc['anime'] || []).concat(anime);
                acc['manga'] = (acc['manga'] || []).concat(manga);
                return acc;
            });
        });
    };
    ANN_Client.prototype.parseSearchPage = function (title) {
        var _this = this;
        var url = this.encyclopediaSearchAnimeUrl;
        return this.request(url + title)
            .then(function (searchPage) {
            var encPageModel = new EncyclopediaSearchName_1.EncyclopediaSearchName(searchPage);
            var anime = requestUrls.call(_this, encPageModel.anime);
            var manga = requestUrls.call(_this, encPageModel.manga);
            return Promise.all([anime, manga]);
        }).then(function (_a) {
            var anime = _a[0], manga = _a[1];
            return { anime: anime, manga: manga };
        });
        function requestUrls(urls) {
            var thiss = this;
            return Promise.all(urls
                .map(function (mod) { return mod.ref; })
                .filter(function (url) { return !!url; })
                .map(function (url) { return thiss.request(url)
                .then(function (page) {
                var aniPageModel = new EncyclopediaSearchName_1.EncyclopediaAnime(page);
                // if(aniPageModel.d_episodesLink)
                //   return thiss.request(aniPageModel.d_episodesLink)
                //     .then(page=>{
                //       let epsList = new EncyclopediaAnimeEpisodes(page);
                //       delete aniPageModel.d_episodesLink;
                //       aniPageModel['d_episodes'] = epsList.d_episodes;
                //       return aniPageModel;
                //     });
                // else
                return aniPageModel;
            }); }));
        }
    };
    ANN_Client.prototype.findTitleWithId = function (id) {
        if (!id)
            return Promise.resolve({});
        var url = this.detailsUrl + 'title=' + id;
        var ret = this.request(url).then(this.parse.bind(this));
        if (this.ops.useDerivedValues)
            return ret.then(this.addDerivedValues.bind(this));
        return ret;
    };
    ANN_Client.prototype.findTitlesLike = function (titles) {
        var _this = this;
        if (this.ops.useDerivedValues && !this.ops.parseSearchPage) {
            var url = this.detailsUrl + 'title=~' + titles.join('&title=~');
            return this.request(url)
                .then(this.parse.bind(this))
                .then(this.addDerivedValues.bind(this));
        }
        else if (this.ops.useDerivedValues && this.ops.parseSearchPage) {
            return this.parseSearchPageTitles(titles).then(function (resultParse) {
                var mainTitles = ([].concat(resultParse.anime, resultParse.manga)).map(function (rp) { return rp.d_mainTitle; });
                var dedupMt = Array.from((new Set(mainTitles)));
                var url = _this.detailsUrl + 'title=~' + dedupMt.join('&title=~');
                return _this.request(url)
                    .then(_this.parse.bind(_this))
                    .then(_this.addDerivedValues.bind(_this));
            });
        }
        else {
            var url = this.detailsUrl + 'title=~' + titles.join('&title=~');
            return this.request(url).then(this.parse.bind(this));
        }
    };
    ANN_Client.prototype.addDerivedValues = function (ann) {
        var _this = this;
        if (ann.anime) {
            ann.anime.forEach(function (an) {
                if (an.info) {
                    an.d_genre = _this.getMany(an.info, 'Genres');
                    an.d_mainTitle = _this.getSingle(an.info, 'Main title');
                    an.d_plotSummary = _this.getSingle(an.info, 'Plot Summary');
                    var dr = _this.getDateReleased(an.info);
                    if (dr)
                        an.d_dateReleased = dr;
                }
                if (an.episode)
                    an.d_episodes = an.episode &&
                        an.episode.map(function (ep) {
                            var ret = {};
                            if (ep.title && ep.title[0]._text)
                                ret.title = ep.title[0]._text[0];
                            if (ep._attributes && ep._attributes.num)
                                ret.occurrence = +ep._attributes.num;
                            return ret;
                        }) || [];
            });
        }
        return Promise.resolve(ann);
    };
    ANN_Client.prototype.getDateReleased = function (info) {
        var permierDate = this.getMany(info, 'Premiere date');
        var vintages = this.getMany(info, 'Vintage');
        return vintages.concat(permierDate)
            .map(function (text) {
            return (text.toString().match(/[0-9]{4}(?:-[0-9]{2}-[0-9]{2}){0,1}/) || [])[0];
        })
            .filter(function (val) { return !!val; })
            .map(function (strDate) { return new Date(strDate); })
            .sort(function (a, b) { return a - b; })[0];
    };
    ANN_Client.prototype.getMany = function (info, key, retKey) {
        if (retKey === void 0) { retKey = ''; }
        return info
            .filter(function (val) { return val._attributes && val._attributes.type === key; })
            .map(function (gen) { return (gen._attributes[retKey] || gen['_text'][0]); }) || [];
    };
    ANN_Client.prototype.getSingle = function (info, key, retKey) {
        if (retKey === void 0) { retKey = ''; }
        var sing = info.filter(function (val) { return val._attributes && val._attributes.type === key; });
        if (sing.length && ((sing[0]._attributes && sing[0]._attributes[retKey]) || sing[0]['_text']))
            return sing[0]._attributes[retKey] || sing[0]['_text'][0];
    };
    return ANN_Client;
}());
exports.ANN_Client = ANN_Client;
;
//# sourceMappingURL=index.js.map