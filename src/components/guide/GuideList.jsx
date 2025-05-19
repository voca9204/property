import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { guideService } from '../../firebase/services/guide.service';
import { propertyImageService } from '../../firebase/services/image.service';
import { PROPERTY_TYPES } from '../../models/guide.model';
import { auth } from '../../firebase/config';
import './GuideList.css';

/**
 * GuideList component for displaying a list of property guides
 */
const GuideList = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState('card'); // 'card' or 'table'
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [guideToDelete, setGuideToDelete] = useState(null);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Property type labels
  const propertyTypeLabels = {
    [PROPERTY_TYPES.APARTMENT]: '아파트',
    [PROPERTY_TYPES.HOUSE]: '주택',
    [PROPERTY_TYPES.OFFICE]: '사무실',
    [PROPERTY_TYPES.RETAIL]: '상가',
    [PROPERTY_TYPES.INDUSTRIAL]: '공장/창고',
    [PROPERTY_TYPES.OTHER]: '기타'
  };

  // Fetch guides
  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const guidesData = await guideService.getAll();
        console.log('Fetched guides:', guidesData);
        
        // 이미지 URL 디버깅
        guidesData.forEach(guide => {
          console.log(`Guide ${guide.id} - Title: ${guide.title}`);
          console.log(`  imageUrl: ${guide.imageUrl || 'none'}`);
          console.log(`  imageUrls: ${guide.imageUrls ? JSON.stringify(guide.imageUrls) : 'none'}`);
          console.log(`  imagePath: ${guide.imagePath || 'none'}`);
          console.log(`  imagePaths: ${guide.imagePaths ? JSON.stringify(guide.imagePaths) : 'none'}`);
        });
        
        // 이미지 URL이 없지만 경로가 있는 가이드에 대해 URL 생성
        const updatedGuidesData = await Promise.all(guidesData.map(async (guide) => {
          // 이미지 URL이 없지만 경로가 있는 경우
          if ((!guide.imageUrl || !guide.imageUrls || guide.imageUrls.length === 0) && 
              (guide.imagePath || (guide.imagePaths && guide.imagePaths.length > 0))) {
            try {
              // 이미지 경로가 있으면 스토리지에서 URL 가져오기 시도
              const paths = guide.imagePaths || (guide.imagePath ? [guide.imagePath] : []);
              
              if (paths.length > 0) {
                console.log(`Guide ${guide.id} - 이미지 URL 다시 가져오기 시도:`, paths);
                
                const imageUrls = await Promise.all(paths.map(async (path) => {
                  try {
                    const url = await propertyImageService.storageService.getFileURL(path);
                    console.log(`  -> 성공: ${path} -> ${url}`);
                    return url;
                  } catch (err) {
                    console.error(`  -> 실패: ${path}`, err);
                    return null;
                  }
                }));
                
                // null 값 제거
                const validUrls = imageUrls.filter(url => url !== null);
                
                if (validUrls.length > 0) {
                  console.log(`Guide ${guide.id} - 새 이미지 URL:`, validUrls);
                  return {
                    ...guide,
                    imageUrls: validUrls,
                    imageUrl: validUrls[0] // 첫 번째 URL을 기본 이미지로 설정
                  };
                }
              }
            } catch (err) {
              console.error(`Guide ${guide.id} - 이미지 URL 가져오기 실패:`, err);
            }
          }
          
          return guide;
        }));
        
        setGuides(updatedGuidesData);
      } catch (err) {
        console.error('Error fetching guides:', err);
        setError('가이드 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, []);

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle sort change
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to desc
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get sorted guides
  const getSortedGuides = () => {
    return [...guides].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle timestamps
      if (sortField === 'createdAt' || sortField === 'updatedAt') {
        aValue = aValue?.toDate ? aValue.toDate().getTime() : new Date(aValue || 0).getTime();
        bValue = bValue?.toDate ? bValue.toDate().getTime() : new Date(bValue || 0).getTime();
      }
      
      // Handle nulls/undefined
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;
      
      // String comparison
      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      // Number comparison
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }
    
    setImageFile(file);
    handleImageUpload(file, selectedGuide.id);
  };

  // Handle image upload
  const handleImageUpload = async (file, guideId) => {
    if (!file || !guideId) return;
    
    setIsUploading(true);
    
    try {
      // Progress callback for image upload
      const handleUploadProgress = (progress) => {
        setUploadProgress(progress);
      };
      
      console.log(`이미지 업로드 시작: 가이드 ID=${guideId}, 파일=${file.name}`);
      
      // Upload the new image
      const uploadResult = await propertyImageService.uploadPropertyImage(
        file,
        guideId,
        {
          customMetadata: {
            guideId,
            uploadTime: new Date().toISOString(),
            uploader: auth.currentUser?.uid || 'unknown'
          }
        },
        handleUploadProgress
      );
      
      console.log('이미지 업로드 결과:', uploadResult);
      
      // 업로드된 이미지 URL이 유효한지 확인
      if (!uploadResult.url) {
        throw new Error('업로드된 이미지 URL이 없습니다.');
      }
      
      try {
        // 업로드된 이미지 URL 직접 테스트
        const testImage = new Image();
        testImage.onload = async () => {
          console.log('업로드된 이미지 URL이 유효합니다:', uploadResult.url);
          await updateGuideWithNewImage(guideId, uploadResult);
        };
        testImage.onerror = async (error) => {
          console.error('업로드된 이미지 URL 테스트 실패:', error);
          // 실패한 경우에도 일단 업데이트 시도
          await updateGuideWithNewImage(guideId, uploadResult);
        };
        testImage.src = uploadResult.url;
      } catch (testError) {
        console.error('이미지 URL 테스트 오류:', testError);
        // 테스트 중 오류가 발생해도 계속 진행
        await updateGuideWithNewImage(guideId, uploadResult);
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      alert(`이미지 업로드 중 오류가 발생했습니다: ${error.message}`);
      setIsUploading(false);
      setImageFile(null);
      setUploadProgress(0);
      setSelectedGuide(null);
    }
  };
  
  // 가이드 문서를 이미지 URL로 업데이트
  const updateGuideWithNewImage = async (guideId, uploadResult) => {
    try {
      // Update the guide with the new image URL
      const guide = guides.find(g => g.id === guideId);
      
      if (guide) {
        // Create imageUrls array if it doesn't exist
        const imageUrls = guide.imageUrls || [];
        const updatedImageUrls = [...imageUrls, uploadResult.url];
        
        // Create imagePaths array if it doesn't exist
        const imagePaths = guide.imagePaths || [];
        const updatedImagePaths = [...imagePaths, uploadResult.path];
        
        console.log('가이드 문서 업데이트:', {
          guideId,
          updatedImageUrls,
          updatedImagePaths
        });
        
        // Update the guide document
        await guideService.update(guideId, {
          imageUrls: updatedImageUrls,
          imagePaths: updatedImagePaths,
          // Fallback for older guides that still use imageUrl
          imageUrl: uploadResult.url
        });
        
        // Update local state
        setGuides(guides.map(g => 
          g.id === guideId 
            ? { 
                ...g, 
                imageUrls: updatedImageUrls, 
                imagePaths: updatedImagePaths,
                imageUrl: uploadResult.url
              } 
            : g
        ));
        
        console.log('가이드 업데이트 완료');
        alert('이미지가 성공적으로 업로드되었습니다.');
      }
    } catch (updateError) {
      console.error('가이드 업데이트 오류:', updateError);
      alert(`가이드 업데이트 중 오류가 발생했습니다: ${updateError.message}`);
    } finally {
      setIsUploading(false);
      setImageFile(null);
      setUploadProgress(0);
      setSelectedGuide(null);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!guideToDelete) return;
    
    try {
      await guideService.deleteGuideWithTransaction(guideToDelete.id);
      
      // Update local state
      setGuides(guides.filter(g => g.id !== guideToDelete.id));
      
      // Close modal
      setShowDeleteModal(false);
      setGuideToDelete(null);
      
      alert('가이드가 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting guide:', error);
      alert(`가이드 삭제 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // Handle edit guide
  const handleEdit = (guide) => {
    navigate(`/guides/edit/${guide.id}`);
  };

  // Check if current user can edit/delete
  const canModify = (guide) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;
    
    // Admin can modify any guide
    if (currentUser.email === 'admin@example.com') return true; // Replace with actual admin check
    
    // Creator can modify their own guides
    return guide.createdBy === currentUser.uid;
  };

  // Loading state
  if (loading) {
    return (
      <div className="guides-loading">
        <div className="loading-spinner"></div>
        <p>가이드 목록을 불러오는 중입니다...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="guides-error">
        <h2>오류가 발생했습니다</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Empty state
  if (guides.length === 0) {
    return (
      <div className="guides-empty">
        <h2>등록된 가이드가 없습니다</h2>
        <p>아직 등록된 가이드가 없습니다. 새로운 가이드를 만들어보세요!</p>
        <Link to="/guides/new" className="create-guide-button">
          새 가이드 만들기
        </Link>
      </div>
    );
  }

  return (
    <div className="guide-list-container">
      <div className="guide-list-header">
        <h1>부동산 가이드 목록</h1>
        <div className="guide-list-actions">
          <div className="view-toggle">
            <button 
              className={`view-toggle-button ${viewType === 'card' ? 'active' : ''}`}
              onClick={() => setViewType('card')}
            >
              카드 보기
            </button>
            <button 
              className={`view-toggle-button ${viewType === 'table' ? 'active' : ''}`}
              onClick={() => setViewType('table')}
            >
              테이블 보기
            </button>
          </div>
          <Link to="/guides/new" className="create-guide-button">
            새 가이드 만들기
          </Link>
        </div>
      </div>

      {viewType === 'card' ? (
        <div className="guide-cards">
          {getSortedGuides().map((guide) => (
            <div key={guide.id} className="guide-card">
              <div className="guide-card-image">
                {guide.imageUrls && guide.imageUrls.length > 0 ? (
                  <>
                    <img 
                      src={guide.imageUrls[0]} 
                      alt={guide.title} 
                      onError={(e) => {
                        console.error(`이미지 로드 오류(imageUrls): ${guide.imageUrls[0]}`, e);
                        console.log('이미지 정보:', {
                          guide: guide.id,
                          title: guide.title,
                          url: guide.imageUrls[0],
                          path: guide.imagePaths ? guide.imagePaths[0] : 'none'
                        });
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/350x200?text=이미지+로드+실패";
                      }}
                    />
                    <div className="image-debug">{guide.imageUrls[0]}</div>
                  </>
                ) : guide.imageUrl ? (
                  <>
                    <img 
                      src={guide.imageUrl} 
                      alt={guide.title}
                      onError={(e) => {
                        console.error(`이미지 로드 오류(imageUrl): ${guide.imageUrl}`, e);
                        console.log('이미지 정보:', {
                          guide: guide.id,
                          title: guide.title,
                          url: guide.imageUrl,
                          path: guide.imagePath || 'none'
                        });
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/350x200?text=이미지+로드+실패";
                      }}
                    />
                    <div className="image-debug">{guide.imageUrl}</div>
                  </>
                ) : (
                  <div className="no-image">
                    <img 
                      src={`https://via.placeholder.com/350x200?text=${encodeURIComponent(guide.title || '이미지 없음')}`}
                      alt={guide.title || '이미지 없음'}
                    />
                  </div>
                )}
                {guide.propertyType && (
                  <div className="property-type-badge">
                    {propertyTypeLabels[guide.propertyType] || '기타'}
                  </div>
                )}
              </div>
              
              <div className="guide-card-content">
                <h3 className="guide-title">{guide.title}</h3>
                
                {guide.address && (
                  <p className="guide-address">
                    <strong>주소:</strong> {guide.address}
                  </p>
                )}
                
                {guide.description && (
                  <p className="guide-description">
                    {guide.description.length > 100
                      ? `${guide.description.substring(0, 100)}...`
                      : guide.description}
                  </p>
                )}
                
                {guide.createdAt && (
                  <p className="guide-date">
                    <strong>등록일:</strong> {formatDate(guide.createdAt)}
                  </p>
                )}
                
                <div className="guide-card-actions">
                  <Link to={`/guides/${guide.id}`} className="view-guide-button">
                    가이드 보기
                  </Link>
                  
                  {canModify(guide) && (
                    <div className="guide-management-actions">
                      <button 
                        className="edit-button"
                        onClick={() => handleEdit(guide)}
                      >
                        수정
                      </button>
                      <button 
                        className="add-image-button"
                        onClick={() => {
                          setSelectedGuide(guide);
                          fileInputRef.current.click();
                        }}
                      >
                        이미지 추가
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => {
                          setGuideToDelete(guide);
                          setShowDeleteModal(true);
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="guide-table-container">
          <table className="guide-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('title')} className="sortable">
                  고객명
                  {sortField === 'title' && (
                    <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </th>
                <th onClick={() => handleSort('address')} className="sortable">
                  주소
                  {sortField === 'address' && (
                    <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </th>
                <th onClick={() => handleSort('propertyType')} className="sortable">
                  유형
                  {sortField === 'propertyType' && (
                    <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </th>
                <th onClick={() => handleSort('createdAt')} className="sortable">
                  등록일
                  {sortField === 'createdAt' && (
                    <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </th>
                <th>미리보기</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {getSortedGuides().map((guide) => (
                <tr key={guide.id}>
                  <td>{guide.title}</td>
                  <td>{guide.address}</td>
                  <td>{propertyTypeLabels[guide.propertyType] || '기타'}</td>
                  <td>{formatDate(guide.createdAt)}</td>
                  <td className="thumbnail-cell">
                    {guide.imageUrls && guide.imageUrls.length > 0 ? (
                      <>
                        <img 
                          className="table-thumbnail" 
                          src={guide.imageUrls[0]} 
                          alt={guide.title}
                          onError={(e) => {
                            console.error(`이미지 로드 오류(imageUrls): ${guide.imageUrls[0]}`, e);
                            console.log('이미지 정보:', {
                              guide: guide.id,
                              title: guide.title,
                              url: guide.imageUrls[0],
                              path: guide.imagePaths ? guide.imagePaths[0] : 'none'
                            });
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/60x60?text=에러";
                          }}
                        />
                        <div className="table-image-debug">{guide.imageUrls[0]}</div>
                      </>
                    ) : guide.imageUrl ? (
                      <>
                        <img 
                          className="table-thumbnail" 
                          src={guide.imageUrl} 
                          alt={guide.title}
                          onError={(e) => {
                            console.error(`이미지 로드 오류(imageUrl): ${guide.imageUrl}`, e);
                            console.log('이미지 정보:', {
                              guide: guide.id,
                              title: guide.title,
                              url: guide.imageUrl,
                              path: guide.imagePath || 'none'
                            });
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/60x60?text=에러";
                          }}
                        />
                        <div className="table-image-debug">{guide.imageUrl}</div>
                      </>
                    ) : (
                      <div className="no-image-small">
                        <img 
                          className="table-thumbnail"
                          src={`https://via.placeholder.com/60x60?text=${encodeURIComponent(guide.title.substring(0, 5) || '이미지')}`}
                          alt={guide.title || '이미지 없음'}
                        />
                      </div>
                    )}
                  </td>
                  <td className="action-cell">
                    <Link to={`/guides/${guide.id}`} className="table-view-button">
                      보기
                    </Link>
                    
                    {canModify(guide) && (
                      <>
                        <button 
                          className="table-edit-button"
                          onClick={() => handleEdit(guide)}
                        >
                          수정
                        </button>
                        <button 
                          className="table-image-button"
                          onClick={() => {
                            setSelectedGuide(guide);
                            fileInputRef.current.click();
                          }}
                        >
                          이미지
                        </button>
                        <button 
                          className="table-delete-button"
                          onClick={() => {
                            setGuideToDelete(guide);
                            setShowDeleteModal(true);
                          }}
                        >
                          삭제
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        style={{ display: 'none' }}
      />
      
      {/* Upload progress overlay */}
      {isUploading && (
        <div className="upload-overlay">
          <div className="upload-modal">
            <h3>이미지 업로드 중...</h3>
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ width: `${uploadProgress}%` }}
              >
                {Math.round(uploadProgress)}%
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>가이드 삭제 확인</h3>
            <p>
              정말로 "{guideToDelete?.title}" 가이드를 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setGuideToDelete(null);
                }}
              >
                취소
              </button>
              <button 
                className="confirm-delete-button"
                onClick={handleDeleteConfirm}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideList;
