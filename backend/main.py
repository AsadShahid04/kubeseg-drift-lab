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
from analysis.pr_snippets import generate_pr_snippet_for_suggested_policy, bundle_top_fixes
from ai.nl_intent import NLIntentConverter, intent_to_network_policy, policy_to_yaml

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
    
    # Add risk levels and AI summaries
    from ai.nl_intent import NLIntentConverter
    import os
    
    enhanced_risky_flows = []
    try:
        converter = NLIntentConverter(model="gpt-3.5-turbo")
        for risky_flow in risky_flows[:10]:  # Limit to top 10 for API efficiency
            # Determine risk level
            if risky_flow.risk_score >= 80:
                risk_level = "critical"
            elif risky_flow.risk_score >= 60:
                risk_level = "high"
            elif risky_flow.risk_score >= 40:
                risk_level = "medium"
            else:
                risk_level = "low"
            
            # Generate AI summary
            try:
                prompt = f"""Generate a concise 1-sentence security risk summary for this network flow:
Source: {risky_flow.flow.src_ns}/{risky_flow.flow.src_pod}
Destination: {risky_flow.flow.dst_ns}/{risky_flow.flow.dst_pod}
Port: {risky_flow.flow.port}/{risky_flow.flow.protocol}
Risk Factors: {risky_flow.reason}
Risk Score: {risky_flow.risk_score}/100

Provide a professional, concise summary suitable for security analysts."""
                
                response = converter.client.chat.completions.create(
                    model=converter.model,
                    messages=[
                        {"role": "system", "content": "You are a security analyst providing concise risk summaries."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=100,
                    temperature=0.7
                )
                summary = response.choices[0].message.content.strip()
            except:
                summary = f"Security risk detected: {risky_flow.reason}"
            
            enhanced_risky_flows.append({
                **risky_flow.model_dump(),
                "risk_level": risk_level,
                "summary": summary
            })
        
        # Add remaining flows without AI summaries
        for risky_flow in risky_flows[10:]:
            if risky_flow.risk_score >= 80:
                risk_level = "critical"
            elif risky_flow.risk_score >= 60:
                risk_level = "high"
            elif risky_flow.risk_score >= 40:
                risk_level = "medium"
            else:
                risk_level = "low"
            
            enhanced_risky_flows.append({
                **risky_flow.model_dump(),
                "risk_level": risk_level,
                "summary": f"Security risk: {risky_flow.reason}"
            })
    except Exception as e:
        # Fallback if OpenAI fails
        for risky_flow in risky_flows:
            if risky_flow.risk_score >= 80:
                risk_level = "critical"
            elif risky_flow.risk_score >= 60:
                risk_level = "high"
            elif risky_flow.risk_score >= 40:
                risk_level = "medium"
            else:
                risk_level = "low"
            
            enhanced_risky_flows.append({
                **risky_flow.model_dump(),
                "risk_level": risk_level,
                "summary": f"Security risk: {risky_flow.reason}"
            })
    
    return {
        "risky_flows": enhanced_risky_flows,
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


@app.post("/api/nl-intent")
async def convert_nl_to_intent(request: dict):
    """
    Convert natural language policy description to NetworkPolicy.
    
    Request body:
    {
        "description": "natural language description",
        "use_gpt4": false  # optional, defaults to gpt-3.5-turbo for cost
    }
    
    Returns:
    {
        "intent": {...},
        "policy_yaml": "...",
        "explanation": "...",
        "confidence": 0.9
    }
    """
    try:
        description = request.get("description", "")
        use_gpt4 = request.get("use_gpt4", False)
        
        if not description:
            return {"error": "Description is required"}
        
        # Get cluster context from existing data
        flows = load_flows()
        policies = load_policies()
        
        # Extract unique namespaces
        namespaces = set()
        common_labels = {}
        label_counts = {}
        
        for flow in flows:
            namespaces.add(flow.src_ns)
            namespaces.add(flow.dst_ns)
            
            # Count label usage
            for labels in [flow.src_labels, flow.dst_labels]:
                for key, value in labels.items():
                    label_key = f"{key}={value}"
                    label_counts[label_key] = label_counts.get(label_key, 0) + 1
        
        # Get most common labels
        sorted_labels = sorted(label_counts.items(), key=lambda x: x[1], reverse=True)
        for label_str, count in sorted_labels[:20]:  # Top 20
            key, value = label_str.split("=", 1)
            if key not in common_labels:
                common_labels[key] = []
            if value not in common_labels[key]:
                common_labels[key].append(value)
        
        cluster_context = {
            "namespaces": sorted(list(namespaces)),
            "common_labels": common_labels
        }
        
        # Convert NL to intent
        model = "gpt-4" if use_gpt4 else "gpt-3.5-turbo"
        converter = NLIntentConverter(model=model)
        result = converter.convert_to_intent(description, cluster_context)
        
        if result.get("error"):
            return {"error": result["error"]}
        
        intent = result["intent"]
        
        # Convert intent to NetworkPolicy
        policy = intent_to_network_policy(intent)
        policy_yaml = policy_to_yaml(policy)
        
        # Add comment to YAML
        policy_yaml = f"# Generated from natural language: {description}\n# {result['explanation']}\n\n{policy_yaml}"
        
        return {
            "intent": intent,
            "policy_yaml": policy_yaml,
            "explanation": result["explanation"],
            "confidence": result["confidence"],
            "policy_name": policy.name,
            "namespace": policy.namespace
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/pr-snippets/{policy_index}")
async def get_pr_snippet(policy_index: int):
    """Get PR snippet for a suggested policy by index."""
    try:
        flows = load_flows()
        policies = load_policies()
        
        from analysis.gaps import find_unprotected_flows, suggest_policies
        unprotected = find_unprotected_flows(flows, policies)
        suggested = suggest_policies(unprotected)
        
        if policy_index < 0 or policy_index >= len(suggested):
            return {"error": "Invalid policy index"}
        
        snippet = generate_pr_snippet_for_suggested_policy(suggested[policy_index])
        return snippet.model_dump()
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/bundled-fixes")
async def get_bundled_fixes(top_n: int = 3):
    """Get bundled YAML for top N suggested policies."""
    try:
        flows = load_flows()
        policies = load_policies()
        
        from analysis.gaps import find_unprotected_flows, suggest_policies
        unprotected = find_unprotected_flows(flows, policies)
        suggested = suggest_policies(unprotected)
        
        bundled = bundle_top_fixes(suggested, top_n)
        return bundled.model_dump()
    except Exception as e:
        return {"error": str(e)}


@app.post("/api/namespace-brief")
async def get_namespace_brief(request: dict):
    """
    Generate AI brief for a namespace.
    
    Request body:
    {
        "namespace": "prod"
    }
    """
    try:
        namespace = request.get("namespace", "")
        if not namespace:
            return {"error": "Namespace is required"}
        
        flows = load_flows()
        policies = load_policies()
        intents = load_intents()
        
        from analysis.gaps import find_risky_flows, find_unprotected_flows
        from analysis.drift import find_missing_policies_for_intent, find_over_permissive_policies
        
        # Collect namespace data
        ns_flows = [f for f in flows if f.src_ns == namespace or f.dst_ns == namespace]
        ns_policies = [p for p in policies if p.namespace == namespace]
        risky_flows = find_risky_flows(ns_flows)
        unprotected = find_unprotected_flows(ns_flows, ns_policies)
        missing = find_missing_policies_for_intent(intents, ns_policies)
        over_permissive = find_over_permissive_policies(intents, ns_policies)
        
        # Count services (unique apps)
        services = set()
        for flow in ns_flows:
            services.add(flow.src_labels.get("app", "unknown"))
            services.add(flow.dst_labels.get("app", "unknown"))
        
        # Build summary
        summary = {
            "namespace": namespace,
            "service_count": len(services),
            "services": list(services)[:5],  # Top 5
            "policy_count": len(ns_policies),
            "risky_flows_count": len(risky_flows),
            "unprotected_flows_count": len(unprotected),
            "missing_policies_count": len([m for m in missing if m.namespace == namespace]),
            "over_permissive_count": len([o for o in over_permissive if o.namespace == namespace]),
            "top_risky_flows": [
                {
                    "src": f"{rf.flow.src_ns}/{rf.flow.src_pod}",
                    "dst": f"{rf.flow.dst_ns}/{rf.flow.dst_pod}",
                    "risk_score": rf.risk_score
                }
                for rf in risky_flows[:3]
            ]
        }
        
        # Generate AI brief using OpenAI
        try:
            converter = NLIntentConverter(model="gpt-3.5-turbo")
            prompt = f"""Generate a concise SOC-style security brief for Kubernetes namespace '{namespace}'.
            
Summary data:
- {summary['service_count']} services: {', '.join(summary['services'])}
- {summary['policy_count']} NetworkPolicies
- {summary['risky_flows_count']} risky flows detected
- {summary['unprotected_flows_count']} unprotected flows
- {summary['missing_policies_count']} missing policies
- {summary['over_permissive_count']} over-permissive policies

Top risky flows:
{chr(10).join(f"- {rf['src']} → {rf['dst']} (risk: {rf['risk_score']})" for rf in summary['top_risky_flows'])}

Write a 2-3 sentence brief in SOC analyst style, highlighting key risks and notable drift items."""
            
            response = converter.client.chat.completions.create(
                model=converter.model,
                messages=[
                    {"role": "system", "content": "You are a SOC security analyst writing brief security summaries for Kubernetes namespaces."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            brief = response.choices[0].message.content.strip()
        except Exception as e:
            # Fallback if OpenAI fails
            brief = f"{namespace} hosts {summary['service_count']} services, has {summary['policy_count']} policies, and {summary['risky_flows_count']} risky flows detected."
        
        return {
            "namespace": namespace,
            "summary": summary,
            "brief": brief
        }
    except Exception as e:
        return {"error": str(e)}



