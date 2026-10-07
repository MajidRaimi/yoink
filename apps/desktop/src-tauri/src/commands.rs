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

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProbeInput {
    pub base_url: Option<String>,
    pub preset: Option<String>,
    pub token: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EndpointInput {
    pub protocol: String,
    pub base_url: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddProviderInput {
    pub name: String,
    pub display_name: Option<String>,
    pub preset: Option<String>,
    pub base_url: Option<String>,
    #[serde(default)]
    pub protocols: Vec<String>,
    #[serde(default)]
    pub endpoints: Vec<EndpointInput>,
    #[serde(default)]
    pub models: Vec<String>,
    #[serde(default)]
    pub connect: Vec<String>,
    pub default_model: Option<String>,
    pub token: String,
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

fn parse_json(stdout: &str) -> Result<serde_json::Value, String> {
    serde_json::from_str(stdout.trim()).map_err(|e| format!("unexpected output from yoink: {e}"))
}

fn push_option(args: &mut Vec<String>, flag: &str, value: Option<String>) {
    if let Some(value) = value.filter(|value| !value.is_empty()) {
        args.push(flag.to_string());
        args.push(value);
    }
}

fn push_list(args: &mut Vec<String>, flag: &str, values: &[String]) {
    if !values.is_empty() {
        args.push(flag.to_string());
        args.push(values.join(","));
    }
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
        .title("Yoink")
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
pub async fn list_presets() -> Result<serde_json::Value, String> {
    let stdout = run_sidecar(vec!["presets".into(), "--json".into()]).await?;
    parse_json(&stdout)
}

#[tauri::command]
pub async fn probe_provider(input: ProbeInput) -> Result<serde_json::Value, String> {
    let mut args = vec!["probe".to_string()];
    match (input.preset.filter(|p| !p.is_empty()), input.base_url.filter(|u| !u.is_empty())) {
        (Some(preset), _) => {
            args.push("--preset".to_string());
            args.push(preset);
        }
        (None, Some(base_url)) => {
            args.push("--base-url".to_string());
            args.push(base_url);
        }
        (None, None) => return Err("a preset or a base URL is required".to_string()),
    }
    args.push("--token-stdin".to_string());
    args.push("--json".to_string());
    let stdout = run_sidecar_with_stdin(args, input.token).await?;
    parse_json(&stdout)
}

#[tauri::command]
pub async fn provider_harnesses(name: String) -> Result<serde_json::Value, String> {
    let stdout = run_sidecar(vec!["status".into(), name, "--json".into()]).await?;
    parse_json(&stdout)
}

#[tauri::command]
pub async fn add_provider(app: AppHandle, input: AddProviderInput) -> Result<(), String> {
    let mut args = vec![
        "add".to_string(),
        "--external".to_string(),
        "--name".to_string(),
        input.name,
    ];
    push_option(&mut args, "--provider", input.display_name);
    push_option(&mut args, "--preset", input.preset);
    push_option(&mut args, "--base-url", input.base_url);
    push_list(&mut args, "--protocol", &input.protocols);
    let endpoints: Vec<String> = input
        .endpoints
        .into_iter()
        .map(|endpoint| format!("{}={}", endpoint.protocol, endpoint.base_url))
        .collect();
    push_list(&mut args, "--endpoint", &endpoints);
    push_list(&mut args, "--models", &input.models);
    push_list(&mut args, "--connect", &input.connect);
    push_option(&mut args, "--default", input.default_model);
    args.push("--token-stdin".to_string());
    let result = run_sidecar_with_stdin(args, input.token).await;
    refresh(&app);
    result.map(|_| ())
}

#[tauri::command]
pub async fn connect_provider(
    app: AppHandle,
    name: String,
    harnesses: Vec<String>,
    default_model: Option<String>,
) -> Result<(), String> {
    let mut args = vec!["connect".to_string(), name];
    push_list(&mut args, "--to", &harnesses);
    push_option(&mut args, "--default", default_model);
    let result = run_sidecar(args).await;
    refresh(&app);
    result.map(|_| ())
}

#[tauri::command]
pub async fn disconnect_provider(app: AppHandle, name: String, harnesses: Vec<String>) -> Result<(), String> {
    let mut args = vec!["disconnect".to_string(), name];
    push_list(&mut args, "--from", &harnesses);
    let result = run_sidecar(args).await;
    refresh(&app);
    result.map(|_| ())
}

#[tauri::command]
pub async fn set_provider_models(app: AppHandle, name: String, models: Vec<String>) -> Result<(), String> {
    let mut args = vec!["models".to_string(), name];
    push_list(&mut args, "--set", &models);
    let result = run_sidecar(args).await;
    refresh(&app);
    result.map(|_| ())
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
