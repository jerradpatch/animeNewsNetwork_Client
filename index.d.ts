export declare class ANN_Client {
    private ops;
    private reportsUrl;
    private detailsUrl;
    private clientId;
    private encyclopediaSearchAnimeUrl;
    private limiter;
    constructor(ops: {
        apiBackOff?: number;
        useDerivedValues?: boolean;
        requestFn?: (url: string) => Promise<string>;
        parseSearchPage?: boolean;
        debug?: boolean;
    });
    private request;
    parse(xmlPage: any): any;
    private parseSearchPageTitles;
    private parseSearchPage;
    findTitleWithId(id: string): Promise<any>;
    findTitlesLike(titles: string[]): Promise<IAniManga>;
    private addDerivedValues;
    private getDateReleased;
    private getMany;
    private getSingle;
}
interface IAniManga {
    anime: any[];
    manga: any[];
}
export {};
