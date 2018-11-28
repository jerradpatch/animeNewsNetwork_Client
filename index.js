"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var convert = require("xml-js");
var bottleneck_1 = require("bottleneck");
var reqProm = require("request-promise");
var internal_compatibility_1 = require("rxjs/internal-compatibility");
var operators_1 = require("rxjs/operators");
var rxjs_1 = require("rxjs");
var random_useragent = require("random-useragent");
var ANN_Client = /** @class */ (function () {
    function ANN_Client(ops) {
        this.ops = ops;
        this.reportsUrl = 'https://www.animenewsnetwork.com/encyclopedia/reports.xml?';
        this.detailsUrl = 'https://cdn.animenewsnetwork.com/encyclopedia/nodelay.api.xml?';
        Object.assign(this.ops, { apiBackOff: 10, useDerivedValues: true }, ops);
        this.limiter = new bottleneck_1.default({
            maxConcurrent: 1,
            minTime: ops.apiBackOff * 1000
        });
    }
    ANN_Client.prototype.requestApi = function (url) {
        var _this = this;
        return rxjs_1.defer(function () { return internal_compatibility_1.fromPromise((_this.ops.requestFn && _this.ops.requestFn(url)) || request.call(_this, url)); }).pipe(operators_1.retry(5))
            .toPromise()
            .then(parse.bind(this));
        function request(uri) {
            //api generates infinite redirect loops when the user agent is not defined ??
            var userAStr = random_useragent.getRandom();
            return this.limiter.schedule(function () { return reqProm({
                maxRedirects: '10',
                followRedirect: true,
                headers: {
                    'user-agent': userAStr
                },
                uri: encodeURI(uri)
            }); });
        }
        function parse(xmlPage) {
            var ann = convert.xml2js(xmlPage, { compact: true, alwaysArray: true, trim: true, nativeType: true });
            return ann;
        }
    };
    ANN_Client.prototype.findTitleWithId = function (id) {
        var _this = this;
        if (!id)
            return Promise.resolve({});
        var url = this.detailsUrl + 'title=' + id;
        var ret = this.requestApi(url);
        if (this.ops.useDerivedValues)
            return ret.then(function (ann) { return _this.addDerivedValues(ann.ann && ann.ann[0]); });
        return ret;
    };
    ANN_Client.prototype.findTitlesLike = function (titles) {
        var _this = this;
        var url = this.detailsUrl + 'title=~' + titles.join('&title=~');
        var ret = this.requestApi(url);
        if (this.ops.useDerivedValues)
            return ret.then(function (ann) { return _this.addDerivedValues(ann.ann && ann.ann[0]); });
        return ret;
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
//# sourceMappingURL=index.js.map