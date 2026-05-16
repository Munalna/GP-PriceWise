import api from "./api";

export async function assignRulesToTarget(targetType, targetId, ruleIds) {
  const selectedRuleIds = Array.isArray(ruleIds) ? ruleIds : [ruleIds];

  const res = await api.put(`/products/${targetType}/${targetId}/rules`, {
    ruleIds: selectedRuleIds,
    rules: selectedRuleIds,
  });

  return res.data;
}