import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Mail, Check, X, Search } from "lucide-react";
import { toast } from "sonner";

interface Friend {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  friend_profile?: {
    display_name: string;
    avatar_url?: string;
    user_id: string;
  };
}

interface UserProfile {
  user_id: string;
  display_name: string;
  avatar_url?: string;
}

const Friends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<Friend[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchFriends = async () => {
    if (!user) return;

    // Fetch accepted friendships
    const { data: friendsData, error: friendsError } = await supabase
      .from('friendships')
      .select('*')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (friendsError) {
      console.error('Error fetching friends:', friendsError);
    } else if (friendsData) {
      // Get profile data for friends
      const friendUserIds = friendsData.map(friendship => 
        friendship.requester_id === user.id ? friendship.addressee_id : friendship.requester_id
      );
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', friendUserIds);

      const mappedFriends = friendsData.map(friendship => {
        const friendUserId = friendship.requester_id === user.id ? friendship.addressee_id : friendship.requester_id;
        const profile = profilesData?.find(p => p.user_id === friendUserId);
        
        return {
          ...friendship,
          friend_profile: profile ? {
            display_name: profile.display_name || 'Anonymous',
            avatar_url: profile.avatar_url,
            user_id: profile.user_id
          } : {
            display_name: 'Anonymous',
            user_id: friendUserId
          }
        };
      });
      
      setFriends(mappedFriends);
    }

    // Fetch pending requests received
    const { data: pendingData, error: pendingError } = await supabase
      .from('friendships')
      .select('*')
      .eq('status', 'pending')
      .eq('addressee_id', user.id);

    if (pendingError) {
      console.error('Error fetching pending requests:', pendingError);
    } else if (pendingData) {
      const requesterIds = pendingData.map(f => f.requester_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', requesterIds);

      const mappedPending = pendingData.map(friendship => {
        const profile = profilesData?.find(p => p.user_id === friendship.requester_id);
        
        return {
          ...friendship,
          friend_profile: profile ? {
            display_name: profile.display_name || 'Anonymous',
            avatar_url: profile.avatar_url,
            user_id: profile.user_id
          } : {
            display_name: 'Anonymous',
            user_id: friendship.requester_id
          }
        };
      });
      
      setPendingRequests(mappedPending);
    }

    // Fetch sent requests
    const { data: sentData, error: sentError } = await supabase
      .from('friendships')
      .select('*')
      .eq('status', 'pending')
      .eq('requester_id', user.id);

    if (sentError) {
      console.error('Error fetching sent requests:', sentError);
    } else if (sentData) {
      const addresseeIds = sentData.map(f => f.addressee_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', addresseeIds);

      const mappedSent = sentData.map(friendship => {
        const profile = profilesData?.find(p => p.user_id === friendship.addressee_id);
        
        return {
          ...friendship,
          friend_profile: profile ? {
            display_name: profile.display_name || 'Anonymous',
            avatar_url: profile.avatar_url,
            user_id: profile.user_id
          } : {
            display_name: 'Anonymous',
            user_id: friendship.addressee_id
          }
        };
      });
      
      setSentRequests(mappedSent);
    }

    setLoading(false);
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .ilike('display_name', `%${searchQuery}%`)
      .neq('user_id', user.id)
      .limit(10);

    if (error) {
      console.error('Error searching users:', error);
      return;
    }

    // Filter out users who are already friends or have pending requests
    const existingConnections = [
      ...friends.map(f => f.friend_profile?.user_id),
      ...pendingRequests.map(f => f.friend_profile?.user_id),
      ...sentRequests.map(f => f.friend_profile?.user_id)
    ];

    const filteredResults = data?.filter(user => 
      !existingConnections.includes(user.user_id)
    ) || [];

    setSearchResults(filteredResults);
  };

  const sendFriendRequest = async (targetUserId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('friendships')
      .insert({
        requester_id: user.id,
        addressee_id: targetUserId,
        status: 'pending'
      });

    if (error) {
      toast.error("Failed to send friend request");
      return;
    }

    toast.success("Friend request sent!");
    setSearchResults(prev => prev.filter(u => u.user_id !== targetUserId));
    fetchFriends();
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);

    if (error) {
      toast.error("Failed to accept friend request");
      return;
    }

    toast.success("Friend request accepted!");
    fetchFriends();
  };

  const rejectFriendRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      toast.error("Failed to reject friend request");
      return;
    }

    toast.success("Friend request rejected");
    fetchFriends();
  };

  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      toast.error("Failed to remove friend");
      return;
    }

    toast.success("Friend removed");
    fetchFriends();
  };

  useEffect(() => {
    fetchFriends();
  }, [user]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl mb-20">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Friends</h1>
      </div>

      {/* Search Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Find Friends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by display name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((userProfile) => (
                <div key={userProfile.user_id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={userProfile.avatar_url} />
                    <AvatarFallback>
                      {userProfile.display_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{userProfile.display_name}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => sendFriendRequest(userProfile.user_id)}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends">
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Requests ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent ({sentRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-3">
          {friends.map((friend) => (
            <Card key={friend.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={friend.friend_profile?.avatar_url} />
                    <AvatarFallback>
                      {friend.friend_profile?.display_name.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{friend.friend_profile?.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Friends since {new Date(friend.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFriend(friend.id)}
                  >
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {friends.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No friends yet. Search above to connect with other learners!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-3">
          {pendingRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={request.friend_profile?.avatar_url} />
                    <AvatarFallback>
                      {request.friend_profile?.display_name.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{request.friend_profile?.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Sent {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => acceptFriendRequest(request.id)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rejectFriendRequest(request.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {pendingRequests.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No pending friend requests.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-3">
          {sentRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={request.friend_profile?.avatar_url} />
                    <AvatarFallback>
                      {request.friend_profile?.display_name.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{request.friend_profile?.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Sent {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {sentRequests.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No sent friend requests.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Friends;