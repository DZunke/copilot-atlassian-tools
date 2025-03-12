import * as vscode from 'vscode';

export class Settings {
    private static readonly EXTENSION_ID = 'copilot-atlassian-tools';

    private static getConfig(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration(this.EXTENSION_ID);
    }

    public static getAtlassianSuiteUrl(): string | undefined {
        const suiteUrl = this.getConfig().get<string>('atlassianSuiteUrl');

        if (!suiteUrl) {
            // Show an error as a notification having a button to directly open the extension settings
            vscode.window.showErrorMessage(
                'Atlassian Suite URL is not configured.',
                'Open Settings'
            ).then(selection => {
                if (selection === 'Open Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'copilot-atlassian-tools.atlassianSuiteUrl');
                }
            });
            return undefined;
        }

        return suiteUrl;
    }

    // Get the OAuth token from settings
    public static getAtlassianOAuthToken(): string | undefined {
        const token = this.getConfig().get<string>('atlassianOAuthToken');

        if (!token) {
            vscode.window.showErrorMessage(
                'Atlassian OAuth token is not configured.',
                'Open Settings'
            ).then(selection => {
                if (selection === 'Open Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'copilot-atlassian-tools.atlassianOAuthToken');
                }
            });
            return undefined;
        }

        return token;
    }

    public static getAtlassianEmail(): string | undefined {
        const email = this.getConfig().get<string>('atlassianEmail');

        if (!email) {
            vscode.window.showErrorMessage(
                'Atlassian email is not configured.',
                'Open Settings'
            ).then(selection => {
                if (selection === 'Open Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'copilot-atlassian-tools.atlassianEmail');
                }
            });
            return undefined;
        }

        return email;
    }
}
