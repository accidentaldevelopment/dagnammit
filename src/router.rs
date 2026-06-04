use axum::{Router, http::StatusCode, response::IntoResponse, routing::get};
use tower_http::trace::{DefaultMakeSpan, TraceLayer};
use tracing::Level;

pub fn build() -> Router {
    Router::new()
        .route("/livez", get(livez))
        .route("/hi", get(hi))
        .route("/bye", get(bye))
        .layer(TraceLayer::new_for_http().make_span_with(DefaultMakeSpan::new().level(Level::INFO)))
}

async fn livez() -> StatusCode {
    StatusCode::NO_CONTENT
}

async fn hi() -> impl IntoResponse {
    "hello!"
}

async fn bye() -> impl IntoResponse {
     "buh bye"
}

#[cfg(test)]
mod tests {
    use axum::{
        Router,
        body::Body,
        http::{Request, StatusCode},
    };
    use tower::ServiceExt as _;

    fn router() -> Router {
        super::build()
    }

    #[tokio::test]
    async fn get_livez() {
        let response = router()
            .oneshot(Request::get("/livez").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NO_CONTENT);
    }

    #[tokio::test]
    async fn head_livez() {
        let response = router()
            .oneshot(Request::head("/livez").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NO_CONTENT);
    }

    #[tokio::test]
    async fn get_hi() {
        let response = router()
            .oneshot(Request::get("/hi").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            &axum::body::to_bytes(response.into_body(), 6)
                .await
                .expect("should be bytes")[..],
            b"hello!"
        );
    }

    #[tokio::test]
    async fn get_bye() {
        let response = router()
            .oneshot(Request::get("/bye").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            &axum::body::to_bytes(response.into_body(), 7)
                .await
                .expect("should be bytes")[..],
            b"buh bye"
        );
    }
}
