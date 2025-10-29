# Vessel Tracker Map Prototype

A React + Vite application using OpenLayers to display a world map with thousands of vessel data points.

## Features

- Interactive world map with OpenStreetMap tiles
- Thousands of vessel markers positioned in seas and rivers worldwide
- Click on any vessel to view detailed information stickers
- Pan and zoom navigation
- Color-coded vessel markers by type

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Project Structure

- `/src/components/Map.jsx` - OpenLayers map component
- `/src/components/VesselInfoPanel.jsx` - Vessel information panel
- `/public/vessel-data.json` - Vessel data (8000+ vessels)
- `/generate-vessels.py` - Script to regenerate vessel data

## Data

The vessel data includes:
- Vessel ID and name
- Type (Cargo Ship, Tanker, Container Ship, etc.)
- Location (latitude/longitude)
- Heading and speed
- Destination
- Flag country
- Length and tonnage
- Status
