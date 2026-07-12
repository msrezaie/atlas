// Lets `node build-css.ts` follow the repo's extensionless relative imports
// (./palette, ./scale, …) by resolving them to their .ts files. Used only by
// the build:css script — the app's bundler handles this on its own.
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !/\.[cm]?[jt]s$/.test(specifier)) {
      try {
        return nextResolve(specifier + ".ts", context);
      } catch {
        /* fall through to default */
      }
    }
    return nextResolve(specifier, context);
  },
});
