use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Deserialize)]
struct RawAccount {
    #[serde(rename = "emailAddress")]
    email_address: Option<String>,
}

#[derive(Deserialize)]
struct RawEndpoint {
    #[serde(default)]
    protocol: String,
    #[serde(rename = "baseUrl", default)]
    base_url: String,
}

#[derive(Deserialize)]
struct RawModel {
    id: String,
    #[serde(default)]
    name: String,
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
        #[serde(default)]
        endpoints: Option<Vec<RawEndpoint>>,
        #[serde(default)]
        models: Option<Vec<RawModel>>,
        #[serde(default)]
        connections: Option<HashMap<String, serde_json::Value>>,
        #[serde(rename = "presetId", default)]
        preset_id: Option<String>,
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
pub struct EndpointDto {
    pub protocol: String,
    #[serde(rename = "baseUrl")]
    pub base_url: String,
}

#[derive(Serialize, Clone)]
pub struct ModelDto {
    pub id: String,
    pub name: String,
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
        endpoints: Vec<EndpointDto>,
        models: Vec<ModelDto>,
        connections: Vec<String>,
        #[serde(rename = "presetId")]
        preset_id: Option<String>,
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

fn to_endpoint_dtos(endpoints: Vec<RawEndpoint>) -> Vec<EndpointDto> {
    endpoints
        .into_iter()
        .map(|endpoint| EndpointDto { protocol: endpoint.protocol, base_url: endpoint.base_url })
        .collect()
}

fn to_model_dtos(models: Vec<RawModel>) -> Vec<ModelDto> {
    models
        .into_iter()
        .map(|model| {
            let name = if model.name.is_empty() { model.id.clone() } else { model.name };
            ModelDto { id: model.id, name }
        })
        .collect()
}

fn connected_harnesses(connections: HashMap<String, serde_json::Value>) -> Vec<String> {
    let mut harnesses: Vec<String> = connections
        .into_iter()
        .filter(|(_, connection)| !connection.is_null())
        .map(|(harness, _)| harness)
        .collect();
    harnesses.sort();
    harnesses
}

const LEGACY_PROTOCOL: &str = "anthropic-messages";
const CLAUDE_CODE_HARNESS: &str = "claude-code";
const OPERATION_SUFFIXES: [&str; 5] = ["/chat/completions", "/completions", "/responses", "/messages", "/models"];

fn without_query_or_fragment(url: &str) -> &str {
    url.split(['?', '#']).next().unwrap_or_default()
}

fn without_operation_suffix(url: &str) -> &str {
    OPERATION_SUFFIXES
        .iter()
        .find_map(|suffix| url.strip_suffix(suffix))
        .unwrap_or(url)
}

fn without_v1(url: &str) -> String {
    let base = without_query_or_fragment(url.trim()).trim_end_matches('/');
    let base = without_operation_suffix(base).trim_end_matches('/');
    base.strip_suffix("/v1").unwrap_or(base).to_string()
}

fn legacy_endpoints(base_url: &str) -> Vec<EndpointDto> {
    if base_url.trim().is_empty() {
        return Vec::new();
    }
    vec![EndpointDto { protocol: LEGACY_PROTOCOL.to_string(), base_url: without_v1(base_url) }]
}

fn legacy_models(model: &str) -> Vec<ModelDto> {
    if model.is_empty() {
        return Vec::new();
    }
    vec![ModelDto { id: model.to_string(), name: model.to_string() }]
}

fn with_claude_code(mut harnesses: Vec<String>) -> Vec<String> {
    if !harnesses.iter().any(|harness| harness == CLAUDE_CODE_HARNESS) {
        harnesses.push(CLAUDE_CODE_HARNESS.to_string());
        harnesses.sort();
    }
    harnesses
}

fn to_profile_dto(key: &str, value: serde_json::Value, is_current: bool) -> Option<ProfileDto> {
    match serde_json::from_value::<RawProfile>(with_default_type(value)) {
        Ok(RawProfile::Claude { name, account, updated_at }) => Some(ProfileDto::Claude {
            name,
            email: account.and_then(|a| a.email_address),
            updated_at,
        }),
        Ok(RawProfile::External {
            name,
            provider,
            base_url,
            model,
            updated_at,
            endpoints,
            models,
            connections,
            preset_id,
        }) => {
            let is_legacy = endpoints.is_none();
            let endpoint_dtos = endpoints.map_or_else(|| legacy_endpoints(&base_url), to_endpoint_dtos);
            let model_dtos = models.map_or_else(|| legacy_models(&model), to_model_dtos);
            let harnesses = connected_harnesses(connections.unwrap_or_default());
            Some(ProfileDto::External {
                name,
                provider,
                base_url,
                model,
                updated_at,
                endpoints: endpoint_dtos,
                models: model_dtos,
                connections: if is_legacy && is_current { with_claude_code(harnesses) } else { harnesses },
                preset_id,
            })
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

    let current = raw.current.as_deref();
    let mut profiles: Vec<ProfileDto> = raw
        .profiles
        .into_iter()
        .filter_map(|(key, value)| {
            let is_current = current == Some(key.as_str());
            to_profile_dto(&key, value, is_current)
        })
        .collect();
    profiles.sort_by(|a, b| a.name().to_lowercase().cmp(&b.name().to_lowercase()));

    StoreDto { current: raw.current, profiles }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn external_parts(dto: ProfileDto) -> (Vec<EndpointDto>, Vec<ModelDto>, Vec<String>) {
        match dto {
            ProfileDto::External { endpoints, models, connections, .. } => (endpoints, models, connections),
            ProfileDto::Claude { .. } => panic!("expected an external profile"),
        }
    }

    fn legacy_profile() -> serde_json::Value {
        json!({
            "type": "external",
            "name": "legacy",
            "provider": "custom",
            "baseUrl": "https://api.example.com/v1/",
            "model": "glm-4.6",
            "updatedAt": "2025-01-01T00:00:00.000Z"
        })
    }

    #[test]
    fn legacy_current_profile_gets_endpoint_model_and_claude_code() {
        let dto = to_profile_dto("legacy", legacy_profile(), true).expect("profile");
        let (endpoints, models, connections) = external_parts(dto);
        assert_eq!(endpoints.len(), 1);
        assert_eq!(endpoints[0].protocol, "anthropic-messages");
        assert_eq!(endpoints[0].base_url, "https://api.example.com");
        assert_eq!(models.len(), 1);
        assert_eq!(models[0].id, "glm-4.6");
        assert_eq!(models[0].name, "glm-4.6");
        assert_eq!(connections, vec!["claude-code".to_string()]);
    }

    #[test]
    fn legacy_non_current_profile_has_no_connections() {
        let dto = to_profile_dto("legacy", legacy_profile(), false).expect("profile");
        let (endpoints, models, connections) = external_parts(dto);
        assert_eq!(endpoints.len(), 1);
        assert_eq!(models.len(), 1);
        assert!(connections.is_empty());
    }

    #[test]
    fn migrated_profile_keeps_its_own_fields() {
        let value = json!({
            "type": "external",
            "name": "modern",
            "baseUrl": "https://api.example.com",
            "model": "glm-4.6",
            "endpoints": [],
            "models": [],
            "connections": { "pi": { "connectedAt": "x" }, "codex": null }
        });
        let (endpoints, models, connections) = external_parts(to_profile_dto("modern", value, true).expect("profile"));
        assert!(endpoints.is_empty());
        assert!(models.is_empty());
        assert_eq!(connections, vec!["pi".to_string()]);
    }

    #[test]
    fn without_v1_strips_operation_paths_and_version() {
        assert_eq!(without_v1(" https://h.example/v1/messages?x=1 "), "https://h.example");
        assert_eq!(without_v1("https://h.example/api/anthropic"), "https://h.example/api/anthropic");
    }
}
