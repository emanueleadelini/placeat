# **App Name**: PLACEAT

## Core Features:

- Restaurant Onboarding & Setup: Guided self-registration for restaurant owners, allowing configuration of business details, operating hours, and initial subscription plan.
- Interactive Floor Plan Editor: A dynamic canvas for creating and managing restaurant layouts, including customizable tables, walls, and distinct zones with drag-and-drop functionality.
- Table & Reservation Management Dashboard: Centralized dashboard for viewing, creating, updating, and assigning customer reservations with a weekly calendar and drag-and-drop table management.
- Automated Review Request System: Configurable system for automatically sending review requests to customers post-reservation, with smart routing to Google Reviews or internal feedback forms based on star ratings.
- Customer Feedback Summarization Tool: An AI tool designed to analyze and summarize qualitative customer feedback provided through internal forms for low-star ratings, helping restaurant owners quickly identify key areas for improvement.
- Subscription & Billing Management: Integrated Stripe system for handling trial periods, recurring payments, subscription upgrades/downgrades, and managing free-tier usage limits.
- Progressive Web App (PWA) for Offline Access: Enabling core dashboard functionality, especially reservation viewing and management, to work reliably offline through service workers and cached data.

## Style Guidelines:

- Primary color: A vibrant 'hope green' (#10B981) to symbolize growth and positive outcomes for restaurant businesses.
- General UI Background: A clean, light gray (#F9FAFB) for a minimalist and modern aesthetic.
- Card and Content Background: Crisp white (#FFFFFF) to provide clear separation and readability for information.
- Interactive Element Accent: A strong action-oriented blue (#3B82F6) for buttons and other clickable UI components.
- Warning and Danger states: A clear red (#EF4444) to draw attention to critical information, errors, or cancellation actions.
- Headline and Body Font: 'Inter' (sans-serif) for its modern, clear, and objective appearance, suitable for both short and long texts. Note: currently only Google Fonts are supported.
- Icons: Use 'Lucide React' for a consistent and versatile set of modern vector icons across the application.
- Shadows and Borders: Apply 'shadow-sm' for cards and 'shadow-lg' for modals. Use 'rounded-xl' (12px) for card corners and 'rounded-lg' for buttons to create a friendly, contemporary feel. The layout will be mobile-first and responsive, supporting both desktop mouse/keyboard and tablet touch gestures (e.g., pinch-zoom, pan).
- Subtle Interactions: Gentle animations on interactive elements within the Floor Plan Editor (e.g., drag, resize, rotate feedback) and when data changes or saves automatically (e.g., 'Saved' message fades in/out).