use crate::store::StoreDto;
use crate::{panel, pty, refresh, settings, sidecar};
use serde::Deserialize;
use tauri::{AppHandle, State};
use tauri_plugin_autostart::ManagerExt as AutostartManagerExt;
use tauri_plugin_notification::NotificationExt;

#[derive(Deserialize)]
pub struct ExternalInput {
    pub name: String,
    pub provider: String,
    #[serde(rename = "baseUrl")]
    pub base_url: String,
    pub model: String,
    pub token: Option<String>,
}

#[derive(serde::Serialize, Clone)]
pub struct SettingsDto {
    pub hotkey: String,
    pub autostart: bool,
}

async fn run_sidecar(args: Vec<String>) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || sidecar::run(&args))
        .await
        .map_err(|e| e.to_string())?
}

async fn run_sidecar_with_stdin(args: Vec<String>, stdin_data: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || sidecar::run_with_stdin(&args, &stdin_data))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn list_profiles() -> StoreDto {
    crate::store::load_store()
}

#[tauri::command]
pub async fn switch_profile(app: AppHandle, name: String) -> Result<(), String> {
    run_sidecar(vec!["use".into(), name.clone()]).await?;
    refresh(&app);
    let _ = app
        .notification()
        .builder()
        .title("yoink")
        .body(format!("Switched to {name}. Restart Claude Code to pick it up."))
        .show();
    Ok(())
}

#[tauri::command]
pub async fn rename_profile(app: AppHandle, from: String, to: String) -> Result<(), String> {
    run_sidecar(vec!["rename".into(), from, to]).await?;
    refresh(&app);
    Ok(())
}

#[tauri::command]
pub async fn remove_profile(app: AppHandle, name: String) -> Result<(), String> {
    run_sidecar(vec!["remove".into(), name]).await?;
    refresh(&app);
    Ok(())
}

#[tauri::command]
pub async fn save_profile(app: AppHandle, name: String) -> Result<(), String> {
    run_sidecar(vec!["save".into(), name]).await?;
    refresh(&app);
    Ok(())
}

#[tauri::command]
pub async fn add_external(app: AppHandle, input: ExternalInput) -> Result<(), String> {
    let mut args = vec![
        "add".to_string(),
        "--external".to_string(),
        "--name".to_string(),
        input.name,
        "--provider".to_string(),
        input.provider,
        "--base-url".to_string(),
        input.base_url,
        "--model".to_string(),
        input.model,
    ];
    let result = match input.token {
        Some(token) if !token.is_empty() => {
            args.push("--token-stdin".to_string());
            run_sidecar_with_stdin(args, token).await
        }
        _ => run_sidecar(args).await,
    };
    result?;
    refresh(&app);
    Ok(())
}

#[tauri::command]
pub async fn edit_external(app: AppHandle, name: String, input: ExternalInput) -> Result<(), String> {
    let mut args = vec![
        "edit".to_string(),
        name,
        "--name".to_string(),
        input.name,
        "--provider".to_string(),
        input.provider,
        "--base-url".to_string(),
        input.base_url,
        "--model".to_string(),
        input.model,
    ];
    let result = match input.token {
        Some(token) if !token.is_empty() => {
            args.push("--token-stdin".to_string());
            run_sidecar_with_stdin(args, token).await
        }
        _ => run_sidecar(args).await,
    };
    result?;
    refresh(&app);
    Ok(())
}

#[tauri::command]
pub async fn is_claude_running() -> bool {
    tauri::async_runtime::spawn_blocking(sidecar::is_claude_running)
        .await
        .unwrap_or(false)
}

#[tauri::command]
pub fn hide_panel(app: AppHandle) {
    panel::hide(&app);
}

#[tauri::command]
pub fn open_login_terminal(
    app: AppHandle,
    state: State<'_, pty::PtyState>,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    pty::open(&app, &state, cols, rows)
}

#[tauri::command]
pub fn write_pty(state: State<'_, pty::PtyState>, data: String) -> Result<(), String> {
    pty::write(&state, &data)
}

#[tauri::command]
pub fn resize_pty(state: State<'_, pty::PtyState>, cols: u16, rows: u16) -> Result<(), String> {
    pty::resize(&state, cols, rows)
}

#[tauri::command]
pub fn close_login_terminal(state: State<'_, pty::PtyState>) {
    pty::close(&state);
}

#[tauri::command]
pub fn get_settings(app: AppHandle) -> SettingsDto {
    let stored = settings::load();
    let autostart = app.autolaunch().is_enabled().unwrap_or(false);
    SettingsDto { hotkey: stored.hotkey, autostart }
}

#[tauri::command]
pub fn set_hotkey(app: AppHandle, accelerator: String) -> Result<(), String> {
    crate::register_hotkey(&app, &accelerator)?;
    settings::save(&settings::Settings { hotkey: accelerator })
}

#[tauri::command]
pub fn set_autostart(app: AppHandle, enabled: bool) -> Result<(), String> {
    let manager = app.autolaunch();
    let result = if enabled { manager.enable() } else { manager.disable() };
    result.map_err(|e| e.to_string())
}
