// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import logger from "./logger";
const spawnCMD = require("spawn-command");
const treeKill = require("tree-kill");

let process: any = null;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  let channel = vscode.window.createOutputChannel("git-rename");
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "git-rename" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  // The code you place here will be executed every time your command is executed
  let disposable = vscode.commands.registerCommand(
    "extension.git-rename",
    async file => {
      const log = logger(channel);
      let cwd;
      const folders = vscode.workspace.workspaceFolders;

      if (folders && folders[0]) {
        cwd = folders[0].uri.path;
      }
      else return;


      const dialogOptions: vscode.InputBoxOptions = {
        value: file.fsPath
      };

      const newPath = await vscode.window.showInputBox(dialogOptions);

      if (newPath == null || newPath === "") {
        return;
      }

      const command = `git mv "${file.fsPath}" "${newPath}"`;
      log(command);

      process = spawnCMD(command, { cwd });
      process.stdout.on("data", (buffer: Buffer) => log(buffer.toString()));

      process.stderr.on("data", (err: Buffer) => {
        const str = err.toString();
        log(str);
        vscode.window.showErrorMessage(str);
      });
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
  if (process) {
    treeKill(process.pid, "SIGTERM", function (err: any) {
      if (err) {
        treeKill(process.pid, "SIGKILL");
      }
      process = null;
    });
  }
}
