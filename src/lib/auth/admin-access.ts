type AdminEnv = Record<string, string | undefined>

const ADMIN_EMAIL_SEPARATOR_RE = /[\s,;]+/

export function normalizeAdminEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? ''
}

export function getConfiguredAdminEmails(env: AdminEnv = process.env) {
  return [
    env.ADMIN_EMAILS,
    env.ADMIN_EMAIL,
  ]
    .filter(Boolean)
    .flatMap(value => value!.split(ADMIN_EMAIL_SEPARATOR_RE))
    .map(normalizeAdminEmail)
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined, env: AdminEnv = process.env) {
  const normalizedEmail = normalizeAdminEmail(email)
  if (!normalizedEmail) return false

  return getConfiguredAdminEmails(env).includes(normalizedEmail)
}
