"""Drift detection: compare intent rules with actual NetworkPolicies."""
from typing import List, Optional, Literal
from pydantic import BaseModel
from models.intent import IntentRule
from models.policy import NetworkPolicy


class DriftItem(BaseModel):
    """Represents a drift between intent and actual policies."""
    type: Literal["missing_policy", "over_permissive"]
    intent_id: Optional[str] = None
    policy_name: Optional[str] = None
    namespace: str
    description: str
    suggested_action: str


class NamespaceSummary(BaseModel):
    """Summary of drift per namespace."""
    namespace: str
    intent_count: int
    aligned_count: int
    drift_count: int


def _labels_match(flow_labels: dict[str, str], selector_labels: dict[str, str]) -> bool:
    """
    Check if labels match selector (subset matching).
    Empty selector {} matches everything.
    """
    if not selector_labels:
        return True
    return all(
        flow_labels.get(key) == value
        for key, value in selector_labels.items()
    )


def _selector_covers_intent(selector_labels: dict[str, str], intent_selector: dict[str, str]) -> bool:
    """
    Check if a policy selector covers an intent selector.
    
    A policy selector covers intent if:
    - The policy selector is a subset of (or equal to) the intent selector
    - OR the policy selector is empty (wildcard) and intent is also empty
    """
    if not selector_labels:  # Wildcard selector
        return True  # Wildcard covers everything
    
    # Check if policy selector matches intent selector exactly or is more restrictive
    # For intent matching, we want policy to allow at least what intent requires
    # So policy selector should be subset of intent selector
    return all(
        intent_selector.get(key) == value
        for key, value in selector_labels.items()
    )


def _intent_covered_by_policy(intent: IntentRule, policy: NetworkPolicy) -> bool:
    """
    Check if a policy covers an intent rule.
    
    Returns True if:
    1. Policy is in the same namespace (or we assume namespace from intent)
    2. Policy's pod_selector matches intent's dst_selector
    3. Policy has an ingress rule that allows intent's src_selector
    4. Policy allows intent's allowed_ports
    """
    # Check if policy selects the intended destination
    if not _labels_match(intent.dst_selector, policy.pod_selector):
        return False
    
    # Check ingress rules
    for ingress_rule in policy.ingress:
        # Check if any from_pod_selector matches intent's src_selector
        src_allowed = False
        for pod_selector in ingress_rule.from_pod_selectors:
            if _selector_covers_intent(pod_selector.match_labels, intent.src_selector):
                src_allowed = True
                break
        
        if not src_allowed:
            continue
        
        # Check if ports are allowed
        # If no ports specified in rule, all ports are allowed
        if not ingress_rule.ports:
            return True
        
        # Check if all intent ports are covered
        intent_ports = {(p.port, p.protocol) for p in intent.allowed_ports}
        rule_ports = {(p.port, p.protocol) for p in ingress_rule.ports}
        
        if intent_ports.issubset(rule_ports):
            return True
    
    return False


def find_missing_policies_for_intent(
    intents: List[IntentRule],
    policies: List[NetworkPolicy]
) -> List[DriftItem]:
    """
    Find intent rules that don't have corresponding policies.
    
    For each intent, check if any policy covers it. If not, it's missing.
    """
    missing = []
    
    # We need to infer namespace from policies or assume all intents are in same namespace
    # For now, we'll check all policies regardless of namespace
    # In a real system, intents would have namespace info
    
    for intent in intents:
        covered = False
        
        for policy in policies:
            if _intent_covered_by_policy(intent, policy):
                covered = True
                break
        
        if not covered:
            # Try to infer namespace from policies that might match
            # For simplicity, assume "prod" if not found
            inferred_ns = "prod"  # Could be improved with better data model
            
            missing.append(DriftItem(
                type="missing_policy",
                intent_id=intent.id,
                namespace=inferred_ns,
                description=intent.description,
                suggested_action=f"Create NetworkPolicy in namespace '{inferred_ns}' to allow {intent.src_selector} → {intent.dst_selector} on ports {[p.port for p in intent.allowed_ports]}"
            ))
    
    return missing


def find_over_permissive_policies(
    intents: List[IntentRule],
    policies: List[NetworkPolicy]
) -> List[DriftItem]:
    """
    Find policies that allow more than what any intent specifies.
    
    A policy is over-permissive if:
    - It allows traffic (via ingress rules) that is not covered by any intent
    - Wildcard selectors (empty match_labels) are always over-permissive unless covered
    """
    over_permissive = []
    
    for policy in policies:
        # Check each ingress rule
        for ingress_rule in policy.ingress:
            for pod_selector in ingress_rule.from_pod_selectors:
                selector_labels = pod_selector.match_labels
                
                # Check if this selector is covered by any intent
                covered = False
                
                for intent in intents:
                    # Check if policy's destination matches intent's destination
                    if not _labels_match(intent.dst_selector, policy.pod_selector):
                        continue
                    
                    # Check if policy's source selector is covered by intent
                    if not _selector_covers_intent(selector_labels, intent.src_selector):
                        continue
                    
                    # Check if ports are covered
                    if not ingress_rule.ports:
                        # No ports specified = allows all ports, check if intent covers this
                        covered = True
                        break
                    
                    intent_ports = {(p.port, p.protocol) for p in intent.allowed_ports}
                    rule_ports = {(p.port, p.protocol) for p in ingress_rule.ports}
                    
                    # If rule ports are subset of intent ports, it's covered
                    if rule_ports.issubset(intent_ports):
                        covered = True
                        break
                
                # Wildcard selectors are always over-permissive unless explicitly covered
                if not selector_labels:  # Empty = wildcard
                    if not covered:
                        over_permissive.append(DriftItem(
                            type="over_permissive",
                            policy_name=policy.name,
                            namespace=policy.namespace,
                            description=f"Policy '{policy.name}' allows traffic from any pod (wildcard selector)",
                            suggested_action=f"Restrict policy '{policy.name}' to only allow traffic from pods matching intent rules"
                        ))
                elif not covered:
                    # Non-wildcard but not covered by intent
                    over_permissive.append(DriftItem(
                        type="over_permissive",
                        policy_name=policy.name,
                        namespace=policy.namespace,
                        description=f"Policy '{policy.name}' allows traffic from {selector_labels} that is not covered by any intent",
                        suggested_action=f"Review policy '{policy.name}' and either add corresponding intent rule or restrict the policy"
                    ))
    
    return over_permissive


def calculate_namespace_summary(
    intents: List[IntentRule],
    policies: List[NetworkPolicy],
    missing: List[DriftItem],
    over_permissive: List[DriftItem]
) -> List[NamespaceSummary]:
    """
    Calculate per-namespace summary of intent alignment.
    
    For each namespace:
    - intent_count: number of intents (inferred or explicit)
    - aligned_count: policies that match intents
    - drift_count: missing + over-permissive items
    """
    from collections import defaultdict
    
    # Collect namespaces from policies
    namespace_intents: dict[str, int] = defaultdict(int)
    namespace_policies: dict[str, int] = defaultdict(int)
    namespace_drift: dict[str, int] = defaultdict(int)
    
    # Count policies per namespace
    for policy in policies:
        namespace_policies[policy.namespace] += 1
    
    # For intents, we'll assume they're in "prod" namespace for now
    # In a real system, intents would have namespace info
    for intent in intents:
        namespace_intents["prod"] += 1
    
    # Count drift items per namespace
    for item in missing + over_permissive:
        namespace_drift[item.namespace] += 1
    
    # Calculate aligned count (policies that match intents)
    # This is approximate: policies - over_permissive
    namespace_aligned: dict[str, int] = defaultdict(int)
    for policy in policies:
        ns = policy.namespace
        # Count policies that are not over-permissive
        is_over_permissive = any(
            item.policy_name == policy.name for item in over_permissive
        )
        if not is_over_permissive:
            namespace_aligned[ns] += 1
    
    # Build summaries
    summaries = []
    all_namespaces = set(namespace_intents.keys()) | set(namespace_policies.keys())
    
    for namespace in all_namespaces:
        summaries.append(NamespaceSummary(
            namespace=namespace,
            intent_count=namespace_intents.get(namespace, 0),
            aligned_count=namespace_aligned.get(namespace, 0),
            drift_count=namespace_drift.get(namespace, 0)
        ))
    
    return summaries

