# Feature Specification: QPI Calculator Client-Side Application

**Feature Branch**: `001-qpi-calculator-client`  
**Created**: 12 September 2025  
**Status**: Draft  
**Input**: User description: "QPI calculator client side app with CSV import/export, course templates, and automatic GPA calculations"

## Execution Flow (main)
```
1. Parse user description from Input
   → Feature extracted: QPI Calculator with multiple input methods and calculations
2. Extract key concepts from description
   → Actors: Students, Academic advisors
   → Actions: Import/export data, select templates, enter grades, calculate QPI
   → Data: Grades, subjects, units, academic years, semesters
   → Constraints: Philippine academic year structure (2 semesters + optional summer)
3. For each unclear aspect:
   → All major aspects are clearly defined in user requirements
4. Fill User Scenarios & Testing section
   → Clear user flows for each input method identified
5. Generate Functional Requirements
   → All requirements are testable and measurable
6. Identify Key Entities
   → Subjects, Grades, Semesters, Academic Years identified
7. Run Review Checklist
   → No implementation details included
   → Focus maintained on user needs and business logic
8. Return: SUCCESS (spec ready for planning)
```

---

## User Scenarios & Testing

### Primary User Story
As a student, I want to calculate my Quality Point Index (QPI) for academic tracking by either importing my existing grade data, using pre-configured course templates, or starting with a blank calculator, so that I can monitor my academic performance across semesters and years.

### Acceptance Scenarios
1. **Given** I am on the main screen, **When** I choose to load a CSV file with my grades, **Then** the system imports my data and displays grade tables with calculated QPIs
2. **Given** I am on the main screen, **When** I select a course template, **Then** the system presents pre-populated subjects with codes, titles, and units for that specific course
3. **Given** I am on the main screen, **When** I choose to start blank, **Then** the system asks for number of years and summer class preference, then displays empty grade tables
4. **Given** I have grade tables displayed, **When** I enter numerical grades for subjects, **Then** the system automatically calculates letter grades, subject QPI, semestral QPI, yearly QPI, and cumulative QPI
5. **Given** I have completed entering my grades, **When** I export my data, **Then** the system generates a CSV file with all my grade information for future import

### Edge Cases
- What happens when a user enters an invalid numerical grade (negative numbers, above 100)?
- How does the system handle missing grades in QPI calculations?
- What occurs when importing a CSV with incorrect format or missing required fields?
- How does the system behave when a student doesn't take summer classes?

## Requirements

### Functional Requirements
- **FR-001**: System MUST provide three input options on the main screen: CSV file import, course template selection, and blank start
- **FR-002**: System MUST import grade data from CSV files and populate grade tables automatically
- **FR-003**: System MUST export all grade data to CSV format for seamless import/export functionality
- **FR-004**: System MUST provide pre-configured course templates with subjects, codes, titles, and units already populated
- **FR-005**: System MUST allow blank start configuration by asking for number of academic years and summer class preference
- **FR-006**: System MUST structure academic years with mandatory 1st and 2nd semesters plus optional summer class/intersession
- **FR-007**: System MUST display grade tables organized by semester and intersession periods
- **FR-008**: System MUST automatically convert numerical grades to letter grades using the specified scale:
  - 98-100 = A = 4.0
  - 94-97 = B+ = 3.5  
  - 90-93 = B = 3.0
  - 86-89 = C+ = 2.5
  - 82-85 = C = 2.0
  - 78-81 = D+ = 1.5
  - 75-77 = D = 1.0
  - Below 75 = F = 0
- **FR-009**: System MUST calculate Quality Points per subject using formula: QPI(subject) = Units × Grade Point
- **FR-010**: System MUST calculate Semester QPI using formula: Total Quality Points ÷ Total Units for each semester
- **FR-011**: System MUST calculate Yearly QPI using formula: (QPI_Sem1 + QPI_Sem2) ÷ 2 for academic years with two semesters
- **FR-012**: System MUST calculate General (Cumulative) QPI using formula: Total Quality Points (all semesters) ÷ Total Units (all semesters)
- **FR-013**: System MUST update all QPI calculations in real-time when users enter or modify grades
- **FR-014**: System MUST validate numerical grade inputs to ensure they are within acceptable ranges
- **FR-015**: System MUST handle summer class QPI calculations and integrate them appropriately into yearly calculations

### Key Entities
- **Subject**: Represents individual academic subjects with attributes including subject code, title, units, numerical grade, letter grade, and quality points
- **Semester**: Represents academic periods (1st semester, 2nd semester, summer/intersession) containing multiple subjects and calculated semester QPI
- **Academic Year**: Represents yearly academic periods containing semesters with calculated yearly QPI
- **Course Template**: Represents predefined course structures with pre-populated subjects, codes, titles, and units for specific academic programs
- **Grade Data**: Represents the complete academic record including all subjects across all years with cumulative QPI calculations

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
