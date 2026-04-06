import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { Loader2, Upload, X, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function EditAd() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    category: '',
    location: '',
    phoneNumber: '',
    images: [] as string[]
  });

  const [uploadingImages, setUploadingImages] = useState(false);

  // 1. Fetch existing Ad Data on Mount
  useEffect(() => {
    const fetchAdData = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'ads', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Security Check: Only the owner can edit
          if (data.sellerUid !== user?.uid) {
            toast.error("Unauthorized access");
            navigate('/profile');
            return;
          }

          setFormData({
            title: data.title || '',
            price: data.price || '',
            description: data.description || '',
            category: data.category || '',
            location: data.location || '',
            phoneNumber: data.phoneNumber || '',
            images: data.images || []
          });
        } else {
          toast.error("Ad not found");
          navigate('/profile');
        }
      } catch (error) {
        console.error("Error fetching ad:", error);
        toast.error("Failed to load ad data");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchAdData();
  }, [id, user, navigate]);

  // 2. Handle Image Upload to Cloudinary
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadingImages(true);
    const uploadedUrls: string[] = [...formData.images];

    try {
      for (let i = 0; i < files.length; i++) {
        const fileData = new FormData();
        fileData.append('file', files[i]);
        fileData.append('upload_preset', 'your_preset_name'); // Replace with your actual Cloudinary preset

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/your_cloud_name/image/upload`, // Replace with your cloud name
          { method: 'POST', body: fileData }
        );
        const file = await res.json();
        uploadedUrls.push(file.secure_url);
      }
      setFormData({ ...formData, images: uploadedUrls });
      toast.success("Images uploaded successfully");
    } catch (err) {
      toast.error("Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, index) => index !== indexToRemove)
    });
  };

  // 3. Handle Form Submission (Update Firestore)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (formData.images.length === 0) {
      toast.error("Please include at least one image");
      return;
    }

    setUpdating(true);
    try {
      const docRef = doc(db, 'ads', id);
      await updateDoc(docRef, {
        ...formData,
        price: Number(formData.price),
        updatedAt: new Date().toISOString(),
        status: 'pending' // Reset to pending for review after edit
      });

      toast.success("Ad updated and sent for review!");
      navigate('/profile');
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update ad");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-green-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center text-gray-600 mb-6 hover:text-green-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Profile</span>
        </button>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Ad Details</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
              <input 
                type="text"
                required
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            {/* Price & Category Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Price (PKR)</label>
                <input 
                  type="number"
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                <select 
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="Birds">Birds</option>
                  <option value="Cats">Cats</option>
                  <option value="Dogs">Dogs</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
              <textarea 
                required
                rows={5}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none resize-none"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            {/* Images Section */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Ad Photos</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages}
                  className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-green-500 hover:text-green-500 transition-all"
                >
                  {uploadingImages ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-bold">Add More</span>
                    </>
                  )}
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex-1 p-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating || uploadingImages}
                className="flex-1 p-4 bg-green-700 text-white rounded-2xl font-bold hover:bg-green-800 transition-all shadow-lg shadow-green-200 disabled:opacity-50 disabled:shadow-none"
              >
                {updating ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Saving Changes...
                  </span>
                ) : "Update Ad"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}