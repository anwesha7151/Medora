import fs from "node:fs";
import path from "node:path";

const ssrDir = path.resolve(".output/server/_ssr");
const libsDir = path.resolve(".output/server/_libs");

const exportAllDef = `var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
`;

if (fs.existsSync(ssrDir)) {
  const files = fs.readdirSync(ssrDir).filter((f) => f.endsWith(".mjs"));
  for (const file of files) {
    const filePath = path.join(ssrDir, file);
    let content = fs.readFileSync(filePath, "utf8");

    if (content.includes("__exportAll")) {
      // Remove any import that imports __exportAll
      content = content.replace(
        /import\s*\{([^}]*)\}\s*from\s*["'](\.[^"']+)["'];?/g,
        (match, imports, specifier) => {
          const importList = imports
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          const filtered = importList.filter(
            (i) => !i.includes("__exportAll") && !i.endsWith(" as n"),
          );
          if (filtered.length === 0) return "";
          return `import { ${filtered.join(", ")} } from "${specifier}";`;
        },
      );

      if (!content.includes("var __exportAll =")) {
        content = exportAllDef + content;
      }
    }

    if (content.includes("(void 0)(")) {
      content = content.replace(
        /\(void 0\)\(/g,
        "(import_jsx_dev_runtime.jsxDEV || import_jsx_dev_runtime.jsx)(",
      );
    }

    fs.writeFileSync(filePath, content);
  }
}

if (fs.existsSync(libsDir)) {
  const libFiles = fs.readdirSync(libsDir).filter((f) => f.endsWith(".mjs"));
  for (const file of libFiles) {
    const filePath = path.join(libsDir, file);
    let content = fs.readFileSync(filePath, "utf8");

    if (
      content.includes("require_react_jsx_dev_runtime_production") ||
      content.includes("exports.jsxDEV = void 0")
    ) {
      content = content.replace(
        /exports\.jsxDEV\s*=\s*void\s*0;?/g,
        () => `var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element");
  function jsxProd(type, config, maybeKey) {
    var key = null;
    if (maybeKey !== undefined) key = "" + maybeKey;
    if (config && config.key !== undefined) key = "" + config.key;
    var props = {};
    if (config) {
      for (var propName in config) {
        if (propName !== "key") props[propName] = config[propName];
      }
    }
    return {
      $$typeof: REACT_ELEMENT_TYPE,
      type: type,
      key: key,
      ref: config && config.ref !== undefined ? config.ref : null,
      props: props
    };
  }
  exports.jsxDEV = jsxProd;
  exports.jsx = jsxProd;
  exports.jsxs = jsxProd;`,
      );
      fs.writeFileSync(filePath, content);
    }
  }
}

console.log("[fix-ssr-build] SSR bundles patched successfully.");
