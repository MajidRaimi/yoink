use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_updater::UpdaterExt;

pub fn check_in_background(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let Ok(updater) = app.updater() else { return };
        match updater.check().await {
            Ok(Some(update)) => {
                let downloaded = update.download_and_install(|_, _| {}, || {}).await;
                let body = if downloaded.is_ok() {
                    "Update installed. Restarting."
                } else {
                    "Update download failed."
                };
                let _ = app.notification().builder().title("Yoink").body(body).show();
                if downloaded.is_ok() {
                    app.restart();
                }
            }
            Ok(None) => {
                let _ = app
                    .notification()
                    .builder()
                    .title("Yoink")
                    .body("You are on the latest version.")
                    .show();
            }
            Err(_) => {
                let _ = app
                    .notification()
                    .builder()
                    .title("Yoink")
                    .body("Could not check for updates.")
                    .show();
            }
        }
    });
}
