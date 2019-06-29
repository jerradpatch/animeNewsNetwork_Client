"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
var chai = require("chai");
var rp = require("request-promise");
var random_useragent = require("random-useragent");
chai.use(require('chai-datetime'));
var expect = chai.expect;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
describe('Testing the ANN API client', function () {
    this.timeout(15000);
    var ops = { apiBackOff: 10 };
    var ann = new index_1.ANN_Client(ops);
    describe('This tests the API backoff', function () {
        it('it should run two requests immediately that are called 10 seconds apart', function (done) {
            var ar = ann.findTitlesLike(['good']);
            var br = ann.findTitlesLike(['bears']);
            var start = Date.now();
            Promise.all([ar, br])
                .then(function (_a) {
                var good = _a[0], bears = _a[1];
                var end = Date.now();
                if (good.anime[0].d_mainTitle === bears.anime[0].d_mainTitle)
                    throw "results were the same";
                if (end - start < (10 * 1000))
                    throw "the api backoff did not wait 10 seconds";
                done();
            }, function (err) {
                debugger;
                throw err;
            });
        }.bind(null));
    });
    describe('Test that the api has not changed', function () {
        it('it should return expected data for given title', function (done) {
            ann.findTitlesLike(['cardcaptor sakura: clear card'])
                .then(function (resp) {
                var res = resp.anime[0];
                //test anime
                expect(res.ratings[0]).to.have.nested.property('_attributes.bayesian_score');
                expect(res.d_genre).to.have.same.members(['adventure', 'comedy', 'magic']);
                expect(res.d_mainTitle).to.eq('Cardcaptor Sakura: Clear Card');
                expect(res.d_plotSummary).to.eq('Sakura and Syaoran are starting junior high school. With the Final Judgment passed, Sakura thinks school life will be quiet, but then all her cards suddenly turn blank. The mysterious new power she discovers will change how she thinks about her powers. <em class=de-emphasized>(from manga)</em>');
                expect(res.d_dateReleased).to['equalDate'](new Date('2018-01-07'));
                expect(res.d_episodes).to.have.lengthOf(22);
                done();
            });
        });
        it('it should return correct vintages', function (done) {
            Promise.all([
                ann.findTitleWithId('6074'),
                ann.findTitleWithId('4658'),
                ann.findTitleWithId('13834')
            ])
                .then(function (_a) {
                var yearOnly = _a[0], yearDayMonth = _a[1], earliestYDM = _a[2];
                expect(yearOnly.anime[0].d_dateReleased).to['equalDate'](new Date('1992-01-01'));
                expect(yearDayMonth.anime[0].d_dateReleased).to['equalDate'](new Date('2005-01-05'));
                expect(earliestYDM.anime[0].d_dateReleased).to['equalDate'](new Date('2012-04-03'));
                done();
            });
        });
    });
    describe('Test multi title searching', function () {
        it('it should return more data when searching for more titles', function (done) {
            var titles = [
                'cardcaptor sakura: clear card',
                'jinki:extend'
            ];
            ann.findTitlesLike(titles).then(function (mResp) {
                var titlesFound = titles.filter(function (title) {
                    return mResp.anime.reduce(function (p, c) { return p || c.d_mainTitle.toLowerCase() === title; }, false);
                });
                expect(titlesFound).to.have.lengthOf(titles.length);
                done();
            });
        });
    });
    /*
    b/c sometimes we have a custom requester that we are using for many different api calls that maybe configured
    with its own backoff, caching, and response
     */
    describe('Test passing a custom requester', function () {
        it('should work', function (done) {
            var cOps = { apiBackOff: 10, requestFn: function (uri) {
                    var userAStr = random_useragent.getRandom();
                    return rp.get({
                        maxRedirects: '10',
                        followRedirect: true,
                        headers: {
                            'user-agent': userAStr
                        },
                        uri: uri
                    });
                } };
            var cAnn = new index_1.ANN_Client(cOps);
            cAnn.findTitlesLike(['cardcaptor sakura: clear card'])
                .then(function (resp) {
                var res = resp.anime[0];
                //test anime
                expect(res.d_episodes).to.have.lengthOf(22);
                done();
            });
        });
    });
});
//# sourceMappingURL=test.spec.js.map