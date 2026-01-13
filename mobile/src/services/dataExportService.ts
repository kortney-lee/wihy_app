/**
 * Data Export Service
 * 
 * Client-side service for exporting user data in various formats.
 * Supports GDPR compliance, reports, and data portability.
 * Connects to services.wihy.ai for export generation.
 */

import { servicesApi } from './servicesApiClient';
import { authService } from './authService';
import { API_CONFIG } from './config';

// ============= TYPES =============

export type ExportFormat = 'json' | 'csv' | 'pdf' | 'xlsx';

export type ExportType = 
  | 'all_data'           // GDPR full export
  | 'nutrition'          // Nutrition logs and meals
  | 'fitness'            // Workout history
  | 'progress'           // Progress photos and measurements
  | 'journal'            // Journal entries
  | 'goals'              // Goals and milestones
  | 'health_data'        // Health metrics
  | 'scan_history'       // Scan history
  | 'custom';

export interface ExportRequest {
  type: ExportType;
  format: ExportFormat;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  includeMedia?: boolean;
  customFields?: string[];
}

export interface ExportJob {
  id: string;
  userId: string;
  type: ExportType;
  format: ExportFormat;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  downloadUrl?: string;
  fileSize?: number;
  expiresAt?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ReportOptions {
  title?: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  sections?: ReportSection[];
  includeCharts?: boolean;
  includeInsights?: boolean;
}

export type ReportSection = 
  | 'summary'
  | 'nutrition_breakdown'
  | 'workout_summary'
  | 'progress_photos'
  | 'measurements'
  | 'goals_progress'
  | 'streaks'
  | 'recommendations';

export interface Report {
  id: string;
  title: string;
  type: 'weekly' | 'monthly' | 'quarterly' | 'custom';
  downloadUrl: string;
  createdAt: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

// ============= SERVICE IMPLEMENTATION =============

class DataExportService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.servicesUrl || 'https://services.wihy.ai';
  }

  /**
   * Get authorization headers
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await authService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // ==========================================
  // DATA EXPORT (GDPR)
  // ==========================================

  /**
   * Request a full data export (GDPR compliance)
   * 
   * @param format - Export format
   * @param includeMedia - Include photos and attachments
   * @returns Export job
   */
  async requestFullDataExport(
    format: ExportFormat = 'json',
    includeMedia: boolean = true
  ): Promise<ExportJob> {
    return this.requestExport({
      type: 'all_data',
      format,
      includeMedia,
    });
  }

  /**
   * Request a data export
   * 
   * @param request - Export request details
   * @returns Export job
   */
  async requestExport(request: ExportRequest): Promise<ExportJob> {
    try {
      const response = await servicesApi.post<{ job: ExportJob }>(
        '/api/export/request',
        request
      );
      return response.job;
    } catch (error) {
      console.error('[DataExportService] Error requesting export:', error);
      throw error;
    }
  }

  /**
   * Get export job status
   * 
   * @param jobId - Export job ID
   * @returns Job status
   */
  async getExportStatus(jobId: string): Promise<ExportJob> {
    try {
      const response = await servicesApi.get<{ job: ExportJob }>(
        `/api/export/status/${jobId}`
      );
      return response.job;
    } catch (error) {
      console.error('[DataExportService] Error fetching export status:', error);
      throw error;
    }
  }

  /**
   * Get all export jobs for the user
   * 
   * @returns List of export jobs
   */
  async getExportHistory(): Promise<ExportJob[]> {
    try {
      const response = await servicesApi.get<{ jobs: ExportJob[] }>(
        '/api/export/history'
      );
      return response.jobs || [];
    } catch (error) {
      console.error('[DataExportService] Error fetching export history:', error);
      return [];
    }
  }

  /**
   * Download an export file
   * 
   * @param jobId - Export job ID
   * @returns Download URL (temporary, signed)
   */
  async getDownloadUrl(jobId: string): Promise<string> {
    try {
      const response = await servicesApi.get<{ url: string }>(
        `/api/export/download/${jobId}`
      );
      return response.url;
    } catch (error) {
      console.error('[DataExportService] Error getting download URL:', error);
      throw error;
    }
  }

  /**
   * Cancel a pending export
   * 
   * @param jobId - Export job ID
   */
  async cancelExport(jobId: string): Promise<void> {
    try {
      await servicesApi.delete(`/api/export/${jobId}`);
    } catch (error) {
      console.error('[DataExportService] Error cancelling export:', error);
      throw error;
    }
  }

  // ==========================================
  // REPORTS
  // ==========================================

  /**
   * Generate a nutrition report
   * 
   * @param options - Report options
   * @returns Report with download URL
   */
  async generateNutritionReport(options: ReportOptions): Promise<Report> {
    try {
      const response = await servicesApi.post<{ report: Report }>(
        '/api/export/reports/nutrition',
        {
          ...options,
          sections: options.sections || [
            'summary',
            'nutrition_breakdown',
            'recommendations',
          ],
        }
      );
      return response.report;
    } catch (error) {
      console.error('[DataExportService] Error generating nutrition report:', error);
      throw error;
    }
  }

  /**
   * Generate a fitness report
   * 
   * @param options - Report options
   * @returns Report with download URL
   */
  async generateFitnessReport(options: ReportOptions): Promise<Report> {
    try {
      const response = await servicesApi.post<{ report: Report }>(
        '/api/export/reports/fitness',
        {
          ...options,
          sections: options.sections || [
            'summary',
            'workout_summary',
            'progress_photos',
            'measurements',
            'streaks',
          ],
        }
      );
      return response.report;
    } catch (error) {
      console.error('[DataExportService] Error generating fitness report:', error);
      throw error;
    }
  }

  /**
   * Generate a progress report
   * 
   * @param options - Report options
   * @returns Report with download URL
   */
  async generateProgressReport(options: ReportOptions): Promise<Report> {
    try {
      const response = await servicesApi.post<{ report: Report }>(
        '/api/export/reports/progress',
        {
          ...options,
          sections: options.sections || [
            'summary',
            'progress_photos',
            'measurements',
            'goals_progress',
          ],
        }
      );
      return response.report;
    } catch (error) {
      console.error('[DataExportService] Error generating progress report:', error);
      throw error;
    }
  }

  /**
   * Generate a comprehensive weekly report
   * 
   * @returns Weekly report
   */
  async generateWeeklyReport(): Promise<Report> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    try {
      const response = await servicesApi.post<{ report: Report }>(
        '/api/export/reports/weekly',
        {
          dateRange: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
          },
          includeCharts: true,
          includeInsights: true,
        }
      );
      return response.report;
    } catch (error) {
      console.error('[DataExportService] Error generating weekly report:', error);
      throw error;
    }
  }

  /**
   * Generate a monthly report
   * 
   * @param year - Year
   * @param month - Month (1-12)
   * @returns Monthly report
   */
  async generateMonthlyReport(year: number, month: number): Promise<Report> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    try {
      const response = await servicesApi.post<{ report: Report }>(
        '/api/export/reports/monthly',
        {
          dateRange: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
          },
          includeCharts: true,
          includeInsights: true,
        }
      );
      return response.report;
    } catch (error) {
      console.error('[DataExportService] Error generating monthly report:', error);
      throw error;
    }
  }

  /**
   * Get list of generated reports
   * 
   * @returns List of reports
   */
  async getReportHistory(): Promise<Report[]> {
    try {
      const response = await servicesApi.get<{ reports: Report[] }>(
        '/api/export/reports'
      );
      return response.reports || [];
    } catch (error) {
      console.error('[DataExportService] Error fetching report history:', error);
      return [];
    }
  }

  // ==========================================
  // SPECIFIC DATA EXPORTS
  // ==========================================

  /**
   * Export meal plan to PDF
   * 
   * @param mealPlanId - Meal plan ID
   * @returns Download URL
   */
  async exportMealPlan(mealPlanId: string): Promise<string> {
    try {
      const response = await servicesApi.get<{ url: string }>(
        `/api/export/meal-plan/${mealPlanId}`
      );
      return response.url;
    } catch (error) {
      console.error('[DataExportService] Error exporting meal plan:', error);
      throw error;
    }
  }

  /**
   * Export workout program to PDF
   * 
   * @param programId - Workout program ID
   * @returns Download URL
   */
  async exportWorkoutProgram(programId: string): Promise<string> {
    try {
      const response = await servicesApi.get<{ url: string }>(
        `/api/export/workout-program/${programId}`
      );
      return response.url;
    } catch (error) {
      console.error('[DataExportService] Error exporting workout program:', error);
      throw error;
    }
  }

  /**
   * Export shopping list
   * 
   * @param shoppingListId - Shopping list ID
   * @param format - Export format (pdf, txt)
   * @returns Download URL
   */
  async exportShoppingList(
    shoppingListId: string,
    format: 'pdf' | 'txt' = 'pdf'
  ): Promise<string> {
    try {
      const response = await servicesApi.get<{ url: string }>(
        `/api/export/shopping-list/${shoppingListId}?format=${format}`
      );
      return response.url;
    } catch (error) {
      console.error('[DataExportService] Error exporting shopping list:', error);
      throw error;
    }
  }

  /**
   * Export scan history
   * 
   * @param format - Export format
   * @param dateRange - Optional date range
   * @returns Download URL
   */
  async exportScanHistory(
    format: ExportFormat = 'csv',
    dateRange?: { startDate: string; endDate: string }
  ): Promise<string> {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (dateRange) {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      }

      const response = await servicesApi.get<{ url: string }>(
        `/api/export/scan-history?${params.toString()}`
      );
      return response.url;
    } catch (error) {
      console.error('[DataExportService] Error exporting scan history:', error);
      throw error;
    }
  }

  // ==========================================
  // COACH EXPORTS (for coaches)
  // ==========================================

  /**
   * Export client data (for coaches)
   * 
   * @param clientId - Client ID
   * @param format - Export format
   * @returns Download URL
   */
  async exportClientData(clientId: string, format: ExportFormat = 'pdf'): Promise<string> {
    try {
      const response = await servicesApi.get<{ url: string }>(
        `/api/export/client/${clientId}?format=${format}`
      );
      return response.url;
    } catch (error) {
      console.error('[DataExportService] Error exporting client data:', error);
      throw error;
    }
  }

  /**
   * Generate client progress report (for coaches)
   * 
   * @param clientId - Client ID
   * @param options - Report options
   * @returns Report with download URL
   */
  async generateClientReport(clientId: string, options: ReportOptions): Promise<Report> {
    try {
      const response = await servicesApi.post<{ report: Report }>(
        `/api/export/client/${clientId}/report`,
        options
      );
      return response.report;
    } catch (error) {
      console.error('[DataExportService] Error generating client report:', error);
      throw error;
    }
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  /**
   * Poll export job until complete
   * 
   * @param jobId - Export job ID
   * @param onProgress - Progress callback
   * @param pollInterval - Poll interval in ms
   * @param timeout - Timeout in ms
   * @returns Completed job
   */
  async waitForExport(
    jobId: string,
    onProgress?: (progress: number) => void,
    pollInterval: number = 2000,
    timeout: number = 300000 // 5 minutes
  ): Promise<ExportJob> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const job = await this.getExportStatus(jobId);

          if (job.progress && onProgress) {
            onProgress(job.progress);
          }

          if (job.status === 'completed') {
            resolve(job);
            return;
          }

          if (job.status === 'failed') {
            reject(new Error(job.error || 'Export failed'));
            return;
          }

          if (Date.now() - startTime > timeout) {
            reject(new Error('Export timed out'));
            return;
          }

          setTimeout(poll, pollInterval);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  /**
   * Get available export formats for a type
   * 
   * @param type - Export type
   * @returns Available formats
   */
  getAvailableFormats(type: ExportType): ExportFormat[] {
    switch (type) {
      case 'all_data':
        return ['json', 'csv'];
      case 'nutrition':
      case 'fitness':
      case 'progress':
        return ['json', 'csv', 'pdf', 'xlsx'];
      case 'journal':
        return ['json', 'pdf'];
      case 'goals':
        return ['json', 'csv', 'pdf'];
      case 'health_data':
        return ['json', 'csv'];
      case 'scan_history':
        return ['json', 'csv'];
      default:
        return ['json'];
    }
  }

  /**
   * Estimate export size
   * 
   * @param type - Export type
   * @param includeMedia - Include media files
   * @returns Estimated size in bytes
   */
  async estimateExportSize(type: ExportType, includeMedia: boolean = false): Promise<number> {
    try {
      const response = await servicesApi.get<{ estimatedSize: number }>(
        `/api/export/estimate?type=${type}&includeMedia=${includeMedia}`
      );
      return response.estimatedSize;
    } catch (error) {
      console.error('[DataExportService] Error estimating export size:', error);
      return 0;
    }
  }
}

export const dataExportService = new DataExportService();

export default dataExportService;
