# Research Findings: QPI Calculator Implementation

## Technology Stack Decisions

### Frontend Framework: React + Vite
- **Decision**: React 19.1 with Vite 7.1 build tool
- **Rationale**: Already configured, excellent TypeScript support, fast development experience
- **Alternatives considered**: Next.js (overkill for client-side app), Create React App (slower build times)

### UI Component Library: Shadcn/ui
- **Decision**: Shadcn/ui components with Tailwind CSS
- **Rationale**: Copy-paste components, full customization control, consistent design system
- **Alternatives considered**: Material-UI (heavier bundle), Chakra UI (less customizable)

### State Management: Zustand
- **Decision**: Zustand for client-side state management
- **Rationale**: Lightweight, TypeScript-first, simple API, no boilerplate
- **Alternatives considered**: Redux Toolkit (too complex), Context API (performance issues with frequent updates)

### Backend: Convex
- **Decision**: Convex for course and template data storage
- **Rationale**: Already configured, real-time updates, TypeScript integration, serverless
- **Alternatives considered**: Firebase (vendor lock-in), Supabase (additional setup required)

## Data Architecture Decisions

### User Data Storage: Local Storage
- **Decision**: Browser localStorage for all user grade data
- **Rationale**: Privacy-first approach, no user authentication needed, offline capability
- **Alternatives considered**: Convex storage (privacy concerns), IndexedDB (overcomplicated for simple data)

### Data Persistence Strategy
- **Decision**: JSON serialization with schema versioning
- **Rationale**: Simple implementation, easy debugging, migration path for schema changes
- **Alternatives considered**: Binary serialization (no debugging benefits), no versioning (migration issues)

## File Handling Decisions

### CSV Import/Export: Browser File API
- **Decision**: Native File API with Blob downloads for CSV handling
- **Rationale**: No external dependencies, works offline, standard browser support
- **Alternatives considered**: Papa Parse library (additional dependency), server-side processing (privacy concerns)

### File Format: Standard CSV
- **Decision**: RFC 4180 compliant CSV format
- **Rationale**: Maximum compatibility with Excel and other spreadsheet applications
- **Alternatives considered**: JSON export (less portable), Excel binary format (complex implementation)

## Calculation Engine Decisions

### QPI Computation: Client-side JavaScript
- **Decision**: Pure JavaScript functions for all QPI calculations
- **Rationale**: Instant feedback, no network dependency, simple testing
- **Alternatives considered**: Server-side calculations (unnecessary latency), Web Workers (overkill for simple math)

### Grade Validation: Zod Schema Validation
- **Decision**: Zod for runtime type checking and validation
- **Rationale**: TypeScript integration, clear error messages, composable validators
- **Alternatives considered**: Manual validation (error-prone), Joi (less TypeScript support)

## Testing Strategy Decisions

### Testing Framework: Vitest + React Testing Library
- **Decision**: Vitest for unit/integration tests, React Testing Library for components
- **Rationale**: Fast execution, Vite integration, modern testing patterns
- **Alternatives considered**: Jest (slower with Vite), Cypress only (no unit tests)

### Test Database: Real Convex Dev Instance
- **Decision**: Use actual Convex development deployment for integration tests
- **Rationale**: Test real behavior, catch integration issues early
- **Alternatives considered**: Mock Convex client (doesn't test real integration), separate test deployment (complexity)

## Performance Optimization Decisions

### Bundle Optimization: Vite Code Splitting
- **Decision**: Lazy loading for template management and advanced features
- **Rationale**: Fast initial load for primary calculator functionality
- **Alternatives considered**: Single bundle (slower initial load), manual chunk optimization (complex maintenance)

### State Updates: Optimistic Updates
- **Decision**: Immediate UI updates with background sync for templates/courses
- **Rationale**: Responsive user experience, graceful degradation if offline
- **Alternatives considered**: Wait for server confirmation (poor UX), no sync (data loss risk)

## Development Workflow Decisions

### Code Organization: Feature-based Modules
- **Decision**: Organize code by feature areas (calculator, templates, courses)
- **Rationale**: Clear separation of concerns, easier maintenance, parallel development
- **Alternatives considered**: Technical layers (harder to navigate), single file (unmaintainable)

### Type Safety: Strict TypeScript Configuration
- **Decision**: Strict TypeScript with no implicit any, strict null checks
- **Rationale**: Catch errors at compile time, better IDE support, safer refactoring
- **Alternatives considered**: Loose TypeScript (runtime errors), JavaScript only (no type safety)