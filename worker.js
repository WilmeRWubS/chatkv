addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Check if the request method is POST
  if (request.method === 'POST') {
    // Parse the request body as form data
    const formData = await readRequestBody(request);

    // Extract the new chat value from the form data
    const newChatValue = formData.get('chat');

    // Store the new chat value in the KV
    await KV.put("chat", newChatValue);

    // Return a success response
    return new Response('Chat value updated successfully!', { status: 200 });
  } else {
    // If the request method is not POST, retrieve the current chat value from the KV
    const chat = await KV.get("chat");

    // Create an HTML response
    const htmlResponse = `
      <html>
        <body>
          <h1>Whatsweb</h1>
          <p>Huidig gesprek: ${chat ? chat.toString() : 'Er is nog niet gechat'}</p>
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
