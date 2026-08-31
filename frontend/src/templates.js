// Project Type Definitions & Templates for QuickBuild

export const PROJECT_TYPES = [
  { id: 'web', name: 'Web Application', icon: 'Globe', description: 'Responsive web apps, SaaS tools, frontend & backend apps' },
  { id: 'mobile', name: 'Mobile App', icon: 'Smartphone', description: 'iOS and Android applications or cross-platform apps' },
  { id: 'api', name: 'API / Backend Service', icon: 'Server', description: 'REST APIs, microservices, database schemas & backends' },
  { id: 'ai', name: 'AI / Machine Learning Tool', icon: 'Cpu', description: 'LLM wrappers, data models, computer vision or NLP tools' },
  { id: 'school', name: 'School / Student Project', icon: 'GraduationCap', description: 'Class projects, hackathon submissions, and coursework' },
];

export const STARTER_TASKS = {
  web: [
    { title: 'Define Core User Flow & Requirements', description: 'Outline user journeys, key features, and initial data models.', priority: 'High', status: 'Done' },
    { title: 'Design Interface Wireframes & Component Shells', description: 'Create visual mockups and layout component hierarchy.', priority: 'High', status: 'In Progress' },
    { title: 'Implement Main Feature & Core Logic', description: 'Build state management, key application logic, and user inputs.', priority: 'High', status: 'To Do' },
    { title: 'Test Application & Mobile Responsiveness', description: 'Perform cross-browser checks, mobile layout testing, and bug fixes.', priority: 'Medium', status: 'To Do' },
    { title: 'Prepare Demo & Launch Documentation', description: 'Write user documentation, README file, and record presentation walkthrough.', priority: 'Medium', status: 'To Do' },
  ],
  mobile: [
    { title: 'Define Screen Architecture & Navigation', description: 'Map out app screens, navigation stacks, and state transitions.', priority: 'High', status: 'Done' },
    { title: 'Build UI Layout & Responsive Components', description: 'Implement buttons, lists, cards, and input controls.', priority: 'High', status: 'In Progress' },
    { title: 'Integrate Offline Storage & API Clients', description: 'Set up local storage, state persistence, and remote endpoint fetching.', priority: 'High', status: 'To Do' },
    { title: 'Perform Device & Sensor Testing', description: 'Test touch gestures, screen resolutions, and battery performance.', priority: 'Medium', status: 'To Do' },
    { title: 'Package App & Prepare Submission Demo', description: 'Create release build, screenshot assets, and presentation video.', priority: 'Medium', status: 'To Do' },
  ],
  api: [
    { title: 'Design REST/GraphQL API Schema', description: 'Define endpoints, payload request/responses, and HTTP status conventions.', priority: 'High', status: 'Done' },
    { title: 'Setup Database Migration & Data Models', description: 'Configure database tables, indexes, ORM models, and seed data.', priority: 'High', status: 'In Progress' },
    { title: 'Implement Authentication & Controllers', description: 'Build API handlers, request validation, middleware, and error handling.', priority: 'High', status: 'To Do' },
    { title: 'Write Integration Tests & Stress Tests', description: 'Create automated endpoint tests and verify concurrency performance.', priority: 'Medium', status: 'To Do' },
    { title: 'Generate Swagger API Documentation', description: 'Export OpenAPI spec and prepare demo curl requests.', priority: 'Medium', status: 'To Do' },
  ],
  ai: [
    { title: 'Scope AI Model & Data Pipeline Requirements', description: 'Select model architecture, prompt strategies, or dataset sources.', priority: 'High', status: 'Done' },
    { title: 'Build Preprocessing & Prompt Engine', description: 'Clean data inputs, structure system prompts, and handle token limits.', priority: 'High', status: 'In Progress' },
    { title: 'Implement Inference UI & Output Formatter', description: 'Create user input interface and clean rendering for AI responses.', priority: 'High', status: 'To Do' },
    { title: 'Evaluate Model Accuracy & Edge Cases', description: 'Test corner cases, latency response times, and failure fallbacks.', priority: 'Medium', status: 'To Do' },
    { title: 'Document Model Architecture & Prepare Demo', description: 'Draft technical overview, benchmark stats, and live demo script.', priority: 'Medium', status: 'To Do' },
  ],
  school: [
    { title: 'Finalize Project Scope & Rubric Objectives', description: 'Review instructor requirements, deliverables, and team assignments.', priority: 'High', status: 'Done' },
    { title: 'Build Core MVP Deliverable', description: 'Develop main functionality required for high rubric score.', priority: 'High', status: 'In Progress' },
    { title: 'Conduct Peer Review & Code Cleanup', description: 'Format code, remove debug logs, and fix layout glitches.', priority: 'High', status: 'To Do' },
    { title: 'Prepare Slide Presentation & Script', description: 'Create 5-minute presentation slides highlighting problem and solution.', priority: 'Medium', status: 'To Do' },
    { title: 'Record Live Demonstration Video', description: 'Screen record project in action showing all required features.', priority: 'Medium', status: 'To Do' },
  ],
};

export const DEFAULT_CHECKLIST = [
  { label: 'Test main user flow end-to-end', completed: true },
  { label: 'Check mobile & desktop layout responsiveness', completed: false },
  { label: 'Add README documentation & setup guide', completed: false },
  { label: 'Prepare 5-minute live demonstration script', completed: false },
];

export const DEMO_PROJECT = {
  id: 'proj_campus_event_demo',
  name: 'Campus Event App',
  type: 'web',
  description: 'A mobile-friendly web app for university students to discover, RSVP for, and organize campus club events in real time.',
  createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  tasks: [
    { id: 't1', title: 'Define user requirements & club roles', description: 'Identify needs for student attendees vs. club organizers.', priority: 'High', status: 'Done', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 't2', title: 'Design event feed & filter interface', description: 'Create responsive UI layout for browsing upcoming campus events by date and category.', priority: 'High', status: 'In Progress', createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString() },
    { id: 't3', title: 'Implement event creation modal & RSVP state', description: 'Allow organizers to post events and students to click RSVP.', priority: 'High', status: 'To Do', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 't4', title: 'Test application on mobile screens', description: 'Verify tap targets, event card alignment, and navigation bar on iOS and Android viewports.', priority: 'Medium', status: 'To Do', createdAt: new Date(Date.now() - 43200000).toISOString() },
    { id: 't5', title: 'Prepare 10-minute presentation demo', description: 'Outline presentation slides and demo flow for classroom pitch.', priority: 'Low', status: 'To Do', createdAt: new Date().toISOString() },
  ],
  checklist: [
    { id: 'c1', label: 'Test main user flow (RSVP for an event)', completed: true },
    { id: 'c2', label: 'Check mobile & desktop layout responsiveness', completed: false },
    { id: 'c3', label: 'Add README documentation & setup guide', completed: false },
    { id: 'c4', label: 'Prepare 5-minute live demonstration script', completed: false },
  ]
};
