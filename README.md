# dagnammit

A small Rust HTTP service built on [axum](https://github.com/tokio-rs/axum) and
[tokio](https://tokio.rs), with a [Dagger](https://dagger.io) module for CI,
container builds, and exposing the running service.

## Overview

The service exposes two routes:

| Route    | Method | Response              |
| -------- | ------ | --------------------- |
| `/livez` | `GET`  | `204 No Content`      |
| `/hi`    | `GET`  | `hello!` (text/plain) |

HTTP requests are traced via `tower-http`'s `TraceLayer`. The server shuts
down gracefully on `SIGINT` (`Ctrl-C`).

## Local development

```sh
mise install            # install the pinned Rust toolchain

cargo run               # run the service
cargo test              # run tests
cargo clippy            # lint
cargo fmt --check       # formatting check
```

## Configuration

| Variable         | Default        | Description                                                            |
| ---------------- | -------------- | ---------------------------------------------------------------------- |
| `DAGNAMMIT_ADDR` | `0.0.0.0:3000` | Socket address the HTTP server binds to. Must be a valid `SocketAddr`. |

Example:

```sh
DAGNAMMIT_ADDR=127.0.0.1:8080 cargo run
```

## Dagger module

The `.dagger/` directory defines a `Dagnammit` module written in TypeScript
(SDK pinned by `dagger.json`, engine v0.21.4).

### Setup

1. Install the [Dagger CLI](https://docs.dagger.io/install).
2. Install the module's TypeScript dependencies and generate the SDK:

   ```sh
   dagger develop
   ```

   This installs packages via your package manager and produces the local
   SDK under `.dagger/sdk/`.

### Functions

All functions are invoked as `dagger call <fn> ...` from the repo root.

| Function    | Type   | Purpose                                                  |
| ----------- | ------ | -------------------------------------------------------- |
| `build-env` | base   | Returns a container with rustfmt/clippy and cached deps. |
| `clippy`    | check  | Runs `cargo clippy` in the build environment.            |
| `fmt`       | check  | Runs `cargo fmt --check` in the build environment.       |
| `build`     | action | Produces a release binary (`cargo build --release`).     |
| `image`     | action | Builds a distroless container image exposing port 3000.  |
| `svc`       | action | Returns the image as a running `Service`.                |

### Build a container image

`dagger call image` returns a `Container`. You can inspect it, feed it into
other Dagger functions, or export it locally as an OCI tarball:

```sh
# Inspect what would be built
dagger call image

# Export the image to a local tarball
dagger call image export --path=./dagnammit.tar

# Export/publish local registry
dagger call image export-image --name=dagnammit:tag
```

Once exported, load it into a local engine:

```sh
docker load -i dagnammit.tar
docker run --rm -p 3000:3000 dagnammit:latest
```

### Expose the service

Use `svc` to run the image as a Dagger `Service`:

```sh
# Run interactively in the foreground, exposing port 3000
dagger call svc up
```

`dagger call svc` (without `up`) returns the `Service` object, which can be
consumed by other Dagger functions in a pipeline (e.g. for integration tests
or chaining to another container).
