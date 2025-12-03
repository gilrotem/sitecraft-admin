import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background" dir="rtl">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">מערכת ניהול תוכן רב-אתרית</h1>
        <p className="text-xl text-muted-foreground">מערכת מאובטחת לניהול תוכן</p>
        <Button size="lg" onClick={() => navigate('/auth')}>
          כניסה למערכת
        </Button>
      </div>
    </div>
  );
};

export default Index;
