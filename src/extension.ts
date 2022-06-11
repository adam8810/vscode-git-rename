// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from 'path';
import logger from "./logger";


let terminal: vscode.Terminal | undefined = undefined;
let channel: vscode.OutputChannel | undefined = undefined;

const TERMINAL_NAME = "Git rename";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Extension "git-rename" is now active.');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  // The code you place here will be executed every time your command is executed
  context.subscriptions.push(vscode.commands.registerCommand(
    "extension.git-rename",
    async file => gitMove(file).catch(err => vscode.window.showErrorMessage(err.message ?? err))
  ));

  context.subscriptions.push(vscode.window.onDidCloseTerminal(closedTerminal => {
    if (closedTerminal.processId === terminal?.processId) {
      // clear the cached terminal reference
      terminal = undefined;
    }
  }));

  // was the terminal window created in the previous session? reuse it!
  terminal = vscode.window.terminals
    .find(previousTerminal => previousTerminal.name === TERMINAL_NAME);
}

async function gitMove(file: vscode.Uri): Promise<void> {
  channel = channel ?? vscode.window.createOutputChannel("git-rename");
  const log = logger(channel);

  const wsFolder = vscode.workspace.getWorkspaceFolder(file);
  if (!wsFolder) {
    vscode.window.showErrorMessage('Selected file is not in a VS Code workspace, or no workspace folder is open.');
    return;
  }

  const relativePath = path.relative(wsFolder.uri.fsPath, file.fsPath);

  const newRelativePath = await vscode.window.showInputBox({
    value: relativePath
  });

  if (!newRelativePath || newRelativePath === "") {
    // canceled by user
    return;
  }

  const newPath = vscode.Uri.joinPath(wsFolder.uri, newRelativePath);

  const gitPath = getGitPath();
  const command = `${gitPath} mv "${file.fsPath}" "${newPath.fsPath}"`;
  log(command);

  terminal = terminal ?? vscode.window.createTerminal({
    cwd: wsFolder.uri.fsPath,
    name: TERMINAL_NAME
  });

  terminal.sendText(command);
  terminal.show(true);
}

function getGitPath(): string {
  const configuredGitPaths = vscode.workspace.getConfiguration().get<string | string[] | undefined>("git.path");

  if (!configuredGitPaths) {
    // assume it is in the environment _path_
    return "git";
  } else if (typeof configuredGitPaths === "string") {
    return configuredGitPaths;
  } else if (Array.isArray(configuredGitPaths)) {
    return configuredGitPaths[0];
  } else {
    vscode.window.showWarningMessage(`Configured git.path ${configuredGitPaths} is not supported. Using 'git'.`);
    return "git";
  }
}

// this method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {
  // no need to kill the process as VS Code will kill the Terminal
}
