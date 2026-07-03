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

export const run = async (argv: string[]): Promise<void> => {
  const [command, ...rest] = argv;
  try {
    switch (command) {
      case undefined:
        await runMenu();
        break;
      case "add":
      case "login":
        await handleAdd();
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
