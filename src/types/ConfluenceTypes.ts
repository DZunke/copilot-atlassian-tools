export interface ConfluenceResponse {
    results: any[];
    start: number;
    limit: number;
    size: number;
}

export interface ConfluencePage {
    id: string;
    title: string;
    type: string;
    excerpt: string;
    content: string;
    spaceKey: string;
    spaceName: string;
    lastUpdated: string;
    createdBy: string;
    lastUpdatedBy: string;
    url: string;
}
