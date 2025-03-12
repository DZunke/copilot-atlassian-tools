import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    suiteSetup(async function () {
        // Get the extension and ensure it's activated
        const extension = vscode.extensions.getExtension('DenisZunke.copilot-atlassian-tools');
        if (!extension) {
            throw new Error('Extension not found');
        }

        if (!extension.isActive) {
            await extension.activate();
        }

        vscode.window.showInformationMessage('Extension activated, starting tests');
    });

    test('Test Jira command registration', async () => {
        // Verify command exists
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('copilot-atlassian-tools.openJira'));
    });

    test('Test Confluence command registration', async () => {
        // Verify command exists
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('copilot-atlassian-tools.openConfluence'));
    });
});
