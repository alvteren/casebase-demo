
- Dynamic top-k selection: adjust the number of retrieved chunks depending on query length and complexity.
- Filter out irrelevant documents: use Pinecone metadata filters (e.g., by document type or topic).
- Semantic chunking instead of splitting by a fixed number of characters.
- Tuning overlap: too much overlap wastes tokens, too little loses context.
- Relevance scoring: verify chunk usefulness before including them in the prompt, instead of trusting Pinecone blindly.
- File-processing queues (BullMQ, RabbitMQ): handle large document indexing asynchronously.
- RAG result caching (Redis): useful for repetitive queries.
- Asynchronous text extraction to avoid blocking NestJS event loop.


Security and stability

- Rate limiting
- Circuit breakers for OpenAI and Pinecone calls
- Retries with exponential backoff