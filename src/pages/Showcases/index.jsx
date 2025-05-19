import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';

const Showcases = () => {
  const { user } = useAuth();
  const [showcases, setShowcases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShowcases = async () => {
      try {
        if (!user) return;
        
        const q = query(
          collection(db, 'showcases'),
          where('createdBy', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const showcasesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        
        setShowcases(showcasesData);
      } catch (err) {
        console.error('Error fetching showcases:', err);
        setError('쇼케이스 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchShowcases();
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm('정말 이 쇼케이스를 삭제하시겠습니까?')) return;
    
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'showcases', id));
      setShowcases(showcases.filter(showcase => showcase.id !== id));
    } catch (err) {
      console.error('Error deleting showcase:', err);
      setError('쇼케이스 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center p-10">로딩 중...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">쇼케이스 관리</h1>
        <Link 
          to="/showcases/new" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          새 쇼케이스 만들기
        </Link>
      </div>
      
      {showcases.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600 mb-4">등록된 쇼케이스가 없습니다.</p>
          <Link 
            to="/showcases/new" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            첫 쇼케이스 만들기
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제목
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  포함된 매물
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  생성일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {showcases.map((showcase) => (
                <tr key={showcase.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {showcase.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {showcase.propertyCount || '0'}개
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-blue-500 underline">
                      <a href={`/s/${showcase.slug}`} target="_blank" rel="noreferrer">
                        /s/{showcase.slug}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {showcase.createdAt ? new Date(showcase.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link 
                      to={`/showcases/${showcase.id}`}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      보기
                    </Link>
                    <Link 
                      to={`/showcases/${showcase.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-800 mr-4"
                    >
                      수정
                    </Link>
                    <button
                      onClick={() => handleDelete(showcase.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Showcases;
