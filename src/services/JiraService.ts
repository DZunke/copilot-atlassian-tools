import * as vscode from 'vscode';
import { JiraIssue, JiraResponse } from '../types/JiraTypes';
import { BaseApiService } from './BaseApiService';

export class JiraService extends BaseApiService {
    public static async fetchJiraIssues(jql: string): Promise<JiraResponse | null> {
        const suiteUrl = this.getSuiteUrl();
        const authConfig = this.getAuthHeaders();

        if (!suiteUrl || !authConfig) {
            return null;
        }

        try {
            const response = await fetch(`${suiteUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}`, authConfig);
            return await this.handleApiResponse<JiraResponse>(response, 'Jira issues');
        } catch (error) {
            vscode.window.showErrorMessage(`Error fetching Jira issues: ${error instanceof Error ? error.message : String(error)}`);
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
        const suiteUrl = this.getSuiteUrl();
        const authConfig = this.getAuthHeaders();

        if (!suiteUrl || !authConfig) {
            return null;
        }

        try {
            // Create JQL query that searches in summary (title) and description fields
            const jql = `summary ~ "${query}" OR description ~ "${query}" ORDER BY updated DESC`;

            const response = await fetch(
                `${suiteUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`,
                authConfig
            );

            const jiraResponse = await this.handleApiResponse<JiraResponse>(response, 'Jira issues');
            return jiraResponse?.issues || null;
        } catch (error) {
            vscode.window.showErrorMessage(`Error searching Jira issues: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
}
