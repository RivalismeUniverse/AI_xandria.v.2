import { useState, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const useBattle = (battleId = null) => {
  const [battle, setBattle] = useState(null);
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    if (battleId) {
      fetchBattle(battleId);
    }
  }, [battleId]);

  const fetchBattle = async (id) => {
    setLoading(true);
    try {
      const data = await api.getBattle(id);
      setBattle(data);
      return data;
    } catch (error) {
      toast.error('Failed to load battle');
    } finally {
      setLoading(false);
    }
  };

  const fetchBattles = async (params = {}) => {
    setLoading(true);
    try {
      const data = await api.getBattles(params);
      setBattles(data.battles);
      return data;
    } catch (error) {
      toast.error('Failed to load battles');
    } finally {
      setLoading(false);
    }
  };

  const createBattle = async (persona1Id, persona2Id, topic) => {
    setLoading(true);
    try {
      const newBattle = await api.createBattle({
        persona1_id: persona1Id,
        persona2_id: persona2Id,
        topic
      });
      toast.success('Battle created! Arguments generating...');
      return newBattle;
    } catch (error) {
      toast.error('Failed to create battle');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const vote = async (battleId, personaId) => {
    setVoting(true);
    try {
      await api.voteBattle(battleId, personaId);
      toast.success('Vote recorded!');
      
      // Refresh battle data
      await fetchBattle(battleId);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to vote');
      throw error;
    } finally {
      setVoting(false);
    }
  };

  const completeBattle = async (battleId) => {
    setLoading(true);
    try {
      await api.completeBattle(battleId);
      toast.success('Battle completed!');
      await fetchBattle(battleId);
    } catch (error) {
      toast.error('Failed to complete battle');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    battle,
    battles,
    loading,
    voting,
    fetchBattle,
    fetchBattles,
    createBattle,
    vote,
    completeBattle
  };
};
