import React, { useState } from "react";
import GameCard from "./components/GameCard.jsx";
import "./styles.css";

// Enhanced game registry with mock "author" data for the UI
const GAMES = [
  {
    id: "ping-pong",
    title: "First-Person Ping Pong",
    description: "Control your paddle and keep the rally going.",
    thumbnail: "/thumbnails/ping-pong.svg",
    path: "/games/ping-pong/",
    category: "Sports",
    tags: ["3D", "Multiplayer"],
    author: "Nicholas C.",
    badge: "PRO",
  },
];

const CATEGORIES = ["All", ...new Set(GAMES.map((g) => g.category))];

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGames = GAMES.filter((game) => {
    const matchesCategory = selectedCategory === "All" || game.category === selectedCategory;
    const matchesSearch =
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-primary font-sans">
      {/* Header */}
      <header className="sticky top-4 z-50 flex justify-center px-4">
        <div className="w-full max-w-[1000px] bg-white/90 backdrop-blur-md rounded-full border border-gray-200 shadow-sm px-6 py-3 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-bold text-xl text-primary no-underline shrink-0 flex-1">
            <span>Arcade</span>
          </div>

          <nav className="hidden md:flex gap-8 items-center justify-center flex-1">
            {["Inspiration", "Find Games", "Learn"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-secondary font-medium text-sm hover:text-primary transition-colors whitespace-nowrap"
              >
                {link}
              </a>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-3 shrink-0 flex-1">
            <a
              href="#"
              className="hidden sm:block px-4 py-2 rounded-full text-sm font-medium text-secondary hover:text-primary transition-colors"
            >
              Log in
            </a>
            <a
              href="#"
              className="px-5 py-2 rounded-full text-sm font-medium bg-primary text-white hover:bg-[#3d3d4e] transition-colors"
            >
              Sign up
            </a>
          </div>
        </div>
      </header>

      {/* Hero / Search Area */}
      <div className="w-full max-w-[1400px] mx-auto px-8 pt-10 pb-5 text-center">
        <h1 className="text-2xl font-medium mb-6 text-primary">What are you looking for?</h1>

        <div className="relative max-w-[600px] mx-auto mb-10">
          <div className="flex items-center bg-[#f3f3f4] border border-transparent rounded-lg px-4 py-2 transition-all focus-within:bg-white focus-within:border-[rgba(234,76,137,0.4)] focus-within:shadow-[0_0_0_4px_rgba(234,76,137,0.1)]">
            <svg
              className="w-5 h-5 text-secondary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none px-3 py-2 text-base text-primary outline-none placeholder-[#9e9ea7]"
            />
          </div>
        </div>

        <div className="flex justify-center flex-wrap gap-3 mt-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all
                ${
                  selectedCategory === cat
                    ? "bg-[#f3f3f4] text-primary"
                    : "bg-transparent text-secondary hover:text-primary"
                }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Games Grid */}
      <main className="w-full max-w-[1400px] mx-auto px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-9">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center py-10 text-[#999]">No results found.</div>
        )}
      </main>

      <footer className="mt-auto py-6 px-8 text-center text-secondary text-sm border-t border-border bg-[#fafafb]">
        <p>© 2024 Arcade Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
