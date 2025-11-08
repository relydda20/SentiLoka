import React, { useState } from "react";
import "../../styles/OurTeamSection.css";
import alifImage from "../../assets/profile/alif.png";
import otnielImage from "../../assets/profile/otniel.png";
import raphaelImage from "../../assets/profile/raphael.png";
import richlyImage from "../../assets/profile/richly.png";
import satriaImage from "../../assets/profile/satria.png";
import nadaImage from "../../assets/profile/nada.png";

const teamMembers = [
  { name: "Alif Fata Fadhlillah", role: "UI/UX Designer", image: alifImage },
  { name: "Otniel Abiezer", role: "Backend Developer", image: otnielImage },
  { name: "Raphael Reynaldi", role: "Backend Developer", image: raphaelImage },
  { name: "Richly Harald Januar", role: "Backend Developer", image: richlyImage },
  { name: "Nada Salsabila", role: "UI/UX Designer, Frontend Developer", image: nadaImage },
  { name: "Satria Ibnu Pamungkas", role: "Frontend Developer", image: satriaImage },
];

export default function OurTeamSection() {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const positions = [
    "top-[8%] left-[8%] rotate-[-8deg]",
    "top-[5%] right-[10%] rotate-[5deg]",
    "top-[40%] left-[5%] rotate-[-5deg]",
    "top-[42%] right-[6%] rotate-[4deg]",
    "bottom-[12%] left-[15%] rotate-[-6deg]",
    "bottom-[10%] right-[12%] rotate-[6deg]",
  ];

  return (
    <section className="relative h-screen w-full snap-start snap-always bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center overflow-hidden">
      {/* Enhanced Multi-Layer Wave Background - SEAMLESS */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {/* Wave Layer 1 - Fastest */}
        <div className="absolute flex animate-wave-loop" style={{ width: '300%' }}>
          {[...Array(4)].map((_, i) => (
            <svg
              key={i}
              viewBox="0 0 1200 200"
              fill="none"
              preserveAspectRatio="none"
              className="h-64 opacity-25 text-[#5F7F7A] flex-shrink-0"
              style={{ width: '100%' }}
            >
              <path
                d="M0,100 C150,50 300,150 450,100 C600,50 750,150 900,100 C1050,50 1200,150 1200,100"
                stroke="currentColor"
                strokeWidth="100"
                strokeLinecap="round"
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          ))}
        </div>

        {/* Wave Layer 2 - Medium Speed */}
        <div className="absolute flex animate-wave-loop-slow" style={{ width: '300%', animationDelay: '-2s' }}>
          {[...Array(4)].map((_, i) => (
            <svg
              key={i}
              viewBox="0 0 1200 200"
              fill="none"
              preserveAspectRatio="none"
              className="h-72 opacity-18 text-[#CED7B0] flex-shrink-0"
              style={{ width: '100%' }}
            >
              <path
                d="M0,120 C150,60 350,170 500,110 C650,60 850,170 1000,110 C1150,60 1200,120 1200,120"
                stroke="currentColor"
                strokeWidth="120"
                strokeLinecap="round"
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          ))}
        </div>

        {/* Wave Layer 3 - Slowest */}
        <div className="absolute flex animate-wave-loop-slower" style={{ width: '300%', animationDelay: '-4s' }}>
          {[...Array(4)].map((_, i) => (
            <svg
              key={i}
              viewBox="0 0 1200 200"
              fill="none"
              preserveAspectRatio="none"
              className="h-80 opacity-12 text-[#E8E5D5] flex-shrink-0"
              style={{ width: '100%' }}
            >
              <path
                d="M0,90 C150,40 350,160 500,95 C650,40 850,160 1000,95 C1150,40 1200,90 1200,90"
                stroke="currentColor"
                strokeWidth="140"
                strokeLinecap="round"
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          ))}
        </div>

        {/* Gradient Overlays for Depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#5F7F7A]/5 via-transparent to-[#CED7B0]/5 pointer-events-none animate-gradient" />
      </div>

      {/* Container */}
      <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="relative w-full h-full max-h-[85vh] flex items-center justify-center">
          
          {/* Center Content with Animated Background */}
          <div className="relative z-20 text-center max-w-2xl px-4 sm:px-6">
            {/* Decorative Elements Behind Text */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#5F7F7A]/10 rounded-full blur-3xl animate-pulse-ring"></div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#CED7B0]/20 rounded-full blur-2xl animate-pulse-ring" style={{ animationDelay: '1s' }}></div>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3 sm:mb-4 leading-tight relative">
              <span className="text-4xl sm:text-4xl font-medium text-[#1C1C1C] mb-4 tracking-tight">
                The Minds Behind <span className="text-4xl sm:text-4xl font-bold text-[#1C1C1C] mb-4 tracking-tight">SentiLoka</span>
                {/* Underline Decoration */}
                <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#5F7F7A] via-[#CED7B0] to-[#E8E5D5] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></span>
              </span>
            </h2>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg leading-relaxed">
              We believe great technology starts with great people !
            </p>
          </div>

          {/* Team Cards with Enhanced Effects */}
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className={`absolute hidden sm:block transition-all duration-500 ease-out ${positions[index]}`}
              style={{ 
                zIndex: hoveredIndex === index ? 50 : 10,
                animationDelay: `${index * 0.1}s`
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="relative group">
                {/* Glow Effect Ring */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[#5F7F7A] via-[#CED7B0] to-[#E8E5D5] rounded-2xl opacity-0 group-hover:opacity-75 blur-lg transition-all duration-500"></div>
                
                {/* Pulse Ring on Hover */}
                <div className="absolute -inset-2 bg-[#5F7F7A]/30 rounded-2xl opacity-0 group-hover:opacity-100 group-hover:animate-pulse-ring"></div>

                <img
                  src={member.image}
                  alt={member.name}
                  className="
                    relative
                    w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36
                    rounded-2xl object-cover shadow-lg
                    transition-all duration-500
                    group-hover:-translate-y-3
                    group-hover:scale-110
                    group-hover:shadow-2xl
                    group-hover:rotate-0
                    card-hover-effect
                    border-2 border-white
                  "
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/150x150/cccccc/000000?text=${member.name
                      .split(' ')[0]
                      .charAt(0)}`;
                  }}
                />

                {/* Enhanced Tooltip */}
                <div
                  className="
                    absolute left-1/2 -translate-x-1/2
                    -bottom-10 group-hover:-bottom-[3.5rem]
                    bg-gradient-to-r from-[#5F7F7A] to-[#4a6660]
                    text-white
                    px-4 py-2.5 rounded-xl shadow-2xl
                    transition-all duration-500
                    text-center min-w-[160px] max-w-[200px]
                    opacity-0 group-hover:opacity-100
                    pointer-events-none
                    border border-white/20
                    backdrop-blur-sm
                  "
                >
                  <h4 className="text-xs font-bold mb-1 leading-tight">
                    {member.name}
                  </h4>
                  <p className="text-[10px] opacity-90 leading-relaxed">
                    {member.role}
                  </p>
                  {/* Tooltip Arrow */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#5F7F7A] rotate-45"></div>
                </div>
              </div>
            </div>
          ))}

          {/* Enhanced Mobile View */}
          <div className="sm:hidden absolute bottom-8 left-0 right-0 px-4">
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              {teamMembers.slice(0, 6).map((member, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Glow Effect for Mobile */}
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#5F7F7A] to-[#CED7B0] rounded-xl opacity-0 group-active:opacity-50 blur transition-opacity duration-300"></div>
                    
                    <img
                      src={member.image}
                      alt={member.name}
                      className="relative w-20 h-20 rounded-xl object-cover shadow-lg mb-2 transition-all duration-300 group-active:scale-95 border-2 border-white"
                      onError={(e) => {
                        e.target.src = `https://via.placeholder.com/150x150/cccccc/000000?text=${member.name
                          .split(' ')[0]
                          .charAt(0)}`;
                      }}
                    />
                  </div>
                  
                  <div className="text-center">
                    <h4 className="text-[10px] font-bold text-gray-900 truncate w-full">
                      {member.name.split(' ')[0]}
                    </h4>
                    <p className="text-[9px] text-gray-600 truncate w-full">
                      {member.role.split(',')[0]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}