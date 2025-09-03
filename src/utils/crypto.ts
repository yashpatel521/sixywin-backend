import crypto from "crypto";
import { HMAC_SECRET } from "./constant";

/**
 * Hash password with HMAC secret as salt for secure transmission (matches frontend)
 * This prevents plain text passwords from being visible in network traffic
 * Uses the same secret as HMAC to ensure consistency between client and server
 */
export function hashPassword(password: string, salt?: string): string {
  const passwordSalt = salt || HMAC_SECRET; // Use HMAC secret as default salt
  return crypto
    .createHash("sha256")
    .update(password + passwordSalt)
    .digest("hex");
}

/**
 * Create HMAC-SHA256 signature for a given data string
 */
export function createHMAC(data: string): string {
  return crypto.createHmac("sha256", HMAC_SECRET).update(data).digest("hex");
}

/**
 * Verify HMAC signature against expected data
 */
export function verifyHMAC(data: string, signature: string): boolean {
  const computedSignature = createHMAC(data);
  return computedSignature === signature;
}

/**
 * Create signature for WebSocket message
 * Signs: requestId + timestamp + stringified payload
 */
export function signMessage(message: {
  requestId: string;
  timestamp: string;
  payload: unknown;
}): string {
  const dataToSign =
    message.requestId + message.timestamp + JSON.stringify(message.payload);
  return createHMAC(dataToSign);
}

/**
 * Verify WebSocket message signature
 */
export function verifyMessageSignature(message: {
  requestId: string;
  timestamp: string;
  payload: unknown;
  signature: string;
}): boolean {
  const dataToVerify =
    message.requestId + message.timestamp + JSON.stringify(message.payload);
  return verifyHMAC(dataToVerify, message.signature);
}

/**
 * Create signed WebSocket response message
 */
export function createSignedResponse(
  type: string,
  payload: unknown,
  requestId: string
): {
  type: string;
  payload: unknown;
  requestId: string;
  timestamp: string;
  signature: string;
} {
  const response = {
    type,
    payload,
    requestId,
    timestamp: new Date().toISOString(),
  };

  const signature = signMessage(response);

  return {
    ...response,
    signature,
  };
}

/**
 * Validate message timestamp to prevent replay attacks
 * @param timestamp ISO timestamp string
 * @param maxAgeSeconds Maximum age in seconds (default: 60 seconds)
 */
export function isValidTimestamp(
  timestamp: string,
  maxAgeSeconds: number = 60
): boolean {
  try {
    const messageTime = new Date(timestamp).getTime();
    const currentTime = Date.now();
    const ageSeconds = (currentTime - messageTime) / 1000;
    const bufferSeconds = 5; // allow 5s drift
    return ageSeconds >= -bufferSeconds && ageSeconds <= maxAgeSeconds;
  } catch (error) {
    return false;
  }
}
