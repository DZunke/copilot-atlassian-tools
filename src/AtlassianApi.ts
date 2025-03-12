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
}
