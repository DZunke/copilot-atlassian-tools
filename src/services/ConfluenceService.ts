import * as vscode from 'vscode';
import { ConfluenceResponse, ConfluencePage } from '../types/ConfluenceTypes';
import { BaseApiService } from './BaseApiService';

export class ConfluenceService extends BaseApiService {
    public static async fetchConfluencePages(accountId: string): Promise<ConfluenceResponse | null> {
        const suiteUrl = this.getSuiteUrl();
        const authConfig = this.getAuthHeaders();

        if (!suiteUrl || !authConfig) {
            return null;
        }

        try {
            // CQL query to find pages where the current user is the creator or contributor
            const cql = encodeURIComponent(`(creator.accountId = "${accountId}" OR contributor.accountId = "${accountId}") order by lastmodified desc`);
            const apiUrl = `${suiteUrl}/wiki/rest/api/content/search?cql=${cql}&expand=history.lastUpdated,space,_links&limit=20`;

            const response = await fetch(apiUrl, authConfig);
            return await this.handleApiResponse<ConfluenceResponse>(response, 'Confluence pages');
        } catch (error) {
            vscode.window.showErrorMessage(`Error fetching Confluence pages: ${error instanceof Error ? error.message : String(error)}`);
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
        const suiteUrl = this.getSuiteUrl();
        const authConfig = this.getAuthHeaders();

        if (!suiteUrl || !authConfig) {
            return null;
        }

        try {
            // CQL query to search in title and content
            const cql = encodeURIComponent(`(title ~ "${query}" OR text ~ "${query}") ORDER BY lastmodified DESC`);
            const apiUrl = `${suiteUrl}/wiki/rest/api/content/search?cql=${cql}&expand=body.view,space,version,_links&limit=${maxResults}`;

            const response = await fetch(apiUrl, authConfig);
            const confluenceResponse = await this.handleApiResponse<ConfluenceResponse>(response, 'Confluence content');

            if (!confluenceResponse?.results || confluenceResponse.results.length === 0) {
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
}
