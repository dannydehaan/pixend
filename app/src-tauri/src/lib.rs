mod network;
mod network_service;
mod speedtest;
#[allow(dead_code)]
mod throttle;

use network::{NetworkPreset, NetworkProfile, NetworkState, SharedNetworkState};
use network_service::{send_network_request, NetworkRequest, NetworkResponse};
use once_cell::sync::Lazy;
use speedtest::{cancel_speedtest, run_speedtest};
use std::{
    path::{Path, PathBuf},
    process::{Child, Command},
    sync::{Arc, Mutex},
};
use tauri::AppHandle;
use throttle::NetworkThrottler;

static PROXY_PROCESS: Lazy<Mutex<Option<Child>>> = Lazy::new(|| Mutex::new(None));
static APP_DIRECTORY: Lazy<PathBuf> = Lazy::new(|| {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .to_path_buf()
});
static NETWORK_STATE: Lazy<SharedNetworkState> = Lazy::new(|| Arc::new(NetworkState::new()));
static NETWORK_THROTTLER: Lazy<NetworkThrottler> =
    Lazy::new(|| NetworkThrottler::new(network_state().clone()));

fn network_state() -> &'static SharedNetworkState {
    &NETWORK_STATE
}

fn network_throttler() -> &'static NetworkThrottler {
    &NETWORK_THROTTLER
}

fn proxy_script_path() -> PathBuf {
    APP_DIRECTORY.join("scripts").join("proxy-server.js")
}

fn spawn_proxy_process() -> Result<Child, String> {
    let script = proxy_script_path();
    if !script.exists() {
        return Err("Proxy script not found".into());
    }

    Command::new("node")
        .arg(script)
        .current_dir(&*APP_DIRECTORY)
        .spawn()
        .map_err(|error| format!("Failed to spawn proxy: {}", error))
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn run_speedtest_command(app_handle: AppHandle) -> Result<(), String> {
    run_speedtest(app_handle).await
}

#[tauri::command]
async fn cancel_speedtest_command() -> Result<bool, String> {
    cancel_speedtest().await
}

#[tauri::command]
async fn send_network_request_command(request: NetworkRequest) -> Result<NetworkResponse, String> {
    send_network_request(request, network_throttler()).await
}

#[tauri::command]
async fn get_network_profile() -> Result<NetworkProfile, String> {
    Ok(network_state().get_profile().await)
}

#[tauri::command]
async fn set_network_profile(profile: NetworkProfile) -> Result<NetworkProfile, String> {
    network_state()
        .set_profile(profile.clone())
        .await
        .map_err(|err| err.to_string())?;
    Ok(profile)
}

#[tauri::command]
fn list_network_presets() -> Vec<NetworkPreset> {
    NetworkPreset::all()
}

#[tauri::command]
fn start_proxy() -> Result<bool, String> {
    let mut guard = PROXY_PROCESS
        .lock()
        .map_err(|_| "Failed to acquire proxy lock".to_string())?;

    if guard.is_some() {
        return Ok(false);
    }

    let child = spawn_proxy_process()?;
    *guard = Some(child);
    Ok(true)
}

#[tauri::command]
fn stop_proxy() -> Result<bool, String> {
    let mut guard = PROXY_PROCESS
        .lock()
        .map_err(|_| "Failed to acquire proxy lock".to_string())?;

    if let Some(mut child) = guard.take() {
        let _ = child.kill();
        let _ = child.wait();
        return Ok(true);
    }

    Ok(false)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            start_proxy,
            stop_proxy,
            get_network_profile,
            set_network_profile,
            list_network_presets,
            run_speedtest_command,
            cancel_speedtest_command,
            send_network_request_command,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
