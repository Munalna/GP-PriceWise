import {
  getPricingRulesByUser,
  getPricingRuleById,
  getPricingRuleByName,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
} from "../models/pricingRuleModel.js";

const ALLOWED_RULE_TYPES = [
  "maximum price",
  "rounding",
  "profit margin",
];

const ROUNDING_VALUES = [0, 0.5, 0.99];

function normalizeRuleType(ruleType) {
  return String(ruleType || "").trim().toLowerCase();
}

function isValidRuleType(ruleType) {
  return ALLOWED_RULE_TYPES.includes(normalizeRuleType(ruleType));
}

function isEmpty(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function parseRuleValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasMaxTwoDecimals(value) {
  return /^\d+(\.\d{1,2})?$/.test(String(value).trim());
}

function validateRuleValue(type, rawValue) {
  const normalizedType = normalizeRuleType(type);
  const value = parseRuleValue(rawValue);

  if (value === null) {
    return {
      valid: false,
      message: "value must be a valid number",
    };
  }

  if (normalizedType === "profit margin") {
    if (value <= 0 || value >= 100) {
      return {
        valid: false,
        message: "Margin must be greater than 0 and less than 100",
      };
    }

    if (!hasMaxTwoDecimals(rawValue)) {
      return {
        valid: false,
        message: "Margin can have up to two decimal places only",
      };
    }
  }

  if (normalizedType === "maximum price") {
    if (value <= 0) {
      return {
        valid: false,
        message: "Maximum price must be greater than 0",
      };
    }

    if (value > 9999) {
      return {
        valid: false,
        message: "Maximum price is too high",
      };
    }

    if (!hasMaxTwoDecimals(rawValue)) {
      return {
        valid: false,
        message: "Maximum price can have up to two decimal places only",
      };
    }
  }

  if (normalizedType === "rounding") {
    if (!ROUNDING_VALUES.includes(value)) {
      return {
        valid: false,
        message: "Rounding value must be 0.00, 0.50, or 0.99",
      };
    }
  }

  return {
    valid: true,
    value,
  };
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

    if (isEmpty(name) || isEmpty(type) || isEmpty(rawValue)) {
      return res.status(400).json({
        message: "name, type, and value are required",
      });
    }

    const trimmedName = String(name).trim();
    const normalizedType = normalizeRuleType(type);

    if (!isValidRuleType(normalizedType)) {
      return res.status(400).json({
        message: `Invalid rule type. Allowed types are: ${ALLOWED_RULE_TYPES.join(
          ", "
        )}`,
      });
    }

    const validation = validateRuleValue(normalizedType, rawValue);
    if (!validation.valid) {
      return res.status(400).json({
        message: validation.message,
      });
    }

    const userId = req.user.id;

    const existing = await getPricingRuleByName(userId, trimmedName);
    if (existing) {
      return res.status(409).json({
        message: "Pricing rule name already exists",
      });
    }

    const created = await createPricingRule(userId, {
      name: trimmedName,
      type: normalizedType,
      value: validation.value,
    });

    res.status(201).json(created);
  } catch (e) {
    if (e?.code === "23505") {
      return res.status(409).json({
        message: "Pricing rule name already exists",
      });
    }

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

    let trimmedName;
    if (name !== undefined) {
      if (isEmpty(name)) {
        return res.status(400).json({
          message: "Rule name cannot be empty",
        });
      }

      trimmedName = String(name).trim();

      const existing = await getPricingRuleByName(userId, trimmedName);
      if (existing && String(existing.id) !== String(id)) {
        return res.status(409).json({
          message: "Pricing rule name already exists",
        });
      }
    }

    let normalizedType;
    if (type !== undefined) {
      if (isEmpty(type)) {
        return res.status(400).json({
          message: "Rule type cannot be empty",
        });
      }

      normalizedType = normalizeRuleType(type);

      if (!isValidRuleType(normalizedType)) {
        return res.status(400).json({
          message: `Invalid rule type. Allowed types are: ${ALLOWED_RULE_TYPES.join(
            ", "
          )}`,
        });
      }
    }

    let value;
    if (rawValue !== undefined) {
      if (isEmpty(rawValue)) {
        return res.status(400).json({
          message: "Value cannot be empty",
        });
      }

      const effectiveType = normalizedType || currentRule.type;
      const validation = validateRuleValue(effectiveType, rawValue);

      if (!validation.valid) {
        return res.status(400).json({
          message: validation.message,
        });
      }

      value = validation.value;
    }

    const updated = await updatePricingRule(userId, id, {
      name: name !== undefined ? trimmedName : undefined,
      type: type !== undefined ? normalizedType : undefined,
      value,
    });

    if (!updated) {
      return res.status(404).json({ message: "Pricing rule not found" });
    }

      res.json(updated);
  } catch (e) {
    if (e?.code === "23505") {
      return res.status(409).json({
        message: "Pricing rule name already exists",
      });
    }

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
