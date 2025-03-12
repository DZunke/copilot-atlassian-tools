import * as vscode from 'vscode';

export abstract class CommandBase {
    /**
     * The command ID
     */
    protected abstract readonly commandId: string;

    /**
     * Execute the command logic
     */
    protected abstract execute(...args: any[]): Promise<any>;

    /**
     * Register this command with VS Code
     * @param context The extension context
     * @returns The disposable registration
     */
    public register(context: vscode.ExtensionContext): vscode.Disposable {
        const disposable = vscode.commands.registerCommand(this.commandId, async (...args: any[]) => {
            try {
                await this.execute(...args);
            } catch (error) {
                vscode.window.showErrorMessage(`Command error: ${error instanceof Error ? error.message : String(error)}`);
            }
        });

        context.subscriptions.push(disposable);
        return disposable;
    }
}
