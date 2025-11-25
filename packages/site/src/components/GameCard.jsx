import React from "react";

// Mock random stats for the "design portfolio" look
const getRandomStats = () => ({
  likes: Math.floor(Math.random() * 300) + 20,
  views: Math.floor(Math.random() * 10) + 1 + "k",
});

export default function GameCard({ game }) {
  // Stable stats for demo purposes
  const stats = React.useMemo(() => getRandomStats(), []);

  const handleClick = () => {
    if (game.path && !game.comingSoon) {
      window.location.href = game.path;
    }
  };

  return (
    <div className="flex flex-col gap-3 cursor-pointer group" onClick={handleClick}>
      {/* Top part: Thumbnail */}
      <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-[#e0e0e0]">
        {game.thumbnail ? (
          <img
            src={game.thumbnail}
            alt={game.title}
            className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-90"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#f3f3f4] text-[#ccc] text-5xl">
            <span>🎮</span>
          </div>
        )}

        {/* Overlay with Title (appears on hover) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex items-end p-5">
          <span className="text-white font-semibold text-base drop-shadow-sm">{game.title}</span>
        </div>

        {game.comingSoon && (
          <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-[11px] font-semibold">
            COMING SOON
          </div>
        )}
      </div>

      {/* Bottom part: Author & Stats */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <img
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${game.title}`}
            alt=""
            className="w-6 h-6 rounded-full bg-[#eee] object-cover"
          />
          <span className="text-sm font-medium text-primary">{game.author || "Arcade Team"}</span>
          <span
            className={`text-[10px] font-bold text-white px-1 py-0.5 rounded uppercase ${game.badge === "PRO" ? "bg-accent" : "bg-primary"}`}
          >
            {game.badge || "TEAM"}
          </span>
        </div>

        <div className="flex gap-3 items-center">
          <div
            className="flex items-center gap-1 text-xs font-medium text-secondary hover:text-primary"
            title="Likes"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span>{stats.likes}</span>
          </div>
          <div
            className="flex items-center gap-1 text-xs font-medium text-secondary hover:text-primary"
            title="Views"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
            <span>{stats.views}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
