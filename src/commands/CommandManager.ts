import * as vscode from 'vscode';
import { OpenJiraCommand, SearchMyIssuesCommand } from './JiraCommands';
import { OpenConfluenceCommand, SearchMyPagesCommand } from './ConfluenceCommands';

export class CommandManager {
    private commands = [
        new OpenJiraCommand(),
        new OpenConfluenceCommand(),
        new SearchMyIssuesCommand(),
        new SearchMyPagesCommand()
    ];

    /**
     * Register all commands with VS Code
     * @param context The extension context
     */
    public registerCommands(context: vscode.ExtensionContext): void {
        this.commands.forEach(command => command.register(context));
    }
}
