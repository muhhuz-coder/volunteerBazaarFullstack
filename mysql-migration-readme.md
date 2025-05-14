# Migrating to MySQL Database

This guide will walk you through the steps to migrate the Volunteer Bazaar application from JSON file-based storage to a MySQL database.

## Prerequisites

Before you begin, make sure you have:

1. MySQL server installed and running
2. Node.js and npm installed
3. Basic knowledge of MySQL and command-line operations

## Step 1: Set Up MySQL Database

1. Install MySQL if you haven't already:
   - For Windows: Download and install from [MySQL Website](https://dev.mysql.com/downloads/installer/)
   - For macOS: `brew install mysql`
   - For Linux: `sudo apt install mysql-server` (Ubuntu/Debian) or `sudo yum install mysql-server` (CentOS/RHEL)

2. Create the database and tables by running the SQL script:

```bash
mysql -u root -p < database_setup.sql
```

This script will:
- Create a new database called `volunteer_bazaar`
- Set up all necessary tables with proper relationships
- Add indexes for performance optimization
- Create stored procedures for common operations

## Step 2: Install Required NPM Packages

Add the MySQL client library to your project:

```bash
npm install mysql2 dotenv
```

## Step 3: Configure Environment Variables

Create a `.env` file in your project root (if it doesn't exist) and add:

```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=volunteer_bazaar
```

Make sure to add `.env` to your `.gitignore` file to keep your database credentials secure.

## Step 4: Migrate Existing Data

1. Run the migration script to transfer all your existing JSON data to MySQL:

```bash
node migrate-data.js
```

This script will:
- Read all your existing JSON files
- Insert the data into the MySQL database
- Handle relationships and data transformations

## Step 5: Update Your Application Code

1. Replace imports from `db-utils.ts` with the new MySQL-based utility:

```typescript
// Before
import { readData, writeData } from '@/lib/db-utils';

// After
import { executeQuery, getUserById, createOpportunity } from '@/lib/db-mysql';
```

2. Update each service file to use the new database functions. For example:

- In `auth-actions.ts`, replace JSON file operations with MySQL functions
- In `job-board.ts`, update opportunity management to use the database
- For gamification services, use the MySQL-based stats management

## Step 6: Test Your Application

1. Run your application in development mode:

```bash
npm run dev
```

2. Test all main functionality to make sure everything works with the new database:
   - User registration and login
   - Opportunity creation and application
   - Volunteer stats and gamification features
   - Messaging system

## Troubleshooting

- **Connection issues**: Verify your MySQL server is running and credentials are correct
- **Missing data**: Run the migration script again with debug logging enabled
- **Schema problems**: Check the database setup script for errors or missing fields

## Benefits of This Migration

1. **Better Performance**: MySQL is optimized for high-performance data operations
2. **Data Integrity**: Relational database ensures data consistency and referential integrity
3. **Scalability**: Ready for growth as your user base expands
4. **Security**: More robust security features than file-based storage
5. **Query Flexibility**: Complex data queries become much simpler

## Next Steps

- Set up a proper database backup system
- Consider implementing database migrations for future schema changes
- Add database connection pooling for better performance under load
- Implement more complex queries for analytics and reporting 