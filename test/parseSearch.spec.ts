import {ANN_Client} from '../index';
import * as chai from 'chai';
import * as rp from 'request-promise';

import {
  EncyclopediaAnime,
  EncyclopediaAnimeEpisodes,
  EncyclopediaSearchName
} from "../pageObjects/EncyclopediaSearchName";
import {encyclopediaSearchNamePage} from "./RawPages/EncyclopediaSearchNamePage";
import {encyclopediaAnimePage} from "./RawPages/EncyclopediaAnimePage";
import {encyclopediaAnime_episodesPage} from "./RawPages/EncyclopediaAnime_EpisodesPage";
import {encyclopediaMangaPage} from "./RawPages/EncyclopediaMangaPage";

chai.use(require('chai-datetime'));
const expect = chai.expect;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const baseUrl = "https://www.animenewsnetwork.com";

describe('Testing the ANN Parse SearchPage client', function () {
  this.timeout(5 * 60 * 1000);

  describe('Test encyclopedia Page Objects parse correct information', function () {
    it('test encyclopedia/search/name?only=anime&q=jinki saved page is parsed correctly', function (done) {
      let spMod = new EncyclopediaSearchName(encyclopediaSearchNamePage)
      testSearchPage(spMod);
      done();
    });

    it('test encyclopedia/search/name?only=anime&q=jinki test api returns expected values', function (done) {
      let spMod = new EncyclopediaAnime(encyclopediaAnimePage);
      testAnimePage(spMod);
      done();
    });

    it('test https://www.animenewsnetwork.com/encyclopedia/manga.php?id=11608 test api returns expected values', function (done) {
      let spMod = new EncyclopediaAnime(encyclopediaMangaPage);
      testMangaPage(spMod);
      done();
    });

    it('test https://www.animenewsnetwork.com/encyclopedia/anime.php?id=4658&page=25 test api returns expected values', function (done) {
      let spMod = new EncyclopediaAnimeEpisodes(encyclopediaAnime_episodesPage);
      testEpisodesPage(spMod);
      done();
    });
  })

  describe('Test encyclopedia Page Objects expected pare matches actual parse', function () {
    it('test encyclopedia/search/name?only=anime&q=jinki search page is as expected', function (done) {
      rp(baseUrl+'/encyclopedia/search/name?only=anime&q=jinki')
        .then(page=>{
          let spMod = new EncyclopediaSearchName(page);
          testSearchPage(spMod);
          done();
        })
    })

    it('test /encyclopedia/manga.php?id=11608 manga page is as expected', function (done) {
      rp(baseUrl+'/encyclopedia/manga.php?id=11608')
        .then(page=>{
          let spMod = new EncyclopediaAnime(page);
          testMangaPage(spMod);
          done();
        })
    });

    it('test /encyclopedia/manga.php?id=11608 anime page is as expected', function (done) {
      rp(baseUrl+'/encyclopedia/anime.php?id=4658')
        .then(page=>{
          let spMod = new EncyclopediaAnime(page);
          testAnimePage(spMod);
          done();
        })
    })

    it('test /encyclopedia/anime.php?id=4658&page=25 episode page is as expected', function (done) {
      rp(baseUrl+'/encyclopedia/anime.php?id=4658&page=25')
        .then(page=>{
          let spMod = new EncyclopediaAnimeEpisodes(page);
          testEpisodesPage(spMod);
          done();
        })
        .catch(e=>{
          done(e);
        })
    })
  });

  describe('Test library client results with search page parsing', function () {

    const ops = {
      apiBackOff: 10,
      useDerivedValues: true,
      parseSearchPage: true
    };
    const ann = new ANN_Client(ops);

    it('it should have parsed search result for single title', function (done) {
      const title = 'ulysses jehanne darc to renkin no kishi';
      ann['parseSearchPage'](title).then((parse: {anime: any[], manga: any[]})=>{
        expect(parse.anime.length).to.be.equal(1);
        expect(parse.manga.length).to.be.equal(0);
        done();
      }).catch(e=>{
        done(new Error(e));
      })
    });

    it('it should have parsed search result for single title Zoids', function (done) {
      const titleZ = 'Zoids Wild Raw';
      ann['parseSearchPage'](titleZ).then((parse: {anime: any[], manga: any[]})=>{
        expect(parse.anime.length).to.be.gte(1);
        expect(parse.manga.length).to.be.equal(0);
        done();
      }).catch(e=>{
        done(new Error(e));
      })
    });

    it('it should have parsed search results for multi titles', function (done) {
      const titles = ['ulysses jehanne darc to renkin no kishi'];
      ann['parseSearchPageTitles'](titles).then((parse: {anime: any[], manga: any[]})=>{
        expect(parse.anime.length).to.be.equal(1);
        expect(parse.manga.length).to.be.equal(0);
        done();
      })
      .catch(e=>{
        done(new Error(e));
      })
    })

    it('it should have parse search results matching nonParse search results', function (done) {
      const titles = ['ulysses jehanne darc to renkin no kishi'];
      ann.findTitlesLike(titles).then((parse: {anime: any[], manga: any[]})=>{
        expect(parse.anime.length).to.be.equal(1);
        expect(parse.manga.length).to.be.equal(0);
        done();
      }).catch(e=>{
        done(new Error(e));
      })
    })

    it('it should return matching anime for title', function (done) {
      const titles = ['바질리스크 코우가인법첩'];
      ann.findTitlesLike(titles).then((parse: {anime: any[], manga: any[]})=>{
        expect(parse.anime.length).to.be.equal(2);
        expect(parse.manga.length).to.be.equal(1);
        done();
      })
      .catch(e=>{
        done(new Error(e));
      })
    })

    it('it should return more results than a regular search', function (done) {
      const ops2 = {apiBackOff: 10};
      const ann2 = new ANN_Client(ops2);
      const titles = ['ulysses jehanne darc to renkin no kishi'];
      Promise.all([
        ann2.findTitlesLike(titles),
        ann.findTitlesLike(titles)]).then(([nonParse, parse]: {anime: any[], manga: any[]}[])=>{
          expect(parse.anime.length).to.be.gt(nonParse.anime && nonParse.anime.length || 0);
          expect(parse.manga.length).to.be.equal(0);
          done();
        })
        .catch(e=>{
          done(new Error(e));
        })
    })
  })

  describe('Test that there is an improvement in results', function () {

    const ops = {
      apiBackOff: 4,
      useDerivedValues: true,
      parseSearchPage: true
    };
    const ann = new ANN_Client(ops);

    it('It should have a larger number of results per title given a list of titles', function (done) {
      this.timeout(10 * 60 * 60 * 1000);

      let titles = [
        '【孤独のグルメ 】 大晦日sp 京都・名古屋出張',
        'saiki kusuo no ψ-nan kanketsu-hen',
        'goblin slayer',
        'lord el-melloi ii-sei no jikenbo special',
        'release the spyce',
        'akanesasu shoujo end',
        'kitsune no koe end',
        'karakuri circus vostfr',
        'ulysses jehanne darc to renkin no kishi end',
        'zoids wild raw'
      ];

      const ops2 = {apiBackOff: 10};
      const ann2 = new ANN_Client(ops2);

      Promise.all(titles.map(title=> {
        return Promise.all([ann2.findTitlesLike([title]),
          ann.findTitlesLike([title])]).then(([nonParse, parse]: { anime: any[], manga: any[] }[]) => {
            let anime = (((parse.anime && parse.anime.length || 0) - (nonParse.anime && nonParse.anime.length || 0)) / (nonParse.anime && nonParse.anime.length || 1)) * 100;
            let manga = (((parse.manga && parse.manga.length || 0) - (nonParse.manga && nonParse.manga.length || 0)) / (nonParse.manga && nonParse.manga.length || 1)) * 100;
            return {anime, manga};
          })
      })).then((res: {anime: number, manga: number}[])=>{

        let sumImpAni = res.reduce((acc, c)=> acc + c.anime, 0);
        console.log("Avg improvement anime: ", sumImpAni/res.length + '%');
        expect(sumImpAni/res.length).to.be.gt(0);

        let sumImpMan = res.reduce((acc, c)=> acc + c.manga, 0);
        console.log("Avg improvement manga: ", sumImpMan/res.length + '%');
        expect(sumImpMan/res.length).to.be.gt(0);

        done();
      });
    })

    it('Show the increase in request completion time due parsing the search page',function (done) {
      this.timeout(10 * 60 * 60 * 1000);

      let title = 'Cardcaptor Sakura Clear Card Hen';

      const ops = {
        apiBackOff: 4,
        useDerivedValues: true,
        parseSearchPage: true
      };
      const ann = new ANN_Client(ops);

      const ops2 = {apiBackOff: 10};
      const ann2 = new ANN_Client(ops2);

      let startTime = new Date();
      Promise.all([
        ann.findTitlesLike([title]).then(()=>{
          return Date.now()
        }),
        ann2.findTitlesLike([title]).then(()=>{
          return Date.now()
        })
      ]).then(([parseEnd, nonParseEnd])=>{
        console.log('Time increase due to parsing the page',
          "nonParse Duration:", nonParseEnd - startTime.getMilliseconds(),
          "parse Duration:", parseEnd - startTime.getMilliseconds(),
          "increased Duration Sec:", (parseEnd - nonParseEnd) / 1000)

        expect(parseEnd - nonParseEnd).to.be.gt(0);
        done();
      })
    })
  })

  function testSearchPage(spMod){
    expect(spMod.anime).to.have.lengthOf(1);
    expect(spMod.anime[0].title).to.eq('Jinki:Extend (TV)');
    expect(spMod.anime[0].ref).to.eq('https://www.animenewsnetwork.com/encyclopedia/anime.php?id=4658');

    expect(spMod.manga).to.have.lengthOf(1);
    expect(spMod.manga[0].title).to.eq('Jinki');
    expect(spMod.manga[0].ref).to.eq('https://www.animenewsnetwork.com/encyclopedia/manga.php?id=11608');
  }

  function testAnimePage(spMod){
    expect(spMod.d_mainTitle).to.eq('Jinki:Extend');
    expect(spMod.d_type).to.eq('TV');

    expect(spMod.d_genre).to.have.lengthOf(2);
    expect(spMod.d_genre).to.eql(['drama', 'science fiction']);

    expect(spMod.d_altTitles).to.have.lengthOf(2);
    expect(spMod.d_altTitles).to.eql(['Боевые роботы Дзинки (Russian)', 'ジンキ・エクステンド (Japanese)']);

    expect(spMod.d_plotSummary).to.eq('Aoba is a young girl who loves to build models of robots. She lived alone with her grandmother until her grandmother passes away. Shortly after she is kidnapped and brought to a secret base where she discovers a huge robot. The piloted robots fight against Ancient-Jinki in The Grand Savanna, but the true meaning behind the fights is hidden. Aoba works hard at the base so one day she can pilot one of the robots and discover these secrets.');
    expect(new Date(2005, 0, 5)).to.eql(spMod.d_dateReleased);
    expect(spMod.d_episodesLink).to.eq('https://www.animenewsnetwork.com/encyclopedia/anime.php?id=4658&page=25');
  }

  function testMangaPage(spMod){
    expect('Jinki').to.eq(spMod.d_mainTitle);
    expect('manga').to.eq(spMod.d_type);

    expect(spMod.d_genre).to.have.lengthOf(1);
    expect(['science fiction']).to.eql(spMod.d_genre);

    expect(spMod.d_altTitles).to.have.lengthOf(1);
    expect(['ジンキ ―人機― (Japanese)']).to.eql(spMod.d_altTitles);

    expect(spMod).to.not.have.property('d_plotSummary');
    expect(new Date(2000, 0, 26)).to.eql(spMod.d_dateReleased);
    expect(spMod).to.not.have.property('d_episodesLink');
  }

  function testEpisodesPage(spMod){
    expect(spMod.d_episodes).to.eql([
      {num: 1, title: 'The Battlefield the Girl Saw'},
      {num: 2, title: 'The Trail of Tears'},
      {num: 3, title: 'Quality and Quantity'},
      {num: 4, title: 'Encounter'},
      {num: 5, title: 'Foes and Friends'},
      {num: 6, title: 'The Black Operator'},
      {num: 7, title: 'Fulfilled Ambition'},
      {num: 8, title: 'The Silver-winged Visitor'},
      {num: 9, title: 'The Game\'s Winner'},
      {num: 10, title: 'Red and Black'},
      {num: 11, title: 'Family'},
      {num: 12, title: 'Blue and Red'},
      {num: 13, title: 'And Then'}
    ]);
  }
})