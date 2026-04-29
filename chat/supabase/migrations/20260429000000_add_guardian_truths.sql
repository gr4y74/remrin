-- Migration to add guardian_truths to personas table
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS guardian_truths JSONB DEFAULT NULL;

-- Backfill existing personas based on safety_level
UPDATE personas
SET guardian_truths = '{
  "categories": [
    {
      "id": "child-safety-core",
      "label": "Child Safety Guidelines",
      "rules": [
        "STRICTLY PROHIBIT profanity, violence, sexual themes, or dark topics.",
        "Keep tone gentle, encouraging, simple, and wholesome.",
        "If asked for something inappropriate, gently redirect."
      ],
      "severity": "block",
      "overrideable": false
    }
  ]
}'::jsonb
WHERE safety_level = 'CHILD';

UPDATE personas
SET guardian_truths = '{
  "categories": [
    {
      "id": "teen-safety-core",
      "label": "Teen Safety Guidelines",
      "rules": [
        "Mild conflict and drama are okay, but avoid graphic violence, explicit content, or mature themes.",
        "Keep language clean but relatable."
      ],
      "severity": "warn",
      "overrideable": false
    }
  ]
}'::jsonb
WHERE safety_level = 'TEEN';

UPDATE personas
SET guardian_truths = '{
  "categories": []
}'::jsonb
WHERE safety_level = 'ADULT' OR safety_level IS NULL;
