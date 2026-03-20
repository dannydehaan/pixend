use once_cell::sync::Lazy;
use std::{
    path::{Path, PathBuf},
    process::{Child, Command},
    sync::Mutex,
};

static PROXY_PROCESS: Lazy<Mutex<Option<Child>>> = Lazy::new(|| Mutex::new(None));
static APP_DIRECTORY: Lazy<PathBuf> =
    Lazy::new(|| Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap().to_path_buf());

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
        .invoke_handler(tauri::generate_handler![greet, start_proxy, stop_proxy])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
