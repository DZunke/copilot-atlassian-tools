# Copilot Atlassian Tools

Copilot Atlassian Tools bridges the gap between your Atlassian workspace and GitHub Copilot in VS Code. It allows Copilot to leverage your team's Confluence documentation and Jira issues as additional context when answering your coding questions.

## Features

### Copilot Integration

- **Confluence Knowledge Base**: Access information from your Confluence pages directly in Copilot Chat
- **Jira Issue Context**: Pull relevant details from Jira issues related to your queries
- **Enhanced Responses**: Get more contextual and project-specific answers from Copilot

### Quick Access

- **Search My Jira Issues**: Quickly find and open your assigned Jira tickets
- **Browse Recent Confluence Pages**: Access your recently updated Confluence pages
- **One-Click Navigation**: Open Jira or Confluence directly from VS Code

## Requirements

- VS Code 1.98.0 or higher
- GitHub Copilot extension
- Active Atlassian account with API access

## Installation

1. Download the `vsix` file from the latest release and install it or install from [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=DenisZunke.copilot-atlassian-tools&ssr=false#overview)
2. Configure your Atlassian credentials in settings:
   - Atlassian Suite URL (e.g., `https://your-domain.atlassian.net`)
   - Atlassian Email
   - Atlassian API Token ([Get one here](https://id.atlassian.com/manage-profile/security/api-tokens))

## Configuration

```json
{
  "copilot-atlassian-tools.atlassianSuiteUrl": "https://your-domain.atlassian.net",
  "copilot-atlassian-tools.atlassianEmail": "your.email@example.com",
  "copilot-atlassian-tools.atlassianOAuthToken": "your-api-token"
}
```

## Usage

### Copilot Tools

You have to tell copilot it should ask the tools of this extension for more context. So the tools `#jira` and `#confluence` are available and will do requests to your configured atlassian api.

### Commands

- `Copilot Atlassian Tools: Open Jira` - Opens Jira in your default browser
- `Copilot Atlassian Tools: Open Confluence` - Opens Confluence in your default browser
- `Copilot Atlassian Tools: Show My Open Issues` - Shows a list of your assigned Jira issues
- `Copilot Atlassian Tools: Show My Recent Pages` - Shows a list of your recent Confluence pages

## Security
Your Atlassian credentials are stored in VS Code's secure storage and are only used to communicate with the Atlassian API. No data is sent to third parties.

## Known Issues
This extension is currently a prototype and may have stability issues
Some Confluence content formats may not be properly parsed
Complex Jira queries may timeout or return incomplete results

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements
GitHub Copilot
Atlassian API
VS Code Extension API

<p align="center"> Made with ❤️ by <a href="https://github.com/DZunke">Denis Zunke</a></p>
