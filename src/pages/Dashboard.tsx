import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, isSuperAdmin, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-muted-foreground">טוען...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {isSuperAdmin ? 'ממשק Super Admin' : 'לוח הבקרה שלי'}
          </h1>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="ml-2 h-4 w-4" />
            התנתק
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isSuperAdmin ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ברוך הבא, Super Admin</CardTitle>
                <CardDescription>
                  יש לך גישה מלאה לכל המערכת
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">ניהול משתמשים</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        יצירה, עריכה ומחיקת משתמשים
                      </p>
                    </CardContent>
                  </Card>

                  <Link to="/admin/sites" className="block">
                    <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
                      <CardHeader>
                        <CardTitle className="text-lg">ניהול אתרים</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          יצירה ועריכה של אתרים עם הגדרת סכמה
                        </p>
                      </CardContent>
                    </Card>
                  </Link>

                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">הקצאת הרשאות</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        הקצאת משתמשים לאתרים עם בחירת רמת הרשאה
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">היסטוריית שינויים</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        צפייה בכל השינויים במערכת
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">הגדרות מערכת</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        הגדרות כלליות של המערכת
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>האתרים שלי</CardTitle>
                <CardDescription>
                  רשימת האתרים שהוקצו לך
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  אין אתרים שהוקצו לך כרגע. פנה למנהל המערכת.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
