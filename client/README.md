# TTWar V2

A modern web application showcasing top technology companies worldwide, built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- Browse top tech companies globally
- Company details and information
- Authentication system
- Responsive design with modern UI
- Interactive components and smooth animations

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router DOM** - Navigation
- **Heroicons** - Icon library

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ttwar-v2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Development server:
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 to view the app.

4. Build for production:
   ```bash
   npm run build
   ```

5. Preview production build:
   ```bash
   npm run preview
   ```

## Project Structure

```
ttwar-v2/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── layout/      # Layout components (Navbar, Background)
│   │   └── ui/          # UI elements (AuthModal, ProtectedRoute)
│   ├── pages/           # Page components
│   ├── context/         # React context (AuthContext)
│   ├── data/            # Static data (company-data.json)
│   ├── main.tsx         # Application entry point
│   └── App.tsx          # Root component
├── public/              # Static assets
├── index.html           # HTML template
└── Configuration files (vite.config.ts, tailwind.config.js, tsconfig.json)
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

Private project - All rights reserved.
