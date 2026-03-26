use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::fs;
use std::net::TcpListener;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;

use crate::app_directory;

static RUNNING_SERVERS: Lazy<Mutex<HashMap<u16, Child>>> = Lazy::new(|| Mutex::new(HashMap::new()));

fn mock_server_script_path() -> PathBuf {
    app_directory().join("scripts").join("mock-server.js")
}

fn mock_server_runtime_dir() -> PathBuf {
    app_directory().join("runtime").join("mock-servers")
}

fn mock_server_pid_file(port: u16) -> PathBuf {
    mock_server_runtime_dir().join(format!("{port}.pid"))
}

fn store_mock_server_pid(port: u16, pid: u32) -> Result<(), String> {
    let dir = mock_server_runtime_dir();
    fs::create_dir_all(&dir)
        .map_err(|err| format!("Failed to create mock server runtime directory: {}", err))?;
    let path = mock_server_pid_file(port);
    fs::write(&path, pid.to_string())
        .map_err(|err| format!("Failed to write mock server pid file: {}", err))?;
    Ok(())
}

fn remove_mock_server_pid(port: u16) {
    let _ = fs::remove_file(mock_server_pid_file(port));
}

fn read_mock_server_pid(port: u16) -> Option<u32> {
    let path = mock_server_pid_file(port);
    let contents = fs::read_to_string(&path).ok()?;
    contents.trim().parse().ok()
}

fn kill_pid(pid: u32) -> Result<(), String> {
    #[cfg(unix)]
    {
        Command::new("kill")
            .args(["-9", &pid.to_string()])
            .status()
            .map_err(|err| format!("Failed to kill process {}: {}", pid, err))?;
    }
    #[cfg(windows)]
    {
        Command::new("taskkill")
            .args(["/PID", &pid.to_string(), "/F"])
            .status()
            .map_err(|err| format!("Failed to kill process {}: {}", pid, err))?;
    }
    Ok(())
}

fn ensure_port_available(port: u16) -> Result<(), String> {
    TcpListener::bind(("127.0.0.1", port))
        .map(|listener| drop(listener))
        .map_err(|err| format!("Port {} is unavailable: {}", port, err))
}

pub fn start_mock_server(port: u16) -> Result<(), String> {
    let mut guard = RUNNING_SERVERS
        .lock()
        .map_err(|_| "Failed to acquire mock server lock".to_string())?;

    if guard.contains_key(&port) {
        return Err("Mock server already running on this port".to_string());
    }

    ensure_port_available(port)?;

    let script = mock_server_script_path();
    if !script.exists() {
        return Err("Mock server script not found".to_string());
    }

    let child = Command::new("node")
        .arg(script)
        .arg(port.to_string())
        .arg(app_directory().to_string_lossy().to_string())
        .current_dir(app_directory())
        .spawn()
        .map_err(|err| format!("Failed to spawn mock server: {}", err))?;

    let _ = store_mock_server_pid(port, child.id());
    guard.insert(port, child);

    Ok(())
}

pub fn stop_mock_server(port: u16) -> Result<bool, String> {
    let mut guard = RUNNING_SERVERS
        .lock()
        .map_err(|_| "Failed to acquire mock server lock".to_string())?;

    if let Some(mut child) = guard.remove(&port) {
        let _ = child.kill();
        let _ = child.wait();
        remove_mock_server_pid(port);
        return Ok(true);
    }

    drop(guard);

    if let Some(pid) = read_mock_server_pid(port) {
        let _ = kill_pid(pid);
        remove_mock_server_pid(port);
        return Ok(true);
    }

    Ok(false)
}

pub fn list_running_ports() -> Result<Vec<u16>, String> {
    let guard = RUNNING_SERVERS
        .lock()
        .map_err(|_| "Failed to acquire mock server lock".to_string())?;
    Ok(guard.keys().cloned().collect())
}

pub fn stop_all_mock_servers() {
    if let Ok(mut guard) = RUNNING_SERVERS.lock() {
        for (&_port, child) in guard.iter_mut() {
            let _ = child.kill();
            let _ = child.wait();
        }
        guard.clear();
    }
}
