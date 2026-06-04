import {
  dag,
  Container,
  Directory,
  object,
  func,
  argument,
  check,
} from "@dagger.io/dagger";

@object()
export class Dagnammit {
  source: Directory;

  constructor(
    @argument({ defaultPath: "/", ignore: ["target", ".*"] }) source: Directory,
  ) {
    this.source = source;
  }

  /**
   * Returns a container suitable for builds
   */
  @func()
  buildEnv(): Container {
    return dag
      .container()
      .from("rust:1.96.0")
      .withExec(["rustup", "component", "add", "rustfmt", "clippy"])
      .withWorkdir("/src")
      .withMountedCache("/src/target", dag.cacheVolume("rust-target"))
      .withMountedCache("/usr/local/cargo/registry", dag.cacheVolume("cargo"))
      .withDirectory("/src", this.source);
  }

  /**
   * Run clippy
   */
  @func()
  @check()
  clippy() {
    return this.buildEnv().withExec(["cargo", "clippy"]);
  }

  /**
   * Check formatting
   */
  @func()
  @check()
  fmt() {
    return this.buildEnv().withExec(["cargo", "fmt", "--check"]);
  }

  /**
   * Build the application
   */
  @func()
  build() {
    return this.buildEnv().withExec(["cargo", "build", "--release"]);
  }

  /**
   * Build a container image
   */
  @func()
  image() {
    // We can't copy out of a cache, apparently. So just copy the file to an uncached location.
    const build = this.build()
      .withExec(["cp", "/src/target/release/dagnammit", "/"])
      .withExec(["strip", "/dagnammit"]);

    const exe = build.file("/dagnammit");

    return dag
      .container()
      .from("gcr.io/distroless/cc-debian13")
      .withUser("nonroot")
      .withExposedPort(3000)
      .withLabel(
        "org.opencontainers.image.source",
        "https://github.com/accidentaldevelopment/dagnammit",
      )
      .withLabel(
        "org.opencontainers.image.description",
        "A definitely not useless application",
      )
      .withFile("/dagnammit", exe)
      .withEntrypoint(["/dagnammit"]);
  }

  /**
   * Return a running service. Call with `up` to use.
   *
   * @example dagger call svc up
   */
  @func()
  async svc() {
    return this.image().asService();
  }
}
