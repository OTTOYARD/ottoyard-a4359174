-- Update branding in depot configurations to use OTTO-Q instead of OTTOQ
UPDATE ottoq_depots
SET config_jsonb = jsonb_set(
  config_jsonb,
  '{ottoq_branding}',
  '"Powered by OTTO-Q Technology"'::jsonb
)
WHERE config_jsonb ? 'ottoq_branding';