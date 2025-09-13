# QPI Calculator - GitHub Copilot Instructions

## Project Overview
This is a client-side QPI (Quality Point Index) calculator for academic grade tracking. Users can import CSV data, use course templates, or start blank to calculate their academic performance.

## Tech Stack
- **Frontend**: React 19.1, TypeScript 5.8, Vite 7.1
- **UI**: Shadcn/ui components, Tailwind CSS 4.1
- **Backend**: Convex (serverless, real-time database)
- **State**: Zustand for client state management
- **Storage**: Local storage for user grades, Convex for courses/templates
- **Testing**: Vitest, React Testing Library (to be added)

## Architecture Patterns

### Data Flow
```
Convex (courses/templates) ↔ Frontend ↔ LocalStorage (user grades)
```

### State Management
- **Zustand stores**: UI state, grade calculations, course selection
- **Local storage**: Academic records, semester data, grade entries
- **Convex queries**: Course library, template management

### Component Structure
```
pages/ (routing components)
├── components/ (feature components)
│   ├── ui/ (shadcn base components)
│   ├── grade-table/ (grade input/display)
│   ├── course-manager/ (course creation)
│   └── template-manager/ (template operations)
├── lib/ (utility libraries)
├── stores/ (zustand state)
└── hooks/ (custom react hooks)
```

## Key Domain Logic

### QPI Calculation Formula
```typescript
// Grade scale (Philippines academic system)
const GRADE_SCALE = {
  'A':  { min: 98, max: 100, points: 4.0 },
  'B+': { min: 94, max: 97,  points: 3.5 },
  'B':  { min: 90, max: 93,  points: 3.0 },
  'C+': { min: 86, max: 89,  points: 2.5 },
  'C':  { min: 82, max: 85,  points: 2.0 },
  'D+': { min: 78, max: 81,  points: 1.5 },
  'D':  { min: 75, max: 77,  points: 1.0 },
  'F':  { min: 0,  max: 74,  points: 0.0 },
};

// Calculation hierarchy:
// Subject QPI = Units × Grade Point
// Semester QPI = Total Quality Points ÷ Total Units  
// Yearly QPI = Average of semester QPIs
// Cumulative QPI = All quality points ÷ All units
```

### Academic Year Structure
- **Standard**: 1st semester, 2nd semester
- **Optional**: Summer/intersession semester
- **Years**: Configurable 1-6 years per program

## Coding Conventions

### TypeScript
- Strict mode enabled, no implicit any
- Interface over type for object shapes
- Zod for runtime validation
- Explicit return types for functions

### React Components
```typescript
// Functional components with TypeScript
interface ComponentProps {
  required: string;
  optional?: number;
}

export function Component({ required, optional = 0 }: ComponentProps) {
  // Prefer hooks over class components
  // Use memo for expensive calculations
  // Custom hooks for shared logic
}
```

### State Management
```typescript
// Zustand store pattern
interface StoreState {
  data: T[];
  loading: boolean;
  actions: {
    fetch: () => Promise<void>;
    update: (id: string, data: Partial<T>) => void;
  };
}
```

### Error Handling
- Wrap async operations in try-catch
- Use error boundaries for component failures
- Validate data at boundaries (API, localStorage, user input)
- Provide user-friendly error messages

## Development Guidelines

### File Naming
- `kebab-case` for files and directories  
- `PascalCase` for React components
- `camelCase` for functions and variables
- `UPPER_SNAKE_CASE` for constants

### Testing Strategy (TDD)
1. Write failing test first
2. Implement minimal code to pass
3. Refactor while keeping tests green
4. Focus on contract tests for API boundaries

### Performance Considerations
- Memo expensive QPI calculations
- Debounce grade input to avoid excessive calculations
- Lazy load template management components
- Keep localStorage operations batched

## Recent Context & Changes
- Convex backend is already configured (`convex/` folder exists)
- Shadcn components setup with components.json
- Vite + React development environment ready
- Need to implement schemas, functions, and frontend logic

## Common Tasks

When implementing:
1. **New Convex function**: Define schema first, then function, then test
2. **React component**: Create interface, implement JSX, add to parent
3. **Calculation logic**: Write test with expected values, implement formula
4. **Form validation**: Use Zod schema, handle errors in UI
5. **Local storage**: Add versioning for schema changes

## Quality Gates
- All functions must have TypeScript types
- Components must handle loading/error states  
- Calculations must be tested with known values
- localStorage operations must handle quota exceeded
- Convex queries must handle network failures

---
*Keep this file updated as project evolves. Focus on patterns over implementation details.*