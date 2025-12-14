"""Generate PR snippets and commit messages for policy changes."""
from typing import List, Dict, Any
from pydantic import BaseModel
from models.policy import NetworkPolicy
from analysis.gaps import SuggestedPolicy
from analysis.drift import DriftItem
from ai.nl_intent import policy_to_yaml
import yaml


class PRSnippet(BaseModel):
    """A PR snippet for a policy change."""
    file_path: str
    diff: str
    commit_message: str
    description: str


class BundledFixes(BaseModel):
    """Bundled fixes for multiple policies."""
    yaml_content: str
    commit_message: str
    description: str
    policies_count: int


def generate_patch_snippet(
    policy: NetworkPolicy,
    action: str = "add"  # "add", "update", "delete"
) -> str:
    """
    Generate a Git-style patch snippet for a policy.
    
    Example:
    diff --git a/policies/prod-db-policy.yaml b/policies/prod-db-policy.yaml
    new file mode 100644
    index 0000000..abc1234
    --- /dev/null
    +++ b/policies/prod-db-policy.yaml
    @@ -0,0 +1,20 @@
    +apiVersion: networking.k8s.io/v1
    ...
    """
    policy_yaml = policy_to_yaml(policy)
    file_path = f"policies/{policy.namespace}/{policy.name}.yaml"
    
    if action == "add":
        lines = policy_yaml.split("\n")
        diff_lines = [f"+{line}" for line in lines]
        diff = f"""diff --git a/{file_path} b/{file_path}
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/{file_path}
@@ -0,0 +1,{len(lines)} @@
{chr(10).join(diff_lines)}"""
    elif action == "update":
        # For updates, we'd need the old version - simplified for now
        lines = policy_yaml.split("\n")
        diff_lines = [f"+{line}" for line in lines]
        diff = f"""diff --git a/{file_path} b/{file_path}
index abc1234..def5678 100644
--- a/{file_path}
+++ b/{file_path}
@@ -1,{len(lines)} +1,{len(lines)} @@
{chr(10).join(diff_lines)}"""
    else:  # delete
        diff = f"""diff --git a/{file_path} b/{file_path}
deleted file mode 100644
index abc1234..0000000
--- a/{file_path}
+++ /dev/null
@@ -1,20 +0,0 @@
-apiVersion: networking.k8s.io/v1
-..."""
    
    return diff


def generate_commit_message(
    policy: NetworkPolicy,
    action: str = "add",
    reason: str = ""
) -> str:
    """
    Generate a commit message for a policy change.
    
    Uses OpenAI to generate a concise, descriptive commit message.
    """
    if action == "add":
        base_msg = f"Add NetworkPolicy: {policy.name} in {policy.namespace}"
    elif action == "update":
        base_msg = f"Update NetworkPolicy: {policy.name} in {policy.namespace}"
    else:
        base_msg = f"Remove NetworkPolicy: {policy.name} in {policy.namespace}"
    
    if reason:
        # Try to create a concise summary
        if "restrict" in reason.lower() or "narrow" in reason.lower():
            summary = f"Narrow {policy.namespace} ingress to authorized sources only"
        elif "protect" in reason.lower():
            summary = f"Protect {policy.namespace} pods from unauthorized access"
        elif "database" in reason.lower() or "db" in reason.lower():
            summary = f"Restrict database access in {policy.namespace}"
        else:
            summary = reason[:60] + "..." if len(reason) > 60 else reason
        
        return f"{base_msg}\n\n{summary}"
    
    return base_msg


def generate_pr_snippet_for_suggested_policy(
    suggested: SuggestedPolicy,
    reason: str = ""
) -> PRSnippet:
    """Generate PR snippet for a suggested policy."""
    # Parse YAML to get policy details
    policy_data = yaml.safe_load(suggested.yaml)
    
    policy_name = policy_data["metadata"]["name"]
    policy_namespace = policy_data["metadata"]["namespace"]
    
    # Generate diff from YAML
    lines = suggested.yaml.split("\n")
    diff_lines = [f"+{line}" for line in lines if line.strip()]
    file_path = f"policies/{policy_namespace}/{policy_name}.yaml"
    
    diff = f"""diff --git a/{file_path} b/{file_path}
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/{file_path}
@@ -0,0 +1,{len(lines)} @@
{chr(10).join(diff_lines)}"""
    
    # Generate commit message
    if "restrict" in reason.lower() or "narrow" in reason.lower():
        summary = f"Narrow {policy_namespace} ingress to authorized sources only"
    elif "protect" in reason.lower():
        summary = f"Protect {policy_namespace} pods from unauthorized access"
    elif "database" in reason.lower() or "db" in reason.lower():
        summary = f"Restrict database access in {policy_namespace}"
    else:
        summary = f"Add NetworkPolicy to protect {policy_namespace} namespace"
    
    commit_msg = f"Add NetworkPolicy: {policy_name} in {policy_namespace}\n\n{summary}"
    
    return PRSnippet(
        file_path=file_path,
        diff=diff,
        commit_message=commit_msg,
        description=f"Add NetworkPolicy to protect {policy_namespace} namespace"
    )


def bundle_top_fixes(
    suggested_policies: List[SuggestedPolicy],
    top_n: int = 3
) -> BundledFixes:
    """
    Bundle top N suggested policies into a single YAML file.
    
    Useful for batch review in a PR.
    """
    top_policies = suggested_policies[:top_n]
    
    # Combine all YAMLs
    yaml_parts = []
    for suggested in top_policies:
        yaml_parts.append(f"# Policy for {suggested.namespace}")
        yaml_parts.append(suggested.yaml)
        yaml_parts.append("---")
    
    bundled_yaml = "\n".join(yaml_parts)
    
    commit_msg = f"Bundle top {len(top_policies)} NetworkPolicy fixes\n\n"
    commit_msg += "Addresses multiple security gaps with least-privilege policies.\n"
    commit_msg += f"Namespaces: {', '.join(set(p.namespace for p in top_policies))}"
    
    return BundledFixes(
        yaml_content=bundled_yaml,
        commit_message=commit_msg,
        description=f"Top {len(top_policies)} recommended NetworkPolicy fixes",
        policies_count=len(top_policies)
    )
