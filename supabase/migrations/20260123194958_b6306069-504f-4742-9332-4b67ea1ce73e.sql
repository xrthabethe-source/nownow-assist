-- Create saved locations table for customers
CREATE TABLE public.saved_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

-- Users can manage their own saved locations
CREATE POLICY "Users can view their own locations" 
ON public.saved_locations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own locations" 
ON public.saved_locations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locations" 
ON public.saved_locations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locations" 
ON public.saved_locations FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_saved_locations_updated_at
BEFORE UPDATE ON public.saved_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();