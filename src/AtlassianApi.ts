import { ConfluenceService } from './services/ConfluenceService';
import { JiraService } from './services/JiraService';
import { UserService } from './services/UserService';
import { ConfluencePage, ConfluenceResponse } from './types/ConfluenceTypes';
import { JiraIssue, JiraResponse } from './types/JiraTypes';

export { ConfluencePage, ConfluenceResponse, JiraIssue, JiraResponse };

export class AtlassianApi {
    // Forward Jira methods
    public static fetchJiraIssues(jql: string): Promise<JiraResponse | null> {
        return JiraService.fetchJiraIssues(jql);
    }

    public static searchJiraIssues(query: string, maxResults: number = 10): Promise<JiraIssue[] | null> {
        return JiraService.searchJiraIssues(query, maxResults);
    }

    // Forward Confluence methods
    public static fetchConfluencePages(accountId: string): Promise<ConfluenceResponse | null> {
        return ConfluenceService.fetchConfluencePages(accountId);
    }

    public static searchConfluenceContent(query: string, maxResults: number = 10): Promise<ConfluencePage[] | null> {
        return ConfluenceService.searchConfluenceContent(query, maxResults);
    }

    // Forward User methods
    public static getCurrentUser(): Promise<any> {
        return UserService.getCurrentUser();
    }
}
