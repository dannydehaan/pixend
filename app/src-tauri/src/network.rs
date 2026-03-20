use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize, Clone, Eq, PartialEq)]
pub struct NetworkPreset {
    pub preset_id: &'static str,
    pub label: &'static str,
    pub enabled: bool,
    pub download_kbps: u64,
    pub upload_kbps: u64,
    pub latency_ms: u64,
}

impl NetworkPreset {
    pub const NO_LIMIT: &'static str = "no_limit";
    pub const MODEM_33K6: &'static str = "modem_33k6";
    pub const MODEM_56K: &'static str = "modem_56k";
    pub const EDGE: &'static str = "edge";
    pub const THREE_G_SLOW: &'static str = "3g_slow";
    pub const THREE_G_FAST: &'static str = "3g_fast";
    pub const FOUR_G: &'static str = "4g";
    pub const FIVE_G: &'static str = "5g";
    pub const CUSTOM: &'static str = "custom";

    pub fn all() -> Vec<Self> {
        PRESETS.iter().cloned().collect()
    }

    pub fn by_id(value: &str) -> Option<Self> {
        PRESETS
            .iter()
            .find(|preset| preset.preset_id == value)
            .cloned()
    }
}

const PRESETS: [NetworkPreset; 9] = [
    NetworkPreset {
        preset_id: NetworkPreset::NO_LIMIT,
        label: "No limit",
        enabled: false,
        download_kbps: 0,
        upload_kbps: 0,
        latency_ms: 0,
    },
    NetworkPreset {
        preset_id: NetworkPreset::MODEM_33K6,
        label: "33.6k Modem",
        enabled: true,
        download_kbps: 4,
        upload_kbps: 4,
        latency_ms: 300,
    },
    NetworkPreset {
        preset_id: NetworkPreset::MODEM_56K,
        label: "56k Modem",
        enabled: true,
        download_kbps: 7,
        upload_kbps: 4,
        latency_ms: 220,
    },
    NetworkPreset {
        preset_id: NetworkPreset::EDGE,
        label: "EDGE",
        enabled: true,
        download_kbps: 30,
        upload_kbps: 15,
        latency_ms: 180,
    },
    NetworkPreset {
        preset_id: NetworkPreset::THREE_G_SLOW,
        label: "3G Slow",
        enabled: true,
        download_kbps: 50,
        upload_kbps: 50,
        latency_ms: 400,
    },
    NetworkPreset {
        preset_id: NetworkPreset::THREE_G_FAST,
        label: "3G Fast",
        enabled: true,
        download_kbps: 200,
        upload_kbps: 90,
        latency_ms: 150,
    },
    NetworkPreset {
        preset_id: NetworkPreset::FOUR_G,
        label: "4G",
        enabled: true,
        download_kbps: 4000,
        upload_kbps: 1500,
        latency_ms: 70,
    },
    NetworkPreset {
        preset_id: NetworkPreset::FIVE_G,
        label: "5G",
        enabled: true,
        download_kbps: 20000,
        upload_kbps: 10000,
        latency_ms: 25,
    },
    NetworkPreset {
        preset_id: NetworkPreset::CUSTOM,
        label: "Custom",
        enabled: true,
        download_kbps: 0,
        upload_kbps: 0,
        latency_ms: 0,
    },
];

#[derive(Debug, Serialize, Deserialize, Clone, Eq, PartialEq)]
pub struct NetworkProfile {
    pub preset_id: String,
    pub label: String,
    pub enabled: bool,
    pub download_kbps: u64,
    pub upload_kbps: u64,
    pub latency_ms: u64,
}

#[derive(Debug, thiserror::Error)]
pub enum NetworkProfileError {
    #[error("download limit must be greater than zero")]
    DownloadLimitRequired,
    #[error("upload limit must be greater than zero")]
    UploadLimitRequired,
}

impl NetworkProfile {
    pub fn apply_preset(preset: &NetworkPreset) -> Self {
        Self {
            preset_id: preset.preset_id.to_string(),
            label: preset.label.to_string(),
            enabled: preset.enabled,
            download_kbps: preset.download_kbps,
            upload_kbps: preset.upload_kbps,
            latency_ms: preset.latency_ms,
        }
    }

    pub fn validate(&self) -> Result<(), NetworkProfileError> {
        if self.enabled {
            if self.download_kbps == 0 {
                return Err(NetworkProfileError::DownloadLimitRequired);
            }
            if self.upload_kbps == 0 {
                return Err(NetworkProfileError::UploadLimitRequired);
            }
        }
        Ok(())
    }
}

pub struct NetworkState {
    profile: tokio::sync::Mutex<NetworkProfile>,
}

impl NetworkState {
    pub fn new() -> Self {
        let default_preset = NetworkPreset::by_id(NetworkPreset::NO_LIMIT)
            .map(|preset| NetworkProfile::apply_preset(&preset))
            .unwrap_or_else(|| NetworkProfile {
                preset_id: NetworkPreset::NO_LIMIT.into(),
                label: "No limit".into(),
                enabled: false,
                download_kbps: 0,
                upload_kbps: 0,
                latency_ms: 0,
            });
        Self {
            profile: tokio::sync::Mutex::new(default_preset),
        }
    }

    pub async fn get_profile(&self) -> NetworkProfile {
        self.profile.lock().await.clone()
    }

    pub async fn set_profile(&self, profile: NetworkProfile) -> Result<(), NetworkProfileError> {
        profile.validate()?;
        let mut guard = self.profile.lock().await;
        *guard = profile;
        Ok(())
    }
}

pub type SharedNetworkState = Arc<NetworkState>;
