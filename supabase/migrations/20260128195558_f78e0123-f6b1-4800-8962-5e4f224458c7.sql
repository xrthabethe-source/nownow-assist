-- Fix messages INSERT policy - allow users to send messages
CREATE POLICY "Users can send messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Fix app_settings SELECT policy - restrict reads to admins only
CREATE POLICY "Admins can view app settings"
  ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));