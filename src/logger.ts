import { OutputChannel } from "vscode";
export default function logger(channel: OutputChannel) {
  return function(str: string) {
    console.log(str);
    channel.appendLine(str);
  };
}
