# SageSearch Backend

Backend for the SageSearch RAG application.

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Variables:**
    Copy `.env.example` to `.env` and fill in your keys:
    ```bash
    cp .env.example .env
    ```
    - `OPENAI_API_KEY`: Your OpenAI API key.
    - `PINECONE_API_KEY`: Your Pinecone API key.
    - `PINECONE_INDEX`: Your Pinecone index name (default: `sagesearch`).

3.  **Download Data:**
    ```bash
    node scripts/downloadBooks.js
    ```
    *Note: For copyrighted works (like Kalam's), you may need to manually place text files in `data/texts`.*

4.  **Ingest Data:**
    ```bash
    node scripts/ingestData.js
    ```
    This will chunk the texts, generate embeddings, and upload them to Pinecone.

## Running the Server

```bash
npm start
# or for dev
npm run dev
```

## API Endpoints

-   `GET /personas`: List available personas.
-   `POST /ask`: Ask a question.
    ```json
    {
      "personaId": "kalam",
      "question": "How do I achieve my dreams?"
    }
    ```

## Testing

Start the server in one terminal, then run:
```bash
node tests/api_test.js
```
