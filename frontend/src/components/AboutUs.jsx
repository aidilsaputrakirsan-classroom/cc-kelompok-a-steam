import React from 'react';

const AboutUs = () => {
  const features = [
    {
      title: "AI Image Generator",
      description: "Transform text into images automatically with state-of-the-art AI technology. Unleash your visual creativity with just a few words.",
      icon: "",
      color: "from-orange-500/20 to-transparent"
    },
    {
      title: "AI Summarizer",
      description: "Convert long texts into clear and concise summaries in seconds. Save time and understand complex information faster.",
      icon: "",
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
    { label: "Students", icon: "" },
    { label: "Content Creators", icon: "" },
    { label: "General Users", icon: "" },
  ];

  const techStack = [
    {
      category: "Backend",
      icon: "",
      color: "from-green-500/20 to-transparent",
      border: "hover:border-green-400/40",
      items: ["FastAPI (Python)", "PostgreSQL", "SQLAlchemy ORM", "JWT Auth"],
    },
    {
      category: "Frontend",
      icon: "",
      color: "from-blue-500/20 to-transparent",
      border: "hover:border-blue-400/40",
      items: ["React + Vite", "Tailwind CSS v4", "Vitest (Testing)", "react-markdown"],
    },
    {
      category: "Container & Infra",
      icon: "",
      color: "from-cyan-500/20 to-transparent",
      border: "hover:border-cyan-400/40",
      items: ["Docker", "Docker Compose", "Nginx (reverse proxy)", "PostgreSQL Volume"],
    },
    {
      category: "CI/CD",
      icon: "",
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
    <div className="w-full flex flex-col gap-10 text-white pb-20 px-2 animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="relative overflow-hidden p-12 md:p-16 rounded-[40px] bg-gradient-to-br from-[#ff8f481a] to-[#19274cb8] border border-white/10 shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <span className="inline-block px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold tracking-widest uppercase mb-6">
            IntiRupa AI Platform
          </span>
          <h1 className="text-5xl md:text-7xl font-black leading-none tracking-tight text-white mb-8">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-200">IntiRupa</span>
          </h1>
          <p className="text-gray-300 text-xl leading-relaxed font-medium max-w-2xl">
            IntiRupa is an Artificial Intelligence (AI)-based web application designed to help users create visual content and understand information more efficiently.
          </p>
        </div>
        {/* Decorative Blur */}
        <div className="absolute -right-10 -top-10 w-96 h-96 bg-orange-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      </section>

      {/* Introduction */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-[#1a1f35]/60 p-10 rounded-[32px] border border-white/5 shadow-xl">
        <div>
          <h2 className="text-3xl font-bold text-white mb-6">Empowering Creativity &amp; Productivity</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
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
        <h2 className="text-2xl font-bold text-white uppercase tracking-widest mb-8 border-l-4 border-orange-500 pl-4">Core Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-10 rounded-[32px] bg-[#1a1f35]/80 border border-white/10 hover:border-orange-400/40 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center text-5xl mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl">
                  {feature.icon}
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-400 text-lg leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech-stack">
        <h2 className="text-2xl font-bold text-white uppercase tracking-widest mb-8 border-l-4 border-orange-500 pl-4">Tech Stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {techStack.map((stack, index) => (
            <div
              key={index}
              className={`group p-8 rounded-[28px] bg-[#1a1f35]/80 border border-white/10 ${stack.border} transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)] relative overflow-hidden`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stack.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{stack.icon}</span>
                  <h3 className="text-lg font-bold text-white">{stack.category}</h3>
                </div>
                <ul className="space-y-2">
                  {stack.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-400 text-sm">
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
        <div className="p-10 rounded-[32px] bg-gradient-to-br from-[#1a1f35] to-[#0f172a] border border-white/5 shadow-xl">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-4xl"></span>
            <h2 className="text-3xl font-bold text-white">Vision</h2>
          </div>
          <p className="text-gray-300 text-xl leading-relaxed">
            To become an innovative and reliable AI platform that supports creativity and efficiency across various fields.
          </p>
        </div>

        <div className="p-10 rounded-[32px] bg-gradient-to-br from-[#1a1f35] to-[#0f172a] border border-white/5 shadow-xl">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-4xl"></span>
            <h2 className="text-3xl font-bold text-white">Mission</h2>
          </div>
          <ul className="space-y-5">
            {missions.map((mission, index) => (
              <li key={index} className="flex items-center gap-4 text-gray-300">
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
        <h2 className="text-2xl font-bold text-white uppercase tracking-widest mb-12">Who Is It For?</h2>
        <div className="flex flex-wrap justify-center gap-8">
          {targetUsers.map((user, index) => (
            <div
              key={index}
              className="px-10 py-6 rounded-3xl bg-[#1a1f35]/40 border border-white/10 flex flex-col items-center gap-4 hover:bg-orange-500/10 hover:border-orange-500/30 transition-all duration-500 w-full sm:w-64 shadow-lg group"
            >
              <span className="text-5xl group-hover:scale-125 transition-transform duration-500">{user.icon}</span>
              <span className="text-xl font-bold text-white">{user.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section id="our-team" className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#ff8f4826] to-[#19274cdb] border border-white/10 shadow-2xl">
        <div className="relative z-10 p-12 md:p-16">
          <div className="flex items-center gap-4 mb-10">
            <span className="text-4xl"></span>
            <h2 className="text-4xl font-black text-white">Our Team</h2>
          </div>
          <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mb-10 font-medium">
            Developed by students as part of the Cloud Computing course (Komputasi Awan) at Institut Teknologi Kalimantan. We are committed to delivering cutting-edge technology accessible to all.
          </p>

          {/* Team Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/10">
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
                    className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 text-gray-500 font-mono">{index + 1}</td>
                    <td className="px-6 py-4 font-semibold text-white">{member.name}</td>
                    <td className="px-6 py-4 text-gray-400 font-mono">{member.nim}</td>
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
