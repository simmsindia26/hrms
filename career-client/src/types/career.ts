export interface Department {
  _id: string;
  name: string;
}

export interface Designation {
  _id: string;
  name: string;
}

export interface JobSkill {
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  required: boolean;
}

export interface Requirement {
  text: string;
}

export interface JobExperience {
  minimumYears: number;
  maximumYears: number | null;
  description?: string;
}

export interface JobEducation {
  minimumQualification?: string;
  preferredQualification?: string;
  fields?: string[];
}

export interface JobSalary {
  isDisclosed: boolean;
  minimum?: number | null;
  maximum?: number | null;
  currency?: string;
  period?: "hourly" | "monthly" | "yearly";
  description?: string;
}

export interface HiringProcess {
  title: string;
  description?: string;
  order?: number;
}

export interface JobOpening {
  _id: string;
  publicId: string;
  publicSlug: string;
  publicUrl?: string | null;

  title: string;
  jobCode?: string;

  department?: Department | null;
  designation?: Designation | null;

  shortDescription?: string;
  description: string;

  responsibilities: Requirement[];
  requirements: Requirement[];
  qualifications: Requirement[];
  preferredQualifications: Requirement[];

  skills: JobSkill[];

  experience: JobExperience;
  education: JobEducation;

  employmentType:
    | "full_time"
    | "part_time"
    | "contract"
    | "internship";

  workMode:
    | "office"
    | "hybrid"
    | "remote";

  location?: string;

  openings: number;

  salary: JobSalary;

  benefits: string[];

  hiringProcess: HiringProcess[];

  applicationEmail?: string;
  applicationInstructions?: string;

  publishedAt?: string | null;
  closingDate?: string | null;

  viewCount: number;
  shareCount: number;
  applicationCount: number;

  createdAt?: string;
}

export interface ApplicationPersonalDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  currentLocation?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface ApplicationProfessionalDetails {
  currentCompany?: string;
  currentDesignation?: string;
  totalExperience?: string;
  currentSalary?: string;
  expectedSalary?: string;
  noticePeriod?: string;
}

export interface ApplicationEducation {
  qualification?: string;
  institution?: string;
  field?: string;
  passingYear?: string;
  percentage?: string;
}

export interface ApplicationExperience {
  company?: string;
  designation?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface ApplicationLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  other?: string;
}

export interface JobApplicationPayload {
  personalDetails: ApplicationPersonalDetails;

  professionalDetails: ApplicationProfessionalDetails;

  education: ApplicationEducation[];

  experience: ApplicationExperience[];

  links: ApplicationLinks;

  coverLetter: string;

  skills: string[];

  consent: boolean;
}

export interface ApplicationResponse {
  applicationId: string;
  applicationNumber: string;
  jobId: string;
  jobTitle: string;
  status: string;
  submittedAt?: string;
}