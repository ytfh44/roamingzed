use zed_extension_api::{self as zed, SlashCommand, SlashCommandOutput, SlashCommandOutputSection};

/// RoamingZed Extension - Bidirectional wikilink AI integration for Zed
struct RoamingZedExtension;

impl zed::Extension for RoamingZedExtension {
    fn new() -> Self {
        RoamingZedExtension
    }

    /// Start the MCP context server via npx
    /// The MCP server will auto-detect workspace from current directory
    fn context_server_command(
        &mut self,
        _context_server_id: &zed::ContextServerId,
        _project: &zed::Project,
    ) -> zed::Result<zed::Command> {
        Ok(zed::Command {
            command: "npx".to_string(),
            args: vec!["roamingzed-mcp".to_string()],
            env: vec![],
        })
    }

    /// Handle slash command execution
    fn run_slash_command(
        &self,
        command: SlashCommand,
        args: Vec<String>,
        worktree: Option<&zed::Worktree>,
    ) -> zed::Result<SlashCommandOutput> {
        match command.name.as_str() {
            "backlinks" => self.run_backlinks_command(args, worktree),
            "graph" => self.run_graph_command(args, worktree),
            "related" => self.run_related_command(args, worktree),
            _ => Err(format!("Unknown command: {}", command.name)),
        }
    }

    /// Provide completions for slash command arguments
    fn complete_slash_command_argument(
        &self,
        command: SlashCommand,
        _args: Vec<String>,
    ) -> Result<Vec<zed::SlashCommandArgumentCompletion>, String> {
        match command.name.as_str() {
            "related" => {
                // TODO: Integrate with MCP server to provide note completions
                Ok(vec![])
            }
            _ => Ok(vec![]),
        }
    }
}

impl RoamingZedExtension {
    /// Execute /backlinks command
    fn run_backlinks_command(
        &self,
        _args: Vec<String>,
        worktree: Option<&zed::Worktree>,
    ) -> zed::Result<SlashCommandOutput> {
        let workspace_info = worktree
            .map(|w| w.root_path())
            .unwrap_or_else(|| "current workspace".to_string());

        let text = format!(
            "# Backlinks\n\n\
            *Querying backlinks for current file in: {}*\n\n\
            > **Tip**: Use the AI assistant with `@roamingzed` context for rich backlink queries.\n\n\
            Example prompts:\n\
            - \"What pages link to this file?\"\n\
            - \"Show me all backlinks to [[topic]]\"\n\
            - \"Find notes that reference this concept\"",
            workspace_info
        );

        Ok(SlashCommandOutput {
            text: text.clone(),
            sections: vec![SlashCommandOutputSection {
                range: (0..text.len()).into(),
                label: "Backlinks".to_string(),
            }],
        })
    }

    /// Execute /graph command
    fn run_graph_command(
        &self,
        _args: Vec<String>,
        worktree: Option<&zed::Worktree>,
    ) -> zed::Result<SlashCommandOutput> {
        let workspace_info = worktree
            .map(|w| w.root_path())
            .unwrap_or_else(|| "current workspace".to_string());

        let text = format!(
            "# Link Graph\n\n\
            *Generating link graph for: {}*\n\n\
            > **Tip**: Use the AI assistant with `@roamingzed` context to explore the graph.\n\n\
            Example prompts:\n\
            - \"Show me the link graph around this file\"\n\
            - \"What notes are connected to [[topic]]?\"\n\
            - \"Visualize connections within 2 hops\"",
            workspace_info
        );

        Ok(SlashCommandOutput {
            text: text.clone(),
            sections: vec![SlashCommandOutputSection {
                range: (0..text.len()).into(),
                label: "Link Graph".to_string(),
            }],
        })
    }

    /// Execute /related command
    fn run_related_command(
        &self,
        args: Vec<String>,
        worktree: Option<&zed::Worktree>,
    ) -> zed::Result<SlashCommandOutput> {
        let query = args.join(" ");
        if query.is_empty() {
            return Err("Usage: /related <query>".to_string());
        }

        let workspace_info = worktree
            .map(|w| w.root_path())
            .unwrap_or_else(|| "current workspace".to_string());

        let text = format!(
            "# Related Notes\n\n\
            *Searching for notes related to: \"{}\"*\n\
            *Workspace: {}*\n\n\
            > **Tip**: Use the AI assistant with `@roamingzed` context for semantic search.\n\n\
            Example prompts:\n\
            - \"Find notes related to {}\"\n\
            - \"What topics connect to {}?\"\n\
            - \"Show notes that might be relevant to {}\"",
            query, workspace_info, query, query, query
        );

        Ok(SlashCommandOutput {
            text: text.clone(),
            sections: vec![SlashCommandOutputSection {
                range: (0..text.len()).into(),
                label: format!("Related: {}", query),
            }],
        })
    }
}

zed::register_extension!(RoamingZedExtension);
