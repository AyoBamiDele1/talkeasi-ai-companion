import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Globe, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
interface ProfileLanguageSettingsProps {
  onBack: () => void;
}
const ProfileLanguageSettings = ({
  onBack
}: ProfileLanguageSettingsProps) => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    learningLevel: ""
  });
  const levels = [{
    value: "beginner",
    label: "Beginner"
  }, {
    value: "intermediate",
    label: "Intermediate"
  }, {
    value: "advanced",
    label: "Advanced"
  }];
  useEffect(() => {
    fetchLanguageSettings();
  }, [user]);
  const fetchLanguageSettings = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from('profiles').select('native_language, level').eq('user_id', user.id).single();
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching language settings:', error);
        return;
      }
      if (data) {
        setSettings(prev => ({
          ...prev,
          learningLevel: data.level?.toLowerCase() || "beginner"
        }));
      }
    } catch (error) {
      console.error('Error fetching language settings:', error);
    }
  };
  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save settings.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          level: levels.find(l => l.value === settings.learningLevel)?.label || "Beginner"
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Settings saved",
        description: "Your language settings have been updated successfully."
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-background p-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Language Settings</h1>
          <p className="text-muted-foreground text-sm">Configure your language preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Language Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Language Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="learningLevel">Current English Level</Label>
              <Select value={settings.learningLevel} onValueChange={value => setSettings(prev => ({
              ...prev,
              learningLevel: value
            }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your current level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map(level => <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div> : <Save className="w-4 h-4 mr-2" />}
          Save Language Settings
        </Button>
      </div>
    </div>;
};
export default ProfileLanguageSettings;