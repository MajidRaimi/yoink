use crate::refresh;
use crate::store;
use notify::{RecursiveMode, Watcher};
use std::sync::mpsc;
use std::time::{Duration, Instant};
use tauri::AppHandle;

pub fn spawn(app: AppHandle) {
    std::thread::spawn(move || {
        let dir = store::yoink_dir();
        let _ = std::fs::create_dir_all(&dir);

        let (tx, rx) = mpsc::channel::<notify::Result<notify::Event>>();
        let Ok(mut watcher) = notify::recommended_watcher(tx) else {
            return;
        };
        if watcher.watch(&dir, RecursiveMode::NonRecursive).is_err() {
            return;
        }

        let touches_store = |event: &notify::Event| {
            event
                .paths
                .iter()
                .any(|p| p.file_name().is_some_and(|n| n == "profiles.json"))
        };

        while let Ok(event) = rx.recv() {
            let Ok(event) = event else { continue };
            if !touches_store(&event) {
                continue;
            }
            let deadline = Instant::now() + Duration::from_secs(2);
            while Instant::now() < deadline {
                match rx.recv_timeout(Duration::from_millis(150)) {
                    Ok(_) => continue,
                    Err(_) => break,
                }
            }
            refresh(&app);
        }
    });
}
