import { apiRequest } from "./api";

export type AdminStatus = {
  status: "ok";
  service: "admin";
  admin_id: string;
  admin_email: string;
};

export function getAdminStatus(token: string): Promise<AdminStatus> {
  return apiRequest<AdminStatus>("/admin/status", { token });
}

export type AuditLog = {
  id: string;
  occurred_at: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  category: string;
  result: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  resource_type: string | null;
  resource_id: string | null;
  request_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  http_method: string | null;
  request_path: string | null;
  metadata: Record<string, unknown>;
};

export type AuditLogFilters = {
  actor_query?: string;
  actor_role?: string;
  action?: string;
  category?: string;
  result?: string;
  risk_level?: AuditLog["risk_level"] | "";
  resource_type?: string;
  request_id?: string;
  request_path?: string;
  date_from?: string;
  date_to?: string;
};

export type AuditLogPage = {
  items: AuditLog[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

export type SuspiciousActivity = {
  reason: string;
  title: string;
  description: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  action: string;
  actor_email: string | null;
  actor_role: string | null;
  ip_address: string | null;
  request_path: string | null;
  first_seen: string;
  last_seen: string;
  event_count: number;
};

export type AdminDashboardData = {
  generated_at: string;
  days: number;
  metrics: Array<{
    key: string;
    label: string;
    value: number;
    delta: number;
    delta_label: string;
  }>;
  activity_trend: Array<{
    date: string;
    label: string;
    audit_events: number;
    login_failures: number;
    submissions: number;
    ai_predictions: number;
    messages: number;
  }>;
  timeline: AuditLog[];
  suspicious_activities: SuspiciousActivity[];
  risk_distribution: Array<{
    risk_level: "LOW" | "MEDIUM" | "HIGH";
    count: number;
    percentage: number;
  }>;
  feature_operations: {
    submissions_by_class: Array<{ class_name: string; submission_count: number }>;
    assignment_statuses: Array<{ status: string; count: number }>;
  };
};

export function getAdminDashboard(token: string, days = 7): Promise<AdminDashboardData> {
  return apiRequest<AdminDashboardData>(`/admin/dashboard?days=${days}`, { token });
}

function buildAuditQuery(filters: AuditLogFilters, page: number, pageSize: number) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  Object.entries(filters).forEach(([key, value]) => {
    if (!value) return;
    if (key === "date_from") {
      params.set(key, `${value}T00:00:00`);
    } else if (key === "date_to") {
      params.set(key, `${value}T23:59:59`);
    } else {
      params.set(key, value);
    }
  });
  return params.toString();
}

export function getAuditLogs(token: string, filters: AuditLogFilters, page = 1, pageSize = 15): Promise<AuditLogPage> {
  return apiRequest<AuditLogPage>(`/admin/audit-logs?${buildAuditQuery(filters, page, pageSize)}`, { token });
}

export function getRelatedAuditLogs(token: string, eventId: string): Promise<AuditLog[]> {
  return apiRequest<AuditLog[]>(`/admin/audit-logs/${eventId}/related`, { token });
}
