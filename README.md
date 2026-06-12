# Car Marketplace - Full Stack Application

A complete car marketplace application built with Laravel (backend) and React (frontend).

## Features

### Backend (Laravel)
- RESTful API for cars, orders, and users
- Authentication using Laravel Sanctum
- Role-based access control (Admin/User)
- CORS configuration for React frontend
- Database migrations and seeders

### Frontend (React)
- Modern UI with Tailwind CSS
- Responsive design
- User authentication (Login/Register)
- Car browsing with filters
- Car details and ordering
- Admin dashboard for management

## Tech Stack

### Backend
- **PHP**: ^8.2
- **Laravel**: ^12.0
- **MySQL**: Database
- **Laravel Sanctum**: Authentication

### Frontend
- **React**: ^19.2.4
- **Vite**: Build tool
- **React Router**: Navigation
- **Axios**: HTTP client
- **Tailwind CSS**: Styling

## Database Schema

### Users Table
- id, name, email, password, role

### Cars Table
- id, brand, model, price, city, type, stock, image, year, mileage

### Orders Table
- id, user_id, car_id, full_name, phone, status

## Installation & Setup

### Prerequisites
- PHP 8.2+
- Composer
- Node.js & npm
- MySQL
- XAMPP (for Windows development)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd car-market-backend
   ```

2. **Install dependencies**
   ```bash
   composer install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Configure database**
   Edit `.env` file and set your database credentials:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=car_market
   DB_USERNAME=root
   DB_PASSWORD=
   ```

5. **Create database**
   Create a MySQL database named `car_market`

6. **Run migrations and seeders**
   ```bash
   php artisan migrate
   php artisan db:seed
   ```

7. **Start Laravel server**
   ```bash
   php artisan serve
   ```

   The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd car-market-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

## Default Admin Account

After running the seeders, you can login with:
- **Email**: admin@carmarket.com
- **Password**: password

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Cars
- `GET /api/cars` - Get all cars (with filters)
- `GET /api/cars/{id}` - Get specific car
- `POST /api/cars` - Create car (Admin only)
- `PUT /api/cars/{id}` - Update car (Admin only)
- `DELETE /api/cars/{id}` - Delete car (Admin only)

### Orders
- `GET /api/orders` - Get orders (Admin: all, User: own)
- `GET /api/orders/{id}` - Get specific order
- `POST /api/orders` - Create order
- `PUT /api/orders/{id}` - Update order status (Admin only)
- `DELETE /api/orders/{id}` - Delete order (Admin only)

## Frontend Pages

### Public Pages
- **Home** (`/`) - Hero section, featured cars, search
- **Cars** (`/cars`) - Car listing with filters
- **Car Details** (`/cars/:id`) - Individual car information

### Authentication Pages
- **Login** (`/login`) - User login
- **Register** (`/register`) - User registration

### Admin Pages
- **Admin Dashboard** (`/admin`) - Statistics, manage cars & orders

## Usage

### For Users
1. Register a new account or login
2. Browse available cars on the Cars page
3. Use filters to find specific cars
4. View car details and place orders
5. Track order status

### For Admins
1. Login with admin credentials
2. Access admin dashboard
3. View statistics (cars, orders)
4. Manage car inventory
5. Approve/reject orders

## Development

### Running Both Servers

1. **Backend** (Terminal 1):
   ```bash
   cd car-market-backend
   php artisan serve
   ```

2. **Frontend** (Terminal 2):
   ```bash
   cd car-market-frontend
   npm run dev
   ```

### Adding Sample Data

The database seeder includes:
- 1 admin user
- 8 sample cars with various brands and types

To re-seed the database:
```bash
php artisan migrate:fresh --seed
```

## Project Structure

```
car-market/
|
|-- car-market-backend/          # Laravel Backend
|   |-- app/
|   |   |-- Http/Controllers/Api/
|   |   |-- Models/
|   |   |-- Middleware/
|   |-- database/
|   |   |-- migrations/
|   |   |-- seeders/
|   |-- routes/
|
|-- car-market-frontend/         # React Frontend
|   |-- src/
|   |   |-- components/
|   |   |-- pages/
|   |   |-- services/
|   |-- public/
|
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.
