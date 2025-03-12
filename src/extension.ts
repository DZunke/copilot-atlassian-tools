import * as vscode from 'vscode';
import { Settings } from './settings';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {

	// This logging is only posted once the extension was activated
	console.log('Congratulations, the extension to the world of Atlassian within Copilot is not active!');

    const openJiraCommand = vscode.commands.registerCommand('copilot-atlassian-tools.openJira', () => {
        const suiteUrl = Settings.getAtlassianSuiteUrl();
        if (suiteUrl) {
            vscode.env.openExternal(vscode.Uri.parse(`${suiteUrl}/jira`));
        }
    });

    const openConfluenceCommand = vscode.commands.registerCommand('copilot-atlassian-tools.openConfluence', () => {
        const suiteUrl = Settings.getAtlassianSuiteUrl();
        if (suiteUrl) {
            vscode.env.openExternal(vscode.Uri.parse(`${suiteUrl}/wiki`));
        }
    });

    context.subscriptions.push(openJiraCommand);
    context.subscriptions.push(openConfluenceCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
