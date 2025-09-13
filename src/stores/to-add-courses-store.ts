import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Course {
  _id: string;
  courseCode: string;
  title: string;
  units: number;
  createdAt: number;
  updatedAt: number;
}

interface ToAddCoursesStoreState {
  // Courses selected to be added
  coursesToAdd: Course[];
  
  // Actions
  addCourse: (course: Course) => void;
  removeCourse: (courseId: string) => void;
  toggleCourse: (course: Course) => void;
  clearAllCourses: () => void;
  setCourses: (courses: Course[]) => void;
  
  // Selectors
  isCourseSelected: (courseId: string) => boolean;
  getTotalUnits: () => number;
  getCourseCount: () => number;
}

export const useToAddCoursesStore = create<ToAddCoursesStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        coursesToAdd: [],
        
        // Actions
        addCourse: (course) => {
          set((state) => {
            // Check if course is already selected
            const isAlreadySelected = state.coursesToAdd.some(c => c._id === course._id);
            if (isAlreadySelected) {
              return state; // Already selected, no change
            }
            
            return {
              coursesToAdd: [...state.coursesToAdd, course],
            };
          });
        },
        
        removeCourse: (courseId) => {
          set((state) => ({
            coursesToAdd: state.coursesToAdd.filter(course => course._id !== courseId),
          }));
        },
        
        toggleCourse: (course) => {
          const state = get();
          if (state.isCourseSelected(course._id)) {
            state.removeCourse(course._id);
          } else {
            state.addCourse(course);
          }
        },
        
        clearAllCourses: () => {
          set({ coursesToAdd: [] });
        },
        
        setCourses: (courses) => {
          set({ coursesToAdd: courses });
        },
        
        // Selectors
        isCourseSelected: (courseId) => {
          return get().coursesToAdd.some(course => course._id === courseId);
        },
        
        getTotalUnits: () => {
          return get().coursesToAdd.reduce((total, course) => total + course.units, 0);
        },
        
        getCourseCount: () => {
          return get().coursesToAdd.length;
        },
      }),
      {
        name: 'qpi-to-add-courses-store',
        partialize: (state) => ({
          // Persist the courses to add
          coursesToAdd: state.coursesToAdd,
        }),
      }
    ),
    { name: 'ToAddCoursesStore' }
  )
);
