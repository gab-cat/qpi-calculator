# Convex Database Contracts

## Course Operations

### query: courses.list()
Lists all available courses with pagination support.

**Request**: 
```typescript
{
  limit?: number;     // Default: 50, Max: 100
  cursor?: string;    // For pagination
  search?: string;    // Filter by course code or title
}
```

**Response**:
```typescript
{
  courses: Array<{
    _id: Id<"courses">;
    courseCode: string;
    title: string;
    units: number;
    createdAt: number;
    updatedAt: number;
  }>;
  nextCursor?: string;  // For pagination
  hasMore: boolean;
}
```

### mutation: courses.create()
Creates a new course entry.

**Request**:
```typescript
{
  courseCode: string;   // Required, unique, 3-20 chars
  title: string;        // Required, 1-200 chars
  units: number;        // Required, 0.5-6.0
}
```

**Response**:
```typescript
{
  _id: Id<"courses">;
  courseCode: string;
  title: string;
  units: number;
  createdAt: number;
  updatedAt: number;
}
```

**Errors**:
- `DUPLICATE_COURSE_CODE`: Course code already exists
- `INVALID_COURSE_CODE`: Course code format invalid
- `INVALID_UNITS`: Units out of valid range

### mutation: courses.update()
Updates an existing course.

**Request**:
```typescript
{
  id: Id<"courses">;
  courseCode?: string;  // Optional update
  title?: string;       // Optional update
  units?: number;       // Optional update
}
```

**Response**: Updated course object

**Errors**:
- `COURSE_NOT_FOUND`: Course ID doesn't exist
- `DUPLICATE_COURSE_CODE`: New course code conflicts with existing
- `COURSE_IN_USE`: Course is referenced by templates (if deletion attempted)

### mutation: courses.delete()
Deletes a course (only if not referenced by templates).

**Request**:
```typescript
{
  id: Id<"courses">;
}
```

**Response**: 
```typescript
{
  deleted: true;
  id: Id<"courses">;
}
```

**Errors**:
- `COURSE_NOT_FOUND`: Course doesn't exist
- `COURSE_IN_USE`: Course is referenced by templates

## Template Operations

### query: templates.list()
Lists all course templates with pagination.

**Request**:
```typescript
{
  limit?: number;     // Default: 20, Max: 50
  cursor?: string;    // For pagination
  search?: string;    // Filter by template name
}
```

**Response**:
```typescript
{
  templates: Array<{
    _id: Id<"templates">;
    name: string;
    description?: string;
    semesterCount: number;    // Calculated field
    totalCourses: number;     // Calculated field
    createdAt: number;
    updatedAt: number;
  }>;
  nextCursor?: string;
  hasMore: boolean;
}
```

### query: templates.getById()
Gets a complete template with all semester and course details.

**Request**:
```typescript
{
  id: Id<"templates">;
}
```

**Response**:
```typescript
{
  _id: Id<"templates">;
  name: string;
  description?: string;
  semesters: Array<{
    yearLevel: number;
    semesterType: "first" | "second" | "summer";
    courses: Array<{
      _id: Id<"courses">;
      courseCode: string;
      title: string;
      units: number;
    }>;
  }>;
  createdAt: number;
  updatedAt: number;
}
```

**Errors**:
- `TEMPLATE_NOT_FOUND`: Template ID doesn't exist

### mutation: templates.create()
Creates a new course template.

**Request**:
```typescript
{
  name: string;           // Required, unique, 1-100 chars
  description?: string;   // Optional, max 500 chars
  semesters: Array<{
    yearLevel: number;    // 1-6
    semesterType: "first" | "second" | "summer";
    courses: Array<Id<"courses">>; // Course references
  }>;
}
```

**Response**: Complete template object with populated course details

**Errors**:
- `DUPLICATE_TEMPLATE_NAME`: Template name already exists
- `INVALID_SEMESTER_STRUCTURE`: Invalid year/semester combination
- `COURSE_NOT_FOUND`: Referenced course doesn't exist
- `EMPTY_TEMPLATE`: Template must have at least one semester with one course

### mutation: templates.update()
Updates an existing template.

**Request**:
```typescript
{
  id: Id<"templates">;
  name?: string;
  description?: string;
  semesters?: Array<{
    yearLevel: number;
    semesterType: "first" | "second" | "summer";
    courses: Array<Id<"courses">>;
  }>;
}
```

**Response**: Updated template object

**Errors**:
- `TEMPLATE_NOT_FOUND`: Template doesn't exist
- `DUPLICATE_TEMPLATE_NAME`: New name conflicts with existing
- `INVALID_SEMESTER_STRUCTURE`: Invalid updates to semester structure

### mutation: templates.delete()
Deletes a template.

**Request**:
```typescript
{
  id: Id<"templates">;
}
```

**Response**:
```typescript
{
  deleted: true;
  id: Id<"templates">;
}
```

**Errors**:
- `TEMPLATE_NOT_FOUND`: Template doesn't exist