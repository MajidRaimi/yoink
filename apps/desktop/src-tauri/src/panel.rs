use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_positioner::{Position, WindowExt};

pub const PANEL_LABEL: &str = "panel";

static LAST_HIDE: Mutex<Option<Instant>> = Mutex::new(None);

pub fn init(app: &AppHandle) {
    let Some(window) = app.get_webview_window(PANEL_LABEL) else {
        return;
    };

    let handle = app.clone();
    window.on_window_event(move |event| {
        if let tauri::WindowEvent::Focused(false) = event {
            hide(&handle);
        }
    });
}

pub fn is_visible(app: &AppHandle) -> bool {
    app.get_webview_window(PANEL_LABEL)
        .and_then(|w| w.is_visible().ok())
        .unwrap_or(false)
}

pub fn show(app: &AppHandle) {
    let Some(window) = app.get_webview_window(PANEL_LABEL) else {
        return;
    };
    let _ = window.move_window(Position::TrayBottomCenter);
    let _ = window.show();
    let _ = window.set_focus();
    let _ = app.emit("panel:shown", ());
}

pub fn hide(app: &AppHandle) {
    let Some(window) = app.get_webview_window(PANEL_LABEL) else {
        return;
    };
    if window.is_visible().unwrap_or(false) {
        *LAST_HIDE.lock().unwrap() = Some(Instant::now());
        let _ = window.hide();
    }
}

pub fn toggle(app: &AppHandle) {
    if is_visible(app) {
        hide(app);
        return;
    }
    let recently_hidden = LAST_HIDE
        .lock()
        .unwrap()
        .is_some_and(|at| at.elapsed() < Duration::from_millis(200));
    if recently_hidden {
        return;
    }
    show(app);
}
