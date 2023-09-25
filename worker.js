addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

let username; // Declare a variable to store the username

async function handleRequest(request) {
  // Check if the request method is POST
  if (request.method === 'POST') {
    // Check if the request is for clearing the chat
    if (request.url.endsWith('/clear-chat')) {
      // Handle the request to clear the chat
      return clearChat(request);
    }
    if (request.url.endsWith('/save-chat')) {
      // Handle the request to save the chat
      return saveChat(request);
    }

    // Handle the regular chat message submission
    return handleChatMessage(request);
  } else {
    // If the request method is not POST, retrieve the current chat history from the KV
    const chat = await KV.get('chat');

    // Split the chat history into an array of messages based on a double newline delimiter
    const chatHistory = chat ? chat.split('\n\n') : [];

    const cssContent = await KV.get('styles.css');
    const backupsvg = await KV.get('backup');
    const clearsvg = await KV.get('clear');
    const githubsvg = await KV.get('github')

    // Create an HTML response to display messages with proper formatting
    const htmlResponse = `
      <html>
        <head>
          <meta charset="UTF-8">
          <meta content='width=device-width, initial-scale=1' name='viewport'/>
          <style>
            ${cssContent || ''}
          </style>
        </head>
        <body>
        <div id="container">
        <a href="https://github.com/WilmeRWubS/chatkv" class="button-up">${githubsvg}</a>
        <div id="sidebar">
          <form method="POST" action="/clear-chat" class="chat-form">
            <input type="password" id="password" name="password" required placeholder="Enter pin">
            <button class="side-button" type="submit" title="Gesprek verwijderen">${clearsvg}</button>
          </form>

          <form method="POST" action="/save-chat" class="chat-form">
            <input type="password" id="password-save" name="password" required placeholder="Enter pin">
            <button class="side-button" type="submit" title="Backup maken gesprek">${backupsvg}</button>
          </form>
        </div>
        <div id="content">
          <h1>WhatsWeb</h1>
          <iframe id="chat-iframe" srcdoc="${chatHistory.map(message => `<p>${message.replace('\n', '<br>')}</p>`).join('')}"></iframe>
          
          <form method="POST" action="/" class="chat-form">
            <div class="form-row">
              <label for="username">Gebruikersnaam:</label>
              <input type="text" id="username" name="username" required ${username ? 'readonly' : ''} value="${username || ''}">
            </div>
            <div class="form-row">
              <label for="chat">Nieuw chat bericht:</label><br>
              <textarea id="chat" name="chat" required rows="5" cols="50"></textarea>
            </div>
            <br>
            <button type="submit">Verstuur</button>
          </form>
        </div>
        </div>
          
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

async function handleChatMessage(request) {
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
  let chat = await KV.get('chat');

  if (!chat) {
    // If there's no existing chat history, initialize it as an empty string
    chat = '';
  }

  // Create a new chat message with username (if available), message, and timestamp
  const newChatValue = `${username ? username + ': ' : ''}${message}\n${amsterdamTime}`;

  // Append the new message to the chat history with a double newline delimiter
  chat = chat ? newChatValue + '\n\n' + chat : newChatValue;

  // Update the KV with the updated chat history
  await KV.put('chat', chat);

  // Return a success response with a JavaScript redirect to the same page
  const redirectHtmlResponse = `
    <html>
      <body>
        <script>
          // Redirect back to the chat page after submitting the form
          window.location.href = '/';
        </script>
      </body>
    </html>
  `;
  return new Response(redirectHtmlResponse, { headers: { 'Content-Type': 'text/html' }, status: 200 });
}

async function saveChat(request) {
  // Parse the request body as form data
  const formData = await readRequestBody(request);

  // Extract the password from the form data
  const password = formData.get('password');

  // Check if the entered password matches the stored password in the KV store
  const storedPassword = await KV.get('password');

  if (password !== storedPassword) {
    // Return an error response if the password is incorrect
    return Response.redirect('https://youtu.be/dQw4w9WgXcQ', 302);
  }

  // Retrieve the current chat history from the KV
  const chat = await KV.get('chat');

  if (!chat) {
    // If there's no existing chat history, return an error response
    return new Response('No chat history to save.', { status: 400 });
  }

  // Create a timestamp with Dutch/Amsterdam time zone
  const amsterdamTimezone = 'Europe/Amsterdam';
  const now = new Date().toLocaleString('nl-NL', { timeZone: amsterdamTimezone });

  // Extract date and time components
  const [date, time] = now.split(', ');

  // Define the key for storing the saved chat with the timestamp
  const timestamp = `${date} ${time}`;

  // Define a format for the date in "12-9-2023" format
  const dateFormat = 'D-M-YYYY';

  // Reformat the date to match the specified format
  const formattedDate = date
    .split('/')
    .map((component, index) => (dateFormat[index] === 'D' ? component : component.padStart(2, '0')))
    .join('-');

  // Store the current chat in KV with the specified key
  await KV.put(`saved-chat-${formattedDate}`, chat);

  // Return a success response
  return new Response(`
    <html>
      <head>
        <meta http-equiv="refresh" content="3;url=./">
      </head>
      <body>
        <p>Chat is opgeslagen. Met 3 seconden ga je terug...</p>
      </body>
    </html>
  `, {
    status: 200,
    headers: {
      'Content-Type': 'text/html'
    }
  });
}

async function clearChat(request) {
  // Parse the request body as form data
  const formData = await readRequestBody(request);

  // Extract the password from the form data
  const password = formData.get('password');

  // Check if the entered password matches the stored password in the KV store
  const storedPassword = await KV.get('password');

  if (password === storedPassword) {
    // Clear the chat history by setting it to an empty string
    await KV.put('chat', '');

    // Return a success response
    return new Response(`
      <html>
        <head>
          <meta http-equiv="refresh" content="3;url=./">
        </head>
        <body>
          <p>Chat is succesvol verwijderd. Met 3 seconden ga je terug...</p>
        </body>
      </html>
    `, {
      status: 200,
      headers: {
        'Content-Type': 'text/html'
      }
    });
  } else {
    // Return an error response if the password is incorrect
    return Response.redirect('https://youtu.be/dQw4w9WgXcQ', 302);
  }
}
