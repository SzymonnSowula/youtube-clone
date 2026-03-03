import crypto from 'crypto'

const isSandbox = process.env.WHOP_SANDBOX === 'true'
const UI_BASE = isSandbox ? 'https://sandbox.whop.com' : 'https://whop.com'
const API_BASE = isSandbox ? 'https://sandbox-api.whop.com' : 'https://api.whop.com'

const WHOP_AUTHORIZE_URL = `${UI_BASE}/oauth/authorize`
const WHOP_TOKEN_URL = `${API_BASE}/oauth/token`
const WHOP_USERINFO_URL = `${API_BASE}/oauth/userinfo`

export function generatePKCE() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')

  return { codeVerifier, codeChallenge }
}

export function generateState() {
  return crypto.randomBytes(16).toString('hex')
}

export function buildAuthorizeUrl(params: {
  clientId: string
  redirectUri: string
  codeChallenge: string
  state: string
}) {
  const searchParams = new URLSearchParams({
    response_type: 'code',
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    scope: 'openid profile email chat:message:create chat:read dms:read dms:message:manage dms:channel:manage',
    state: params.state,
    code_challenge: params.codeChallenge,
    code_challenge_method: 'S256',
    nonce: crypto.randomBytes(16).toString('hex'),
  })

  return `${WHOP_AUTHORIZE_URL}?${searchParams.toString()}`
}

export async function exchangeCodeForTokens(params: {
  code: string
  codeVerifier: string
  clientId: string
  clientSecret: string
  redirectUri: string
}) {
  const response = await fetch(WHOP_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
      redirect_uri: params.redirectUri,
      client_id: params.clientId,
      client_secret: params.clientSecret,
      code_verifier: params.codeVerifier,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('Token exchange failed:', response.status, errorBody)
    throw new Error(`Token exchange failed (${response.status}): ${errorBody}`)
  }

  return response.json() as Promise<{
    access_token: string
    refresh_token: string
    id_token?: string
    token_type: string
    expires_in: number
  }>
}

export async function fetchUserInfo(accessToken: string) {
  const response = await fetch(WHOP_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('Userinfo fetch failed:', response.status, errorBody)
    throw new Error(`Userinfo fetch failed (${response.status}): ${errorBody}`)
  }

  return response.json() as Promise<{
    sub: string // Whop user ID (user_xxxxxxxxxxxxx)
    name?: string
    preferred_username?: string
    picture?: string
    email?: string
    email_verified?: boolean
  }>
}
