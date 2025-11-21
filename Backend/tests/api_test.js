const http = require('http');

const makeRequest = (path, method = 'GET', body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  try {
    console.log('Testing GET /personas...');
    const personasRes = await makeRequest('/personas');
    console.log('Status:', personasRes.statusCode);
    console.log('Body:', personasRes.body);

    if (personasRes.statusCode === 200 && Array.isArray(personasRes.body)) {
      console.log('PASS: /personas returned a list.');
    } else {
      console.error('FAIL: /personas did not return a list.');
    }

    console.log('\nTesting POST /ask (Mock)...');
    // Note: This will fail if OpenAI/Pinecone keys are not set or server is not running.
    // We are just testing the route existence and basic validation here if keys are missing.
    const askRes = await makeRequest('/ask', 'POST', {
      personaId: 'kalam',
      question: 'What is success?'
    });
    console.log('Status:', askRes.statusCode);
    console.log('Body:', askRes.body);

  } catch (error) {
    console.error('Test failed (is the server running?):', error.message);
  }
};

runTests();
