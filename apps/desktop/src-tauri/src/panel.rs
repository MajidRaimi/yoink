use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager};
use tauri_nspanel::{tauri_panel, ManagerExt, WebviewWindowExt};
use tauri_plugin_positioner::{Position, WindowExt};

pub const PANEL_LABEL: &str = "panel";

static LAST_HIDE: Mutex<Option<Instant>> = Mutex::new(None);

tauri_panel! {
    panel!(YoinkPanel {
        config: {
            can_become_key_window: true,
            can_become_main_window: false,
            is_floating_panel: true
        }
    })

    panel_event!(YoinkPanelEvents {
        window_did_resign_key(notification: &NSNotification) -> (),
    })
}

pub fn init(app: &AppHandle) {
    let Some(window) = app.get_webview_window(PANEL_LABEL) else {
        return;
    };
    let Ok(panel) = window.to_panel::<YoinkPanel>() else {
        return;
    };

    let handler = YoinkPanelEvents::new();
    let handle = app.clone();
    handler.window_did_resign_key(move |_| {
        hide(&handle);
    });
    panel.set_event_handler(Some(handler.as_ref()));
    std::mem::forget(handler);
}

pub fn is_visible(app: &AppHandle) -> bool {
    app.get_webview_window(PANEL_LABEL)
        .and_then(|w| w.is_visible().ok())
        .unwrap_or(false)
}

pub fn show(app: &AppHandle) {
    if let Some(window) = app.get_webview_window(PANEL_LABEL) {
        let _ = window.move_window(Position::TrayBottomCenter);
    }
    if let Ok(panel) = app.get_webview_panel(PANEL_LABEL) {
        panel.show_and_make_key();
    }
    let _ = app.emit("panel:shown", ());
}

pub fn hide(app: &AppHandle) {
    if !is_visible(app) {
        return;
    }
    *LAST_HIDE.lock().unwrap() = Some(Instant::now());
    if let Ok(panel) = app.get_webview_panel(PANEL_LABEL) {
        panel.hide();
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
