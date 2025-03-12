export interface JiraIssue {
    id: string;
    key: string;
    fields: {
        summary: string;
        description: string;
        issuetype: {
            name: string;
            iconUrl: string;
        };
        priority: {
            name: string;
        } | null;
        status: {
            name: string;
            statusCategory: {
                key: string;
                name: string;
                colorName: string;
            };
        };
        created: string;
        updated: string;
        assignee: {
            displayName: string;
            emailAddress: string;
        } | null;
        reporter: {
            displayName: string;
            emailAddress: string;
        } | null;
        project: {
            key: string;
            name: string;
        };
    };
}

export interface JiraResponse {
    issues: JiraIssue[];
    total: number;
    maxResults: number;
    startAt: number;
}
