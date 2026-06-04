use std::net::SocketAddr;

#[derive(Debug, Clone)]
pub struct Config {
    pub addr: SocketAddr,
}

impl Config {
    pub fn from_env() -> Result<Self, ConfigError> {
        let addr = std::env::var("DAGNAMMIT_ADDR")
            .unwrap_or_else(|_| "0.0.0.0:3000".to_string())
            .parse::<SocketAddr>()
            .map_err(ConfigError::InvalidAddr)?;
        Ok(Self { addr })
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("invalid DAGNAMMIT_ADDR: {0}")]
    InvalidAddr(#[from] std::net::AddrParseError),
}
