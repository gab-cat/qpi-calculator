import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Settings, CheckCircle } from 'lucide-react';
import type { AcademicRecord, SemesterRecord, GradeRecord } from '@/lib/types/academic-types';
import { exportAcademicRecordToCSV, convertSemesterToCSV, type CSVExportOptions } from '@/lib/csv-handler/csv-export';

interface CSVExporterProps {
  academicRecord: AcademicRecord;
  semesters: SemesterRecord[];
  grades: GradeRecord[];
  onExportStart: () => void;
  onExportComplete: (result: ExportResult) => void;
  onExportError: (error: string) => void;
  exportOptions: ExportOptions;
}

interface ExportOptions {
  includeCalculations: boolean;
  includeNotes: boolean;
  dateFormat: 'iso' | 'readable';
  filename?: string;
  includeSummary: boolean;
  exportForReimport: boolean;
  exportBySemester: boolean; // New option to export by semester
}

interface ExportResult {
  filename: string;
  recordsExported: number;
  fileSize: number;
  exportedAt: number;
}

export function CSVExporter({
  academicRecord,
  semesters,
  grades,
  onExportStart,
  onExportComplete,
  onExportError,
  exportOptions: initialOptions,
}: CSVExporterProps) {
  const [options, setOptions] = useState<ExportOptions>(initialOptions);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [lastExportResult, setLastExportResult] = useState<ExportResult | null>(null);

  // Calculate export statistics
  const totalRecords = grades.length;
  const completedSemesters = semesters.filter(s => s.isCompleted).length;
  const totalUnits = grades.reduce((sum, grade) => sum + grade.units, 0);
  
  const handleExport = async () => {
    if (grades.length === 0) {
      onExportError('No grade data to export');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    onExportStart();

    try {
      // Generate filename if not provided
      const filename = options.filename || `qpi_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      // Simulate export process with progress updates
      const steps = [
        { progress: 20, message: 'Preparing data...' },
        { progress: 40, message: 'Processing grades...' },
        { progress: 60, message: 'Adding calculations...' },
        { progress: 80, message: 'Formatting export...' },
        { progress: 100, message: 'Complete!' },
      ];

      for (const step of steps) {
        setExportProgress(step.progress);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Create CSV content using the utility function
      const csvContent = generateCSVContent();
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      const result: ExportResult = {
        filename,
        recordsExported: totalRecords,
        fileSize: blob.size,
        exportedAt: Date.now(),
      };

      setLastExportResult(result);
      onExportComplete(result);
      
    } catch {
      onExportError('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const generateCSVContent = (): string => {
    // Use the utility function with appropriate options
    const exportOptions: CSVExportOptions = {
      includeHeaders: true,
      includeNotes: options.includeNotes,
      exportForReimport: options.exportForReimport,
      customDelimiter: ',',
    };

    if (options.exportBySemester) {
      // Export by semester - create multiple CSV sections
      const semesterSections: string[] = [];

      // Sort semesters by year level and type
      const sortedSemesters = [...semesters].sort((a, b) => {
        if (a.yearLevel !== b.yearLevel) {
          return a.yearLevel - b.yearLevel;
        }
        // First semester before second semester before summer
        const order = { first: 1, second: 2, summer: 3 };
        return order[a.semesterType] - order[b.semesterType];
      });

      for (const semester of sortedSemesters) {
        const semesterGrades = grades.filter(grade => grade.semesterId === semester.id);
        if (semesterGrades.length === 0) continue;

        // Add semester header
        semesterSections.push(`\n=== ${semester.academicYear} - ${semester.semesterType.charAt(0).toUpperCase() + semester.semesterType.slice(1)} Semester ===\n`);

        // Generate CSV for this semester
        const semesterCSV = convertSemesterToCSV(semester, semesterGrades, exportOptions);
        semesterSections.push(semesterCSV);
      }

      return semesterSections.join('\n');
    } else {
      // Regular export - all grades in one file
      return exportAcademicRecordToCSV(
        academicRecord,
        semesters,
        grades,
        {
          ...exportOptions,
          includeSummary: options.includeSummary && !options.exportForReimport,
        }
      );
    }
  };



  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Export Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{totalRecords}</div>
              <div className="text-sm text-muted-foreground">Records</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{completedSemesters}</div>
              <div className="text-sm text-muted-foreground">Semesters</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{totalUnits}</div>
              <div className="text-sm text-muted-foreground">Total Units</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {academicRecord.cumulativeQPI?.toFixed(3) || 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Current QPI</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Export Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filename">Filename</Label>
              <Input
                id="filename"
                placeholder="qpi_export_2024.csv"
                value={options.filename || ''}
                onChange={(e) => setOptions(prev => ({ ...prev, filename: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select
                value={options.dateFormat}
                onValueChange={(value: 'iso' | 'readable') =>
                  setOptions(prev => ({ ...prev, dateFormat: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iso">ISO Format (2024-01-15)</SelectItem>
                  <SelectItem value="readable">Readable (January 15, 2024)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Export Format</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.exportBySemester}
                  onChange={(e) => setOptions(prev => ({
                    ...prev,
                    exportBySemester: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-sm">Export by Semester (organized sections)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.exportForReimport}
                  onChange={(e) => setOptions(prev => ({
                    ...prev,
                    exportForReimport: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-sm">Export for Import (simplified format)</span>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Include Additional Data</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeCalculations}
                  onChange={(e) => setOptions(prev => ({
                    ...prev,
                    includeCalculations: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-sm">QPI Calculations</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeNotes}
                  onChange={(e) => setOptions(prev => ({
                    ...prev,
                    includeNotes: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-sm">Student Notes</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeSummary}
                  onChange={(e) => setOptions(prev => ({
                    ...prev,
                    includeSummary: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-sm">Summary Statistics</span>
              </label>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button onClick={handleExport} disabled={isExporting || totalRecords === 0}>
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Progress */}
      {isExporting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Exporting...</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Export Result */}
      {lastExportResult && !isExporting && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <div className="font-medium">Export completed successfully</div>
                <div className="text-sm text-muted-foreground">
                  {lastExportResult.recordsExported} records • {formatFileSize(lastExportResult.fileSize)} • 
                  {new Date(lastExportResult.exportedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <Badge variant="outline">{lastExportResult.filename}</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}