// Local storage utilities for academic data

import type { 
  GradeRecord, 
  SemesterRecord, 
  AcademicRecord 
} from '../types/academic-types';

// Storage keys
const STORAGE_KEYS = {
  GRADES: 'qpi_grades',
  SEMESTERS: 'qpi_semesters', 
  ACADEMIC_RECORD: 'qpi_academic_record',
  SCHEMA_VERSION: 'qpi_schema_version',
  LAST_BACKUP: 'qpi_last_backup',
} as const;

// Current schema version for migrations
const CURRENT_SCHEMA_VERSION = 1;

// Storage utilities
class LocalStorageManager {
  private isAvailable(): boolean {
    try {
      const test = '__qpi_storage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private getItem<T>(key: string): T | null {
    if (!this.isAvailable()) {
      throw new Error('Local storage is not available');
    }

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return null;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (!this.isAvailable()) {
      throw new Error('Local storage is not available');
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        throw new Error('Local storage quota exceeded. Please clear some data.');
      }
      throw new Error(`Error writing to localStorage: ${error}`);
    }
  }

  private removeItem(key: string): void {
    if (!this.isAvailable()) {
      throw new Error('Local storage is not available');
    }
    
    localStorage.removeItem(key);
  }

  // Grade records management
  saveGradeRecords(grades: GradeRecord[]): void {
    this.setItem(STORAGE_KEYS.GRADES, grades);
  }

  loadGradeRecords(): GradeRecord[] {
    return this.getItem<GradeRecord[]>(STORAGE_KEYS.GRADES) || [];
  }

  saveGradeRecord(grade: GradeRecord): void {
    const grades = this.loadGradeRecords();
    const existingIndex = grades.findIndex(g => g.id === grade.id);
    
    if (existingIndex >= 0) {
      grades[existingIndex] = { ...grade, updatedAt: Date.now() };
    } else {
      grades.push({ ...grade, createdAt: Date.now(), updatedAt: Date.now() });
    }
    
    this.saveGradeRecords(grades);
  }

  removeGradeRecord(gradeId: string): void {
    const grades = this.loadGradeRecords();
    const filteredGrades = grades.filter(g => g.id !== gradeId);
    this.saveGradeRecords(filteredGrades);
  }

  // Semester records management
  saveSemesterRecords(semesters: SemesterRecord[]): void {
    this.setItem(STORAGE_KEYS.SEMESTERS, semesters);
  }

  loadSemesterRecords(): SemesterRecord[] {
    return this.getItem<SemesterRecord[]>(STORAGE_KEYS.SEMESTERS) || [];
  }

  saveSemesterRecord(semester: SemesterRecord): void {
    const semesters = this.loadSemesterRecords();
    const existingIndex = semesters.findIndex(s => s.id === semester.id);
    
    if (existingIndex >= 0) {
      semesters[existingIndex] = { ...semester, updatedAt: Date.now() };
    } else {
      semesters.push({ ...semester, createdAt: Date.now(), updatedAt: Date.now() });
    }
    
    this.saveSemesterRecords(semesters);
  }

  removeSemesterRecord(semesterId: string): void {
    const semesters = this.loadSemesterRecords();
    const filteredSemesters = semesters.filter(s => s.id !== semesterId);
    this.saveSemesterRecords(filteredSemesters);
  }

  // Academic record management
  saveAcademicRecord(record: AcademicRecord): void {
    this.setItem(STORAGE_KEYS.ACADEMIC_RECORD, record);
  }

  loadAcademicRecord(): AcademicRecord | null {
    return this.getItem<AcademicRecord>(STORAGE_KEYS.ACADEMIC_RECORD);
  }

  removeAcademicRecord(): void {
    this.removeItem(STORAGE_KEYS.ACADEMIC_RECORD);
  }

  // Data migration
  migrateDataSchema(): void {
    const currentVersion = this.getItem<number>(STORAGE_KEYS.SCHEMA_VERSION) || 0;
    
    if (currentVersion < CURRENT_SCHEMA_VERSION) {
      console.log(`Migrating data from version ${currentVersion} to ${CURRENT_SCHEMA_VERSION}`);
      
      // Run migrations based on version
      if (currentVersion === 0) {
        this.migrateFromV0ToV1();
      }
      
      this.setItem(STORAGE_KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
    }
  }

  private migrateFromV0ToV1(): void {
    // Migration logic for version 0 -> 1
    // For initial version, just ensure proper structure exists
    const grades = this.loadGradeRecords();
    const semesters = this.loadSemesterRecords();
    
    // Add any missing timestamps
    let gradesUpdated = false;
    const timestamp = Date.now();
    
    grades.forEach(grade => {
      if (!grade.createdAt) {
        grade.createdAt = timestamp;
        gradesUpdated = true;
      }
      if (!grade.updatedAt) {
        grade.updatedAt = timestamp;
        gradesUpdated = true;
      }
    });
    
    if (gradesUpdated) {
      this.saveGradeRecords(grades);
    }

    let semestersUpdated = false;
    semesters.forEach(semester => {
      if (!semester.createdAt) {
        semester.createdAt = timestamp;
        semestersUpdated = true;
      }
      if (!semester.updatedAt) {
        semester.updatedAt = timestamp;
        semestersUpdated = true;
      }
    });
    
    if (semestersUpdated) {
      this.saveSemesterRecords(semesters);
    }
  }

  // Backup and restore
  exportAllData(): string {
    const data = {
      grades: this.loadGradeRecords(),
      semesters: this.loadSemesterRecords(),
      academicRecord: this.loadAcademicRecord(),
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: Date.now(),
    };
    
    return JSON.stringify(data, null, 2);
  }

  importAllData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      
      // Validate basic structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format');
      }

      // Import data
      if (data.grades) {
        this.saveGradeRecords(data.grades);
      }
      
      if (data.semesters) {
        this.saveSemesterRecords(data.semesters);
      }
      
      if (data.academicRecord) {
        this.saveAcademicRecord(data.academicRecord);
      }

      // Update schema version if provided
      if (data.schemaVersion) {
        this.setItem(STORAGE_KEYS.SCHEMA_VERSION, data.schemaVersion);
      }

      // Set backup timestamp
      this.setItem(STORAGE_KEYS.LAST_BACKUP, Date.now());
      
    } catch (error) {
      throw new Error(`Failed to import data: ${error}`);
    }
  }

  // Clear all data
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.removeItem(key);
    });
  }

  // Storage info
  getStorageInfo(): {
    isAvailable: boolean;
    gradeCount: number;
    semesterCount: number;
    hasAcademicRecord: boolean;
    schemaVersion: number;
    lastBackup: number | null;
  } {
    if (!this.isAvailable()) {
      return {
        isAvailable: false,
        gradeCount: 0,
        semesterCount: 0,
        hasAcademicRecord: false,
        schemaVersion: 0,
        lastBackup: null,
      };
    }

    return {
      isAvailable: true,
      gradeCount: this.loadGradeRecords().length,
      semesterCount: this.loadSemesterRecords().length,
      hasAcademicRecord: this.loadAcademicRecord() !== null,
      schemaVersion: this.getItem<number>(STORAGE_KEYS.SCHEMA_VERSION) || 0,
      lastBackup: this.getItem<number>(STORAGE_KEYS.LAST_BACKUP),
    };
  }
}

// Export singleton instance
export const academicStorage = new LocalStorageManager();

// Convenience functions
export function saveGradeRecord(grade: GradeRecord): void {
  return academicStorage.saveGradeRecord(grade);
}

export function loadGradeRecords(): GradeRecord[] {
  return academicStorage.loadGradeRecords();
}

export function saveSemesterRecord(semester: SemesterRecord): void {
  return academicStorage.saveSemesterRecord(semester);
}

export function loadSemesterRecords(): SemesterRecord[] {
  return academicStorage.loadSemesterRecords();
}

export function saveAcademicRecord(record: AcademicRecord): void {
  return academicStorage.saveAcademicRecord(record);
}

export function loadAcademicRecord(): AcademicRecord | null {
  return academicStorage.loadAcademicRecord();
}

export function migrateDataSchema(): void {
  return academicStorage.migrateDataSchema();
}

export function clearAllData(): void {
  return academicStorage.clearAllData();
}

export function exportAllData(): string {
  return academicStorage.exportAllData();
}

export function importAllData(jsonData: string): void {
  return academicStorage.importAllData(jsonData);
}

// Additional exports for tests
export function isStorageAvailable(): boolean {
  return academicStorage['isAvailable']();
}

export function getStorageInfo(): {
  isAvailable: boolean;
  gradeCount: number;
  semesterCount: number;
  hasAcademicRecord: boolean;
  schemaVersion: number;
  lastBackup: number | null;
} {
  return academicStorage.getStorageInfo();
}