try {
    const SUPABASE_URL = 'https://ipgunjsaazurzueaifqr.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZ3VuanNhYXp1cnp1ZWFpZnFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NjI4MDAsImV4cCI6MjA5MDUzODgwMH0.-2m4vmlrHh4nnDrYaHTl0lsgEegm03lBoTEYYbZ10kQ';

    if (!window.supabase) {
        throw new Error("Supabase library is missing from the window object. The CDN script might have failed to load or got blocked.");
    }

    // Initialize Supabase client
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabase;
} catch (e) {
    alert("Supabase Initialization Error: " + e.message);
    console.error("Supabase Init Error:", e);
}
