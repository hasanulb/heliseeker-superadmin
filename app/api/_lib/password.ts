import { randomBytes, scryptSync, timingSafeEqual } from "crypto"

const KEY_LEN = 64
const SALT_LEN = 16
const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN)
  const derived = scryptSync(password, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  }) as Buffer

  return [
    "scrypt",
    String(SCRYPT_N),
    String(SCRYPT_R),
    String(SCRYPT_P),
    salt.toString("base64"),
    derived.toString("base64"),
  ].join("$")
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [algo, n, r, p, saltB64, hashB64] = storedHash.split("$")
    if (algo !== "scrypt" || !n || !r || !p || !saltB64 || !hashB64) return false

    const salt = Buffer.from(saltB64, "base64")
    const expected = Buffer.from(hashB64, "base64")
    const derived = scryptSync(password, salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    }) as Buffer

    if (derived.length !== expected.length) return false
    return timingSafeEqual(derived, expected)
  } catch {
    return false
  }
}
