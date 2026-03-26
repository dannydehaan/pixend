use aes_gcm::aead::{Aead, AeadCore, KeyInit, OsRng};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use serde_json;
use std::collections::HashMap;
use std::fmt;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use dirs::config_dir;
use rand_core::RngCore;
use tokio::fs;
use tokio::io::AsyncWriteExt;
use tokio::sync::Mutex;

/// Indicates whether a secret belongs to a guest session or an authenticated Laravel user.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum AccountMode {
    Guest,
    Authenticated { user_id: u64 },
}

/// Metadata about a stored secret. This model deliberately excludes the secret value itself.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecretMetadata {
    pub key: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub account: AccountMode,
    pub sensitive: bool,
    pub version: u64,
    pub created_at: String,
    pub updated_at: String,
}

/// Represents a reference to an encrypted secret blob stored on disk.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecretReference {
    pub key: String,
    pub version: u64,
    pub metadata: SecretMetadata,
}

/// Value returned when a secret is revealed. The bytes are kept opaque to avoid accidental logging.
#[derive(Clone, Serialize, Deserialize)]
pub struct SecretValue(pub Vec<u8>);

impl fmt::Debug for SecretValue {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "SecretValue(***hidden***)")
    }
}

/// Errors emitted by the secure storage layer.
#[derive(Debug, thiserror::Error)]
pub enum SecretStoreError {
    #[error("Secret not found for key {0}")]
    NotFound(String),
    #[error("Access denied")]
    AccessDenied,
    #[error("Storage backend failure: {0}")]
    Backend(String),
}

/// Result type for secret store operations.
pub type SecretStoreResult<T> = Result<T, SecretStoreError>;

const METADATA_FILE: &str = "guest_manifest.json";
const KEY_FILE: &str = "guest_master_key.bin";
const NONCE_LEN: usize = 12;

#[async_trait]
pub trait SecretStore: Send + Sync {
    async fn list_metadata(&self, account: AccountMode) -> SecretStoreResult<Vec<SecretMetadata>>;
    async fn read_secret(&self, account: AccountMode, key: &str) -> SecretStoreResult<SecretValue>;
    async fn write_secret(
        &self,
        account: AccountMode,
        metadata: SecretMetadata,
        value: &[u8],
    ) -> SecretStoreResult<SecretReference>;
    async fn delete_secret(&self, account: AccountMode, key: &str) -> SecretStoreResult<()>;
    async fn clear_account(&self, account: AccountMode) -> SecretStoreResult<()>;
}

pub struct GuestSecretStore {
    base_dir: PathBuf,
    master_key: Key<Aes256Gcm>,
    metadata: Mutex<HashMap<String, SecretMetadata>>,
}

impl GuestSecretStore {
    pub async fn new() -> SecretStoreResult<Self> {
        let mut base_dir = config_dir()
            .ok_or_else(|| SecretStoreError::Backend("Failed to resolve config dir".into()))?;
        base_dir.push("pixend");
        base_dir.push("secure-secrets");
        base_dir.push("guest");
        fs::create_dir_all(&base_dir)
            .await
            .map_err(|err: std::io::Error| SecretStoreError::Backend(err.to_string()))?;

        let master_key_bytes = Self::load_or_generate_key(&base_dir).await?;
        let master_key = Key::<Aes256Gcm>::from_slice(&master_key_bytes);
        let metadata = Self::load_metadata(&base_dir).await?;

        Ok(Self {
            base_dir,
            master_key: *master_key,
            metadata: Mutex::new(metadata),
        })
    }

    async fn load_or_generate_key(base_dir: &Path) -> SecretStoreResult<[u8; 32]> {
        let key_path = base_dir.join(KEY_FILE);
        if let Ok(existing) = fs::read(&key_path).await {
            if existing.len() == 32 {
                let mut key = [0u8; 32];
                key.copy_from_slice(&existing);
                return Ok(key);
            }
        }
        let mut key = [0u8; 32];
        OsRng.fill_bytes(&mut key);
        let mut file = fs::File::create(&key_path)
            .await
            .map_err(|err| SecretStoreError::Backend(err.to_string()))?;
        file.write_all(&key)
            .await
            .map_err(|err| SecretStoreError::Backend(err.to_string()))?;
        Ok(key)
    }

    async fn load_metadata(base_dir: &Path) -> SecretStoreResult<HashMap<String, SecretMetadata>> {
        let manifest_path = base_dir.join(METADATA_FILE);
        if !manifest_path.exists() {
            return Ok(HashMap::new());
        }
        let contents = fs::read(&manifest_path)
            .await
            .map_err(|err| SecretStoreError::Backend(err.to_string()))?;
        let map: HashMap<String, SecretMetadata> = serde_json::from_slice(&contents)
            .map_err(|err| SecretStoreError::Backend(err.to_string()))?;
        Ok(map)
    }

    async fn persist_metadata(
        &self,
        map: &HashMap<String, SecretMetadata>,
    ) -> SecretStoreResult<()> {
        let manifest_path = self.base_dir.join(METADATA_FILE);
        let data =
            serde_json::to_vec(map).map_err(|err| SecretStoreError::Backend(err.to_string()))?;
        let mut file = fs::File::create(&manifest_path)
            .await
            .map_err(|err| SecretStoreError::Backend(err.to_string()))?;
        file.write_all(&data)
            .await
            .map_err(|err| SecretStoreError::Backend(err.to_string()))?;
        Ok(())
    }

    fn secret_path(&self, key: &str) -> PathBuf {
        self.base_dir.join(format!("{}.enc", key))
    }

    fn cipher(&self) -> Aes256Gcm {
        Aes256Gcm::new(&self.master_key)
    }

    fn current_timestamp() -> String {
        DateTime::<Utc>::from(Utc::now()).to_rfc3339()
    }
}

#[async_trait]
impl SecretStore for GuestSecretStore {
    async fn list_metadata(&self, account: AccountMode) -> SecretStoreResult<Vec<SecretMetadata>> {
        if account != AccountMode::Guest {
            return Err(SecretStoreError::AccessDenied);
        }
        let map = self.metadata.lock().await;
        Ok(map.values().cloned().collect())
    }

    async fn read_secret(&self, account: AccountMode, key: &str) -> SecretStoreResult<SecretValue> {
        if account != AccountMode::Guest {
            return Err(SecretStoreError::AccessDenied);
        }
        let path = self.secret_path(key);
        let data = fs::read(&path)
            .await
            .map_err(|_err| SecretStoreError::NotFound(key.to_string()))?;
        if data.len() < NONCE_LEN {
            return Err(SecretStoreError::Backend("Corrupted data".into()));
        }
        let nonce = Nonce::from_slice(&data[..NONCE_LEN]);
        let ciphertext = &data[NONCE_LEN..];
        let plain = self
            .cipher()
            .decrypt(nonce, ciphertext)
            .map_err(|err| SecretStoreError::Backend(err.to_string()))?;
        Ok(SecretValue(plain))
    }

    async fn write_secret(
        &self,
        account: AccountMode,
        mut metadata: SecretMetadata,
        value: &[u8],
    ) -> SecretStoreResult<SecretReference> {
        if account != AccountMode::Guest {
            return Err(SecretStoreError::AccessDenied);
        }
        let mut metadata_map = self.metadata.lock().await;
        if let Some(existing) = metadata_map.get(&metadata.key) {
            metadata.version = existing.version + 1;
            metadata.created_at = existing.created_at.clone();
        } else {
            metadata.version = 1;
            metadata.created_at = Self::current_timestamp();
        }
        metadata.updated_at = Self::current_timestamp();
        metadata.account = AccountMode::Guest;
        let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
        let cipher = self.cipher();
        let ciphertext = cipher
            .encrypt(&nonce, value)
            .map_err(|err| SecretStoreError::Backend(err.to_string()))?;
        let mut file = fs::File::create(self.secret_path(&metadata.key))
            .await
            .map_err(|err| SecretStoreError::Backend(err.to_string()))?;
        file.write_all(nonce.as_slice())
            .await
            .map_err(|err| SecretStoreError::Backend(err.to_string()))?;
        file.write_all(&ciphertext)
            .await
            .map_err(|err| SecretStoreError::Backend(err.to_string()))?;
        metadata_map.insert(metadata.key.clone(), metadata.clone());
        self.persist_metadata(&metadata_map).await?;
        Ok(SecretReference {
            key: metadata.key.clone(),
            version: metadata.version,
            metadata,
        })
    }

    async fn delete_secret(&self, account: AccountMode, key: &str) -> SecretStoreResult<()> {
        if account != AccountMode::Guest {
            return Err(SecretStoreError::AccessDenied);
        }
        let mut metadata_map = self.metadata.lock().await;
        metadata_map.remove(key);
        let _ = fs::remove_file(self.secret_path(key)).await;
        self.persist_metadata(&metadata_map).await
    }

    async fn clear_account(&self, account: AccountMode) -> SecretStoreResult<()> {
        if account != AccountMode::Guest {
            return Err(SecretStoreError::AccessDenied);
        }
        let mut metadata_map = self.metadata.lock().await;
        metadata_map.clear();
        let mut dir = fs::read_dir(&self.base_dir)
            .await
            .map_err(|err| SecretStoreError::Backend(err.to_string()))?;
        while let Some(entry) = dir
            .next_entry()
            .await
            .map_err(|err| SecretStoreError::Backend(err.to_string()))?
        {
            let path = entry.path();
            if path.is_file()
                && path
                    .file_name()
                    .map_or(false, |name| name != METADATA_FILE && name != KEY_FILE)
            {
                let _ = fs::remove_file(path.clone()).await;
            }
        }
        self.persist_metadata(&metadata_map).await
    }
}

static GUEST_STORE: OnceCell<Arc<GuestSecretStore>> = OnceCell::new();

async fn guest_store() -> SecretStoreResult<Arc<GuestSecretStore>> {
    if let Some(store) = GUEST_STORE.get() {
        return Ok(store.clone());
    }
    let store = Arc::new(GuestSecretStore::new().await?);
    let _ = GUEST_STORE.set(store.clone());
    Ok(store)
}

fn require_guest_mode(account: &AccountMode) -> SecretStoreResult<()> {
    if *account == AccountMode::Guest {
        Ok(())
    } else {
        Err(SecretStoreError::AccessDenied)
    }
}

pub async fn list_secret_metadata_impl(
    account: AccountMode,
) -> SecretStoreResult<Vec<SecretMetadata>> {
    require_guest_mode(&account)?;
    guest_store().await?.list_metadata(account.clone()).await
}

pub async fn reveal_secret_impl(
    account: AccountMode,
    key: String,
) -> SecretStoreResult<SecretValue> {
    require_guest_mode(&account)?;
    guest_store().await?.read_secret(account.clone(), &key).await
}

pub async fn upsert_secret_impl(
    account: AccountMode,
    metadata: SecretMetadata,
    value: Vec<u8>,
) -> SecretStoreResult<SecretReference> {
    require_guest_mode(&account)?;
    guest_store()
        .await?
        .write_secret(account.clone(), metadata, &value)
        .await
}

pub async fn delete_secret_impl(account: AccountMode, key: String) -> SecretStoreResult<()> {
    require_guest_mode(&account)?;
    guest_store().await?.delete_secret(account.clone(), &key).await
}

pub async fn clear_account_impl(account: AccountMode) -> SecretStoreResult<()> {
    require_guest_mode(&account)?;
    guest_store().await?.clear_account(account.clone()).await
}
