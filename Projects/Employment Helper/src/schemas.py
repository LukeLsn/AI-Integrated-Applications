from typing import List, Optional
from pydantic import BaseModel, Field

class JobPostingSchema(BaseModel):
    job_title: str = Field(description="The job title")
    company_name: str = Field(description="The company offering the role")
    location: str = Field(description="Job location or Remote/Hybrid status")
    posting_age_days: Optional[int] = Field(
        default=None, 
        description="Posting age in days calculated from provided reference date"
    )
    required_skills: List[str] = Field(description="Hard skills required")
    preferred_skills: List[str] = Field(description="Nice-to-have or preferred skills")
    experience_level: str = Field(description="Years of experience/seniority required")
    education_requirements: Optional[str] = Field(default=None, description="Degree or education required")
    salary_range: Optional[str] = Field(default=None, description="Salary range or 'not listed'")
    key_responsibilities: List[str] = Field(description="Main job duties")
    company_research: Optional[str] = Field(default=None, description="Research notes gathered about the company")

class ResumeSchema(BaseModel):
    hard_skills: List[str]
    soft_skills: List[str]
    work_experience: List[str]
    education: List[str]
    certifications: List[str]
    projects: List[str]
    keywords_domain_expertise: List[str]

class GapTriageItem(BaseModel):
    gap: str
    level: str = Field(description="Quick win, Short-term, Medium-term, or Long-term")
    actionable_advice: str

class GapAnalysisSchema(BaseModel):
    strengths: List[str]
    gaps: List[GapTriageItem]
    unique_value: List[str]

class LegitimacySignal(BaseModel):
    flag_type: str = Field(description="RED or GREEN")
    signal: str
    evidence: str

class LegitimacyAssessmentSchema(BaseModel):
    verdict: str = Field(description="GREEN (Legitimate), YELLOW (Caution), or RED (Suspicious/Fraudulent)")
    confidence_score: float
    signals: List[LegitimacySignal]
    recommendation: str