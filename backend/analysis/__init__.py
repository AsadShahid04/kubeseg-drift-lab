"""Analysis modules for gap detection and drift detection."""
from .gaps import (
    find_unprotected_flows,
    find_risky_flows,
    suggest_policies,
    GapFlow,
    RiskyFlow,
    SuggestedPolicy,
)
from .drift import (
    find_missing_policies_for_intent,
    find_over_permissive_policies,
    DriftItem,
    NamespaceSummary,
)

__all__ = [
    "find_unprotected_flows",
    "find_risky_flows",
    "suggest_policies",
    "GapFlow",
    "RiskyFlow",
    "SuggestedPolicy",
    "find_missing_policies_for_intent",
    "find_over_permissive_policies",
    "DriftItem",
    "NamespaceSummary",
]

