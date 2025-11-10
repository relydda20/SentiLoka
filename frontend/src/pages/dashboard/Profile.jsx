import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Lock, Edit3, Settings, Search, Star, Trash2 } from "lucide-react";
import fullStar from "../../assets/full-star.png";
import emptyStar from "../../assets/not-full-star.png";
import { motion, AnimatePresence } from "framer-motion";
import { dropdownMotion, hoverScaleTap } from "../../utils/motionConfig";
import {
  fetchUserProfile,
  updateUserProfile,
  changePassword,
  fetchUserStores,
} from "../../services/profileService";
import { deleteLocation } from "../../services/locationService";

// Redux Imports
import { useDispatch } from 'react-redux';
import { updateUserProfile as updateReduxProfile } from '../../store/auth/authSlice';

const Profile = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [filterSentiment, setFilterSentiment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch user profile
  const {
    data: userProfile,
    isLoading: loadingProfile,
    error: profileError,
  } = useQuery({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
  });

  // Redirect to correct slug URL if slug doesn't match
  useEffect(() => {
    if (userProfile?.slug && slug !== userProfile.slug) {
      navigate(`/dashboard/profile/${userProfile.slug}`, { replace: true });
    }
  }, [userProfile, slug, navigate]);

  // Fetch user stores
  const {
    data: stores = [],
    isLoading: loadingStores,
    error: storesError,
  } = useQuery({
    queryKey: ["userStores"],
    queryFn: fetchUserStores,
  });

  // React Hook Form for profile edit
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // React Hook Form for password change
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    watch,
    formState: { errors: passwordErrors },
  } = useForm({
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (data) => {
      // Update Redux state so the header updates immediately
      dispatch(updateReduxProfile(data));

      // Invalidate queries to refetch profile data
      queryClient.invalidateQueries(["userProfile"]);

      // If slug changed, navigate to new URL
      if (data.slug && data.slug !== slug) {
        navigate(`/dashboard/profile/${data.slug}`, { replace: true });
      }

      setIsEditing(false);
      alert("Profile updated successfully!");
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setShowPasswordModal(false);
      resetPassword();
      alert("Password changed successfully!");
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  // Delete location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      // Invalidate both queries to refetch data
      queryClient.invalidateQueries(["userStores"]);
      queryClient.invalidateQueries(["userProfile"]);
      alert("Location removed from your tracking list!");
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  // Reset form when user profile is loaded
  useEffect(() => {
    if (userProfile) {
      resetProfile({
        name: userProfile.name,
        description: userProfile.description || "",
      });
    }
  }, [userProfile, resetProfile]);

  // Handle profile update
  const onSubmitProfile = (data) => {
    updateProfileMutation.mutate(data);
  };

  // Handle password change
  const onSubmitPassword = (data) => {
    changePasswordMutation.mutate({
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    });
  };

  // Watch new password for validation
  const newPassword = watch("newPassword");

  // Retry individual sections
  const retrySection = (queryKey) => {
    queryClient.invalidateQueries([queryKey]);
  };

  // Navigate to Sentiment Map with selected location
  const handleViewDetails = (store) => {
    // Navigate to sentiment map and store the location ID in session storage
    // so the map can open it automatically
    sessionStorage.setItem('selectedLocationId', store._id || store.id);
    navigate('/dashboard/sentiment-map');
  };

  // Handle delete location
  const handleDeleteLocation = (store) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${store.name}" from your tracking list?\n\nThis will not delete the location data, only remove it from your account.`
    );

    if (confirmed) {
      deleteLocationMutation.mutate(store._id || store.id);
    }
  };

  // Filter & Search Logic
  const filteredStores = stores.filter((store) => {
    const matchesSearch =
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSentiment =
      filterSentiment === "all" ||
      store.sentiment.toLowerCase() === filterSentiment;
    return matchesSearch && matchesSentiment;
  });

  const sentimentCounts = {
    all: stores.length,
    positive: stores.filter((s) => s.sentiment === "Positive").length,
    neutral: stores.filter((s) => s.sentiment === "Neutral").length,
    bad: stores.filter((s) => s.sentiment === "Bad").length,
    noData: stores.filter((s) => s.sentiment === "No Data").length,
  };

  // Calculate stats from stores, filtering out locations without sentiment data for avgRating
  const totalLocations = userProfile?.stats?.totalLocations ?? stores.length;
  const totalReviews = userProfile?.stats?.totalReviews ?? stores.reduce((sum, store) => sum + (store.totalReviews || 0), 0);

  // Calculate average rating ONLY from locations with sentiment data (exclude "No Data")
  const locationsWithSentiment = stores.filter((store) => store.sentiment !== "No Data");
  const avgRating = locationsWithSentiment.length > 0
    ? (locationsWithSentiment.reduce((sum, store) => sum + (store.averageRating || 0), 0) / locationsWithSentiment.length).toFixed(1)
    : "0.0";

  const getSentimentBadge = (sentiment) => {
    switch (sentiment) {
      case "Positive":
        return { bg: "bg-emerald-100", text: "text-emerald-700" };
      case "Neutral":
        return { bg: "bg-yellow-100", text: "text-yellow-700" };
      case "Bad":
        return { bg: "bg-red-100", text: "text-red-700" };
      case "No Data":
        return { bg: "bg-gray-100", text: "text-gray-700" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-700" };
    }
  };

  // --- Skeleton Components ---
  const ProfileCardSkeleton = () => (
    <div className="bg-white shadow-lg mb-8 p-6 md:p-8 border border-gray-100 rounded-3xl animate-pulse">
      <div className="flex md:flex-row flex-col items-start gap-6">
        <div className="flex flex-1 items-start gap-4 w-full">
          {/* Avatar skeleton */}
          <div className="bg-gray-200 rounded-2xl w-16 md:w-20 h-16 md:h-20 shrink-0"></div>
          
          <div className="flex-1 space-y-3 min-w-0">
            {/* Name skeleton */}
            <div className="bg-gray-200 rounded w-40 h-8"></div>
            {/* Bio skeleton */}
            <div className="space-y-2">
              <div className="bg-gray-200 rounded w-full h-4"></div>
              <div className="bg-gray-200 rounded w-3/4 h-4"></div>
              <div className="bg-gray-200 rounded w-1/2 h-4"></div>
            </div>
          </div>
        </div>

        {/* Action buttons skeleton */}
        <div className="flex gap-2">
          <div className="bg-gray-200 rounded-xl w-10 h-10"></div>
          <div className="bg-gray-200 rounded-xl w-10 h-10"></div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="gap-4 grid grid-cols-3 mt-6 pt-6 border-gray-100 border-t">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
              <div className="bg-gray-200 rounded w-16 h-8"></div>
            </div>
            <div className="bg-gray-200 mx-auto rounded w-20 h-4"></div>
          </div>
        ))}
      </div>
    </div>
  );

  const StoreCardSkeleton = () => (
    <div className="bg-white shadow-sm p-5 border border-gray-200 rounded-2xl animate-pulse">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-gray-200 rounded-xl w-12 h-12 shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="bg-gray-200 rounded w-3/4 h-5"></div>
          <div className="bg-gray-200 rounded w-1/2 h-4"></div>
        </div>
      </div>

      {/* Sentiment badge skeleton */}
      <div className="bg-gray-200 mb-3 rounded-full w-24 h-7"></div>

      {/* Rating skeleton */}
      <div className="flex justify-between items-center pt-3 border-gray-100 border-t">
        <div className="flex items-center gap-1">
          <div className="bg-gray-200 rounded w-24 h-4"></div>
        </div>
        <div className="bg-gray-200 rounded w-20 h-4"></div>
      </div>

      {/* Button skeleton */}
      <div className="bg-gray-200 mt-4 rounded-xl w-full h-10"></div>
    </div>
  );

  const LoadingSkeleton = ({ height = "300px" }) => (
    <div
      className="bg-gray-100 rounded-xl animate-pulse"
      style={{ height }}
    ></div>
  );

  // --- Error Component ---
  const ErrorDisplay = ({ message, onRetry }) => (
    <div className="flex flex-col justify-center items-center gap-3 bg-red-50 p-6 border border-red-200 rounded-xl h-full min-h-[200px]">
      <div className="text-red-600 text-center">
        <p className="font-semibold">Error loading data</p>
        <p className="text-sm">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white text-sm transition-colors"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="bg-linear-to-b from-gray-50 to-white min-h-screen">
      <div className="mx-auto mt-30 px-4 md:px-8 pb-12 w-full max-w-[1440px]">
        {/* Profile Card */}
        {loadingProfile ? (
          <ProfileCardSkeleton />
        ) : profileError ? (
          <div className="mb-8">
            <ErrorDisplay
              message={profileError.message}
              onRetry={() => retrySection("userProfile")}
            />
          </div>
        ) : (
          <motion.div
            className="bg-white shadow-lg mb-8 p-6 md:p-8 border border-gray-100 rounded-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex md:flex-row flex-col items-start gap-6">
              {/* Avatar & Basic Info */}
              <div className="flex flex-1 items-start gap-4 w-full">
                <motion.div
                  className="flex justify-center items-center bg-[#D9D9D9] rounded-full ring-[#E8E5D5] ring-4 w-16 md:w-20 h-16 md:h-20 shrink-0"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="font-semibold text-[#2F4B4E] text-2xl md:text-3xl">
                    {userProfile?.name ? userProfile.name[0].toUpperCase() : 'U'}
                  </span>
                </motion.div>

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <motion.form
                      onSubmit={handleSubmitProfile(onSubmitProfile)}
                      className="w-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="mb-3">
                        <input
                          {...registerProfile("name", {
                            required: "Name is required",
                            minLength: {
                              value: 2,
                              message: "Name must be at least 2 characters",
                            },
                          })}
                          className="bg-gray-50 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-[#2F4B4E] focus:ring-2 w-full md:w-2/3 font-semibold text-gray-900 text-base"
                          placeholder="Your name..."
                        />
                        {profileErrors.name && (
                          <p className="mt-1 text-red-500 text-xs">
                            {profileErrors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="mb-3">
                        <textarea
                          {...registerProfile("description", {
                            maxLength: {
                              value: 1000,
                              message: "Description must be less than 1000 characters",
                            },
                          })}
                          rows={5}
                          className="bg-gray-50 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-[#2F4B4E] focus:ring-2 w-full text-gray-700 text-sm resize-none"
                          placeholder="Write something about yourself..."
                        />
                        {profileErrors.description && (
                          <p className="mt-1 text-red-500 text-xs">
                            {profileErrors.description.message}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <motion.button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                          className="bg-[#5F7F7A] hover:bg-[#2F4B4E] disabled:bg-gray-400 shadow-md px-5 py-2 rounded-xl font-semibold text-white disabled:cursor-not-allowed"
                          {...hoverScaleTap}
                        >
                          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            resetProfile();
                          }}
                          className="hover:bg-gray-50 px-5 py-2 border border-gray-300 rounded-xl text-gray-700"
                          {...hoverScaleTap}
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </motion.form>
                  ) : (
                    <>
                      <h2 className="mb-1 font-bold text-gray-900 text-2xl md:text-3xl">
                        {userProfile?.name}
                      </h2>
                      <p className="max-w-3xl text-gray-700 text-sm leading-relaxed">
                        {userProfile?.description ? (
                          <>
                            {showFullBio
                              ? userProfile.description
                              : `${userProfile.description.substring(0, 150)}${userProfile.description.length > 150 ? '...' : ''}`}
                            {userProfile.description.length > 150 && (
                              <button
                                onClick={() => setShowFullBio(!showFullBio)}
                                className="ml-1 font-medium text-[#2F4B4E] hover:underline"
                              >
                                {showFullBio ? "Show less" : "Read more"}
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-500 italic">No description added yet.</span>
                        )}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {!isEditing && (
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => setIsEditing(true)}
                    className="hover:bg-gray-100 p-2.5 rounded-xl transition-colors"
                    title="Edit Profile"
                    {...hoverScaleTap}
                  >
                    <Edit3 className="w-5 h-5 text-gray-600" />
                  </motion.button>
                  <div className="relative">
                    <motion.button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="hover:bg-gray-100 p-2.5 rounded-xl transition-colors"
                      title="Settings"
                      {...hoverScaleTap}
                    >
                      <Settings className="w-5 h-5 text-gray-600" />
                    </motion.button>

                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div
                          className="right-0 z-10 absolute bg-white shadow-xl mt-2 border border-gray-100 rounded-xl w-48 overflow-hidden"
                          {...dropdownMotion}
                        >
                          <motion.button
                            onClick={() => {
                              setShowPasswordModal(true);
                              setDropdownOpen(false);
                            }}
                            className="flex items-center gap-2 hover:bg-gray-50 px-4 py-3 w-full text-gray-700 text-left"
                            {...hoverScaleTap}
                          >
                            <Lock size={16} />
                            Change Password
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Cards */}
            {!isEditing && (
              <motion.div
                className="gap-4 grid grid-cols-3 mt-6 pt-6 border-gray-100 border-t"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="text-center">
                  <div className="flex justify-center items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-[#2F4B4E]" />
                    <span className="font-bold text-gray-900 text-2xl">
                      {totalLocations}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">Locations</p>
                </div>

                <div className="border-gray-100 border-x text-center">
                  <div className="flex justify-center items-center gap-2 mb-1">
                    <Star className="fill-yellow-500 w-4 h-4 text-yellow-500" />
                    <span className="font-bold text-gray-900 text-2xl">{avgRating}</span>
                  </div>
                  <p className="text-gray-600 text-sm">Avg Rating</p>
                </div>

                <div className="text-center">
                  <div className="flex justify-center items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 text-2xl">
                      {totalReviews}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">Reviews</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Store Locations Section */}
        <motion.div
          className="bg-white shadow-lg p-6 md:p-8 border border-gray-100 rounded-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-6">
            <h3 className="mb-2 font-bold text-gray-900 text-2xl md:text-3xl">
              Store Locations
            </h3>
            <p className="text-gray-600">Manage and monitor all your business locations</p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex sm:flex-row flex-col justify-between gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="top-1/2 left-3 absolute w-5 h-5 text-gray-400 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="py-2.5 pr-4 pl-10 border border-gray-200 focus:border-[#2F4B4E] rounded-xl outline-none focus:ring-[#2F4B4E]/20 focus:ring-2 w-full"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 pb-2 sm:pb-0 overflow-x-auto scrollbar-hide">
              <motion.button
                onClick={() => setFilterSentiment("all")}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap ${
                  filterSentiment === "all"
                    ? "bg-[#2F4B4E] text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({sentimentCounts.all})
              </motion.button>
              <motion.button
                onClick={() => setFilterSentiment("positive")}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap ${
                  filterSentiment === "positive"
                    ? "bg-emerald-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Positive ({sentimentCounts.positive})
              </motion.button>
              <motion.button
                onClick={() => setFilterSentiment("neutral")}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap ${
                  filterSentiment === "neutral"
                    ? "bg-yellow-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Neutral ({sentimentCounts.neutral})
              </motion.button>
              <motion.button
                onClick={() => setFilterSentiment("bad")}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap ${
                  filterSentiment === "bad"
                    ? "bg-red-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Bad ({sentimentCounts.bad})
              </motion.button>
              <motion.button
                onClick={() => setFilterSentiment("no data")}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap ${
                  filterSentiment === "no data"
                    ? "bg-gray-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                No Data ({sentimentCounts.noData})
              </motion.button>
            </div>
          </div>

          {/* Location Cards Grid */}
          {loadingStores ? (
            <div className="gap-4 md:gap-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <StoreCardSkeleton key={i} />
              ))}
            </div>
          ) : storesError ? (
            <ErrorDisplay
              message={storesError.message}
              onRetry={() => retrySection("userStores")}
            />
          ) : (
            <div className="gap-4 md:gap-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStores.map((store) => {
                const badge = getSentimentBadge(store.sentiment);
                return (
                  <motion.div
                    key={store._id || store.id}
                    className="group bg-white hover:shadow-xl p-5 border border-gray-200 rounded-2xl hover:-translate-y-1 duration-300 cursor-pointer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex justify-center items-center bg-gray-100 group-hover:bg-[#E8E5D5] rounded-xl w-12 h-12 transition-colors shrink-0">
                        <MapPin className="w-6 h-6 text-[#2F4B4E]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="mb-1 font-bold text-gray-900 group-hover:text-[#2F4B4E] line-clamp-1 transition-colors">
                          {store.name}
                        </h4>
                        <p className="text-gray-600 text-sm line-clamp-1">
                          {store.address}
                        </p>
                      </div>
                    </div>

                    {/* Sentiment Badge */}
                    <div
                      className={`inline-flex items-center px-3 py-1.5 rounded-full ${badge.bg} ${badge.text} text-sm font-medium mb-3`}
                    >
                      <span>{store.sentiment}</span>
                    </div>

                    {/* Rating & Reviews */}
                    <div className="flex justify-between items-center pt-3 border-gray-100 border-t">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <img
                            key={i}
                            src={i < Math.floor(store.averageRating || 0) ? fullStar : emptyStar}
                            alt="star"
                            className="w-4 h-4"
                          />
                        ))}
                        <span className="ml-2 font-semibold text-gray-900 text-sm">
                          {(store.averageRating || 0).toFixed(1)}
                        </span>
                      </div>
                      <span className="text-gray-600 text-sm">
                        {store.totalReviews || 0} reviews
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <motion.button
                        onClick={() => handleViewDetails(store)}
                        className="flex-1 bg-gray-50 hover:bg-[#E8E5D5] group-hover:bg-[#2F4B4E] px-4 py-2.5 rounded-xl font-medium text-gray-900 group-hover:text-white duration-200"
                        {...hoverScaleTap}
                      >
                        View Details
                      </motion.button>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLocation(store);
                        }}
                        disabled={deleteLocationMutation.isPending}
                        className="bg-red-50 hover:bg-red-100 disabled:opacity-50 p-2.5 rounded-xl text-red-600 hover:text-red-700 disabled:cursor-not-allowed transition-colors"
                        title="Remove location"
                        {...hoverScaleTap}
                      >
                        <Trash2 className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loadingStores && !storesError && filteredStores.length === 0 && (
            <div className="py-12 text-center">
              <MapPin className="mx-auto mb-4 w-16 h-16 text-gray-300" />
              <p className="font-medium text-gray-600">No locations found</p>
              <p className="mt-1 text-gray-500 text-sm">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            className="z-50 fixed inset-0 flex justify-center items-center bg-black/40 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              className="bg-white shadow-2xl p-6 md:p-8 rounded-3xl w-full max-w-md"
              initial={{ y: 60, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex justify-center items-center bg-[#E8E5D5] rounded-xl w-12 h-12">
                  <Lock className="w-6 h-6 text-[#5F7F7A]" />
                </div>
                <h2 className="font-bold text-gray-900 text-2xl">Change Password</h2>
              </div>

              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
                <div>
                  <input
                    type="password"
                    {...registerPassword("oldPassword", {
                      required: "Old password is required",
                    })}
                    placeholder="Old password"
                    className="p-3 border border-gray-200 focus:border-[#5F7F7A] rounded-xl outline-none focus:ring-[#5F7F7A] focus:ring-2 w-full"
                  />
                  {passwordErrors.oldPassword && (
                    <p className="mt-1 text-red-500 text-xs">
                      {passwordErrors.oldPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    type="password"
                    {...registerPassword("newPassword", {
                      required: "New password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    placeholder="New password"
                    className="p-3 border border-gray-200 focus:border-[#5F7F7A] rounded-xl outline-none focus:ring-[#5F7F7A] focus:ring-2 w-full"
                  />
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-red-500 text-xs">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    type="password"
                    {...registerPassword("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (value) =>
                        value === newPassword || "Passwords do not match",
                    })}
                    placeholder="Confirm new password"
                    className="p-3 border border-gray-200 focus:border-[#5F7F7A] rounded-xl outline-none focus:ring-[#5F7F7A] focus:ring-2 w-full"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-red-500 text-xs">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <motion.button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      resetPassword();
                    }}
                    className="flex-1 hover:bg-gray-50 px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700"
                    {...hoverScaleTap}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="flex-1 bg-[#5F7F7A] hover:bg-[#4a6660] disabled:bg-gray-400 shadow-md px-4 py-2.5 rounded-xl font-medium text-white disabled:cursor-not-allowed"
                    {...hoverScaleTap}
                  >
                    {changePasswordMutation.isPending
                      ? "Updating..."
                      : "Update Password"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;