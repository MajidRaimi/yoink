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
        account: Option<RawAccount>,
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

#[derive(Deserialize)]
struct RawStore {
    current: Option<String>,
    profiles: HashMap<String, RawProfile>,
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

pub fn load_store() -> StoreDto {
    let raw = std::fs::read_to_string(profiles_path())
        .ok()
        .and_then(|text| serde_json::from_str::<RawStore>(&text).ok());

    let Some(raw) = raw else {
        return StoreDto { current: None, profiles: Vec::new() };
    };

    let mut profiles: Vec<ProfileDto> = raw
        .profiles
        .into_values()
        .map(|profile| match profile {
            RawProfile::Claude { name, account, updated_at } => ProfileDto::Claude {
                name,
                email: account.and_then(|a| a.email_address),
                updated_at,
            },
            RawProfile::External { name, provider, base_url, model, updated_at } => {
                ProfileDto::External { name, provider, base_url, model, updated_at }
            }
        })
        .collect();
    profiles.sort_by(|a, b| a.name().to_lowercase().cmp(&b.name().to_lowercase()));

    StoreDto { current: raw.current, profiles }
}
