# Task Manager Application

A full-stack task management application built with Django REST Framework and vanilla JavaScript. The application features JWT authentication, task management with filtering and sorting capabilities, and a modern responsive UI.

## Features

- 🔐 JWT Authentication (Login/Register)
- ✅ Create, Read, Update, Delete tasks
- 🔍 Filter tasks by priority and status
- 📊 Sort tasks by creation date and priority
- 🎨 Modern and responsive UI
- 🔄 Auto token refresh mechanism
- 🔒 Secure API endpoints
- 🐳 Docker support

## Technology Stack

### Backend
- Django 4.2
- Django REST Framework
- Simple JWT for authentication
- SQLite database
- CORS headers for frontend communication

### Frontend
- Vanilla JavaScript
- HTML5
- CSS3
- Modern ES6+ features

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Python 3.9+ (for local development)
- Node.js 16+ (for local development)

### Running with Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd Task-manager
```

2. Start the application using Docker Compose:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001/api/
- Admin interface: http://localhost:8001/admin/

### Running Locally

1. Set up the backend:
```bash
# Create and activate virtual environment
python -m venv env
source env/bin/activate  # On Windows: env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start the backend server
python manage.py runserver 8001
```

2. Set up the frontend:
```bash
# Navigate to frontend directory
cd FE

# Start the frontend server
node server.js
```

## API Endpoints

### Authentication
- POST `/api/register/` - Register a new user
- POST `/api/login/` - Obtain JWT tokens
- POST `/api/token/refresh/` - Refresh JWT token

### Tasks
- GET `/api/tasks/` - List all tasks (with filtering and sorting)
- POST `/api/tasks/` - Create a new task
- GET `/api/tasks/<id>/` - Retrieve a specific task
- PUT `/api/tasks/<id>/` - Update a task
- DELETE `/api/tasks/<id>/` - Delete a task

## Task Filtering and Sorting

### Filter Parameters
- `priority` - Filter by priority (low, medium, high)
- `status` - Filter by status (pending, in_progress, completed)

### Sorting Parameters
- `ordering` - Sort by created_at or priority

Example:
```
/api/tasks/?priority=high&status=pending&ordering=-created_at
```

## Development

### Project Structure
```
Task-manager/
├── core/               # Django project settings
├── tasks/              # Tasks app
├── FE/                 # Frontend application
│   ├── app.js         # Frontend logic
│   ├── styles.css     # Styles
│   └── index.html     # Main HTML
├── Dockerfile         # Backend Dockerfile
├── docker-compose.yml # Docker composition
└── requirements.txt   # Python dependencies
```

### Environment Variables
- `DJANGO_SECRET_KEY` - Django secret key
- `DJANGO_DEBUG` - Debug mode (True/False)
- `CORS_ALLOWED_ORIGINS` - Allowed frontend origins

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
