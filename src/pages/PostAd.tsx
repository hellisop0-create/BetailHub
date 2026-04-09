import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Camera, MapPin, Phone, AlertCircle, Loader2, X, Image as ImageIcon, Clock, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

// 1. Updated Schema with hidePhoneNumber
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
  hidePhoneNumber: z.boolean().default(false), // New Field
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

  const { register, handleSubmit, formState: { errors } } = useForm<AdFormData>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      category: 'Cow',
      phoneNumber: user?.phoneNumber || '',
      hidePhoneNumber: false, // Default value
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-gray-600 mb-8">You must be logged in to post an advertisement.</p>
          <button onClick={() => navigate('/')} className="bg-green-700 text-white px-8 py-3 rounded-full font-bold">
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      if (selectedFiles.length + newFiles.length > 5) {
        toast.error('Maximum 5 images allowed');
        return;
      }
      setSelectedFiles(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file as File));
      setPreviews(prev => [...prev, ...newPreviews]);
      setShowPhotoPopup(false);
      toast.success(`${newFiles.length} photo(s) selected`);
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: AdFormData) => {
    if (selectedFiles.length === 0) return toast.error("Please add at least one photo");
    
    setLoading(true);
    try {
      // Monthly Limit Check (Max 7 ads in 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const q = query(
        collection(db, 'ads'),
        where('sellerUid', '==', user.uid),
        where('createdAt', '>=', thirtyDaysAgo.toISOString())
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.size >= 7) {
        toast.error("You have reached the limit of 7 ads per month.");
        setLoading(false);
        return;
      }

      const uploadedUrls: string[] = [];

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ml_folder2');

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/dmrgu1ebl/image/upload`,
          { method: 'POST', body: formData }
        );

        if (!response.ok) throw new Error("Cloudinary upload failed");

        const resData = await response.json();
        if (resData.secure_url) {
          uploadedUrls.push(resData.secure_url);
        }
      }

      if (uploadedUrls.length === 0) throw new Error("No images were uploaded.");

      try {
        await addDoc(collection(db, 'ads'), {
          ...data,
          images: uploadedUrls,
          sellerUid: user?.uid,
          sellerName: user?.displayName || 'Seller',
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'ads');
      }

      setShowSuccessModal(true); 

    } catch (error: any) {
      console.error("Final Error:", error);
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
            <p className="text-green-100 opacity-80 mt-1">Fill in the details to list your animal for sale.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-green-600" />
                Animal Photos
              </h3>
              
              {previews.length < 5 && (
                <div 
                  onClick={() => setShowPhotoPopup(true)}
                  className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-green-50 transition-all group"
                >
                  <div className="p-4 bg-green-100 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <Camera className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600 font-bold">Add Photo</p>
                  <p className="text-xs text-gray-400 mt-1">Camera or Gallery (Max 5)</p>
                </div>
              )}
              
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {previews.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    <img src={url} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {showPhotoPopup && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white w-full max-w-sm rounded-t-[2.5rem] sm:rounded-3xl p-8 shadow-2xl">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-gray-900">Upload Photo</h3>
                    <button type="button" onClick={() => setShowPhotoPopup(false)} className="p-2 bg-gray-100 rounded-full">
                      <X className="w-5 h-5 text-gray-500"/>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <label className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-2xl border-2 border-green-100 cursor-pointer active:scale-95 transition-all">
                      <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                        <Camera className="w-7 h-7 text-white" />
                      </div>
                      <span className="font-bold text-green-900 text-center text-sm">Take Picture</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageAdd} />
                    </label>

                    <label className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-2xl border-2 border-blue-100 cursor-pointer active:scale-95 transition-all">
                      <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                        <ImageIcon className="w-7 h-7 text-white" />
                      </div>
                      <span className="font-bold text-blue-900 text-sm">Gallery</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
                    </label>
                  </div>
                </div>
              </div>
            )}

            <hr className="border-gray-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Ad Title</label>
                <input {...register('title')} placeholder="e.g. Sahiwal Cow for Sale" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                <select {...register('category')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none">
                  {['Cow', 'Buffalo', 'Goat', 'Sheep', 'Camel', 'Others'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Price (PKR)</label>
                <input type="number" {...register('price', { valueAsNumber: true })} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea {...register('description')} rows={4} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none"></textarea>
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <input {...register('breed')} placeholder="Breed" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" />
              <input {...register('age')} placeholder="Age" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" />
              <input {...register('weight')} placeholder="Weight" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" />
              <input {...register('healthCondition')} placeholder="Health" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <input {...register('city')} placeholder="City" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" />
              <input {...register('area')} placeholder="Area" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" />
              
              <div className="sm:col-span-2 relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input {...register('phoneNumber')} placeholder="Phone Number (0300...)" className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" />
                {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}
              </div>

              {/* HIDE PHONE NUMBER TOGGLE */}
              <div className="sm:col-span-2 flex items-center justify-between p-4 bg-green-50/50 rounded-2xl border border-green-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <EyeOff className="w-5 h-5 text-green-700" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-700">Hide Phone Number</span>
                    <span className="text-xs text-gray-500 font-medium italic text-wrap">Buyers will only see "Hidden by Seller"</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    {...register('hidePhoneNumber')} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center space-x-3 shadow-xl disabled:opacity-70 active:scale-[0.98] transition-all"
            >
              {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <span>Post Advertisement</span>}
            </button>
          </form>
        </div>
      </div>

      {/* SUCCESS REVIEW MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-orange-600 animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Ad Under Review</h3>
            <p className="text-gray-600 mb-8">Your ad is being reviewed by the admin. Please wait for approval.</p>
            <button onClick={() => navigate('/profile')} className="w-full bg-green-700 text-white py-4 rounded-2xl font-bold">
              Go to My Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}