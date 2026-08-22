"""
Agent 1: Resume Parser
Extracts role, experience, skills, industry, companies, projects, and resume summary
using Gemini AI with heuristic fallbacks.
"""

import os
import re
import json
import traceback
from typing import Dict, List

class ResumeParser:
    """Parses resume text and extracts structured information using Gemini AI and fallback heuristics"""

    # Common job roles/titles for fallback matching
    ROLE_KEYWORDS = {
        'full stack software engineer': 'Full Stack Developer',
        'full stack developer': 'Full Stack Developer',
        'software engineer': 'Software Engineer',
        'software developer': 'Software Engineer',
        'frontend developer': 'Frontend Dev',
        'frontend engineer': 'Frontend Dev',
        'backend developer': 'Backend Dev',
        'backend engineer': 'Backend Dev',
        'product manager': 'Product Manager',
        'data scientist': 'Data Scientist',
        'data engineer': 'Data Engineer',
        'devops engineer': 'DevOps Engineer',
        'site reliability engineer': 'SRE',
        'cloud architect': 'Cloud Architect',
        'machine learning engineer': 'ML Engineer',
        'ai engineer': 'AI Engineer',
        'ux designer': 'UX Designer',
        'ui designer': 'UI Designer',
        'project manager': 'Project Manager',
        'business analyst': 'Business Analyst',
        'qa engineer': 'QA Engineer',
        'test engineer': 'QA Engineer',
        'mobile developer': 'Mobile Developer',
        'ios developer': 'iOS Developer',
        'android developer': 'Android Developer',
        'manager': 'Engineering Manager',
        'lead': 'Team Lead',
        'director': 'Director of Engineering',
    }

    # Common industry keywords for fallback
    INDUSTRY_KEYWORDS = {
        'fintech': 'Fintech',
        'financial': 'Fintech',
        'banking': 'Fintech',
        'healthcare': 'Healthcare',
        'health tech': 'Healthcare',
        'ecommerce': 'E-commerce',
        'e-commerce': 'E-commerce',
        'retail': 'E-commerce',
        'saas': 'SaaS',
        'software as a service': 'SaaS',
        'ai': 'AI/ML',
        'machine learning': 'AI/ML',
        'deep learning': 'AI/ML',
        'blockchain': 'Blockchain',
        'crypto': 'Blockchain',
        'gaming': 'Gaming',
        'game dev': 'Gaming',
        'social media': 'Social Media',
        'enterprise': 'Enterprise Tech',
        'cybersecurity': 'Cybersecurity',
        'security': 'Cybersecurity',
        'cloud': 'Cloud Infrastructure',
        'edtech': 'EdTech',
        'education': 'EdTech',
        'startup': 'Startup Tech',
    }

    # Expanded skills keywords for fallback
    SKILL_KEYWORDS = {
        'python': 'Python',
        'javascript': 'JavaScript',
        'typescript': 'TypeScript',
        'react': 'React',
        'react native': 'React Native',
        'next.js': 'Next.js',
        'nextjs': 'Next.js',
        'node.js': 'Node.js',
        'nodejs': 'Node.js',
        'express': 'Express.js',
        'vue': 'Vue.js',
        'angular': 'Angular',
        'html': 'HTML5',
        'css': 'CSS3',
        'tailwind': 'Tailwind CSS',
        'fastapi': 'FastAPI',
        'flask': 'Flask',
        'django': 'Django',
        'java': 'Java',
        'spring': 'Spring Boot',
        'c++': 'C++',
        'c#': 'C#',
        '.net': '.NET',
        'golang': 'Go',
        'go': 'Go',
        'rust': 'Rust',
        'sql': 'SQL',
        'postgresql': 'PostgreSQL',
        'postgres': 'PostgreSQL',
        'mysql': 'MySQL',
        'mongodb': 'MongoDB',
        'redis': 'Redis',
        'elasticsearch': 'Elasticsearch',
        'graphql': 'GraphQL',
        'rest api': 'REST APIs',
        'microservices': 'Microservices',
        'aws': 'AWS',
        'gcp': 'Google Cloud',
        'azure': 'Azure',
        'docker': 'Docker',
        'kubernetes': 'Kubernetes',
        'terraform': 'Terraform',
        'ci/cd': 'CI/CD',
        'git': 'Git',
        'github': 'GitHub',
        'jira': 'Jira',
        'pytorch': 'PyTorch',
        'tensorflow': 'TensorFlow',
        'scikit-learn': 'Scikit-Learn',
        'pandas': 'Pandas',
        'numpy': 'NumPy',
        'data analysis': 'Data Analysis',
        'analytics': 'Analytics',
        'system design': 'System Design',
        'agile': 'Agile/Scrum',
        'scrum': 'Scrum',
        'leadership': 'Leadership',
        'communication': 'Communication',
        'problem solving': 'Problem Solving',
        'product strategy': 'Product Strategy',
        'project management': 'Project Management',
    }

    @staticmethod
    def _parse_with_gemini(text: str) -> Dict:
        """Parse resume text using Google Gemini AI"""
        import google.generativeai as genai
        
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("No Gemini API key available")
            
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")

        prompt = f"""
You are an expert HR resume scanner and tech recruiter.
Analyze the following resume text and extract structured candidate information into valid JSON format.

RESUME TEXT:
\"\"\"
{text[:4000]}
\"\"\"

Return ONLY a JSON object with EXACTLY the following keys (no markdown wrapping, no text before or after):
{{
  "name": "Candidate Name (or 'Candidate' if not found)",
  "role": "Primary Job Title/Role (e.g., Full Stack Engineer, Senior Product Manager, Data Scientist)",
  "seniority_level": "Entry-Level | Junior | Mid-Level | Senior | Lead | Executive",
  "years_experience": 5,
  "industry": "Primary Industry/Domain (e.g. Fintech, SaaS, Healthcare, AI/ML, E-commerce, Cloud Infrastructure)",
  "skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5", "Skill6"],
  "companies": ["Company1", "Company2"],
  "projects": ["Brief description of key project 1", "Brief description of key project 2"],
  "education": ["Degree/Institution if mentioned"],
  "resume_summary": "A 2-3 sentence overview summarizing candidate background, primary tech stack/domain, key projects, and strengths based on the resume."
}}
"""
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean markdown codeblocks if present
        if response_text.startswith("```"):
            lines = response_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            response_text = "\n".join(lines).strip()
            
        data = json.loads(response_text)
        
        # Ensure fallback defaults if any field is missing
        return {
            "name": str(data.get("name") or "Candidate"),
            "role": str(data.get("role") or "Software Professional"),
            "seniority_level": str(data.get("seniority_level") or "Mid-Level"),
            "years_experience": int(data.get("years_experience") or 2),
            "industry": str(data.get("industry") or "General Tech"),
            "skills": [str(s) for s in data.get("skills", []) if s][:10],
            "companies": [str(c) for c in data.get("companies", []) if c][:5],
            "projects": [str(p) for p in data.get("projects", []) if p][:5],
            "education": [str(e) for e in data.get("education", []) if e][:3],
            "resume_summary": str(data.get("resume_summary") or "").strip(),
        }

    @staticmethod
    def _parse_heuristic(text: str) -> Dict:
        """Fallback heuristic parser using regex and pattern matching"""
        text_lower = text.lower()
        
        # Role extraction
        role = "Software Professional"
        for keyword, r_name in ResumeParser.ROLE_KEYWORDS.items():
            if keyword in text_lower:
                role = r_name
                break

        # Years experience extraction
        years = 0
        patterns = [
            r'(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience',
            r'(?:experience|worked|employed|total|current).*?(\d+)\s+(?:years?|yrs?)',
        ]
        for pattern in patterns:
            match = re.search(pattern, text_lower)
            if match:
                try:
                    years = int(match.group(1))
                    years = min(years, 30)
                    break
                except Exception:
                    pass
        
        if years == 0:
            # Infer from year ranges like 2019 - 2023 or 2020 - Present
            year_matches = sorted([int(y) for y in re.findall(r'\b(20\d{2})\b', text)])
            if len(year_matches) >= 2:
                years = max(1, year_matches[-1] - year_matches[0])
            elif len(year_matches) == 1:
                years = max(1, 2026 - year_matches[0])

        # Seniority level
        if years >= 10:
            seniority = "Senior"
        elif years >= 5:
            seniority = "Mid-Level"
        elif years >= 2:
            seniority = "Junior"
        else:
            seniority = "Entry-Level"

        # Skills extraction
        skills = []
        for kw, s_name in ResumeParser.SKILL_KEYWORDS.items():
            if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
                skills.append(s_name)
        skills = list(dict.fromkeys(skills))[:10]

        # Industry extraction
        industry = "General Tech"
        for kw, ind in ResumeParser.INDUSTRY_KEYWORDS.items():
            if kw in text_lower:
                industry = ind
                break

        # Company extraction
        company_patterns = [
            r'(?:at|worked at|company:?|employed by)\s+([A-Z][A-Za-z0-9\s]{2,20})',
            r'\b(Google|Amazon|Meta|Microsoft|Apple|Netflix|Uber|Airbnb|Stripe|Dropbox|IBM|Oracle|Salesforce|TCS|Infosys|Wipro|Accenture)\b'
        ]
        companies = []
        for pattern in company_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for m in matches:
                c_str = m if isinstance(m, str) else m[0]
                c_clean = c_str.strip('.,;: ')
                if len(c_clean) > 2 and c_clean not in companies:
                    companies.append(c_clean)
        companies = companies[:5]

        # Build fallback summary
        summary_skills = ", ".join(skills[:4]) if skills else "software development"
        summary_comp = f" with experience at {', '.join(companies[:2])}" if companies else ""
        resume_summary = f"{seniority} {role} with approximately {years} years of experience{summary_comp}. Core skills include {summary_skills}."

        return {
            "name": "Candidate",
            "role": role,
            "seniority_level": seniority,
            "years_experience": years,
            "industry": industry,
            "skills": skills,
            "companies": companies,
            "projects": [],
            "education": [],
            "resume_summary": resume_summary,
        }

    @staticmethod
    def parse(resume_text: str) -> Dict:
        """
        Main method to parse resume text into structured profile
        Attempts Gemini AI first, falls back to heuristic parsing if API fails.
        """
        if not resume_text or len(resume_text.strip()) < 10:
            return ResumeParser._parse_heuristic("")

        try:
            profile = ResumeParser._parse_with_gemini(resume_text)
            # Make sure raw resume text is retained for question generation context
            profile["raw_text"] = resume_text[:5000]
            return profile
        except Exception as e:
            print(f"[ResumeParser] Gemini parsing failed/skipped: {e}. Falling back to heuristics.")
            profile = ResumeParser._parse_heuristic(resume_text)
            profile["raw_text"] = resume_text[:5000]
            return profile
