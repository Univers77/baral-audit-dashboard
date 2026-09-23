"""Dependency-free domain contracts for CampaignOS bootstrap."""
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from urllib.parse import urlparse

def req(v,n):
    if not isinstance(v,str) or not v.strip(): raise ValueError(f"{n} is required")
def ident(v,n):
    req(v,n)
    if any(c.isspace() for c in v): raise ValueError(f"{n} must not contain whitespace")
class EvidenceType(str,Enum): FACT="FACT"; INTERPRETATION="INTERPRETATION"; HYPOTHESIS="HYPOTHESIS"; RECOMMENDATION="RECOMMENDATION"
class DecisionStatus(str,Enum): APPROVED="APPROVED"; REJECTED="REJECTED"; DEFERRED="DEFERRED"
def iso(v,n):
    try: datetime.fromisoformat(v.replace("Z","+00:00"))
    except (ValueError,AttributeError): raise ValueError(f"{n} must be ISO-8601") from None
@dataclass(frozen=True)
class CampaignContext:
    campaign_id:str; name:str; objective:str; country:str="Bolivia"; channels:tuple[str,...]=(); constraints:tuple[str,...]=(); evidence_ids:tuple[str,...]=(); status:str="DRAFT"
    def __post_init__(self):
        ident(self.campaign_id,"campaign_id"); req(self.name,"name"); req(self.objective,"objective")
        if self.country!="Bolivia": raise ValueError("country must be Bolivia for this workspace")
        if self.status not in {"DRAFT","ACTIVE","PAUSED","CLOSED"}: raise ValueError("invalid campaign status")
@dataclass(frozen=True)
class AudienceSegment:
    audience_id:str; label:str; territory:str; urbanicity:str; language_register:str="UNKNOWN"; generation:str|None=None; channels:tuple[str,...]=(); evidence_ids:tuple[str,...]=(); scope:str=""; where_not_to_generalize:tuple[str,...]=()
    def __post_init__(self):
        ident(self.audience_id,"audience_id")
        for n in ("label","territory","urbanicity"): req(getattr(self,n),n)
        if self.urbanicity not in {"URBAN","PERI_URBAN","INTERMEDIATE","RURAL","MIXED","UNKNOWN"}: raise ValueError("invalid urbanicity")
        if not self.evidence_ids and self.scope!="HYPOTHESIS": raise ValueError("audience conclusions require evidence_ids or scope='HYPOTHESIS'")
        if self.evidence_ids and not self.scope.strip(): raise ValueError("evidence-backed audiences require an explicit scope")
@dataclass(frozen=True)
class SourceRecord:
    source_id:str; title:str; source_type:str; captured_at:str; locator:str|None=None; publisher:str|None=None; scope:str=""; limitations:tuple[str,...]=(); content_hash:str|None=None
    def __post_init__(self):
        ident(self.source_id,"source_id"); req(self.title,"title"); req(self.source_type,"source_type"); iso(self.captured_at,"captured_at")
        if self.locator and urlparse(self.locator).scheme not in {"http","https"}: raise ValueError("locator must be an http(s) URL")
@dataclass(frozen=True)
class ClaimRecord:
    claim_id:str; statement:str; claim_type:EvidenceType; evidence_ids:tuple[str,...]=(); confidence:float|None=None; status:str="UNVERIFIED"; scope:str=""; limitations:tuple[str,...]=()
    def __post_init__(self):
        ident(self.claim_id,"claim_id"); req(self.statement,"statement")
        if not isinstance(self.claim_type,EvidenceType): object.__setattr__(self,"claim_type",EvidenceType(self.claim_type))
        if self.claim_type==EvidenceType.FACT and not self.evidence_ids: raise ValueError("FACT claims require evidence_ids")
        if self.confidence is not None and not 0<=self.confidence<=1: raise ValueError("confidence must be between 0 and 1")
        if self.status not in {"UNVERIFIED","SUPPORTED","DISPUTED","BLOCKED"}: raise ValueError("invalid claim status")
@dataclass(frozen=True)
class Objection:
    objection_id:str; statement:str; evidence_ids:tuple[str,...]=(); scope:str="UNKNOWN"; type:EvidenceType=EvidenceType.INTERPRETATION
    def __post_init__(self):
        ident(self.objection_id,"objection_id"); req(self.statement,"statement")
        if not isinstance(self.type,EvidenceType): object.__setattr__(self,"type",EvidenceType(self.type))
@dataclass(frozen=True)
class HumanDecision:
    decision_id:str; subject_id:str; status:DecisionStatus; decided_by:str; decided_at:str; rationale:str; publication_authorized:bool=False
    def __post_init__(self):
        for n in ("decision_id","subject_id","decided_by","rationale"): req(getattr(self,n),n)
        if not isinstance(self.status,DecisionStatus): object.__setattr__(self,"status",DecisionStatus(self.status))
        iso(self.decided_at,"decided_at")
        if self.publication_authorized and self.status!=DecisionStatus.APPROVED: raise ValueError("publication authorization requires APPROVED decision")
    @property
    def may_publish(self): return self.status==DecisionStatus.APPROVED and self.publication_authorized
