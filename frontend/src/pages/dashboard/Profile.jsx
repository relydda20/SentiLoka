import { useState } from "react";
import { MapPin, Smile, Frown, Meh, Lock, Edit3, Settings, Search, Filter, Star } from "lucide-react";
import maxwellAvatar from "../../assets/maxwell.png";
import fullStar from "../../assets/full-star.png";
import emptyStar from "../../assets/not-full-star.png";
import { motion, AnimatePresence } from "framer-motion";
import { dropdownMotion, hoverScaleTap} from "../../utils/motionConfig";

const Profile = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [filterSentiment, setFilterSentiment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [name, setName] = useState("Maxwell");
  const [bio, setBio] = useState(
    "Hey, I'm Maxwell! I run a cozy pet store where every furry, feathery, and scaly friend is welcome. I started the shop out of my love for animals and a passion for helping people care for their pets. When I'm not at the store, you'll probably find me playing fetch with my dog, Luna, or trying to stop my cat from knocking things off the counter (again)."
  );

  const [tempName, setTempName] = useState(name);
  const [tempBio, setTempBio] = useState(bio);

  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const handleSaveProfile = () => {
    setName(tempName);
    setBio(tempBio);
    setIsEditing(false);
    alert("Profile updated successfully!");
  };

  const handleChangePassword = () => {
    if (newPass !== confirmPass) {
      alert("New password and confirmation do not match!");
      return;
    }
    alert("Password updated successfully (not connected to backend yet)");
    setShowPasswordModal(false);
    setOldPass("");
    setNewPass("");
    setConfirmPass("");
  };

  const [stores] = useState([
    { id: 1, name: "Maxwell Urban Pet House", address: "Jl. Mampang Prapatan Raya", sentiment: "Good", sentimentIcon: <Smile className="inline text-emerald-500" size={18} />, reviews: 4, reviewCount: 67 },
    { id: 2, name: "Maxwell Pet House Tebet", address: "Jl. Tebet Barat Dalam", sentiment: "Bad", sentimentIcon: <Frown className="inline text-red-500" size={18} />, reviews: 2, reviewCount: 45 },
    { id: 3, name: "Maxwell Pet House Bintaro", address: "Jl. Bintaro Utama Sektor 9", sentiment: "Neutral", sentimentIcon: <Meh className="inline text-yellow-500" size={18} />, reviews: 3, reviewCount: 44 },
    { id: 4, name: "Maxwell Pet House Senopati", address: "Jl. Senopati Raya No. 12", sentiment: "Good", sentimentIcon: <Smile className="inline text-emerald-500" size={18} />, reviews: 4, reviewCount: 52 },
    { id: 5, name: "Maxwell Pet House Kemang", address: "Jl. Kemang Raya No. 8", sentiment: "Neutral", sentimentIcon: <Meh className="inline text-yellow-500" size={18} />, reviews: 3, reviewCount: 38 },
    { id: 6, name: "Maxwell Pet House Pondok Indah", address: "Jl. Metro Pondok Indah", sentiment: "Good", sentimentIcon: <Smile className="inline text-emerald-500" size={18} />, reviews: 5, reviewCount: 78 },
  ]);

  // Filter & Search Logic
  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) || store.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSentiment = filterSentiment === 'all' || store.sentiment.toLowerCase() === filterSentiment;
    return matchesSearch && matchesSentiment;
  });

  const sentimentCounts = {
    all: stores.length,
    good: stores.filter(s => s.sentiment === 'Good').length,
    neutral: stores.filter(s => s.sentiment === 'Neutral').length,
    bad: stores.filter(s => s.sentiment === 'Bad').length
  };

  // Calculate stats
  const totalLocations = stores.length;
  const totalReviews = stores.reduce((sum, store) => sum + store.reviewCount, 0);
  const avgRating = (stores.reduce((sum, store) => sum + store.reviews, 0) / stores.length).toFixed(1);

  const getSentimentBadge = (sentiment) => {
    switch(sentiment) {
      case 'Good':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', emoji: '😊' };
      case 'Neutral':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '😐' };
      case 'Bad':
        return { bg: 'bg-red-100', text: 'text-red-700', emoji: '😢' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', emoji: '😶' };
    }
  };

  return (
    <div className="bg-linear-to-b from-gray-50 to-white min-h-screen">
      <div className="mx-auto mt-30 px-4 md:px-8 pb-12 w-full max-w-[1440px]">
        
        {/* Profile Card */}
        <motion.div 
          className="bg-white shadow-lg mb-8 p-6 md:p-8 border border-gray-100 rounded-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex md:flex-row flex-col items-start gap-6">
            {/* Avatar & Basic Info */}
            <div className="flex flex-1 items-start gap-4 w-full">
              <motion.img
                src={maxwellAvatar}
                alt="Maxwell Avatar"
                className="rounded-2xl ring-[#E8E5D5] ring-4 w-16 md:w-20 h-16 md:h-20 object-cover shrink-0"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              />
              
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <motion.div className="w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <input
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="bg-gray-50 mb-3 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-[#2F4B4E] focus:ring-2 w-full md:w-2/3 font-semibold text-gray-900 text-base"
                      placeholder="Your name..."
                    />
                    <textarea
                      value={tempBio}
                      onChange={(e) => setTempBio(e.target.value)}
                      rows={5}
                      className="bg-gray-50 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-[#2F4B4E] focus:ring-2 w-full text-gray-700 text-sm resize-none"
                      placeholder="Write something about yourself..."
                    />
                    <div className="flex flex-wrap gap-2 mt-4">
                      <motion.button
                        onClick={handleSaveProfile}
                        className="bg-[#5F7F7A] hover:bg-[#2F4B4E] shadow-md px-5 py-2 rounded-xl font-semibold text-white"
                        {...hoverScaleTap}
                      >
                        Save Changes
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setIsEditing(false);
                          setTempName(name);
                          setTempBio(bio);
                        }}
                        className="hover:bg-gray-50 px-5 py-2 border border-gray-300 rounded-xl text-gray-700"
                        {...hoverScaleTap}
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    <h2 className="mb-1 font-bold text-gray-900 text-2xl md:text-3xl">{name}</h2>
                    <p className="max-w-3xl text-gray-700 text-sm leading-relaxed">
                      {showFullBio ? bio : `${bio.substring(0, 150)}...`}
                      <button 
                        onClick={() => setShowFullBio(!showFullBio)}
                        className="ml-1 font-medium text-[#2F4B4E] hover:underline"
                      >
                        {showFullBio ? 'Show less' : 'Read more'}
                      </button>
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
                  <span className="font-bold text-gray-900 text-2xl">{totalLocations}</span>
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
                  <span className="font-bold text-gray-900 text-2xl">{totalReviews}</span>
                </div>
                <p className="text-gray-600 text-sm">Reviews</p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Store Locations Section */}
        <motion.div 
          className="bg-white shadow-lg p-6 md:p-8 border border-gray-100 rounded-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Header */}
          <div className="mb-6">
            <h3 className="mb-2 font-bold text-gray-900 text-2xl md:text-3xl">Store Locations</h3>
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
                className="py-2.5 pr-4 pl-10 border border-gray-200 focus:border-[#2F4B4E] rounded-xl outline-none focus:ring-[#2F4B4E]/20 focus:ring-2 w-full transition-all"
              />
            </div>

            {/* Filter Buttons */}
            <div className="relative">
              <div className="flex gap-2 pb-2 sm:pb-0 overflow-x-auto scrollbar-hide">
                {/* Filter buttons here */}
                <motion.button
                onClick={() => setFilterSentiment('all')}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap ${
                  filterSentiment === 'all'
                    ? 'bg-[#2F4B4E] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                >
                  All ({sentimentCounts.all})
                </motion.button>
                <motion.button
                  onClick={() => setFilterSentiment('good')}
                  className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap ${
                    filterSentiment === 'good'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  😊 Good ({sentimentCounts.good})
                </motion.button>
                <motion.button
                  onClick={() => setFilterSentiment('neutral')}
                  className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap ${
                    filterSentiment === 'neutral'
                      ? 'bg-yellow-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  😐 Neutral ({sentimentCounts.neutral})
                </motion.button>
                <motion.button
                  onClick={() => setFilterSentiment('bad')}
                  className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap ${
                    filterSentiment === 'bad'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  😢 Bad ({sentimentCounts.bad})
                </motion.button>
              </div>
            </div>
          </div>

          {/* Location Cards Grid */}
          <div className="gap-4 md:gap-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStores.map((store, index) => {
              const badge = getSentimentBadge(store.sentiment);
              return (
                <motion.div
                  key={store.id}
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
                      <p className="text-gray-600 text-sm line-clamp-1">{store.address}</p>
                    </div>
                  </div>

                  {/* Sentiment Badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${badge.bg} ${badge.text} text-sm font-medium mb-3`}>
                    <span>{badge.emoji}</span>
                    <span>{store.sentiment}</span>
                  </div>

                  {/* Rating & Reviews */}
                  <div className="flex justify-between items-center pt-3 border-gray-100 border-t">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <img
                          key={i}
                          src={i < store.reviews ? fullStar : emptyStar}
                          alt="star"
                          className="w-4 h-4"
                        />
                      ))}
                      <span className="ml-2 font-semibold text-gray-900 text-sm">
                        {store.reviews}.0
                      </span>
                    </div>
                    <span className="text-gray-600 text-sm">
                      {store.reviewCount} reviews
                    </span>
                  </div>

                  {/* Action Button */}
                  <motion.button 
                    className="bg-gray-50 hover:bg-[#E8E5D5] group-hover:bg-[#2F4B4E] mt-4 px-4 py-2.5 rounded-xl w-full font-medium text-gray-900 group-hover:text-white duration-200"
                    {...hoverScaleTap}
                  >
                    View Details
                  </motion.button>
                </motion.div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredStores.length === 0 && (
            <div className="py-12 text-center">
              <MapPin className="mx-auto mb-4 w-16 h-16 text-gray-300" />
              <p className="font-medium text-gray-600">No locations found</p>
              <p className="mt-1 text-gray-500 text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Password Modal - Modern Style */}
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

              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="Old password"
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  className="p-3 border border-gray-200 focus:border-[#5F7F7A] rounded-xl outline-none focus:ring-[#5F7F7A] focus:ring-2 w-full"
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="p-3 border border-gray-200 focus:border-[#5F7F7A] rounded-xl outline-none focus:ring-[#5F7F7A] focus:ring-2 w-full"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="p-3 border border-gray-200 focus:border-[#5F7F7A] rounded-xl outline-none focus:ring-[#5F7F7A] focus:ring-2 w-full"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button 
                  onClick={() => setShowPasswordModal(false)} 
                  className="flex-1 hover:bg-gray-50 px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700"
                  {...hoverScaleTap}
                >
                  Cancel
                </motion.button>
                <motion.button 
                  onClick={handleChangePassword} 
                  className="flex-1 bg-[#5F7F7A] hover:bg-[#4a6660] shadow-md px-4 py-2.5 rounded-xl font-medium text-white"
                  {...hoverScaleTap}
                >
                  Update Password
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;