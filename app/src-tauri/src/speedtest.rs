use once_cell::sync::Lazy;
use serde::Serialize;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{async_runtime::Mutex, AppHandle, Emitter, Error};
use tokio::sync::watch;

pub const EVENT_STARTED: &str = "speedtest-started";
pub const EVENT_PING: &str = "speedtest-ping";
pub const EVENT_DOWNLOAD: &str = "speedtest-download";
pub const EVENT_UPLOAD: &str = "speedtest-upload";
pub const EVENT_COMPLETED: &str = "speedtest-completed";
pub const EVENT_CANCELLED: &str = "speedtest-cancelled";
pub const EVENT_FAILED: &str = "speedtest-failed";

#[derive(Serialize)]
pub struct StartedPayload {
    pub timestamp: i64,
}

#[derive(Serialize)]
pub struct PingPayload {
    pub latency_ms: f64,
}

#[derive(Serialize)]
pub struct ProgressPayload {
    pub phase: String,
    pub progress: f64,
    pub kbps: f64,
}

#[derive(Serialize)]
pub struct CompletedPayload {
    pub latency_ms: f64,
    pub download_kbps: f64,
    pub upload_kbps: f64,
}

#[derive(Serialize)]
pub struct CancelledPayload {
    pub timestamp: i64,
}

#[derive(Serialize)]
pub struct FailedPayload {
    pub error: String,
}

struct SpeedTestTask {
    cancel: watch::Sender<bool>,
}

struct SpeedTestManager {
    running: bool,
    task: Option<SpeedTestTask>,
}

impl SpeedTestManager {
    fn new() -> Self {
        Self {
            running: false,
            task: None,
        }
    }
}

static SPEEDTEST_MANAGER: Lazy<Mutex<SpeedTestManager>> =
    Lazy::new(|| Mutex::new(SpeedTestManager::new()));

fn speedtest_manager() -> &'static Mutex<SpeedTestManager> {
    &SPEEDTEST_MANAGER
}

pub async fn run_speedtest(app: AppHandle) -> Result<(), String> {
    let mut manager = speedtest_manager().lock().await;
    if manager.running {
        return Err("Speed test already in progress".into());
    }
    let (tx, rx) = watch::channel(false);
    manager.running = true;
    manager.task = Some(SpeedTestTask { cancel: tx });
    drop(manager);
    let manager_ref = speedtest_manager();
    tauri::async_runtime::spawn(async move {
        if let Err(error) = run_speedtest_task(app.clone(), rx).await {
            let _ = emit_event(&app, EVENT_FAILED, &FailedPayload { error });
        }
        let mut guard = manager_ref.lock().await;
        guard.running = false;
        guard.task = None;
    });
    Ok(())
}

pub async fn cancel_speedtest() -> Result<bool, String> {
    let mut manager = speedtest_manager().lock().await;
    if let Some(task) = manager.task.take() {
        manager.running = false;
        let _ = task.cancel.send(true);
        return Ok(true);
    }
    Ok(false)
}

async fn run_speedtest_task(
    app: AppHandle,
    mut cancel_rx: watch::Receiver<bool>,
) -> Result<(), String> {
    emit_event(
        &app,
        EVENT_STARTED,
        &StartedPayload {
            timestamp: now_timestamp(),
        },
    )?;

    let ping_samples = [24.2, 22.8, 23.7];
    for &latency in &ping_samples {
        if check_cancel(&mut cancel_rx) {
            emit_event(
                &app,
                EVENT_CANCELLED,
                &CancelledPayload {
                    timestamp: now_timestamp(),
                },
            )?;
            return Ok(());
        }
        emit_event(
            &app,
            EVENT_PING,
            &PingPayload {
                latency_ms: latency,
            },
        )?;
        wait_or_cancel(Duration::from_millis(250), &mut cancel_rx).await?;
    }

    let download_rates = [150.0, 320.0, 460.0, 610.0, 540.0];
    for (idx, &rate) in download_rates.iter().enumerate() {
        if check_cancel(&mut cancel_rx) {
            emit_event(
                &app,
                EVENT_CANCELLED,
                &CancelledPayload {
                    timestamp: now_timestamp(),
                },
            )?;
            return Ok(());
        }
        let progress = (idx + 1) as f64 / download_rates.len() as f64;
        emit_event(
            &app,
            EVENT_DOWNLOAD,
            &ProgressPayload {
                phase: "download".into(),
                progress,
                kbps: rate,
            },
        )?;
        wait_or_cancel(Duration::from_millis(400), &mut cancel_rx).await?;
    }

    let upload_rates = [120.0, 260.0, 420.0, 390.0];
    for (idx, &rate) in upload_rates.iter().enumerate() {
        if check_cancel(&mut cancel_rx) {
            emit_event(
                &app,
                EVENT_CANCELLED,
                &CancelledPayload {
                    timestamp: now_timestamp(),
                },
            )?;
            return Ok(());
        }
        let progress = (idx + 1) as f64 / upload_rates.len() as f64;
        emit_event(
            &app,
            EVENT_UPLOAD,
            &ProgressPayload {
                phase: "upload".into(),
                progress,
                kbps: rate,
            },
        )?;
        wait_or_cancel(Duration::from_millis(400), &mut cancel_rx).await?;
    }

    emit_event(
        &app,
        EVENT_COMPLETED,
        &CompletedPayload {
            latency_ms: ping_samples.iter().sum::<f64>() / ping_samples.len() as f64,
            download_kbps: download_rates.iter().sum::<f64>() / download_rates.len() as f64,
            upload_kbps: upload_rates.iter().sum::<f64>() / upload_rates.len() as f64,
        },
    )?;
    Ok(())
}

fn now_timestamp() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}

fn emit_event<T>(app: &AppHandle, event: &str, payload: &T) -> Result<(), String>
where
    T: Serialize,
{
    app.emit(event, payload)
        .map_err(|err: Error| err.to_string())
}

fn check_cancel(cancel_rx: &mut watch::Receiver<bool>) -> bool {
    *cancel_rx.borrow()
}

async fn wait_or_cancel(
    duration: Duration,
    cancel_rx: &mut watch::Receiver<bool>,
) -> Result<(), String> {
    if *cancel_rx.borrow() {
        return Ok(());
    }
    tokio::select! {
        _ = tokio::time::sleep(duration) => Ok(()),
        res = cancel_rx.changed() => {
            res.map_err(|err| err.to_string())?;
            Ok(())
        }
    }
}
