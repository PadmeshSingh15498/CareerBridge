export interface StudentReadinessBreakdown {
  resume_health: number;
  skill_coverage: number;
  interview_preparedness: number;
  academic_eligibility: number;
}

export interface StudentProfileCompletion {
  percentage: number;
  missing_items: string[];
}

export interface ResumeHealthInfo {
  ats_score: number;
  sections_score: number;
  skills_score: number;
  metrics_score: number;
  formatting_score: number;
  actionable_tips: string[];
  file_name?: string;
}

export interface RecommendedJobItem {
  id: string;
  title: string;
  company_name: string;
  company_logo?: string;
  location: string;
  workplace_type: string;
  salary_range: string;
  match_percentage: number;
  deadline: string;
  top_matching_skills: string[];
}

export interface ActiveApplicationItem {
  id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  status: string;
  composite_match_score: number;
  applied_at: string;
}

export interface UpcomingInterviewItem {
  id: string;
  company_name: string;
  round_name: string;
  scheduled_start: string;
  interviewer_name?: string;
  meeting_link?: string;
  venue?: string;
  status: string;
}

export interface SkillGapSummary {
  target_role: string;
  readiness_percentage: number;
  critical_missing_skills: string[];
  secondary_missing_skills: string[];
  verified_skills: string[];
  summary: string;
}

export interface RoadmapMilestoneItem {
  week_number: number;
  milestone_title: string;
  description: string;
  suggested_project?: string;
  is_completed: boolean;
}

export interface StudentRoadmapPreview {
  title: string;
  target_role: string;
  current_week: number;
  total_weeks: number;
  progress_percentage: number;
  milestones: RoadmapMilestoneItem[];
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  badge: string;
  badge_variant: "lime" | "orange" | "neutral";
}

export interface StudentQuickStats {
  applications_count: number;
  interviews_count: number;
  offers_count: number;
  verified_skills_count: number;
}

export interface StudentDashboardData {
  student_name: string;
  email: string;
  roll_number: string;
  department: string;
  institution: string;
  cgpa: number;
  placement_status: string;
  career_readiness_score: number;
  readiness_breakdown: StudentReadinessBreakdown;
  profile_completion: StudentProfileCompletion;
  resume_health: ResumeHealthInfo;
  recommended_jobs: RecommendedJobItem[];
  active_applications: ActiveApplicationItem[];
  upcoming_interviews: UpcomingInterviewItem[];
  skill_gap_summary: SkillGapSummary;
  career_roadmap: StudentRoadmapPreview;
  recent_activities: ActivityItem[];
  quick_stats: StudentQuickStats;
  is_demo?: boolean;
}

// Recruiter Dashboard Types
export interface RecruiterStats {
  active_jobs_count: number;
  total_applicants_count: number;
  shortlisted_count: number;
  interviews_scheduled_count: number;
  offers_extended_count: number;
}

export interface RecruiterPipelineStages {
  applied: number;
  screening: number;
  shortlisted: number;
  technical_round: number;
  hr_round: number;
  offered: number;
  rejected: number;
}

export interface RecruiterJobItem {
  id: string;
  title: string;
  job_type: string;
  location: string;
  workplace_type: string;
  salary_range: string;
  applicants_count: number;
  vacancies: number;
  status: string;
  deadline: string;
}

export interface RecruiterApplicantItem {
  id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_department: string;
  candidate_cgpa: number;
  job_title: string;
  composite_match_score: number;
  current_status: string;
  applied_at: string;
}

export interface JobPerformanceMetrics {
  total_views: number;
  application_rate_percent: number;
  shortlist_rate_percent: number;
  interview_conversion_percent: number;
}

export interface CandidateMatchInsight {
  candidate_name: string;
  job_title: string;
  department: string;
  cgpa: number;
  match_score: number;
  top_strengths: string[];
  status: string;
}

export interface RecruiterDashboardData {
  recruiter_name: string;
  company_name: string;
  company_logo?: string;
  designation: string;
  stats: RecruiterStats;
  pipeline: RecruiterPipelineStages;
  active_jobs: RecruiterJobItem[];
  recent_applications: RecruiterApplicantItem[];
  job_performance: JobPerformanceMetrics;
  candidate_matching_insights: CandidateMatchInsight[];
  upcoming_interviews: UpcomingInterviewItem[];
  is_demo?: boolean;
}

// Admin / Placement Officer Types
export interface AdminOverviewStats {
  total_students: number;
  eligible_students: number;
  placed_students: number;
  unplaced_students: number;
  placement_rate_percent: number;
  active_companies: number;
  active_job_openings: number;
  total_applications: number;
  average_package_lpa: number;
  highest_package_lpa: number;
}

export interface DepartmentPlacementStat {
  department_name: string;
  total_students: number;
  placed_students: number;
  unplaced_students: number;
  placement_rate_percent: number;
  average_cgpa: number;
}

export interface CompanyRecruitmentStat {
  company_name: string;
  logo_url?: string;
  industry: string;
  openings_count: number;
  hired_count: number;
  average_ctc_lpa: number;
  highest_ctc_lpa: number;
  status: string;
}

export interface PlacementDriveItem {
  id: string;
  title: string;
  company_name: string;
  drive_date: string;
  registration_deadline: string;
  min_cgpa: number;
  allowed_departments: string[];
  selection_rounds: string[];
  venue: string;
  status: string;
}

export interface PendingActionsOverview {
  pending_recruiters_count: number;
  pending_jobs_count: number;
}

export interface AdminDashboardData {
  institution_name: string;
  academic_year: number;
  stats: AdminOverviewStats;
  department_stats: DepartmentPlacementStat[];
  company_recruitment: CompanyRecruitmentStat[];
  placement_drives: PlacementDriveItem[];
  pending_actions: PendingActionsOverview;
  recent_activity: ActivityItem[];
  is_demo?: boolean;
}

