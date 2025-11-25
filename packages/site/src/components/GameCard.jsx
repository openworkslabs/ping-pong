import React from "react";

export default function GameCard({ game }) {
  const handleClick = () => {
    if (game.path && !game.comingSoon) {
      window.location.href = game.path;
    }
  };

  return (
    <article
      className={`game-card ${game.comingSoon ? "coming-soon" : ""}`}
      onClick={handleClick}
      style={{ "--card-accent": game.color }}
    >
      <div className="card-thumbnail">
        {game.thumbnail ? (
          <img src={game.thumbnail} alt={game.title} />
        ) : (
          <div className="placeholder-thumb">
            <span className="placeholder-icon">🎮</span>
          </div>
        )}
        {game.comingSoon && (
          <div className="coming-soon-badge">Coming Soon</div>
        )}
      </div>
      <div className="card-content">
        <span className="card-category">{game.category}</span>
        <h3 className="card-title">{game.title}</h3>
        <p className="card-description">{game.description}</p>
        <div className="card-tags">
          {game.tags.filter(t => t !== "Coming Soon").map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
        {!game.comingSoon && (
          <button className="play-btn">
            <svg viewBox="0 0 24 24" fill="currentColor" className="play-icon">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Play Now
          </button>
        )}
      </div>
    </article>
  );
}

