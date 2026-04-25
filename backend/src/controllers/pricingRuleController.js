import {
  getPricingRulesByUser,
  getPricingRuleById,
  getPricingRuleByName,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
} from "../models/pricingRuleModel.js";

const ALLOWED_RULE_TYPES = [
  "minimum margin",
  "maximum price",
  "rounding",
  "profit margin",
];

function normalizeRuleType(ruleType) {
  return String(ruleType || "").trim().toLowerCase();
}

function isValidRuleType(ruleType) {
  return ALLOWED_RULE_TYPES.includes(normalizeRuleType(ruleType));
}

function parseRuleValue(value) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function getUserPricingRules(req, res, next) {
  try {
    const userId = req.user.id;
    const rules = await getPricingRulesByUser(userId);
    res.json(rules);
  } catch (e) {
    next(e);
  }
}

export async function addPricingRule(req, res, next) {
  try {
    const name = req.body.name ?? req.body.rule_name;
    const type = req.body.type ?? req.body.rule_type;
    const rawValue = req.body.value ?? req.body.rule_value;

    if (!name || !type || rawValue === undefined || rawValue === null || rawValue === "") {
      return res.status(400).json({
        message: "name, type, and value are required",
      });
    }

    if (!isValidRuleType(type)) {
      return res.status(400).json({
        message: `Invalid rule type. Allowed types are: ${ALLOWED_RULE_TYPES.join(", ")}`,
      });
    }

    const value = parseRuleValue(rawValue);
    if (value === null) {
      return res.status(400).json({
        message: "value must be a valid number",
      });
    }

    if (value < 0) {
      return res.status(400).json({
        message: "value cannot be negative",
      });
    }

    const userId = req.user.id;

    const existing = await getPricingRuleByName(userId, name.trim());
    if (existing) {
      return res.status(409).json({
        message: "Pricing rule name already exists",
      });
    }

    const created = await createPricingRule(userId, {
      name: name.trim(),
      type,
      value,
    });

    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
}

export async function editPricingRule(req, res, next) {
  try {
    const { id } = req.params;

    const name = req.body.name ?? req.body.rule_name;
    const type = req.body.type ?? req.body.rule_type;
    const rawValue = req.body.value ?? req.body.rule_value;

    if (name === undefined && type === undefined && rawValue === undefined) {
      return res.status(400).json({
        message: "At least one field (name, type, value) must be provided",
      });
    }

    const userId = req.user.id;

    const currentRule = await getPricingRuleById(userId, id);
    if (!currentRule) {
      return res.status(404).json({ message: "Pricing rule not found" });
    }

    if (name !== undefined) {
      const existing = await getPricingRuleByName(userId, name.trim());
      if (existing && String(existing.id) !== String(id)) {
        return res.status(409).json({
          message: "Pricing rule name already exists",
        });
      }
    }

    if (type !== undefined && !isValidRuleType(type)) {
      return res.status(400).json({
        message: `Invalid rule type. Allowed types are: ${ALLOWED_RULE_TYPES.join(", ")}`,
      });
    }

    let value;
    if (rawValue !== undefined) {
      value = parseRuleValue(rawValue);

      if (value === null) {
        return res.status(400).json({
          message: "value must be a valid number",
        });
      }

      if (value < 0) {
        return res.status(400).json({
          message: "value cannot be negative",
        });
      }
    }

    const updated = await updatePricingRule(userId, id, {
      name: name !== undefined ? name.trim() : undefined,
      type,
      value,
    });

    if (!updated) {
      return res.status(404).json({ message: "Pricing rule not found" });
    }

    res.json(updated);
  } catch (e) {
    next(e);
  }
}

export async function removePricingRule(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await deletePricingRule(userId, id);

    if (!deleted) {
      return res.status(404).json({ message: "Pricing rule not found" });
    }

    res.json({
      ok: true,
      message: "Pricing rule deleted successfully",
    });
  } catch (e) {
    next(e);
  }
}