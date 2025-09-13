# Implementation Plan: QPI Calculator Client-Side Application

**Branch**: `001-qpi-calculator-client` | **Date**: 12 September 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-qpi-calculator-client/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ Feature spec loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ Web application type detected (frontend + backend)
   → ✅ Structure Decision: Option 2 (Web application)
3. Evaluate Constitution Check section below
   → ✅ No constitutional violations detected
   → ✅ Progress Tracking: Initial Constitution Check PASS
4. Execute Phase 0 → research.md
   → ✅ All technical requirements clear from user input
5. Execute Phase 1 → contracts, data-model.md, quickstart.md
   → ✅ Data models designed for Convex backend
6. Re-evaluate Constitution Check section
   → ✅ Design complies with constitutional principles
   → ✅ Progress Tracking: Post-Design Constitution Check PASS
7. Plan Phase 2 → Describe task generation approach
   → ✅ Task strategy defined for TDD implementation
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Primary requirement: QPI Calculator with three input methods (CSV import, course templates, blank start) featuring automatic QPI calculations and export functionality. Technical approach: React + Vite frontend with Convex backend, Shadcn components, Zustand state management, and local storage for user data.

## Technical Context
**Language/Version**: TypeScript 5.8, React 19.1, Node.js (via Vite 7.1)  
**Primary Dependencies**: React, Vite, Convex, Shadcn/ui, Zustand, Tailwind CSS  
**Storage**: Convex (courses/templates), Local Storage (user grade data), CSV export/import  
**Testing**: Vitest (to be added), React Testing Library  
**Target Platform**: Web browsers (modern)
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: <200ms calculation updates, <1s CSV import/export  
**Constraints**: Client-side only user data (privacy), offline-capable grade calculations  
**Scale/Scope**: Single user application, 100+ courses per template, 4+ years of data

$ARGUMENTS: The application will use vite and convex as the backend, I have already setup the convex so only the schemas and function will be necessary to be established. For UI, use Shadcn components. For backend planning, you will have to do this first, since that The things that I want to be saved in the database are: courses, with course code, unit, title. And then the templates which are course specific will have the name, then the array of semester containing the year level, 1st 2nd or summer semester, and then the array of course. Any user can create their template and course. Also use zustand for state management. No user data will be saved, it will only be saved local using local session storage or anything and can be exported to csv for portability.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 2 (frontend, convex backend) ✅ (max 3)
- Using framework directly? ✅ (React/Convex without wrappers)
- Single data model? ✅ (courses + templates in Convex, grades in localStorage)
- Avoiding patterns? ✅ (direct Convex queries, no unnecessary abstractions)

**Architecture**:
- EVERY feature as library? ✅ (utils, calculations, storage as libs)
- Libraries listed: grade-calculations + csv-handler + local-storage + qpi-formulas
- CLI per library: N/A (web application)
- Library docs: Component stories and JSDoc format planned

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? ✅ (test setup planned)
- Git commits show tests before implementation? ✅ (TDD approach)
- Order: Contract→Integration→E2E→Unit strictly followed? ✅
- Real dependencies used? ✅ (actual Convex, real localStorage)
- Integration tests for: component interactions, Convex queries, CSV handling
- FORBIDDEN: Implementation before test, skipping RED phase ✅

**Observability**:
- Structured logging included? ✅ (console + error boundaries)
- Frontend logs → backend? N/A (client-side app)
- Error context sufficient? ✅ (validation errors, import failures)

**Versioning**:
- Version number assigned? 0.1.0 (MAJOR.MINOR.BUILD)
- BUILD increments on every change? ✅
- Breaking changes handled? ✅ (localStorage schema versioning)

## Project Structure

### Documentation (this feature)
```
specs/001-qpi-calculator-client/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application
convex/
├── schema.ts           # Data models for courses & templates
├── courses.ts          # Course CRUD functions
├── templates.ts        # Template CRUD functions
└── _generated/

src/
├── components/         # Shadcn components & custom components
│   ├── ui/            # Shadcn base components
│   ├── grade-table/   # Grade input/display components
│   ├── course-manager/ # Course creation/editing
│   └── template-manager/ # Template management
├── lib/               # Utility libraries
│   ├── calculations/  # QPI calculation logic
│   ├── csv-handler/   # CSV import/export
│   ├── local-storage/ # Local data persistence
│   └── validation/    # Input validation
├── stores/            # Zustand stores
│   ├── grade-store.ts # Grade data state
│   ├── course-store.ts # Course selection state
│   └── ui-store.ts    # UI state management
├── pages/             # Main application pages
│   ├── home/          # Landing page with 3 options
│   ├── calculator/    # Main QPI calculator
│   └── templates/     # Template management
└── hooks/             # Custom React hooks

tests/
├── integration/       # Component integration tests
├── unit/             # Individual function tests
└── e2e/              # Full user journey tests
```

**Structure Decision**: Option 2 (Web application) - frontend with Convex backend

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - ✅ All technical requirements clear from user specifications
   - ✅ Convex schema design patterns researched
   - ✅ Zustand best practices for complex state management
   - ✅ CSV handling in browser environments
   - ✅ Local storage patterns for grade data

2. **Research findings consolidated**:
   - Convex schemas will use standard table definitions
   - Zustand will manage transient UI state and grade calculations
   - CSV handling via browser File API and Blob downloads
   - Local storage with JSON serialization and schema versioning

3. **Technology decisions finalized**:
   - Testing: Vitest + React Testing Library
   - Validation: Zod for type safety
   - File handling: Browser native APIs
   - State persistence: localStorage with fallback handling

**Output**: research.md completed with all technical decisions

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Course: courseCode, title, units
   - Template: name, semesters[], yearLevel, semesterType, courses[]
   - Grade (local): courseId, numericalGrade, letterGrade, qualityPoints
   - Semester (local): year, type, courses[], semesterQPI
   - Academic Record (local): semesters[], cumulativeQPI

2. **Generate API contracts** from functional requirements:
   - Convex queries/mutations for course and template management
   - Local storage contracts for grade data persistence
   - CSV import/export schema definitions
   - Component prop interfaces for type safety

3. **Generate contract tests** from contracts:
   - Convex function tests (must fail initially)
   - Local storage operation tests
   - CSV parsing and generation tests
   - Component integration tests

4. **Extract test scenarios** from user stories:
   - CSV import workflow test
   - Template selection and grade entry test
   - Blank start configuration test
   - QPI calculation accuracy test
   - Data export functionality test

5. **Update agent file incrementally** (O(1) operation):
   - Create `.github/copilot-instructions.md` for GitHub Copilot
   - Include project structure, tech stack, coding patterns
   - Add QPI calculation formulas and grading scale
   - Keep under 150 lines for efficiency

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, .github/copilot-instructions.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each Convex function → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Convex schemas → functions → components → pages
- Backend first: Convex setup → Frontend state → UI components
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 30-35 numbered, ordered tasks in tasks.md including:
1. Convex schema definition and testing
2. Course/template CRUD functions
3. Grade calculation library with tests
4. CSV handler library with tests  
5. Local storage utilities with tests
6. Zustand stores setup
7. Shadcn component integration
8. Main calculator components
9. Template management UI
10. Integration and E2E tests

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

No constitutional violations detected. The design follows all principles:
- Simple architecture with clear separation of concerns
- Library-first approach for reusable logic
- Test-driven development process
- Appropriate technology choices for requirements

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*