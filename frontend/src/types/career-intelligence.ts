/**
 * TypeScript Interfaces for CareerBridge Career Intelligence, Skill Gap & Roadmap.
 */

export interface TargetRoleItem {
  id: string;
  role_name: string;
  category: string;
  description: string;
  core_skills_count: number;
  preferred_skills_count: number;
  is_curated: boolean;
  stages_count: number;
}

export interface SkillDiagnosis {
  skill_name: string;
  status: "already_proficient" | "needs_improvement" | "not_yet_learned" | "unknown_proficiency";
  student_proficiency: string | null;
  target_proficiency: string;
  is_verified: boolean;
  has_project_evidence: boolean;
  priority: string;
  category: string;
  action_recommendation: string;
}

export interface ConstellationNode {
  name: string;
  category: "languages" | "backend" | "cloud" | "data_ai" | "fundamentals" | "tools";
  status: "already_proficient" | "needs_improvement" | "not_yet_learned" | "unknown_proficiency";
  proficiency: string;
  target_proficiency: string;
  verified: boolean;
  has_project_evidence: boolean;
  priority: string;
  frequency: string;
}

export interface SkillGapResponse {
  analysis_id?: string;
  target_role: string;
  role_category: string;
  readiness_percentage: number;
  summary: string;
  counts: {
    total_benchmark_skills: number;
    already_proficient: number;
    needs_improvement: number;
    not_yet_learned: number;
    unknown_proficiency: number;
  };
  critical_missing_skills: SkillDiagnosis[];
  secondary_missing_skills: SkillDiagnosis[];
  already_proficient_skills: SkillDiagnosis[];
  needs_improvement_skills: SkillDiagnosis[];
  not_yet_learned_skills: SkillDiagnosis[];
  unknown_proficiency_skills: SkillDiagnosis[];
  all_skills_diagnosed: SkillDiagnosis[];
  constellation_nodes: ConstellationNode[];
  disclaimer: string;
}

export interface RoadmapResource {
  title: string;
  url: string;
  type: string;
}

export interface RoadmapMilestoneItem {
  id: number;
  stage_number: number;
  week_number: number;
  milestone_title: string;
  skill_name: string;
  priority: string;
  estimated_learning_time: string;
  description: string;
  learning_resources: RoadmapResource[];
  practical_exercise: string;
  completion_status: "not_started" | "in_progress" | "completed";
  is_completed: boolean;
  completed_at: string | null;
  student_notes: string | null;
  evidence_url: string | null;
  evidence_notes: string | null;
  is_verified: boolean;
  verification_type: string;
}

export interface CareerRoadmapResponse {
  id: string;
  title: string;
  target_role: string;
  total_weeks: number;
  status: string;
  total_milestones: number;
  completed_milestones: number;
  progress_percentage: number;
  created_at: string | null;
  items: RoadmapMilestoneItem[];
  disclaimer: string;
}

export interface CRICategoryScore {
  name: string;
  earned: number;
  max: number;
  percentage: number;
  weight: string;
}

export interface CRIMissingData {
  category: string;
  points_missed: number;
  reason: string;
  unlock_action: string;
}

export interface CRIImprovementOpportunity {
  title: string;
  potential_gain: number;
  difficulty: "Easy" | "Medium" | "Advanced";
  category: string;
  description: string;
}

export interface CareerReadinessResponse {
  overall_score: number;
  tier: string;
  tier_color: string;
  category_scores: {
    technical_skills: CRICategoryScore;
    projects: CRICategoryScore;
    resume_quality: CRICategoryScore;
    academic_eligibility: CRICategoryScore;
    interview_preparation: CRICategoryScore;
    certifications_experience: CRICategoryScore;
  };
  missing_data: CRIMissingData[];
  improvement_opportunities: CRIImprovementOpportunity[];
  formula: string;
  weights: Record<string, number>;
  calculated_at: string;
  methodology_note: string;
}

export interface CRIHistoryItem {
  id: string;
  overall_score: number;
  technical_skills_score: number;
  projects_score: number;
  resume_quality_score: number;
  academic_eligibility_score: number;
  interview_prep_score: number;
  certifications_score: number;
  calculated_at: string;
}

