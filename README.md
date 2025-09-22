# OTTOYARD - OttoCommand Fleet Management System

OTTOYARD is a comprehensive fleet management system with advanced AI-powered scheduling and optimization capabilities. The system provides real-time vehicle tracking, intelligent charging station management, and predictive maintenance scheduling.

## 🚀 Features

- **Real-time Fleet Tracking**: Live monitoring of vehicle locations and status
- **Smart Charging Management**: Automated scheduling and optimization of charging operations
- **OttoCommand AI Agent**: Intelligent fleet decision-making and optimization recommendations
- **Predictive Maintenance**: Proactive vehicle maintenance scheduling and management
- **Energy Grid Integration**: Bi-directional energy flow management with grid return capabilities
- **Multi-City Operations**: Support for fleet operations across multiple cities and depots

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Backend API**: Express.js + Node.js
- **Maps Integration**: Mapbox GL JS
- **Charts**: Recharts for analytics visualization
- **Testing**: Vitest (unit) + Playwright (e2e)
- **Build**: Vite with TypeScript support

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/OTTOYARD/ottoyard-a4359174.git
   cd ottoyard-a4359174
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Start the API server** (in a separate terminal)
   ```bash
   npm run server
   ```

The application will be available at `http://localhost:5173` and the API at `http://localhost:3001`.

## 🤖 How OttoCommand AI Tools Work

OttoCommand is the AI-powered brain of OTTOYARD, providing intelligent fleet optimization through a set of specialized tools:

### Agent Tools Architecture

The system implements 6 core agent tools that interface with fleet operations:

1. **`list_stalls(depot_id, status?)`** - Lists charging stalls with optional status filtering
2. **`get_charging_queue(depot_id)`** - Retrieves vehicles prioritized by lowest battery charge
3. **`schedule_vehicle(vehicle_id, stall_id, start, end)`** - Schedules charging with conflict prevention
4. **`assign_detailing(vehicle_id, bay_id, time_window)`** - Assigns vehicles to detailing bays
5. **`optimize_charging_plan(depot_id, horizon_minutes?, objective?)`** - Generates optimal charging schedules
6. **`utilization_report(depot_id, start, end)`** - Provides operational analytics and recommendations

### JSON Tool Call Examples

```json
{
  "tool": "list_stalls",
  "params": {
    "depot_id": "depot-1",
    "status": "available"
  }
}
```

**Response:**
```json
{
  "stalls": [
    {
      "id": "stall-2",
      "depot_id": "depot-1",
      "status": "available",
      "power_kw": 250,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

```json
{
  "tool": "schedule_vehicle",
  "params": {
    "vehicle_id": "vehicle-1",
    "stall_id": "stall-2",
    "start_time": "2024-01-15T14:30:00Z",
    "end_time": "2024-01-15T16:30:00Z"
  }
}
```

**Response:**
```json
{
  "assignment": {
    "id": "assignment-1642259400000",
    "vehicle_id": "vehicle-1",
    "stall_id": "stall-2",
    "start_time": "2024-01-15T14:30:00Z",
    "end_time": "2024-01-15T16:30:00Z",
    "type": "charging",
    "status": "scheduled"
  }
}
```

```json
{
  "tool": "optimize_charging_plan",
  "params": {
    "depot_id": "depot-1",
    "horizon_minutes": 120,
    "objective": "maximize_utilization"
  }
}
```

**Response:**
```json
{
  "plan": {
    "id": "plan-1642259400000",
    "depot_id": "depot-1",
    "assignments": [
      {
        "vehicle_id": "vehicle-2",
        "stall_id": "stall-3",
        "start_time": "2024-01-15T14:30:00Z",
        "end_time": "2024-01-15T15:45:00Z",
        "type": "charging"
      }
    ],
    "metrics": {
      "total_charging_time": 75,
      "utilization_rate": 85,
      "conflicts_resolved": 0
    }
  }
}
```

### OttoCommand Decision-Making Style

OttoCommand follows a decisive, expert-driven approach:

- **Direct Answers**: When data is sufficient, provides clear, factual responses first
- **Expert Recommendations**: For optimization scenarios, outputs structured recommendations with supporting metrics
- **Risk Assessment**: Includes potential risks, assumptions, and follow-up actions
- **Structured Output**: Uses JSON blocks for easy UI integration and processing

## 🎮 Charging/Staging Scheduler UI

The interactive scheduler provides:

### Drag-and-Drop Interface
- **Vehicles Panel**: Shows available vehicles sorted by lowest State of Charge (SOC)
- **Stalls Panel**: Displays open charging stalls with power ratings
- **Assignments Panel**: Real-time view of current and scheduled assignments

### Smart Features
- **Double-booking Prevention**: Automatic conflict detection and prevention
- **Optimization Engine**: One-click plan generation with "Apply Plan" functionality
- **Real-time Updates**: Live status updates and assignment tracking
- **Error Handling**: Graceful fallback to mock data when API is unavailable

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

Covers:
- Service layer functions (scheduling logic)
- Agent tool execution and error handling
- Double-booking prevention
- Optimization algorithms

### End-to-End Tests
```bash
npm run test:e2e
```

Tests:
- Drag-and-drop scheduling interface
- Optimization plan generation
- Error state handling
- UI component interactions

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run server` - Start Express API server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler check
- `npm run test` - Run unit tests with Vitest
- `npm run test:e2e` - Run Playwright end-to-end tests

## 🏗️ Architecture

```
src/
├── agent/           # AI agent tools and schemas
├── components/      # React UI components
├── data/           # Mock data and fixtures
├── services/       # Business logic and fleet operations
├── types/          # TypeScript type definitions
└── pages/          # Main application pages

server/
├── routes/         # Express API routes
└── index.js        # Server entry point

tests/
├── unit/           # Vitest unit tests
└── e2e/            # Playwright integration tests
```

## 🚦 CI/CD

GitHub Actions workflow runs on all pull requests:
- Code linting and formatting
- TypeScript type checking
- Unit test execution
- Production build verification
- End-to-end test suite

## 📊 Key Metrics

The system tracks and optimizes:
- **Fleet Utilization**: Real-time vehicle deployment efficiency
- **Charging Optimization**: Minimized wait times and maximized throughput
- **Energy Efficiency**: Grid return rates and power utilization
- **Maintenance Scheduling**: Predictive service intervals

## 🎯 OttoCommand Use Cases

1. **Peak Demand Management**: Automatically schedules charging during optimal grid pricing windows
2. **Route Optimization**: Balances vehicle deployment across service areas
3. **Maintenance Predictions**: Identifies vehicles approaching service intervals
4. **Energy Grid Integration**: Maximizes revenue through intelligent grid energy return

## 🔧 Configuration

Environment variables can be configured in `.env`:
```
VITE_API_BASE_URL=http://localhost:3001/api
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**OTTOYARD** - Revolutionizing fleet management through intelligent automation and AI-powered optimization.
