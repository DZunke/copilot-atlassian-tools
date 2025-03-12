import * as vscode from 'vscode';
import { AtlassianApi, JiraIssue } from '../AtlassianApi';

export interface JiraSearchToolParameters {
    keywords: string[];
}

interface SimplifiedJiraIssue {
    key: string;
    title: string;
    description: string;
    type: string;
    status: string;
    priority: string | null;
    assignee: string | null;
    reporter: string | null;
    created: string;
    updated: string;
    project: string;
    url: string;
}

export class JiraContentSearchTool {
    static ID = 'copilot-atlassian-tools-jira-search';

    prepareInvocation(options: vscode.LanguageModelToolInvocationPrepareOptions<JiraSearchToolParameters>, token: vscode.CancellationToken): vscode.ProviderResult<vscode.PreparedToolInvocation> {
        return {
            invocationMessage: vscode.l10n.t("Searching Jira for '{0}'", options.input.keywords.join(', ')),
        };
    }

    async invoke(options: vscode.LanguageModelToolInvocationOptions<JiraSearchToolParameters>, token: vscode.CancellationToken): Promise<vscode.LanguageModelToolResult> {
        const { keywords } = options.input;
        const suiteUrl = vscode.workspace.getConfiguration('copilot-atlassian-tools').get('atlassianSuiteUrl') as string;

        if (!keywords || keywords.length === 0) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart("No search keywords provided. Please specify keywords to search for Jira issues."),
            ]);
        }

        try {
            // Run parallel searches for each keyword
            const searchPromises = keywords.map(keyword =>
                AtlassianApi.searchJiraIssues(keyword, 5) // Limit to 5 results per keyword
            );

            const searchResults = await Promise.all(searchPromises);

            // Combine and deduplicate results
            const allIssues: JiraIssue[] = [];
            const issueKeys = new Set<string>();

            searchResults.forEach(issues => {
                if (issues) {
                    issues.forEach(issue => {
                        if (!issueKeys.has(issue.key)) {
                            issueKeys.add(issue.key);
                            allIssues.push(issue);
                        }
                    });
                }
            });

            if (allIssues.length === 0) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`No Jira issues found for keywords: ${keywords.join(', ')}`),
                ]);
            }

            // Transform to simplified structure that's more useful for the LLM
            const simplifiedIssues: SimplifiedJiraIssue[] = allIssues.map(issue => {
                // Clean up description - remove HTML and limit length
                let description = issue.fields.description
                    ? this.cleanDescription(issue.fields.description)
                    : "";

                if (description.length > 500) {
                    description = description.substring(0, 500) + "...";
                }

                return {
                    key: issue.key,
                    title: issue.fields.summary,
                    description,
                    type: issue.fields.issuetype.name,
                    status: issue.fields.status.name,
                    priority: issue.fields.priority?.name || null,
                    assignee: issue.fields.assignee?.displayName || null,
                    reporter: issue.fields.reporter?.displayName || null,
                    created: issue.fields.created,
                    updated: issue.fields.updated,
                    project: issue.fields.project.name,
                    url: `${suiteUrl}/browse/${issue.key}`
                };
            });

            // Format the response in structured JSON for the LLM
            const resultObject = {
                totalFound: allIssues.length,
                searchKeywords: keywords,
                issues: simplifiedIssues
            };

            // Create a detailed text summary for the chatbot
            let textSummary = `Found ${allIssues.length} Jira issues for keywords: ${keywords.join(', ')}\n\n`;

            simplifiedIssues.forEach(issue => {
                textSummary += `## ${issue.key}: ${issue.title}\n`;
                textSummary += `Type: ${issue.type} | Status: ${issue.status} | Priority: ${issue.priority || 'N/A'}\n`;
                textSummary += `Project: ${issue.project}\n`;
                if (issue.assignee) {
                    textSummary += `Assignee: ${issue.assignee}\n`;
                }
                textSummary += `[View in Jira](${issue.url})\n\n`;
                if (issue.description) {
                    textSummary += `**Description:**\n${issue.description}\n\n`;
                }
                textSummary += `---\n\n`;
            });

            // Return both JSON and text formats
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(textSummary),
            ]);

        } catch (error) {
            console.error('Error searching Jira:', error);
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Error searching Jira issues: ${error instanceof Error ? error.message : String(error)}`),
            ]);
        }
    }

    /**
     * Clean and format Jira issue descriptions which may contain Atlassian Document Format (ADF) or HTML
     */
    private cleanDescription(description: any): string {
        // Check if description is ADF format (JSON object)
        if (typeof description === 'object') {
            try {
                // Try to extract text from ADF content
                const processContent = (content: any[]): string => {
                    if (!content || !Array.isArray(content)) {
                        return "";
                    }

                    return content.map(item => {
                        if (item.text) {
                            return item.text;
                        } else if (item.content) {
                            return processContent(item.content);
                        }
                        return "";
                    }).join(" ");
                };

                if (description.content && Array.isArray(description.content)) {
                    let text = processContent(description.content);
                    return text.replace(/\s+/g, ' ').trim();
                }

                // Fallback to JSON string if we can't parse it
                return JSON.stringify(description).substring(0, 300) + "...";
            } catch (e) {
                return "Unable to parse description format";
            }
        }

        // If it's a string, assume it might be HTML or plain text
        if (typeof description === 'string') {
            // Remove HTML tags
            return description
                .replace(/<[^>]*>/g, ' ')  // Replace HTML tags with space
                .replace(/\s+/g, ' ')      // Normalize whitespace
                .trim();                   // Remove leading/trailing whitespace
        }

        return "No description available";
    }
}
