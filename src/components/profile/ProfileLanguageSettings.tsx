import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Globe, Save, Volume2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfileLanguageSettingsProps {
  onBack: () => void;
}

const ProfileLanguageSettings = ({ onBack }: ProfileLanguageSettingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    nativeLanguage: "",
    learningLevel: "",
    voiceSpeed: 1,
    voiceGender: "female",
    accent: "american"
  });

  const languages = [
    { value: "english", label: "English" },
    { value: "british-english", label: "British English" },
    { value: "american-english", label: "American English" },
    { value: "yoruba", label: "Yoruba" },
    { value: "igbo", label: "Igbo" },
    { value: "hausa", label: "Hausa" },
    { value: "pidgin", label: "Pidgin English" },
    { value: "french", label: "French" },
    { value: "spanish", label: "Spanish" },
    { value: "mandarin", label: "Mandarin Chinese" },
    { value: "arabic", label: "Arabic" },
    { value: "swahili", label: "Swahili" }
  ];

  const levels = [
    { value: "beginner", label: "Beginner" },
    { value: "elementary", label: "Elementary" },
    { value: "intermediate", label: "Intermediate" },
    { value: "upper-intermediate", label: "Upper Intermediate" },
    { value: "advanced", label: "Advanced" },
    { value: "proficient", label: "Proficient" }
  ];

  const accents = [
    { value: "american", label: "American English" },
    { value: "british", label: "British English" },
    { value: "australian", label: "Australian English" },
    { value: "canadian", label: "Canadian English" }
  ];

  useEffect(() => {
    fetchLanguageSettings();
  }, [user]);

  const fetchLanguageSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('native_language, level')
        .eq('user_id', user.id)
        .single();

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
      const { error } = await supabase
        .from('profiles')
        .upsert({
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

  return (
    <div className="min-h-screen bg-background p-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
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
              <Select
                value={settings.nativeLanguage}
                onValueChange={(value) => setSettings(prev => ({ ...prev, nativeLanguage: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your native language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((language) => (
                    <SelectItem key={language.value} value={language.value}>
                      {language.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="learningLevel">Current English Level</Label>
              <Select
                value={settings.learningLevel}
                onValueChange={(value) => setSettings(prev => ({ ...prev, learningLevel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your current level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Voice Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-primary" />
              Voice & Audio Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Speech Speed</Label>
              <div className="px-2">
                <Slider
                  value={[settings.voiceSpeed]}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, voiceSpeed: value[0] }))}
                  max={2}
                  min={0.5}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Slow</span>
                  <span>Normal ({settings.voiceSpeed.toFixed(1)}x)</span>
                  <span>Fast</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Voice Gender</Label>
              <Select
                value={settings.voiceGender}
                onValueChange={(value) => setSettings(prev => ({ ...prev, voiceGender: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Accent Preference</Label>
              <Select
                value={settings.accent}
                onValueChange={(value) => setSettings(prev => ({ ...prev, accent: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accents.map((accent) => (
                    <SelectItem key={accent.value} value={accent.value}>
                      {accent.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Regional Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Time Zone</Label>
              <Select defaultValue="africa-lagos">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="africa-lagos">Africa/Lagos (WAT)</SelectItem>
                  <SelectItem value="utc">UTC</SelectItem>
                  <SelectItem value="america-new_york">America/New_York (EST)</SelectItem>
                  <SelectItem value="europe-london">Europe/London (GMT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select defaultValue="dd/mm/yyyy">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                  <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                  <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Language Settings
        </Button>
      </div>
    </div>
  );
};

export default ProfileLanguageSettings;