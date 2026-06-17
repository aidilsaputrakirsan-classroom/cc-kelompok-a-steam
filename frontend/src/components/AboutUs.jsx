import React from 'react';

const AboutUs = ({ isDark }) => {
  const features = [
    {
      title: "AI Image Generators",
      description: "Transform text into images automatically with state-of-the-art AI technology. Unleash your visual creativity with just a few words.",
      color: "from-orange-500/20 to-transparent"
    },
    {
      title: "AI Summarizer",
      description: "Convert long texts into clear and concise summaries in seconds. Save time and understand complex information faster.",
      color: "from-blue-500/20 to-transparent"
    },
  ];

  const missions = [
    "Provide AI technology that is easy to use",
    "Improve user productivity",
    "Deliver fast and accurate solutions",
    "Continuously improve features",
  ];

  const targetUsers = [
    { label: "Students" },
    { label: "Content Creators" },
    { label: "General Users" },
  ];

  const techStack = [
    {
      category: "Backend",
      color: "from-green-500/20 to-transparent",
      border: "hover:border-green-400/40",
      items: ["FastAPI (Python)", "PostgreSQL", "SQLAlchemy ORM", "JWT Auth"],
    },
    {
      category: "Frontend",
      color: "from-blue-500/20 to-transparent",
      border: "hover:border-blue-400/40",
      items: ["React + Vite", "Tailwind CSS v4", "Vitest (Testing)", "react-markdown"],
    },
    {
      category: "Container & Infra",
      color: "from-cyan-500/20 to-transparent",
      border: "hover:border-cyan-400/40",
      items: ["Docker", "Docker Compose", "Nginx (reverse proxy)", "PostgreSQL Volume"],
    },
    {
      category: "CI/CD",
      color: "from-orange-500/20 to-transparent",
      border: "hover:border-orange-400/40",
      items: ["GitHub Actions", "GitHub Flow", "Branch Protection", "Squash & Merge"],
    },
  ];

  const teamMembers = [
    { name: "Irfan Zaki Riyanto", nim: "10231045", role: "Lead Backend" },
    { name: "Incha Raghil", nim: "10231043", role: "Lead Frontend" },
    { name: "Jonathan Cristopher Jetro", nim: "10231047", role: "Lead DevOps" },
    { name: "Jonathan Joseph Yudita Tampubolon", nim: "10231048", role: "Lead QA & Docs" },
  ];

  return (
    <div className={`w-full flex flex-col gap-10 pb-20 px-2 animate-in fade-in duration-700 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      {/* Hero Section */}
      <section className={`relative overflow-hidden p-12 md:p-16 rounded-[40px] ${isDark ? 'bg-gradient-to-br from-[#ff8f481a] to-[#19274cb8] border-white/10' : 'bg-gradient-to-br from-orange-100/50 to-orange-50/80 border-orange-200'} border shadow-2xl`}>
        <div className="relative z-10 max-w-3xl">
          <span className="inline-block px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold tracking-widest uppercase mb-6">
            IntiRupa AI Platform
          </span>
          <h1 className={`text-5xl md:text-7xl font-black leading-none tracking-tight mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">IntiRupa</span>
          </h1>
          <p className={`text-xl leading-relaxed font-medium max-w-2xl ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            IntiRupa is an Artificial Intelligence (AI)-based web application designed to help users create visual content and understand information more efficiently.
          </p>
        </div>
        {/* Decorative Blur */}
        <div className="absolute -right-10 -top-10 w-96 h-96 bg-orange-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      </section>

      {/* Introduction */}
      <section className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-center ${isDark ? 'bg-[#1a1f35]/60 border-white/5' : 'bg-white/60 border-orange-200'} p-10 rounded-[32px] border shadow-xl`}>
        <div>
          <h2 className={`text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Empowering Creativity &amp; Productivity</h2>
          <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
            By combining AI Image Generator and AI Summarizer technologies, IntiRupa provides a practical solution to enhance both creativity and productivity in a single platform. We believe that AI should be accessible and helpful for everyone.
          </p>
        </div>
        <div className="flex justify-center md:justify-end">
          <div className="relative group">
            <div className="absolute inset-0 bg-orange-400/20 blur-[40px] rounded-full group-hover:bg-orange-400/30 transition-all duration-500"></div>
            <span className="relative text-9xl"></span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className={`text-2xl font-bold uppercase tracking-widest mb-8 border-l-4 border-orange-500 pl-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Core Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group p-10 rounded-[32px] ${isDark ? 'bg-[#1a1f35]/80 border-white/10 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]' : 'bg-white/80 border-orange-200 hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)]'} border hover:border-orange-400/40 transition-all duration-500 relative overflow-hidden`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
              <div className="relative z-10">
                <h3 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
                <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech-stack">
        <h2 className={`text-2xl font-bold uppercase tracking-widest mb-8 border-l-4 border-orange-500 pl-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Tech Stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {techStack.map((stack, index) => (
            <div
              key={index}
              className={`group p-8 rounded-[28px] ${isDark ? 'bg-[#1a1f35]/80 border-white/10 hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)]' : 'bg-white/80 border-orange-200 hover:shadow-[0_20px_60px_rgba(0,0,0,0.1)]'} border ${stack.border} transition-all duration-500 relative overflow-hidden`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stack.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5">
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stack.category}</h3>
                </div>
                <ul className="space-y-2">
                  {stack.items.map((item, i) => (
                    <li key={i} className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Vision & Mission */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`p-10 rounded-[32px] ${isDark ? 'bg-gradient-to-br from-[#1a1f35] to-[#0f172a] border-white/5' : 'bg-gradient-to-br from-white to-orange-50 border-orange-200'} border shadow-xl`}>
          <div className="flex items-center gap-4 mb-8">
            <span className="text-4xl"></span>
            <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Vision</h2>
          </div>
          <p className={`text-xl leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            To become an innovative and reliable AI platform that supports creativity and efficiency across various fields.
          </p>
        </div>

        <div className={`p-10 rounded-[32px] ${isDark ? 'bg-[#1a1f35]/60 border-white/5' : 'bg-white/60 border-orange-200'} border shadow-xl`}>
          <div className="flex items-center gap-4 mb-8">
            <span className="text-4xl"></span>
            <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Mission</h2>
          </div>
          <ul className="space-y-5">
            {missions.map((mission, index) => (
              <li key={index} className={`flex items-center gap-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold shrink-0">
                  ✓
                </div>
                <span className="text-lg">{mission}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Target Users */}
      <section className="text-center">
        <h2 className={`text-2xl font-bold uppercase tracking-widest mb-12 ${isDark ? 'text-white' : 'text-gray-900'}`}>Who Is It For?</h2>
        <div className="flex flex-wrap justify-center gap-8">
          {targetUsers.map((user, index) => (
            <div
              key={index}
              className={`px-10 py-6 rounded-3xl ${isDark ? 'bg-[#1a1f35]/40 border-white/10' : 'bg-white/40 border-orange-200'} border flex flex-col items-center gap-4 hover:bg-orange-500/10 hover:border-orange-500/30 transition-all duration-500 w-full sm:w-64 shadow-lg group`}
            >
              <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section id="our-team" className={`relative overflow-hidden rounded-[40px] ${isDark ? 'bg-gradient-to-br from-[#ff8f4826] to-[#19274cdb] border-white/10' : 'bg-gradient-to-br from-orange-100 to-orange-50 border-orange-200'} border shadow-2xl`}>
        <div className="relative z-10 p-12 md:p-16">
          <div className="flex items-center gap-4 mb-10">
            <span className="text-4xl"></span>
            <h2 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Our Team</h2>
          </div>
          <p className={`text-lg leading-relaxed max-w-2xl mb-10 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Developed by students as part of the Cloud Computing course (Komputasi Awan) at Institut Teknologi Kalimantan. We are committed to delivering cutting-edge technology accessible to all.
          </p>

          {/* Team Table */}
          <div className={`overflow-x-auto rounded-2xl border ${isDark ? 'border-white/10' : 'border-orange-200 bg-white/40'}`}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-orange-500/10 border-b border-white/10">
                  <th className="px-6 py-4 font-bold text-orange-300 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 font-bold text-orange-300 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-4 font-bold text-orange-300 uppercase tracking-wider">NIM</th>
                  <th className="px-6 py-4 font-bold text-orange-300 uppercase tracking-wider">Peran</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member, index) => (
                  <tr
                    key={index}
                    className={`border-b ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-orange-200/50 hover:bg-white/50'} transition-colors duration-200`}
                  >
                    <td className={`px-6 py-4 font-mono ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{index + 1}</td>
                    <td className={`px-6 py-4 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{member.name}</td>
                    <td className={`px-6 py-4 font-mono ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{member.nim}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-orange-500/15 border border-orange-500/25 text-orange-300">
                        {member.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-10 flex justify-center items-center gap-6">
            <div className="h-[1px] w-12 bg-white/20"></div>
            <div className="flex gap-4 text-orange-400 font-bold tracking-widest text-sm uppercase">
              <span>Innovation</span>
              <span>•</span>
              <span>Creativity</span>
              <span>•</span>
              <span>Efficiency</span>
            </div>
            <div className="h-[1px] w-12 bg-white/20"></div>
          </div>
        </div>
        {/* Glow Effects */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-orange-400/5 blur-[100px] rounded-full pointer-events-none"></div>
      </section>
    </div>
  );
};

export default AboutUs;
