const { parse } = require("tldts")
const net = require("net")

function extractEntities(url) {
  try {
    const u = new URL(url)

    const host = u.hostname

    let ip = null
    let domain = null

    if (net.isIP(host)) {
      ip = host
    } else {
      const parsed = parse(host)
      domain = parsed.domain || host
    }

    return { ip, domain }
  } catch (e) {
    return {}
  }
}

module.exports = { extractEntities }
