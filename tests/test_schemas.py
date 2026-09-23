import unittest
from campaign_os.schemas import AudienceSegment, CampaignContext, ClaimRecord, HumanDecision, Objection, SourceRecord
from campaign_os.schemas.core import DecisionStatus, EvidenceType
class SchemaTests(unittest.TestCase):
 def test_campaign_context(self):
  with self.assertRaises(ValueError): CampaignContext("", "C", "O")
  with self.assertRaises(ValueError): CampaignContext("c1", "C", "O", country="Peru")
  self.assertEqual(CampaignContext("c1", "C", "O").country,"Bolivia")
 def test_audience_evidence_gate(self):
  with self.assertRaises(ValueError): AudienceSegment("a1","segment","La Paz","URBAN")
  self.assertEqual(AudienceSegment("a1","segment","La Paz","URBAN",scope="HYPOTHESIS").urbanicity,"URBAN")
 def test_audience_scope_blocks_national_generalization_from_local_evidence(self):
  with self.assertRaises(ValueError): AudienceSegment("a2","segment","La Paz","URBAN",evidence_ids=("ig-sample-1",))
  a=AudienceSegment("a2","segment","La Paz","URBAN",evidence_ids=("ig-sample-1",),scope="Comentarios de Instagram de una campaña en La Paz")
  self.assertNotEqual(a.scope,"Bolivia-wide")
 def test_sensitive_trait_not_in_schema(self):
  with self.assertRaises(TypeError): AudienceSegment("a1","segment","x","URBAN",ethnicity="unknown")
 def test_source_timestamp_and_locator(self):
  with self.assertRaises(ValueError): SourceRecord("s1","x","web","yesterday")
  with self.assertRaises(ValueError): SourceRecord("s1","x","web","2026-09-23T12:00:00Z","file://private")
  SourceRecord("s1","x","web","2026-09-23T12:00:00Z","https://example.org")
 def test_fact_claim_evidence(self):
  with self.assertRaises(ValueError): ClaimRecord("c1","claim",EvidenceType.FACT)
  ClaimRecord("c1","claim",EvidenceType.FACT,evidence_ids=("s1",))
 def test_objection_unknown_scope(self): self.assertEqual(Objection("o1","unknown concern").scope,"UNKNOWN")
 def test_human_gate(self):
  with self.assertRaises(ValueError): HumanDecision("d1","campaign-1",DecisionStatus.DEFERRED,"operator","2026-09-23T12:00:00Z","needs review",True)
  approved=HumanDecision("d2","campaign-1",DecisionStatus.APPROVED,"operator","2026-09-23T12:00:00Z","reviewed",True)
  self.assertTrue(approved.may_publish)
  self.assertFalse(HumanDecision("d3","campaign-1",DecisionStatus.APPROVED,"operator","2026-09-23T12:00:00Z","reviewed").may_publish)
if __name__=="__main__": unittest.main()
