use crate::panel;
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::AppHandle;
use tauri_plugin_autostart::ManagerExt as AutostartManagerExt;

pub const TRAY_ID: &str = "main";

pub fn init(app: &AppHandle) -> tauri::Result<()> {
    let autostart_item = MenuItemBuilder::with_id("autostart", "Launch at login")
        .build(app)?;
    let menu = MenuBuilder::new(app)
        .item(&autostart_item)
        .separator()
        .text("updates", "Check for updates")
        .separator()
        .text("quit", "Quit Yoink")
        .build()?;

    TrayIconBuilder::with_id(TRAY_ID)
        .icon(tauri::include_image!("icons/tray-template.png"))
        .icon_as_template(true)
        .show_menu_on_left_click(false)
        .menu(&menu)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "quit" => crate::quit(app),
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
