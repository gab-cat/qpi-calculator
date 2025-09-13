# QPI Calculator - Quickstart Guide

## Development Setup

### Prerequisites
- Node.js 18+ installed
- Convex account and CLI configured
- VS Code with TypeScript extensions (recommended)

### Initial Setup
```bash
# Clone and setup
git checkout 001-qpi-calculator-client
npm install

# Setup Convex (if not already done)
npx convex dev

# Install additional dependencies
npm install zustand zod @radix-ui/react-dialog @radix-ui/react-select
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### Environment Configuration
```bash
# Create .env.local
echo "VITE_CONVEX_URL=your_convex_deployment_url" > .env.local
```

## User Journey Testing (Acceptance Criteria)

### Journey 1: CSV Import Flow
**Goal**: Verify user can import existing grade data from CSV file

1. **Setup**: Prepare test CSV with sample grade data
   ```csv
   Academic Year,Year Level,Semester Type,Course Code,Course Title,Units,Numerical Grade
   2023-2024,1,first,ENGS101,English Communication,3,95
   2023-2024,1,first,MATH101,Calculus I,3,88
   ```

2. **Test Steps**:
   ```bash
   npm run dev
   # Navigate to http://localhost:5173
   # Click "Import CSV File" button
   # Select test CSV file
   # Verify preview shows correct data
   # Click "Import" button
   # Verify grade table displays imported grades
   # Verify QPI calculations are correct (Expected: 3.25 for sample data)
   ```

3. **Acceptance Criteria**:
   - [ ] File selection dialog opens
   - [ ] CSV data is parsed correctly
   - [ ] Preview shows accurate course information
   - [ ] Grades are imported into local storage
   - [ ] QPI calculations are automatically updated
   - [ ] Letter grades are assigned correctly (B+ for 95, C+ for 88)

### Journey 2: Template Selection Flow
**Goal**: Verify user can select pre-configured course template

1. **Setup**: Ensure sample templates exist in Convex database
   ```typescript
   // Via Convex dashboard, create test template:
   // Name: "Computer Science - Year 1"
   // Semesters: 1st & 2nd semester with 5-6 courses each
   ```

2. **Test Steps**:
   ```bash
   # From main screen, click "Use Course Template"
   # Select "Computer Science - Year 1" template
   # Configure academic year as "2024-2025"
   # Set starting year level to 1
   # Click "Apply Template"
   # Verify semester tables are created
   # Enter sample grades (90, 85, 92, etc.)
   # Verify calculations update in real-time
   ```

3. **Acceptance Criteria**:
   - [ ] Templates load from Convex database
   - [ ] Template preview shows semester structure
   - [ ] Course information populates correctly
   - [ ] Empty grade tables are created
   - [ ] Real-time QPI calculation works
   - [ ] Semester and yearly QPIs calculate correctly

### Journey 3: Blank Start Configuration
**Goal**: Verify user can create custom academic structure from scratch

1. **Test Steps**:
   ```bash
   # From main screen, click "Start Blank"
   # Enter "4" for number of years
   # Enable "Include summer classes" option
   # Click "Create Academic Record"
   # Verify semester structure is created (8 regular + 4 summer semesters)
   # Add custom courses to first semester
   # Enter grades and verify calculations
   ```

2. **Acceptance Criteria**:
   - [ ] Configuration form validates input (1-6 years)
   - [ ] Correct number of semesters created
   - [ ] Summer semesters included when selected
   - [ ] Empty course addition works
   - [ ] Manual course entry functions correctly
   - [ ] QPI calculations work with custom structure

### Journey 4: Grade Entry and Calculation
**Goal**: Verify accurate QPI calculations across all levels

1. **Test Data Setup**:
   ```typescript
   const testGrades = [
     { course: "ENGS101", units: 3, grade: 95 },  // B+ = 3.5
     { course: "MATH101", units: 3, grade: 88 },  // C+ = 2.5
     { course: "PHYS101", units: 4, grade: 92 },  // B = 3.0
     { course: "CHEM101", units: 2, grade: 96 },  // B+ = 3.5
   ];
   // Expected QPI: (3*3.5 + 3*2.5 + 4*3.0 + 2*3.5) / 12 = 37/12 = 3.08
   ```

2. **Test Steps**:
   ```bash
   # Enter each test grade into grade table
   # Verify letter grade appears immediately
   # Verify quality points calculate correctly
   # Check semester QPI matches expected value (3.08)
   # Add second semester with different grades
   # Verify yearly QPI calculation
   # Verify cumulative QPI updates correctly
   ```

3. **Acceptance Criteria**:
   - [ ] Numerical grades convert to correct letter grades
   - [ ] Quality points calculate as units × grade point
   - [ ] Semester QPI = total quality points ÷ total units
   - [ ] Yearly QPI averages semester QPIs correctly
   - [ ] Cumulative QPI includes all semesters
   - [ ] Calculations update in real-time

### Journey 5: Data Export Flow  
**Goal**: Verify user can export complete academic record to CSV

1. **Test Steps**:
   ```bash
   # Create academic record with multiple semesters
   # Enter grades for at least 2 semesters
   # Click "Export Data" button
   # Verify CSV file downloads
   # Open CSV in Excel/Sheets
   # Verify all data is present and accurate
   ```

2. **Acceptance Criteria**:
   - [ ] Export button triggers file download
   - [ ] CSV contains all grade records
   - [ ] Calculated fields (letter grades, QPI) are included
   - [ ] File format is compatible with Excel
   - [ ] Exported data can be re-imported successfully

## Performance Testing

### Calculation Performance
```bash
# Test with large dataset
# Create academic record with 100+ courses across 4 years
# Enter grades and measure calculation time
# Expected: < 200ms for QPI recalculation
```

### Local Storage Performance  
```bash
# Test data persistence
# Create large academic record
# Refresh browser
# Verify data loads < 1 second
# Measure localStorage usage (should be < 5MB)
```

## Integration Testing

### Convex Integration
```bash
# Test course/template operations
npx convex run courses:create '{"courseCode":"TEST101","title":"Test Course","units":3}'
npx convex run courses:list '{}'
# Verify frontend displays new course
```

### Error Handling
```bash
# Test error scenarios:
# 1. Invalid CSV format
# 2. Network errors (disconnect internet)
# 3. Large file imports (> 10MB CSV)
# 4. Malformed data in localStorage
```

## Manual Testing Checklist

### UI/UX Validation
- [ ] Responsive design works on mobile/tablet
- [ ] Loading states show during async operations
- [ ] Error messages are clear and actionable
- [ ] Success notifications appear after operations
- [ ] Form validation prevents invalid submissions
- [ ] Keyboard navigation works throughout app
- [ ] Screen reader accessibility (basic)

### Data Integrity  
- [ ] Grade calculations match manual calculations
- [ ] QPI formulas follow academic standards
- [ ] Data persists across browser sessions
- [ ] Import/export maintains data fidelity
- [ ] Template applications don't duplicate data
- [ ] Deletion operations work correctly

### Edge Cases
- [ ] Empty academic record handles correctly
- [ ] Single semester with one course calculates QPI
- [ ] Summer-only semesters integrate into yearly QPI
- [ ] Grades of exactly 75, 78, 82 (boundary values)
- [ ] Zero-unit courses are handled appropriately
- [ ] Very long course titles display correctly

## Development Commands

```bash
# Development server
npm run dev

# Type checking
npm run build

# Run tests
npm test

# Run tests in watch mode  
npm run test:watch

# Lint and fix
npm run lint
npm run lint:fix

# Convex deployment
npx convex deploy
```

## Success Metrics

After completing this quickstart, you should be able to:

1. **Import/Export**: Successfully import a 50-course CSV and export it back
2. **Templates**: Apply a template with 30+ courses across 4 years
3. **Calculations**: Verify QPI calculations match manual calculations to 2 decimal places
4. **Performance**: Handle grade entry with sub-200ms calculation updates
5. **Persistence**: Maintain data across browser refresh and 1-week storage

## Troubleshooting

### Common Issues

**CSV Import Fails**:
```bash
# Check browser console for parsing errors
# Verify CSV format matches expected schema
# Try with smaller test file first
```

**QPI Calculations Wrong**:
```bash
# Verify grade scale mapping is correct
# Check for floating-point precision issues
# Manually calculate one semester to verify logic
```

**Data Not Persisting**:
```bash
# Check browser localStorage quota
# Verify localStorage is enabled
# Check for JavaScript errors in console
```

**Templates Not Loading**:
```bash
# Verify Convex connection
# Check network tab for API failures
# Confirm Convex deployment is active
```