"""NetworkPolicy models representing Kubernetes/Calico network policies."""
from pydantic import BaseModel
from typing import Optional


class PodSelector(BaseModel):
    """Selector for matching pods by labels."""
    match_labels: dict[str, str]


class NamespaceSelector(BaseModel):
    """Selector for matching namespaces by labels."""
    match_labels: dict[str, str]


class PortSpec(BaseModel):
    """Port specification for policy rules."""
    port: int
    protocol: str


class IngressRule(BaseModel):
    """Ingress rule allowing traffic from sources."""
    from_ns_selectors: list[NamespaceSelector] = []
    from_pod_selectors: list[PodSelector] = []
    ports: list[PortSpec] = []


class EgressRule(BaseModel):
    """Egress rule allowing traffic to destinations."""
    to_ns_selectors: list[NamespaceSelector] = []
    to_pod_selectors: list[PodSelector] = []
    ports: list[PortSpec] = []


class NetworkPolicy(BaseModel):
    """Kubernetes/Calico-style NetworkPolicy."""
    name: str
    namespace: str
    pod_selector: dict[str, str]
    ingress: list[IngressRule] = []
    egress: list[EgressRule] = []

