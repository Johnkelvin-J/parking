import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { getUserRewards, getTopUsers, getUserRanking } from '@/services/rewards';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Star, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function RewardsPage() {
  const { user } = useAuth();

  const { data: rewards, isLoading: rewardsLoading } = useQuery({
    queryKey: ['userRewards', user?.id],
    queryFn: () => {
      if (!user?.id) return [];
      return getUserRewards(user.id, 50);
    },
    enabled: !!user?.id,
  });

  const { data: topUsers } = useQuery({
    queryKey: ['topUsers'],
    queryFn: () => getTopUsers(10),
  });

  const { data: userRanking } = useQuery({
    queryKey: ['userRanking', user?.id],
    queryFn: () => {
      if (!user?.id) return -1;
      return getUserRanking(user.id);
    },
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rewards & Leaderboard</h1>
        <p className="text-muted-foreground mt-1">
          Track your points and compete with others
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Your Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{user?.points || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Total points earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-500" />
              Your Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {userRanking !== undefined && userRanking > 0 ? `#${userRanking}` : 'N/A'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Global ranking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-500" />
              Rewards Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{rewards?.length || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Total rewards</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
            <CardDescription>Top contributors</CardDescription>
          </CardHeader>
          <CardContent>
            {topUsers && topUsers.length > 0 ? (
              <div className="space-y-3">
                {topUsers.map((topUser, index) => (
                  <div
                    key={topUser.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      topUser.id === user?.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold">
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {topUser.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">
                        {topUser.displayName}
                        {topUser.id === user?.id && (
                          <Badge variant="outline" className="ml-2">You</Badge>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{topUser.points}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No rankings available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Rewards</CardTitle>
            <CardDescription>Your reward history</CardDescription>
          </CardHeader>
          <CardContent>
            {rewardsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : rewards && rewards.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Award className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{reward.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(reward.timestamp, 'PPp')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={reward.claimed ? 'default' : 'secondary'}>
                      +{reward.pointsEarned} pts
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No rewards yet</p>
                <p className="text-sm mt-2">Start reporting spots to earn points!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

