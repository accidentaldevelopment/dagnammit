import {
  dag,
  Container,
  Directory,
  object,
  func,
  check,
  Workspace,
} from "@dagger.io/dagger";
import { up } from "../sdk/core";

@object()
export class Dagnammit {
  private source: Directory;

  constructor(ws: Workspace) {
    this.source = ws.directory(".", { gitignore: true });
  }

  /**
   * Returns a container suitable for builds
   */
  @func()
  buildEnv(): Container {
    return dag
      .mise()
      .container()
      .withWorkdir("/src")
      .withMountedCache("/src/target", dag.cacheVolume("rust-target"))
      .withMountedCache("/usr/local/cargo/registry", dag.cacheVolume("cargo"))
      .withFile("mise.toml", this.source.file("mise.toml"))
      .withExec(["mise", "trust"])
      .withExec(["mise", "install"])
      .withDirectory(".", this.source)
      .withExec(["cargo", "fetch", "--locked"]);
  }

  /**
   * Start the service. Doesn't actually work right now...
   */
  @func()
  @up()
  run() {
    return this.buildEnv()
      .withExec(["cargo", "run"])
      .withExposedPort(3000)
      .asService();
  }

  /**
   * Run clippy
   */
  @func()
  @check()
  clippy() {
    return this.buildEnv().withExec(["cargo", "clippy", "--workspace"]);
  }

  /**
   * Check formatting
   */
  @func()
  @check()
  fmt() {
    return this.buildEnv().withExec(["cargo", "fmt", "--check", "--all"]);
  }

  /**
   * Run tests
   */
  @func()
  @check()
  test() {
    return this.buildEnv().withExec(["cargo", "test", "--workspace"]);
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
