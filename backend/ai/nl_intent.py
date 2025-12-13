"""Natural Language to Intent conversion using OpenAI API."""
import json
import os
from pathlib import Path
from typing import Optional, Dict, Any
from openai import OpenAI
from dotenv import load_dotenv
from models.intent import IntentRule, PortSpec
from models.policy import NetworkPolicy, IngressRule, PodSelector, PortSpec as PolicyPortSpec
import yaml

# Load .env file from project root or backend directory
env_path = Path(__file__).parent.parent.parent / '.env'
if not env_path.exists():
    env_path = Path(__file__).parent.parent / '.env'
if env_path.exists():
    load_dotenv(env_path)
else:
    # Fallback: try loading from current directory
    load_dotenv()


class NLIntentConverter:
    """Convert natural language policy descriptions to structured intent."""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4"):
        """
        Initialize the NL Intent Converter.
        
        Args:
            api_key: OpenAI API key. If None, reads from OPENAI_API_KEY env var.
            model: OpenAI model to use (default: gpt-4, can use gpt-3.5-turbo for lower cost)
        """
        api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OpenAI API key required. Set OPENAI_API_KEY environment variable.")
        
        self.client = OpenAI(api_key=api_key)
        self.model = model
    
    def convert_to_intent(
        self, 
        natural_language: str, 
        cluster_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Convert natural language policy description to structured intent.
        
        Args:
            natural_language: Natural language description of the policy
            cluster_context: Context about the cluster (namespaces, labels, etc.)
        
        Returns:
            Dictionary with:
                - intent: Structured intent object
                - explanation: Human-readable explanation
                - confidence: Confidence score (0-1)
        """
        system_prompt = self._build_system_prompt(cluster_context)
        user_prompt = f"""Convert this natural language policy description to structured intent:

"{natural_language}"

Return a JSON object with this exact structure:
{{
    "src_selector": {{
        "namespace": "namespace_name or null",
        "labels": {{"key": "value"}}
    }},
    "dst_selector": {{
        "namespace": "namespace_name or null",
        "labels": {{"key": "value"}}
    }},
    "allowed_ports": [
        {{"port": 443, "protocol": "TCP"}}
    ],
    "description": "Human-readable description of what this policy does"
}}

Rules:
- If namespace is not specified, use null
- Labels must be a dictionary (can be empty {{}})
- Ports must be a list of {{"port": number, "protocol": "TCP|UDP"}}
- Protocol must be "TCP" or "UDP"
- Return ONLY valid JSON, no markdown, no explanations"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,  # Lower temperature for more deterministic output
                response_format={"type": "json_object"}
            )
            
            intent_json = json.loads(response.choices[0].message.content)
            
            # Generate explanation
            explanation = self._generate_explanation(natural_language, intent_json)
            
            return {
                "intent": intent_json,
                "explanation": explanation,
                "confidence": 0.9  # Could be calculated based on response quality
            }
        except Exception as e:
            return {
                "error": str(e),
                "intent": None,
                "explanation": None,
                "confidence": 0.0
            }
    
    def _build_system_prompt(self, cluster_context: Dict[str, Any]) -> str:
        """Build system prompt with cluster context."""
        namespaces = cluster_context.get("namespaces", [])
        common_labels = cluster_context.get("common_labels", {})
        
        prompt = f"""You are a Kubernetes security expert specializing in NetworkPolicy generation.

You convert natural language policy descriptions into structured intent objects that can be used to generate Kubernetes NetworkPolicies.

Available namespaces in this cluster:
{json.dumps(namespaces, indent=2)}

Common pod labels used in this cluster:
{json.dumps(common_labels, indent=2)}

Your task is to parse natural language and extract:
1. Source selector (namespace and/or labels)
2. Destination selector (namespace and/or labels)
3. Allowed ports and protocols
4. A clear description

Be precise and follow the JSON schema exactly."""
        
        return prompt
    
    def _generate_explanation(self, natural_language: str, intent: Dict[str, Any]) -> str:
        """Generate human-readable explanation of the intent."""
        prompt = f"""Explain what this network policy intent will do:

Original request: "{natural_language}"

Parsed intent:
{json.dumps(intent, indent=2)}

Provide a concise explanation (2-3 sentences) of:
1. What traffic will be allowed
2. What traffic will be blocked
3. Security implications

Keep it clear and non-technical."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a security expert explaining network policies in plain language."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=200
            )
            return response.choices[0].message.content
        except Exception:
            return "This policy will allow the specified traffic and block everything else by default."


def intent_to_network_policy(intent: Dict[str, Any], namespace: str = "default") -> NetworkPolicy:
    """
    Convert structured intent to NetworkPolicy YAML.
    
    Args:
        intent: Structured intent dictionary
        namespace: Target namespace for the policy
    
    Returns:
        NetworkPolicy object
    """
    # Extract selectors
    src_selector = intent.get("src_selector", {})
    dst_selector = intent.get("dst_selector", {})
    allowed_ports = intent.get("allowed_ports", [])
    
    # Use destination namespace if specified, otherwise use provided namespace
    # Handle null values from JSON
    dst_namespace = dst_selector.get("namespace")
    policy_namespace = dst_namespace if dst_namespace is not None else namespace
    
    # Build ingress rule
    # Only add from_pod_selectors if labels are specified
    from_pod_selectors = []
    src_labels = src_selector.get("labels", {})
    if src_labels:
        from_pod_selectors.append(PodSelector(match_labels=src_labels))
    
    ingress_rule = IngressRule(
        from_pod_selectors=from_pod_selectors,
        ports=[
            PolicyPortSpec(port=port["port"], protocol=port["protocol"])
            for port in allowed_ports
        ]
    )
    
    # Create policy name from description
    description = intent.get("description", "Generated policy")
    policy_name = description.lower().replace(" ", "-").replace(".", "")[:50]
    
    # Create NetworkPolicy
    policy = NetworkPolicy(
        name=f"nl-intent-{policy_name}",
        namespace=policy_namespace,
        pod_selector=dst_selector.get("labels", {}),
        ingress=[ingress_rule]
    )
    
    return policy


def policy_to_yaml(policy: NetworkPolicy) -> str:
    """Convert NetworkPolicy to YAML string."""
    policy_dict = {
        "apiVersion": "networking.k8s.io/v1",
        "kind": "NetworkPolicy",
        "metadata": {
            "name": policy.name,
            "namespace": policy.namespace
        },
        "spec": {
            "podSelector": {
                "matchLabels": policy.pod_selector
            },
            "policyTypes": ["Ingress"],
            "ingress": []
        }
    }
    
    for ingress_rule in policy.ingress:
        rule_dict = {}
        
        # Add from selectors
        # If no selectors, allow from all (empty from array means allow all)
        if ingress_rule.from_pod_selectors:
            rule_dict["from"] = []
            for pod_selector in ingress_rule.from_pod_selectors:
                if pod_selector.match_labels:
                    rule_dict["from"].append({
                        "podSelector": {
                            "matchLabels": pod_selector.match_labels
                        }
                    })
        # If no from_pod_selectors but we have ports, we need to allow from all
        # (empty from array in K8s means allow from all namespaces/pods)
        elif ingress_rule.ports:
            rule_dict["from"] = []
        
        # Add ports
        if ingress_rule.ports:
            rule_dict["ports"] = [
                {
                    "port": port.port,
                    "protocol": port.protocol
                }
                for port in ingress_rule.ports
            ]
        
        if rule_dict:
            policy_dict["spec"]["ingress"].append(rule_dict)
    
    return yaml.dump(policy_dict, default_flow_style=False, sort_keys=False)

