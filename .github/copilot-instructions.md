<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Full-Stack Web Application

This is a full-stack MERN (MongoDB, Express, React, Node.js) application with the following structure:

## Project Structure
- `/client` - React.js frontend application
- `/server` - Node.js/Express backend API
- Root package.json contains scripts to run both client and server

## Technologies Used
- **Frontend**: React.js, HTML5, CSS3, Axios for API calls
- **Backend**: Node.js, Express.js, RESTful API
- **Database**: MongoDB with Mongoose ODM
- **Development**: Concurrently for running both servers

## Development Guidelines
- Use modern JavaScript (ES6+) features
- Follow React functional components with hooks
- Use async/await for asynchronous operations
- Implement proper error handling on both client and server
- Use environment variables for configuration
- Follow RESTful API conventions

## API Endpoints
- GET /api/items - Get all items
- GET /api/items/:id - Get single item
- POST /api/items - Create new item
- PUT /api/items/:id - Update item
- DELETE /api/items/:id - Delete item
- GET /api/health - Health check

## Running the Application
- `npm run dev` - Run both client and server in development mode
- `npm run client` - Run only the React frontend
- `npm run server` - Run only the Express backend
- `npm run install-all` - Install dependencies for both client and server
