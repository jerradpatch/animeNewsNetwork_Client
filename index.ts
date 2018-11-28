import * as convert from 'xml-js';
import Bottleneck from "bottleneck"
import * as reqProm from 'request-promise';
import {fromPromise} from "rxjs/internal-compatibility";
import {retry} from "rxjs/operators";
import {defer} from "rxjs";
import * as random_useragent from 'random-useragent';

export class ANN_Client {

  private reportsUrl = 'https://www.animenewsnetwork.com/encyclopedia/reports.xml?';
  private detailsUrl = 'https://cdn.animenewsnetwork.com/encyclopedia/nodelay.api.xml?';

  private limiter;

  constructor(private ops: {
    apiBackOff?: number,
    useDerivedValues?: boolean,
    requestFn?: (url: string)=>Promise<string>
  }) {

    Object.assign(
      this.ops,
      {apiBackOff: 10, useDerivedValues: true},
      ops);
    this.limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: ops.apiBackOff * 1000
    });
  }


  private requestApi(url): Promise<any> {

    return defer(() => fromPromise(
      (this.ops.requestFn && this.ops.requestFn(url)) || request.call(this, url)
    )).pipe(
      retry(5))
      .toPromise()
      .then(parse.bind(this));

    function request(uri) {
      //api generates infinite redirect loops when the user agent is not defined ??
      let userAStr = random_useragent.getRandom();
      return this.limiter.schedule(() => reqProm({
        maxRedirects: '10',
        followRedirect: true,
        headers: {
          'user-agent': userAStr
        },
        uri: encodeURI(uri)
      }))
    }

    function parse(xmlPage) {
      let ann = convert.xml2js(xmlPage,
        {compact: true, alwaysArray: true, trim: true, nativeType: true}) as any;
      return ann;
    }
  }

  public findTitleWithId(id: string): Promise<any> {
    if (!id)
      return Promise.resolve({});

    let url = this.detailsUrl + 'title=' + id;
    let ret = this.requestApi(url);
    if (this.ops.useDerivedValues)
      return ret.then((ann) => this.addDerivedValues(ann.ann && ann.ann[0]));
    return ret;
  }

  public findTitlesLike(titles: string[]): Promise<any> {
    let url = this.detailsUrl + 'title=~' + titles.join('&title=~');
    let ret = this.requestApi(url);
    if (this.ops.useDerivedValues)
      return ret.then((ann) => this.addDerivedValues(ann.ann && ann.ann[0]));
    return ret;
  }

  private addDerivedValues(ann): Promise<any> {
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
