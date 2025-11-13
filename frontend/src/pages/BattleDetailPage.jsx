import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useBattle } from '../hooks/useBattle';
import BattleArena from '../components/BattleArena';

export default function BattleDetailPage() {
  const { id } = useParams();
  const { battle, loading, fetchBattle } = useBattle(id);

  useEffect(() => {
    if (id) {
      fetchBattle(id);
      
      // Poll for updates every 5 seconds
      const interval = setInterval(() => {
        fetchBattle(id);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [id]);

  if (loading && !battle) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="cosmic-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <BattleArena battleId={id} />
    </div>
  );
}
