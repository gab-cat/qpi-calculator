import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCourseStore } from '../../src/stores/course-store';
import type { Course } from '../../src/lib/types/academic-types';

// Mock Convex client
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

const mockCourses: Course[] = [
  {
    _id: 'course-1',
    courseCode: 'CS101',
    title: 'Introduction to Computer Science',
    units: 3,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    _id: 'course-2',
    courseCode: 'MATH101',
    title: 'Calculus I',
    units: 4,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

describe('Course Store', () => {
  beforeEach(() => {
    // Clear store state before each test
    useCourseStore.getState().reset();
    vi.clearAllMocks();
  });

  describe('Course Selection', () => {
    it('should initialize with empty selected courses', () => {
      const { selectedCourses } = useCourseStore.getState();
      expect(selectedCourses).toEqual([]);
    });

    it('should add course to selection', () => {
      const store = useCourseStore.getState();
      const courseId = 'course-1';

      store.selectCourse(courseId);
      const { selectedCourses } = useCourseStore.getState();

      expect(selectedCourses).toContain(courseId);
    });

    it('should remove course from selection', () => {
      const store = useCourseStore.getState();
      const courseId = 'course-1';

      // Add then remove
      store.selectCourse(courseId);
      store.deselectCourse(courseId);

      const { selectedCourses } = useCourseStore.getState();
      expect(selectedCourses).not.toContain(courseId);
    });

    it('should toggle course selection', () => {
      const store = useCourseStore.getState();
      const courseId = 'course-1';

      // First toggle - should add
      store.toggleCourse(courseId);
      expect(useCourseStore.getState().selectedCourses).toContain(courseId);

      // Second toggle - should remove
      store.toggleCourse(courseId);
      expect(useCourseStore.getState().selectedCourses).not.toContain(courseId);
    });

    it('should clear all selections', () => {
      const store = useCourseStore.getState();

      // Add multiple courses
      store.selectCourse('course-1');
      store.selectCourse('course-2');
      store.selectCourse('course-3');

      // Clear all
      store.clearSelection();

      const { selectedCourses } = useCourseStore.getState();
      expect(selectedCourses).toEqual([]);
    });

    it('should select multiple courses at once', () => {
      const store = useCourseStore.getState();
      const courseIds = ['course-1', 'course-2', 'course-3'];

      store.selectMultipleCourses(courseIds);

      const { selectedCourses } = useCourseStore.getState();
      expect(selectedCourses).toEqual(expect.arrayContaining(courseIds));
    });
  });

  describe('Course Filtering', () => {
    it('should set search filter', () => {
      const store = useCourseStore.getState();
      const searchTerm = 'Computer Science';

      store.setSearchFilter(searchTerm);

      const { filters } = useCourseStore.getState();
      expect(filters.search).toBe(searchTerm);
    });

    it('should set year level filter', () => {
      const store = useCourseStore.getState();
      const yearLevel = 2;

      store.setYearLevelFilter(yearLevel);

      const { filters } = useCourseStore.getState();
      expect(filters.yearLevel).toBe(yearLevel);
    });

    it('should set units filter', () => {
      const store = useCourseStore.getState();
      const unitsRange = { min: 2, max: 4 };

      store.setUnitsFilter(unitsRange);

      const { filters } = useCourseStore.getState();
      expect(filters.units).toEqual(unitsRange);
    });

    it('should clear all filters', () => {
      const store = useCourseStore.getState();

      // Set some filters
      store.setSearchFilter('CS');
      store.setYearLevelFilter(3);
      store.setUnitsFilter({ min: 2, max: 4 });

      // Clear filters
      store.clearFilters();

      const { filters } = useCourseStore.getState();
      expect(filters.search).toBe('');
      expect(filters.yearLevel).toBeNull();
      expect(filters.units).toBeNull();
    });
  });

  describe('Template Management', () => {
    it('should set selected template', () => {
      const store = useCourseStore.getState();
      const templateId = 'template-1';

      store.setSelectedTemplate(templateId);

      const { selectedTemplateId } = useCourseStore.getState();
      expect(selectedTemplateId).toBe(templateId);
    });

    it('should clear selected template', () => {
      const store = useCourseStore.getState();

      // Set then clear
      store.setSelectedTemplate('template-1');
      store.clearSelectedTemplate();

      const { selectedTemplateId } = useCourseStore.getState();
      expect(selectedTemplateId).toBeNull();
    });

    it('should set template application options', () => {
      const store = useCourseStore.getState();
      const options = {
        startYear: 1,
        includesSummer: true,
        academicYearStart: '2023-2024',
        mergeMode: 'replace' as const
      };

      store.setTemplateApplicationOptions(options);

      const { templateApplicationOptions } = useCourseStore.getState();
      expect(templateApplicationOptions).toEqual(options);
    });
  });

  describe('Course Data Management', () => {
    it('should set available courses', () => {
      const store = useCourseStore.getState();

      store.setAvailableCourses(mockCourses);

      const { availableCourses } = useCourseStore.getState();
      expect(availableCourses).toEqual(mockCourses);
    });

    it('should get filtered courses', () => {
      const store = useCourseStore.getState();

      // Set courses and filter
      store.setAvailableCourses(mockCourses);
      store.setSearchFilter('Computer');

      const filteredCourses = store.getFilteredCourses();
      expect(filteredCourses).toHaveLength(1);
      expect(filteredCourses[0].courseCode).toBe('CS101');
    });

    it('should get selected course details', () => {
      const store = useCourseStore.getState();

      // Set courses and select one
      store.setAvailableCourses(mockCourses);
      store.selectCourse('course-1');

      const selectedCourseDetails = store.getSelectedCourseDetails();
      expect(selectedCourseDetails).toHaveLength(1);
      expect(selectedCourseDetails[0].courseCode).toBe('CS101');
    });

    it('should calculate total selected units', () => {
      const store = useCourseStore.getState();

      // Set courses and select multiple
      store.setAvailableCourses(mockCourses);
      store.selectMultipleCourses(['course-1', 'course-2']);

      const totalUnits = store.getTotalSelectedUnits();
      expect(totalUnits).toBe(7); // 3 + 4
    });
  });

  describe('Loading States', () => {
    it('should manage loading state', () => {
      const store = useCourseStore.getState();

      store.setLoading(true);
      expect(useCourseStore.getState().isLoading).toBe(true);

      store.setLoading(false);
      expect(useCourseStore.getState().isLoading).toBe(false);
    });

    it('should manage error state', () => {
      const store = useCourseStore.getState();
      const errorMessage = 'Failed to load courses';

      store.setError(errorMessage);
      expect(useCourseStore.getState().error).toBe(errorMessage);

      store.clearError();
      expect(useCourseStore.getState().error).toBeNull();
    });
  });

  describe('Course Creation', () => {
    it('should handle course creation result', () => {
      const store = useCourseStore.getState();
      const newCourse: Course = {
        _id: 'course-3',
        courseCode: 'PHYS101',
        title: 'Physics I',
        units: 3,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      store.setAvailableCourses(mockCourses);
      store.addCreatedCourse(newCourse);

      const { availableCourses } = useCourseStore.getState();
      expect(availableCourses).toHaveLength(3);
      expect(availableCourses.find((c: Course) => c._id === 'course-3')).toBeDefined();
    });
  });
});