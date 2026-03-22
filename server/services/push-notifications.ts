import { createSign } from "crypto";

type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

type SendPushResult = {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
};

let cachedAccessToken: string | null = null;
let cachedAccessTokenExpiresAt = 0;

function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function base64UrlEncode(input: string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getGoogleAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessTokenExpiresAt - 60 > now) return cachedAccessToken;

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!clientEmail || !privateKeyRaw) return null;
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const unsignedJwt = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedJwt);
  signer.end();
  const signature = signer
    .sign(privateKey, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const assertion = `${unsignedJwt}.${signature}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!tokenResponse.ok) return null;

  const tokenJson = (await tokenResponse.json()) as { access_token?: string; expires_in?: number };
  if (!tokenJson.access_token) return null;

  cachedAccessToken = tokenJson.access_token;
  cachedAccessTokenExpiresAt = now + Number(tokenJson.expires_in || 3600);
  return cachedAccessToken;
}

async function sendTokenMessage(input: { projectId: string; accessToken: string; token: string; payload: PushPayload }) {
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${input.projectId}/messages:send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: JSON.stringify({
      message: {
        token: input.token,
        notification: {
          title: input.payload.title,
          body: input.payload.body,
        },
        data: input.payload.data || {},
        webpush: {
          notification: {
            title: input.payload.title,
            body: input.payload.body,
          },
        },
      },
    }),
  });

  if (response.ok) {
    return { ok: true, invalidToken: false };
  }

  const responseText = await response.text().catch(() => "");
  const invalidToken = /UNREGISTERED|Invalid registration token|INVALID_ARGUMENT/i.test(responseText);
  return { ok: false, invalidToken };
}

export async function sendPushToDriverTokens(tokens: string[], payload: PushPayload): Promise<SendPushResult> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  const accessToken = await getGoogleAccessToken();
  if (!accessToken) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  const cleanedTokens = Array.from(new Set(tokens.map((t) => String(t || "").trim()).filter(Boolean)));
  if (cleanedTokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  let successCount = 0;
  let failureCount = 0;
  const invalidTokens: string[] = [];

  for (const batch of chunk(cleanedTokens, 100)) {
    const results = await Promise.all(
      batch.map(async (token) => {
        try {
          const result = await sendTokenMessage({ projectId, accessToken, token, payload });
          return { token, ...result };
        } catch {
          return { token, ok: false, invalidToken: false };
        }
      }),
    );
    results.forEach((result) => {
      if (result.ok) {
        successCount += 1;
      } else {
        failureCount += 1;
        if (result.invalidToken) invalidTokens.push(result.token);
      }
    });
  }

  return {
    successCount,
    failureCount,
    invalidTokens: Array.from(new Set(invalidTokens)),
  };
}
