import * as convert from 'xml-js';
import Bottleneck from "bottleneck"
import * as reqProm from 'request-promise';
import * as random_useragent from 'random-useragent';
import {
  EncyclopediaAnime,
  EncyclopediaAnimeEpisodes,
  EncyclopediaSearchName
} from "./pageObjects/EncyclopediaSearchName";

export class ANN_Client {

  private reportsUrl = 'https://www.animenewsnetwork.com/encyclopedia/reports.xml?';
  private detailsUrl = 'https://cdn.animenewsnetwork.com/encyclopedia/nodelay.api.xml?';
  private clientId = Math.floor((Math.random() * 10000))
  //needed since searches on this url return more data for anime
  private encyclopediaSearchAnimeUrl = "https://www.animenewsnetwork.com/encyclopedia/search/name?only=anime&q=";

  private limiter;

  constructor(private ops: {
    apiBackOff?: number,
    useDerivedValues?: boolean,
    requestFn?: (url: string)=>Promise<string>,
    parseSearchPage?: boolean,
    debug?: boolean
  }) {

    this.ops = Object.assign(
      {},
      {apiBackOff: 10, useDerivedValues: true},
      ops);
    this.limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: ops.apiBackOff * 1000
    });
  }

  private request(url): Promise<any> {

    let retry = 0;
    return (this.ops.requestFn && this.ops.requestFn(url)) || request.call(this, url)
      .catch(e=>{
        retry++;

        if(retry < 5)
          return request.call(this, url);
        throw e;
      })

    function request(uri) {
      return this.limiter.schedule(() => {

        //when the actual call is made
        if(this.ops.debug) {
          let cTime = new Date();
          console.log('ann_client', 'request', 'id:', this.clientId, 'Date:', cTime, 'Elapsed Sec:', Math.floor(Date.now() / 1000) , 'url:', url);
        }

        //api generates infinite redirect loops when the user agent is not defined ??
        let userAStr = random_useragent.getRandom();
        return reqProm({
          maxRedirects: '10',
          followRedirect: true,
          headers: {
            'user-agent': userAStr
          },
          uri: encodeURI(uri)
        })
      })
    }
  }

  parse(xmlPage): IAniManga {
    let ret = convert.xml2js(xmlPage || "",
      {compact: true, alwaysArray: true, trim: true, nativeType: true}) as any;
    return ret.ann && ret.ann[0] || {};
  }

  private parseSearchPageTitles(titles: string[]): Promise<{anime: any[], manga: any[]}> {
    return Promise.all(titles.map(title=>this.parseSearchPage(title)))
      .then((titleResults)=>{
        return titleResults.reduce((acc, {anime, manga})=>{
          acc['anime'] = (acc['anime'] || []).concat(anime);
          acc['manga'] = (acc['manga'] || []).concat(manga);
          return acc;
        });
      });
  }

  private parseSearchPage(title: string): Promise<IAniManga> {
    let url = this.encyclopediaSearchAnimeUrl;
    return this.request(url+title)
      .then(searchPage=>{
        let encPageModel = new EncyclopediaSearchName(searchPage);
        let anime = requestUrls.call(this, encPageModel.anime);
        let manga = requestUrls.call(this, encPageModel.manga);
        return Promise.all([anime, manga]);
      }).then(([anime, manga])=>{
        return {anime, manga};
      });


    function requestUrls(urls: any): Promise<any[]> {
      let thiss = this;
      return Promise.all(
        urls.map((mod)=>mod.ref)
          .filter(url=>!!url)
          .map(url=>thiss.request(url)
            .then(page=>{
              return new EncyclopediaAnime(page);
            })))
    }

  }

  public findTitleWithId(id: string): Promise<any> {
    if (!id)
      return Promise.resolve({});

    let url = this.detailsUrl + 'title=' + id;
    let ret = this.request(url).then(this.parse.bind(this));
    if (this.ops.useDerivedValues)
      return ret.then(this.addDerivedValues.bind(this));
    return ret;
  }

  public findTitlesLike(titles: string[]): Promise<IAniManga> {

    if (this.ops.useDerivedValues && !this.ops.parseSearchPage) {
      return deriveddedupMt.call(this, titles);

    } else if (this.ops.useDerivedValues && this.ops.parseSearchPage) {
      return this.parseSearchPageTitles(titles).then(resultParse => {
        let mainTitles = ([].concat(resultParse.anime, resultParse.manga)).map(rp => rp.d_mainTitle);
        let dedupMt: string[] = Array.from((new Set(mainTitles)));
        return deriveddedupMt.call(this, dedupMt);
      })

    } else {
      return reqParse.call(this, titles);
    }

    function deriveddedupMt(dedupMt: string[]): Promise<IAniManga> {
      return reqParse.call(this, dedupMt)
          .then(this.addDerivedValues.bind(this));
    }
    function reqParse(dedupMt: string[]): Promise<IAniManga> {
      return Promise.all(dedupMt.map(dep=>
          this.request(this.detailsUrl + 'title=~' + dep)))
          .then(resps=>resps.map(this.parse.bind(this)))
          .then((annResps : IAniManga[]): IAniManga => {
            return annResps.reduce((acc: IAniManga, c: IAniManga) => {
              acc.anime = [].concat(acc.anime, c.anime || []);
              acc.manga = [].concat(acc.manga, c.manga || []);
              return acc;
            }, {anime: [], manga: []});
          });
    }

  }

  private addDerivedValues(ann): Promise<IAniManga> {
    if (ann.anime) {
      ann.anime.forEach(an => {
        if (an.info) {
          an.d_genre = this.getMany(an.info, 'Genres');
          an.d_mainTitle = this.getSingle(an.info, 'Main title');
          an.d_plotSummary = this.getSingle(an.info, 'Plot Summary');
          let dr = this.getDateReleased(an.info);
          if (dr)
            an.d_dateReleased = dr;
        }
        if (an.episode)
          an.d_episodes = an.episode &&
            an.episode.map(ep => {
              let ret = {} as any;
              if (ep.title && ep.title[0]._text) ret.title = ep.title[0]._text[0];
              if (ep._attributes && ep._attributes.num) ret.occurrence = +ep._attributes.num;
              return ret;
            }) || [];
      });
    }
    return Promise.resolve(ann);
  }

  private getDateReleased(info): Date | undefined {
    let permierDate: string[] = this.getMany(info, 'Premiere date');
    let vintages: string[] = this.getMany(info, 'Vintage');
    return vintages.concat(permierDate)
      .map((text): any => {
        return (text.toString().match(/[0-9]{4}(?:-[0-9]{2}-[0-9]{2}){0,1}/) || [])[0];
      })
      .filter(val => !!val)
      .map(strDate => new Date(strDate))
      .sort((a: any, b: any) => a - b)[0];
  }

  private getMany(info, key, retKey = '') {
    return info
      .filter(val => val._attributes && val._attributes.type === key)
      .map(gen => (gen._attributes[retKey] || gen['_text'][0])) || [];
  }

  private getSingle(info, key, retKey = '') {
    let sing = info.filter(val => val._attributes && val._attributes.type === key);
    if (sing.length && ((sing[0]._attributes && sing[0]._attributes[retKey]) || sing[0]['_text']))
      return sing[0]._attributes[retKey] || sing[0]['_text'][0];
  }
}

interface IAniManga {anime: any[], manga: any[]};