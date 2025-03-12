import * as vscode from 'vscode';
import { AtlassianApi, ConfluencePage } from '../AtlassianApi';

export interface ConfluenceSearchToolParameters {
    keywords: string[];
}

interface SimplifiedConfluencePage {
    id: string;
    title: string;
    excerpt: string;
    spaceKey: string;
    spaceName: string;
    lastUpdated: string;
    lastUpdatedBy: string;
    url: string;
}

export class ConfluenceSearchTool {
    static ID = 'copilot-atlassian-tools-confluence-search';
    private static readonly RESULTS_PER_KEYWORD = 3;
    private static readonly MAX_TOTAL_RESULTS = 8;

    prepareInvocation(options: vscode.LanguageModelToolInvocationPrepareOptions<ConfluenceSearchToolParameters>, token: vscode.CancellationToken): vscode.ProviderResult<vscode.PreparedToolInvocation> {
        return {
            invocationMessage: vscode.l10n.t("Searching Confluence for '{0}'", options.input.keywords.join(', ')),
        };
    }

    async invoke(options: vscode.LanguageModelToolInvocationOptions<ConfluenceSearchToolParameters>, token: vscode.CancellationToken): Promise<vscode.LanguageModelToolResult> {
        const { keywords } = options.input;
        const suiteUrl = vscode.workspace.getConfiguration('copilot-atlassian-tools').get('atlassianSuiteUrl') as string;

        if (!keywords || keywords.length === 0) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart("No search keywords provided. Please specify keywords to search for Confluence pages.")
            ]);
        }

        try {
            // Run parallel searches for each keyword
            const searchPromises = keywords.map(keyword =>
                AtlassianApi.searchConfluenceContent(keyword, ConfluenceSearchTool.RESULTS_PER_KEYWORD)
            );

            const searchResults = await Promise.all(searchPromises);

            // Combine and deduplicate results
            const allPages: ConfluencePage[] = [];
            const pageIds = new Set<string>();

            searchResults.forEach(pages => {
                if (pages) {
                    pages.forEach(page => {
                        if (!pageIds.has(page.id)) {
                            pageIds.add(page.id);
                            allPages.push(page);
                        }
                    });
                }
            });

            if (allPages.length === 0) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`No Confluence pages found for keywords: ${keywords.join(', ')}`)
                ]);
            }

            // Sort by lastUpdated (most recent first) and limit results
            allPages.sort((a, b) => {
                return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
            });

            // Limit to the most relevant results to avoid information overload
            const limitedPages = allPages.slice(0, ConfluenceSearchTool.MAX_TOTAL_RESULTS);

            // Transform to a simplified structure that's more useful for the LLM
            const simplifiedPages: SimplifiedConfluencePage[] = limitedPages.map(page => ({
                id: page.id,
                title: page.title,
                excerpt: page.excerpt,
                spaceKey: page.spaceKey,
                spaceName: page.spaceName,
                lastUpdated: page.lastUpdated,
                lastUpdatedBy: page.lastUpdatedBy,
                url: page.url
            }));

            // Format the response in structured JSON for the LLM
            const resultObject = {
                totalFound: allPages.length,
                resultsReturned: limitedPages.length,
                searchKeywords: keywords,
                pages: simplifiedPages
            };

            // Create a detailed text summary for the chatbot
            let textSummary = `Found ${allPages.length} Confluence pages for keywords: ${keywords.join(', ')}\n\n`;

            if (allPages.length > ConfluenceSearchTool.MAX_TOTAL_RESULTS) {
                textSummary += `Showing the ${ConfluenceSearchTool.MAX_TOTAL_RESULTS} most relevant results:\n\n`;
            }

            simplifiedPages.forEach(page => {
                textSummary += `## ${page.title}\n`;
                textSummary += `**Space:** ${page.spaceName} (${page.spaceKey})\n`;
                textSummary += `**Last updated:** ${this.formatDate(page.lastUpdated)} by ${page.lastUpdatedBy}\n`;
                textSummary += `[View in Confluence](${page.url})\n\n`;
                textSummary += `${page.excerpt}\n\n`;
                textSummary += `---\n\n`;
            });

            // Return both text summary and structured JSON
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(textSummary)
            ]);

        } catch (error) {
            console.error('Error searching Confluence:', error);
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Error searching Confluence pages: ${error instanceof Error ? error.message : String(error)}`),
            ]);
        }
    }

    /**
     * Format ISO date string to a more readable format
     */
    private formatDate(isoString: string): string {
        if (!isoString) {return 'Unknown date';}

        try {
            const date = new Date(isoString);
            return date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return isoString; // Return original if parsing fails
        }
    }
}
