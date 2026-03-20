use crate::throttle::NetworkThrottler;
use reqwest::header::{HeaderMap, HeaderName, HeaderValue};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, time::Instant};

/// Request payload received from the frontend. Speeds remain in KB/s so the Rust bridge can enforce the correct limits.
#[derive(Deserialize)]
pub struct NetworkRequest {
    pub url: String,
    pub method: String,
    pub headers: Option<HashMap<String, String>>,
    pub body: Option<String>,
}

#[derive(Serialize)]
pub struct NetworkResponse {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub body: String,
    pub duration_ms: u128,
}

/// Executes HTTP requests using the shared `NetworkThrottler` so the active profile is enforced.
/// This is the only path through which app traffic is throttled; other scripts or OS-level clients are untouched.
pub async fn send_network_request(
    request: NetworkRequest,
    throttler: &NetworkThrottler,
) -> Result<NetworkResponse, String> {
    let client = reqwest::Client::new();
    let method = request
        .method
        .parse::<reqwest::Method>()
        .map_err(|err| err.to_string())?;
    let mut req_builder = client.request(method, &request.url);

    if let Some(headers) = &request.headers {
        req_builder = req_builder.headers(to_header_map(headers)?);
    }

    let has_body = request
        .body
        .as_ref()
        .map(|b| !b.is_empty())
        .unwrap_or(false);
    if has_body {
        throttler
            .enforce_upload(request.body.as_ref().map(|b| b.len()).unwrap_or(0))
            .await;
        req_builder = req_builder.body(request.body.clone().unwrap_or_default());
    }

    let latency = throttler.latency_delay().await;
    if !latency.is_zero() {
        tokio::time::sleep(latency).await;
    }

    let start = Instant::now();
    let response = req_builder.send().await.map_err(|err| err.to_string())?;
    let status = response.status().as_u16();
    let mut headers_map = HashMap::new();
    response.headers().iter().for_each(|(key, value)| {
        if let Ok(val) = value.to_str() {
            headers_map.insert(key.to_string(), val.to_string());
        }
    });
    let body_bytes = response.bytes().await.map_err(|err| err.to_string())?;
    let download_delay = throttler.enforce_download(body_bytes.len()).await;
    if !download_delay.is_zero() {
        tokio::time::sleep(download_delay).await;
    }

    let body = String::from_utf8_lossy(&body_bytes).to_string();
    let duration_ms = start.elapsed().as_millis();

    Ok(NetworkResponse {
        status,
        headers: headers_map,
        body,
        duration_ms,
    })
}

fn to_header_map(headers: &HashMap<String, String>) -> Result<HeaderMap, String> {
    let mut map = HeaderMap::new();
    for (key, value) in headers {
        let name = HeaderName::from_bytes(key.as_bytes()).map_err(|err| err.to_string())?;
        let val = HeaderValue::from_str(value).map_err(|err| err.to_string())?;
        map.append(name, val);
    }
    Ok(map)
}
