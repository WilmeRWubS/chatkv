addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Check if the request method is POST
  if (request.method === 'POST') {
    // Parse the request body as form data
    const formData = await readRequestBody(request);

    // Extract the new chat value from the form data and add a timestamp in the Amsterdam timezone
    const amsterdamTime = new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' });
    const newChatValue = `${amsterdamTime}: ${formData.get('chat')}`;

    // Retrieve the current chat history from the KV
    let chat = await KV.get("chat");

    if (!chat) {
      // If there's no existing chat history, initialize it as an empty string
      chat = '';
    }

    // Append the new message to the chat history with a newline delimiter
    chat = chat ? chat + '\n' + newChatValue : newChatValue;

    // Update the KV with the updated chat history
    await KV.put("chat", chat);

    // Return a success response
    return new Response('Chat value updated successfully!', { status: 200 });
  } else {
    // If the request method is not POST, retrieve the current chat history from the KV
    const chat = await KV.get("chat");

    // Split the chat history into an array of messages based on newline delimiter
    const chatHistory = chat ? chat.split('\n') : [];

    // Create an HTML response to display messages without list bullet points
    const htmlResponse = `
      <html>
        <body>
          <h1>Whatsweb</h1>
          <p>Huidig gesprek:</p>
          <div>
            ${chatHistory.map(message => `<p>${message}</p>`).join('')}
          </div>
          <form method="POST">
            <label for="chat">Nieuw chat bericht:</label>
            <input type="text" id="chat" name="chat" required>
            <button type="submit">Verzenden</button>
          </form>
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
  return formData;
}
