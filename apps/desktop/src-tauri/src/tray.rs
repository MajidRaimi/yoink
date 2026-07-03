use crate::panel;
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::AppHandle;
use tauri_plugin_autostart::ManagerExt as AutostartManagerExt;

pub const TRAY_ID: &str = "main";

pub fn truncate_title(name: &str) -> String {
    if name.chars().count() <= 16 {
        return name.to_string();
    }
    let head: String = name.chars().take(15).collect();
    format!("{head}\u{2026}")
}

pub fn init(app: &AppHandle) -> tauri::Result<()> {
    let autostart_item = MenuItemBuilder::with_id("autostart", "Launch at login")
        .build(app)?;
    let menu = MenuBuilder::new(app)
        .item(&autostart_item)
        .separator()
        .text("updates", "Check for updates")
        .separator()
        .text("quit", "Quit yoink")
        .build()?;

    TrayIconBuilder::with_id(TRAY_ID)
        .icon(tauri::include_image!("icons/tray-template.png"))
        .icon_as_template(true)
        .show_menu_on_left_click(false)
        .menu(&menu)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "quit" => app.exit(0),
            "autostart" => {
                let manager = app.autolaunch();
                let enabled = manager.is_enabled().unwrap_or(false);
                let result = if enabled { manager.disable() } else { manager.enable() };
                let _ = result;
            }
            "updates" => {
                crate::updates::check_in_background(app.clone());
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);
            if let TrayIconEvent::Click { button, button_state, .. } = event {
                if button == MouseButton::Left && button_state == MouseButtonState::Up {
                    panel::toggle(tray.app_handle());
                }
            }
        })
        .build(app)?;

    Ok(())
}

pub fn set_title(app: &AppHandle, current: Option<&str>) {
    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        let title = current.map(truncate_title);
        let _ = tray.set_title(title);
    }
}
