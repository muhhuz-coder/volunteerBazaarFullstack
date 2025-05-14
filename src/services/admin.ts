// src/services/admin.ts
// TODO: Implement admin-related functions in db-mysql.ts

/**
 * Represents a report submitted by a user against another user or content.
 */
export interface AdminReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  timestamp: Date | string; // Allow string for reading from JSON
  status: 'pending' | 'resolved' | 'dismissed';
  adminNotes?: string; // Notes added by an admin upon resolution
  resolvedBy?: string; // ID of the admin who resolved the report
  resolvedAt?: Date | string; // Timestamp of resolution
  // Optional: for UI enrichment, not stored directly in reports.json
  reporterDisplayName?: string; 
  reportedUserDisplayName?: string;
}
