export declare class ANN_Client {
    private ops;
    private reportsUrl;
    private detailsUrl;
    private limiter;
    constructor(ops: {
        apiBackOff?: number;
        useDerivedValues?: boolean;
        requestFn?: (url: string) => Promise<string>;
    });
    private requestApi;
    findTitleWithId(id: string): Promise<any>;
    findTitlesLike(titles: string[]): Promise<any>;
    private addDerivedValues;
    private getDateReleased;
    private getMany;
    private getSingle;
}
