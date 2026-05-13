import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    videosToday: 0,
    totalVideos: 0,
    viewsToday: 0,
    totalViews: 0,
    estimatedIncome: 0,
    monthlyProjection: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const { data: allVideos } = await supabase
        .from('videos')
        .select('*');

      const totalViews = allVideos?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;
      const estimatedIncome = (totalViews / 1000) * 0.75;

      setStats({
        videosToday: allVideos?.length || 0,
        totalVideos: allVideos?.length || 0,
        viewsToday: totalViews,
        totalViews: totalViews,
        estimatedIncome,
        monthlyProjection: estimatedIncome * 30,
      });
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', background: '#1a1a1a', minHeight: '100vh', color: '#fff', fontFamily: 'Arial' }}>
      <h1>🌧️ NOCTURNA - Dashboard</h1>
      
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div style={{ background: '#667eea', padding: '30px', borderRadius: '12px' }}>
            <p>Videos Totales</p>
            <h2>{stats.totalVideos}</h2>
          </div>
          <div style={{ background: '#f093fb', padding: '30px', borderRadius: '12px' }}>
            <p>Vistas Totales</p>
            <h2>{stats.totalViews.toLocaleString()}</h2>
          </div>
          <div style={{ background: '#4facfe', padding: '30px', borderRadius: '12px' }}>
            <p>Ingresos Estimados</p>
            <h2>${stats.estimatedIncome.toFixed(2)}</h2>
          </div>
          <div style={{ background: '#43e97b', padding: '30px', borderRadius: '12px' }}>
            <p>Proyección Mensual</p>
            <h2>${stats.monthlyProjection.toFixed(0)}</h2>
          </div>
        </div>
      )}
    </div>
  );
}
