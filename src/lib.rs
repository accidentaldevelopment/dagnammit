mod config;
mod router;

pub use config::Config;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub fn run(config: Config) -> Result<(), Box<dyn std::error::Error + Send + Sync + 'static>> {
    let rt = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()?;

    rt.block_on(async move {
        tracing_init();

        let app = router::build();
        let listener = tokio::net::TcpListener::bind(config.addr).await?;

        tracing::info!(addr = %config.addr, "listening");

        axum::serve(listener, app)
            .with_graceful_shutdown(shutdown())
            .await?;

        Ok(())
    })
}

pub fn tracing_init() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .init();
}
pub async fn shutdown() {
    if let Err(e) = tokio::signal::ctrl_c().await {
        tracing::error!(error = %e, "failed to install ctrl_c handler");
        return;
    }
    tracing::info!("shutdown signal received");
}
