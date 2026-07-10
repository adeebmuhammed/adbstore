# 👟 ADBSTORE - Shoe E-Commerce Platform

ADBSTORE is a full-stack e-commerce platform designed for purchasing shoes online. The platform provides customers with a seamless shopping experience while equipping administrators with comprehensive tools to manage products, inventory, orders, and business analytics.

## 🌐 Live Demo

🔗 https://adbstore.online

---

# 📖 Overview

ADBSTORE enables customers to browse products, securely purchase footwear online, and track their orders, while administrators can efficiently manage the entire e-commerce ecosystem through a feature-rich dashboard.

---

# ✨ Features

## 🛍️ Customer Features

- Secure User Registration & Login
- User Authentication
- Browse Products
- Product Search & Filtering
- Product Categories
- Product Details
- Product Image Zoom
- Shopping Cart
- Wishlist
- Coupon Application
- Secure Checkout
- Razorpay Payment Integration
- Order Placement
- Order History
- Order Tracking
- Profile Management
- Responsive Design

---

## 🛠️ Admin Features

- Dashboard Overview
- Product Management
- Category Management
- User Management
- Inventory Management
- Offer & Coupon Management
- Order Management
- Sales Reports
- Revenue Analytics
- Business Performance Dashboard
- Data Visualization Charts

---

# 🏗️ Architecture

The application follows the **Model-View-Controller (MVC)** architecture, ensuring clean code organization and maintainability.

```
Client
   │
   ▼
Routes
   │
   ▼
Controllers
   │
   ▼
Models
   │
   ▼
MongoDB
```

### Architecture Highlights

- MVC Pattern
- RESTful Routing
- Modular Code Structure
- Server-side Rendering with EJS

---

# 🔒 Authentication & Security

- Secure User Authentication
- Password Hashing
- Session Management
- Protected Routes
- Input Validation
- Secure Checkout Workflow

---

# 🛒 Shopping Experience

Customers can:

- Browse Shoe Collections
- Search Products
- Filter by Category
- View Product Details
- Zoom Product Images
- Add Items to Cart
- Apply Offers & Coupons
- Place Orders Securely
- View Order History

---

# 💳 Payment Integration

Integrated **Razorpay** for secure online payments.

Features include:

- Secure Checkout
- Online Payment Processing
- Payment Verification
- Order Confirmation
- Transaction Management

---

# 📊 Admin Dashboard

The admin dashboard provides powerful business management tools including:

- Sales Reports
- Revenue Tracking
- Inventory Monitoring
- Customer Management
- Product Performance
- Order Statistics
- Business Analytics
- Interactive Data Visualization Charts

---

# 🚀 Deployment

| Service | Platform |
|----------|----------|
| Application | AWS EC2 |
| Database | MongoDB |

---

# 🛠️ Tech Stack

### Backend

- Node.js
- Express.js

### Frontend

- EJS
- Bootstrap
- JavaScript
- HTML5
- CSS3

### Database

- MongoDB

### Payment

- Razorpay

### Deployment

- AWS EC2

---

# 📂 Project Structure

```
ADBSTORE
│
├── controllers
├── config
├── helpers
├── models
├── routes
├── middlewares
├── public
│   ├── css
│   ├── js
│   ├── images
│
├── views
│   ├── user
│   ├── admin
│   └── partials
│
├── app.js
```

---

# ⚙️ Installation

## Clone the repository

```bash
git clone https://github.com/adeebmuhammed/adbstore.git
```

## Install dependencies

```bash
npm install
```

## Start the application

```bash
npm start
```

For development:

```bash
npm run start
```

---

# 🌍 Environment Variables

Create a `.env` file in the project root.

```env
PORT=

MONGODB_URI=

SESSION_SECRET=

RAZORPAY_KEY_ID=

RAZORPAY_KEY_SECRET=

AWS_ACCESS_KEY=

AWS_SECRET_KEY=
```
---

# 📌 Future Improvements

- Product Reviews & Ratings
- Email Notifications
- Order Tracking Updates
- Multiple Payment Options
- REST Principles
- Wishlist Sharing
- Product Recommendations
- Progressive Web App (PWA)
- AI-powered Product Suggestions

---

# 👨‍💻 Author

**Muhammed Adeeb**

GitHub: https://github.com/adeebmuhammed

LinkedIn: https://www.linkedin.com/in/adeebmuhammed

---

# ⭐ Support

If you found this project helpful, consider giving it a **⭐ Star** on GitHub.
