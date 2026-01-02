-- Restrict ottoq_webhooks access to admins only
-- First drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all on ottoq_webhooks" ON public.ottoq_webhooks;

-- Create restrictive policies for webhook management
CREATE POLICY "Admins can view webhooks"
  ON public.ottoq_webhooks FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert webhooks"
  ON public.ottoq_webhooks FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update webhooks"
  ON public.ottoq_webhooks FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete webhooks"
  ON public.ottoq_webhooks FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));