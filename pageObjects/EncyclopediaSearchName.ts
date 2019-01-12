
import * as cheerio from 'cheerio';

const baseUrl = "https://www.animenewsnetwork.com";

export class EncyclopediaSearchName {
  anime: {ref: string, title: string}[]= [];
  manga: {ref: string, title: string}[] = [];

  constructor(page){
    const $ = cheerio.load(page);
    let thiss = this;
    $('#content-zone > div > a[href]').each(function(i, el) {
      let ref = $(el).attr('href');
      let title = $(el).text();
      if(ref && title) {
        if (ref.match(/\/anime.php/))
          thiss.anime.push({ref: baseUrl + ref, title});
        else if (ref.match(/\/manga.php/))
          thiss.manga.push({ref: baseUrl + ref, title});
      }
    })
  }
}

export class EncyclopediaAnime {

  d_mainTitle;
  d_genre = [];
  d_altTitles = [];
  d_plotSummary;
  d_dateReleased;
  d_episodesLink;

  constructor(page){
    const $ = cheerio.load(page);

    this.d_mainTitle = ($('#page-title > #page_header').text() || "")
      .replace(/\([a-zA-Z]*\)/, "").trim();

    this.d_genre = $('#infotype-30 > span > a').map(function(i, el) {
      return $(this).text();
    }).get();

    this.d_altTitles = $('div > #infotype-2 > div').map(function(i, el) {
      return $(this).text();
    }).get();

    let ps = $('#infotype-12 > span').text();
    if(ps)
      this.d_plotSummary = ps;

    let _sel = $('#infotype-7 > span').text();
    let _dat = _sel.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}/);
    if(_dat && _dat.length) {
      let date = _dat[0].split('-');
      if(!date[0] || date[0].length === 4) {
        this.d_dateReleased = new Date(+date[0], +(date[1] || '1') - 1, +(date[2] || '1'));
      }
    }

    let _epLink = $('#infotype-25 > a').attr('href');
    if(_epLink)
      this.d_episodesLink = baseUrl + _epLink;
  }
}

export class EncyclopediaAnimeEpisodes {

  d_episodes: {title: string, num: number}[] = [];

  constructor(page) {
    const $ = cheerio.load(page);
    let thiss = this;
    $('.episode-list > tbody > tr').each(function(i, el) {
      let title = $(el).find('td:nth-child(5) > div:first-child').text();
      let _num = ($(el).find('td:nth-child(3)').text() || "").match(/[0-9]+/);
      let num = _num && _num[0] && +_num[0] || null;
      if(title && num !== null)
        thiss.d_episodes.push({title, num});
    });
  }
}

