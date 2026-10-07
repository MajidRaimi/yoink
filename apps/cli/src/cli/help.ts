import pc from "picocolors";
import { theme } from "../shared/theme";

export const printHelp = (): void => {
  console.log(`${pc.bold("yoink")} ${pc.dim("· switch Claude Code accounts")}

${pc.bold("USAGE")}
  yoink                 Open the interactive account menu
  yoink ${theme.accent("<name>")}          Switch straight to a saved profile
  yoink add             Add a Claude account or an API-key provider (OpenAI, Kimi, Fuse...)
  yoink edit ${theme.accent("<name>")}     Edit a profile (name, or provider/URL/key/model)
  yoink save ${theme.accent("<name>")}     Snapshot your current login as a profile
  yoink use ${theme.accent("<name>")}      Switch Claude Code to a saved profile
  yoink connect ${theme.accent("<name>")}  Connect a provider to harnesses (pi, opencode, omp, codex, claude-code)
  yoink disconnect ${theme.accent("<name>")} Remove a provider from harnesses
  yoink models ${theme.accent("<name>")}   Choose which models a provider exposes, then re-sync
  yoink harnesses       Show detected harnesses and their providers
  yoink import          Import providers already configured in your harnesses
  yoink list            List all saved profiles
  yoink current         Show the active profile
  yoink rename ${theme.accent("<a> <b>")}  Rename a profile
  yoink remove ${theme.accent("<name>")}   Delete a profile
  yoink help            Show this help
  yoink version         Show the version

${pc.bold("NON-INTERACTIVE (providers)")}
  yoink add --external --name ${theme.accent("<id>")} (--preset ${theme.accent("<p>")} | --base-url ${theme.accent("<u>")} [--protocol ${theme.accent("<p,...>")}]) --models ${theme.accent("<m,...>")} [--connect ${theme.accent("<h,...>")}] [--default ${theme.accent("<m>")}] --token-stdin
  yoink connect ${theme.accent("<name>")} --to ${theme.accent("<h,...>")} [--default ${theme.accent("<m>")}]   yoink disconnect ${theme.accent("<name>")} --from ${theme.accent("<h,...>")}
  yoink models ${theme.accent("<name>")} --set ${theme.accent("<m,...>")}   yoink harnesses --json   yoink import --yes

${pc.bold("NON-INTERACTIVE (legacy Claude Code provider)")}
  yoink add --external --name ${theme.accent("<n>")} --provider ${theme.accent("<p>")} --base-url ${theme.accent("<u>")} --model ${theme.accent("<m>")} --token-stdin
  yoink edit ${theme.accent("<name>")} [--name ${theme.accent("<n>")}] [--provider ${theme.accent("<p>")}] [--base-url ${theme.accent("<u>")}] [--model ${theme.accent("<m>")}] [--token-stdin]
  ${pc.dim("--token-stdin reads the API key from stdin, e.g. `echo $KEY | yoink add --external ... --token-stdin`")}`);
};
