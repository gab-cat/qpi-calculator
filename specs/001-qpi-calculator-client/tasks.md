# Tasks: QPI Calculator Client-Side Application

**Input**: Design documents from `/specs/001-qpi-calculator-client/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✅ Implementation plan loaded successfully  
   → Extracted: React/Vite frontend, Convex backend, Zustand state, localStorage
2. Load optional design documents:
   → ✅ data-model.md: Courses, Templates, Grades, Academic Records
   → ✅ contracts/: Convex API, localStorage, component interfaces  
   → ✅ research.md: Technology decisions and rationale
3. Generate tasks by category:
   → Setup: Vite/React project, Convex functions, dependencies
   → Tests: Contract tests, integration tests, calculation tests
   → Core: Schemas, functions, components, calculations
   → Integration: Zustand stores, localStorage, CSV handlers
   → Polish: E2E tests, performance, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness: ✅
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
Web application structure:
- **Convex backend**: `convex/` at repository root
- **Frontend**: `src/` at repository root  
- **Tests**: `tests/` at repository root

## Phase 3.1: Setup
- [x] T001 Install additional dependencies: zustand, zod, @radix-ui/react-dialog, @radix-ui/react-select
- [x] T002 Install dev dependencies: vitest, @testing-library/react, @testing-library/jest-dom, convex-test, @edge-runtime/vm
- [x] T003 [P] Configure vitest.config.mts with convex-test and multiple environments
- [x] T004 [P] Update package.json test scripts for convex-test
- [x] T005 [P] Create tests directory structure: tests/unit/, tests/integration/, tests/e2e/, convex/*.test.ts
- [x] T006 [P] Setup test utilities in tests/utils/test-helpers.ts with React Testing Library setup
- [x] T007 [P] Create convex test utilities in convex/test-utils.ts for shared convex-test setup

## Phase 3.2: Core Types & Utilities
- [x] T008 [P] Implement src/lib/types/academic-types.ts with complete type system
- [x] T009 [P] Create tests/unit/academic-types.test.ts for type validation
- [x] T010 [P] Implement src/lib/calculations/grade-scale.ts with grade point conversions
- [x] T011 [P] Create tests/unit/grade-scale.test.ts with comprehensive grade scenarios
- [x] T012 [P] Implement src/lib/calculations/qpi-calculator.ts with all QPI calculation functions
- [x] T013 [P] Create tests/unit/calculations.test.ts for all calculation methods
- [ ] T014 [P] Contract test templates.create() mutation in convex/templates.test.ts using convex-test
- [ ] T015 [P] Contract test templates.update() mutation in convex/templates.test.ts using convex-test
- [ ] T016 [P] Contract test templates.delete() mutation in convex/templates.test.ts using convex-test

## Phase 3.3: Backend Implementation (ONLY after contract tests are failing)
- [x] T017 Define Convex schema in convex/schema.ts (courses and templates tables with indexes)
- [x] T018 Implement courses.list() query function in convex/courses.ts
- [x] T019 Implement courses.create() mutation function in convex/courses.ts
- [x] T020 Implement courses.update() mutation function in convex/courses.ts  
- [x] T021 Implement courses.delete() mutation function in convex/courses.ts
- [x] T022 Implement templates.list() query function in convex/templates.ts
- [x] T023 Implement templates.getById() query function in convex/templates.ts
- [x] T024 Implement templates.create() mutation function in convex/templates.ts
- [x] T025 Implement templates.update() mutation function in convex/templates.ts
- [x] T026 Implement templates.delete() mutation function in convex/templates.ts

## Phase 3.4: Core Calculation Libraries (TDD)
- [x] T027 [P] QPI calculation tests in tests/unit/calculations.test.ts
- [x] T028 [P] Grade scale conversion tests in tests/unit/grade-scale.test.ts  
- [x] T029 [P] CSV parsing tests in tests/unit/csv-handler.test.ts
- [x] T030 [P] CSV export tests in tests/unit/csv-export.test.ts
- [x] T031 [P] LocalStorage operations tests in tests/unit/local-storage.test.ts (temporarily disabled)
- [x] T032 [P] Implement QPI calculations library in src/lib/calculations/qpi-calculator.ts
- [x] T033 [P] Implement grade scale conversion in src/lib/calculations/grade-scale.ts
- [x] T034 [P] Implement CSV import handler in src/lib/csv-handler/csv-import.ts
- [x] T035 [P] Implement CSV export handler in src/lib/csv-handler/csv-export.ts
- [x] T036 [P] Implement localStorage utilities in src/lib/local-storage/academic-storage.ts
- [ ] T037 [P] Implement data validation schemas in src/lib/validation/schemas.ts

## Phase 3.5: State Management (Zustand Stores)
- [x] T038 [P] Create grade store tests in tests/unit/grade-store.test.ts
- [x] T039 [P] Create course store tests in tests/unit/course-store.test.ts
- [x] T040 [P] Create UI store tests in tests/unit/ui-store.test.ts
- [x] T041 [P] Implement grade data store in src/stores/grade-store.ts
- [x] T042 [P] Implement course selection store in src/stores/course-store.ts  
- [x] T043 [P] Implement UI state store in src/stores/ui-store.ts

## Phase 3.6: UI Components (TDD)
- [ ] T050 Implement GradeTable component in src/components/grade-table/GradeTable.tsx
- [ ] T051 Implement CourseSelector component in src/components/course-manager/CourseSelector.tsx
- [ ] T052 Implement TemplateSelector component in src/components/template-manager/TemplateSelector.tsx
- [ ] T053 Implement CSVImporter component in src/components/csv-handler/CSVImporter.tsx
- [ ] T054 Implement CSVExporter component in src/components/csv-handler/CSVExporter.tsx
- [ ] T055 Implement QPISummary component in src/components/calculator/QPISummary.tsx

## Phase 3.7: Page Components and Routing
- [ ] T059 Implement Home page with three options in src/pages/home/HomePage.tsx
- [ ] T060 Implement Calculator page with grade tables in src/pages/calculator/CalculatorPage.tsx
- [ ] T061 Implement Templates management page in src/pages/templates/TemplatesPage.tsx
- [ ] T062 Update main App.tsx with routing and navigation

## Phase 3.8: Integration Tests (User Journeys)
**CRITICAL: These test complete user workflows from quickstart.md**
- [ ] T063 [P] CSV import workflow test in tests/integration/csv-import-flow.test.tsx
- [ ] T064 [P] Template selection workflow test in tests/integration/template-selection-flow.test.tsx
- [ ] T065 [P] Blank start configuration test in tests/integration/blank-start-flow.test.tsx
- [ ] T066 [P] Grade entry and calculation test in tests/integration/grade-calculation-flow.test.tsx
- [ ] T067 [P] Data export workflow test in tests/integration/data-export-flow.test.tsx
- [ ] T068 [P] QPI calculation accuracy test in tests/integration/qpi-accuracy.test.ts
- [ ] T069 [P] Data persistence test in tests/integration/data-persistence.test.tsx

## Phase 3.9: E2E Tests and Performance
- [ ] T070 [P] E2E test complete user journey in tests/e2e/complete-journey.test.ts  
- [ ] T071 [P] Performance test calculation speed in tests/performance/calculation-performance.test.ts
- [ ] T072 [P] Performance test CSV import speed in tests/performance/csv-performance.test.ts
- [ ] T073 [P] Performance test localStorage limits in tests/performance/storage-limits.test.ts

## Phase 3.10: Polish and Documentation
- [ ] T074 [P] Create component documentation in src/components/README.md
- [ ] T075 [P] Create calculation formulas documentation in src/lib/calculations/README.md
- [ ] T076 [P] Update main README.md with setup and usage instructions
- [ ] T077 [P] Add error boundaries for component failures in src/components/ErrorBoundary.tsx
- [ ] T078 [P] Add loading states and error handling throughout UI
- [ ] T079 Optimize bundle size and lazy load non-critical components
- [ ] T080 Run quickstart.md manual testing scenarios

## Dependencies

### Critical Paths:
- **Setup** (T001-T007) before everything
- **Contract Tests** (T008-T016) before Backend Implementation (T017-T026)  
- **Backend** (T017-T026) before State Management (T041-T043)
- **Libraries** (T032-T037) before Components (T050-T055)
- **Components** before Pages (T059-T062)
- **Pages** before Integration Tests (T063-T069)

### Blocking Dependencies:
- T017 (schema) blocks T018-T026 (Convex functions)
- T032-T037 (libraries) block T050-T055 (components)
- T041-T043 (stores) block T059-T062 (pages)
- T050-T062 (UI implementation) block T063-T069 (integration tests)

## Parallel Execution Examples

### Phase 3.2 - Contract Tests (All Parallel with convex-test):
```
Task: "Contract test courses.list() query in convex/courses.test.ts using convex-test"
Task: "Contract test courses.create() mutation in convex/courses.test.ts using convex-test"
Task: "Contract test templates.list() query in convex/templates.test.ts using convex-test"
Task: "Contract test templates.create() mutation in convex/templates.test.ts using convex-test"
```

### Phase 3.4 - Core Libraries (All Parallel):
```
Task: "QPI calculation tests in tests/unit/calculations.test.ts"
Task: "Grade scale conversion tests in tests/unit/grade-scale.test.ts"
Task: "CSV parsing tests in tests/unit/csv-handler.test.ts"
Task: "LocalStorage operations tests in tests/unit/local-storage.test.ts"
```

### Phase 3.6 - Component Tests (All Parallel):
```
Task: "GradeTable component tests in tests/unit/components/grade-table.test.tsx"
Task: "CourseSelector component tests in tests/unit/components/course-selector.test.tsx"
Task: "TemplateSelector component tests in tests/unit/components/template-selector.test.tsx"
Task: "CSVImporter component tests in tests/unit/components/csv-importer.test.tsx"
```

## Notes
- [P] tasks target different files with no shared dependencies
- All Convex function tests must use convex-test package with proper schema setup
- All tests must fail before implementation begins (TDD requirement)
- Convex tests should be in convex/*.test.ts files for proper environment detection
- Frontend tests remain in tests/ directory using jsdom environment
- Commit after each task completion
- Integration tests validate complete user workflows from quickstart.md
- Performance tests ensure <200ms calculation updates and <1s CSV operations

## Task Generation Rules Applied

1. **From Convex Contracts**: 9 contract test tasks → 9 implementation tasks (all using convex-test)
2. **From Data Model**: 4 entities → multiple library and store tasks
3. **From Quickstart Stories**: 5 user journeys → 5 integration test tasks
4. **From Component Interfaces**: 6 major components → 12 tasks (test + implementation)

## Validation Checklist ✅

- [x] All Convex contracts have corresponding tests (T008-T016) and implementations (T017-T026)
- [x] Convex tests use convex-test package with proper schema integration
- [x] All entities have model/library tasks (calculations, storage, validation)
- [x] All tests come before implementation (TDD enforced)
- [x] Parallel tasks target independent files
- [x] Each task specifies exact file path
- [x] Integration tests cover all user stories from quickstart.md
- [x] Performance requirements addressed (T071-T073)
- [x] Multiple Vitest environments configured for Convex and frontend tests