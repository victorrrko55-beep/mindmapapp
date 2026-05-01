export type ProjectStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "READY_FOR_REVIEW"
  | "FINALIZED";

export type BriefStatus = "DRAFT" | "FINAL";

export type Confidence = "LOW" | "MEDIUM" | "HIGH";

export type Project = {
  id: string;
  ownerId: string;
  name: string;
  companyName: string;
  projectType: string;
  description?: string | null;
  status: ProjectStatus;
  currentVersionId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Assumption = {
  id: string;
  briefVersionId: string;
  text: string;
  confidence: Confidence;
  createdAt: string;
  updatedAt: string;
};
