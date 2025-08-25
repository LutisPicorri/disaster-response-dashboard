# Real-Time Disaster Response Dashboard

A comprehensive platform that aggregates real-time disaster data from multiple sources and provides AI-powered risk prediction for emergency response.

## 🌟 Features

### Real-Time Data Integration
- **Weather Alerts**: Severe weather conditions and forecasts
- **Earthquake Data**: Real-time seismic activity from USGS
- **Wildfire Tracking**: Active fire locations and spread patterns
- **Flood Monitoring**: Water level alerts and flood warnings
- **NASA EONET**: Natural events from NASA's Earth Observatory

### Interactive Dashboard
- **Live Map Visualization**: Color-coded alerts using Leaflet
- **Real-time Updates**: WebSocket-powered live data streaming
- **Geolocation Services**: User location-based alerts
- **Alert System**: Push notifications for critical events

### AI Risk Prediction
- **Historical Analysis**: Pattern recognition from past events
- **Risk Scoring**: AI-powered threat assessment
- **Predictive Alerts**: Early warning system for potential disasters

### User Management
- **Regional Subscriptions**: Location-based alert preferences
- **Custom Notifications**: Personalized alert settings
- **Emergency Contacts**: Quick access to local emergency services

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Data Sources  │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (APIs)        │
│                 │    │                 │    │                 │
│ • Leaflet Maps  │    │ • Express       │    │ • USGS          │
│ • Real-time UI  │    │ • Socket.io     │    │ • NASA EONET    │
│ • User Dashboard│    │ • SQLite DB     │    │ • Weather APIs  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd disaster-response-dashboard
   npm run install-all
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🔧 Configuration

### Required API Keys
- **USGS**: No key required (public API)
- **NASA EONET**: No key required (public API)
- **OpenWeatherMap**: Get free key at https://openweathermap.org/api
- **Mapbox**: Get free key at https://www.mapbox.com/

### Environment Variables
```env
PORT=5000
NODE_ENV=development
OPENWEATHER_API_KEY=your_openweather_key
MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

## 📊 Data Sources

### Real-Time APIs
- **USGS Earthquake API**: Real-time seismic data
- **NASA EONET**: Natural events and disasters
- **OpenWeatherMap**: Weather alerts and forecasts
- **NOAA Weather**: Severe weather warnings

### Data Normalization
All incoming data is normalized to a standard format:
```javascript
{
  id: "unique_identifier",
  type: "earthquake|wildfire|flood|weather",
  severity: "low|medium|high|critical",
  location: { lat: number, lng: number },
  timestamp: "ISO_8601_string",
  description: "Human readable description",
  source: "api_source_name"
}
```

## 🎯 Use Cases

### For Citizens
- Real-time disaster alerts in their area
- Emergency preparedness information
- Evacuation route planning
- Local emergency contact access

### For Emergency Responders
- Situational awareness dashboard
- Resource allocation optimization
- Historical incident analysis
- Risk assessment tools

### For Government Agencies
- Regional disaster monitoring
- Public safety communication
- Infrastructure protection
- Policy decision support

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Data sanitization
- **Rate Limiting**: API abuse prevention
- **Environment Variables**: Secure configuration

## 📈 Performance

- **Real-time Updates**: WebSocket connections
- **Caching**: API response caching
- **Compression**: Gzip compression
- **CDN Ready**: Static asset optimization
- **Database Indexing**: Optimized queries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Emergency Information

This dashboard is designed to provide real-time information but should not be the sole source for emergency decisions. Always follow official emergency services guidance.

