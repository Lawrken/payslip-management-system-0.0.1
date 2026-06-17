const Module = require("node:module")

const originalLoad = Module._load

function isServerOnlyModule(request) {
  return (
    request === "server-only" ||
    request.endsWith("/server-only") ||
    request.includes("/server-only/")
  )
}

Module._load = function (request, parent, isMain) {
  if (isServerOnlyModule(request)) {
    return {}
  }

  return originalLoad.apply(this, arguments)
}
