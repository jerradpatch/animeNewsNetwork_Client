
# Description
A javascript parser for Anime News Network, it uses cheerio and is meant to run in a NodeJS environment

# Dependencies
1) Cheerio
2) NodeJs
3) RxJs

# Example
```typescript
let ops = {apiBackOff: 10, caching:false};
      let ann = new ANN_Client(ops);
      let ar = ann.findTitlesLike(['good']);
```
      
      
# Classes
// this is the main class
```typescript
export class ANN_Client {
    
    constructor(ops: ANN_Client_Options);
    
    //list of titles to, I suggest doing one at at time thou,
    //threashold cutoff, if the percent between the searched title and the title found 
    // is not greater then the threashold then do not return the title.
    // this paramter is optional and if not given defaults to 80%
    findTitlesLike(titles: string[], theashold?: number): Observable<SeriesModel[]>; 
}

class ANN_Client_Options {
    typeFilter:string; //anime | manga | null ; the filter the search result type
    apiBackOff:number; //time that must elapse between each api call in seconds
    cacheing:Boolean; //cache all api calls
}

class SeriesModel {
  groupType: string; //anime or manga
  type:string; // groupType=anime then [special, anime, TV, omnibus, OAV, movie]; groupType=manga then [manga, magazine]
  precision:string; // groupType=anime then [anime, TV, omnibus, OAV, movie]; groupType=manga then [manga, anthology, meta]
  _id: string;
  occurrence: number;
  title: string;
  alternativeTitles: string;
  [genre: string]:boolean; //for all genre types, ex: "adventure":true
  summary: string;
  dateReleased: string;
  dateEnded: string;
  episodes: {
    occurrence: number,
    language: string, //all language types in the API?
    title: string,
  }[];
}
```
