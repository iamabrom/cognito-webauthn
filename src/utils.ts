export function decodeBase64URL(input: string): Uint8Array {
  return Uint8Array.from(atob(input.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
}

export function encodeBase64URL(buffer: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function generateSecretHash(username: string, clientId: string, clientSecret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(clientSecret);
  const message = encoder.encode(username + clientId);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, message);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}
