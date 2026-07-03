use crate::sidecar;
use portable_pty::{native_pty_system, ChildKiller, CommandBuilder, MasterPty, PtySize};
use std::io::{Read, Write};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter};

pub struct PtySession {
    writer: Box<dyn Write + Send>,
    master: Box<dyn MasterPty + Send>,
    killer: Box<dyn ChildKiller + Send + Sync>,
}

#[derive(Default)]
pub struct PtyState(Mutex<Option<PtySession>>);

static CURRENT_GENERATION: AtomicU64 = AtomicU64::new(0);

pub fn open(app: &AppHandle, state: &PtyState, cols: u16, rows: u16) -> Result<(), String> {
    close(state);

    let generation = CURRENT_GENERATION.fetch_add(1, Ordering::SeqCst) + 1;

    let pty_system = native_pty_system();
    let pair = pty_system
        .openpty(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })
        .map_err(|e| e.to_string())?;

    let mut cmd = CommandBuilder::new(sidecar::sidecar_path()?);
    cmd.arg("add");
    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");
    if let Some(home) = std::env::var_os("HOME") {
        cmd.env("HOME", home);
    }

    let mut child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
    drop(pair.slave);

    let killer = child.clone_killer();
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;
    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;

    let output_app = app.clone();
    std::thread::spawn(move || {
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) | Err(_) => break,
                Ok(n) => {
                    if CURRENT_GENERATION.load(Ordering::SeqCst) != generation {
                        break;
                    }
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    let _ = output_app.emit("terminal:output", data);
                }
            }
        }
    });

    let exit_app = app.clone();
    std::thread::spawn(move || {
        let code = child.wait().map(|status| status.exit_code()).unwrap_or(1);
        if CURRENT_GENERATION.load(Ordering::SeqCst) == generation {
            let _ = exit_app.emit("terminal:exit", code);
        }
    });

    *state.0.lock().unwrap() = Some(PtySession {
        writer,
        master: pair.master,
        killer,
    });

    Ok(())
}

pub fn write(state: &PtyState, data: &str) -> Result<(), String> {
    let mut guard = state.0.lock().unwrap();
    let session = guard.as_mut().ok_or_else(|| "no login session".to_string())?;
    session.writer.write_all(data.as_bytes()).map_err(|e| e.to_string())
}

pub fn resize(state: &PtyState, cols: u16, rows: u16) -> Result<(), String> {
    let guard = state.0.lock().unwrap();
    let session = guard.as_ref().ok_or_else(|| "no login session".to_string())?;
    session
        .master
        .resize(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })
        .map_err(|e| e.to_string())
}

pub fn close(state: &PtyState) {
    if let Some(mut session) = state.0.lock().unwrap().take() {
        CURRENT_GENERATION.fetch_add(1, Ordering::SeqCst);
        let _ = session.killer.kill();
    }
}
