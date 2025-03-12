import * as vscode from 'vscode';
import { Settings } from '../settings';

export class BaseApiService {
    protected static getAuthHeaders(): { headers: Record<string, string> } | null {
        const suiteUrl = Settings.getAtlassianSuiteUrl();
        const token = Settings.getAtlassianOAuthToken();
        const email = Settings.getAtlassianEmail();

        if (!suiteUrl || !token || !email) {
            return null; // Error messages already shown in the settings methods
        }

        const auth = Buffer.from(`${email}:${token}`).toString('base64');
        return {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            }
        };
    }

    protected static async handleApiResponse<T>(response: Response, context: string): Promise<T | null> {
        if (!response.ok) {
            if (response.status === 403) {
                vscode.window.showErrorMessage(
                    `Permission denied (403): Your API token doesn't have sufficient permissions to access ${context}.`,
                    'Check Documentation'
                ).then(selection => {
                    if (selection === 'Check Documentation') {
                        const url = context.includes('Jira')
                            ? 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/#permissions'
                            : 'https://developer.atlassian.com/cloud/confluence/rest/v1/intro/';
                        vscode.env.openExternal(vscode.Uri.parse(url));
                    }
                });
            } else if (response.status === 401) {
                vscode.window.showErrorMessage('Authentication failed. Your Atlassian token may be invalid or expired.');
            } else if (response.status === 400) {
                const errorData = await response.json();
                const errorMessage = 'errorMessages' in (errorData as any)
                    ? `JQL syntax error: (errorData as any).errorMessages?.join(', ') || 'Invalid query'`
                    : `Syntax error: (errorData as any).message || 'Invalid query'`;
                vscode.window.showErrorMessage(errorMessage);
            } else {
                const errorText = await response.text();
                vscode.window.showErrorMessage(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
            }
            return null;
        }

        return await response.json() as T;
    }

    protected static stripHtml(html: string): string {
        if (!html) {return '';}

        return html
            .replace(/<[^>]*>/g, ' ')  // Replace HTML tags with space
            .replace(/\s+/g, ' ')      // Normalize whitespace
            .trim();                   // Remove leading/trailing whitespace
    }

    protected static getSuiteUrl(): string | null {
        return Settings.getAtlassianSuiteUrl() ?? null;
    }
}
