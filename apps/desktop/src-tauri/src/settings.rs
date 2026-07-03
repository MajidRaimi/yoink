use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Clone)]
pub struct Settings {
    pub hotkey: String,
}

impl Default for Settings {
    fn default() -> Self {
        Settings { hotkey: "Alt+Y".to_string() }
    }
}

fn settings_path() -> PathBuf {
    crate::store::yoink_dir().join("desktop.json")
}

pub fn load() -> Settings {
    std::fs::read_to_string(settings_path())
        .ok()
        .and_then(|text| serde_json::from_str(&text).ok())
        .unwrap_or_default()
}

pub fn save(settings: &Settings) -> Result<(), String> {
    let dir = crate::store::yoink_dir();
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let json = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    std::fs::write(settings_path(), format!("{json}\n")).map_err(|e| e.to_string())
}
