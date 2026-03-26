mod mock_server;
mod network;
mod network_service;
mod secure_storage;
mod speedtest;
#[allow(dead_code)]
mod throttle;

use mock_server::{
    list_running_ports, start_mock_server as start_local_mock_server, stop_all_mock_servers,
    stop_mock_server as stop_local_mock_server,
};
use network::{NetworkPreset, NetworkProfile, NetworkState, SharedNetworkState};
use network_service::{send_network_request, NetworkRequest, NetworkResponse};
use once_cell::sync::Lazy;
use reqwest::{Client, Method};
use secure_storage::{
    clear_account_impl, delete_secret_impl, list_secret_metadata_impl, reveal_secret_impl,
    upsert_secret_impl,
};
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use speedtest::{cancel_speedtest, run_speedtest};
use std::{
    collections::HashMap,
    fs::File,
    io::{BufRead, BufReader},
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
static API_HTTP_CLIENT: Lazy<Client> = Lazy::new(Client::new);

fn network_state() -> &'static SharedNetworkState {
    &NETWORK_STATE
}

fn network_throttler() -> &'static NetworkThrottler {
    &NETWORK_THROTTLER
}

fn app_directory() -> &'static PathBuf {
    &APP_DIRECTORY
}

fn proxy_script_path() -> PathBuf {
    app_directory().join("scripts").join("proxy-server.js")
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
async fn list_secret_metadata_command(
    account: secure_storage::AccountMode,
) -> Result<Vec<secure_storage::SecretMetadata>, String> {
    list_secret_metadata_impl(account)
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
async fn reveal_secret_command(
    account: secure_storage::AccountMode,
    key: String,
) -> Result<secure_storage::SecretValue, String> {
    reveal_secret_impl(account, key)
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
async fn upsert_secret_command(
    account: secure_storage::AccountMode,
    metadata: secure_storage::SecretMetadata,
    value: Vec<u8>,
) -> Result<secure_storage::SecretReference, String> {
    upsert_secret_impl(account, metadata, value)
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
async fn delete_secret_command(
    account: secure_storage::AccountMode,
    key: String,
) -> Result<(), String> {
    delete_secret_impl(account, key)
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
async fn clear_account_command(account: secure_storage::AccountMode) -> Result<(), String> {
    clear_account_impl(account)
        .await
        .map_err(|err| err.to_string())
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

#[derive(Debug, Serialize, Deserialize)]
struct MockServerDto {
    id: i64,
    name: String,
    port: u16,
    created_at: Option<String>,
    updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct MockServerRequestDto {
    method: String,
    path: String,
    headers: HashMap<String, String>,
    body: Option<String>,
    timestamp: i64,
}

#[derive(Debug, Deserialize)]
struct MockServerListResponse {
    data: Vec<MockServerDto>,
}

#[derive(Debug, Deserialize)]
struct MockServerSingleResponse {
    data: MockServerDto,
}

#[derive(Debug, Serialize, Deserialize)]
struct MockServerCreateRequest {
    name: String,
    port: u16,
}

fn normalize_api_base(input: &str) -> Result<String, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("Missing API base URL".to_string());
    }
    Ok(trimmed.trim_end_matches('/').to_string())
}

fn normalize_token(input: &str) -> Result<&str, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("Missing authentication token".to_string());
    }
    Ok(trimmed)
}

fn build_api_url(api_base: &str, segment: &str) -> String {
    let cleaned_segment = segment.trim_start_matches('/');
    format!("{}/{}", api_base.trim_end_matches('/'), cleaned_segment)
}

async fn call_mock_server_api<T>(
    method: Method,
    api_base: &str,
    segment: &str,
    token: &str,
    body: Option<Value>,
) -> Result<T, String>
where
    T: DeserializeOwned,
{
    let url = build_api_url(api_base, segment);
    let mut request = API_HTTP_CLIENT
        .request(method, &url)
        .header("Accept", "application/json")
        .bearer_auth(token);

    if let Some(payload) = body {
        request = request.json(&payload);
    }

    let response = request
        .send()
        .await
        .map_err(|err| format!("Failed to contact API: {}", err))?;

    if response.status().is_success() {
        response
            .json::<T>()
            .await
            .map_err(|err| format!("Invalid API response: {}", err))
    } else {
        let status = response.status();
        let detail = response.text().await.unwrap_or_default();
        Err(format!(
            "Request failed ({}): {}",
            status.as_u16(),
            detail
        ))
    }
}

async fn delete_mock_server_request(api_base: &str, id: i64, token: &str) -> Result<(), String> {
    let url = build_api_url(api_base, &format!("mock-servers/{}", id));
    let response = API_HTTP_CLIENT
        .delete(&url)
        .bearer_auth(token)
        .send()
        .await
        .map_err(|err| format!("Failed to contact API: {}", err))?;

    if response.status().is_success() {
        Ok(())
    } else {
        let status = response.status();
        let detail = response.text().await.unwrap_or_default();
        Err(format!(
            "Request failed ({}): {}",
            status.as_u16(),
            detail
        ))
    }
}

#[tauri::command]
async fn fetch_mock_servers(api_base: String, token: String) -> Result<Vec<MockServerDto>, String> {
    let base = normalize_api_base(&api_base)?;
    let auth_token = normalize_token(&token)?;
    let response: MockServerListResponse =
        call_mock_server_api(Method::GET, &base, "mock-servers", auth_token, None).await?;
    Ok(response.data)
}

#[tauri::command]
async fn create_mock_server(
    api_base: String,
    token: String,
    payload: MockServerCreateRequest,
) -> Result<MockServerDto, String> {
    let base = normalize_api_base(&api_base)?;
    let auth_token = normalize_token(&token)?;
    let body = serde_json::to_value(payload)
        .map_err(|err| format!("Failed to serialize payload: {}", err))?;
    let response: MockServerSingleResponse =
        call_mock_server_api(Method::POST, &base, "mock-servers", auth_token, Some(body)).await?;
    Ok(response.data)
}

#[tauri::command]
async fn delete_mock_server(api_base: String, token: String, id: i64) -> Result<bool, String> {
    let base = normalize_api_base(&api_base)?;
    let auth_token = normalize_token(&token)?;
    delete_mock_server_request(&base, id, auth_token).await?;
    Ok(true)
}

#[tauri::command]
fn start_mock_server(port: u16) -> Result<bool, String> {
    start_local_mock_server(port)?;
    Ok(true)
}

#[tauri::command]
fn stop_mock_server(port: u16) -> Result<bool, String> {
    stop_local_mock_server(port)
}

#[tauri::command]
fn list_running_mock_servers() -> Result<Vec<u16>, String> {
    list_running_ports()
}

#[tauri::command]
fn fetch_mock_server_requests(port: u16) -> Result<Vec<MockServerRequestDto>, String> {
    let requests_dir = app_directory().join("runtime").join("mock-requests");
    let log_file = requests_dir.join(format!("{port}.jsonl"));

    if !log_file.exists() {
        return Ok(Vec::new());
    }

    let file = File::open(&log_file)
        .map_err(|err| format!("Failed to read mock server requests: {}", err))?;
    let reader = BufReader::new(file);
    let mut requests = Vec::new();

    for line in reader.lines() {
        let line = match line {
            Ok(data) => data,
            Err(_) => continue,
        };
        if line.trim().is_empty() {
            continue;
        }
        if let Ok(entry) = serde_json::from_str::<MockServerRequestDto>(&line) {
            requests.push(entry);
        }
    }

    requests.reverse();
    Ok(requests)
}

#[tauri::command]
fn clear_mock_server_requests(port: u16) -> Result<bool, String> {
    let requests_dir = app_directory().join("runtime").join("mock-requests");
    let log_file = requests_dir.join(format!("{port}.jsonl"));

    if log_file.exists() {
        std::fs::remove_file(&log_file)
            .map_err(|err| format!("Failed to clear mock server requests: {}", err))?;
    }

    if !requests_dir.exists() {
        std::fs::create_dir_all(&requests_dir)
            .map_err(|err| format!("Failed to recreate request directory: {}", err))?;
    }

    std::fs::File::create(&log_file)
        .map_err(|err| format!("Failed to recreate log file: {}", err))?;

    Ok(true)
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
            fetch_mock_servers,
            create_mock_server,
            delete_mock_server,
            start_mock_server,
            stop_mock_server,
            list_running_mock_servers,
            fetch_mock_server_requests,
            clear_mock_server_requests,
            get_network_profile,
            set_network_profile,
            list_network_presets,
            run_speedtest_command,
            cancel_speedtest_command,
            send_network_request_command,
            list_secret_metadata_command,
            reveal_secret_command,
            upsert_secret_command,
            delete_secret_command,
            clear_account_command,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    stop_all_mock_servers();
}
