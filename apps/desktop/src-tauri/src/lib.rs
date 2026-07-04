mod commands;
mod panel;
mod pty;
mod settings;
mod sidecar;
mod store;
mod tray;
mod updates;
mod watcher;

use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

static EXPLICIT_QUIT: AtomicBool = AtomicBool::new(false);

pub fn quit(app: &AppHandle) {
    EXPLICIT_QUIT.store(true, Ordering::SeqCst);
    app.exit(0);
}

#[cfg(target_os = "macos")]
fn prevent_system_termination() {
    use objc2_foundation::{NSProcessInfo, NSString};
    let info = NSProcessInfo::processInfo();
    info.disableSuddenTermination();
    info.disableAutomaticTermination(&NSString::from_str("yoink runs as a menu bar app"));
}

#[cfg(target_os = "macos")]
fn inherit_login_shell_path() {
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
    let output = std::process::Command::new(shell)
        .args(["-lc", "printf %s \"$PATH\""])
        .output();
    if let Ok(output) = output {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() {
                std::env::set_var("PATH", path);
            }
        }
    }
}

pub fn refresh(app: &AppHandle) {
    let store = store::load_store();
    let _ = app.emit("profiles:changed", store);
}

pub fn register_hotkey(app: &AppHandle, accelerator: &str) -> Result<(), String> {
    let shortcut: Shortcut = accelerator.parse().map_err(|_| format!("invalid shortcut: {accelerator}"))?;
    let previous = settings::load().hotkey;
    let manager = app.global_shortcut();
    let _ = manager.unregister_all();
    let handler = |handle: &AppHandle, _: &Shortcut, event: tauri_plugin_global_shortcut::ShortcutEvent| {
        if event.state() == ShortcutState::Pressed {
            panel::toggle(handle);
        }
    };
    if let Err(error) = manager.on_shortcut(shortcut, handler) {
        if let Ok(fallback) = previous.parse::<Shortcut>() {
            let _ = manager.on_shortcut(fallback, handler);
        }
        return Err(error.to_string());
    }
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_nspanel::init())
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            panel::show(app);
        }))
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(pty::PtyState::default())
        .invoke_handler(tauri::generate_handler![
            commands::list_profiles,
            commands::switch_profile,
            commands::rename_profile,
            commands::remove_profile,
            commands::save_profile,
            commands::add_external,
            commands::edit_external,
            commands::is_claude_running,
            commands::hide_panel,
            commands::open_login_terminal,
            commands::write_pty,
            commands::resize_pty,
            commands::close_login_terminal,
            commands::get_settings,
            commands::set_hotkey,
            commands::set_autostart,
        ])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
                prevent_system_termination();
                inherit_login_shell_path();
            }

            let handle = app.handle().clone();
            tray::init(&handle)?;
            panel::init(&handle);
            watcher::spawn(handle.clone());
            refresh(&handle);

            let hotkey = settings::load().hotkey;
            if let Err(error) = register_hotkey(&handle, &hotkey) {
                eprintln!("hotkey registration failed: {error}");
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building yoink desktop")
        .run(|app, event| {
            if let tauri::RunEvent::ExitRequested { api, .. } = event {
                if EXPLICIT_QUIT.load(Ordering::SeqCst) {
                    let state: tauri::State<'_, pty::PtyState> = app.state();
                    pty::close(&state);
                } else {
                    api.prevent_exit();
                }
            }
        });
}
