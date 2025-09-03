# Entities Directory

Contains TypeORM entity classes that map to database tables. Each entity:
- Represents a database table
- Defines columns and relationships
- Includes any entity-specific business logic

## Key Files:
- `User.ts`: Core user model with authentication fields
- `Ticket.ts`: Lottery ticket entity with number selections
- `DoubleTrouble.ts`: Double Trouble game bets
- `Aviator.ts`: Aviator game bids
- `Reference.ts`: Referral tracking system

## Patterns:
- Decorators define column types and relations
- Lifecycle hooks for pre-save logic
- Type-safe query building
