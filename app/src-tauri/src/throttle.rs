#[cfg(test)]
use crate::network::NetworkState;
use crate::network::{NetworkProfile, SharedNetworkState};
use std::time::{Duration, Instant};
use tokio::sync::Mutex;

pub fn kbps_to_bytes_per_second(kbps: u64) -> u64 {
    kbps.saturating_mul(1024)
}

#[derive(Debug)]
struct BandwidthLimiter {
    rate_bps: u64,
    tokens: f64,
    last_refill: Instant,
}

impl BandwidthLimiter {
    fn new(rate_bps: u64) -> Self {
        assert!(rate_bps > 0, "rate must be positive");
        Self {
            rate_bps,
            tokens: rate_bps as f64,
            last_refill: Instant::now(),
        }
    }

    fn refill(&mut self) {
        let now = Instant::now();
        let elapsed = now.duration_since(self.last_refill).as_secs_f64();
        if elapsed <= 0.0 {
            return;
        }
        self.tokens = (self.tokens + (self.rate_bps as f64 * elapsed)).min(self.rate_bps as f64);
        self.last_refill = now;
    }

    fn consume(&mut self, bytes: usize) -> Duration {
        self.refill();
        let amount = bytes as f64;
        if self.tokens >= amount {
            self.tokens -= amount;
            Duration::ZERO
        } else {
            let deficit = amount - self.tokens;
            self.tokens = 0.0;
            let wait_secs = deficit / self.rate_bps as f64;
            Duration::from_secs_f64(wait_secs)
        }
    }
}

#[derive(Debug)]
struct LimiterState {
    profile_id: String,
    download: Option<BandwidthLimiter>,
    upload: Option<BandwidthLimiter>,
    latency_ms: u64,
}

impl LimiterState {
    fn from_profile(profile: &NetworkProfile) -> Self {
        let download = if profile.download_kbps > 0 {
            Some(BandwidthLimiter::new(kbps_to_bytes_per_second(
                profile.download_kbps,
            )))
        } else {
            None
        };
        let upload = if profile.upload_kbps > 0 {
            Some(BandwidthLimiter::new(kbps_to_bytes_per_second(
                profile.upload_kbps,
            )))
        } else {
            None
        };
        Self {
            profile_id: profile.preset_id.clone(),
            download,
            upload,
            latency_ms: profile.latency_ms,
        }
    }
}

pub struct NetworkThrottler {
    state: SharedNetworkState,
    limiter_state: Mutex<LimiterState>,
}

impl NetworkThrottler {
    pub fn new(state: SharedNetworkState) -> Self {
        let fallback = NetworkProfile {
            preset_id: "no_limit".into(),
            label: "No limit".into(),
            enabled: false,
            download_kbps: 0,
            upload_kbps: 0,
            latency_ms: 0,
        };
        Self {
            state,
            limiter_state: Mutex::new(LimiterState::from_profile(&fallback)),
        }
    }

    async fn refresh_if_needed(&self, profile: &NetworkProfile, guard: &mut LimiterState) {
        if guard.profile_id != profile.preset_id {
            *guard = LimiterState::from_profile(profile);
        }
    }

    async fn current_profile(&self) -> NetworkProfile {
        self.state.get_profile().await
    }

    async fn enforce(&self, bytes: usize, is_download: bool) -> Duration {
        let profile = self.current_profile().await;
        if !profile.enabled {
            return Duration::ZERO;
        }
        if profile.download_kbps == 0 || profile.upload_kbps == 0 {
            return Duration::ZERO;
        }
        let mut guard = self.limiter_state.lock().await;
        self.refresh_if_needed(&profile, &mut guard).await;
        let bucket = if is_download {
            &mut guard.download
        } else {
            &mut guard.upload
        };
        bucket
            .as_mut()
            .map(|limiter| limiter.consume(bytes))
            .unwrap_or(Duration::ZERO)
    }

    pub async fn enforce_download(&self, bytes: usize) -> Duration {
        self.enforce(bytes, true).await
    }

    pub async fn enforce_upload(&self, bytes: usize) -> Duration {
        self.enforce(bytes, false).await
    }

    pub async fn latency_delay(&self) -> Duration {
        let profile = self.current_profile().await;
        if !profile.enabled {
            Duration::ZERO
        } else {
            Duration::from_millis(profile.latency_ms)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::network::{NetworkPreset, NetworkProfile};
    use std::sync::Arc;

    #[test]
    fn converts_kbps_to_bytes() {
        assert_eq!(kbps_to_bytes_per_second(1), 1024);
        assert_eq!(kbps_to_bytes_per_second(50), 51200);
    }

    #[test]
    fn limiter_needs_positive_rate() {
        let profile = NetworkProfile {
            preset_id: "custom".into(),
            label: "Custom".into(),
            enabled: true,
            download_kbps: 0,
            upload_kbps: 1,
            latency_ms: 0,
        };
        let mut guard = LimiterState::from_profile(&profile);
        assert!(guard.download.is_none());
        assert!(guard.upload.is_some());
    }

    #[tokio::test]
    async fn limiter_consumes_and_waits() {
        let profile = NetworkProfile {
            preset_id: NetworkPreset::EDGE.to_string(),
            label: "EDGE".into(),
            enabled: true,
            download_kbps: 30,
            upload_kbps: 15,
            latency_ms: 100,
        };
        let state = Arc::new(NetworkState::new());
        state.set_profile(profile.clone()).await.unwrap();
        let throttler = NetworkThrottler::new(state.clone());
        let first = throttler.enforce_download(1024 * 3).await; // 3 KB
        assert_eq!(first, Duration::ZERO);
        let second = throttler.enforce_download(1024 * 40).await;
        assert!(second > Duration::ZERO);
        let latency = throttler.latency_delay().await;
        assert_eq!(latency, Duration::from_millis(100));
    }
}
