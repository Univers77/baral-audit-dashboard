import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isPrivateIp } from '@/lib/security/safe-remote-fetch'

/**
 * Regla central del gateway SSRF. Si algo de esto se rompe, la aplicación
 * vuelve a poder alcanzar infraestructura interna desde una URL de usuario.
 */
describe('isPrivateIp — destinos que deben bloquearse', () => {
  const bloqueadas: [string, string][] = [
    ['127.0.0.1', 'loopback IPv4'],
    ['127.5.5.5', 'loopback, rango completo'],
    ['0.0.0.0', 'dirección no especificada'],
    ['10.0.0.5', 'RFC1918 clase A'],
    ['172.16.0.1', 'RFC1918 clase B, inicio'],
    ['172.31.255.254', 'RFC1918 clase B, fin'],
    ['192.168.1.1', 'RFC1918 clase C'],
    ['169.254.169.254', 'metadata de nube'],
    ['169.254.1.1', 'link-local'],
    ['100.64.0.1', 'CGNAT'],
    ['224.0.0.1', 'multicast'],
    ['240.0.0.1', 'reservado'],
    ['198.18.0.1', 'benchmarking'],
    ['::1', 'loopback IPv6'],
    ['fe80::1', 'link-local IPv6'],
    ['fc00::1', 'unique-local IPv6'],
    ['fd12:3456::1', 'unique-local IPv6 (fd)'],
    ['ff02::1', 'multicast IPv6'],
    ['::ffff:127.0.0.1', 'IPv4-mapeada a loopback'],
    ['::ffff:192.168.0.1', 'IPv4-mapeada a red privada'],
  ]

  for (const [ip, motivo] of bloqueadas) {
    it(`bloquea ${ip} (${motivo})`, () => {
      assert.equal(isPrivateIp(ip), true)
    })
  }
})

describe('isPrivateIp — destinos públicos que deben permitirse', () => {
  const permitidas: [string, string][] = [
    ['8.8.8.8', 'Google DNS'],
    ['1.1.1.1', 'Cloudflare DNS'],
    ['93.184.216.34', 'example.com'],
    ['172.32.0.1', 'justo por encima de RFC1918'],
    ['172.15.255.255', 'justo por debajo de RFC1918'],
    ['2606:4700:4700::1111', 'Cloudflare IPv6'],
    ['2001:4860:4860::8888', 'Google IPv6'],
  ]

  for (const [ip, motivo] of permitidas) {
    it(`permite ${ip} (${motivo})`, () => {
      assert.equal(isPrivateIp(ip), false)
    })
  }
})

describe('isPrivateIp — entradas no válidas', () => {
  it('rechaza texto que no es una IP', () => {
    // Ante lo desconocido se falla cerrado, nunca abierto.
    assert.equal(isPrivateIp('no-soy-una-ip'), true)
    assert.equal(isPrivateIp(''), true)
  })
})
