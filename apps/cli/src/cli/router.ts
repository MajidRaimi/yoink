import { YoinkError } from "../shared/errors";
import { theme } from "../shared/theme";
import { runMenu } from "../features/menu/run-menu";
import { printHelp } from "./help";
import { VERSION } from "./version";
import {
  handleAdd,
  handleCurrent,
  handleEdit,
  handleList,
  handleRemove,
  handleRename,
  handleSave,
  handleUse,
} from "./commands";
import { handlePresets, handleProbe, handleStatus } from "./json-commands";
import { handleConnect, handleDisconnect, handleHarnesses, handleImport, handleModels } from "./provider-commands";

export const run = async (argv: string[]): Promise<void> => {
  const [command, ...rest] = argv;
  try {
    switch (command) {
      case undefined:
        await runMenu();
        break;
      case "add":
      case "login":
        await handleAdd(rest);
        break;
      case "edit":
        await handleEdit(rest);
        break;
      case "save":
        await handleSave(rest);
        break;
      case "use":
      case "switch":
        await handleUse(rest);
        break;
      case "list":
      case "ls":
        await handleList();
        break;
      case "current":
      case "who":
        await handleCurrent();
        break;
      case "rename":
        await handleRename(rest);
        break;
      case "remove":
      case "rm":
        await handleRemove(rest);
        break;
      case "connect":
        await handleConnect(rest);
        break;
      case "disconnect":
        await handleDisconnect(rest);
        break;
      case "harnesses":
        await handleHarnesses(rest);
        break;
      case "models":
        await handleModels(rest);
        break;
      case "import":
        await handleImport(rest);
        break;
      case "presets":
        handlePresets(rest);
        break;
      case "probe":
        await handleProbe(rest);
        break;
      case "status":
        await handleStatus(rest);
        break;
      case "help":
      case "-h":
      case "--help":
        printHelp();
        break;
      case "version":
      case "-v":
      case "--version":
        console.log(VERSION);
        break;
      default:
        await handleUse([command, ...rest]);
    }
  } catch (error) {
    if (error instanceof YoinkError) {
      console.error(`${theme.error("✖")} ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
};
