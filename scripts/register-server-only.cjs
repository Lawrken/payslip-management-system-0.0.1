/* eslint-disable @typescript-eslint/no-require-imports */

const Module = require("node:module")

const originalLoad = Module._load

function isServerOnlyModule(request) {
  const normalized = request.replace(/\\/g, "/")
  return (
    normalized === "server-only" ||
    normalized.endsWith("/server-only") ||
    normalized.includes("/server-only/")
  )
}

Module._load = function (request) {
  if (isServerOnlyModule(request)) {
    return {}
  }

  return originalLoad.apply(this, arguments)
}
