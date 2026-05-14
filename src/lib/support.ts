import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type SupportIssueType = 'bug' | 'data' | 'feature' | 'billing' | 'access' | 'other';
export type SupportTool = 'budget' | 'business_plan' | 'mortgage' | 'advisor' | 'chat' | 'account' | 'admin' | 'other';
export type SupportPriority = Database['public']['Enums']['support_priority'];
export type SupportStatus = Database['public']['Enums']['support_status'];

export type SupportTicket = Database['public']['Tables']['support_tickets']['Row'];
export type SupportTicketAdminView = Database['public']['Views']['support_tickets_admin_view']['Row'];
export type SupportTicketMessage = Database['public']['Tables']['support_ticket_messages']['Row'];
export type SupportTicketHistory = Database['public']['Tables']['support_ticket_history']['Row'];

export interface NewTicketInput {
  subject: string;
  description: string;
  issueType: SupportIssueType;
  tool: SupportTool;
  priority: SupportPriority;
  contextPath: string;
}

export async function listMyTickets(userId: string): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getTicket(ticketId: string): Promise<SupportTicket | null> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createTicket(userId: string, input: NewTicketInput): Promise<SupportTicket> {
  const { data, error } = await supabase
    .from('support_tickets')
    .insert({
      user_id: userId,
      subject: input.subject,
      description: input.description,
      issue_type: input.issueType,
      tool: input.tool,
      priority: input.priority,
      context_path: input.contextPath,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function listMessages(ticketId: string): Promise<SupportTicketMessage[]> {
  const { data, error } = await supabase
    .from('support_ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function postStudentMessage(
  ticketId: string,
  authorId: string,
  body: string,
): Promise<SupportTicketMessage> {
  const { data, error } = await supabase
    .from('support_ticket_messages')
    .insert({
      ticket_id: ticketId,
      author_id: authorId,
      author_role: 'student',
      body,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function postAdminMessage(
  ticketId: string,
  authorId: string,
  body: string,
): Promise<SupportTicketMessage> {
  const { data, error } = await supabase
    .from('support_ticket_messages')
    .insert({
      ticket_id: ticketId,
      author_id: authorId,
      author_role: 'admin',
      body,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

// Admin operations

export async function listAdminQueue(): Promise<SupportTicketAdminView[]> {
  const { data, error } = await supabase
    .from('support_tickets_admin_view')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function assignTicket(ticketId: string, adminId: string): Promise<void> {
  const { error } = await supabase.rpc('support_assign_ticket', {
    _ticket_id: ticketId,
    _admin_id: adminId,
  });
  if (error) throw error;
}

export async function updateTicketStatus(ticketId: string, status: SupportStatus): Promise<void> {
  const { error } = await supabase.rpc('support_update_status', {
    _ticket_id: ticketId,
    _status: status,
  });
  if (error) throw error;
}

export async function listTicketHistory(ticketId: string): Promise<SupportTicketHistory[]> {
  const { data, error } = await supabase
    .from('support_ticket_history')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Localized labels

export const issueLabels: Record<SupportIssueType, string> = {
  bug: 'תקלה',
  data: 'בעיה בנתונים',
  feature: 'בקשת שיפור',
  billing: 'חיוב/תשלום',
  access: 'גישה/אישור',
  other: 'אחר',
};

export const toolLabels: Record<SupportTool, string> = {
  budget: 'תקציב',
  business_plan: 'תוכנית עסקית',
  mortgage: 'משכנתא',
  advisor: 'AI Advisor',
  chat: 'צ׳אט',
  account: 'אזור אישי',
  admin: 'ממשק ניהול',
  other: 'אחר',
};

export const priorityLabels: Record<SupportPriority, string> = {
  low: 'נמוכה',
  normal: 'רגילה',
  high: 'גבוהה',
  urgent: 'דחופה',
};

export const statusLabels: Record<SupportStatus, string> = {
  open: 'פתוח',
  in_progress: 'בטיפול',
  awaiting_user: 'ממתין למשתמש',
  resolved: 'נפתר',
  closed: 'סגור',
};

export const openStatuses: SupportStatus[] = ['open', 'in_progress', 'awaiting_user'];
