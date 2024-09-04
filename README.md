
## Overview
A collaborative text editor built using React and Quill.js. It allows multiple users to edit a document in real-time, with changes synchronized through a WebSocket connection.

## Features
- Real-time collaborative editing
- Document loading and saving
- User-friendly text formatting with Quill.js

## Technologies Used
- React
- Quill.js
- WebSockets

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/MazenSamehR/collaborative-text-editor.git
    cd collaborative-text-editor
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Start the client server:
    ```sh
    npm start
    ```
4. open server folder and start the server:
   ```sh
    node server.js
    ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`.
2. Start editing the document. Changes will be synchronized in real-time with other connected users.
