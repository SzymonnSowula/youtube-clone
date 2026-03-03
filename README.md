# How to Build a YouTube Clone with Next.js and Whop

Build a YouTube clone with Next.js and the Whop API. This step-by-step tutorial guides you from scratch to a fully working YouTube Clone with authentication, channel memberships, content gating, creator payouts, and embedded community chat.

**Key takeaways**
- Whop's single SDK replaces separate services for payments, authentication, webhooks, and KYC when building creator platforms.
- Combining Next.js, Supabase, and Whop's sandbox lets you build a full YouTube clone with memberships, gated content, and payouts.
- Whop's sandbox environment enables testing the complete payment and subscription flow without processing real money.

---

Building a YouTube clone is easier than ever with Whop's payment infrastructure, Next.js, and Whop's sandbox playground.

Traditionally, a video platform requires stitching together a payments service (Stripe), Auth0 or Clerk for authentication, a webhook processor, a video hosting pipeline, and custom KYC flows for creator payouts.

Whop replaces all of this with a single SDK.

This tutorial walks you through creating a fully functional YouTube clone with user authentication, channel memberships, video gating, creator payouts, Super Chats, and more — before deploying it to Vercel.

The project has three main parts:
- **Next.js app** — handles the frontend and API routes
- **Supabase database** — stores users, channels, videos, tiers, and subscriptions
- **Whop infrastructure** — handles user authentication, payments, and creator payouts

---

## Project overview

Before we start coding, let's see what you'll be building.

By the end of this tutorial, you'll have a video platform that includes these pages and features:

### Pages
- `/` — Homepage with video grid and tag filters
- `/signin` — Whop OAuth login
- `/watch/[id]` — Video player with membership gating
- `/channel/[username]` — Public channel profile with membership tiers
- `/creator/dashboard` — Creator analytics overview
- `/creator/content` — Video management with gating controls
- `/creator/memberships` — Tier management synced with Whop plans
- `/creator/payouts` — Earnings dashboard and Whop payout portal

### Core Features
- **Authentication** — Whop OAuth (PKCE) for login and session management
- **Channel creation** — Users can become creators with their own channels
- **Membership tiers** — Creators can set up multiple pricing tiers (synced with Whop)
- **Video uploads** — Creators upload videos to Supabase Storage
- **Content gating** — Videos locked behind membership tiers, verified via Whop SDK
- **Checkout and payments** — Whop handles subscription charges
- **Super Chats** — One-time tip payments via Whop checkout
- **Webhooks** — Payment events sync subscriptions to the database
- **Payouts** — Creators withdraw funds via the hosted Whop payout portal
- **Embedded chat** — Whop-powered real-time chat on video pages

---

## Step 1: Setting up the project

### Make sure you have all the prerequisites

Before starting, make sure you have:
- **Node.js** (v18 or later)
- **npm** or **yarn**
- A **Supabase** account ([supabase.com](https://supabase.com))
- A **Whop** account ([whop.com](https://whop.com))

### Create your database

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Give it a name (e.g., `youtube-clone`) and set a strong database password.
3. Wait for the project to finish provisioning.
4. Once ready, go to **Settings > API** and copy your **Project URL** and **anon key**.

### Setting up the Next.js project

Create a new Next.js project with TypeScript and Tailwind CSS:

```bash
npx create-next-app@latest youtube-clone --typescript --tailwind --eslint
cd youtube-clone
```

### Install dependencies

```bash
npm install @whop/sdk @supabase/ssr @supabase/supabase-js iron-session lucide-react zod
```

Here's what each package does:
- `@whop/sdk` — Server-side Whop API client for memberships, checkouts, and payouts
- `@supabase/ssr` — Supabase client optimized for server-side rendering
- `@supabase/supabase-js` — Core Supabase client
- `iron-session` — Encrypted cookie-based session management
- `lucide-react` — Icon library for the UI
- `zod` — Schema validation for API inputs

---

## Step 2: Setting up the database

Create a migration file at `supabase/migrations/20240101000000_init.sql`:

```sql
-- Users Table (synced with Whop OAuth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whop_id TEXT UNIQUE NOT NULL,
  email TEXT,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Channels Table (creators)
CREATE TABLE public.channels (
  id UUID REFERENCES public.users(id) PRIMARY KEY,
  channel_name TEXT UNIQUE NOT NULL,
  description TEXT,
  banner_url TEXT,
  whop_company_id TEXT UNIQUE,
  whop_product_id TEXT UNIQUE,
  whop_experience_id TEXT UNIQUE,
  whop_chat_channel_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos Table
CREATE TABLE public.videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.channels(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  views INTEGER DEFAULT 0,
  is_gated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Membership Tiers (linked to Whop Plans)
CREATE TABLE public.membership_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.channels(id) NOT NULL,
  whop_plan_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  channel_id UUID REFERENCES public.channels(id) NOT NULL,
  tier_id UUID REFERENCES public.membership_tiers(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Channels are viewable by everyone." ON public.channels FOR SELECT USING (true);
CREATE POLICY "Videos are viewable by everyone." ON public.videos FOR SELECT USING (true);
CREATE POLICY "Tiers are viewable by everyone." ON public.membership_tiers FOR SELECT USING (true);
```

Run this migration from your Supabase dashboard under **SQL Editor**.

---

## Step 3: Authentication with Whop OAuth

Our authentication uses Whop's OAuth 2.1 with PKCE (Proof Key for Code Exchange). This is the most secure way to authenticate users without managing passwords.

### Create the session configuration

Create `src/lib/session.ts` for the session management system. This keeps users logged in securely using encrypted cookies:

```typescript
// src/lib/session.ts
import { SessionOptions } from 'iron-session'

export interface SessionData {
  userId?: string
  whopUserId?: string
  whopAccessToken?: string
  isLoggedIn: boolean
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'youtube-clone-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
}
```

### Create OAuth configuration

Create `src/lib/oauth.ts` with helper functions for the PKCE flow — generating codes, building the authorize URL, and exchanging tokens:

```typescript
// src/lib/oauth.ts
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
    scope: 'openid profile email',
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
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
    throw new Error(`Token exchange failed (${response.status}): ${errorBody}`)
  }

  return response.json()
}

export async function fetchUserInfo(accessToken: string) {
  const response = await fetch(WHOP_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Userinfo fetch failed (${response.status}): ${errorBody}`)
  }

  return response.json()
}
```

### Create auth helpers

Create `src/lib/auth.ts` with helpers to get the current session and user:

```typescript
// src/lib/auth.ts
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData, defaultSession } from '@/lib/session'
import { createClient } from '@/lib/supabase-server'

export async function getSession() {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  if (!session.isLoggedIn) return defaultSession
  return session
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session.isLoggedIn || !session.userId) return null
  
  const supabase = await createClient()
  const { data: user } = await supabase
    .from('users')
    .select()
    .eq('id', session.userId)
    .single()
    
  return user
}
```

### Create login route

The login route generates the PKCE codes, stores them in cookies, and redirects the user to Whop's authorization screen.

```typescript
// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generatePKCE, generateState, buildAuthorizeUrl } from '@/lib/oauth'

export async function GET() {
  const { codeVerifier, codeChallenge } = generatePKCE()
  const state = generateState()
  
  const clientId = process.env.WHOP_APP_ID!
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`

  const cookieStore = await cookies()
  cookieStore.set('oauth_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  })
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  })

  const authorizeUrl = buildAuthorizeUrl({ clientId, redirectUri, codeChallenge, state })
  return NextResponse.redirect(authorizeUrl)
}
```

### Configure the callback route

The callback route handles the response from Whop after the user authorizes. It exchanges the code for tokens, fetches user info, syncs to Supabase, and creates a session:

```typescript
// src/app/api/auth/callback/route.ts
export async function GET(request: NextRequest) {
  const code = searchParams.get('code')
  
  // 1. Exchange OAuth code for tokens (with PKCE verifier)
  const tokens = await exchangeCodeForTokens({
    code,
    codeVerifier,
    clientId: process.env.WHOP_APP_ID!,
    clientSecret: process.env.WHOP_API_KEY!,
    redirectUri: `${baseUrl}/api/auth/callback`,
  })

  // 2. Fetch user info from Whop
  const userInfo = await fetchUserInfo(tokens.access_token)

  // 3. Sync user to Supabase (upsert by whop_id)
  const supabase = await createClient()
  // ... insert or update user record ...

  // 4. Save session with iron-session
  const session = await getIronSession(cookieStore, sessionOptions)
  session.userId = userId
  session.whopUserId = userInfo.sub
  session.whopAccessToken = tokens.access_token
  session.isLoggedIn = true
  await session.save()

  return NextResponse.redirect('/')
}
```

### Logout route

```typescript
// src/app/api/auth/logout/route.ts
export async function GET() {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  session.destroy()
  return NextResponse.redirect(new URL('/', baseUrl))
}
```

### Create the sign-in page

```tsx
// src/app/signin/page.tsx
export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F]">
      <div className="text-center space-y-8 max-w-md">
        <h1 className="text-4xl font-bold text-white">Welcome to WhopTube</h1>
        <p className="text-gray-400">Sign in with your Whop account to start watching, creating, and earning.</p>
        <a href="/api/auth/login" className="inline-flex items-center gap-3 bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors">
          Sign in with Whop
        </a>
      </div>
    </div>
  )
}
```

### Update your environment variables

```bash
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Session
SESSION_SECRET="your-generated-secret-at-least-32-chars"

# Whop
WHOP_SANDBOX="true"
WHOP_APP_ID="app_xxxxxxxxxxxxx"
WHOP_API_KEY="apik_xxxxxxxxxxxxx"
WHOP_COMPANY_ID="biz_xxxxxxxxxxxxx"
```

Generate your `SESSION_SECRET` with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 4: Whop SDK setup

The Whop SDK handles your user sign ups, payments, platform fees, payouts, and vendor accounts. In this step, you'll create a Whop app, configure your OAuth, and connect your Whop to the project.

### Create a Whop sandbox account and get your company ID

In the next steps, you'll want to test your checkouts and other systems using Whop infrastructure. To easily do the tests without real payment processing, you'll use Whop's sandbox playground:

1. Go to [Sandbox.Whop.com](https://sandbox.whop.com) and create an account.
2. Create a new business using the **New business** button (+ icon) on the left sidebar.
3. Once you're in the business dashboard, copy your **company ID** (starting with `biz_`) from your URL.

### Getting your company API key

Go to the **Developer** page of your Whop dashboard (in Sandbox.Whop.com) and click the **Create** button next to the **Company API Keys** section. Copy the API key once it's created.

### Getting your Whop app ID

1. Go to your Whop dashboard, open the **Developer** page, and find the **Apps** section.
2. Click **Create app** and give it a name (e.g., `youtube-clone`).
3. Copy the **app ID** (starting with `app_`).
4. Inside the app settings, go to the **OAuth** tab and click **Create redirect URL**.
5. Enter `http://localhost:3000/api/auth/callback` and click Create.

### Initialize the Whop SDK

Create `src/lib/whop.ts`:

```typescript
// src/lib/whop.ts
import { Whop } from "@whop/sdk"

const isSandbox = process.env.WHOP_SANDBOX === 'true'

export const whop = new Whop({
  appID: process.env.WHOP_APP_ID!,
  apiKey: process.env.WHOP_API_KEY!,
  ...(isSandbox && { baseURL: "https://sandbox-api.whop.com/api/v1" }),
})
```

### Test the authentication

1. Start your dev server: `npm run dev`
2. Go to `http://localhost:3000/signin`
3. Click **Sign in with Whop**
4. You'll be redirected to Whop's sandbox login screen. Use your sandbox account to log in.
5. After authorizing, you'll be redirected back to the home page with your avatar showing in the navbar.
6. Open your **Supabase dashboard** and check the `users` table to confirm your account was synced.

---

## Step 5: Building the YouTube UI

Consistency is key for a clone. We use Tailwind CSS to recreate the iconic YouTube dark mode layout.

### Session-aware Navbar

The Navbar reads the user session and conditionally renders either a **Sign In** button or the user's **avatar with a dropdown menu** containing links to Creator Studio and Sign Out:

```tsx
// src/components/Navbar.tsx
export function Navbar({ user }: NavbarProps) {
  return (
    <nav className="fixed top-0 w-full h-16 bg-[#0F0F0F] ...">
      {/* Logo + Search bar */}
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <Link href="/creator/dashboard"><Video className="w-6 h-6" /></Link>
            <Bell className="w-6 h-6" />
            {/* Avatar with hover dropdown: Creator Studio, Sign Out */}
            <img src={user.avatar_url} className="w-8 h-8 rounded-full" />
          </>
        ) : (
          <Link href="/api/auth/login">Sign In</Link>
        )}
      </div>
    </nav>
  )
}
```

### Session-aware Sidebar

When logged in, the sidebar shows a **Creator Studio** section with links to Dashboard, Content, and Payouts:

```tsx
// src/components/Sidebar.tsx
export function Sidebar({ user }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-16 w-60 ...">
      <SidebarItem href="/" icon={<Home />} label="Home" />
      <SidebarItem href="#" icon={<Compass />} label="Explore" />
      
      {user && (
        <>
          <h3>Creator Studio</h3>
          <SidebarItem href="/creator/dashboard" icon={<LayoutDashboard />} label="Dashboard" />
          <SidebarItem href="/creator/content" icon={<Film />} label="Content" />
          <SidebarItem href="/creator/payouts" icon={<DollarSign />} label="Payouts" />
        </>
      )}
    </aside>
  )
}
```

### Root Layout with session

The root layout is an async Server Component that fetches the current user and passes it to Navbar and Sidebar:

```tsx
// src/app/layout.tsx
export default async function RootLayout({ children }) {
  const user = await getCurrentUser()
  return (
    <html lang="en">
      <body>
        <Navbar user={user} />
        <Sidebar user={user} />
        <main>{children}</main>
      </body>
    </html>
  )
}
```

---

## Step 6: Channel memberships (Pay-ins)

Creators need to get paid. Using the Whop SDK, we can create a checkout session for channel memberships in a few lines of code.

### Create the checkout API route

```typescript
// src/app/api/checkout/route.ts
import { whop } from "@/lib/whop"

export async function POST(request: NextRequest) {
  const { channelId, tierId, channelUsername } = parsed.data

  // Fetch channel and tier from Supabase
  const { data: channel } = await supabase
    .from("channels")
    .select("*, membership_tiers(*)")
    .eq("id", channelId)
    .single()

  const tier = channel.membership_tiers.find(t => t.id === tierId)

  // Create checkout via Whop SDK
  const checkoutConfig = await whop.checkoutConfigurations.create({
    plan_id: tier.whop_plan_id,
    redirect_url: `${baseUrl}/channel/${channelUsername}?subscribed=true`,
    metadata: {
      platform_user_id: user.id,
      platform_channel_id: channel.id,
    },
  })

  return NextResponse.json({ checkoutUrl: checkoutConfig.purchase_url })
}
```

### Create the channel profile page

The public channel profile shows the creator's videos and membership tiers with **Join** buttons that redirect to the Whop checkout:

```tsx
// src/app/channel/[username]/page.tsx
export default async function ChannelPage({ params }) {
  const { data: channel } = await supabase
    .from("channels")
    .select("*, membership_tiers(*), videos(*)")
    .eq("channel_name", params.username)
    .single()

  return (
    <div>
      <h1>{channel.channel_name}</h1>
      
      {/* Membership Tiers */}
      {channel.membership_tiers.map(tier => (
        <div key={tier.id}>
          <h3>{tier.name} — ${tier.price}/mo</h3>
          <JoinButton channelId={channel.id} tierId={tier.id} />
        </div>
      ))}
      
      {/* Video Grid */}
      {channel.videos.map(video => (
        <VideoCard key={video.id} {...video} />
      ))}
    </div>
  )
}
```

### Testing the checkout using Whop sandbox

1. Navigate to a channel profile page.
2. Click the **Join** button on any membership tier.
3. You'll be redirected to the Whop checkout page inside the sandbox environment.
4. Use test payment methods to complete the checkout.
5. After successful payment, you'll be redirected back to the channel page with a success message.

---

## Step 7: Super Chats (One-time tips)

YouTube wouldn't be complete without Super Chats. We leverage the Whop SDK's checkout configurations to create one-time tip links:

```typescript
// src/app/api/tips/route.ts
const checkoutConfig = await whop.checkoutConfigurations.create({
  plan_id: channel.whop_tip_plan_id,
  metadata: {
    type: "super_chat",
    sender_id: user.id,
    channel_id: channelId,
    message: message || "",
  },
  redirect_url: `${baseUrl}/watch/${channelId}?tip_success=true`,
})

return NextResponse.json({ checkoutUrl: checkoutConfig.purchase_url })
```

---

## Step 8: Handling webhooks

Webhooks are crucial for keeping your database in sync with Whop. When a payment is processed or a subscription is cancelled, Whop sends a webhook event to your server.

### Create the webhook endpoint

```typescript
// src/app/api/webhooks/whop/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const webhookSecret = process.env.WHOP_WEBHOOK_SECRET

  // Verify webhook signature (implementation depends on Whop's format)
  
  switch (body.event) {
    case 'membership.created':
      // Create subscription in database
      await supabase.from('subscriptions').insert({
        user_id: body.data.user_id,
        channel_id: body.data.channel_id,
        status: 'active',
      })
      break

    case 'membership.cancelled':
      // Update subscription status
      await supabase.from('subscriptions')
        .update({ status: 'cancelled' })
        .match({ user_id: body.data.user_id, channel_id: body.data.channel_id })
      break
  }

  return NextResponse.json({ received: true })
}
```

### Configure the webhook in Whop

1. Go to your app settings in the Whop Developer Dashboard.
2. Navigate to the **Webhooks** tab and click **Create webhook**.
3. Enter your webhook URL: `https://your-domain.com/api/webhooks/whop`
4. Select the events you want to listen to (e.g., `membership.created`, `membership.cancelled`).
5. Copy the **Webhook Secret** and add it to your `.env` file.

---

## Step 9: Gating creator content

With pay-ins configured via Whop plans, we need to enforce access control. The Whop SDK makes this trivial.

### Create a helper function to check access

```typescript
// src/lib/access.ts
import { whop } from '@/lib/whop'
import { getSession } from '@/lib/auth'

export async function checkMembershipAccess(companyId: string): Promise<boolean> {
  const session = await getSession()
  if (!session.isLoggedIn || !session.whopUserId) return false

  try {
    const memberships = await whop.memberships.list({
      user_ids: [session.whopUserId],
      company_id: companyId,
      statuses: ["active"],
    })
    return memberships.data.length > 0
  } catch {
    return false
  }
}
```

### Update the watch page

On the watch page, we verify the user's membership status before delivering premium content:

```tsx
// src/app/watch/[id]/page.tsx
export default async function WatchPage({ params }) {
  const { data: video } = await supabase
    .from("videos")
    .select("*, channels(*)")
    .eq("id", params.id)
    .single()

  // Check if video is gated
  if (video.is_gated) {
    const hasAccess = await checkMembershipAccess(video.channels.whop_company_id)
    
    if (!hasAccess) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Members Only</h2>
            <p className="text-gray-400">This video is exclusive to channel members.</p>
            <a href={`/channel/${video.channels.channel_name}`} className="bg-blue-600 px-6 py-2 rounded-full">
              Join Channel
            </a>
          </div>
        </div>
      )
    }
  }

  // Render video player for authorized users
  return <VideoPlayer video={video} />
}
```

### Test content gating

1. Upload a video and set `is_gated` to `true` in your Supabase dashboard.
2. Log out and try to access the video — you should see the paywall.
3. Join the channel through the checkout flow.
4. Refresh the video page — you should now have full access.

---

## Step 10: Creator payouts

One of Whop's most powerful features is the embedded payout portal. Instead of building your own KYC and withdrawal system, you embed Whop's secure portal directly into your app.

### Create the payout portal API route

```typescript
// src/app/api/creator/payouts/route.ts
import { whop } from "@/lib/whop"
import { requireCreator } from "@/lib/auth"

export async function POST() {
  const { creator } = await requireCreator()

  const accountLink = await whop.accountLinks.create({
    company_id: creator.whop_company_id,
    use_case: "payouts_portal",
    return_url: `${baseUrl}/creator/payouts?returned=true`,
    refresh_url: `${baseUrl}/creator/payouts`,
  })

  return NextResponse.json({ url: accountLink.url })
}
```

### Create the payout page

The payout page shows estimated earnings and a button to access the Whop Payouts Portal:

```tsx
// src/app/creator/payouts/page.tsx
export default async function PayoutsPage() {
  return (
    <div className="flex h-screen bg-[#0F0F0F] text-white">
      <CreatorSidebar />
      <main className="flex-1 ml-64 p-8">
        <h1 className="text-3xl font-bold">Earnings & Payouts</h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-6">
          <StatCard label="Total Earned" value="$12,450.00" />
          <StatCard label="Available" value="$4,200.00" />
          <StatCard label="Pending" value="$850.20" />
        </div>

        {/* Whop Payout Portal Button */}
        <PayoutButton />
      </main>
    </div>
  )
}
```

### Create the payout button

```tsx
// src/app/creator/payouts/PayoutButton.tsx
"use client"

export default function PayoutButton() {
  const handleOpenPayouts = async () => {
    const res = await fetch("/api/creator/payouts", { method: "POST" })
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <button onClick={handleOpenPayouts} className="bg-[#FF7043] text-white px-6 py-3 rounded-lg">
      Open Whop Payouts Portal
    </button>
  )
}
```

### Testing the payouts

1. Navigate to the Creator Studio → Payouts page.
2. Click **Open Whop Payouts Portal**.
3. You'll be redirected to the Whop hosted payout portal.
4. Complete the KYC (identity verification) process.
5. Add a bank account or other payout method.
6. After returning, verify the payout settings have been updated.

---

## Step 11: Video uploads

Creators need a way to upload their content. We use Supabase Storage for hosting video files and thumbnails.

### Create the upload API route

```typescript
// src/app/api/videos/upload/route.ts
export async function POST(request: NextRequest) {
  const { creator } = await requireCreator()
  const formData = await request.formData()

  const videoFile = formData.get("video") as File
  const title = formData.get("title") as string
  const isGated = formData.get("isGated") === "true"

  // 1. Upload video to Supabase Storage
  const videoPath = `${creator.id}/${Date.now()}-video.${videoFile.name.split(".").pop()}`
  await supabase.storage.from("videos").upload(videoPath, videoFile)

  const { data: { publicUrl } } = supabase.storage.from("videos").getPublicUrl(videoPath)

  // 2. Create video record in database
  const { data: video } = await supabase.from("videos").insert({
    channel_id: creator.id,
    title,
    video_url: publicUrl,
    is_gated: isGated,
  }).select().single()

  return NextResponse.json({ video })
}
```

---

## Step 12: Deploying the project

### Get your production Whop keys

1. Go to [whop.com](https://whop.com) (not sandbox) and create your production app.
2. Copy your production **App ID** and **API Key**.
3. Add your production redirect URL: `https://your-domain.com/api/auth/callback`

### Generate a new production session secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Deploy to Vercel

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) and import your repository.
3. Add all environment variables in the Vercel dashboard:

```bash
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SESSION_SECRET=your-production-secret
WHOP_SANDBOX=false
WHOP_APP_ID=your-production-app-id
WHOP_API_KEY=your-production-api-key
```

4. Deploy!

### Important: Update your Whop OAuth redirect URL

After deploying, go back to your Whop app settings and add the production redirect URL:

```
https://your-app.vercel.app/api/auth/callback
```

> **Note:** The `redirect_uri` must be an **exact match** — including protocol, domain, path, and no trailing slash.

## Step 13: Comments & Likes

Every video platform needs social engagement. We'll build a full comment system with nested replies and like/dislike buttons — all stored in Supabase.

### Update the database schema

Create a new migration with tables for comments, video likes, and comment likes:

```sql
-- supabase/migrations/20240102000000_comments_likes.sql

-- Comments Table (with nested replies via parent_id)
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Video Likes / Dislikes
CREATE TABLE public.video_likes (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (user_id, video_id)
);

-- Comment Likes
CREATE TABLE public.comment_likes (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (user_id, comment_id)
);

-- Enable RLS + policies
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone." ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comments." ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Video likes are viewable by everyone." ON public.video_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage video likes." ON public.video_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Comment likes are viewable by everyone." ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage comment likes." ON public.comment_likes FOR INSERT WITH CHECK (true);
```

### Create the comments API route

The comments API handles fetching threaded comments with like counts and posting new comments or replies:

```typescript
// src/app/api/comments/route.ts
export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('videoId')

  // Fetch top-level comments with user info
  const { data: comments } = await supabase
    .from('comments')
    .select('*, users(id, username, avatar_url)')
    .eq('video_id', videoId)
    .is('parent_id', null)
    .order('created_at', { ascending: false })

  // Fetch replies for each comment
  const commentIds = comments.map(c => c.id)
  const { data: replies } = await supabase
    .from('comments')
    .select('*, users(id, username, avatar_url)')
    .in('parent_id', commentIds)
    .order('created_at', { ascending: true })

  // Fetch like counts and assemble response
  // ... (aggregate like counts per comment)

  return NextResponse.json({ comments: commentsWithReplies })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  const { videoId, content, parentId } = await request.json()

  const { data: comment } = await supabase
    .from('comments')
    .insert({
      video_id: videoId,
      user_id: session.userId,
      parent_id: parentId || null,
      content: content.trim(),
    })
    .select('*, users(id, username, avatar_url)')
    .single()

  return NextResponse.json({ comment })
}
```

### Create the video like/dislike API

This route handles toggling between like, dislike, and no vote — with a smart toggle pattern:

```typescript
// src/app/api/videos/[id]/like/route.ts
export async function POST(request: NextRequest, { params }) {
  const { type } = await request.json() // 'like' or 'dislike'

  const { data: existing } = await supabase
    .from('video_likes')
    .select()
    .eq('user_id', session.userId)
    .eq('video_id', params.id)
    .single()

  if (existing) {
    if (existing.type === type) {
      // Toggle off — remove vote
      await supabase.from('video_likes').delete().eq(...)
      return NextResponse.json({ action: 'removed', type: null })
    } else {
      // Switch vote
      await supabase.from('video_likes').update({ type }).eq(...)
      return NextResponse.json({ action: 'switched', type })
    }
  } else {
    // New vote
    await supabase.from('video_likes').insert({ user_id, video_id, type })
    return NextResponse.json({ action: 'added', type })
  }
}
```

### Build the CommentSection component

The `CommentSection` is a client component that handles the full comment UX: posting, replying, liking, and expanding reply threads:

```tsx
// src/components/CommentSection.tsx
"use client"

export function CommentSection({ videoId }: { videoId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  // Fetch comments on mount
  useEffect(() => { fetchComments() }, [videoId])

  // Post a new comment or reply
  async function handleSubmitComment(e: React.FormEvent) {
    const res = await fetch("/api/comments", {
      method: "POST",
      body: JSON.stringify({ videoId, content: newComment }),
    })
    // ... update local state
  }

  return (
    <div>
      <h2>{comments.length} Comments</h2>
      {/* Comment input */}
      {/* Comment list with nested replies */}
      {/* Each comment has like button + reply button */}
      {/* Replies are collapsible */}
    </div>
  )
}
```

### Build the VideoLikeButtons component

This client component gives optimistic UI updates for the like/dislike buttons:

```tsx
// src/components/VideoLikeButtons.tsx
"use client"

export function VideoLikeButtons({ videoId, initialLikeCount, initialDislikeCount, initialUserVote }) {
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [userVote, setUserVote] = useState(initialUserVote)

  async function handleVote(type: 'like' | 'dislike') {
    const res = await fetch(`/api/videos/${videoId}/like`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    })
    const data = await res.json()
    // Update counts optimistically based on action
  }

  return (
    <div className="flex items-center bg-[#272727] rounded-full">
      <button onClick={() => handleVote('like')}>
        <ThumbsUp fill={userVote === 'like' ? 'currentColor' : 'none'} />
        {likeCount}
      </button>
      <button onClick={() => handleVote('dislike')}>
        <ThumbsDown fill={userVote === 'dislike' ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}
```

### Update the watch page

Add both components to the watch page, passing server-fetched initial data:

```tsx
// src/app/watch/[id]/page.tsx
// ... after the video description section:

{/* Like/Dislike Buttons */}
<VideoLikeButtons
  videoId={id}
  initialLikeCount={likeCount}
  initialDislikeCount={dislikeCount}
  initialUserVote={userVote}
/>

{/* Comments Section */}
<CommentSection videoId={id} />
```

### Test comments and likes

1. Navigate to any video's watch page.
2. Post a comment and verify it appears immediately.
3. Click **Reply** on your comment, type a reply, and verify it threads correctly.
4. Expand/collapse the reply thread.
5. Like and dislike the video — verify the count updates and the button state changes.
6. Like a comment and verify the like count increments.

---

## Step 14: Creator Analytics with Whop SDK

The creator dashboard started with hardcoded mock stats. Now we'll replace them with **real data** pulled from the Whop SDK and Supabase.

### How it works

The analytics stack combines two data sources:
- **Whop SDK** → `whop.memberships.list()` gives us active subscriber count per channel
- **Supabase** → Views, videos, comments, and likes are aggregated from our database

Revenue is estimated by multiplying active membership count by average tier price.

### Create the analytics API route

```typescript
// src/app/api/creator/analytics/route.ts
export async function GET() {
  const session = await getSession()
  const supabase = await createClient()

  const { data: channel } = await supabase
    .from('channels')
    .select('*')
    .eq('id', session.userId)
    .single()

  // --- Supabase stats ---
  const totalViews = (await supabase.from('videos').select('views').eq('channel_id', channel.id))
    .data.reduce((sum, v) => sum + v.views, 0)

  const { count: videoCount } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .eq('channel_id', channel.id)

  // --- Whop SDK: live membership data ---
  let whopMembershipCount = 0
  let estimatedRevenue = 0

  if (channel.whop_company_id) {
    const memberships = await whop.memberships.list({
      company_id: channel.whop_company_id,
      statuses: ['active'],
    })
    whopMembershipCount = memberships.data.length

    // Revenue = memberships × average tier price
    const { data: tiers } = await supabase
      .from('membership_tiers')
      .select('price')
      .eq('channel_id', channel.id)

    if (tiers.length > 0) {
      const avgPrice = tiers.reduce((s, t) => s + parseFloat(t.price), 0) / tiers.length
      estimatedRevenue = whopMembershipCount * avgPrice
    }
  }

  return NextResponse.json({
    stats: { totalViews, subscribers: whopMembershipCount, estimatedRevenue, totalVideos: videoCount },
    recentVideos,
  })
}
```

### Rewrite the Creator Dashboard

The Creator Dashboard now fetches real data server-side and displays a **Whop connection status** badge:

```tsx
// src/app/creator/dashboard/page.tsx
export default async function CreatorDashboard() {
  // ... fetch channel, stats from Supabase, memberships from Whop SDK

  const stats = [
    { label: "Total Views", value: formatNumber(totalViews), icon: PlayCircle },
    { label: "Subscribers", value: formatNumber(subscribers), icon: Users },
    { label: "Est. Revenue", value: `$${estimatedRevenue.toFixed(2)}`, icon: DollarSign },
    { label: "Videos", value: formatNumber(videoCount), icon: Film },
    { label: "Comments", value: formatNumber(totalComments), icon: MessageSquare },
    { label: "Likes", value: formatNumber(totalLikes), icon: ThumbsUp },
  ]

  return (
    <div>
      {/* Whop Connection Status */}
      {channel.whop_company_id ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl">
          🟢 Whop Connected — Revenue and membership data synced live via Whop SDK
        </div>
      ) : (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          🟡 Whop not connected — Connect your Whop company to enable revenue tracking
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(stat => <StatCard key={stat.label} {...stat} />)}
      </div>

      {/* Recent Videos */}
      {/* Quick Links */}
    </div>
  )
}
```

### Test the analytics

1. Navigate to the Creator Studio → Dashboard.
2. Verify the stats show real data (views from Supabase, subscribers from Whop).
3. If your Whop company is connected, you should see the green "Whop Connected" badge.
4. Check that estimated revenue updates as memberships change.

---

## Step 15: Live Streaming

The final feature brings real-time streaming to our platform. We create a **Live hub** for discovering active streams and a **stream viewer** page with embedded chat powered by Whop.

### Create the LiveBadge component

A reusable badge with a pulsing red dot animation:

```tsx
// src/components/LiveBadge.tsx
export function LiveBadge({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <span className="bg-red-600 text-white font-bold rounded px-2 py-0.5 inline-flex items-center gap-1 uppercase">
      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
      Live
    </span>
  )
}
```

### Create the Live hub page

The hub page displays currently live streams and upcoming scheduled streams:

```tsx
// src/app/live/page.tsx
export default function LivePage() {
  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        <Radio className="w-6 h-6 text-red-500" />
        <h1 className="text-3xl font-bold">Live</h1>
      </div>

      {/* Live Now Section */}
      <section>
        <h2 className="text-xl font-bold">Live Now</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LIVE_STREAMS.map(stream => (
            <Link href={`/live/${stream.id}`}>
              <div className="relative aspect-video">
                <img src={stream.thumbnail} />
                <LiveBadge />
                <span>{stream.viewers} watching</span>
              </div>
              <h3>{stream.title}</h3>
              <p>{stream.creator}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Upcoming Streams */}
      <section>
        <h2 className="text-xl font-bold">Upcoming</h2>
        {/* Stream cards with "Set Reminder" buttons */}
      </section>
    </div>
  )
}
```

### Create the stream viewer page

The stream viewer page mirrors the watch page layout but with a live player and real-time chat:

```tsx
// src/app/live/[id]/page.tsx
export default function LiveStreamPage({ params }) {
  const stream = STREAMS[params.id]

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Stream Player */}
      <div className="flex-1">
        <div className="aspect-video bg-black rounded-xl relative">
          <iframe src={stream.streamUrl} className="w-full h-full" />
          <LiveBadge size="lg" />
          <span>{stream.viewers} watching</span>
        </div>

        {/* Stream Info */}
        <h1>{stream.title}</h1>
        <div className="flex items-center gap-2">
          <button>Like</button>
          <button>Share</button>
          <button className="bg-gradient-to-r from-yellow-500 to-orange-500">
            <DollarSign /> Super Chat
          </button>
        </div>
      </div>

      {/* Live Chat Sidebar */}
      <div className="w-full lg:w-[400px]">
        <div className="bg-[#1A1A1A] rounded-xl h-full">
          <h3>Live Chat</h3>
          {stream.chatChannelId ? (
            <EmbeddedChat channelId={stream.chatChannelId} />
          ) : (
            <MockChatMessages />
          )}
        </div>
      </div>
    </div>
  )
}
```

The Super Chat button uses the same Whop checkout flow from Step 7, creating a one-time payment that sends a highlighted message in the chat.

### Test live streaming

1. Navigate to `/live` — you should see the Live hub with stream cards.
2. Click into a stream to open the viewer page.
3. Verify the video player, live chat, and Super Chat button all render correctly.
4. When a Whop chat channel ID is configured, the live chat uses Whop's real-time messaging.

---

## Step 16: Deploying the final version

After adding comments, analytics, and live streaming:

1. **Run the new database migration** in your Supabase SQL Editor (the `comments`, `video_likes`, and `comment_likes` tables).
2. **Commit and push** all changes to GitHub.
3. Vercel will automatically redeploy.
4. Test all features on production:
   - Post a comment and reply
   - Like/dislike a video
   - View real analytics on the Creator Dashboard
   - Browse the Live hub and open a stream

---

## What's next?

You've now built a fully featured YouTube clone with:

- ✅ **Whop OAuth** for user authentication
- ✅ **Channel memberships** with Whop-powered checkouts
- ✅ **Content gating** via Whop membership verification
- ✅ **Super Chats** for one-time tips
- ✅ **Creator payouts** through the Whop portal
- ✅ **Video uploads** to Supabase Storage
- ✅ **Session-aware UI** with avatar, profile dropdown, and Creator Studio
- ✅ **Comments & Likes** with nested replies
- ✅ **Creator Analytics** with real Whop SDK data
- ✅ **Live Streaming** with embedded chat

Here are some ideas to extend this even further:

- **Video processing** — Add transcoding and adaptive bitrate streaming with services like Mux or Cloudflare Stream
- **Recommendations** — Implement a "Suggested Videos" algorithm based on watch history
- **Notifications** — Push notifications for new videos, replies, and live streams
- **Mobile app** — Wrap the web app in a React Native shell
- **Search** — Full-text search across videos, channels, and comments using Supabase's pg_trgm extension

---

## Ready to build your own YouTube clone?

Whop gives you everything you need to build a monetized creator platform — authentication, payments, payouts, and community tools — all through a single SDK.

[Start building on Whop today →](https://whop.com/developers)

