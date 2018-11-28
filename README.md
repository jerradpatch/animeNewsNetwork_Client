
# Description
A javascript parser for Anime News Network, is meant to run in a NodeJS environment

# Dependencies
1) NodeJs
2) RxJs
3) Bottelneck

# Install
```bash
npm install --save https://github.com/jerradpatch/animeNewsNetwork_Client/tarball/master
```

# Example
```typescript
let ops = {apiBackOff: 10};
      let ann = new ANN_Client(ops);
      let ar = ann.findTitlesLike(['good']);
```
      
      
# Classes
// this is the main class
```typescript
export class ANN_Client {
    
    //default {apiBackOff: 10, useDerivedValues: true}
    //back off uses 
    //https://www.npmjs.com/package/bottleneck
    constructor(private ops: {
    //the time between requests in seconds
          apiBackOff?: number,
    //should d_ values (calculated) be returned in response?
          useDerivedValues?: boolean,
    //using your own request function, bypasses the request throttleing (apiBackOff)
    //**not user-agent must be in the header else the ann api with throw an infinite redirect loop
          requestFn?: (url: string)=>Promise<string>
        });
    
    /*
    return types are derived from 
    https://www.npmjs.com/package/xml-js
    
    convert.xml2js(xmlPage, {compact: true, alwaysArray: true, trim: true, nativeType: true})
    useDerivedValues = true; adds derived types, they can take a while as they are fetched from multiple calls
    anime.d_genre: string[]
    anime.d_mainTitle: string;
    anime.d_plotSummary: string;
    anime.d_episodes: {title: string, occurrence: number};
    anime.d_series: number; // 1 or 2 or 3 .... for type anime.type === 'TV' (for now)
     */
    findTitlesLike(titles: string[]): Promise<any>; 
    
    findTitleWithId(id: string): Promise<any>;
    
}



```
