// Local helper only (never used on Vercel or the VPS).
// Some Indian ISPs' DNS servers refuse to resolve *.neon.tech. When running
// setup commands from this PC against Neon, look those names up via public DNS.
//   node --import ./scripts/dns-neon.mjs ...
import dns from 'node:dns'

const resolver = new dns.Resolver()
resolver.setServers(['8.8.8.8', '1.1.1.1'])
const original = dns.lookup

dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  if (typeof options === 'number') options = { family: options }
  if (!/\.neon\.tech$/i.test(hostname)) return original.call(dns, hostname, options, callback)
  resolver.resolve4(hostname, (err, addrs) => {
    if (err || !addrs?.length) return original.call(dns, hostname, options, callback)
    if (options?.all) return callback(null, addrs.map((address) => ({ address, family: 4 })))
    callback(null, addrs[0], 4)
  })
}
