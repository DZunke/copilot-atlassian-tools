import * as vscode from 'vscode';
import { CommandBase } from './CommandBase';
import { Settings } from '../settings';
import { AtlassianApi } from '../AtlassianApi';

export class OpenConfluenceCommand extends CommandBase {
    protected readonly commandId = 'copilot-atlassian-tools.openConfluence';

    protected async execute(): Promise<void> {
        const suiteUrl = Settings.getAtlassianSuiteUrl();
        if (suiteUrl) {
            await vscode.env.openExternal(vscode.Uri.parse(`${suiteUrl}/wiki`));
        }
    }
}

export class SearchMyPagesCommand extends CommandBase {
    protected readonly commandId = 'copilot-atlassian-tools.searchMyPages';

    protected async execute(): Promise<void> {
        // Show loading indicator
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        statusBarItem.text = "$(sync~spin) Fetching your Confluence pages...";
        statusBarItem.show();

        try {
            const currentUser = await AtlassianApi.getCurrentUser();

            if (!currentUser) {
                return; // Error already displayed by the getCurrentUser method
            }

            statusBarItem.text = "$(sync~spin) Fetching your Confluence pages...";

            // Fetch pages authored or co-authored by the current user
            const response = await AtlassianApi.fetchConfluencePages(currentUser.accountId);

            if (!response || !response.results || response.results.length === 0) {
                vscode.window.showInformationMessage('No Confluence pages authored by you were found.');
                return;
            }

            // Format pages for the quick pick
            const items = response.results.map((page: any) => {
                return {
                    label: page.title,
                    description: `Last updated: ${new Date(page.history.lastUpdated.when).toLocaleString()}`,
                    detail: page.space ? `Space: ${page.space.name}` : 'Personal Space',
                    page: page
                };
            });

            // Show pages in quick pick
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: `Found ${items.length} Confluence pages authored by you`,
                matchOnDetail: true,
                matchOnDescription: true
            });

            if (selected) {
                // Get Atlassian suite URL
                const suiteUrl = Settings.getAtlassianSuiteUrl();
                if (suiteUrl) {
                    // Open the selected page in browser
                    const pageUrl = `${suiteUrl}/wiki${selected.page._links.webui}`;
                    await vscode.env.openExternal(vscode.Uri.parse(pageUrl));
                }
            }
        } finally {
            // Hide loading indicator
            statusBarItem.dispose();
        }
    }
}
