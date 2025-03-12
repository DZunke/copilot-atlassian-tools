import * as vscode from 'vscode';
import { Settings } from './settings';

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

export class AtlassianApi {
    public static async fetchJiraIssues(jql: string): Promise<JiraResponse | null> {
        const suiteUrl = Settings.getAtlassianSuiteUrl();
        const token = Settings.getAtlassianOAuthToken();
        const email = Settings.getAtlassianEmail();

        if (!suiteUrl || !token || !email) {
            return null; // Error messages already shown in the settings methods
        }

        try {
            const auth = Buffer.from(`${email}:${token}`).toString('base64');

            const response = await fetch(`${suiteUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}`, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    vscode.window.showErrorMessage(
                        'Permission denied (403): Your API token doesn\'t have sufficient permissions to access Jira issues. Please ensure your token has the "Read" permission for Jira.',
                        'Check Documentation'
                    ).then(selection => {
                        if (selection === 'Check Documentation') {
                            vscode.env.openExternal(vscode.Uri.parse('https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/#permissions'));
                        }
                    });
                } else if (response.status === 401) {
                    vscode.window.showErrorMessage('Authentication failed. Your Atlassian token may be invalid or expired.');
                } else {
                    const errorText = await response.text();
                    vscode.window.showErrorMessage(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
                }
                return null;
            }

            return await response.json() as JiraResponse;
        } catch (error) {
            vscode.window.showErrorMessage(`Error fetching Jira issues: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }

    public static async getCurrentUser(): Promise<any> {
        const suiteUrl = Settings.getAtlassianSuiteUrl();
        const token = Settings.getAtlassianOAuthToken();

        if (!suiteUrl || !token) {
            return null;
        }

        try {
            // For Atlassian Cloud APIs, we use Basic Auth with the email + API token
            // The email is needed as the username part of Basic Auth
            const email = Settings.getAtlassianEmail();
            if (!email) {
                vscode.window.showErrorMessage('Atlassian email is not configured. Please set your email in settings.');
                return null;
            }

            // Create the Basic Auth header (encode email:token in base64)
            const auth = Buffer.from(`${email}:${token}`).toString('base64');

            const response = await fetch(`${suiteUrl}/rest/api/3/myself`, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    vscode.window.showErrorMessage('Authentication failed. Your Atlassian token may be invalid or expired.');
                } else {
                    const errorText = await response.text();
                    vscode.window.showErrorMessage(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
                }
                return null;
            }

            return await response.json();
        } catch (error) {
            vscode.window.showErrorMessage(`Error fetching user info: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }

    public static async fetchConfluencePages(accountId: string): Promise<ConfluenceResponse | null> {
        const suiteUrl = Settings.getAtlassianSuiteUrl();
        const token = Settings.getAtlassianOAuthToken();
        const email = Settings.getAtlassianEmail();

        if (!suiteUrl || !token || !email) {
            return null; // Error messages already shown in the settings methods
        }

        try {
            // Create the Basic Auth header (encode email:token in base64)
            const auth = Buffer.from(`${email}:${token}`).toString('base64');

            // CQL query to find pages where the current user is the creator or contributor
            // Filtering by last updated for the most recent pages first
            const cql = encodeURIComponent(`(creator.accountId = "${accountId}" OR contributor.accountId = "${accountId}") order by lastmodified desc`);

            const apiUrl = `${suiteUrl}/wiki/rest/api/content/search?cql=${cql}&expand=history.lastUpdated,space,_links&limit=20`;

            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    vscode.window.showErrorMessage(
                        'Permission denied (403): Your API token doesn\'t have sufficient permissions to access Confluence pages.',
                        'Check Documentation'
                    ).then(selection => {
                        if (selection === 'Check Documentation') {
                            vscode.env.openExternal(vscode.Uri.parse('https://developer.atlassian.com/cloud/confluence/rest/v1/intro/'));
                        }
                    });
                } else if (response.status === 401) {
                    vscode.window.showErrorMessage('Authentication failed. Your Atlassian token may be invalid or expired.');
                } else {
                    const errorText = await response.text();
                    vscode.window.showErrorMessage(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
                }
                return null;
            }

            return await response.json() as ConfluenceResponse;
        } catch (error) {
            vscode.window.showErrorMessage(`Error fetching Confluence pages: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }

    /**
     * Search Jira issues by keywords in title and description
     * @param query The search query/keywords
     * @param maxResults Maximum number of results to return (default: 10)
     * @returns List of matching Jira issues or null if there was an error
     */
    public static async searchJiraIssues(query: string, maxResults: number = 10): Promise<JiraIssue[] | null> {
        const suiteUrl = Settings.getAtlassianSuiteUrl();
        const token = Settings.getAtlassianOAuthToken();
        const email = Settings.getAtlassianEmail();

        if (!suiteUrl || !token || !email) {
            return null; // Error messages already shown in the settings methods
        }

        try {
            const auth = Buffer.from(`${email}:${token}`).toString('base64');

            // Create JQL query that searches in summary (title) and description fields
            // Using ~ for contains operations on both fields
            const jql = `summary ~ "${query}" OR description ~ "${query}" ORDER BY updated DESC`;

            const response = await fetch(`${suiteUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    vscode.window.showErrorMessage(
                        'Permission denied (403): Your API token doesn\'t have sufficient permissions to search Jira issues.',
                        'Check Documentation'
                    ).then(selection => {
                        if (selection === 'Check Documentation') {
                            vscode.env.openExternal(vscode.Uri.parse('https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/#permissions'));
                        }
                    });
                } else if (response.status === 401) {
                    vscode.window.showErrorMessage('Authentication failed. Your Atlassian token may be invalid or expired.');
                } else if (response.status === 400) {
                    // Handle JQL syntax errors
                    const errorData = await response.json();
                    const errorDataJson = errorData as { errorMessages?: string[] };
                    vscode.window.showErrorMessage(`JQL syntax error: ${errorDataJson.errorMessages?.join(', ') || 'Invalid JQL query'}`);
                } else {
                    const errorText = await response.text();
                    vscode.window.showErrorMessage(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
                }
                return null;
            }

            const jiraResponse = await response.json() as JiraResponse;
            return jiraResponse.issues;
        } catch (error) {
            vscode.window.showErrorMessage(`Error searching Jira issues: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }

    /**
     * Search for Confluence pages by keywords in title and content
     * @param query The search query/keywords
     * @param maxResults Maximum number of results to return (default: 10)
     * @returns List of matching Confluence pages or null if there was an error
     */
    public static async searchConfluenceContent(query: string, maxResults: number = 10): Promise<ConfluencePage[] | null> {
        const suiteUrl = Settings.getAtlassianSuiteUrl();
        const token = Settings.getAtlassianOAuthToken();
        const email = Settings.getAtlassianEmail();

        if (!suiteUrl || !token || !email) {
            return null; // Error messages already shown in the settings methods
        }

        try {
            // Create the Basic Auth header (encode email:token in base64)
            const auth = Buffer.from(`${email}:${token}`).toString('base64');

            // CQL query to search in title and content
            // Using ~ for contains operations on both fields
            const cql = encodeURIComponent(`(title ~ "${query}" OR text ~ "${query}") ORDER BY lastmodified DESC`);

            const apiUrl = `${suiteUrl}/wiki/rest/api/content/search?cql=${cql}&expand=body.view,space,version,_links&limit=${maxResults}`;

            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    vscode.window.showErrorMessage(
                        'Permission denied (403): Your API token doesn\'t have sufficient permissions to access Confluence content.',
                        'Check Documentation'
                    ).then(selection => {
                        if (selection === 'Check Documentation') {
                            vscode.env.openExternal(vscode.Uri.parse('https://developer.atlassian.com/cloud/confluence/rest/v1/intro/'));
                        }
                    });
                } else if (response.status === 401) {
                    vscode.window.showErrorMessage('Authentication failed. Your Atlassian token may be invalid or expired.');
                } else if (response.status === 400) {
                    // Handle CQL syntax errors
                    const errorData = await response.json();
                    const errorDataJson = errorData as { message?: string };
                    vscode.window.showErrorMessage(`CQL syntax error: ${errorDataJson.message || 'Invalid CQL query'}`);
                } else {
                    const errorText = await response.text();
                    vscode.window.showErrorMessage(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
                }
                return null;
            }

            const confluenceResponse = await response.json() as ConfluenceResponse;

            if (!confluenceResponse.results || confluenceResponse.results.length === 0) {
                return [];
            }

            // Transform the raw response into a more usable structure
            return confluenceResponse.results.map(page => this.transformConfluencePage(page, suiteUrl));

        } catch (error) {
            vscode.window.showErrorMessage(`Error searching Confluence content: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }

    /**
     * Transform a raw Confluence page object into a structured ConfluencePage
     */
    private static transformConfluencePage(rawPage: any, suiteUrl: string): ConfluencePage {
        // Extract the text content from HTML body
        let textContent = '';
        if (rawPage.body && rawPage.body.view && rawPage.body.view.value) {
            textContent = this.stripHtml(rawPage.body.view.value);
        }

        // Create an excerpt (first 500 characters)
        const excerpt = textContent.length > 500
            ? textContent.substring(0, 500) + '...'
            : textContent;

        return {
            id: rawPage.id,
            title: rawPage.title,
            type: rawPage.type,
            excerpt: excerpt,
            content: textContent,
            spaceKey: rawPage.space?.key || '',
            spaceName: rawPage.space?.name || '',
            lastUpdated: rawPage.version?.when || '',
            createdBy: rawPage.version?.by?.displayName || '',
            url: `${suiteUrl}/wiki${rawPage._links.webui}`,
            lastUpdatedBy: rawPage.version?.by?.displayName || ''
        };
    }

    /**
     * Utility method to strip HTML tags from content
     */
    private static stripHtml(html: string): string {
        if (!html) return '';

        return html
            .replace(/<[^>]*>/g, ' ')  // Replace HTML tags with space
            .replace(/\s+/g, ' ')      // Normalize whitespace
            .trim();                   // Remove leading/trailing whitespace
    }
}
