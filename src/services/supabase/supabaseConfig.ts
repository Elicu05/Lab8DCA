import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cxatxkeaxvkqrxqtdytg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4YXR4a2VheHZrcXJ4cXRkeXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNDE1MTQsImV4cCI6MjA2NDkxNzUxNH0.uIDUrDZDM560wA9Xp-gqlzCWDqP98sPZiigibrOZRhI";

export const supabase = createClient(supabaseUrl, supabaseKey);

supabase.storage.listBuckets().then(({ data, error }) => {
  console.log('Buckets visibles desde el código:', data, 'Error:', error);
});