import * as vscode from 'vscode';
import { CommandBase } from './CommandBase';
import { Settings } from '../settings';
import { AtlassianApi } from '../AtlassianApi';

export class OpenJiraCommand extends CommandBase {
    protected readonly commandId = 'copilot-atlassian-tools.openJira';

    protected async execute(): Promise<void> {
        const suiteUrl = Settings.getAtlassianSuiteUrl();
        if (suiteUrl) {
            await vscode.env.openExternal(vscode.Uri.parse(`${suiteUrl}/jira`));
        }
    }
}

export class SearchMyIssuesCommand extends CommandBase {
    protected readonly commandId = 'copilot-atlassian-tools.searchMyIssues';

    protected async execute(): Promise<void> {
        // Show loading indicator
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        statusBarItem.text = "$(sync~spin) Fetching your Jira issues...";
        statusBarItem.show();

        try {
            const currentUser = await AtlassianApi.getCurrentUser();

            if (!currentUser) {
                return; // Error already displayed by the getCurrentUser method
            }

            statusBarItem.text = "$(sync~spin) Fetching your Jira issues...";

            // JQL query to find open issues assigned to the current user
            const jql = `assignee = "${currentUser.accountId}" AND resolution = Unresolved ORDER BY updated DESC`;

            // Fetch issues
            const response = await AtlassianApi.fetchJiraIssues(jql);

            if (!response || !response.issues || response.issues.length === 0) {
                vscode.window.showInformationMessage('No open issues assigned to you were found.');
                return;
            }

            // Format issues for the quick pick
            const items = response.issues.map((issue: any) => {
                return {
                    label: `${issue.key}: ${issue.fields.summary}`,
                    description: issue.fields.status.name,
                    detail: `${issue.fields.issuetype.name} | Priority: ${issue.fields.priority?.name || 'Not set'} | Updated: ${new Date(issue.fields.updated).toLocaleString()}`,
                    issue: issue
                };
            });

            // Show issues in quick pick
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: `Found ${items.length} open issues assigned to you`,
                matchOnDetail: true,
                matchOnDescription: true
            });

            if (selected) {
                // Get Atlassian suite URL
                const suiteUrl = Settings.getAtlassianSuiteUrl();
                if (suiteUrl) {
                    // Open the selected issue in browser
                    const issueUrl = `${suiteUrl}/browse/${selected.issue.key}`;
                    await vscode.env.openExternal(vscode.Uri.parse(issueUrl));
                }
            }
        } finally {
            // Hide loading indicator
            statusBarItem.dispose();
        }
    }
}
