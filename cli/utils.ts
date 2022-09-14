import lume from "../mod.ts";
import { toFileUrl } from "../deps/path.ts";
import { cyan, dim, green, red } from "../deps/colors.ts";
import { getConfigFile, getLumeVersion } from "../core/utils.ts";

import type { Site } from "../core.ts";

/** Create a site instance */
export async function createSite(root: string, config?: string): Promise<Site> {
  const path = await getConfigFile(root, config);

  if (path) {
    console.log(`Loading config file ${dim(path)}`);
    console.log();
    const mod = await import(toFileUrl(path).href);
    return mod.default;
  }

  return lume();
}

/** A list of the available optional plugins */
export const pluginNames = [
  "attributes",
  "base_path",
  "code_highlight",
  "date",
  "esbuild",
  "eta",
  "imagick",
  "inline",
  "jsx",
  "jsx_preact",
  "lightningcss",
  "liquid",
  "metas",
  "minify_html",
  "modify_urls",
  "multilanguage",
  "netlify_cms",
  "on_demand",
  "postcss",
  "prism",
  "pug",
  "relations",
  "relative_urls",
  "resolve_urls",
  "sass",
  "slugify_urls",
  "svgo",
  "terser",
  "windi_css",
];

/** A list of the available plugins with init configurations */
export const initPlugins = [
  "jsx",
  "jsx_preact",
];

export function log(...lines: (string | undefined)[]) {
  console.log("----------------------------------------");
  lines.forEach((line) => line && console.log(line));
  console.log("----------------------------------------");
}

export function promptConfigUpdate(data: unknown) {
  log(
    red("deno.jsonc needs to be manually updated:"),
    dim("Use deno.json to update it automatically"),
    JSON.stringify(data, null, 2),
  );
}

/** Check if the current version is outdated */
export async function checkUpgrade(): Promise<void> {
  const current = getLumeVersion();

  // It's a local version
  if (current.startsWith("local ")) {
    return;
  }

  const stable = !!current.match(/^v\d+\./);
  const expires = 1000 * 60 * 60 * 24; // 1 day
  const interval = localStorage.getItem("lume-upgrade");

  if (interval && parseInt(interval) + expires > Date.now()) {
    return;
  }

  localStorage.setItem("lume-upgrade", Date.now().toString());

  const latest = stable
    ? await getLatestVersion()
    : await getLatestDevelopmentVersion();

  if (current === latest) {
    return;
  }

  let global = "";
  try {
    await Promise.any([
      Deno.stat("deno.json"),
      Deno.stat("deno.jsonc"),
    ]);
    await Deno.stat("import_map.json");
  } catch {
    global = " --global";
  }

  const command = (stable ? "lume upgrade" : "lume upgrade --dev") + global;

  log(
    `Update available ${dim(current)}  → ${green(latest)}`,
    `Run ${cyan(command)} to update`,
  );
}

/** Return the latest stable version from the deno.land/x repository */
export async function getLatestVersion(): Promise<string> {
  const response = await fetch("https://cdn.deno.land/lume/meta/versions.json");
  const versions = await response.json();
  return versions.latest;
}

/** Return the hash of the latest commit from the GitHub repository */
export async function getLatestDevelopmentVersion(): Promise<string> {
  const response = await fetch(
    "https://api.github.com/repos/lumeland/lume/commits?per_page=1",
  );
  const commits = await response.json();
  return commits[0].sha;
}
