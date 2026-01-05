# CubicleAlly: Your AI-Powered Career Advancement Partner

## What is CubicleAlly?

CubicleAlly is a B2C SaaS platform designed to help professionals navigate their career growth strategically. Unlike generic job boards or resume builders, CubicleAlly focuses on the critical gap between where you are now and where you want to be—providing data-driven insights, personalized skill development plans, and AI-powered tools to build a compelling case for your next promotion.

The platform leverages the U.S. Department of Labor's O*NET database (containing 900+ occupations and their associated skills) combined with Claude AI to deliver personalized, actionable career guidance.

---

## Core Features

### 1. Smart Occupation Matching

**The Problem:** Job titles vary wildly across companies. A "Growth Hacker" at one company might be a "Digital Marketing Manager" elsewhere.

**The Solution:** CubicleAlly's AI-powered title interpreter maps your actual job (no matter what your company calls it) to standardized O*NET occupations. This ensures accurate skill mapping and realistic career path suggestions.

- Search 900+ occupations with fuzzy matching
- AI interprets non-standard titles (e.g., "Chief Happiness Officer" → HR Manager)
- Handles plural/singular variations automatically

---

### 2. Gap Analysis & Readiness Score

**The Problem:** You know you want a promotion, but you don't know exactly what skills you're missing.

**The Solution:** CubicleAlly compares your current skills against the requirements for your target role, generating a clear picture of your strengths and gaps.

- **Readiness Score (0-100%):** An at-a-glance metric showing how prepared you are
- **Skill Gaps:** Prioritized list of skills you need to develop, ranked by importance
- **Strength Recognition:** Highlights where you already exceed requirements
- **Category Breakdown:** Skills organized by type (technical, soft skills, knowledge areas)

---

### 3. Evidence & Wins Tracking

**The Problem:** When promotion time comes, people struggle to remember their accomplishments from the past year.

**The Solution:** CubicleAlly provides a structured "wins journal" using the STAR format (Situation, Task, Action, Result) to capture accomplishments as they happen.

- **STAR Format Guidance:** Prompts ensure you capture impact, not just activities
- **AI Enhancement:** Claude improves your achievement statements with stronger action verbs and quantified impact
- **Skill Linking:** Each win connects to specific skills, building evidence for your gap analysis
- **Placeholder Detection:** AI identifies where you should add specific metrics (revenue, percentages, time saved)

---

### 4. AI-Powered Skill Coaching

**The Problem:** Knowing you need "strategic thinking" doesn't tell you *how* to develop it.

**The Solution:** For each skill gap, CubicleAlly's AI coach provides personalized development advice tailored to your industry and current role.

- Contextual recommendations based on your current/target occupation
- Actionable exercises and learning resources
- Industry-specific examples
- Confidence-building encouragement

---

### 5. Career Path Discovery

**The Problem:** Many professionals don't know what realistic next steps exist beyond their current role.

**The Solution:** CubicleAlly suggests promotion paths based on real-world career progressions, powered by O*NET occupational relationships and AI analysis.

- Pre-computed common career transitions (e.g., Marketing Coordinator → Marketing Manager → Director of Marketing)
- AI-generated suggestions when database paths don't exist
- Sector-specific recommendations
- Skill overlap analysis showing transferability

---

### 6. Promotion Case Document Generator

**The Problem:** Writing a compelling self-promotion document is awkward and time-consuming.

**The Solution:** CubicleAlly generates a professional promotion case document synthesizing all your tracked evidence, skills, and gap analysis progress.

- **Customizable Tone:** Professional, confident, or conversational
- **Audience Targeting:** Direct manager, skip-level, or HR
- **Multiple Formats:** Markdown view with PDF export
- **Version History:** Track iterations as you refine your case

---

### 7. Weekly Check-ins

**The Problem:** Career development gets deprioritized amid daily work demands.

**The Solution:** Optional weekly check-in reminders prompt you to log recent wins and update skill progress, maintaining momentum toward your goal.

- Configurable day and time
- Email reminders (when configured)
- Quick win logging interface
- Progress snapshots over time

---

## Technical Architecture

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| State Management | Zustand + React Query |
| Backend | Django 4.2 + Django REST Framework |
| Database | PostgreSQL (production) / SQLite (development) |
| AI | Anthropic Claude API |
| Task Queue | Celery + Redis |
| Authentication | JWT with django-allauth |

---

## Who Is CubicleAlly For?

- **Mid-career professionals** seeking their next promotion
- **Career changers** exploring adjacent occupations
- **High performers** who struggle to articulate their value
- **Managers** helping team members with career development
- **Anyone** who wants a data-driven approach to career growth

---

## Roadmap & Future Vision

CubicleAlly is an early-stage MVP with significant expansion potential:

- **Salary benchmarking** tied to occupation and skill levels
- **Interview preparation** with AI mock interviews
- **Network mapping** to identify career mentors
- **Team/enterprise version** for manager-led career planning
- **Integration with LinkedIn** for automated skill inference
- **Mobile app** for on-the-go win logging

---

## Getting Started

1. **Create an account** at the landing page
2. **Set your current role** using the occupation search
3. **Choose your target role** (where you want to be)
4. **Self-assess your skills** with the quick proficiency ratings
5. **View your gap analysis** to see your readiness score
6. **Start logging wins** as they happen
7. **Generate your promotion case** when you're ready to make your move

---

*CubicleAlly: Stop hoping for a promotion. Start building your case.*
