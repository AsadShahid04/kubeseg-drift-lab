# kubeseg-gaps

A tiny educational lab tool for exploring Kubernetes segmentation gaps and policy drift detection, inspired by Illumio CloudSecure's Zero Trust segmentation approach.

## Overview

**kubeseg-gaps** is a read-only analysis tool that works with mock data to demonstrate:

1. **Policy Gap Analysis & Auto-Suggest**
   - Identifies "risky" or "unprotected" flows (potential lateral movement)
   - Generates minimal suggested NetworkPolicy YAML snippets for least-privilege implementation

2. **Policy Drift Detection (Intent ↔ Policies)**
   - Compares high-level "intent" rules with actual NetworkPolicies
   - Flags missing policies for intent
   - Detects over-permissive policies that go beyond intent

This is an **educational prototype** built to learn about Zero Trust segmentation and explain concepts visually. It uses mock JSON/YAML data files to simulate Kubernetes/Calico flows and policies.

## Architecture

```
┌─────────────┐
│  Frontend  │  React + Vite + TypeScript + Tailwind CSS
│  (React)   │
└─────┬───────┘
      │ HTTP/REST
┌─────▼───────┐
│   Backend   │  FastAPI + Pydantic
│  (Python)   │
└─────┬───────┘
      │
┌─────▼───────┐
│  Mock Data  │  JSON/YAML files
│  (Local)    │
└─────────────┘
```

## Tech Stack

- **Backend:** Python 3, FastAPI, Pydantic
- **Frontend:** React + Vite, TypeScript, Tailwind CSS
- **Data:** Local JSON/YAML files under `backend/data/`

## Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI server (make sure you're in the `backend` directory):
   ```bash
   uvicorn main:app --reload
   ```

   The API will be available at `http://localhost:8000`
   
   **Note:** The server must be run from the `backend` directory for imports to work correctly.

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173` (or similar Vite port)

## Usage

### API Endpoints

- `GET /` - API information
- `GET /api/debug` - Raw data (flows, policies, intents)
- `GET /api/gaps` - Gap analysis (risky flows, unprotected flows, suggested policies)
- `GET /api/drift` - Drift detection (missing policies, over-permissive policies, namespace summaries)

### Frontend Views

1. **Gaps & Suggestions**
   - View risky flows (cross-namespace to sensitive resources)
   - View unprotected flows (allowed but not covered by policies)
   - Copy suggested NetworkPolicy YAML snippets

2. **Policy Drift**
   - Per-namespace summary cards
   - Missing policies (intent exists, no policy)
   - Over-permissive policies (policy allows more than intent)

## Data Models

### Flow
Represents network traffic between pods:
- Source/destination namespace, pod, labels
- Port and protocol
- Verdict (allow/deny)

### NetworkPolicy
Kubernetes/Calico-style network policy:
- Pod selector (which pods the policy applies to)
- Ingress rules (who can connect TO these pods)
- Egress rules (where these pods can connect TO)

### IntentRule
High-level security intent (Illumio-like):
- Source and destination selectors
- Allowed ports
- Description

## Mock Data

The project includes sample data in `backend/data/`:

- **flows.json**: 8 sample flows including risky cross-namespace flows
- **network_policies.yaml**: 3 sample policies (one intentionally over-permissive)
- **intent.yaml**: 3 intent rules defining desired communication patterns

## Future Directions

This prototype uses mock data. Future enhancements could include:

- **Real Calico Integration**
  - Wire flows to Calico flow logs APIs
  - Pull NetworkPolicies from Kubernetes API or Calico API
  - Support Calico GlobalNetworkPolicies

- **Illumio CloudSecure Integration**
  - Pull intent rules from Illumio CloudSecure API
  - Use Terraform provider for intent-as-code
  - Compare Illumio intent with actual K8s/Calico policies

- **Enhanced Analysis**
  - Historical drift tracking
  - Policy impact analysis
  - Automated policy generation with review workflow

## References

- [Illumio: Uncover Kubernetes Blind Spots](https://www.illumio.com/blog/uncover-kubernetes-blind-spots-why-agentless-container-security-is-a-must-have)
- [Illumio: Agentless Container Security](https://www.illumio.com/blog/agentless-container-security)
- [Calico Network Policy](https://docs.tigera.io/calico/latest/network-policy/get-started/calico-policy/calico-network-policy)
- [Calico Flow Logs](https://docs.tigera.io/calico/latest/observability/view-flow-logs)

## License

Educational prototype - use as needed for learning purposes.

