# CubicleAlly

**Your AI ally for the climb ahead.**

CubicleAlly helps employees identify their skill gaps for promotion and build a compelling case to advance their careers. This is a B2C product aimed at individual employees — NOT an HR tool.

## Tech Stack

### Backend
- Django 4.2+ with Django REST Framework
- PostgreSQL database
- Celery with Redis for async tasks
- Anthropic Claude API for AI features

### Frontend
- React 18+ with TypeScript
- Tailwind CSS for styling
- React Query for server state
- Zustand for client state
- React Router v6

## Quick Start

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cubicle-ally.git
cd cubicle-ally
```

2. Copy the environment file:
```bash
cp .env.example .env
```

3. Add your Anthropic API key to `.env`:
```
ANTHROPIC_API_KEY=your-key-here
```

4. Start the services:
```bash
docker-compose up -d
```

5. Load sample data:
```bash
docker-compose exec backend python manage.py load_sample_data
```

6. Create a superuser (optional):
```bash
docker-compose exec backend python manage.py createsuperuser
```

7. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/

### Manual Setup

#### Backend

1. Create a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up the database:
```bash
python manage.py migrate
python manage.py load_sample_data
python manage.py createsuperuser
```

4. Run the development server:
```bash
python manage.py runserver
```

#### Frontend

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Run the development server:
```bash
npm run dev
```

## Project Structure

```
cubicle-ally/
├── backend/
│   ├── config/          # Django settings and URLs
│   ├── users/           # User authentication and profiles
│   ├── skills/          # Occupations, skills, promotion paths
│   ├── progress/        # User skills, evidence, gap analysis
│   ├── documents/       # Generated promotion documents
│   └── ai_services/     # Claude API integration
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API client
│   │   ├── stores/      # Zustand state stores
│   │   └── types/       # TypeScript types
│   └── ...
├── docker-compose.yml
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/registration/` - Register
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/me/` - Current user

### Occupations
- `GET /api/occupations/search/?q=` - Search occupations
- `GET /api/occupations/{code}/` - Get occupation details
- `GET /api/occupations/{code}/skills/` - Get occupation skills
- `GET /api/occupations/{code}/paths/` - Get promotion paths

### User Skills
- `GET /api/profile/skills/` - List user skills
- `POST /api/profile/skills/` - Add skill rating
- `POST /api/profile/skills/bulk/` - Bulk update skills

### Evidence
- `GET /api/evidence/` - List evidence
- `POST /api/evidence/` - Add evidence
- `POST /api/evidence/{id}/enhance/` - AI enhance evidence

### Gap Analysis
- `GET /api/analysis/` - Get gap analysis
- `GET /api/analysis/coaching/{skill_id}/` - Get skill coaching

### Documents
- `POST /api/documents/generate/` - Generate promotion document
- `GET /api/documents/` - List documents
- `GET /api/documents/{id}/pdf/` - Download as PDF

## Development

### Running Tests

Backend:
```bash
cd backend
pytest
```

Frontend:
```bash
cd frontend
npm run test
```

### Linting

Frontend:
```bash
cd frontend
npm run lint
```

## License

MIT License - See LICENSE file for details.
