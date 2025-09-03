import {
  verifyMessageSignature,
  isValidTimestamp,
  createSignedResponse,
} from "../utils/crypto";

export interface WebSocketMessage {
  type: string;
  payload: unknown;
  requestId: string;
  timestamp: string;
  signature?: string;
}

/**
 * Middleware to verify HMAC signatures on incoming WebSocket messages
 */
export function verifyHMACMiddleware(message: any): {
  isValid: boolean;
  error?: string;
  parsedMessage?: WebSocketMessage;
} {
  try {
    // Check required fields
    if (!message.type || !message.requestId || !message.timestamp) {
      return {
        isValid: false,
        error: "Missing required fields (type, requestId, timestamp)",
      };
    }

    // For development/testing: allow messages without signatures (backward compatibility)
    if (!message.signature) {
      return {
        isValid: true,
        parsedMessage: message,
      };
    }

    // Verify timestamp to prevent replay attacks

    if (!isValidTimestamp(message.timestamp, 300)) {
      // 5 minutes max age
      return {
        isValid: false,
        error: "Message timestamp too old or invalid",
      };
    }

    // Verify HMAC signature
    const signatureValid = verifyMessageSignature({
      requestId: message.requestId,
      timestamp: message.timestamp,
      payload: message.payload,
      signature: message.signature,
    });

    if (!signatureValid) {
      return {
        isValid: false,
        error: "Invalid message signature",
      };
    }

    return {
      isValid: true,
      parsedMessage: message,
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Message parsing failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}
