# Full-Stack Web Application

A modern full-stack web application built with React.js, Node.js, Express, and MongoDB.

## 🚀 Features

- **Frontend**: React.js with modern hooks and functional components
- **Backend**: RESTful API with Express.js
- **Database**: MongoDB for data persistence
- **Responsive Design**: Mobile-friendly UI with CSS3
- **Real-time Updates**: Dynamic content management
- **Error Handling**: Comprehensive error handling on both client and server

## 🛠️ Technologies Used

### Frontend
- React.js 18
- HTML5 & CSS3
- Axios for API calls
- Modern ES6+ JavaScript

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- CORS middleware
- Environment variables with dotenv

### Development Tools
- Concurrently for running multiple servers
- Nodemon for server auto-restart
- React Scripts for development server

## 📁 Project Structure

```
fullstack-web-app/
├── client/                 # React frontend
│   ├── public/            # Static files
│   ├── src/               # React components
│   │   ├── App.js         # Main App component
│   │   ├── App.css        # App styles
│   │   ├── index.js       # React entry point
│   │   └── index.css      # Global styles
│   └── package.json       # Client dependencies
├── server/                # Express backend
│   ├── server.js          # Main server file
│   ├── .env               # Environment variables
│   └── package.json       # Server dependencies
├── .github/               # GitHub configuration
│   └── copilot-instructions.md
├── package.json           # Root package.json
└── README.md              # This file
```

## 🚦 Getting Started

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/) (local installation or MongoDB Atlas)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1. **Clone or download the project**
   ```bash
   cd your-project-directory
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install client and server dependencies**
   ```bash
   npm run install-all
   ```

4. **Set up MongoDB**
   - For local MongoDB: Make sure MongoDB is running on `mongodb://localhost:27017`
   - For MongoDB Atlas: Update the `MONGODB_URI` in `server/.env`

5. **Configure environment variables**
   - Check `server/.env` file
   - Update MongoDB URI if needed

### Running the Application

**Development Mode (Recommended)**
```bash
npm run dev
```
This will start both the React frontend (http://localhost:3000) and Express backend (http://localhost:5000) concurrently.

**Run Frontend Only**
```bash
npm run client
```

**Run Backend Only**
```bash
npm run server
```

**Production Build**
```bash
npm run build
```

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/items` | Get all items |
| GET | `/api/items/:id` | Get single item |
| POST | `/api/items` | Create new item |
| PUT | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |

### Example API Usage

**Create a new item:**
```bash
curl -X POST http://localhost:5000/api/items \
  -H "Content-Type: application/json" \
  -d '{"title": "Sample Item", "description": "This is a sample item"}'
```

**Get all items:**
```bash
curl http://localhost:5000/api/items
```

## 🎨 Features Overview

### Frontend Features
- Modern React functional components with hooks
- Responsive design with CSS Grid and Flexbox
- Form handling with validation
- Real-time data updates
- Error and success message handling
- Loading states
- Mobile-friendly interface

### Backend Features
- RESTful API design
- MongoDB integration with Mongoose
- Input validation
- Error handling middleware
- CORS configuration
- Environment variable configuration
- Health check endpoint

## 🔧 Development

### Adding New Features

1. **Frontend Components**: Add new React components in `client/src/`
2. **Backend Routes**: Add new API routes in `server/server.js`
3. **Database Models**: Extend the Mongoose schema as needed
4. **Styling**: Update CSS files in `client/src/`

### Environment Variables

Update `server/.env` for configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fullstack-app
NODE_ENV=development
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the MONGODB_URI in `server/.env`

2. **Port Already in Use**
   - Change the PORT in `server/.env`
   - Kill processes using the port

3. **Module Not Found**
   - Run `npm run install-all` to install all dependencies
   - Clear node_modules and reinstall if needed

### Logs

- Frontend logs: Check browser console
- Backend logs: Check terminal where server is running

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

If you have any questions or issues, please check the troubleshooting section or create an issue in the project repository.
