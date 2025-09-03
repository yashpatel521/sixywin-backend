# Middleware Directory

Contains Express middleware functions that process requests before they reach controllers.

## Key Files:
- `Auth.ts`: JWT authentication middleware
- `hmac.middleware.ts`: Request signature validation
- `errorHandler.ts`: Centralized error processing

## Patterns:
- Chain of responsibility pattern
- Standardized error responses
- Request augmentation (e.g., adding user to request)
