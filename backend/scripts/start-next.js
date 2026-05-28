const { spawn } = require("node:child_process");
const path = require("node:path");

const port = process.env.PORT || "3001";
const nextBin = path.join(
  __dirname,
  "..",
  "node_modules",
  ".bin",
  process.platform === "win32" ? "next.cmd" : "next"
);

const child = spawn(nextBin, ["start", "-p", port], {
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
