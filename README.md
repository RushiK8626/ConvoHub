# ConvoHub - Modern Chat Application

A beautiful and feature-rich chat messaging application built with React. This is the frontend client that connects to your Node.js/Express backend.

## 🎨 Features

### Authentication
- ✅ Login with username/email and password
- ✅ Registration with full details (name, username, email, mobile)
- ✅ OTP verification for both login and registration
- ✅ Beautiful gradient UI with smooth animations

### Chat Interface
- ✅ WhatsApp-style chat home with conversation list
- ✅ Real-time message display (sent/received)
- ✅ Message status indicators (sent, delivered, read)
- ✅ Timestamps for all messages
- ✅ User avatars and online status
- ✅ Search conversations
- ✅ New chat button (floating action button)

### Messaging Features
- ✅ Send text messages
- ✅ Attachment options (images, files)
- ✅ Emoji support (button ready)
- ✅ Message actions menu:
  - Mark as read
  - Delete for me
  - Delete for everyone
- ✅ Read receipts with checkmarks
- ✅ Smooth scrolling and animations

### Profile Management
- ✅ View and edit profile
- ✅ Update full name, username, email, mobile, bio
- ✅ Avatar display (emoji-based, ready for image uploads)
- ✅ Accessible from both tab bar and settings

### Settings
- ✅ Organized settings page with multiple sections:
  - Account (Profile, Privacy, Security, Blocked Users)
  - Preferences (Notifications, Appearance, Language)
  - Support (Help & Support)
- ✅ Beautiful icon-based navigation
- ✅ Logout functionality

### User Management
- ✅ Block/Unblock users
- ✅ View all blocked users
- ✅ Blocked users list with unblock option
- ✅ Information about blocking features

### Navigation
- ✅ Bottom tab bar with 4 tabs:
  - Chats
  - Notifications (placeholder)
  - Profile
  - Settings
- ✅ Smooth navigation between pages
- ✅ Active tab highlighting

## 🎨 Design Features

- **Modern UI**: Clean, gradient-based design with purple theme
- **Smooth Animations**: Fade-in, slide-up effects throughout
- **Responsive**: Mobile-first design, works on all screen sizes
- **Consistent Theme**: Unified color scheme and styling
- **Interactive Elements**: Hover effects, active states, transitions
- **Professional Icons**: Using lucide-react icon library

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Navigate to the client directory
cd client

# Install dependencies (already done if you just created the project)
npm install

# Start the development server
npm start
```

The app will open at `http://localhost:3000`

## 📁 Project Structure

```
client/
├── public/
├── src/
│   ├── components/
│   │   ├── BottomTabBar.js
│   │   └── BottomTabBar.css
│   ├── pages/
│   │   ├── Login.js & Login.css
│   │   ├── Register.js & Register.css
│   │   ├── OTPVerification.js & OTPVerification.css
│   │   ├── ChatHome.js & ChatHome.css
│   │   ├── ChatWindow.js & ChatWindow.css
│   │   ├── Profile.js & Profile.css
│   │   ├── Settings.js & Settings.css
│   │   └── BlockedUsers.js & BlockedUsers.css
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
└── package.json
```

## 🔌 Backend Integration

This frontend is ready to connect to your Node.js/Express backend. You'll need to:

1. **Update API endpoints** in each component where you see comments like:
   - `// Here you would make API call to your backend`
   - `// Connect to your backend`

2. **Install axios** (already included) for API calls

3. **Key integration points**:
   - Login: `pages/Login.js` - handleSubmit function
   - Register: `pages/Register.js` - handleSubmit function
   - OTP: `pages/OTPVerification.js` - handleSubmit function
   - Messages: `pages/ChatWindow.js` - handleSendMessage function
   - Profile: `pages/Profile.js` - handleSave function
   - Blocked Users: `pages/BlockedUsers.js` - handleUnblock function

4. **WebSocket Integration** (for real-time messaging):
   - Add socket.io-client for real-time features
   - Connect in ChatWindow component
   - Listen for incoming messages
   - Emit outgoing messages

## 🎯 Ready-to-Connect Features

All UI components are ready. You just need to connect them to your backend:

- Authentication endpoints
- User profile management
- Message CRUD operations
- File upload for attachments
- User blocking/unblocking
- Real-time messaging with WebSockets

## 🎨 Color Scheme

- Primary Gradient: `#667eea` to `#764ba2`
- Success: `#4ade80`
- Error: `#ff4757`
- Background: `#f8f9fa`
- Text: `#1a1a1a` / `#666` / `#999`

## 📱 Responsive Design

The app is fully responsive and optimized for:
- Mobile devices (320px and up)
- Tablets (768px and up)
- Desktop (1024px and up)

## Available Scripts

### `npm start`


Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
