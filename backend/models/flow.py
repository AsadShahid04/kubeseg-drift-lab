"""Flow model representing network traffic flows."""
from pydantic import BaseModel
from typing import Literal


class Flow(BaseModel):
    """Represents a network flow between pods."""
    src_ns: str
    src_pod: str
    src_labels: dict[str, str]
    dst_ns: str
    dst_pod: str
    dst_labels: dict[str, str]
    port: int
    protocol: str
    verdict: Literal["allow", "deny"]

