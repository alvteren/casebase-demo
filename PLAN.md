1. Initialize Nx monorepo with frontend and backend apps

2. Initialize the project

• Create a new NestJS project using nest new.
• Set up the main modules: ChatModule, UploadModule, VectorStoreModule, PdfModule.

3. Configure environment variables

• Add .env file with:
– OpenAI API key
– Pinecone API key, index name
– File size limits and chunking parameters
• Do not commit it. Ever.

4. Integrate Pinecone (Vector Database)

• Install and initialize Pinecone client.
• Create VectorStoreService for:
– embedding generation
– storing vectors
– similarity search
– metadata management

5. Document upload module

• Add an upload endpoint.
• Extract text from PDF, DOCX, TXT.
• Split text into chunks.
• Pass chunks to VectorStoreService to embed + index.
• Store document metadata.

6. Build the RAG pipeline

Create ChatService that:
• embeds user queries
• fetches relevant context from Pinecone
• composes the final prompt (instruction + context + user question)
• sends it to OpenAI Chat Completion
• returns a clean answer

7. Chat API

• /chat/query endpoint
• Accepts a user message
• Runs the RAG pipeline
• Returns the answer (and optionally the retrieved context)

8. PDF generation

• Use PDFKit inside PdfModule.
• Collect content from the chat session or a specific request.
• Render a structured PDF and send it back as a downloadable file.

9. Frontend (React + Tailwind)

• Chat UI
• File upload UI
• Processing indicators
• PDF generation button
• Use Tailwind for styling so everything stays readable
• Connect to backend via REST or WebSockets

10. UX improvements

• Loading states for file indexing
• Clear error messages
• Visual confirmation that documents are stored and searchable
• Chat history view and export options

11. Error handling

• Handle OpenAI rate limits
• Pinecone timeouts
• Invalid or unsupported documents
• Graceful fallbacks instead of dumping stack traces on the user

12. Documents Library
• Backend for CRUD with list of documents
• Frontend: List in dialog. Upload button in the dialog.

13. Store chat history

• CRUD messages in DB