# Policy Sandbox Feature

## Overview

The Policy Sandbox is a "what-if" natural language policy testing feature that allows you to describe network segmentation policies in plain English and see the corresponding Kubernetes NetworkPolicy YAML without touching any real cluster.

## How It Works

1. **Natural Language Input**: You type a policy description in plain English

   - Example: "Allow frontend pods in prod namespace to access payments service on port 443 only"

2. **AI Conversion**: The OpenAI API converts your description to structured intent (JSON)

3. **Policy Generation**: Your existing code generates NetworkPolicy YAML from the intent

4. **Preview**: You see the parsed intent, generated YAML, and an explanation - all without applying anything

## Setup

### 1. Install OpenAI Dependency

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set OpenAI API Key

```bash
export OPENAI_API_KEY=sk-your-api-key-here
```

Or create a `.env` file in the `backend/` directory:

```
OPENAI_API_KEY=sk-your-api-key-here
```

### 3. Start Backend

```bash
cd backend
uvicorn main:app --reload
```

### 4. Start Frontend

```bash
cd frontend
npm run dev
```

## Usage

1. Navigate to the "Policy Sandbox" tab in the UI
2. Type a policy description in the text area
3. Click "Generate Policy"
4. Review the parsed intent, generated YAML, and explanation
5. Copy the YAML if you want to use it

## Example Queries

- "Allow frontend pods in prod namespace to access payments service on port 443 only"
- "Only pods with label app=api can talk to database pods with label role=db on port 5432"
- "Block all traffic to pods with label env=prod except from monitoring namespace"
- "Allow web-frontend to access api-gateway on HTTPS (443) in production namespace"

## Cost Considerations

- **Default (GPT-3.5-turbo)**: ~$0.001-0.003 per request (fast, cheap)
- **GPT-4**: ~$0.03-0.10 per request (more accurate, slower, more expensive)

Use GPT-3.5-turbo for most queries. Enable GPT-4 only for complex scenarios.

## Architecture

```
User Input (Natural Language)
    ↓
OpenAI API (NL → Structured Intent JSON)
    ↓
intent_to_network_policy() (Intent → NetworkPolicy object)
    ↓
policy_to_yaml() (NetworkPolicy → YAML string)
    ↓
Display to User
```

## API Endpoint

**POST** `/api/nl-intent`

Request body:

```json
{
  "description": "Allow frontend pods to access api on port 8080",
  "use_gpt4": false
}
```

Response:

```json
{
  "intent": {
    "src_selector": {
      "namespace": "prod",
      "labels": { "app": "frontend" }
    },
    "dst_selector": {
      "namespace": "prod",
      "labels": { "app": "api" }
    },
    "allowed_ports": [{ "port": 8080, "protocol": "TCP" }],
    "description": "..."
  },
  "policy_yaml": "apiVersion: networking.k8s.io/v1\n...",
  "explanation": "This policy will...",
  "confidence": 0.9,
  "policy_name": "nl-intent-...",
  "namespace": "prod"
}
```

## Safety

- **No cluster changes**: This is a read-only sandbox
- **Validation**: Generated policies follow Kubernetes NetworkPolicy schema
- **Review required**: Always review generated policies before applying to production

## Troubleshooting

### "OpenAI API key required" error

- Make sure `OPENAI_API_KEY` environment variable is set
- Restart the backend server after setting the key

### "Failed to process request" error

- Check your OpenAI API key is valid
- Check you have API credits
- Try a simpler query
- Check backend logs for detailed error messages

### Generated policy doesn't match intent

- Try being more specific in your description
- Use GPT-4 for complex queries (enable checkbox)
- Check the parsed intent JSON to see what was understood
