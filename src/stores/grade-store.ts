import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { GradeRecord, SemesterRecord, AcademicRecord } from '../lib/types/academic-types';
import {
  loadGradeRecords,
  loadSemesterRecords,
  loadAcademicRecord,
  saveAcademicRecord,
  academicStorage
} from '../lib/local-storage/academic-storage';
import {
  convertNumericalToLetter,
  convertNumericalToGradePoint
} from '../lib/calculations/grade-scale';
import {
  calculateQualityPoints,
  calculateSemesterTotals,
  calculateCumulativeQPI
} from '../lib/calculations/qpi-calculator';

// Convex integration will be handled through hooks

interface GradeStoreState {
  // Data
  grades: GradeRecord[];
  semesters: SemesterRecord[];
  academicRecord: AcademicRecord | null;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  lastSaved: number | null;
  
  // Actions - Grade Management
  addGrade: (grade: Omit<GradeRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addGrades: (grades: Omit<GradeRecord, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  updateGrade: (gradeId: string, updates: Partial<GradeRecord>) => void;
  removeGrade: (gradeId: string) => void;
  
  // Actions - Semester Management
  addSemester: (semester: Omit<SemesterRecord, 'id' | 'createdAt' | 'updatedAt' | 'grades'>) => string;
  updateSemester: (semesterId: string, updates: Partial<SemesterRecord>) => void;
  removeSemester: (semesterId: string) => void;
  
  // Actions - Academic Record Management
  initializeAcademicRecord: (config: AcademicRecord['configuration']) => void;
  updateAcademicRecord: (updates: Partial<AcademicRecord>) => void;

  // Actions - Template Management
  loadTemplateCourses: (templateData: {
    _id: string;
    name: string;
    semesters: Array<{
      yearLevel: number;
      semesterType: 'first' | 'second' | 'summer';
      courses: Array<{
        _id: string;
        courseCode: string;
        title: string;
        units: number;
      }>;
    }>;
  }) => Promise<void>;

  // Actions - Data Operations
  loadData: () => Promise<void>;
  saveData: () => Promise<void>;
  resetAll: () => void;
  recalculateAll: () => void;
  
  // Selectors
  getGradesBySemester: (semesterId: string) => GradeRecord[];
  getSemesterQPI: (semesterId: string) => { qpi: number; totalUnits: number; totalQualityPoints: number } | null;
  getYearlyQPI: (academicYear: string) => { qpi: number; semesters: string[] } | null;
  getCumulativeQPI: () => { qpi: number; totalUnits: number; totalQualityPoints: number } | null;
}

export const useGradeStore = create<GradeStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        grades: [],
        semesters: [],
        academicRecord: null,
        isLoading: false,
        error: null,
        lastSaved: null,
        
        // Grade Management
        addGrade: (gradeData) => {
          const now = Date.now();
          const id = `grade-${now}-${Math.random().toString(36).substr(2, 9)}`;

          // Calculate grade properties
          let letterGrade: string | undefined;
          let gradePoint: number | undefined;
          let qualityPoints: number | undefined;

          if (gradeData.numericalGrade !== undefined) {
            letterGrade = convertNumericalToLetter(gradeData.numericalGrade);
            gradePoint = convertNumericalToGradePoint(gradeData.numericalGrade);
            qualityPoints = calculateQualityPoints(gradeData.units, gradePoint);
          }

          const newGrade: GradeRecord = {
            ...gradeData,
            id,
            letterGrade,
            gradePoint,
            qualityPoints,
            createdAt: now,
            updatedAt: now,
          };

          set((state) => {
            const updatedGrades = [...state.grades, newGrade];

            // Update semester's grades array
            const updatedSemesters = state.semesters.map(semester =>
              semester.id === gradeData.semesterId
                ? {
                    ...semester,
                    grades: [...semester.grades, id],
                    updatedAt: now
                  }
                : semester
            );

            return {
              grades: updatedGrades,
              semesters: updatedSemesters,
            };
          });

          // Recalculate after state update
          get().recalculateAll();
          get().saveData();
        },

        addGrades: (gradesData) => {
          const now = Date.now();
          const newGrades: GradeRecord[] = [];
          const semesterUpdates: Record<string, string[]> = {};

          // Process each grade
          gradesData.forEach((gradeData) => {
            const id = `grade-${now}-${Math.random().toString(36).substr(2, 9)}`;

            // Calculate grade properties
            let letterGrade: string | undefined;
            let gradePoint: number | undefined;
            let qualityPoints: number | undefined;

            if (gradeData.numericalGrade !== undefined) {
              letterGrade = convertNumericalToLetter(gradeData.numericalGrade);
              gradePoint = convertNumericalToGradePoint(gradeData.numericalGrade);
              qualityPoints = calculateQualityPoints(gradeData.units, gradePoint);
            }

            const newGrade: GradeRecord = {
              ...gradeData,
              id,
              letterGrade,
              gradePoint,
              qualityPoints,
              createdAt: now,
              updatedAt: now,
            };

            newGrades.push(newGrade);

            // Track semester updates
            if (!semesterUpdates[gradeData.semesterId]) {
              semesterUpdates[gradeData.semesterId] = [];
            }
            semesterUpdates[gradeData.semesterId].push(id);
          });

          set((state) => {
            const updatedGrades = [...state.grades, ...newGrades];

            // Update semesters with new grade IDs
            const updatedSemesters = state.semesters.map(semester => {
              const newGradeIds = semesterUpdates[semester.id] || [];
              if (newGradeIds.length > 0) {
                return {
                  ...semester,
                  grades: [...semester.grades, ...newGradeIds],
                  updatedAt: now
                };
              }
              return semester;
            });

            return {
              grades: updatedGrades,
              semesters: updatedSemesters,
            };
          });

          // Recalculate after state update
          get().recalculateAll();
          get().saveData();
        },
        
        updateGrade: (gradeId, updates) => {
          const now = Date.now();
          
          set((state) => {
            const updatedGrades = state.grades.map(grade => {
              if (grade.id !== gradeId) return grade;
              
              const updatedGrade = { ...grade, ...updates, updatedAt: now };
              
              // Recalculate dependent fields if numerical grade changed
              if (updates.numericalGrade !== undefined) {
                updatedGrade.letterGrade = convertNumericalToLetter(updates.numericalGrade);
                updatedGrade.gradePoint = convertNumericalToGradePoint(updates.numericalGrade);
                updatedGrade.qualityPoints = calculateQualityPoints(updatedGrade.units, updatedGrade.gradePoint!);
              }
              
              return updatedGrade;
            });
            
            return { grades: updatedGrades };
          });
          
          get().recalculateAll();
          get().saveData();
        },
        
        removeGrade: (gradeId) => {
          set((state) => {
            const gradeToRemove = state.grades.find(g => g.id === gradeId);
            if (!gradeToRemove) return state;
            
            const updatedGrades = state.grades.filter(g => g.id !== gradeId);
            
            // Remove from semester's grades array
            const updatedSemesters = state.semesters.map(semester =>
              semester.id === gradeToRemove.semesterId
                ? {
                    ...semester,
                    grades: semester.grades.filter(id => id !== gradeId),
                    updatedAt: Date.now()
                  }
                : semester
            );
            
            return {
              grades: updatedGrades,
              semesters: updatedSemesters,
            };
          });
          
          get().recalculateAll();
          get().saveData();
        },
        
        // Semester Management
        addSemester: (semesterData) => {
          const now = Date.now();
          const id = `semester-${now}-${Math.random().toString(36).substr(2, 9)}`;
          
          const newSemester: SemesterRecord = {
            ...semesterData,
            id,
            grades: [],
            createdAt: now,
            updatedAt: now,
          };
          
          set((state) => {
            const updatedSemesters = [...state.semesters, newSemester];
            
            // Add to academic record if it exists
            let updatedAcademicRecord = state.academicRecord;
            if (updatedAcademicRecord) {
              updatedAcademicRecord = {
                ...updatedAcademicRecord,
                semesters: [...updatedAcademicRecord.semesters, id],
                updatedAt: now,
              };
            }
            
            return {
              semesters: updatedSemesters,
              academicRecord: updatedAcademicRecord,
            };
          });
          
          setTimeout(() => get().saveData(), 0);
          return id;
        },
        
        updateSemester: (semesterId, updates) => {
          const now = Date.now();
          
          set((state) => ({
            semesters: state.semesters.map(semester =>
              semester.id === semesterId
                ? { ...semester, ...updates, updatedAt: now }
                : semester
            ),
          }));
          
          setTimeout(() => get().saveData(), 0);
        },
        
        removeSemester: (semesterId) => {
          set((state) => {
            // Remove all grades in this semester first
            const updatedGrades = state.grades.filter(g => g.semesterId !== semesterId);
            
            // Remove semester
            const updatedSemesters = state.semesters.filter(s => s.id !== semesterId);
            
            // Remove from academic record
            let updatedAcademicRecord = state.academicRecord;
            if (updatedAcademicRecord) {
              updatedAcademicRecord = {
                ...updatedAcademicRecord,
                semesters: updatedAcademicRecord.semesters.filter(id => id !== semesterId),
                updatedAt: Date.now(),
              };
            }
            
            return {
              grades: updatedGrades,
              semesters: updatedSemesters,
              academicRecord: updatedAcademicRecord,
            };
          });
          
          get().recalculateAll();
          get().saveData();
        },
        
        // Academic Record Management
        initializeAcademicRecord: (config) => {
          const now = Date.now();
          const id = 'main'; // Single record per user
          
          const newRecord: AcademicRecord = {
            id,
            semesters: [],
            configuration: config,
            yearlyQPIs: [],
            lastCalculated: now,
            version: 1,
            createdAt: now,
            updatedAt: now,
          };
          
          set({ academicRecord: newRecord });
          setTimeout(() => get().saveData(), 0);
        },
        
        updateAcademicRecord: (updates) => {
          set((state) => {
            if (!state.academicRecord) return state;

            return {
              academicRecord: {
                ...state.academicRecord,
                ...updates,
                updatedAt: Date.now(),
              },
            };
          });

          setTimeout(() => get().saveData(), 0);
        },

        // Template Management

        loadTemplateCourses: async (templateData) => {
          try {
            const now = Date.now();
            const newSemesters: SemesterRecord[] = [];
            const newGrades: GradeRecord[] = [];

            // Process each semester in the template
            for (const semesterData of templateData.semesters) {
              const semesterId = `semester-${now}-${Math.random().toString(36).substr(2, 9)}`;

              const semester: SemesterRecord = {
                id: semesterId,
                academicYear: new Date().getFullYear().toString(), // Default academic year
                semesterType: semesterData.semesterType,
                yearLevel: semesterData.yearLevel,
                grades: [],
                isCompleted: false,
                createdAt: now,
                updatedAt: now,
              };

              newSemesters.push(semester);

              // Process courses for this semester
              if (semesterData.courses && Array.isArray(semesterData.courses)) {
                for (const course of semesterData.courses) {
                  const gradeId = `grade-${now}-${Math.random().toString(36).substr(2, 9)}`;

                  const grade: GradeRecord = {
                    id: gradeId,
                    courseId: course._id,
                    courseCode: course.courseCode,
                    courseTitle: course.title,
                    units: course.units,
                    semesterId: semesterId,
                    createdAt: now,
                    updatedAt: now,
                  };

                  newGrades.push(grade);
                  semester.grades.push(gradeId);
                }
              }
            }

            set((state) => ({
              semesters: [...state.semesters, ...newSemesters],
              grades: [...state.grades, ...newGrades],
            }));

            // Initialize academic record if it doesn't exist
            if (!get().academicRecord) {
              const academicRecord: AcademicRecord = {
                id: 'main',
                semesters: newSemesters.map(s => s.id),
                configuration: {
                  totalYears: 4,
                  includesSummer: true,
                },
                yearlyQPIs: [],
                lastCalculated: now,
                version: 1,
                createdAt: now,
                updatedAt: now,
              };

              set({ academicRecord });
            } else {
              // Update existing academic record
              set((state) => ({
                academicRecord: state.academicRecord ? {
                  ...state.academicRecord,
                  semesters: [...state.academicRecord.semesters, ...newSemesters.map(s => s.id)],
                  updatedAt: now,
                } : null,
              }));
            }

            // Recalculate all QPIs
            setTimeout(() => get().recalculateAll(), 0);
            setTimeout(() => get().saveData(), 0);

          } catch (error) {
            console.error('Failed to load template courses:', error);
            throw error;
          }
        },
        
        // Data Operations
        loadData: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const [grades, semesters, academicRecord] = await Promise.all([
              Promise.resolve(loadGradeRecords()),
              Promise.resolve(loadSemesterRecords()),
              Promise.resolve(loadAcademicRecord()),
            ]);
            
            set({
              grades,
              semesters,
              academicRecord,
              isLoading: false,
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to load data',
              isLoading: false,
            });
          }
        },
        
        saveData: async () => {
          const state = get();
          
          try {
            // Using sync methods wrapped in Promise.resolve for consistent API
            academicStorage.saveGradeRecords(state.grades);
            academicStorage.saveSemesterRecords(state.semesters);
            if (state.academicRecord) {
              saveAcademicRecord(state.academicRecord);
            }
            
            set({ lastSaved: Date.now(), error: null });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to save data',
            });
          }
        },
        
        resetAll: () => {
          set({
            grades: [],
            semesters: [],
            academicRecord: null,
            isLoading: false,
            error: null,
            lastSaved: null,
          });
        },
        
        recalculateAll: () => {
          const state = get();
          
          // Recalculate semester totals
          const updatedSemesters = state.semesters.map(semester => {
            const semesterGrades = state.grades.filter(g => g.semesterId === semester.id);
            
            if (semesterGrades.length === 0) {
              return {
                ...semester,
                totalUnits: 0,
                totalQualityPoints: 0,
                semesterQPI: undefined,
              };
            }
            
            const semesterTotals = calculateSemesterTotals(semesterGrades);
            return {
              ...semester,
              totalUnits: semesterTotals.totalUnits,
              totalQualityPoints: semesterTotals.totalQualityPoints,
              semesterQPI: semesterTotals.semesterQPI,
            };
          });
          
          // Recalculate academic record totals
          let updatedAcademicRecord = state.academicRecord;
          if (updatedAcademicRecord) {
            const cumulativeQPI = calculateCumulativeQPI(updatedSemesters);
            
            // Calculate totals from semesters
            let totalUnits = 0;
            let totalQualityPoints = 0;
            
            updatedSemesters.forEach(semester => {
              if (semester.totalUnits && semester.totalQualityPoints) {
                totalUnits += semester.totalUnits;
                totalQualityPoints += semester.totalQualityPoints;
              }
            });
            
            // Calculate yearly QPIs
            const yearlyQPIs = Array.from(
              new Set(updatedSemesters.map(s => s.academicYear))
            ).map(academicYear => {
              const yearSemesters = updatedSemesters.filter(s => s.academicYear === academicYear);
              
              const firstSem = yearSemesters.find(s => s.semesterType === 'first');
              const secondSem = yearSemesters.find(s => s.semesterType === 'second');
              const summerSem = yearSemesters.find(s => s.semesterType === 'summer');
              
              // Calculate yearly average (excluding undefined QPIs)
              const semesterQPIs = [firstSem?.semesterQPI, secondSem?.semesterQPI, summerSem?.semesterQPI]
                .filter((qpi): qpi is number => qpi !== undefined);
              
              const yearlyQPI = semesterQPIs.length > 0 
                ? semesterQPIs.reduce((sum, qpi) => sum + qpi, 0) / semesterQPIs.length 
                : undefined;
              
              return {
                academicYear,
                firstSemQPI: firstSem?.semesterQPI,
                secondSemQPI: secondSem?.semesterQPI,
                summerQPI: summerSem?.semesterQPI,
                yearlyQPI,
              };
            });
            
            updatedAcademicRecord = {
              ...updatedAcademicRecord,
              totalUnits,
              totalQualityPoints,
              cumulativeQPI,
              yearlyQPIs,
              lastCalculated: Date.now(),
            };
          }
          
          set({
            semesters: updatedSemesters,
            academicRecord: updatedAcademicRecord,
          });
        },
        
        // Selectors
        getGradesBySemester: (semesterId) => {
          return get().grades.filter(grade => grade.semesterId === semesterId);
        },
        
        getSemesterQPI: (semesterId) => {
          const state = get();
          const semester = state.semesters.find(s => s.id === semesterId);
          
          if (!semester || !semester.semesterQPI) {
            return null;
          }
          
          return {
            qpi: semester.semesterQPI,
            totalUnits: semester.totalUnits || 0,
            totalQualityPoints: semester.totalQualityPoints || 0,
          };
        },
        
        getYearlyQPI: (academicYear) => {
          const state = get();
          if (!state.academicRecord) return null;
          
          const yearData = state.academicRecord.yearlyQPIs.find(y => y.academicYear === academicYear);
          if (!yearData || !yearData.yearlyQPI) return null;
          
          const yearSemesters = state.semesters
            .filter(s => s.academicYear === academicYear)
            .map(s => s.id);
          
          return {
            qpi: yearData.yearlyQPI,
            semesters: yearSemesters,
          };
        },
        
        getCumulativeQPI: () => {
          const state = get();
          if (!state.academicRecord || !state.academicRecord.cumulativeQPI) {
            return null;
          }
          
          return {
            qpi: state.academicRecord.cumulativeQPI,
            totalUnits: state.academicRecord.totalUnits || 0,
            totalQualityPoints: state.academicRecord.totalQualityPoints || 0,
          };
        },
      }),
      {
        name: 'qpi-grade-store',
        partialize: (state) => ({
          // Only persist essential data, not computed values
          grades: state.grades,
          semesters: state.semesters,
          academicRecord: state.academicRecord,
        }),
        onRehydrateStorage: () => (state) => {
          // Recalculate computed values after rehydration
          if (state) {
            setTimeout(() => state.recalculateAll(), 0);
          }
        },
      }
    ),
    { name: 'GradeStore' }
  )
);