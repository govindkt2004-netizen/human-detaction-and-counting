# Human Detection & Counting

A browser-based human detection and counting application built with React, TypeScript, Vite, and MediaPipe Tasks Vision. It detects and counts people in images, videos, and live camera streams, and lets users review detection statistics and previous results.

## Live Demo

Add your deployed Vercel link here:

- https://your-project-name.vercel.app

## Features

- Dashboard for activity and key statistics
- Live camera detection in real time
- Image upload detection
- Video frame-by-frame analysis
- Detection controls for confidence and thresholds
- Analytics and reporting
- History of previous detections
- Export support for reports
- Model selection options
- Light and dark theme support
- Local browser-based preferences

## Tech Stack

- React
- TypeScript
- Vite
- MediaPipe Tasks Vision
- Tailwind CSS
- Recharts
- Lucide React
- Motion

## Requirements

- Node.js (LTS recommended)
- npm
- Modern browser
- Camera access for live detection
- Internet connection for model loading when needed

## Installation

1. Clone or download the project.
2. Open the folder in VS Code.
3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

5. Open the URL shown in the terminal, usually:

```bash
http://localhost:3000
```

## Production Build

Build the app:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Deployment

This project can be deployed on platforms such as Vercel or Netlify.

1. Push the project to GitHub.
2. Import the repository into your hosting platform.
3. Set the build command to `npm run build`.
4. Set the publish directory to `dist`.
5. Deploy the application.

For camera access after deployment, use HTTPS. During local development, `localhost` is usually enough.

## Camera Permissions

Allow camera access in the browser when prompted. If the camera does not work, check browser permissions and make sure another app is not using the camera.

## Privacy

Use camera and uploaded media responsibly. Obtain consent before analyzing people and comply with privacy requirements. Review how detection results, uploaded files, and saved history are stored or processed.

## Troubleshooting

- Dependency errors: run `npm install` and verify your Node.js version.
- Camera not working: check browser permissions and use `localhost` or HTTPS.
- Model loading issues: check your internet connection and browser console.
- Build errors: review the terminal output and fix dependency or config issues.

