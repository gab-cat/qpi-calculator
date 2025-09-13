# Component Interface Contracts

## Core Calculator Components

### GradeTable Component
Main component for displaying and editing semester grades.

**Props Interface**:
```typescript
interface GradeTableProps {
  semesterId: string;
  semester: SemesterRecord;
  grades: GradeRecord[];
  onGradeUpdate: (gradeId: string, updates: Partial<GradeRecord>) => void;
  onGradeDelete: (gradeId: string) => void;
  onAddCourse: (courseInfo: { courseId: string; courseCode: string; title: string; units: number }) => void;
  readOnly?: boolean;
  showCalculations?: boolean;
}
```

**Component State**:
```typescript
interface GradeTableState {
  editingGradeId: string | null;
  tempGradeValue: string;
  validationErrors: Record<string, string>;
  isCalculating: boolean;
}
```

### CourseSelector Component
Component for selecting courses from available options or templates.

**Props Interface**:
```typescript
interface CourseSelectorProps {
  selectedCourses: string[];              // Currently selected course IDs
  availableCourses: Course[];             // All available courses
  onCourseSelect: (courseIds: string[]) => void;
  onCourseCreate: (course: CreateCourseRequest) => Promise<Course>;
  maxSelections?: number;                 // Limit number of selections
  showUnitsTotal?: boolean;               // Display total units selected
  filterByLevel?: number;                 // Filter courses by year level
}
```

### TemplateSelector Component
Component for selecting and applying course templates.

**Props Interface**:
```typescript
interface TemplateSelectorProps {
  selectedTemplateId: string | null;
  templates: Template[];
  onTemplateSelect: (templateId: string) => void;
  onTemplateApply: (templateId: string, options: TemplateApplicationOptions) => void;
  onTemplatePreview: (templateId: string) => void;
  showPreview?: boolean;
}
```

**Template Application Options**:
```typescript
interface TemplateApplicationOptions {
  startYear: number;                      // Starting year level
  includesSummer: boolean;                // Include summer semesters
  academicYearStart: string;              // e.g., "2023-2024"
  mergeMode: 'replace' | 'append';        // How to handle existing data
}
```

## Input/Output Components

### CSVImporter Component
Component for importing grade data from CSV files.

**Props Interface**:
```typescript
interface CSVImporterProps {
  onImportStart: () => void;
  onImportSuccess: (data: ImportResult) => void;
  onImportError: (errors: ImportError[]) => void;
  onImportCancel: () => void;
  acceptedFormats: string[];              // File type restrictions
  maxFileSize: number;                    // Size limit in bytes
  showPreview: boolean;                   // Show preview before import
}
```

**Import Result Interface**:
```typescript
interface ImportResult {
  totalRecords: number;
  importedRecords: number;
  skippedRecords: number;
  errors: ImportError[];
  preview: ImportPreviewItem[];
}
```

### CSVExporter Component  
Component for exporting grade data to CSV format.

**Props Interface**:
```typescript
interface CSVExporterProps {
  academicRecord: AcademicRecord;
  semesters: SemesterRecord[];
  grades: GradeRecord[];
  onExportStart: () => void;
  onExportComplete: (result: ExportResult) => void;
  onExportError: (error: string) => void;
  exportOptions: ExportOptions;
}
```

**Export Options Interface**:
```typescript
interface ExportOptions {
  includeCalculations: boolean;           // Include QPI calculations
  includeNotes: boolean;                  // Include student notes
  dateFormat: 'iso' | 'readable';         // Date formatting preference
  filename?: string;                      // Custom filename
  includeSummary: boolean;                // Include summary statistics
}
```

## Calculation Display Components

### QPISummary Component
Displays QPI calculations and summaries.

**Props Interface**:
```typescript
interface QPISummaryProps {
  academicRecord: AcademicRecord;
  selectedYears?: string[];               // Filter by academic years
  showBreakdown: boolean;                 // Show detailed calculations
  comparisonMode?: 'none' | 'yearly' | 'semester';
  onDrillDown?: (year: string, semester: string) => void;
}
```

### CalculationDetails Component
Shows detailed QPI calculation breakdowns.

**Props Interface**:
```typescript
interface CalculationDetailsProps {
  calculation: QPICalculation;
  level: 'subject' | 'semester' | 'yearly' | 'cumulative';
  showFormulas: boolean;
  interactive?: boolean;                  // Allow recalculation
}
```

**QPI Calculation Interface**:
```typescript
interface QPICalculation {
  level: string;
  totalUnits: number;
  totalQualityPoints: number;
  qpi: number;
  components: Array<{
    name: string;
    units: number;
    gradePoints: number;
    qualityPoints: number;
  }>;
  formula: string;
  timestamp: number;
}
```

## Form Components

### ConfigurationForm Component
Initial setup form for blank academic record creation.

**Props Interface**:
```typescript
interface ConfigurationFormProps {
  onSubmit: (config: AcademicConfiguration) => void;
  onCancel: () => void;
  initialValues?: Partial<AcademicConfiguration>;
  showAdvanced?: boolean;
}
```

**Academic Configuration Interface**:
```typescript
interface AcademicConfiguration {
  totalYears: number;                     // 1-6 years
  includesSummer: boolean;                // Summer classes
  startingAcademicYear: string;           // e.g., "2023-2024"
  programName?: string;                   // Optional program identifier
  customSemesters?: CustomSemester[];     // Non-standard semester structure
}
```

### CourseForm Component  
Form for creating/editing individual courses.

**Props Interface**:
```typescript
interface CourseFormProps {
  course?: Course;                        // For editing existing course
  onSubmit: (course: CreateCourseRequest) => Promise<void>;
  onCancel: () => void;
  onDelete?: (courseId: string) => Promise<void>;
  validation: ValidationRules;
  isSubmitting: boolean;
}
```

## Navigation and Layout Components

### NavigationTabs Component
Main navigation between different sections of the application.

**Props Interface**:
```typescript
interface NavigationTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: NavigationTab[];
  showBadges?: boolean;                   // Show notification badges
}
```

**Navigation Tab Interface**:
```typescript
interface NavigationTab {
  id: string;
  label: string;
  icon: React.ComponentType;
  badge?: number;                         // Notification count
  disabled?: boolean;
  tooltip?: string;
}
```

### ProgressIndicator Component
Shows completion progress for academic records.

**Props Interface**:
```typescript
interface ProgressIndicatorProps {
  academicRecord: AcademicRecord;
  semesters: SemesterRecord[];
  showDetails: boolean;
  onSemesterClick?: (semesterId: string) => void;
}
```

## Common Interface Patterns

### Async State Pattern
```typescript
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}
```

### Validation Result Pattern
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}
```

### Component Event Handlers
```typescript
interface StandardEventHandlers {
  onSave: () => Promise<void>;
  onCancel: () => void;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}
```