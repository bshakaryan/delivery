# README

## Project Description

This project is a Node.js-based application that facilitates user registration, login, and order management for an online food ordering system. The application uses MongoDB to store user data, orders, and dishes. It includes features like authentication (JWT and cookies), role-based access control, file uploads (avatars), and order management for both users and administrators.

## Technologies Used

- **Node.js**: JavaScript runtime environment
- **Express.js**: Web framework for Node.js
- **MongoDB**: NoSQL database for storing user data, orders, and dishes
- **Mongoose**: MongoDB object modeling for Node.js
- **JWT**: JSON Web Tokens for user authentication
- **Bcrypt.js**: Library to hash passwords
- **EJS**: Templating engine for dynamic HTML rendering
- **Flash messages**: For user notifications (success or error)
- **Cookie-Parser**: For handling cookies
- **Session**: For managing user sessions
- **Multer**: Middleware for handling file uploads (avatars)
- **Method-Override**: For handling HTTP methods other than GET and POST (e.g., PUT, DELETE)

## Setup Instructions

1. Clone the repository:
    ```bash
    git clone https://github.com/bshakaryan/delivery.git
    ```

2. Navigate to the project directory:
    ```bash
    cd delivery
    ```

3. Install dependencies:
    ```bash
    npm install
    ```

4. Create a `.env` file in the root directory of the project with the following variables:
    ```env
    URI=mongodb://localhost:27017/yourdatabase
    PORT=3000
    SECRET=your_secret_key
    ```

5. Run the application:
    ```bash
    npm start
    ```

    Or with `nodemon` for development:
    ```bash
    npm run dev
    ```

6. Open your browser and go to `http://localhost:3000` to use the application.

## Features

- **User Authentication**: 
  - User registration and login with JWT-based authentication.
  - Passwords are hashed using bcrypt.
  - Login status is stored in a cookie.
  
- **User Profile**:
  - Users can update their profile, including their username and avatar.
  
- **Order Management**:
  - Users can place an order with multiple dishes.
  - Admins can view all orders and update their status.

- **Admin Panel**:
  - Admins can log in with special credentials and manage orders.

## Routes

- `/register`: User registration page (GET) and handling registration (POST)
- `/login`: User login page (GET) and handling login (POST)
- `/login_admin`: Admin login page (GET) and handling login (POST)
- `/user`: User dashboard (GET)
- `/user/edit`: Edit user profile (GET, POST, PUT)
- `/user/edit/avatar`: Edit user profile picture (POST)
- `/user/edit/delete`: Edit profile status in server: active/deleted (GET, DELETE)
- `/user/order`: Place an order (GET, POST)
- `/admin`: Admin dashboard (GET)
- `/admin`: Update order status (POST)
- `/admin/edit-order/:id`: Managing order status: processing/cooking/done (GET, PUT, DELETE)
- `/admin/edit-order/:id/add-gift`: Managing order status: processing/cooking/done (GET, PUT)   in progres....
- `/admin/statistics`: Statistics tools page (GET)
- `/admin/statistics/top`: Shows business statistics of orders within a date range (GET)
- `/admin/statistics/username`: Shows business statistics of orders for a specific user (GET)
- `/logout`: Logout (GET)
  
## Middleware

- **authMiddleware**: Protects routes that require authentication.
- **roleMiddleware**: Ensures users have the required roles (e.g., "ADMIN").
- **upload**: Handles file uploads for avatars.
- **checkRoleMiddleware**: Restricts access to routes for users with specific roles.

  ## Authors

- Bekzhan Rakhimbaev
- Bogdan Shakaryan
