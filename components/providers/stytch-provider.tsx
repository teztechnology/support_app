"use client";

import { StytchB2BProvider } from "@stytch/nextjs/b2b";
import { createStytchB2BHeadlessClient } from "@stytch/nextjs/b2b/headless";
import { StytchClientOptions } from "@stytch/vanilla-js";

const STYTCH_B2B_SESSION_COOKIE = "stytch_session";
const STYTCH_B2B_TOKEN_COOKIE = "stytch_session_jwt";

const options: StytchClientOptions = {
  cookieOptions: {
    opaqueTokenCookieName: STYTCH_B2B_SESSION_COOKIE,
    jwtCookieName: STYTCH_B2B_TOKEN_COOKIE,
    domain: process.env.NEXT_PUBLIC_STYTCH_COOKIE_DOMAIN,
    availableToSubdomains: true,
  },
};

const stytchB2BClient = createStytchB2BHeadlessClient(
  process.env.NEXT_PUBLIC_STYTCH_BUSINESS_PUBLIC_TOKEN!,
  options
);

export function StytchClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StytchB2BProvider stytch={stytchB2BClient}>{children}</StytchB2BProvider>
  );
}
