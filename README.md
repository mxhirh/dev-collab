# DevCollab

DevCollab is a collaborative platform designed for developers to connect, create, and contribute to software projects. It offers matchmaking, project management, real-time messaging, forums, and profile customization, all built using modern web technologies.

## Features

- User authentication with Firebase
- Developer matchmaking system
- Project creation and management
- Real-time messaging between users
- Forum for community discussion
- Search functionality for users, projects, and posts
- User profile dashboard

## Technology Stack

- React 19 (Create React App)
- React Router DOM 7
- Firebase (Authentication, Firestore, Admin SDK)
- React Hot Toast for notifications
- React Calendar for scheduling

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm

### Installation

1. Clone the repository

  ```bash
  git clone https://github.com/your-username/dev-collab.git
  cd dev-collab
  ```
   
2. Install dependencies

  ```bash
  npm install
  ```

3. Configure Firebase

Update the Firebase configuration in src/services/firebase.js with your own Firebase project credentials:

  ```javascript
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  ```
4. Running the Application

To start the development server:
  
  ```bash
  npm start
  ```
This will launch the application at http://localhost:3000.

5. Running Tests
To execute the test suite:

  ```bash
  npm test
  ```
6. Project Structure

  ```
  src/
  ├── components/         // Reusable UI components
  ├── features/           // Modular features (Auth, Project, Forum, etc.)
  ├── pages/              // Top-level views (Landing, Dashboard, etc.)
  ├── services/           // Firebase configuration and API logic
  ├── App.js              // Main application component
  ├── index.js            // Entry point
  ├── index.css           // Global styles
  ```

7. Deployment
To build the application for production:
  
  ```bash
  npm run build
   ```
This will create a production-ready build in the build/ directory.

## Contributing
Contributions are welcome. Please fork the repository and submit a pull request. For major changes, open an issue first to discuss the proposed improvements.

## License
This project is licensed under the MIT License.
