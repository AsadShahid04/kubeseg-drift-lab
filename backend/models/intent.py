"""Intent model representing high-level security intent rules."""
from pydantic import BaseModel


class PortSpec(BaseModel):
    """Port specification for intent rules."""
    port: int
    protocol: str


class IntentRule(BaseModel):
    """Illumio-like intent rule defining allowed communications."""
    id: str
    src_selector: dict[str, str]
    dst_selector: dict[str, str]
    allowed_ports: list[PortSpec]
    description: str

