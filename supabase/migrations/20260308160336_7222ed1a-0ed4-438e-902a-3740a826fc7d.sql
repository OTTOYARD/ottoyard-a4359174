
SELECT cron.schedule(
  'intelligence-scanner-job',
  '*/3 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ycsisvozzgmisboumfqc.supabase.co/functions/v1/intelligence-scanner',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljc2lzdm96emdtaXNib3VtZnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzI5NTcsImV4cCI6MjA2OTA0ODk1N30.8Na6XnuBNbHifv4BcNPGMltaEsmX3QVYMASbopT1MGI"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);
