# Simple User Signup Application

This project is a simple user signup application built with Node.js, Express, and MySQL. It allows users to sign up and authenticate using their credentials.

## Project Structure

```
simple-user-signup
├── src
│   ├── server.js               # Entry point of the application
│   ├── controllers
│   │   └── authController.js   # Handles user signup and authentication
│   ├── models
│   │   └── userModel.js        # Defines user data structure and database interactions
│   ├── routes
│   │   └── auth.js             # Authentication routes for signup and login
│   ├── db
│   │   └── index.js            # MySQL database connection
│   ├── middlewares
│   │   └── validate.js         # Middleware for input validation
│   └── config
│       └── config.js           # Configuration settings
├── package.json                 # npm configuration file
├── .env                         # Environment variables
├── .gitignore                   # Files to ignore by Git
└── README.md                    # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd simple-user-signup
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add your database configuration:
   ```
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=your_database_name
   ```

## Usage

1. Start the server:
   ```
   npm start
   ```

2. Access the application at `http://localhost:3001`.

## Features

- User signup
- User authentication
- Input validation

## License

This project is licensed under the MIT License.# raamulapis
