"""FastAPI backend for kubeseg-gaps."""
import json
import yaml
from pathlib import Path
from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import sys
from pathlib import Path

# Add backend directory to path for imports
backend_dir = Path(__file__).parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from models.flow import Flow
from models.policy import NetworkPolicy, IngressRule, EgressRule, PodSelector, NamespaceSelector, PortSpec
from models.intent import IntentRule, PortSpec as IntentPortSpec
from analysis.gaps import (
    find_unprotected_flows,
    find_risky_flows,
    suggest_policies,
)
from analysis.drift import (
    find_missing_policies_for_intent,
    find_over_permissive_policies,
    calculate_namespace_summary,
)

# Initialize FastAPI app
app = FastAPI(
    title="kubeseg-gaps",
    description="Kubernetes segmentation gap analysis and drift detection",
    version="0.1.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data directory
DATA_DIR = Path(__file__).parent / "data"

# Cache for loaded data
_flows_cache: List[Flow] = None
_policies_cache: List[NetworkPolicy] = None
_intents_cache: List[IntentRule] = None


def load_flows() -> List[Flow]:
    """Load flows from JSON file."""
    global _flows_cache
    if _flows_cache is not None:
        return _flows_cache
    
    flows_path = DATA_DIR / "flows.json"
    with open(flows_path, "r") as f:
        data = json.load(f)
    
    _flows_cache = [Flow(**item) for item in data]
    return _flows_cache


def load_policies() -> List[NetworkPolicy]:
    """Load NetworkPolicies from YAML file."""
    global _policies_cache
    if _policies_cache is not None:
        return _policies_cache
    
    policies_path = DATA_DIR / "network_policies.yaml"
    with open(policies_path, "r") as f:
        data = yaml.safe_load(f)
    
    _policies_cache = []
    for item in data:
        # Convert YAML structure to our model
        ingress_rules = []
        for ingress in item.get("ingress", []):
            from_pod_selectors = [
                PodSelector(match_labels=selector.get("match_labels", {}))
                for selector in ingress.get("from_pod_selectors", [])
            ]
            
            from_ns_selectors = [
                NamespaceSelector(match_labels=selector.get("match_labels", {}))
                for selector in ingress.get("from_ns_selectors", [])
            ]
            
            ports = [
                PortSpec(port=port["port"], protocol=port["protocol"])
                for port in ingress.get("ports", [])
            ]
            
            ingress_rules.append(IngressRule(
                from_pod_selectors=from_pod_selectors,
                from_ns_selectors=from_ns_selectors,
                ports=ports
            ))
        
        egress_rules = []
        for egress in item.get("egress", []):
            to_pod_selectors = [
                PodSelector(match_labels=selector.get("match_labels", {}))
                for selector in egress.get("to_pod_selectors", [])
            ]
            
            to_ns_selectors = [
                NamespaceSelector(match_labels=selector.get("match_labels", {}))
                for selector in egress.get("to_ns_selectors", [])
            ]
            
            ports = [
                PortSpec(port=port["port"], protocol=port["protocol"])
                for port in egress.get("ports", [])
            ]
            
            egress_rules.append(EgressRule(
                to_pod_selectors=to_pod_selectors,
                to_ns_selectors=to_ns_selectors,
                ports=ports
            ))
        
        _policies_cache.append(NetworkPolicy(
            name=item["name"],
            namespace=item["namespace"],
            pod_selector=item.get("pod_selector", {}),
            ingress=ingress_rules,
            egress=egress_rules
        ))
    
    return _policies_cache


def load_intents() -> List[IntentRule]:
    """Load intent rules from YAML file."""
    global _intents_cache
    if _intents_cache is not None:
        return _intents_cache
    
    intents_path = DATA_DIR / "intent.yaml"
    with open(intents_path, "r") as f:
        data = yaml.safe_load(f)
    
    _intents_cache = []
    for item in data:
        # Convert ports to IntentPortSpec
        allowed_ports = [
            IntentPortSpec(port=p["port"], protocol=p["protocol"])
            for p in item.get("allowed_ports", [])
        ]
        _intents_cache.append(IntentRule(
            id=item["id"],
            src_selector=item["src_selector"],
            dst_selector=item["dst_selector"],
            allowed_ports=allowed_ports,
            description=item["description"]
        ))
    
    return _intents_cache


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "kubeseg-gaps API",
        "endpoints": {
            "/api/debug": "Raw data (flows, policies, intents)",
            "/api/gaps": "Gap analysis (risky flows, unprotected flows, suggestions)",
            "/api/drift": "Drift detection (missing policies, over-permissive policies)"
        }
    }


@app.get("/api/debug")
async def get_debug():
    """Return raw data for debugging."""
    flows = load_flows()
    policies = load_policies()
    intents = load_intents()
    
    return {
        "flows": [flow.model_dump() for flow in flows],
        "policies": [policy.model_dump() for policy in policies],
        "intents": [intent.model_dump() for intent in intents]
    }


@app.get("/api/gaps")
async def get_gaps():
    """Get gap analysis: risky flows, unprotected flows, and policy suggestions."""
    flows = load_flows()
    policies = load_policies()
    
    risky_flows = find_risky_flows(flows)
    unprotected_flows = find_unprotected_flows(flows, policies)
    suggested_policies = suggest_policies(unprotected_flows)
    
    return {
        "risky_flows": [item.model_dump() for item in risky_flows],
        "unprotected_flows": [item.model_dump() for item in unprotected_flows],
        "suggested_policies": [item.model_dump() for item in suggested_policies]
    }


@app.get("/api/drift")
async def get_drift():
    """Get drift detection: missing policies, over-permissive policies, namespace summary."""
    intents = load_intents()
    policies = load_policies()
    
    missing = find_missing_policies_for_intent(intents, policies)
    over_permissive = find_over_permissive_policies(intents, policies)
    summary = calculate_namespace_summary(intents, policies, missing, over_permissive)
    
    return {
        "missing_policies": [item.model_dump() for item in missing],
        "over_permissive": [item.model_dump() for item in over_permissive],
        "per_namespace_summary": [item.model_dump() for item in summary]
    }


@app.get("/api/flows")
async def get_flows():
    """Get flows data for network visualization."""
    flows = load_flows()
    policies = load_policies()
    
    # Calculate risk scores for flows
    risky_flows = find_risky_flows(flows)
    unprotected_flows = find_unprotected_flows(flows, policies)
    
    risky_flow_set = {f"{f.flow.src_ns}/{f.flow.src_pod}→{f.flow.dst_ns}/{f.flow.dst_pod}" for f in risky_flows}
    unprotected_flow_set = {f"{f.flow.src_ns}/{f.flow.src_pod}→{f.flow.dst_ns}/{f.flow.dst_pod}" for f in unprotected_flows}
    
    # Add metadata to flows
    enriched_flows = []
    for flow in flows:
        flow_key = f"{flow.src_ns}/{flow.src_pod}→{flow.dst_ns}/{flow.dst_pod}"
        is_risky = flow_key in risky_flow_set
        is_unprotected = flow_key in unprotected_flow_set
        
        enriched_flows.append({
            **flow.model_dump(),
            "is_risky": is_risky,
            "is_unprotected": is_unprotected,
            "risk_score": next((rf.risk_score for rf in risky_flows if rf.flow == flow), 0)
        })
    
    return {
        "flows": enriched_flows
    }

