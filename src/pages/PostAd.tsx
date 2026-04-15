import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Camera, MapPin, Phone, AlertCircle, Loader2, X, Image as ImageIcon, Clock, EyeOff, Sparkles, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

const adSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  price: z.number().min(0, 'Price must be positive'),
  category: z.enum(['Cow', 'Buffalo', 'Goat', 'Sheep', 'Camel', 'Others']),
  breed: z.string().min(2, 'Breed is required'),
  age: z.string().min(1, 'Age is required'),
  weight: z.string().min(1, 'Weight is required'),
  healthCondition: z.string().min(2, 'Health condition is required'),
  city: z.string().min(2, 'City is required'),
  area: z.string().min(2, 'Area is required'),
  phoneNumber: z.string().regex(/^(\+92|0)3[0-9]{9}$/, 'Invalid Pakistani phone number'),
  hidePhoneNumber: z.boolean(),
});

type AdFormData = z.infer<typeof adSchema>;

export default function PostAd() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [showPhotoPopup, setShowPhotoPopup] = useState(false);
  
  const [showTypeSelection, setShowTypeSelection] = useState(false);
  const [tempFormData, setTempFormData] = useState<AdFormData | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<AdFormData>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      category: 'Cow',
      phoneNumber: user?.phoneNumber || '',
      hidePhoneNumber: false,
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <button onClick={() => navigate('/')} className="bg-green-700 text-white px-8 py-3 rounded-full font-bold">Go to Homepage</button>
        </div>
      </div>
    );
  }

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      if (selectedFiles.length + newFiles.length > 5) return toast.error('Max 5 photos');
      setSelectedFiles(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
      setShowPhotoPopup(false);
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: AdFormData) => {
    if (selectedFiles.length === 0) return toast.error("Please add at least one photo");
    setTempFormData(data);
    setShowTypeSelection(true);
  };

  const handleFinalUpload = async (isFeatured: boolean) => {
    if (!tempFormData || !user) return;
    setShowTypeSelection(false);
    setLoading(true);

    try {
      // 30 Days Limit Check
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const q = query(collection(db, 'ads'), where('sellerUid', '==', user.uid), where('createdAt', '>=', thirtyDaysAgo.toISOString()));
      const snapshot = await getDocs(q);
      if (snapshot.size >= 7) {
        setLoading(false);
        return toast.error("You have reached the limit of 7 ads per month.");
      }

      // Cloudinary Upload
      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ml_folder2');
        const response = await fetch(`https://api.cloudinary.com/v1_1/dmrgu1ebl/image/upload`, { method: 'POST', body: formData });
        if (!response.ok) throw new Error("Cloudinary upload failed");
        const resData = await response.json();
        if (resData.secure_url) uploadedUrls.push(resData.secure_url);
      }

      const adPayload = {
        ...tempFormData,
        images: uploadedUrls,
        sellerUid: user.uid,
        sellerName: user.displayName || 'Seller',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      if (isFeatured) {
        // Redirection to checkout with state
        navigate('/checkout', { state: { adData: { ...adPayload, isFeatured: true } } });
      } else {
        // Direct Firestore upload for free ads
        await addDoc(collection(db, 'ads'), { ...adPayload, isFeatured: false });
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to post ad.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 pb-24 font-sans">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-green-700 px-8 py-8 text-white">
            <h1 className="text-3xl font-bold">{t('postAd')}</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center"><Camera className="w-5 h-5 mr-2 text-green-600" /> Animal Photos</h3>
              {previews.length < 5 && (
                <div onClick={() => setShowPhotoPopup(true)} className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-green-50 transition-all group">
                  <Camera className="w-8 h-8 text-green-600 mb-2" />
                  <p className="text-sm text-gray-600 font-bold">Add Photo (Max 5)</p>
                </div>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {previews.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden border">
                    <img src={url} alt="preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>

            {showPhotoPopup && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Upload Photo</h3>
                    <button type="button" onClick={() => setShowPhotoPopup(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-2xl border-2 border-green-100 cursor-pointer">
                      <Camera className="w-6 h-6 text-green-600 mb-2" /> <span className="text-xs font-bold text-green-900">Camera</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageAdd} />
                    </label>
                    <label className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-2xl border-2 border-blue-100 cursor-pointer">
                      <ImageIcon className="w-6 h-6 text-blue-600 mb-2" /> <span className="text-xs font-bold text-blue-900">Gallery</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Ad Title</label>
                <input {...register('title')} placeholder="e.g. Sahiwal Cow for Sale" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                <select {...register('category')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none">
                  {['Cow', 'Buffalo', 'Goat', 'Sheep', 'Camel', 'Others'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Price (PKR)</label>
                <input type="number" {...register('price', { valueAsNumber: true })} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea {...register('description')} rows={4} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none"></textarea>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input {...register('breed')} placeholder="Breed" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" />
              <input {...register('age')} placeholder="Age" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" />
              <input {...register('weight')} placeholder="Weight" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" />
              <input {...register('healthCondition')} placeholder="Health" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <input {...register('city')} placeholder="City" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" />
              <input {...register('area')} placeholder="Area" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" />
              <input {...register('phoneNumber')} placeholder="Phone Number (0300...)" className="sm:col-span-2 w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" />
              
              <div className="sm:col-span-2 flex items-center justify-between p-4 bg-green-50/50 rounded-2xl border border-green-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg"><EyeOff className="w-5 h-5 text-green-700" /></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-700">Hide Phone Number</span>
                    <span className="text-xs text-gray-500 italic">Buyers will see "Hidden by Seller"</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register('hidePhoneNumber')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-green-700 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center space-x-3 shadow-xl">
              {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <span>Post Advertisement</span>}
            </button>
          </form>
        </div>
      </div>

      {showTypeSelection && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <h3 className="text-2xl font-black text-gray-900 text-center mb-8">Choose Post Type</h3>
            <div className="space-y-4">
              <button onClick={() => handleFinalUpload(true)} className="w-full p-6 border-2 border-orange-500 bg-orange-50 rounded-3xl flex items-center justify-between hover:scale-[1.02] transition-transform text-left">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Sparkles className="w-5 h-5 text-orange-600" />
                    <span className="font-black text-orange-700 text-lg">Featured Post</span>
                  </div>
                  <p className="text-xs text-orange-600 font-medium">Sell 10x faster with top visibility for 7 days</p>
                </div>
                <div className="bg-orange-600 text-white px-3 py-1 rounded-full text-[10px] font-bold">POPULAR</div>
              </button>

              <button onClick={() => handleFinalUpload(false)} className="w-full p-6 border-2 border-gray-100 bg-gray-50 rounded-3xl flex items-center justify-between hover:scale-[1.02] transition-transform text-left">
                <div>
                  <span className="block font-black text-gray-700 text-lg">Free Post</span>
                  <p className="text-xs text-gray-500 font-medium">Standard listing in regular results</p>
                </div>
              </button>
            </div>
            <button onClick={() => setShowTypeSelection(false)} className="w-full mt-6 text-gray-400 text-sm font-bold">Cancel</button>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-orange-600 animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Ad Under Review</h3>
            <p className="text-gray-600 mb-4 font-medium text-sm">Your ad is being reviewed by the admin. Please wait for approval.</p>
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl mb-8 flex items-start space-x-3 text-left">
              <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
              <p className="text-[11px] text-red-800 font-bold leading-tight">
                Warning: Your ad will be rejected if it contains violence, sexual content, or inappropriate images.
              </p>
            </div>
            <button onClick={() => navigate('/profile')} className="w-full bg-green-700 text-white py-4 rounded-2xl font-bold">Go to My Profile</button>
          </div>
        </div>
      )}
    </div>
  );
}