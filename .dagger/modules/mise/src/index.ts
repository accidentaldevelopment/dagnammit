import { dag, Container, object, func } from "@dagger.io/dagger";

@object()
export class Mise {
  @func()
  container(): Container {
    return dag
      .container()
      .from("debian:trixie")
      .withMountedCache("/mise", dag.cacheVolume(`mise`))
      .withEnvVariable("MISE_DATA_DIR", "/mise")
      .withEnvVariable("MISE_CONFIG_DIR", "/mise")
      .withEnvVariable("MISE_CACHE_DIR", "/mise/cache")
      .withEnvVariable("MISE_INSTALL_PATH", "/usr/local/bin/mise")
      .withEnvVariable("PATH", "/mise/shims:$PATH", { expand: true })
      .withExec([
        "sh",
        "-c",
        "apt-get update && apt-get upgrade -y && apt-get install -y build-essential curl && rm -rf /var/lib/apt/lists/*",
      ])
      .withExec(["sh", "-c", "curl https://mise.run | sh"]);
  }
}
