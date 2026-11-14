import 'dotenv/config';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const prisma = new PrismaClient();

const JOBS = [
  { title: 'Senior React Engineer', company: 'Flipkart', location: 'Bengaluru', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'SENIOR', salaryMin: 2800000, salaryMax: 4200000, skills: ['React', 'TypeScript', 'Redux'], description: 'Build buyer-facing storefronts and internal tools. Strong React + TypeScript required.' },
  { title: 'Backend Node.js Developer', company: 'Razorpay', location: 'Bengaluru', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'MID', salaryMin: 1800000, salaryMax: 2800000, skills: ['Node.js', 'Express', 'MySQL'], description: 'Own payment APIs, webhooks, and reliability of merchant dashboards.' },
  { title: 'Full Stack Engineer', company: 'Zerodha', location: 'Bengaluru', jobType: 'FULL_TIME', workMode: 'ONSITE', experienceLevel: 'MID', salaryMin: 2000000, salaryMax: 3200000, skills: ['JavaScript', 'Python', 'PostgreSQL'], description: 'Ship trading UI and supporting services. Low-latency mindset.' },
  { title: 'Frontend Developer', company: 'Swiggy', location: 'Bengaluru', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'JUNIOR', salaryMin: 1200000, salaryMax: 1800000, skills: ['React', 'CSS', 'JavaScript'], description: 'Consumer app web surfaces. Pixel-level care and performance budgets.' },
  { title: 'DevOps Engineer', company: 'PhonePe', location: 'Bengaluru', jobType: 'FULL_TIME', workMode: 'ONSITE', experienceLevel: 'SENIOR', salaryMin: 2500000, salaryMax: 4000000, skills: ['AWS', 'Kubernetes', 'Terraform'], description: 'Platform reliability for UPI-scale traffic.' },
  { title: 'Data Analyst', company: 'CRED', location: 'Bengaluru', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'MID', salaryMin: 1400000, salaryMax: 2200000, skills: ['SQL', 'Python', 'Tableau'], description: 'Growth and credit-risk reporting. Strong SQL is a must.' },
  { title: 'QA Automation Engineer', company: 'Freshworks', location: 'Chennai', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'MID', salaryMin: 1200000, salaryMax: 2000000, skills: ['Playwright', 'Jest', 'CI'], description: 'Own end-to-end suites for SaaS product lines.' },
  { title: 'Product Designer', company: 'Zoho', location: 'Chennai', jobType: 'FULL_TIME', workMode: 'ONSITE', experienceLevel: 'MID', salaryMin: 1000000, salaryMax: 1800000, skills: ['Figma', 'UX', 'Prototyping'], description: 'Design dense B2B workflows that stay simple.' },
  { title: 'Java Backend Engineer', company: 'Amazon', location: 'Hyderabad', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'SENIOR', salaryMin: 3000000, salaryMax: 5000000, skills: ['Java', 'AWS', 'Distributed Systems'], description: 'High-throughput services for seller experience.' },
  { title: 'iOS Developer', company: 'Paytm', location: 'Noida', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'MID', salaryMin: 1600000, salaryMax: 2600000, skills: ['Swift', 'UIKit', 'Combine'], description: 'Payments and merchant apps on iOS.' },
  { title: 'Android Engineer', company: 'ShareChat', location: 'Bengaluru', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'MID', salaryMin: 1800000, salaryMax: 2800000, skills: ['Kotlin', 'Jetpack', 'Coroutines'], description: 'Feed and creator tools on Android.' },
  { title: 'ML Engineer', company: 'Meesho', location: 'Bengaluru', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'SENIOR', salaryMin: 2800000, salaryMax: 4500000, skills: ['Python', 'PyTorch', 'NLP'], description: 'Ranking and recommendations for social commerce.' },
  { title: 'React Native Developer', company: 'Dunzo', location: 'Bengaluru', jobType: 'CONTRACT', workMode: 'REMOTE', experienceLevel: 'MID', salaryMin: 1500000, salaryMax: 2200000, skills: ['React Native', 'TypeScript', 'Redux'], description: 'Six-month contract on logistics rider app.' },
  { title: 'Security Engineer', company: 'Groww', location: 'Bengaluru', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'SENIOR', salaryMin: 2600000, salaryMax: 4000000, skills: ['AppSec', 'OWASP', 'Go'], description: 'Application security reviews and platform hardening.' },
  { title: 'Technical Writer', company: 'Postman', location: 'Bengaluru', jobType: 'FULL_TIME', workMode: 'REMOTE', experienceLevel: 'MID', salaryMin: 1200000, salaryMax: 1800000, skills: ['Docs', 'API', 'Markdown'], description: 'Developer docs and tutorials for the API platform.' },
  { title: 'SRE', company: 'Google', location: 'Hyderabad', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'SENIOR', salaryMin: 3500000, salaryMax: 6000000, skills: ['SRE', 'GCP', 'Linux'], description: 'Keep production SLOs honest. On-call included.' },
  { title: 'Business Analyst Intern', company: 'Deloitte', location: 'Mumbai', jobType: 'INTERNSHIP', workMode: 'HYBRID', experienceLevel: 'INTERN', salaryMin: 300000, salaryMax: 500000, skills: ['Excel', 'SQL', 'PowerPoint'], description: '6-month internship supporting digital transformation projects.' },
  { title: 'HR Operations Associate', company: 'Infosys', location: 'Pune', jobType: 'FULL_TIME', workMode: 'ONSITE', experienceLevel: 'JUNIOR', salaryMin: 500000, salaryMax: 800000, skills: ['HRIS', 'Excel', 'Communication'], description: 'Employee lifecycle operations for large accounts.' },
  { title: 'Cloud Architect', company: 'TCS', location: 'Pune', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'LEAD', salaryMin: 2800000, salaryMax: 4200000, skills: ['Azure', 'Architecture', 'Terraform'], description: 'Solution architecture for enterprise cloud migrations.' },
  { title: 'Python Developer', company: 'Thoughtworks', location: 'Pune', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'MID', salaryMin: 1600000, salaryMax: 2500000, skills: ['Python', 'Django', 'pytest'], description: 'Pair-programming, TDD, and domain-driven services.' },
  { title: 'UI Engineer', company: 'Adobe', location: 'Noida', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'MID', salaryMin: 2000000, salaryMax: 3200000, skills: ['JavaScript', 'CSS', 'Accessibility'], description: 'Creative Cloud web surfaces with a11y as a first-class requirement.' },
  { title: 'Data Engineer', company: 'Jio', location: 'Mumbai', jobType: 'FULL_TIME', workMode: 'ONSITE', experienceLevel: 'MID', salaryMin: 1800000, salaryMax: 2800000, skills: ['Spark', 'Airflow', 'SQL'], description: 'Pipelines for subscriber and content analytics.' },
  { title: 'Golang Engineer', company: 'Hasura', location: 'Bengaluru', jobType: 'FULL_TIME', workMode: 'REMOTE', experienceLevel: 'SENIOR', salaryMin: 3000000, salaryMax: 4800000, skills: ['Go', 'GraphQL', 'Postgres'], description: 'Core engine work. Distributed systems experience required.' },
  { title: 'Customer Success Engineer', company: 'Chargebee', location: 'Chennai', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'MID', salaryMin: 1200000, salaryMax: 1900000, skills: ['SaaS', 'SQL', 'APIs'], description: 'Help billing customers integrate and adopt the product.' },
  { title: 'Blockchain Developer', company: 'Polygon', location: 'Remote', jobType: 'FULL_TIME', workMode: 'REMOTE', experienceLevel: 'SENIOR', salaryMin: 3200000, salaryMax: 5500000, skills: ['Solidity', 'Go', 'Ethereum'], description: 'Protocol and tooling for scaling Ethereum.' },
  { title: 'Content Strategist', company: 'BYJU\'S', location: 'Bengaluru', jobType: 'PART_TIME', workMode: 'REMOTE', experienceLevel: 'MID', salaryMin: 600000, salaryMax: 1000000, skills: ['Content', 'SEO', 'EdTech'], description: 'Part-time content strategy for K-12 products.' },
  { title: 'Network Engineer', company: 'Airtel', location: 'Gurgaon', jobType: 'FULL_TIME', workMode: 'ONSITE', experienceLevel: 'MID', salaryMin: 1000000, salaryMax: 1700000, skills: ['Networking', 'BGP', 'Linux'], description: 'Core IP network operations.' },
  { title: 'Salesforce Developer', company: 'Accenture', location: 'Hyderabad', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'MID', salaryMin: 900000, salaryMax: 1600000, skills: ['Salesforce', 'Apex', 'LWC'], description: 'CRM customisation for enterprise clients.' },
  { title: 'Engineering Manager', company: 'Atlassian', location: 'Bengaluru', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'LEAD', salaryMin: 4500000, salaryMax: 7000000, skills: ['Leadership', 'Jira', 'Coaching'], description: 'Lead a Jira Cloud squad. Hiring and delivery ownership.' },
  { title: 'Support Engineer', company: 'Freshdesk', location: 'Chennai', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'JUNIOR', salaryMin: 600000, salaryMax: 1000000, skills: ['Support', 'SQL', 'Communication'], description: 'L2 product support for global customers.' },
  { title: 'Rust Engineer', company: 'Solana Labs', location: 'Remote', jobType: 'CONTRACT', workMode: 'REMOTE', experienceLevel: 'SENIOR', salaryMin: 3500000, salaryMax: 6000000, skills: ['Rust', 'Systems', 'Networking'], description: 'Contract work on validator and client performance.' },
  { title: 'Marketing Analyst', company: 'Nykaa', location: 'Mumbai', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'JUNIOR', salaryMin: 800000, salaryMax: 1300000, skills: ['Analytics', 'SQL', 'Excel'], description: 'Campaign measurement and funnel reporting.' },
  { title: 'Embedded Software Engineer', company: 'Bosch', location: 'Coimbatore', jobType: 'FULL_TIME', workMode: 'ONSITE', experienceLevel: 'MID', salaryMin: 1000000, salaryMax: 1800000, skills: ['C', 'RTOS', 'Automotive'], description: 'Firmware for automotive ECUs.' },
  { title: 'Site Reliability Intern', company: 'Microsoft', location: 'Hyderabad', jobType: 'INTERNSHIP', workMode: 'HYBRID', experienceLevel: 'INTERN', salaryMin: 400000, salaryMax: 700000, skills: ['Linux', 'Python', 'Azure'], description: 'Summer internship with Azure SRE teams.' },
  { title: 'Vue.js Frontend Developer', company: 'GitLab', location: 'Remote', jobType: 'FULL_TIME', workMode: 'REMOTE', experienceLevel: 'MID', salaryMin: 2200000, salaryMax: 3400000, skills: ['Vue', 'JavaScript', 'GraphQL'], description: 'Fully remote. Improve DevSecOps UI flows.' },
  { title: 'People Partner', company: 'Unacademy', location: 'Bengaluru', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'MID', salaryMin: 1100000, salaryMax: 1700000, skills: ['HR', 'Coaching', 'Analytics'], description: 'HRBP for engineering and product orgs.' },
  { title: 'ETL Developer', company: 'Mu Sigma', location: 'Bengaluru', jobType: 'CONTRACT', workMode: 'ONSITE', experienceLevel: 'MID', salaryMin: 900000, salaryMax: 1400000, skills: ['ETL', 'Informatica', 'SQL'], description: '12-month contract building warehouse jobs.' },
  { title: 'Cybersecurity Analyst', company: 'Wipro', location: 'Pune', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'JUNIOR', salaryMin: 700000, salaryMax: 1200000, skills: ['SOC', 'SIEM', 'Networking'], description: 'SOC monitoring and incident triage.' },
  { title: 'Staff Frontend Engineer', company: 'Stripe', location: 'Bengaluru', jobType: 'FULL_TIME', workMode: 'HYBRID', experienceLevel: 'LEAD', salaryMin: 5000000, salaryMax: 8000000, skills: ['React', 'TypeScript', 'Design Systems'], description: 'Payments dashboard and design-system leadership.' },
  { title: 'Node.js Intern', company: 'HashedIn', location: 'Bengaluru', jobType: 'INTERNSHIP', workMode: 'HYBRID', experienceLevel: 'INTERN', salaryMin: 250000, salaryMax: 400000, skills: ['Node.js', 'JavaScript', 'REST'], description: 'Internship building REST APIs with mentorship.' },
];

export async function seedJobsAndDemoUser() {
  if ((await prisma.job.count()) === 0) {
    const start = Date.now() - 40 * 24 * 60 * 60 * 1000;
    await prisma.job.createMany({
      data: JOBS.map((job, i) => ({
        ...job,
        postedAt: new Date(start + i * 20 * 60 * 60 * 1000),
        status: i === 39 ? 'CLOSED' : 'OPEN',
      })),
    });
  }

  const email = 'candidate@demo.com';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await bcrypt.hash('Demo1234', 10);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: {
          create: {
            fullName: 'Aisha Rahman',
            phone: '9876543210',
            location: 'Bengaluru',
            headline: 'Full-stack developer looking for product roles',
            summary: 'Demo candidate for the Mini Job Portal walkthrough.',
            skills: ['JavaScript', 'React', 'Node.js'],
            experienceYears: 3,
            currentTitle: 'Software Engineer',
            linkedinUrl: 'https://www.linkedin.com/in/aisha-demo',
            githubUrl: 'https://github.com/aisha-demo',
          },
        },
      },
    });
  }
}

async function main() {
  await seedJobsAndDemoUser();
  console.log(`Jobs: ${await prisma.job.count()}, Users: ${await prisma.user.count()}`);
}

const isDirect = process.argv[1]?.includes('seed.js');
if (isDirect) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
