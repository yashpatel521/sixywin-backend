# 🖥️ SixyWin Backend Server

A robust Node.js backend server for the SixyWin gaming platform, built with Express, TypeScript, TypeORM, and WebSocket for real-time gaming experiences.

## 🚀 Features

### 🎮 Game Management
- **Play Lottery**: 6-number lottery system with automated draws
- **Double Trouble**: Fast-paced betting game with real-time results
- **Aviator**: Crash game with multiplier mechanics
- **Mega Pot**: Progressive jackpot system

### 🔥 Core Features
- **Real-time WebSocket communication** for live game updates
- **Automated draw scheduling** with cron jobs
- **Virtual coin system** with secure transaction management
- **User authentication** with JWT tokens
- **Referral system** with bonus tracking
- **Bot system** for enhanced gaming experience
- **HMAC security** for API request validation
- **Database abstraction** with TypeORM

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **TypeORM** - Database ORM
- **PostgreSQL/MySQL** - Database (configurable)
- **WebSocket (ws)** - Real-time communication
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **node-cron** - Scheduled tasks
- **cors** - Cross-origin resource sharing

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL or MySQL database
- npm or yarn
- Git

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure database connection
# Edit .env file with your database credentials

# Run database migrations
npm run migration:run

# Start development server
npm run dev
```

### Environment Variables
Create a `.env` file:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=sixywin_db
DB_TYPE=postgres

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# WebSocket Configuration
WS_PORT=3001

# Security
HMAC_SECRET=your_hmac_secret

# Game Configuration
LOTTERY_DRAW_INTERVAL=3600000  # 1 hour in milliseconds
DOUBLE_TROUBLE_INTERVAL=30000  # 30 seconds in milliseconds
AVIATOR_INTERVAL=10000         # 10 seconds in milliseconds

# Bot Configuration
BOT_ENABLED=true
BOT_COUNT=10
```

## 🏗️ Project Structure

```
src/
├── entities/              # TypeORM database entities
│   ├── User.ts           # User model
│   ├── Ticket.ts         # Lottery tickets
│   ├── DrawResult.ts     # Draw results
│   ├── MegaPot.ts        # Mega pot entity
│   ├── DoubleTrouble.ts  # Double trouble game
│   ├── AviatorBid.ts     # Aviator bids
│   ├── AviatorDraw.ts    # Aviator draws
│   └── Reference.ts      # Referral tracking
├── controllers/          # Request handlers
│   ├── user.controller.ts
│   ├── ticket.controller.ts
│   ├── draw.controller.ts
│   ├── doubleTrouble.controller.ts
│   ├── aviatorBid.controller.ts
│   └── megaPot.controller.ts
├── services/            # Business logic
│   ├── user.service.ts
│   ├── ticket.service.ts
│   ├── draw.service.ts
│   ├── doubleTrouble.service.ts
│   ├── aviatorBid.service.ts
│   └── megaPot.service.ts
├── middleware/          # Express middleware
│   └── hmac.middleware.ts
├── utils/              # Utility functions
│   ├── common.ts       # Common utilities
│   ├── crypto.ts       # Cryptographic functions
│   ├── cron.ts         # Scheduled tasks
│   ├── types.ts        # Type definitions
│   └── version.ts      # Version management
├── Responses/          # Response helpers
│   ├── successMessage.ts
│   ├── errorMessage.ts
│   ├── successResponse.ts
│   └── errorResponse.ts
├── bots/              # Bot system
│   ├── bots.ts        # Bot logic
│   ├── botUser.ts     # Bot user management
│   └── bots.routes.ts # Bot API routes
├── websocket/         # WebSocket handling
│   └── index.ts       # WebSocket server
├── app-data-source.ts # Database configuration
└── index.ts          # Application entry point
```

## 🗄️ Database Schema

### Core Entities

#### User
```typescript
{
  id: number;
  email: string;
  password: string;
  coins: number;
  referralCode: string;
  referredBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Ticket (Lottery)
```typescript
{
  id: number;
  userId: number;
  numbers: number[];
  bid: number;
  drawId: number;
  isWinner: boolean;
  prize: number;
  createdAt: Date;
}
```

#### DoubleTrouble
```typescript
{
  id: number;
  userId: number;
  betType: 'range' | 'number';
  betValue: number;
  amount: number;
  result: number;
  isWinner: boolean;
  prize: number;
  createdAt: Date;
}
```

#### AviatorBid
```typescript
{
  id: number;
  userId: number;
  amount: number;
  cashoutMultiplier: number;
  isCashedOut: boolean;
  prize: number;
  drawId: number;
  createdAt: Date;
}
```

## 🔌 WebSocket Communication

The server uses WebSocket for all real-time communication instead of REST APIs. All game interactions, user actions, and data updates happen through WebSocket messages.

### WebSocket Connection
```typescript
// Connect to WebSocket server
const ws = new WebSocket('ws://localhost:3001');

// Authentication
ws.send(JSON.stringify({
  type: 'AUTHENTICATE',
  data: { token: 'jwt_token_here' }
}));
```

### Message Types

#### Authentication
```typescript
// Login
{
  type: 'LOGIN',
  data: { email: 'user@example.com', password: 'password' }
}

// Register
{
  type: 'REGISTER',
  data: { 
    email: 'user@example.com', 
    password: 'password',
    referralCode: 'REF123' 
  }
}

// Get user profile
{
  type: 'GET_PROFILE',
  data: {}
}
```

#### Lottery Game
```typescript
// Submit lottery ticket
{
  type: 'SUBMIT_TICKET',
  data: { 
    numbers: [1, 15, 23, 34, 45, 56],
    bid: 100 
  }
}

// Get user tickets
{
  type: 'GET_TICKETS',
  data: {}
}

// Get draw results
{
  type: 'GET_DRAW_RESULTS',
  data: {}
}

// Get mega pot info
{
  type: 'GET_MEGAPOT',
  data: {}
}
```

#### Double Trouble Game
```typescript
// Join game room
{
  type: 'JOIN_GAME',
  data: { game: 'double_trouble' }
}

// Place bet
{
  type: 'PLACE_BET',
  data: {
    game: 'double_trouble',
    betType: 'range', // or 'number'
    betValue: 5,
    amount: 100
  }
}

// Get game history
{
  type: 'GET_GAME_HISTORY',
  data: { game: 'double_trouble' }
}

// Get current game state
{
  type: 'GET_CURRENT_GAME',
  data: { game: 'double_trouble' }
}
```

#### Aviator Game
```typescript
// Join aviator game
{
  type: 'JOIN_GAME',
  data: { game: 'aviator' }
}

// Place bid
{
  type: 'PLACE_BID',
  data: {
    game: 'aviator',
    amount: 100
  }
}

// Cash out bid
{
  type: 'CASHOUT',
  data: { 
    game: 'aviator',
    bidId: 123 
  }
}

// Get game history
{
  type: 'GET_GAME_HISTORY',
  data: { game: 'aviator' }
}
```

#### User Management
```typescript
// Update user profile
{
  type: 'UPDATE_PROFILE',
  data: { 
    email: 'newemail@example.com',
    // other profile fields
  }
}

// Get referral info
{
  type: 'GET_REFERRALS',
  data: {}
}

// Get leaderboard
{
  type: 'GET_LEADERBOARD',
  data: {}
}
```

## 🔌 WebSocket Events

### Client to Server
```typescript
// Join game room
{
  type: 'JOIN_GAME',
  data: { game: 'double_trouble' }
}

// Place bet
{
  type: 'PLACE_BET',
  data: {
    game: 'double_trouble',
    betType: 'range',
    betValue: 5,
    amount: 100
  }
}

// Cash out (Aviator)
{
  type: 'CASHOUT',
  data: { bidId: 123 }
}
```

### Server to Client
```typescript
// Game update
{
  type: 'GAME_UPDATE',
  data: {
    game: 'double_trouble',
    timeLeft: 15,
    currentBets: [...],
    lastResult: 7
  }
}

// Draw result
{
  type: 'DRAW_RESULT',
  data: {
    game: 'lottery',
    numbers: [1, 15, 23, 34, 45, 56],
    winners: [...]
  }
}
```

## 🤖 Bot System

The server includes an intelligent bot system that:
- **Simulates real players** with realistic betting patterns
- **Enhances game experience** by maintaining active player base
- **Configurable behavior** through environment variables
- **Automatic management** with scheduled tasks

### Bot Configuration
```typescript
// Bot behavior settings
const BOT_CONFIG = {
  enabled: process.env.BOT_ENABLED === 'true',
  count: parseInt(process.env.BOT_COUNT || '10'),
  minBet: 10,
  maxBet: 1000,
  activityInterval: 5000 // 5 seconds
};
```

## ⏰ Scheduled Tasks

### Cron Jobs
```typescript
// Lottery draws (hourly)
'0 * * * *' => runLotteryDraw()

// Double Trouble draws (every 30 seconds)
'*/30 * * * * *' => runDoubleTroubleDraw()

// Aviator draws (every 10 seconds)
'*/10 * * * * *' => runAviatorDraw()

// Bot activity (every 5 seconds)
'*/5 * * * * *' => updateBotActivity()
```

## 🔒 Security

### Authentication
- **JWT tokens** for session management
- **bcrypt** for password hashing
- **HMAC signatures** for API request validation

### Input Validation
```typescript
// Example validation middleware
const validateBet = (req: Request, res: Response, next: NextFunction) => {
  const { amount, betType, betValue } = req.body;
  
  if (!amount || amount < 1 || amount > 10000) {
    return sendErrorResponse(res, 'Invalid bet amount', 400);
  }
  
  next();
};
```

### Rate Limiting
- **Request throttling** to prevent abuse
- **IP-based limiting** for API endpoints
- **User-based limiting** for betting actions

## 🧪 Testing

### Unit Tests
```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "User Service"
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration

# Test database operations
npm run test:db
```

### WebSocket Tests
```bash
# Test WebSocket connections
npm run test:websocket

# Load testing
npm run test:load
```

## 🚀 Development

### Available Scripts
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run migration:run    # Run database migrations
npm run migration:revert # Revert last migration
npm run seed             # Seed database with test data
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript checks
```

### Database Operations
```bash
# Generate new migration
npm run migration:generate -- src/migrations/AddNewTable

# Run migrations
npm run migration:run

# Revert migrations
npm run migration:revert

# Show migration status
npm run migration:show
```

### Logging
The server uses structured logging with different levels:
- **ERROR**: Critical errors and exceptions
- **WARN**: Warning messages
- **INFO**: General information
- **DEBUG**: Detailed debugging information

## 📊 Monitoring

### Health Checks
```http
GET /health          # Basic health check
GET /health/db       # Database health check
GET /health/ws       # WebSocket health check
```

### Metrics
- **Request/response times**
- **Error rates**
- **Active connections**
- **Game statistics**
- **Database performance**

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Configuration
```bash
# Production environment variables
NODE_ENV=production
PORT=3001
DB_HOST=your_db_host
DB_PASSWORD=your_db_password
JWT_SECRET=your_production_jwt_secret
HMAC_SECRET=your_production_hmac_secret
```

## 🔧 Configuration Files

- **package.json**: Dependencies and scripts
- **tsconfig.json**: TypeScript configuration
- **ormconfig.json**: TypeORM configuration
- **.env**: Environment variables
- **.eslintrc.js**: ESLint configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the WebSocket documentation
- Review existing issues and discussions 