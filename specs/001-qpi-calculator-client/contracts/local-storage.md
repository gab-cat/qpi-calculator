# Local Storage Contracts

## Storage Key Structure
```typescript
const STORAGE_KEYS = {
  ACADEMIC_RECORD: 'qpi_academic_record',
  SEMESTERS: 'qpi_semesters',
  GRADES: 'qpi_grades',
  SETTINGS: 'qpi_settings',
  VERSION: 'qpi_data_version'
} as const;
```

## Academic Record Operations

### localStorage.getAcademicRecord()
Retrieves the main academic record from local storage.

**Storage Key**: `qpi_academic_record`

**Response**:
```typescript
{
  id: string;
  semesters: string[];           // Array of semester IDs
  totalUnits: number;
  totalQualityPoints: number;
  cumulativeQPI: number;
  yearlyQPIs: Array<{
    academicYear: string;
    firstSemQPI?: number;
    secondSemQPI?: number;
    summerQPI?: number;
    yearlyQPI: number;
  }>;
  configuration: {
    totalYears: number;
    includesSummer: boolean;
  };
  lastCalculated: number;
  version: number;
  createdAt: number;
  updatedAt: number;
} | null
```

### localStorage.setAcademicRecord()
Saves the academic record to local storage.

**Request**: Complete AcademicRecord object

**Side Effects**: 
- Updates `lastCalculated` timestamp
- Increments `updatedAt` timestamp
- Triggers recalculation of dependent data

## Semester Operations

### localStorage.getSemester()
Retrieves a specific semester record.

**Request**: 
```typescript
{
  semesterId: string;
}
```

**Storage Key**: `qpi_semesters`

**Response**:
```typescript
{
  id: string;
  yearLevel: number;
  semesterType: 'first' | 'second' | 'summer';
  academicYear: string;
  grades: string[];              // Grade record IDs
  totalUnits: number;
  totalQualityPoints: number;
  semesterQPI: number;
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
} | null
```

### localStorage.setSemester()
Saves semester data to local storage.

**Request**: Complete SemesterRecord object

**Side Effects**:
- Updates parent academic record's semester list
- Triggers QPI recalculation if grades changed
- Updates academic record timestamps

### localStorage.getAllSemesters()
Retrieves all semester records.

**Response**: Array of SemesterRecord objects

## Grade Operations

### localStorage.getGrade()
Retrieves a specific grade record.

**Request**:
```typescript
{
  gradeId: string;
}
```

**Storage Key**: `qpi_grades`

**Response**:
```typescript
{
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  units: number;
  numericalGrade?: number;
  letterGrade?: string;
  gradePoint?: number;
  qualityPoints?: number;
  semesterId: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
} | null
```

### localStorage.setGrade()
Saves grade data and triggers calculations.

**Request**: Complete GradeRecord object

**Side Effects**:
- Automatically calculates letterGrade from numericalGrade
- Automatically calculates gradePoint from letterGrade
- Automatically calculates qualityPoints (units × gradePoint)
- Updates parent semester totals
- Triggers academic record QPI recalculation
- Updates all relevant timestamps

### localStorage.getGradesBySemester()
Retrieves all grades for a specific semester.

**Request**:
```typescript
{
  semesterId: string;
}
```

**Response**: Array of GradeRecord objects

## Data Import/Export Operations

### localStorage.exportToCSV()
Generates CSV data from all stored academic records.

**Response**:
```typescript
{
  csvData: string;              // CSV formatted data
  filename: string;             // Suggested filename
  recordCount: number;          // Number of grade records
  generatedAt: number;          // Timestamp
}
```

**CSV Format**:
```csv
Academic Year,Year Level,Semester Type,Course Code,Course Title,Units,Numerical Grade,Letter Grade,Grade Point,Quality Points,Notes
2023-2024,1,first,ENGS101,English Communication,3,95,B+,3.5,10.5,
2023-2024,1,first,MATH101,Calculus I,3,88,C+,2.5,7.5,Challenging but manageable
```

### localStorage.importFromCSV()
Imports CSV data and merges with existing records.

**Request**:
```typescript
{
  csvData: string;
  importMode: 'merge' | 'replace' | 'append';
  validateOnly?: boolean;       // For preview mode
}
```

**Response**:
```typescript
{
  success: boolean;
  importedRecords: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  preview?: Array<{           // If validateOnly: true
    courseCode: string;
    courseTitle: string;
    units: number;
    numericalGrade: number;
    action: 'create' | 'update' | 'skip';
  }>;
}
```

**Validation Rules**:
- Required fields: Academic Year, Year Level, Semester Type, Course Code, Course Title, Units
- Numerical Grade: 0-100 (optional)
- Units: 0.5-6.0
- Semester Type: must be 'first', 'second', or 'summer'
- Year Level: 1-6

## Settings Operations

### localStorage.getSettings()
Retrieves user preferences and application settings.

**Storage Key**: `qpi_settings`

**Response**:
```typescript
{
  theme: 'light' | 'dark' | 'system';
  defaultUnits: number;           // Default units for new courses
  autoCalculate: boolean;         // Auto-recalculate on grade entry
  exportFormat: 'csv' | 'json';   // Preferred export format
  showCalculationDetails: boolean; // Show QPI calculation breakdown
  confirmBeforeDelete: boolean;    // Confirm deletions
} | null
```

### localStorage.setSettings()
Saves user preferences.

**Request**: Complete settings object

## Data Migration Operations

### localStorage.migrateData()
Handles data schema migrations between versions.

**Request**:
```typescript
{
  fromVersion: number;
  toVersion: number;
}
```

**Response**:
```typescript
{
  migrated: boolean;
  fromVersion: number;
  toVersion: number;
  migratedRecords: number;
  errors: string[];
}
```

### localStorage.clearAllData()
Completely clears all QPI calculator data from localStorage.

**Response**:
```typescript
{
  cleared: boolean;
  keysRemoved: string[];
}
```

**Side Effects**:
- Removes all QPI-related localStorage keys
- Resets application to initial state
- Cannot be undone