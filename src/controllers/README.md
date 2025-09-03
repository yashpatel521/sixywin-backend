# Controllers Directory

Handles HTTP request/response logic and WebSocket message processing. Each controller:
- Processes incoming requests
- Calls appropriate services
- Returns formatted responses

## Key Files:
- `user.controller.ts`: User authentication and profile management
- `ticket.controller.ts`: Lottery ticket operations
- `ticketDraw.controller.ts`: Draw results processing
- `doubleTrouble.controller.ts`: Double Trouble game logic
- `aviator.controller.ts`: Aviator game operations

## Patterns:
- All methods return consistent response formats
- Error handling through middleware
- WebSocket message handlers included where needed
