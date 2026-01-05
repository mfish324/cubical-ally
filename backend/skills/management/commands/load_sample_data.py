"""
Load sample occupation and skill data for development.
This creates a realistic subset of O*NET data for testing.
"""
from decimal import Decimal

from django.core.management.base import BaseCommand

from skills.models import Occupation, Skill, OccupationSkill, PromotionPath, TitleAlias


class Command(BaseCommand):
    help = 'Load sample occupation and skill data for development'

    def handle(self, *args, **options):
        self.stdout.write('Loading sample data...')

        # Create skills
        skills = self._create_skills()
        self.stdout.write(f'Created {len(skills)} skills')

        # Create occupations
        occupations = self._create_occupations()
        self.stdout.write(f'Created {len(occupations)} occupations')

        # Create occupation-skill mappings
        self._create_occupation_skills(occupations, skills)
        self.stdout.write('Created occupation-skill mappings')

        # Create promotion paths
        self._create_promotion_paths(occupations)
        self.stdout.write('Created promotion paths')

        # Create title aliases
        self._create_title_aliases(occupations)
        self.stdout.write('Created title aliases')

        self.stdout.write(self.style.SUCCESS('Sample data loaded successfully!'))

    def _create_skills(self):
        """Create a set of common skills."""
        skills_data = [
            # Knowledge
            ('2.C.1.a', 'Administration and Management', 'Knowledge of business and management principles involved in strategic planning, resource allocation, and coordination of people and resources.', 'knowledge'),
            ('2.C.1.b', 'Customer and Personal Service', 'Knowledge of principles and processes for providing customer services.', 'knowledge'),
            ('2.C.1.c', 'Economics and Accounting', 'Knowledge of economic and accounting principles and practices.', 'knowledge'),
            ('2.C.1.d', 'Sales and Marketing', 'Knowledge of principles and methods for showing, promoting, and selling products or services.', 'knowledge'),
            ('2.C.1.e', 'Personnel and Human Resources', 'Knowledge of principles and procedures for personnel recruitment, selection, training, and compensation.', 'knowledge'),
            ('2.C.4.a', 'Computers and Electronics', 'Knowledge of computer hardware and software, including applications and programming.', 'knowledge'),
            ('2.C.7.a', 'English Language', 'Knowledge of the structure and content of the English language.', 'knowledge'),
            ('2.C.9.a', 'Psychology', 'Knowledge of human behavior and performance; individual differences in ability, personality, and interests.', 'knowledge'),

            # Skills
            ('2.A.1.a', 'Reading Comprehension', 'Understanding written sentences and paragraphs in work related documents.', 'skill'),
            ('2.A.1.b', 'Active Listening', 'Giving full attention to what other people are saying, taking time to understand the points being made.', 'skill'),
            ('2.A.1.c', 'Writing', 'Communicating effectively in writing as appropriate for the needs of the audience.', 'skill'),
            ('2.A.1.d', 'Speaking', 'Talking to others to convey information effectively.', 'skill'),
            ('2.A.2.a', 'Critical Thinking', 'Using logic and reasoning to identify the strengths and weaknesses of alternative solutions.', 'skill'),
            ('2.A.2.b', 'Active Learning', 'Understanding the implications of new information for both current and future problem-solving.', 'skill'),
            ('2.A.2.c', 'Learning Strategies', 'Selecting and using training/instructional methods and procedures appropriate for the situation.', 'skill'),
            ('2.A.2.d', 'Monitoring', 'Monitoring/assessing performance of yourself, other individuals, or organizations to make improvements.', 'skill'),
            ('2.B.1.a', 'Social Perceptiveness', 'Being aware of others\' reactions and understanding why they react as they do.', 'skill'),
            ('2.B.1.b', 'Coordination', 'Adjusting actions in relation to others\' actions.', 'skill'),
            ('2.B.1.c', 'Persuasion', 'Persuading others to change their minds or behavior.', 'skill'),
            ('2.B.1.d', 'Negotiation', 'Bringing others together and trying to reconcile differences.', 'skill'),
            ('2.B.1.e', 'Instructing', 'Teaching others how to do something.', 'skill'),
            ('2.B.3.a', 'Complex Problem Solving', 'Identifying complex problems and reviewing related information to develop and evaluate options.', 'skill'),
            ('2.B.4.e', 'Systems Analysis', 'Determining how a system should work and how changes in conditions will affect outcomes.', 'skill'),
            ('2.B.4.g', 'Judgment and Decision Making', 'Considering the relative costs and benefits of potential actions to choose the most appropriate one.', 'skill'),
            ('2.B.5.a', 'Time Management', 'Managing one\'s own time and the time of others.', 'skill'),
            ('2.B.5.b', 'Management of Financial Resources', 'Determining how money will be spent to get the work done.', 'skill'),
            ('2.B.5.d', 'Management of Personnel Resources', 'Motivating, developing, and directing people as they work.', 'skill'),

            # Abilities
            ('1.A.1.a.1', 'Oral Comprehension', 'The ability to listen to and understand information and ideas presented through spoken words.', 'ability'),
            ('1.A.1.a.2', 'Written Comprehension', 'The ability to read and understand information and ideas presented in writing.', 'ability'),
            ('1.A.1.b.1', 'Oral Expression', 'The ability to communicate information and ideas in speaking so others will understand.', 'ability'),
            ('1.A.1.b.2', 'Written Expression', 'The ability to communicate information and ideas in writing so others will understand.', 'ability'),
            ('1.A.1.c.1', 'Fluency of Ideas', 'The ability to come up with a number of ideas about a topic.', 'ability'),
            ('1.A.1.c.2', 'Originality', 'The ability to come up with unusual or clever ideas about a given topic or situation.', 'ability'),
            ('1.A.2.a.1', 'Problem Sensitivity', 'The ability to tell when something is wrong or is likely to go wrong.', 'ability'),
            ('1.A.2.a.2', 'Deductive Reasoning', 'The ability to apply general rules to specific problems to produce answers that make sense.', 'ability'),
            ('1.A.2.a.4', 'Inductive Reasoning', 'The ability to combine pieces of information to form general rules or conclusions.', 'ability'),

            # Tools/Technology
            ('T1', 'Data Analysis Tools', 'Proficiency with tools for analyzing and visualizing data like Excel, Tableau, or similar.', 'tool'),
            ('T2', 'Project Management Software', 'Experience with project management tools like Jira, Asana, or Monday.com.', 'tool'),
            ('T3', 'CRM Software', 'Experience with customer relationship management systems like Salesforce or HubSpot.', 'tool'),
            ('T4', 'Presentation Software', 'Proficiency with presentation tools like PowerPoint, Keynote, or Google Slides.', 'tool'),
            ('T5', 'Communication Platforms', 'Experience with collaboration tools like Slack, Teams, or Zoom.', 'tool'),
        ]

        skills = {}
        for element_id, name, description, category in skills_data:
            skill, _ = Skill.objects.update_or_create(
                element_id=element_id,
                defaults={
                    'name': name,
                    'description': description,
                    'category': category,
                }
            )
            skills[element_id] = skill

        return skills

    def _create_occupations(self):
        """Create sample occupations."""
        occupations_data = [
            # Marketing track
            ('13-1161.00', 'Market Research Analysts and Marketing Specialists', 'Research conditions in local, regional, national, or online markets. Gather information to determine potential sales of a product or service.', 3),
            ('11-2021.00', 'Marketing Managers', 'Plan, direct, or coordinate marketing policies and programs. Develop pricing strategies with the goal of maximizing profits.', 4),
            ('11-2022.00', 'Sales Managers', 'Plan, direct, or coordinate the actual distribution or movement of a product or service to the customer.', 4),
            ('11-1011.00', 'Chief Executives', 'Determine and formulate policies and provide overall direction of companies or organizations.', 5),

            # Software/Tech track
            ('15-1252.00', 'Software Developers', 'Research, design, and develop computer and network software or specialized utility programs.', 4),
            ('15-1253.00', 'Software Quality Assurance Analysts and Testers', 'Develop and execute software tests to identify software problems and their causes.', 3),
            ('11-3021.00', 'Computer and Information Systems Managers', 'Plan, direct, or coordinate activities in electronic data processing, information systems, and computer programming.', 4),
            ('15-2051.00', 'Data Scientists', 'Apply data mining, data modeling, and machine learning techniques to extract and analyze data.', 4),

            # Project Management track
            ('13-1082.00', 'Project Management Specialists', 'Analyze and coordinate the schedule, timeline, procurement, staffing, and budget of a project.', 4),
            ('11-9199.00', 'Project Managers', 'Plan, direct, or coordinate operations of public or private sector organizations.', 4),
            ('11-1021.00', 'General and Operations Managers', 'Plan, direct, or coordinate the operations of public or private sector organizations.', 4),

            # HR track
            ('13-1071.00', 'Human Resources Specialists', 'Recruit, screen, interview, or place individuals within an organization.', 3),
            ('11-3121.00', 'Human Resources Managers', 'Plan, direct, and coordinate human resource management activities of an organization.', 4),

            # Finance track
            ('13-2011.00', 'Accountants and Auditors', 'Examine, analyze, and interpret accounting records to prepare financial statements.', 4),
            ('13-2051.00', 'Financial Analysts', 'Conduct quantitative analyses of information involving investment programs.', 4),
            ('11-3031.00', 'Financial Managers', 'Plan, direct, or coordinate accounting, investing, banking, insurance, securities, and other financial activities.', 4),
        ]

        occupations = {}
        for code, title, description, job_zone in occupations_data:
            occ, _ = Occupation.objects.update_or_create(
                onet_soc_code=code,
                defaults={
                    'title': title,
                    'description': description,
                    'job_zone': job_zone,
                }
            )
            occupations[code] = occ

        return occupations

    def _create_occupation_skills(self, occupations, skills):
        """Create mappings between occupations and skills."""

        # Marketing Specialist skills
        marketing_specialist_skills = [
            ('2.C.1.d', 4.5, 5.0),  # Sales and Marketing
            ('2.A.1.c', 4.0, 4.5),  # Writing
            ('2.A.1.d', 4.0, 4.5),  # Speaking
            ('2.A.2.a', 4.0, 5.0),  # Critical Thinking
            ('2.B.3.a', 3.5, 4.5),  # Complex Problem Solving
            ('T1', 4.0, 4.0),  # Data Analysis Tools
            ('T3', 3.5, 4.0),  # CRM Software
            ('T4', 4.0, 4.5),  # Presentation Software
        ]

        # Marketing Manager skills (includes all Marketing Specialist skills plus more)
        marketing_manager_skills = [
            ('2.C.1.a', 4.5, 5.0),  # Administration and Management
            ('2.C.1.d', 4.5, 5.5),  # Sales and Marketing
            ('2.B.5.b', 4.0, 5.0),  # Management of Financial Resources
            ('2.B.5.d', 4.5, 5.0),  # Management of Personnel Resources
            ('2.B.1.c', 4.0, 5.0),  # Persuasion
            ('2.B.4.g', 4.5, 5.0),  # Judgment and Decision Making
            ('2.A.1.d', 4.5, 5.0),  # Speaking
            ('2.A.2.a', 4.5, 5.5),  # Critical Thinking
            ('T1', 3.5, 4.0),  # Data Analysis Tools
            ('T2', 4.0, 4.5),  # Project Management Software
        ]

        # Software Developer skills
        software_dev_skills = [
            ('2.C.4.a', 5.0, 6.0),  # Computers and Electronics
            ('2.A.2.a', 4.5, 5.5),  # Critical Thinking
            ('2.B.3.a', 4.5, 5.5),  # Complex Problem Solving
            ('1.A.2.a.2', 4.0, 5.0),  # Deductive Reasoning
            ('2.A.2.b', 4.0, 5.0),  # Active Learning
            ('2.A.1.a', 4.0, 4.5),  # Reading Comprehension
        ]

        # IT Manager skills
        it_manager_skills = [
            ('2.C.1.a', 4.5, 5.0),  # Administration and Management
            ('2.C.4.a', 4.0, 5.0),  # Computers and Electronics
            ('2.B.5.d', 4.5, 5.0),  # Management of Personnel Resources
            ('2.B.5.b', 4.0, 4.5),  # Management of Financial Resources
            ('2.B.4.g', 4.5, 5.0),  # Judgment and Decision Making
            ('2.B.1.b', 4.0, 5.0),  # Coordination
            ('T2', 4.5, 5.0),  # Project Management Software
        ]

        # Project Manager skills
        project_manager_skills = [
            ('2.C.1.a', 4.0, 4.5),  # Administration and Management
            ('2.B.5.a', 4.5, 5.0),  # Time Management
            ('2.B.5.b', 4.0, 4.5),  # Management of Financial Resources
            ('2.B.5.d', 4.0, 4.5),  # Management of Personnel Resources
            ('2.B.1.b', 4.5, 5.0),  # Coordination
            ('2.A.1.d', 4.0, 4.5),  # Speaking
            ('2.B.4.g', 4.0, 5.0),  # Judgment and Decision Making
            ('T2', 5.0, 5.5),  # Project Management Software
        ]

        skill_mappings = {
            '13-1161.00': marketing_specialist_skills,
            '11-2021.00': marketing_manager_skills,
            '15-1252.00': software_dev_skills,
            '11-3021.00': it_manager_skills,
            '13-1082.00': project_manager_skills,
        }

        for occ_code, skill_list in skill_mappings.items():
            if occ_code in occupations:
                occ = occupations[occ_code]
                for skill_id, importance, level in skill_list:
                    if skill_id in skills:
                        OccupationSkill.objects.update_or_create(
                            occupation=occ,
                            skill=skills[skill_id],
                            defaults={
                                'importance': Decimal(str(importance)),
                                'level': Decimal(str(level)),
                            }
                        )

    def _create_promotion_paths(self, occupations):
        """Create common promotion paths."""
        paths_data = [
            # Marketing track
            ('13-1161.00', '11-2021.00', 850, 0.85),  # Marketing Specialist → Marketing Manager
            ('13-1161.00', '11-2022.00', 320, 0.72),  # Marketing Specialist → Sales Manager
            ('11-2021.00', '11-1011.00', 180, 0.65),  # Marketing Manager → Chief Executive

            # Tech track
            ('15-1252.00', '11-3021.00', 450, 0.78),  # Software Developer → IT Manager
            ('15-1252.00', '15-2051.00', 280, 0.70),  # Software Developer → Data Scientist
            ('15-1253.00', '15-1252.00', 380, 0.75),  # QA Analyst → Software Developer

            # Project Management track
            ('13-1082.00', '11-9199.00', 620, 0.82),  # PM Specialist → Project Manager
            ('11-9199.00', '11-1021.00', 340, 0.70),  # Project Manager → Operations Manager

            # HR track
            ('13-1071.00', '11-3121.00', 480, 0.80),  # HR Specialist → HR Manager

            # Finance track
            ('13-2011.00', '11-3031.00', 380, 0.75),  # Accountant → Financial Manager
            ('13-2051.00', '11-3031.00', 420, 0.78),  # Financial Analyst → Financial Manager
        ]

        for source_code, target_code, frequency, confidence in paths_data:
            if source_code in occupations and target_code in occupations:
                PromotionPath.objects.update_or_create(
                    source_occupation=occupations[source_code],
                    target_occupation=occupations[target_code],
                    sector='',
                    region='US',
                    defaults={
                        'frequency': frequency,
                        'confidence_score': Decimal(str(confidence)),
                    }
                )

    def _create_title_aliases(self, occupations):
        """Create common job title aliases."""
        aliases_data = [
            # Marketing
            ('Marketing Coordinator', '13-1161.00'),
            ('Digital Marketing Specialist', '13-1161.00'),
            ('Content Marketing Specialist', '13-1161.00'),
            ('Marketing Associate', '13-1161.00'),
            ('Marketing Analyst', '13-1161.00'),
            ('Director of Marketing', '11-2021.00'),
            ('VP of Marketing', '11-2021.00'),
            ('Head of Marketing', '11-2021.00'),

            # Tech
            ('Software Engineer', '15-1252.00'),
            ('Full Stack Developer', '15-1252.00'),
            ('Frontend Developer', '15-1252.00'),
            ('Backend Developer', '15-1252.00'),
            ('Web Developer', '15-1252.00'),
            ('QA Engineer', '15-1253.00'),
            ('Test Engineer', '15-1253.00'),
            ('IT Director', '11-3021.00'),
            ('VP of Engineering', '11-3021.00'),
            ('CTO', '11-3021.00'),
            ('Data Analyst', '15-2051.00'),
            ('ML Engineer', '15-2051.00'),

            # Project Management
            ('Project Coordinator', '13-1082.00'),
            ('Program Manager', '11-9199.00'),
            ('Senior Project Manager', '11-9199.00'),
            ('PMO Manager', '11-9199.00'),

            # HR
            ('Recruiter', '13-1071.00'),
            ('Talent Acquisition Specialist', '13-1071.00'),
            ('HR Coordinator', '13-1071.00'),
            ('HR Director', '11-3121.00'),
            ('VP of HR', '11-3121.00'),
            ('Chief People Officer', '11-3121.00'),

            # Finance
            ('Staff Accountant', '13-2011.00'),
            ('Senior Accountant', '13-2011.00'),
            ('Finance Analyst', '13-2051.00'),
            ('FP&A Analyst', '13-2051.00'),
            ('CFO', '11-3031.00'),
            ('Controller', '11-3031.00'),

            # Executive
            ('CEO', '11-1011.00'),
            ('President', '11-1011.00'),
            ('COO', '11-1021.00'),
            ('Operations Director', '11-1021.00'),
        ]

        for alias, occ_code in aliases_data:
            if occ_code in occupations:
                TitleAlias.objects.update_or_create(
                    alias=alias,
                    canonical_occupation=occupations[occ_code],
                    defaults={'source': 'manual'}
                )
