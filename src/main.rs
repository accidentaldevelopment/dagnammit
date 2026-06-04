fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync + 'static>> {
    let cfg = dagnammit::Config::from_env()?;
    dagnammit::run(cfg)
}
