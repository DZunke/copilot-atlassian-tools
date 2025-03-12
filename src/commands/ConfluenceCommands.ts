import * as vscode from 'vscode';
import { CommandBase } from './CommandBase';
import { Settings } from '../settings';

export class OpenConfluenceCommand extends CommandBase {
    protected readonly commandId = 'copilot-atlassian-tools.openConfluence';

    protected async execute(): Promise<void> {
        const suiteUrl = Settings.getAtlassianSuiteUrl();
        if (suiteUrl) {
            await vscode.env.openExternal(vscode.Uri.parse(`${suiteUrl}/wiki`));
        }
    }
}
