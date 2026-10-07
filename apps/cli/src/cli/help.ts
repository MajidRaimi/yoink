import pc from "picocolors";
import { theme } from "../shared/theme";

export const printHelp = (): void => {
  console.log(`${pc.bold("yoink")} ${pc.dim("· switch AI accounts and providers")}

${pc.bold("USAGE")}
  yoink                 Open the interactive account menu
  yoink ${theme.accent("<name>")}          Switch straight to a saved profile
  yoink add             Add a Claude, ChatGPT (Codex), Kimi Code, Gemini or Copilot login, or an API-key provider
  yoink edit ${theme.accent("<name>")}     Edit a profile (name, or provider/URL/key/model)
  yoink save ${theme.accent("<name>")}     Snapshot your current login as a profile (--tool ${theme.accent("<tool>")} for other CLIs)
  yoink use ${theme.accent("<name>")}      Switch to a saved profile inside its own tool (--force skips the running check)
  yoink connect ${theme.accent("<name>")}  Connect a provider to harnesses (pi, opencode, omp, codex, claude-code)
  yoink disconnect ${theme.accent("<name>")} Remove a provider from harnesses
  yoink models ${theme.accent("<name>")}   Choose which models a provider exposes, then re-sync
  yoink harnesses       Show detected harnesses and their providers
  yoink import          Import providers already configured in your harnesses
  yoink status ${theme.accent("<name>")}   Show each harness for a provider: installed, compatible, connected
  yoink presets         List built-in provider presets
  yoink probe           Detect a provider's endpoints and models (--base-url or --preset, key on stdin)
  yoink list            List all saved profiles, grouped by tool (--json)
  yoink current         Show the active profiles (--tool ${theme.accent("<tool>")}, --json)
  yoink rename ${theme.accent("<a> <b>")}  Rename a profile
  yoink remove ${theme.accent("<name>")}   Delete a profile
  yoink help            Show this help
  yoink version         Show the version

${pc.bold("TOOLS")}
  claude, codex (ChatGPT), kimi (Kimi Code), gemini, copilot (GitHub Copilot)
  yoink save ${theme.accent("<name>")} --tool ${theme.accent("<tool>")}   yoink current --tool ${theme.accent("<tool>")}   yoink accounts --json

${pc.bold("NON-INTERACTIVE (providers)")}
  yoink add --external --name ${theme.accent("<id>")} (--preset ${theme.accent("<p>")} | --base-url ${theme.accent("<u>")} [--protocol ${theme.accent("<p,...>")}] | --endpoint ${theme.accent("<p>=<url>,...")}) --models ${theme.accent("<m,...>")} [--connect ${theme.accent("<h,...>")}] [--default ${theme.accent("<m>")}] --token-stdin
  yoink connect ${theme.accent("<name>")} --to ${theme.accent("<h,...>")} [--default ${theme.accent("<m>")}]   yoink disconnect ${theme.accent("<name>")} --from ${theme.accent("<h,...>")}
  yoink models ${theme.accent("<name>")} --set ${theme.accent("<m,...>")}   yoink harnesses --json   yoink import --yes
  yoink presets --json   yoink status ${theme.accent("<name>")} --json
  yoink probe (--base-url ${theme.accent("<u>")} | --preset ${theme.accent("<p>")}) --token-stdin --json

${pc.bold("NON-INTERACTIVE (legacy Claude Code provider)")}
  yoink add --external --name ${theme.accent("<n>")} --provider ${theme.accent("<p>")} --base-url ${theme.accent("<u>")} --model ${theme.accent("<m>")} --token-stdin
  yoink edit ${theme.accent("<name>")} [--name ${theme.accent("<n>")}] [--provider ${theme.accent("<p>")}] [--base-url ${theme.accent("<u>")}] [--model ${theme.accent("<m>")}] [--token-stdin]
  ${pc.dim("--token-stdin reads the API key from stdin, e.g. `echo $KEY | yoink add --external ... --token-stdin`")}`);
};
