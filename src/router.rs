use axum::{Router, http::StatusCode, response::IntoResponse, routing::get};
use tower_http::trace::{DefaultMakeSpan, TraceLayer};
use tracing::Level;

pub fn build() -> Router {
    Router::new()
        .route("/livez", get(livez))
        .route("/hi", get(hi))
        .layer(TraceLayer::new_for_http().make_span_with(DefaultMakeSpan::new().level(Level::INFO)))
}

async fn livez() -> StatusCode {
    StatusCode::NO_CONTENT
}

async fn hi() -> impl IntoResponse {
    "hello!"
}
