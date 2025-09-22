# OTTOYARD Fleet Command

## OttoCommand AI: Fleet & Depot Management System

A comprehensive fleet management and depot optimization system with AI-powered scheduling and optimization capabilities.

### Key Features

- **Agent Tools**: 6 core AI agent tools for fleet management
- **Drag & Drop Scheduler**: Interactive charging and staging scheduler
- **Real-time Optimization**: Smart charging plan generation and optimization
- **Mock Data Support**: Comprehensive mock data for testing and demonstration
- **API Integration**: RESTful API with Express backend
- **Comprehensive Testing**: Unit tests (Vitest) and E2E tests (Playwright)

## Project info

**URL**: https://lovable.dev/projects/10c7ad26-937b-4b92-85cd-b8ea79d185b9

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/10c7ad26-937b-4b92-85cd-b8ea79d185b9) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev

# Step 5 (Optional): Start the OttoCommand API server
npm run dev:server
```

### Development Workflow

```sh
# Run tests
npm test                    # Run unit tests with Vitest
npm run test:ui             # Run tests with UI
npm run test:e2e            # Run end-to-end tests with Playwright

# Build
npm run build               # Build frontend
npm run build:server        # Build API server

# Production
npm run start:server        # Start production API server
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

### Frontend
- **Vite**: Build tool and development server
- **TypeScript**: Type-safe JavaScript development
- **React**: UI framework with hooks and components
- **shadcn-ui**: Modern UI component library
- **Tailwind CSS**: Utility-first CSS framework
- **React Query**: Data fetching and state management
- **React Router**: Client-side routing

### Backend
- **Express**: Node.js web framework for API
- **TypeScript**: Type-safe server development
- **CORS**: Cross-Origin Resource Sharing middleware

### Testing
- **Vitest**: Unit testing framework
- **Playwright**: End-to-end testing framework
- **Testing Library**: React component testing utilities

### Development Tools
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **tsx**: TypeScript execution for development

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/10c7ad26-937b-4b92-85cd-b8ea79d185b9) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

---

## OttoCommand Agent Tools

OttoCommand provides 6 core agent tools for comprehensive fleet and depot management:

### 1. List Stalls (`list_stalls`)

Lists charging stalls in a depot with optional status filtering.

```json
{
  "name": "list_stalls",
  "parameters": {
    "depot_id": "depot-alpha",
    "status": "available" // optional: available, occupied, maintenance, reserved
  }
}
```

**Response**: Array of charging stalls sorted by power rating (highest first)

### 2. Get Charging Queue (`get_charging_queue`)

Retrieves vehicles needing charge, prioritized by lowest State of Charge (SOC).

```json
{
  "name": "get_charging_queue",
  "parameters": {
    "depot_id": "depot-alpha"
  }
}
```

**Response**:
```json
{
  "vehicles": [...], // Vehicles with SOC < 80%, sorted by SOC ascending
  "estimatedWaitTimes": {
    "V001": 15, // Wait time in minutes
    "V002": 30
  }
}
```

### 3. Schedule Vehicle (`schedule_vehicle`)

Schedules a vehicle to a charging stall with double-booking prevention.

```json
{
  "name": "schedule_vehicle",
  "parameters": {
    "vehicle_id": "V001",
    "stall_id": "CS001",
    "start": "2024-10-01T10:00:00Z",
    "end": "2024-10-01T11:00:00Z"
  }
}
```

**Response**:
```json
{
  "success": true,
  "assignment": {
    "id": "SA123",
    "vehicleId": "V001",
    "stallId": "CS001",
    "startTime": "2024-10-01T10:00:00Z",
    "endTime": "2024-10-01T11:00:00Z",
    "type": "charging",
    "status": "scheduled"
  }
}
```

### 4. Assign Detailing (`assign_detailing`)

Assigns a vehicle to a detailing bay within a time window.

```json
{
  "name": "assign_detailing",
  "parameters": {
    "vehicle_id": "V002",
    "bay_id": "DB001",
    "time_window": {
      "start": "2024-10-01T14:00:00Z",
      "end": "2024-10-01T15:00:00Z"
    }
  }
}
```

### 5. Optimize Charging Plan (`optimize_charging_plan`)

Generates AI-powered optimization plan for charging assignments.

```json
{
  "name": "optimize_charging_plan",
  "parameters": {
    "depot_id": "depot-alpha",
    "horizon_minutes": 120, // 30-480 minutes
    "objective": "minimize_wait" // minimize_wait | maximize_utilization | minimize_energy_cost
  }
}
```

**Response**:
```json
{
  "assignments": [...], // Optimized schedule assignments
  "metrics": {
    "totalUtilization": 0.75, // 0-1
    "avgWaitTime": 15, // minutes
    "energyEfficiency": 125.5 // kW
  },
  "objective": "minimize_wait"
}
```

### 6. Utilization Report (`utilization_report`)

Generates comprehensive utilization analytics and recommendations.

```json
{
  "name": "utilization_report",
  "parameters": {
    "depot_id": "depot-alpha",
    "start": "2024-10-01T00:00:00Z",
    "end": "2024-10-02T00:00:00Z"
  }
}
```

**Response**:
```json
{
  "depotId": "depot-alpha",
  "period": {
    "start": "2024-10-01T00:00:00Z",
    "end": "2024-10-02T00:00:00Z"
  },
  "chargingStats": {
    "totalSessions": 45,
    "avgSessionDuration": 75, // minutes
    "stallUtilization": 0.68, // 0-1
    "peakHours": ["08:00-10:00", "17:00-19:00"]
  },
  "detailingStats": {
    "totalSessions": 12,
    "avgSessionDuration": 45, // minutes
    "bayUtilization": 0.4 // 0-1
  },
  "recommendations": [
    "Consider adding 2 more charging stalls to meet peak demand",
    "Schedule more detailing sessions during off-peak hours"
  ]
}
```

## API Endpoints

The Express API server provides RESTful endpoints for all agent tools:

```
GET    /api/stalls?depot_id=depot-alpha&status=available
GET    /api/charging-queue?depot_id=depot-alpha
POST   /api/schedule-vehicle
POST   /api/assign-detailing
POST   /api/optimize-charging-plan
GET    /api/utilization-report?depot_id=depot-alpha&start=...&end=...
GET    /health                    # Health check
GET    /api/tools                 # API documentation
```

## Drag & Drop Scheduler UI

The interactive scheduler provides:

- **Three-column layout**: Vehicles | Available Stalls | Current Assignments
- **Drag & drop**: Vehicle-to-stall assignment with visual feedback
- **Optimization engine**: AI-powered plan generation with metrics
- **Real-time updates**: Live assignment status and conflict prevention
- **Responsive design**: Mobile-friendly interface
- **Error handling**: Graceful fallback to mock data

### Usage

1. Navigate to the "Scheduler" tab in OTTOYARD Fleet Command
2. Drag vehicles (SOC < 80%) to available charging stalls
3. Click "Optimize Plan" for AI-generated assignments
4. Review optimization metrics and click "Apply Plan"
5. Monitor current assignments in real-time

## Architecture

```
src/
├── agent/
│   └── tools.ts              # Agent tool definitions with JSON schemas
├── services/
│   └── scheduling.ts         # Core business logic and algorithms
├── data/
│   └── mock.ts              # Mock data for testing and fallback
├── types/
│   └── index.ts             # TypeScript type definitions
├── components/
│   └── SchedulerUI.tsx      # Drag & drop scheduler interface
├── hooks/
│   └── useOttoCommand.ts    # React hook for API integration
└── test/
    └── setup.ts             # Test configuration

server/
└── index.ts                 # Express API server

tests/
└── e2e/
    └── scheduler.spec.ts    # Playwright end-to-end tests
```

## Testing

### Unit Tests (Vitest)

```bash
npm test                     # Run all unit tests
npm run test:ui             # Run tests with interactive UI
```

Tests cover:
- Agent tool validation and execution
- Scheduling service logic and double-booking prevention
- Optimization algorithm correctness
- React hook behavior and API integration

### End-to-End Tests (Playwright)

```bash
npm run test:e2e            # Run E2E tests
```

Tests cover:
- Drag and drop scheduler functionality
- Optimization plan generation and application
- Error handling and user feedback
- Responsive design on mobile devices

## Contributing

1. Follow TypeScript strict mode requirements
2. Add tests for new features (unit + E2E)
3. Update documentation for API changes
4. Follow existing code conventions and patterns
5. Ensure all tests pass: `npm test && npm run test:e2e`
