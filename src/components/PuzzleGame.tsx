
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';

interface GameLevel {
  id: string;
  name: string;
  description: string;
  image: string;
  difficulty: 'easy' | 'medium' | 'hard';
  pieces: number;
}

interface PuzzlePiece {
  id: number;
  correctPosition: number;
  currentPosition: number;
  isPlaced: boolean;
}

interface PuzzleGameProps {
  level: GameLevel;
  user: User;
  onBack: () => void;
}

const PuzzleGame = ({ level, user, onBack }: PuzzleGameProps) => {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [draggedPiece, setDraggedPiece] = useState<number | null>(null);
  const [gameStartTime] = useState(Date.now());
  const [gameCompleted, setGameCompleted] = useState(false);
  const [completionTime, setCompletionTime] = useState<number | null>(null);
  const gridSize = Math.sqrt(level.pieces);

  useEffect(() => {
    initializePuzzle();
  }, [level]);

  const initializePuzzle = () => {
    const initialPieces: PuzzlePiece[] = [];
    for (let i = 0; i < level.pieces; i++) {
      initialPieces.push({
        id: i,
        correctPosition: i,
        currentPosition: -1, // -1 means in the pieces area
        isPlaced: false,
      });
    }
    
    // Shuffle the pieces
    const shuffled = [...initialPieces].sort(() => Math.random() - 0.5);
    setPieces(shuffled);
  };

  const handleDragStart = (pieceId: number) => {
    setDraggedPiece(pieceId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetPosition: number) => {
    e.preventDefault();
    
    if (draggedPiece === null) return;

    setPieces(prev => {
      const newPieces = [...prev];
      const pieceIndex = newPieces.findIndex(p => p.id === draggedPiece);
      
      if (pieceIndex !== -1) {
        // Check if the position is already occupied
        const occupiedPiece = newPieces.find(p => p.currentPosition === targetPosition);
        if (occupiedPiece) {
          // Swap positions or return to pieces area
          occupiedPiece.currentPosition = -1;
          occupiedPiece.isPlaced = false;
        }

        newPieces[pieceIndex].currentPosition = targetPosition;
        newPieces[pieceIndex].isPlaced = true;
      }

      return newPieces;
    });

    setDraggedPiece(null);
  };

  const checkGameCompletion = () => {
    const allPlaced = pieces.every(piece => 
      piece.isPlaced && piece.currentPosition === piece.correctPosition
    );

    if (allPlaced && !gameCompleted) {
      const endTime = Date.now();
      const timeTaken = Math.floor((endTime - gameStartTime) / 1000);
      setCompletionTime(timeTaken);
      setGameCompleted(true);
      saveGameResult(timeTaken);
      
      toast({
        title: "Congratulations! 🎉",
        description: `You completed ${level.name} in ${timeTaken} seconds!`,
      });
    }
  };

  useEffect(() => {
    checkGameCompletion();
  }, [pieces]);

  const saveGameResult = async (timeTaken: number) => {
    const score = Math.max(1000 - timeTaken, 100); // Higher score for faster completion

    try {
      // Insert into the existing game_progress table
      const { error } = await supabase.from('game_progress').insert({
        user_id: user.id,
        level_id: level.id,
        completed_at: new Date().toISOString(),
        time_taken: timeTaken,
        score: score
      });

      if (error) {
        console.error('Error saving game result:', error);
        toast({
          title: "Error",
          description: "Failed to save your progress",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  };

  const placedPieces = pieces.filter(piece => piece.isPlaced);
  const unplacedPieces = pieces.filter(piece => !piece.isPlaced);
  const progress = (placedPieces.length / pieces.length) * 100;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Button onClick={onBack} variant="outline" className="mb-2">
              ← Back to Levels
            </Button>
            <h1 className="text-3xl font-bold text-white">{level.name}</h1>
            <p className="text-white/80">{level.description}</p>
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.floor(progress)}%
                </div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Progress value={progress} className="mb-6" />

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Puzzle Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Puzzle Board</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="grid gap-1 w-full max-w-md mx-auto"
                style={{ 
                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                  aspectRatio: '1'
                }}
              >
                {Array.from({ length: level.pieces }, (_, index) => {
                  const piece = pieces.find(p => p.currentPosition === index);
                  const isCorrect = piece && piece.correctPosition === index;
                  
                  return (
                    <div
                      key={index}
                      className={`
                        border-2 border-dashed border-gray-300 
                        aspect-square flex items-center justify-center
                        ${piece ? 'bg-blue-100' : 'bg-gray-50'}
                        ${isCorrect ? 'border-green-500 bg-green-100' : ''}
                      `}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      {piece && (
                        <div 
                          className={`
                            w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 
                            flex items-center justify-center text-white font-bold
                            cursor-move rounded
                            ${isCorrect ? 'from-green-400 to-green-600' : ''}
                          `}
                          draggable
                          onDragStart={() => handleDragStart(piece.id)}
                        >
                          {piece.id + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Pieces Area */}
          <Card>
            <CardHeader>
              <CardTitle>Puzzle Pieces</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {unplacedPieces.map((piece) => (
                  <div
                    key={piece.id}
                    className="
                      aspect-square bg-gradient-to-br from-blue-400 to-purple-500 
                      flex items-center justify-center text-white font-bold
                      cursor-move rounded hover:scale-105 transition-transform
                    "
                    draggable
                    onDragStart={() => handleDragStart(piece.id)}
                  >
                    {piece.id + 1}
                  </div>
                ))}
              </div>
              
              {gameCompleted && completionTime && (
                <div className="mt-6 p-4 bg-green-100 rounded-lg text-center">
                  <h3 className="text-lg font-bold text-green-800 mb-2">
                    Puzzle Complete! 🎉
                  </h3>
                  <p className="text-green-700">
                    Completed in {completionTime} seconds
                  </p>
                  <Button 
                    onClick={onBack} 
                    className="mt-4"
                  >
                    Choose Next Puzzle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PuzzleGame;
