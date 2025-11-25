import React, { useState } from "react";
import GameCard from "./components/GameCard.jsx";
import "./styles.css";

// Game registry - add new games here
const GAMES = [
  {
    id: "ping-pong",
    title: "First-Person Ping Pong",
    description: "Control your paddle and keep the rally going in this immersive 3D ping pong experience.",
    thumbnail: "/thumbnails/ping-pong.svg",
    path: "/games/ping-pong/",
    category: "Sports",
    tags: ["3D", "Multiplayer Ready"],
    color: "#3b82f6",
  },
  {
    id: "coming-soon-1",
    title: "Space Invaders",
    description: "Classic arcade action reimagined with modern graphics.",
    thumbnail: null,
    path: null,
    category: "Arcade",
    tags: ["Coming Soon"],
    color: "#8b5cf6",
    comingSoon: true,
  },
  {
    id: "coming-soon-2",
    title: "Puzzle Quest",
    description: "Brain-teasing puzzles that will challenge your logic.",
    thumbnail: null,
    path: null,
    category: "Puzzle",
    tags: ["Coming Soon"],
    color: "#10b981",
    comingSoon: true,
  },
  {
    id: "coming-soon-3",
    title: "Racing Fury",
    description: "High-speed racing with stunning visuals.",
    thumbnail: null,
    path: null,
    category: "Racing",
    tags: ["Coming Soon"],
    color: "#f59e0b",
    comingSoon: true,
  },
];

const CATEGORIES = ["All", ...new Set(GAMES.map(g => g.category))];

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGames = GAMES.filter(game => {
    const matchesCategory = selectedCategory === "All" || game.category === selectedCategory;
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="site-root">
      <header className="site-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🎮</span>
            <span className="logo-text">Arcade</span>
          </div>
          <nav className="nav-links">
            <a href="#games" className="nav-link active">Games</a>
            <a href="#about" className="nav-link">About</a>
          </nav>
        </div>
      </header>

      <main className="site-main">
        <section className="hero">
          <div className="hero-content">
            <h1 className="hero-title">
              Play Amazing
              <span className="hero-highlight"> Browser Games</span>
            </h1>
            <p className="hero-subtitle">
              Dive into our collection of immersive games. No downloads, no installs — just pure fun.
            </p>
          </div>
          <div className="hero-glow"></div>
        </section>

        <section id="games" className="games-section">
          <div className="games-header">
            <div className="search-bar">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="category-filters">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`category-btn ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="games-grid">
            {filteredGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>

          {filteredGames.length === 0 && (
            <div className="no-results">
              <p>No games found matching your criteria.</p>
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <p>Built with ❤️ for gamers everywhere</p>
      </footer>
    </div>
  );
}

