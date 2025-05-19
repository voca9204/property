import { useState, useEffect } from 'react';
import { collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    propertyCount: 0,
    clientCount: 0,
    showcaseCount: 0
  });
  const [recentGuides, setRecentGuides] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;
        
        // Get property count
        const propertyQuery = query(
          collection(db, 'properties'),
          where('createdBy', '==', user.uid)
        );
        const propertySnapshot = await getDocs(propertyQuery);
        
        // Get client count
        const clientQuery = query(
          collection(db, 'clients'),
          where('createdBy', '==', user.uid)
        );
        const clientSnapshot = await getDocs(clientQuery);
        
        // Get showcase count
        const showcaseQuery = query(
          collection(db, 'showcases'),
          where('createdBy', '==', user.uid)
        );
        const showcaseSnapshot = await getDocs(showcaseQuery);
        
        // Get recent guides
        const guidesQuery = query(
          collection(db, 'guides'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const guidesSnapshot = await getDocs(guidesQuery);
        const guides = guidesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setStats({
          propertyCount: propertySnapshot.size,
          clientCount: clientSnapshot.size,
          showcaseCount: showcaseSnapshot.size
        });
        
        setRecentGuides(guides);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  if (loading) {
    return <div className="flex justify-center items-center p-10">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">대시보드</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-xl font-semibold text-gray-700">총 매물</div>
          <div className="text-3xl font-bold mt-2">{stats.propertyCount}</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-xl font-semibold text-gray-700">총 고객</div>
          <div className="text-3xl font-bold mt-2">{stats.clientCount}</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-xl font-semibold text-gray-700">총 쇼케이스</div>
          <div className="text-3xl font-bold mt-2">{stats.showcaseCount}</div>
        </div>
      </div>
      
      {/* Recent Guides */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">최근 가이드</h2>
        
        {recentGuides.length > 0 ? (
          <div className="divide-y">
            {recentGuides.map(guide => (
              <div key={guide.id} className="py-4">
                <div className="font-medium">{guide.title}</div>
                <div className="text-gray-600 text-sm">{guide.location?.address}</div>
                <div className="text-gray-500 text-xs mt-1">
                  {new Date(guide.createdAt.toDate()).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">아직 등록된 가이드가 없습니다.</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
