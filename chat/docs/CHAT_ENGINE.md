# Remrin Chat Engine v2 - Quick Reference

This document provides a quick reference for developers interacting with the Remrin Chat Engine v2 API.

## API Endpoints

### 1. Chat (`/api/v2/chat`)
Main endpoint for streaming LLM responses.

**Method**: `POST`
**Content-Type**: `application/json`

**Request Body**:
```json
{
  "messages": [
    { "role": "user", "content": "Hello!", "timestamp": "2023-12-31T23:59:59Z" }
  ],
  "personaId": "optional-uuid",
  "systemPrompt": "optional override",
  "preferredProvider": "openrouter",
  "enableSearch": true,
  "files": []
}
```

**Returns**: `text/event-stream` (SSE)
- `data: {"content": "...", "provider": "..."}`
- `data: {"type": "followup", "content": "..."}` (Carrot Engine)
- `data: [DONE]`

---

### 2. File Upload (`/api/v2/upload`)
Process files for context extraction.

**Method**: `POST`
**Content-Type**: `multipart/form-data`

**Request Body**:
- `file`: The file to upload (Max 10MB)

**Returns**: `application/json`
```json
{
  "id": "uuid",
  "name": "example.pdf",
  "type": "pdf",
  "size": 1234,
  "extractedText": "...",
  "status": "success"
}
```

---

### 3. Search (`/api/v2/search`)
Standalone web search access.

**Method**: `POST`
**Content-Type**: `application/json`

**Request Body**:
```json
{
  "query": "Who is Antigravity?",
  "maxResults": 5
}
```

**Returns**: `application/json`
```json
{
  "results": [
    { "title": "...", "url": "...", "snippet": "..." }
  ],
  "provider": "tavily"
}
```

---

### 4. Knowledge Store (`/api/v2/knowledge`)
Manage the Sovereign RAG Vault.

- `GET /api/v2/knowledge`: List files.
- `POST /api/v2/knowledge`: Add file/metadata.
- `DELETE /api/v2/knowledge/[uuid]`: Remove file.
- `POST /api/v2/knowledge/search`: Sematic search in vault.

## Configuration Options

### User Tiers
Tiers are defined in `lib/chat-engine/types.ts`:
- `free`: OpenRouter (Free), basic search.
- `pro`: DeepSeek, Claude, full search, file uploads.
- `premium`: Gemini, 128k context, advanced reasoning.
- `enterprise`: Custom APIs, unlimited limits.

### Provider Settings
Available in `/admin/chat-config`:
- Toggle providers globally.
- Update API keys.
- Monitor provider status.
