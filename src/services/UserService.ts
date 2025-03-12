import * as vscode from 'vscode';
import { BaseApiService } from './BaseApiService';

export class UserService extends BaseApiService {
    public static async getCurrentUser(): Promise<any> {
        const suiteUrl = this.getSuiteUrl();
        const authConfig = this.getAuthHeaders();

        if (!suiteUrl || !authConfig) {
            return null;
        }

        try {
            const response = await fetch(`${suiteUrl}/rest/api/3/myself`, authConfig);
            return await this.handleApiResponse<any>(response, 'user info');
        } catch (error) {
            vscode.window.showErrorMessage(`Error fetching user info: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
}
