import * as vscode from 'vscode';
import { Settings } from './settings';
import { CommandManager } from './commands/CommandManager';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    // Log activation
    console.log('Congratulations, the extension to the world of Atlassian within Copilot is now active!');

    // Register all commands using the command manager
    const commandManager = new CommandManager();
    commandManager.registerCommands(context);
}

// This method is called when your extension is deactivated
export function deactivate() {}
