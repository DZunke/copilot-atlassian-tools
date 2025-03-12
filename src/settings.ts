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
}
