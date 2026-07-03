import { useEffect, useRef } from "react";
import { Terminal, type ITheme } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { ipc, onTerminalOutput, onTerminalExit } from "@/shared/ipc";

const glassTheme: ITheme = {
  background: "#00000000",
  foreground: "#f5f4f2",
  cursor: "#facc15",
  cursorAccent: "#0a0908",
  selectionBackground: "rgba(250, 204, 21, 0.25)",
  scrollbarSliderBackground: "rgba(250, 204, 21, 0.25)",
  scrollbarSliderHoverBackground: "rgba(250, 204, 21, 0.4)",
  black: "#1c1a18",
  red: "#f87171",
  green: "#4ade80",
  yellow: "#facc15",
  blue: "#93c5fd",
  magenta: "#d8b4fe",
  cyan: "#67e8f9",
  white: "#e7e5e4",
  brightBlack: "#78716c",
  brightRed: "#fca5a5",
  brightGreen: "#86efac",
  brightYellow: "#fde68a",
  brightBlue: "#bfdbfe",
  brightMagenta: "#e9d5ff",
  brightCyan: "#a5f3fc",
  brightWhite: "#faf9f7",
};

interface UsePtyOptions {
  onExit: (code: number) => void;
}

export const usePty = ({ onExit }: UsePtyOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;
  const sessionOpenRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || sessionOpenRef.current) return;
    sessionOpenRef.current = true;

    let exited = false;

    const terminal = new Terminal({
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontSize: 12,
      lineHeight: 1.35,
      cursorBlink: true,
      allowTransparency: true,
      theme: glassTheme,
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(container);
    fitAddon.fit();

    const inputDisposable = terminal.onData((data) => {
      if (exited) return;
      ipc.writePty(data).catch(() => undefined);
    });
    const unlistenOutput = onTerminalOutput((data) => {
      terminal.write(data);
    });
    const unlistenExit = onTerminalExit((code) => {
      exited = true;
      onExitRef.current(code);
    });

    ipc.openLoginTerminal(terminal.cols, terminal.rows).catch(() => undefined);

    const observer = new ResizeObserver(() => {
      if (exited) return;
      fitAddon.fit();
      ipc.resizePty(terminal.cols, terminal.rows).catch(() => undefined);
    });
    observer.observe(container);

    terminal.focus();

    return () => {
      observer.disconnect();
      inputDisposable.dispose();
      terminal.dispose();
      void unlistenOutput.then((unlisten) => unlisten());
      void unlistenExit.then((unlisten) => unlisten());
      if (!exited) {
        ipc.closeLoginTerminal().catch(() => undefined);
      }
      sessionOpenRef.current = false;
    };
  }, []);

  return containerRef;
};
