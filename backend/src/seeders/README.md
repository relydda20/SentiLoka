# Database Seeders

This directory contains database seeders for the SentiLoka project. Seeders help populate the database with test data for development and testing purposes.

## Structure

```
seeders/
├── data/                    # JSON data files
│   ├── users.json          # User seed data
│   ├── locations.json      # Location seed data
│   └── reviews.json        # Review seed data
├── databaseSeeder.js       # Main seeder orchestrator
├── userSeeder.js           # User seeder
├── locationSeeder.js       # Location seeder
├── reviewSeeder.js         # Review seeder
└── README.md              # This file
```

## Available Commands

### 1. Seed Database
Import seed data into the database. Existing data will not be affected.

```bash
npm run seed
```

### 2. Clear Database
Remove all data from the database.

```bash
npm run seed:clear
```

### 3. Fresh Seed
Clear the database and then seed it with fresh data.

```bash
npm run seed:fresh
```

## Seed Data Overview

### Users (5 users)
- John Doe (Premium) - Business owner
- Jane Smith (Basic) - Cafe owner
- Ahmad Rizky (Enterprise) - Hotel manager
- Sarah Johnson (Free) - Restaurant chain owner
- Test User (Free) - Development test account

**Default password for all users:** `password123`

### Locations (5 locations)
- Kopi Kenangan Sudirman (Cafe)
- The Harvest Patissier & Chocolatier (Bakery)
- Hotel Grand Indonesia (Hotel)
- Warung Tekko (Restaurant)
- Starbucks Reserve Dewata (Cafe)

Locations are distributed among users in a round-robin fashion.

### Reviews (10 reviews)
- Mix of positive, neutral, and negative sentiments
- Includes sentiment scores and keyword analysis
- Distributed across all locations

## How It Works

1. **Users** are created first with hashed passwords
2. **Locations** are created and assigned to users
3. **Reviews** are created and assigned to locations
4. **Location sentiment stats** are automatically calculated based on reviews

## Modifying Seed Data

To customize the seed data:

1. Edit the JSON files in the `data/` directory
2. Follow the existing structure
3. Run `npm run seed:fresh` to apply changes

### Example: Adding a new user

Edit `data/users.json`:

```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "description": "New user description",
  "subscription": {
    "plan": "free",
    "isActive": true
  }
}
```

## Notes

- All seeders use **insertMany** which is faster for bulk operations
- Passwords are automatically hashed using bcryptjs
- Location sentiments are automatically calculated from review data
- The seeder connects to the database specified in your `.env` file
- Make sure MongoDB is running before executing seeder commands

## Troubleshooting

**Error: "No users available"**
- This means users weren't created properly
- Check database connection
- Ensure `users.json` is valid JSON

**Error: "Duplicate key error"**
- Data already exists in database
- Run `npm run seed:clear` first, or
- Use `npm run seed:fresh` instead

**Error: "Cannot connect to database"**
- Check your `.env` file
- Ensure MongoDB is running
- Verify `MONGODB_URI` is correct
