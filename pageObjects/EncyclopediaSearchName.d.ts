export declare class EncyclopediaSearchName {
    anime: {
        ref: string;
        title: string;
    }[];
    manga: {
        ref: string;
        title: string;
    }[];
    constructor(page: any);
}
export declare class EncyclopediaAnime {
    d_mainTitle: any;
    d_type: any;
    d_genre: any[];
    d_altTitles: any[];
    d_plotSummary: any;
    d_dateReleased: any;
    d_episodesLink: any;
    constructor(page: any);
}
export declare class EncyclopediaAnimeEpisodes {
    d_episodes: {
        title: string;
        num: number;
    }[];
    constructor(page: any);
}
