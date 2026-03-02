# How to build a YouTube clone with Next.js, Supabase, and Whop

Traditionally, building a video platform like YouTube requires stitching together a complex web of services: Stripe for payments, Clerk or Auth0 for authentication, AWS for storage, and custom-built KYC (Know Your Customer) flows for payouts. 

Whop replaces this entire backend stack with a single SDK.

In this guide, we’ll build a full-featured YouTube clone. We'll use **Next.js** for the frontend, **Supabase** for our database and video metadata, and **Whop** to handle the heavy lifting: monetization, creator payouts, and embedded community chat.

## The Architecture

Our stack is designed for speed and scalability:
- **Framework**: Next.js (App Router)
- **Database**: Supabase (PostgreSQL + RLS)
- **Authentication**: Whop OAuth (PKCE Flow)
- **Business Logic**: Whop SDK (Payments, Payouts, Chat)
- **Styling**: Tailwind CSS (v4)

---

## Step 1: Initialize your Next.js project

Start by creating a new Next.js project with Tailwind CSS and TypeScript.

```bash
npx create-next-app@latest youtube-clone --typescript --tailwind --eslint
cd youtube-clone
```

Install the essential dependencies for Supabase and Whop integration:

```bash
npm install @whop/sdk @whop/embedded-components-react-js @whop/embedded-components-vanilla-js @supabase/ssr @supabase/supabase-js iron-session lucide-react
```

## Step 2: Setup Supabase Database

We need a database to store video metadata and user profiles. Create a Supabase project and run the following migration to set up our schema:

```sql
-- users table to sync with Whop
CREATE TABLE users (
  id UUID PRIMARY KEY,
  whop_id TEXT UNIQUE NOT NULL,
  username TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- channels table
CREATE TABLE channels (
  id UUID PRIMARY KEY REFERENCES users(id),
  name TEXT NOT NULL,
  whop_company_id TEXT, -- For Payouts
  whop_chat_channel_id TEXT -- For Embedded Chat
);

-- videos table
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  views BIGINT DEFAULT 0
);
```

## Step 3: Whop SDK setup

The Whop SDK handles your user sign ups, payments, platform fees, payouts, and vendor accounts. In this step, you’ll create a Whop app, configure your OAuth, and connect your whop to the project.

### Create a Whop sandbox account and get your company ID

In the next steps, you'll want to test your checkouts and other systems using Whop infrastructure. To easily do the tests without real payment processing, you'll use Whop's sandbox playground:

1. Go to [Sandbox.Whop.com](https://sandbox.whop.com) and create an account.
2. Create a new business using the **New business** button (+ icon) on the left sidebar.
3. Once you're in the business dashboard, copy your **company ID** (starting with `biz_`) from your URL.

### Getting your company API key

To get your company API key, go to the **Developer** page of your Whop dashboard (in Sandbox.Whop.com) and click the **Create** button next to the **Company API Keys** section. Copy the API key once it's created.

### Getting your Whop app ID

Next, let’s create a Whop app. Go to your Whop dashboard, open the **Developer** page, and find the **Apps** section. 

1. Click **Create app** and give it a name.
2. Copy the **app ID** (starting with `app_`).
3. Inside the app settings, go to the **OAuth** tab and click **Create redirect URL**.
4. Enter `http://localhost:3000/api/auth/callback` and click Create.

### Update your environment variables

Your `.env` file should now look like this:

```bash
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Whop
SESSION_SECRET="your-generated-secret-at-least-32-chars"
WHOP_SANDBOX="true"
WHOP_APP_ID="app_xxxxxxxxxxxxx"
WHOP_API_KEY="apik_xxxxxxxxxxxxx"
WHOP_COMPANY_ID="biz_xxxxxxxxxxxxx"
```

### Initialize the Whop SDK

The Whop SDK is how your project talks to the Whop API. Create `src/lib/whop.ts`:

```typescript
import { Whop } from "@whop/sdk"

const isSandbox = process.env.WHOP_SANDBOX === 'true'

export const whop = new Whop({
  appID: process.env.WHOP_APP_ID!,
  apiKey: process.env.WHOP_API_KEY!,
  ...(isSandbox && { baseURL: "https://sandbox-api.whop.com/api/v1" }),
})
```

## Step 4: Test the authentication

Now, let's test the authentication flow:

1. Go to `http://localhost:3000/signin`
2. Click **Sign in with Whop**
3. You'll be redirected to Whop's sandbox login screen. Use your sandbox account to log in.
4. After authorizing, you'll be redirected back to the home page.
5. Open your **Supabase dashboard** and check the `users` table to confirm your account was synced.

## Step 5: Implement Whop OAuth (PKCE Flow)

We'll use **Whop** as our primary authentication provider. This allows creators to seamlessly link their Whop accounts to their YouTube channels.

Using `iron-session` and the Whop OAuth PKCE flow, we can securely log users in without managing a separate password database.

```typescript
// src/app/api/auth/callback/route.ts
export async function GET(request: NextRequest) {
  // 1. Exchange OAuth code for tokens
  const tokens = await exchangeCodeForTokens({ code, codeVerifier, ... })

  // 2. Fetch user info from Whop
  const userInfo = await fetchUserInfo(tokens.access_token)

  // 3. Sync user to Supabase
  const { data: user } = await supabase.from('users').upsert({
    whop_id: userInfo.sub,
    email: userInfo.email,
    ...
  })

  // 4. Save session
  const session = await getIronSession(cookieStore, sessionOptions)
  session.userId = user.id
  await session.save()

  return NextResponse.redirect('/')
}
```

## Step 6: Building the YouTube UI

Consistency is key for a clone. We use Tailwind CSS to recreate the iconic dark mode layout.

### The Creator Sidebar
Every YouTube channel needs a studio. We've built a dedicated `CreatorSidebar` that gives creators quick access to their dashboard, content, and — most importantly — their earnings.

```tsx
export function CreatorSidebar() {
  return (
    <aside className="fixed left-0 top-16 w-64 h-full bg-[#0F0F0F] border-r border-[#303030]">
      <nav className="p-4 space-y-2">
        <NavItem href="/creator/dashboard" icon={<LayoutDashboard />} label="Dashboard" />
        <NavItem href="/creator/payouts" icon={<DollarSign />} label="Payouts" />
      </nav>
    </aside>
  )
}
```

## Step 7: Monetization with Whop Pay-ins

Creators need to get paid. Using the Whop SDK, we can create a checkout session for channel memberships in a few lines of code.

```typescript
// src/app/api/checkout/route.ts
const checkoutConfig = await whop.checkoutConfigurations.create({
  plan_id: tier.whop_plan_id,
  redirect_url: `${baseUrl}/channel/${username}?success=true`,
})

return NextResponse.json({ checkoutUrl: checkoutConfig.purchase_url })
```

## Step 8: Embedded Payouts Dashboard

One of Whop’s most powerful features is the embedded payout portal. Instead of building your own KYC and withdrawal system, you can embed Whop’s secure portal directly into your app.

```typescript
// src/app/api/creator/payouts/route.ts
const accountLink = await whop.accountLinks.create({
  company_id: creator.whop_company_id,
  use_case: "payouts_portal",
  return_url: `${baseUrl}/creator/payouts`,
});

return NextResponse.json({ url: accountLink.url });
```

## Step 10: Membership Gating & Access Control

With our pay-ins configured via Whop plans, we need to enforce access control. The Whop SDK makes this trivial. We check for a user's active memberships before delivering premium video content.

### Video Gating Logic
On our watch page, we verify the user's membership status for the specific channel they are viewing.

```typescript
// src/app/watch/[id]/page.tsx
const memberships = await whop.memberships.list({
  user_ids: [session.whopUserId],
  company_id: video.channel.whop_company_id,
  statuses: ["active"],
});

const hasAccess = memberships.data.length > 0;
```

If `hasAccess` is false, we overlay a beautifully designed paywall that encourages them to join one of the Whop membership tiers.

## Step 11: Implementing Super Chats (Whop Pay-ins)

YouTube wouldn't be complete without Super Chats. We leverage the Whop SDK's **Checkout Configurations** with `mode: 'payment'` to create one-time tip links.

```typescript
// src/app/api/tips/route.ts
const checkoutConfig = await whop.checkoutConfigurations.create({
  plan_id: channel.whop_tip_plan_id,
  mode: "payment",
  metadata: {
    type: "super_chat",
    message: "Love the content!",
  },
  redirect_url: `${baseUrl}/watch/${channelId}?tip_success=true`,
});
```

## Step 12: The Creator Payout Dashboard

Finally, we let creators manage their success. By integrating Whop's Payouts Portal, we give them a full-featured, secure dashboard without writing a single line of KYC or bank management code.

Creators can see their balance, track recent membership sales, and withdraw their funds with one click.

```tsx
// src/app/creator/payouts/PayoutButton.tsx
const handleOpenPayouts = async () => {
  const res = await fetch("/api/creator/payouts", { method: "POST" });
  const { url } = await res.json();
  window.location.href = url;
};
```

---

## Conclusion: YouTube Clone as a Product

By combining **Next.js**, **Supabase**, and the **Whop SDK**, we’ve built more than just a clone. We’ve built a fully-featured, monetized video platform in a fraction of the time.

Whop handles the heavy lifting — authentication, checkouts, community chat, and payouts — allowing you to focus on building a premium user experience.

Ready to build your own? [Start developing on Whop today](https://whop.com/developers).

## Conclusion

By leveraging Whop, we’ve built a production-ready YouTube clone that handles authentication, payments, payouts, and real-time chat out of the box. 

We didn't have to spend weeks integrating Stripe Connect or building a custom chat server. We focused on the product, and let Whop handle the infrastructure.

Ready to build your next platform? [Check out the Whop Documentation](https://whop.com/developers/) to get started.
