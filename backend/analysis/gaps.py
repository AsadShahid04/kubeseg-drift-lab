"""Gap analysis: find unprotected flows, risky flows, and suggest policies."""
from typing import List
from pydantic import BaseModel
from models.flow import Flow
from models.policy import NetworkPolicy


class GapFlow(BaseModel):
    """A flow that is allowed but not protected by any policy."""
    flow: Flow
    reason: str


class RiskyFlow(BaseModel):
    """A flow that represents a security risk."""
    flow: Flow
    risk_score: int
    reason: str


class SuggestedPolicy(BaseModel):
    """A suggested NetworkPolicy to protect unprotected flows."""
    namespace: str
    target_labels: dict[str, str]
    yaml: str


def _labels_match(flow_labels: dict[str, str], selector_labels: dict[str, str]) -> bool:
    """
    Check if flow labels match selector labels (subset matching).
    
    A selector matches if all key-value pairs in the selector exist in the flow labels.
    Empty selector {} matches everything (wildcard).
    """
    if not selector_labels:  # Empty selector = wildcard
        return True
    
    return all(
        flow_labels.get(key) == value
        for key, value in selector_labels.items()
    )


def _is_flow_protected(flow: Flow, policies: List[NetworkPolicy]) -> bool:
    """
    Check if a flow is protected by any NetworkPolicy.
    
    A flow is protected if:
    1. A policy exists in the destination namespace
    2. The policy's pod_selector matches the destination pod labels
    3. An ingress rule allows the source pod labels
    4. The port/protocol is allowed
    """
    for policy in policies:
        # Check namespace match
        if policy.namespace != flow.dst_ns:
            continue
        
        # Check if policy selects the destination pod
        if not _labels_match(flow.dst_labels, policy.pod_selector):
            continue
        
        # Check ingress rules
        for ingress_rule in policy.ingress:
            # Check if any from_pod_selector matches source
            source_allowed = False
            for pod_selector in ingress_rule.from_pod_selectors:
                if _labels_match(flow.src_labels, pod_selector.match_labels):
                    source_allowed = True
                    break
            
            if not source_allowed:
                continue
            
            # Check if port/protocol is allowed
            # If no ports specified, all ports are allowed
            if not ingress_rule.ports:
                return True
            
            for port_spec in ingress_rule.ports:
                if port_spec.port == flow.port and port_spec.protocol == flow.protocol:
                    return True
    
    return False


def find_unprotected_flows(flows: List[Flow], policies: List[NetworkPolicy]) -> List[GapFlow]:
    """
    Find flows that are allowed but not protected by any NetworkPolicy.
    
    A flow is unprotected if:
    - verdict == "allow" AND
    - No NetworkPolicy explicitly allows that source/port combination
    """
    unprotected = []
    
    for flow in flows:
        if flow.verdict != "allow":
            continue  # Only check allowed flows
        
        if not _is_flow_protected(flow, policies):
            unprotected.append(GapFlow(
                flow=flow,
                reason=f"No policy in namespace '{flow.dst_ns}' protects destination pod '{flow.dst_pod}' from source '{flow.src_ns}/{flow.src_pod}' on {flow.protocol}:{flow.port}"
            ))
    
    return unprotected


def find_risky_flows(flows: List[Flow]) -> List[RiskyFlow]:
    """
    Identify flows that represent security risks.
    
    A flow is risky if:
    - Cross-namespace (src_ns != dst_ns) AND
    - Destination has sensitive labels (role=db OR env=prod)
    """
    risky = []
    
    for flow in flows:
        if flow.verdict != "allow":
            continue  # Only analyze allowed flows
        
        risk_score = 5  # Base risk score
        reasons = []
        
        # Check for cross-namespace
        is_cross_namespace = flow.src_ns != flow.dst_ns
        if is_cross_namespace:
            risk_score += 2
            reasons.append("cross-namespace traffic")
        
        # Check for sensitive destination labels
        is_prod = flow.dst_labels.get("env") == "prod"
        is_db = flow.dst_labels.get("role") == "db"
        
        if is_prod:
            risk_score += 3
            reasons.append("destination in prod environment")
        
        if is_db:
            risk_score += 3
            reasons.append("destination is database")
        
        # Only mark as risky if it meets criteria
        if is_cross_namespace and (is_prod or is_db):
            risky.append(RiskyFlow(
                flow=flow,
                risk_score=min(risk_score, 13),  # Cap at 13
                reason="; ".join(reasons)
            ))
    
    return risky


def suggest_policies(unprotected_flows: List[GapFlow]) -> List[SuggestedPolicy]:
    """
    Generate minimal NetworkPolicy suggestions for unprotected flows.
    
    Groups flows by (namespace, destination labels) and creates least-privilege policies.
    """
    import yaml
    from collections import defaultdict
    
    # Group flows by destination namespace and labels
    flow_groups: dict[tuple[str, str], List[Flow]] = defaultdict(list)
    
    for gap_flow in unprotected_flows:
        flow = gap_flow.flow
        # Create a fingerprint from destination labels (sorted for consistency)
        label_fingerprint = ",".join(f"{k}={v}" for k, v in sorted(flow.dst_labels.items()))
        key = (flow.dst_ns, label_fingerprint)
        flow_groups[key].append(flow)
    
    suggestions = []
    
    for (namespace, label_fp), flows in flow_groups.items():
        # Extract destination labels from first flow (all should have same dst_labels)
        target_labels = flows[0].dst_labels
        
        # Collect unique (src_labels, port, protocol) combinations
        allowed_combos: dict[tuple[str, str], dict[str, str]] = {}
        # Key: (port, protocol), Value: src_labels (we'll merge compatible labels)
        
        for flow in flows:
            port_protocol = (flow.port, flow.protocol)
            if port_protocol not in allowed_combos:
                allowed_combos[port_protocol] = flow.src_labels.copy()
            else:
                # Merge labels (keep common keys with same values)
                existing = allowed_combos[port_protocol]
                merged = {}
                for key in set(existing.keys()) | set(flow.src_labels.keys()):
                    if key in existing and key in flow.src_labels:
                        if existing[key] == flow.src_labels[key]:
                            merged[key] = existing[key]
                allowed_combos[port_protocol] = merged
        
        # Group by source labels to create from_pod_selectors
        # For simplicity, create one selector per unique src_labels set
        src_label_groups: dict[str, List[tuple[int, str]]] = defaultdict(list)
        for (port, protocol), src_labels in allowed_combos.items():
            src_key = ",".join(f"{k}={v}" for k, v in sorted(src_labels.items()))
            src_label_groups[src_key].append((port, protocol))
        
        # Build ingress rules
        ingress_rules = []
        for src_labels_str, ports in src_label_groups.items():
            # Parse back to dict
            src_labels = {}
            if src_labels_str:
                for pair in src_labels_str.split(","):
                    k, v = pair.split("=", 1)
                    src_labels[k] = v
            
            ingress_rule = {
                "from_pod_selectors": [{"match_labels": src_labels}],
                "ports": [{"port": port, "protocol": protocol} for port, protocol in ports]
            }
            ingress_rules.append(ingress_rule)
        
        # Generate YAML
        policy_name = f"protect-{namespace}-{target_labels.get('app', 'pods')}"
        policy = {
            "apiVersion": "networking.k8s.io/v1",
            "kind": "NetworkPolicy",
            "metadata": {
                "name": policy_name,
                "namespace": namespace
            },
            "spec": {
                "podSelector": {"matchLabels": target_labels},
                "policyTypes": ["Ingress"],
                "ingress": ingress_rules
            }
        }
        
        yaml_str = yaml.dump(policy, default_flow_style=False, sort_keys=False)
        yaml_str = "# Auto-generated least-privilege suggestion\n" + yaml_str
        
        suggestions.append(SuggestedPolicy(
            namespace=namespace,
            target_labels=target_labels,
            yaml=yaml_str
        ))
    
    return suggestions

