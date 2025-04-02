# Instagram Reels Ranking Dashboard

A React-based dashboard for analyzing Instagram Reels performance metrics.

## Features

- Interactive charts and visualizations
- Multiple ranking metrics (Views, Likes, Comments, Engagement Rate)
- Sortable and filterable data table
- Clickable links to original Instagram Reels

## Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/reels-dashboard.git
cd reels-dashboard
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm start
```

## Deployment

This project is configured for Netlify deployment. Simply connect your GitHub repository to Netlify and it will automatically deploy.

## Data

The dashboard uses data from a CSV file. Place your CSV file in the `public` directory and update the file path in `src/components/ReelsRankingDashboard.jsx` if needed.

## Technologies Used

- React
- Recharts
- PapaParse
- Tailwind CSS 