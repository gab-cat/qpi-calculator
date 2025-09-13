import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Course } from '../lib/types/academic-types';

interface CourseFilters {
  search: string;
  yearLevel: number | null;
  units: { min: number; max: number } | null;
}

interface TemplateApplicationOptions {
  startYear: number;
  includesSummer: boolean;
  academicYearStart: string;
  mergeMode: 'replace' | 'append';
}

interface CourseStoreState {
  // Course selection state
  selectedCourses: string[];
  availableCourses: Course[];
  
  // Filtering state
  filters: CourseFilters;
  
  // Template state
  selectedTemplateId: string | null;
  templateApplicationOptions: TemplateApplicationOptions;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions - Course Selection
  selectCourse: (courseId: string) => void;
  deselectCourse: (courseId: string) => void;
  toggleCourse: (courseId: string) => void;
  clearSelection: () => void;
  selectMultipleCourses: (courseIds: string[]) => void;
  
  // Actions - Course Data
  setAvailableCourses: (courses: Course[]) => void;
  addCreatedCourse: (course: Course) => void;
  
  // Actions - Filtering
  setSearchFilter: (search: string) => void;
  setYearLevelFilter: (yearLevel: number | null) => void;
  setUnitsFilter: (units: { min: number; max: number } | null) => void;
  clearFilters: () => void;
  
  // Actions - Template Management
  setSelectedTemplate: (templateId: string | null) => void;
  clearSelectedTemplate: () => void;
  setTemplateApplicationOptions: (options: TemplateApplicationOptions) => void;
  
  // Actions - State Management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
  
  // Selectors
  getFilteredCourses: () => Course[];
  getSelectedCourseDetails: () => Course[];
  getTotalSelectedUnits: () => number;
  isCourseSelected: (courseId: string) => boolean;
}

const initialFilters: CourseFilters = {
  search: '',
  yearLevel: null,
  units: null,
};

const initialTemplateOptions: TemplateApplicationOptions = {
  startYear: 1,
  includesSummer: false,
  academicYearStart: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
  mergeMode: 'replace',
};

export const useCourseStore = create<CourseStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        selectedCourses: [],
        availableCourses: [],
        filters: initialFilters,
        selectedTemplateId: null,
        templateApplicationOptions: initialTemplateOptions,
        isLoading: false,
        error: null,
        
        // Course Selection Actions
        selectCourse: (courseId) => {
          set((state) => {
            if (state.selectedCourses.includes(courseId)) {
              return state; // Already selected
            }
            
            return {
              selectedCourses: [...state.selectedCourses, courseId],
            };
          });
        },
        
        deselectCourse: (courseId) => {
          set((state) => ({
            selectedCourses: state.selectedCourses.filter(id => id !== courseId),
          }));
        },
        
        toggleCourse: (courseId) => {
          const state = get();
          if (state.selectedCourses.includes(courseId)) {
            state.deselectCourse(courseId);
          } else {
            state.selectCourse(courseId);
          }
        },
        
        clearSelection: () => {
          set({ selectedCourses: [] });
        },
        
        selectMultipleCourses: (courseIds) => {
          set((state) => {
            const newSelections = courseIds.filter(id => !state.selectedCourses.includes(id));
            return {
              selectedCourses: [...state.selectedCourses, ...newSelections],
            };
          });
        },
        
        // Course Data Actions
        setAvailableCourses: (courses) => {
          set({ availableCourses: courses });
        },
        
        addCreatedCourse: (course) => {
          set((state) => ({
            availableCourses: [...state.availableCourses, course],
          }));
        },
        
        // Filtering Actions
        setSearchFilter: (search) => {
          set((state) => ({
            filters: { ...state.filters, search },
          }));
        },
        
        setYearLevelFilter: (yearLevel) => {
          set((state) => ({
            filters: { ...state.filters, yearLevel },
          }));
        },
        
        setUnitsFilter: (units) => {
          set((state) => ({
            filters: { ...state.filters, units },
          }));
        },
        
        clearFilters: () => {
          set({ filters: initialFilters });
        },
        
        // Template Management Actions
        setSelectedTemplate: (templateId) => {
          set({ selectedTemplateId: templateId });
        },
        
        clearSelectedTemplate: () => {
          set({ selectedTemplateId: null });
        },
        
        setTemplateApplicationOptions: (options) => {
          set({ templateApplicationOptions: options });
        },
        
        // State Management Actions
        setLoading: (loading) => {
          set({ isLoading: loading });
        },
        
        setError: (error) => {
          set({ error });
        },
        
        clearError: () => {
          set({ error: null });
        },
        
        reset: () => {
          set({
            selectedCourses: [],
            availableCourses: [],
            filters: initialFilters,
            selectedTemplateId: null,
            templateApplicationOptions: initialTemplateOptions,
            isLoading: false,
            error: null,
          });
        },
        
        // Selectors
        getFilteredCourses: () => {
          const state = get();
          let filtered = [...state.availableCourses];
          
          // Apply search filter
          if (state.filters.search.trim()) {
            const searchLower = state.filters.search.toLowerCase();
            filtered = filtered.filter(course => 
              course.courseCode.toLowerCase().includes(searchLower) ||
              course.title.toLowerCase().includes(searchLower)
            );
          }
          
          // Apply year level filter (if courses have yearLevel property)
          if (state.filters.yearLevel !== null) {
            // This assumes courses have a yearLevel property or we derive it from courseCode
            filtered = filtered.filter(course => {
              // Extract year level from course code (assuming format like "CS101" = 1st year)
              const match = course.courseCode.match(/(\d)00/);
              if (match) {
                const courseYear = parseInt(match[1]);
                return courseYear === state.filters.yearLevel;
              }
              return true; // Include if we can't determine year level
            });
          }
          
          // Apply units filter
          if (state.filters.units) {
            filtered = filtered.filter(course => 
              course.units >= state.filters.units!.min && 
              course.units <= state.filters.units!.max
            );
          }
          
          return filtered;
        },
        
        getSelectedCourseDetails: () => {
          const state = get();
          return state.availableCourses.filter(course => 
            state.selectedCourses.includes(course._id)
          );
        },
        
        getTotalSelectedUnits: () => {
          const state = get();
          const selectedCourses = state.availableCourses.filter(course => 
            state.selectedCourses.includes(course._id)
          );
          
          return selectedCourses.reduce((total, course) => total + course.units, 0);
        },
        
        isCourseSelected: (courseId: string) => {
          return get().selectedCourses.includes(courseId);
        },
      }),
      {
        name: 'qpi-course-store',
        partialize: (state) => ({
          // Only persist selection and preferences
          selectedCourses: state.selectedCourses,
          filters: state.filters,
          selectedTemplateId: state.selectedTemplateId,
          templateApplicationOptions: state.templateApplicationOptions,
        }),
      }
    ),
    { name: 'CourseStore' }
  )
);