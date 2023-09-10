addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

let username; // Declare a variable to store the username

async function handleRequest(request) {
  // Check if the request method is POST
  if (request.method === 'POST') {
    // Parse the request body as form data
    const formData = await readRequestBody(request);

    // Extract the new chat value from the form data
    const message = formData.get('chat');

    if (!message) {
      return new Response('Message is required.', { status: 400 });
    }

    // Create a timestamp in the Amsterdam timezone
    const amsterdamTime = new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' });

    // Retrieve the current chat history from the KV
    let chat = await KV.get("chat");

    if (!chat) {
      // If there's no existing chat history, initialize it as an empty string
      chat = '';
    }

    // Create a new chat message with username (if available), message, and timestamp
    const newChatValue = `${username ? username + ': ' : ''}${message}\n${amsterdamTime}`;

    // Append the new message to the chat history with a double newline delimiter
    chat = chat ? chat + '\n\n' + newChatValue : newChatValue;

    // Update the KV with the updated chat history
    await KV.put("chat", chat);

    // Return a success response with a JavaScript redirect to the same page
    const redirectHtmlResponse = `
      <html>
        <body>
          <script>
            // Redirect back to the chat page after submitting the form
            window.location.href = "/";
          </script>
        </body>
      </html>
    `;
    return new Response(redirectHtmlResponse, { headers: { 'Content-Type': 'text/html' }, status: 200 });
  } else {
    // If the request method is not POST, retrieve the current chat history from the KV
    const chat = await KV.get("chat");

    // Split the chat history into an array of messages based on a double newline delimiter
    const chatHistory = chat ? chat.split('\n\n') : [];

    // Create an HTML response to display messages with proper formatting
    const htmlResponse = `
      <html>
      <head>
        <meta content='width=device-width, initial-scale=1' name='viewport'/>
      </head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }

        h1 {
          color: #075e54;
          font-size: 24px;
          margin-bottom: 10px;
        }
    
        p {
          color: #777;
          font-size: 16px;
        }
    
        #chat-iframe {
          border: 1px solid #ddd;
          border-radius: 5px;
          width: 100%;
          max-width: 800px; /* Set a maximum width for the iframe */
          height: 500px; /* Increase the height as desired */
          overflow-y: hidden; /* Hide the vertical scrollbar */
          margin: 10px 0;
          padding: 10px;
          background-color: #fff;
        }
    
        form {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 10px;
        }
    
        label {
          font-weight: bold;
          margin-bottom: 5px;
        }
    
        input[type="text"] {
          padding: 10px;
          margin-bottom: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
          width: 100%;
          font-size: 16px;
        }
    
        button {
          padding: 10px 20px;
          color: #fff;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
        }
    
        button:hover {
          filter: brightness(0.7);
        }
    
        /* Style for readonly username input */
        input[readonly] {
          background-color: #eee;
          cursor: not-allowed;
        }
    
        /* Style for chat message paragraphs */
        #chat-iframe p {
          margin: 5px 0;
        }
      </style>
        <body>
          <h1>Whatsweb</h1>
          <iframe id="chat-iframe" srcdoc="${chatHistory.map(message => `<p>${message.replace('\n', '<br>')}</p>`).join('')}"></iframe>
          <form method="POST" action="/">
            <label for="username">Gebruikersnaam:</label>
            <input type="text" id="username" name="username" required ${username ? 'readonly' : ''} value="${username || ''}"><br>
            <label for="chat">Nieuw chat bericht:</label>
            <input type="text" id="chat" name="chat" required>
            <button type="submit"><svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="64.000000pt" height="64.000000pt" viewBox="0 0 256.000000 256.000000" preserveAspectRatio="xMidYMid meet"> <g transform="translate(0.000000,256.000000) scale(0.100000,-0.100000)" fill="#075E54" stroke="none"> <path d="M382 2293 c-7 -3 -19 -18 -27 -34 -14 -26 -12 -52 25 -306 22 -153 42 -290 44 -305 5 -24 -5 -33 -125 -112 -72 -47 -126 -86 -121 -86 6 0 363 -34 794 -75 431 -42 829 -78 886 -82 56 -3 102 -9 102 -13 0 -4 -46 -10 -102 -13 -57 -4 -455 -40 -886 -82 -431 -41 -788 -75 -794 -75 -5 0 49 -39 121 -86 120 -79 130 -88 125 -112 -2 -15 -22 -152 -44 -305 -37 -253 -39 -280 -26 -306 16 -31 34 -41 71 -41 31 0 1925 944 1948 971 19 24 22 61 7 90 -15 27 -1920 979 -1957 978 -16 0 -34 -3 -41 -6z m1004 -505 c974 -487 969 -485 951 -531 -5 -14 -1888 -957 -1911 -957 -22 0 -48 44 -42 71 3 13 7 38 9 54 3 17 19 137 38 267 39 275 40 263 -55 329 -76 53 -70 48 -64 54 2 3 288 32 634 65 346 33 649 63 674 65 25 3 92 10 150 16 124 12 173 24 190 45 18 21 -5 43 -57 54 -37 9 -381 44 -818 85 -449 42 -768 75 -772 79 -3 3 24 26 60 51 35 26 71 58 78 72 11 21 7 65 -28 316 -37 260 -40 294 -27 315 8 12 21 22 30 22 8 0 440 -213 960 -472z"/></g></svg></button>
          </form>
          <script>
            // JavaScript to clear the chat message input field
            document.getElementById('chat').value = '';
          </script>
        </body>
      </html>
    `;

    // Return the HTML response
    return new Response(htmlResponse, { headers: { 'Content-Type': 'text/html' }, status: 200 });
  }
}

// Function to read the request body as text
async function readRequestBody(request) {
  const requestBody = await request.text();
  const formData = new URLSearchParams(requestBody);
  username = formData.get('username'); // Update the username variable
  return formData;
}
