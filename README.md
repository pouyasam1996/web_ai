AI Chatbot Web Application
A customizable AI-powered chatbot web application built with React and TypeScript. This project allows users to interact with multiple AI models (e.g., OpenAI GPT, Anthropic Claude, xAI Grok) using their own API keys, with features for managing conversations.
Features

Multi-Model Support: Switch between GPT, Claude, and Grok models.
Secure API Key Input: Store API keys locally in the browser with validation.
Conversation Management: 
Auto-save ongoing conversations.
Save up to 20 temporary conversations (oldest deleted when limit reached).
Save permanent conversations separately.
Delete conversations with confirmation.
Start a new conversation with a "New" button.


Dark Theme GUI: Black background with highlighted conversation history on the left.
Real-Time Chat: Interactive chat interface covering the full desktop.

Prerequisites

Node.js (v14+ recommended)
npm (comes with Node.js)
A valid API key from OpenAI, Anthropic, or xAI (for testing respective models)

Installation

Clone the repository:git clone <your-repo-url>
cd my-chatbot


Install dependencies:npm install


Start the development server:npm start


Open http://localhost:3000 in your browser.



Usage

Enter your API key in the input field and select a model (e.g., GPT).
Ensure the key is entered without quotes (e.g., sk-proj-...).
Click "Save Key" (an error will prompt if the format is invalid).


Type a message and click "Send" to chat.
Use "Save Temporary" or "Save Permanent" to store conversations.
Click "New" to start fresh (saves the current chat as temporary).
View and load past conversations on the left panel; delete with confirmation.

Building for Production

Create a production build:npm run build


Deploy the build folder using a service like Netlify or GitHub Pages.

Deployment

Netlify:
Install Netlify CLI: npm install -g netlify-cli.
Deploy: netlify deploy --prod (select build folder).


GitHub Pages:
Install: npm install gh-pages.
Update package.json with:"homepage": "https://<your-username>.github.io/my-chatbot",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}


Deploy: npm run deploy.



Contributing
Feel free to fork this repository, submit issues, or create pull requests for enhancements.
License
MIT License - Feel free to modify and distribute.
Acknowledgments

Built with React, TypeScript, and axios.
Inspired by the need for a customizable AI chat interface.
