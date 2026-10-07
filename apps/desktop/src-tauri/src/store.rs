use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Deserialize)]
struct RawAccount {
    #[serde(rename = "emailAddress")]
    email_address: Option<String>,
}

#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
enum RawProfile {
    Claude {
        name: String,
        #[serde(default)]
        account: Option<RawAccount>,
        #[serde(rename = "updatedAt", default)]
        updated_at: String,
    },
    External {
        name: String,
        #[serde(default)]
        provider: String,
        #[serde(rename = "baseUrl", default)]
        base_url: String,
        #[serde(default)]
        model: String,
        #[serde(rename = "updatedAt", default)]
        updated_at: String,
    },
    #[serde(other)]
    Unknown,
}

#[derive(Deserialize)]
struct RawStore {
    #[serde(default)]
    current: Option<String>,
    #[serde(default)]
    profiles: HashMap<String, serde_json::Value>,
}

#[derive(Serialize, Clone)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum ProfileDto {
    Claude {
        name: String,
        email: Option<String>,
        #[serde(rename = "updatedAt")]
        updated_at: String,
    },
    External {
        name: String,
        provider: String,
        #[serde(rename = "baseUrl")]
        base_url: String,
        model: String,
        #[serde(rename = "updatedAt")]
        updated_at: String,
    },
}

impl ProfileDto {
    pub fn name(&self) -> &str {
        match self {
            ProfileDto::Claude { name, .. } => name,
            ProfileDto::External { name, .. } => name,
        }
    }
}

#[derive(Serialize, Clone)]
pub struct StoreDto {
    pub current: Option<String>,
    pub profiles: Vec<ProfileDto>,
}

pub fn yoink_dir() -> PathBuf {
    let home = std::env::var_os("HOME").map(PathBuf::from).unwrap_or_default();
    home.join(".config").join("yoink")
}

pub fn profiles_path() -> PathBuf {
    yoink_dir().join("profiles.json")
}

fn with_default_type(mut value: serde_json::Value) -> serde_json::Value {
    if let Some(object) = value.as_object_mut() {
        object
            .entry("type")
            .or_insert_with(|| serde_json::Value::String("claude".to_string()));
    }
    value
}

fn to_profile_dto(key: &str, value: serde_json::Value) -> Option<ProfileDto> {
    match serde_json::from_value::<RawProfile>(with_default_type(value)) {
        Ok(RawProfile::Claude { name, account, updated_at }) => Some(ProfileDto::Claude {
            name,
            email: account.and_then(|a| a.email_address),
            updated_at,
        }),
        Ok(RawProfile::External { name, provider, base_url, model, updated_at }) => {
            Some(ProfileDto::External { name, provider, base_url, model, updated_at })
        }
        Ok(RawProfile::Unknown) => None,
        Err(error) => {
            eprintln!("yoink: skipping profile \"{key}\" in {}: {error}", profiles_path().display());
            None
        }
    }
}

fn read_raw_store() -> Option<RawStore> {
    let path = profiles_path();
    let text = match std::fs::read_to_string(&path) {
        Ok(text) => text,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return None,
        Err(error) => {
            eprintln!("yoink: could not read {}: {error}", path.display());
            return None;
        }
    };
    match serde_json::from_str::<RawStore>(&text) {
        Ok(raw) => Some(raw),
        Err(error) => {
            eprintln!("yoink: could not parse {}: {error}", path.display());
            None
        }
    }
}

pub fn load_store() -> StoreDto {
    let Some(raw) = read_raw_store() else {
        return StoreDto { current: None, profiles: Vec::new() };
    };

    let mut profiles: Vec<ProfileDto> = raw
        .profiles
        .into_iter()
        .filter_map(|(key, value)| to_profile_dto(&key, value))
        .collect();
    profiles.sort_by(|a, b| a.name().to_lowercase().cmp(&b.name().to_lowercase()));

    StoreDto { current: raw.current, profiles }
}
