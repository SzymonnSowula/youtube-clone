import Whop from "@whop/sdk";

const isSandbox = process.env.WHOP_SANDBOX === "true";

export const whop = new Whop({
  appID: process.env.WHOP_APP_ID,
  apiKey: process.env.WHOP_API_KEY,
  ...(isSandbox && {
    baseURL: "https://sandbox-api.whop.com/api/v1",
  }),
});
