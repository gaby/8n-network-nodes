const { src, dest } = require("gulp");

function buildIcons() {
  return src(["nodes/**/*.svg", "nodes/**/*.png"]).pipe(dest("dist/"));
}

exports["build:icons"] = buildIcons;
