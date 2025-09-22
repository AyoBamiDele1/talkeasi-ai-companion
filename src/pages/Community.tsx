import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, MessageCircle, Share2, Trophy, Target, BookOpen, Users, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  post_type: string;
  metadata: any;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_url?: string;
  };
  post_likes?: { user_id: string }[];
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_url?: string;
  };
}

const Community = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPost, setNewPost] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    const { data: postsData, error } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }

    if (!postsData) {
      setPosts([]);
      setLoading(false);
      return;
    }

    // Get profile data for each post
    const userIds = [...new Set(postsData.map(post => post.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds);

    // Get likes data for posts
    const postIds = postsData.map(post => post.id);
    const { data: likesData } = await supabase
      .from('post_likes')
      .select('post_id, user_id')
      .in('post_id', postIds);

    // Map the data together
    const enrichedPosts = postsData.map(post => {
      const profile = profilesData?.find(p => p.user_id === post.user_id);
      const postLikes = likesData?.filter(like => like.post_id === post.id) || [];
      
      return {
        ...post,
        profiles: profile ? {
          display_name: profile.display_name || 'Anonymous',
          avatar_url: profile.avatar_url
        } : { display_name: 'Anonymous' },
        post_likes: postLikes
      };
    });

    setPosts(enrichedPosts);
    setLoading(false);
  };

  const fetchComments = async (postId: string) => {
    const { data: commentsData, error } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return;
    }

    if (!commentsData) {
      setComments([]);
      return;
    }

    // Get profile data for each comment
    const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds);

    // Map the data together
    const enrichedComments = commentsData.map(comment => {
      const profile = profilesData?.find(p => p.user_id === comment.user_id);
      
      return {
        ...comment,
        profiles: profile ? {
          display_name: profile.display_name || 'Anonymous',
          avatar_url: profile.avatar_url
        } : { display_name: 'Anonymous' }
      };
    });

    setComments(enrichedComments);
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || !user) return;

    const { error } = await supabase
      .from('community_posts')
      .insert({
        user_id: user.id,
        content: newPost,
        post_type: 'general'
      });

    if (error) {
      toast.error("Failed to create post");
      return;
    }

    setNewPost("");
    toast.success("Post created!");
    fetchPosts();
  };

  const handleLikePost = async (postId: string, isLiked: boolean) => {
    if (!user) return;

    if (isLiked) {
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id
        });
    }

    fetchPosts();
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPostId || !user) return;

    const { error } = await supabase
      .from('post_comments')
      .insert({
        post_id: selectedPostId,
        user_id: user.id,
        content: newComment
      });

    if (error) {
      toast.error("Failed to add comment");
      return;
    }

    setNewComment("");
    fetchComments(selectedPostId);
    fetchPosts(); // Refresh to update comment counts
  };

  const getPostIcon = (postType: string) => {
    switch (postType) {
      case 'achievement': return Trophy;
      case 'progress': return Target;
      case 'tip': return BookOpen;
      default: return MessageCircle;
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (selectedPostId) {
      fetchComments(selectedPostId);
    }
  }, [selectedPostId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-20 bg-muted rounded"></div>
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
        <h1 className="text-2xl font-bold">Community</h1>
      </div>

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4">
          {/* Create Post */}
          <Card>
            <CardContent className="p-4">
              <Textarea
                placeholder="Share your learning journey..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[100px] mb-3"
              />
              <Button onClick={handleCreatePost} disabled={!newPost.trim()}>
                Share Post
              </Button>
            </CardContent>
          </Card>

          {/* Posts Feed */}
          {posts.map((post) => {
            const isLiked = post.post_likes?.some(like => like.user_id === user?.id);
            const PostIcon = getPostIcon(post.post_type);
            
            return (
              <Card key={post.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={post.profiles?.avatar_url} />
                      <AvatarFallback>
                        {post.profiles?.display_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {post.profiles?.display_name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <PostIcon className="w-3 h-3" />
                      {post.post_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm mb-4 whitespace-pre-wrap">{post.content}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "gap-1 h-8 px-2",
                        isLiked && "text-red-500"
                      )}
                      onClick={() => handleLikePost(post.id, isLiked)}
                    >
                      <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                      {post.likes_count}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 h-8 px-2"
                      onClick={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      {post.comments_count}
                    </Button>
                    
                    <Button variant="ghost" size="sm" className="gap-1 h-8 px-2">
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                  </div>

                  {/* Comments Section */}
                  {selectedPostId === post.id && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="space-y-3 mb-4">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={comment.profiles?.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {comment.profiles?.display_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-muted rounded-lg px-3 py-2">
                                <p className="text-xs font-medium">
                                  {comment.profiles?.display_name || 'Anonymous'}
                                </p>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="min-h-[60px] text-sm"
                        />
                        <Button 
                          size="sm" 
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                        >
                          Post
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Top Learners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Leaderboard coming soon! Keep learning to compete with friends.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Friends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Friend connections coming soon! Connect with other learners.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Community;