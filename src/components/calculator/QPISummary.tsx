import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Calculator, GraduationCap, BookOpen, Target } from 'lucide-react';
import type { AcademicRecord } from '@/lib/types/academic-types';
import { useAutoAnimate } from '@formkit/auto-animate/react';

interface QPISummaryProps {
  academicRecord: AcademicRecord;
  selectedYears?: string[];
  showBreakdown: boolean;
  comparisonMode?: 'none' | 'yearly' | 'semester';
  onDrillDown?: (year: string, semester: string) => void;
}

interface QPITrend {
  direction: 'up' | 'down' | 'stable';
  change: number;
  comparedTo: string;
}

export function QPISummary({
  academicRecord,
  selectedYears,
  showBreakdown,
  comparisonMode = 'none',
  onDrillDown,
}: QPISummaryProps) {
  const [parent] = useAutoAnimate();

  // Calculate trends and statistics
  const statistics = useMemo(() => {
    const totalUnits = academicRecord.totalUnits || 0;
    const totalQualityPoints = academicRecord.totalQualityPoints || 0;
    const cumulativeQPI = academicRecord.cumulativeQPI || 0;
    
    // Filter yearly QPIs based on selection
    let yearlyData = academicRecord.yearlyQPIs;
    if (selectedYears && selectedYears.length > 0) {
      yearlyData = yearlyData.filter(year => selectedYears.includes(year.academicYear));
    }

    // Calculate trend
    let trend: QPITrend | null = null;
    if (yearlyData.length >= 2) {
      const current = yearlyData[yearlyData.length - 1].yearlyQPI || 0;
      const previous = yearlyData[yearlyData.length - 2].yearlyQPI || 0;
      const change = current - previous;
      
      trend = {
        direction: change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'stable',
        change: Math.abs(change),
        comparedTo: yearlyData[yearlyData.length - 2].academicYear
      };
    }

    return {
      totalUnits,
      totalQualityPoints, 
      cumulativeQPI,
      yearlyData,
      trend,
      completedYears: yearlyData.length,
      averageYearlyQPI: yearlyData.length > 0 
        ? yearlyData.reduce((sum, year) => sum + (year.yearlyQPI || 0), 0) / yearlyData.length 
        : 0
    };
  }, [academicRecord, selectedYears]);

  const getGradeBadgeVariant = (qpi: number): "default" | "destructive" | "outline" | "secondary" => {
    if (qpi >= 3.5) return "default";
    if (qpi >= 3.0) return "secondary";
    if (qpi >= 2.0) return "outline";
    return "destructive";
  };

  const getPerformanceLevel = (qpi: number): string => {
    if (qpi >= 3.75) return "Summa Cum Laude";
    if (qpi >= 3.5) return "Magna Cum Laude";
    if (qpi >= 3.25) return "Cum Laude"; 
    if (qpi >= 3.0) return "Dean's List";
    if (qpi >= 2.0) return "Good Standing";
    return "Academic Probation";
  };

  const qpiPercentage = Math.min((statistics.cumulativeQPI / 4.0) * 100, 100);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main QPI Display */}
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-lg">Academic Performance</CardTitle>
            {statistics.trend && (
              <div className="flex items-center gap-1 text-sm self-start sm:self-auto">
                {statistics.trend.direction === 'up' && (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">+{statistics.trend.change.toFixed(2)}</span>
                  </>
                )}
                {statistics.trend.direction === 'down' && (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">-{statistics.trend.change.toFixed(2)}</span>
                  </>
                )}
                {statistics.trend.direction === 'stable' && (
                  <span className="text-muted-foreground">Stable</span>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Central QPI Display */}
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="relative">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary">
                {statistics.cumulativeQPI.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Cumulative QPI
              </div>

              {/* QPI Progress Ring */}
              <div className="absolute -inset-3 sm:-inset-4 rounded-full">
                <Progress
                  value={qpiPercentage}
                  className="w-full h-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Badge
                variant={getGradeBadgeVariant(statistics.cumulativeQPI)}
                className="text-sm px-3 py-1"
              >
                {getPerformanceLevel(statistics.cumulativeQPI)}
              </Badge>

              <div className="flex flex-col sm:flex-row sm:justify-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                <span>{statistics.totalUnits} total units</span>
                <div className="hidden sm:block">
                  <Separator orientation="vertical" className="h-4" />
                </div>
                <span>{statistics.completedYears} years completed</span>
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Quality Points</span>
              </div>
              <div className="text-xl font-semibold">{statistics.totalQualityPoints.toFixed(1)}</div>
            </div>
            
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Units</span>
              </div>
              <div className="text-xl font-semibold">{statistics.totalUnits}</div>
            </div>

            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Years</span>
              </div>
              <div className="text-xl font-semibold">{statistics.completedYears}</div>
            </div>

            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Avg Yearly</span>
              </div>
              <div className="text-xl font-semibold">{statistics.averageYearlyQPI.toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yearly Breakdown */}
      {showBreakdown && statistics.yearlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Yearly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={parent} className="space-y-3">
              {statistics.yearlyData.map((yearData, index) => (
                <div key={yearData.academicYear} className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{yearData.academicYear}</span>
                      <Badge variant="outline" className="text-xs">
                        Year {index + 1}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-left sm:text-right">
                        <div className="text-lg font-semibold">
                          {yearData.yearlyQPI?.toFixed(2) || 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">Yearly QPI</div>
                      </div>

                      {comparisonMode === 'semester' && onDrillDown && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDrillDown(yearData.academicYear, 'all')}
                          className="text-xs touch-manipulation"
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>

                  {comparisonMode === 'semester' && (
                    <div className="pl-2 sm:pl-4 space-y-1 border-l-2 border-muted">
                      {yearData.firstSemQPI && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">1st Semester</span>
                          <Badge variant="outline" className="text-xs">
                            {yearData.firstSemQPI.toFixed(2)}
                          </Badge>
                        </div>
                      )}
                      {yearData.secondSemQPI && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">2nd Semester</span>
                          <Badge variant="outline" className="text-xs">
                            {yearData.secondSemQPI.toFixed(2)}
                          </Badge>
                        </div>
                      )}
                      {yearData.summerQPI && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Summer</span>
                          <Badge variant="outline" className="text-xs">
                            {yearData.summerQPI.toFixed(2)}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {index < statistics.yearlyData.length - 1 && (
                    <Separator className="mt-3" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graduation Requirements Progress */}
      {academicRecord.configuration && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progress to Graduation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Years Progress */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 text-sm">
                  <span>Academic Years</span>
                  <span className="font-medium">{statistics.completedYears}/{academicRecord.configuration.totalYears}</span>
                </div>
                <Progress
                  value={(statistics.completedYears / academicRecord.configuration.totalYears) * 100}
                  className="w-full"
                />
              </div>

              {/* Estimated Graduation */}
              <div className="text-center pt-2">
                <div className="text-sm text-muted-foreground">
                  {statistics.completedYears >= academicRecord.configuration.totalYears
                    ? "🎉 Eligible for graduation!"
                    : `${academicRecord.configuration.totalYears - statistics.completedYears} year(s) remaining`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}