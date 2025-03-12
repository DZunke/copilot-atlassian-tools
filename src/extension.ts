import * as vscode from 'vscode';
import { Settings } from './settings';
import { CommandManager } from './commands/CommandManager';
import { ConfluenceSearchTool } from './copilot/ConfluenceSearchTool';
import { JiraContentSearchTool } from './copilot/JiraContentSearchTool';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    // Log activation
    console.log('Congratulations, the extension to the world of Atlassian within Copilot is now active!');

    // Register all commands using the command manager
    const commandManager = new CommandManager();
    commandManager.registerCommands(context);

    // Register Toools
    context.subscriptions.push(vscode.lm.registerTool(ConfluenceSearchTool.ID, new ConfluenceSearchTool()));
    context.subscriptions.push(vscode.lm.registerTool(JiraContentSearchTool.ID, new JiraContentSearchTool()));
}

// This method is called when your extension is deactivated
export function deactivate() {}
