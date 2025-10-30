import { useState } from "react";
import { MapPin, Smile, Frown, Meh, ChevronDown } from "lucide-react";
import maxwellAvatar from "../../assets/maxwell.png";
import fullStar from "../../assets/full-star.png";
import emptyStar from "../../assets/not-full-star.png";
import { motion, AnimatePresence } from "framer-motion";
import { dropdownMotion, hoverScaleTap, hoverScaleTapShadow } from "../../utils/motionConfig";

const Profile = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [stores] = useState([
    {
      id: 1,
      name: "Maxwell Urban Pet House",
      address: "Jl. Mampang Prapatan Raya",
      sentiment: "Good",
      sentimentIcon: <Smile className="inline text-green-400" size={18} />,
      reviews: 4,
    },
    {
      id: 2,
      name: "Maxwell Pet House Tebet",
      address: "Jl. Tebet Barat Dalam",
      sentiment: "Bad",
      sentimentIcon: <Frown className="inline text-red-400" size={18} />,
      reviews: 2,
    },
    {
      id: 3,
      name: "Maxwell Pet House Bintaro",
      address: "Jl. Bintaro Utama Sektor 9",
      sentiment: "Neutral",
      sentimentIcon: <Meh className="inline text-[#ECE8D9]" size={18} />,
      reviews: 3,
    },
  ]);

  return (
    <div className="mx-auto mt-28 w-full max-w-[1440px]">
      <div className="flex flex-col mx-auto px-4 md:px-8 pb-8 w-full">
        {/* Profile Section */}
        <div className="flex justify-center items-center">
          <div className="flex md:flex-row flex-col justify-between items-center bg-linear-to-r from-[#2F4B4E] to-[#407176] shadow-2xl p-6 rounded-lg w-[95%] text-white">
            <div className="flex items-center space-x-6">
              <img
                src={maxwellAvatar}
                alt="Maxwell Avatar"
                className="border-[#ECE8D9] border-4 rounded-full w-24 h-24 object-cover"
              />

              <div>
                <h2 className="font-bold text-3xl">Maxwell</h2>
                <p className="mt-2 max-w-3xl text-gray-200 text-sm leading-relaxed">
                  Hey, I'm Maxwell! I run a cozy pet store where every furry,
                  feathery, and scaly friend is welcome. I started the shop out
                  of my love for animals and a passion for helping people care
                  for their pets. When I'm not at the store, you'll probably
                  find me playing fetch with my dog, Luna, or trying to stop my
                  cat from knocking things off the counter (again).
                </p>
              </div>
            </div>

            {/* Dropdown Menu */}
            <div className="relative mt-6 md:mt-0">
              <motion.button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-[#ECE8D9] hover:bg-[#c9c1b3] px-4 py-2 rounded-full font-semibold text-[#2F4B4E]"
                {...hoverScaleTapShadow}
              >
                Manage Account <ChevronDown size={18} />
              </motion.button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div className="right-0 z-10 absolute bg-white shadow-lg mt-2 rounded-lg w-48 overflow-hidden text-[#2F4B4E]"
                    {...dropdownMotion}
                  >
                    <motion.button
                      onClick={() => alert("Update Bio clicked")}
                      className="block hover:bg-[#ECE8D9] px-4 py-2 w-full text-left"
                      {...hoverScaleTap}
                    >
                      Update Bio
                    </motion.button>
                    <motion.button
                      onClick={() => alert("Change Password clicked")}
                      className="block hover:bg-[#ECE8D9] px-4 py-2 w-full text-left"
                      {...hoverScaleTap}
                    >
                      Change Password
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Store Locations */}
        <div className="mt-10">
          <h3 className="mb-6 font-bold text-3xl">Store Locations</h3>

          <div className="space-y-4">
            {stores.map((store) => (
              <div
                key={store.id}
                className="before:absolute relative before:inset-0 flex md:flex-row flex-col justify-between items-start bg-[#2F4B4E] hover:bg-[#355c60] before:opacity-0 hover:before:opacity-100 shadow-md hover:shadow-2xl p-5 before:border before:border-[#ECE8D9]/80 rounded-xl before:rounded-xl text-white before:content-[''] transition-all before:transition-opacity hover:-translate-y-1 duration-300 before:duration-300 cursor-pointer transform"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex justify-center items-center bg-[#ECE8D9] p-3 rounded-full">
                    <MapPin className="text-[#2F4B4E]" size={28} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-xl">{store.name}</h4>
                    <p className="mb-2 text-gray-300 text-sm">
                      {store.address}
                    </p>
                    <p className="text-sm">
                      Sentiment: {store.sentimentIcon}{" "}
                      <span className="ml-1">{store.sentiment}</span>
                    </p>
                    <p className="flex items-center mt-1 text-sm">
                      Reviews:
                      <span className="flex ml-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <img
                            key={i}
                            src={i < store.reviews ? fullStar : emptyStar}
                            alt={i < store.reviews ? "Full Star" : "Empty Star"}
                            className="mr-1 w-5 h-5"
                          />
                        ))}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
