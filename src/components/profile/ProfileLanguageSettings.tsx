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
    nativeLanguage: "",
    learningLevel: ""
  });
  const languages = [{
    value: "english",
    label: "English"
  }, {
    value: "yoruba",
    label: "Yoruba"
  }, {
    value: "igbo",
    label: "Igbo"
  }, {
    value: "hausa",
    label: "Hausa"
  }, {
    value: "pidgin",
    label: "Pidgin English"
  }];
  const levels = [{
    value: "beginner",
    label: "Beginner"
  }, {
    value: "elementary",
    label: "Elementary"
  }, {
    value: "intermediate",
    label: "Intermediate"
  }, {
    value: "upper-intermediate",
    label: "Upper Intermediate"
  }, {
    value: "advanced",
    label: "Advanced"
  }, {
    value: "proficient",
    label: "Proficient"
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
          nativeLanguage: data.native_language || "english",
          learningLevel: data.level?.toLowerCase() || "beginner"
        }));
      }
    } catch (error) {
      console.error('Error fetching language settings:', error);
    }
  };
  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const {
        error
      } = await supabase.from('profiles').upsert({
        user_id: user.id,
        native_language: languages.find(l => l.value === settings.nativeLanguage)?.label || "English",
        level: levels.find(l => l.value === settings.learningLevel)?.label || "Beginner"
      });
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
              <Label htmlFor="nativeLanguage">Native Language</Label>
              <Select value={settings.nativeLanguage} onValueChange={value => setSettings(prev => ({
              ...prev,
              nativeLanguage: value
            }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your native language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(language => <SelectItem key={language.value} value={language.value}>
                      {language.label}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

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