# Services Directory

Contains business logic and data access layer. Each service:
- Handles core application logic
- Interacts with database via repositories
- Called by controllers

## Key Files:
- `user.service.ts`: User management and authentication
- `ticket.service.ts`: Lottery ticket operations
- `doubleTrouble.service.ts`: Double Trouble game logic
- `aviator.service.ts`: Aviator game management

## Patterns:
- Single responsibility principle
- Stateless operations
- Transaction management
