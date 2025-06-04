
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PuzzleGame from './PuzzleGame';

interface GameLevel {
  id: string;
  name: string;
  description: string;
  image: string;
  difficulty: 'easy' | 'medium' | 'hard';
  pieces: number;
}

const gameLevels: GameLevel[] = [
  {
    id: 'ha-long-bay',
    name: 'Ha Long Bay',
    description: 'UNESCO World Heritage Site with limestone pillars',
    image: '/placeholder.svg',
    difficulty: 'easy',
    pieces: 12
  },
  {
    id: 'hoi-an',
    name: 'Hoi An Ancient Town',
    description: 'Beautiful lantern-lit ancient trading port',
    image: '/placeholder.svg',
    difficulty: 'medium',
    pieces: 24
  },
  {
    id: 'temple-of-literature',
    name: 'Temple of Literature',
    description: 'Vietnam\'s first university in Hanoi',
    image: '/placeholder.svg',
    difficulty: 'hard',
    pieces: 48
  }
];

interface GameDashboardProps {
  user: User;
}

const GameDashboard = ({ user }: GameDashboardProps) => {
  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null);
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    fetchUserStats();
  }, [user]);

  const fetchUserStats = async () => {
    // Query the existing game_progress table
    const { data } = await supabase
      .from('game_progress')
      .select('*')
      .eq('user_id', user.id);
    
    if (data && data.length > 0) {
      // Calculate stats from game_progress records
      const completedPuzzles = data.filter(record => record.completed_at).length;
      const totalScore = data.reduce((sum, record) => sum + (record.score || 0), 0);
      const bestTime = data
        .filter(record => record.time_taken)
        .reduce((min, record) => Math.min(min, record.time_taken), Infinity);

      setUserStats({
        puzzles_completed: completedPuzzles,
        total_score: totalScore,
        best_time: bestTime === Infinity ? null : bestTime
      });
    } else {
      setUserStats({
        puzzles_completed: 0,
        total_score: 0,
        best_time: null
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleBackToLevels = () => {
    setSelectedLevel(null);
    fetchUserStats(); // Refresh stats when returning
  };

  if (selectedLevel) {
    return (
      <PuzzleGame 
        level={selectedLevel} 
        user={user} 
        onBack={handleBackToLevels} 
      />
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              🧩 Vietnam Heritage Jigsaw Quest
            </h1>
            <p className="text-white/80">Welcome back, {user.email}</p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>

        {userStats && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {userStats.puzzles_completed || 0}
                  </div>
                  <div className="text-sm text-gray-600">Puzzles Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {userStats.total_score || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {userStats.best_time || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Best Time (seconds)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gameLevels.map((level) => (
            <Card key={level.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <img 
                  src={level.image} 
                  alt={level.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <CardTitle className="flex items-center justify-between">
                  {level.name}
                  <span className={`text-xs px-2 py-1 rounded ${
                    level.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    level.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {level.difficulty}
                  </span>
                </CardTitle>
                <CardDescription>{level.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {level.pieces} pieces
                </p>
                <Button 
                  onClick={() => setSelectedLevel(level)}
                  className="w-full"
                >
                  Start Puzzle
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameDashboard;
