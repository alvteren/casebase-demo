# casebase-demo

Demo project for Casebase - RAG (Retrieval-Augmented Generation) application with document upload, vector storage, and chat functionality.

## Project Structure

This is an Nx monorepo containing:

- **Backend** (`apps/backend`) - NestJS application with:
  - Chat module for RAG-based conversations
  - Upload module for document processing
  - Vector store module for Pinecone integration
  - PDF module for PDF generation

- **Frontend** (`apps/frontend`) - React application with web interface

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Docker and Docker Compose (for MongoDB) - see [Docker Installation](#docker-installation) below
- OpenAI API key
- Pinecone API key and index

## Docker Installation

Docker is required to run MongoDB automatically. Follow the instructions for your operating system:

### macOS

**Option 1: Docker Desktop (Recommended)**
1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Install and launch Docker Desktop
3. Verify installation:
   ```bash
   docker --version
   docker compose version
   ```

**Option 2: Homebrew**
```bash
brew install --cask docker
# Then launch Docker Desktop from Applications
```

### Linux (Ubuntu/Debian)

```bash
# Update package index
sudo apt-get update

# Install Docker
sudo apt-get install -y docker.io docker-compose

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Log out and log back in for group changes to take effect
# Then verify installation:
docker --version
docker compose version
```

### Linux (Other distributions)

Use the official Docker installation script:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker
```

### Windows

1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Install and launch Docker Desktop
3. Verify installation in PowerShell or Command Prompt:
   ```bash
   docker --version
   docker compose version
   ```

### Verify Docker Installation

After installation, verify that Docker is working:
```bash
docker ps
docker compose version
```

If you see no errors, Docker is installed and running correctly.

## Setup

1. **Clone the repository** (if not already done):
```bash
git clone <repository-url>
cd casebase-demo
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment variables**:

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` and fill in your API keys and configuration:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=your_index_name_here
PINECONE_ENVIRONMENT=us-east1-gcp

# File Upload Configuration
MAX_FILE_SIZE=10485760
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend Configuration
FRONTEND_URL=http://localhost:4200

# Backend URL (for frontend)
REACT_APP_BACKEND_URL=http://localhost:3000/api

# MongoDB Configuration (automatically started via Docker Compose)
MONGODB_URI=mongodb://localhost:27017/casebase-demo
```

### Environment Variables

#### OpenAI Configuration
- `OPENAI_API_KEY` (required) - Your OpenAI API key for embeddings and chat completion
  - Get it from: https://platform.openai.com/api-keys

#### Pinecone Configuration
- `PINECONE_API_KEY` (required) - Your Pinecone API key
  - Get it from: https://app.pinecone.io/
- `PINECONE_INDEX_NAME` (required) - Name of your Pinecone index
  - Create an index with dimension 1536 (for text-embedding-3-small)
- `PINECONE_ENVIRONMENT` (optional) - Pinecone environment/region
  - Default: `us-east1-gcp`

#### File Upload Configuration
- `MAX_FILE_SIZE` (optional) - Maximum file size in bytes (default: 10485760 = 10MB)
- `CHUNK_SIZE` (optional) - Text chunk size for splitting documents (default: 1000)
- `CHUNK_OVERLAP` (optional) - Overlap between chunks in characters (default: 200)

#### Server Configuration
- `PORT` (optional) - Backend server port (default: 3000)
- `NODE_ENV` (optional) - Environment mode: `development` or `production` (default: `development`)

#### Frontend Configuration
- `FRONTEND_URL` (optional) - Frontend URL for CORS configuration (default: `http://localhost:4200`)
  - Can be a comma-separated list of URLs for multiple origins
- `REACT_APP_BACKEND_URL` (optional) - Backend API URL used by frontend (default: `http://localhost:3000/api`)
  - This variable is used by the frontend to connect to the backend API

#### MongoDB Configuration
- `MONGODB_URI` (optional) - MongoDB connection string for chat history storage (default: `mongodb://localhost:27017/casebase-demo`)
  - **MongoDB is automatically started via Docker Compose when you run the backend**
  - The Docker container will be created and started automatically
  - Data is persisted in a Docker volume (`mongodb_data`)
  - To stop MongoDB: `docker-compose down`
  - To stop and remove data: `docker-compose down -v`

**⚠️ Important**: Never commit the `.env` file. It's already included in `.gitignore`.

## Running the Project

### Development Mode

Run both backend and frontend in development mode:

```bash
npm run dev
```

This will start:
- Backend API at: `http://localhost:3000/api`
- Frontend at: `http://localhost:4200` (default Nx React port)

### Run Backend Only

```bash
nx serve backend
```

**Note**: MongoDB will be automatically started via Docker Compose before the backend starts.

Backend will be available at: `http://localhost:3000/api`

### Run Frontend Only

```bash
nx serve frontend
```

Frontend will be available at: `http://localhost:4200`

### Build

Build all projects:

```bash
npm run build
```

Build specific project:

```bash
nx build backend
nx build frontend
```

### Testing

Run all tests:

```bash
npm test
```

Run tests for specific project:

```bash
nx test backend
nx test frontend
```

Run E2E tests:

```bash
nx e2e backend-e2e
nx e2e frontend-e2e
```

### Linting

Lint all projects:

```bash
npm run lint
```

Lint specific project:

```bash
nx lint backend
nx lint frontend
```

## Main Commands

### Nx Commands

All commands use the Nx CLI. You can use `npx nx` or the `nx` executable:

```bash
# General syntax
nx <command> <project>

# Examples
nx serve backend          # Serve backend app
nx serve frontend         # Serve frontend app
nx build backend          # Build backend app
nx test backend           # Run tests for backend
nx lint backend           # Lint backend code
nx e2e backend-e2e        # Run E2E tests

# Graph visualization
nx graph                  # Show project dependency graph
```

### Available Scripts

- `npm run dev` - Run both backend and frontend in development mode
- `npm run build` - Build all projects
- `npm test` - Run all tests
- `npm run lint` - Lint all projects
- `npm run serve` - Serve default project (requires project name)

### Useful Nx Commands

```bash
# Show project information
nx show project backend

# Run multiple projects
nx run-many --target=serve --projects=backend,frontend

# Clear Nx cache
nx reset
```

## API Endpoints

Once the backend is running, the following endpoints are available (with `/api` prefix):

- `GET /api` - Health check
- `POST /api/upload` - Upload documents (PDF, DOCX, TXT)
- `POST /api/chat/query` - Chat with RAG pipeline (supports `chatId` for conversation history)
- `POST /api/pdf/generate` - Generate PDF from chat session

### Chat History Endpoints

- `GET /api/chat/history` - Get all chat histories
- `GET /api/chat/history/:chatId` - Get chat history by ID
- `POST /api/chat/history` - Create a new chat
- `DELETE /api/chat/history/:chatId` - Delete chat history

## Technology Stack

- **Monorepo**: Nx
- **Backend**: NestJS, TypeScript
- **Frontend**: React, TypeScript
- **Database**: MongoDB (for chat history)
- **Vector Database**: Pinecone
- **AI/ML**: OpenAI (embeddings, chat completion)
- **Build**: Webpack

## Project Status

This is a demo project. Current implementation includes:

- ✅ Nx monorepo setup
- ✅ NestJS backend with main modules
- ✅ Environment configuration
- ✅ Pinecone integration
- ✅ Vector store service with embeddings
- 🔄 Document upload (in progress)
- 🔄 RAG pipeline (in progress)
- 🔄 Frontend UI (in progress)

## License

MIT
