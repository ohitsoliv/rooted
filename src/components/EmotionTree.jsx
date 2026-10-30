// src/components/EmotionTree.jsx — Rooted Health Tracker
// Self-contained emotion decision tree with breadcrumbs + "close enough" exit
// Tree content based on the Feelings Wheel (7 core → 2nd tier → 3rd tier)

import { useState, useCallback } from "react";

/**
 * EmotionTree
 *
 * Props:
 *   onSelect — (emotion: string, path: string[]) => void
 *              Called when user picks a leaf OR hits "This is close enough"
 *   colorClass — "mauve" | "terra" | etc. (default: "mauve")
 */

// --- The full emotion tree ---
// Each node: { label, emoji, children? }
// Leaf nodes have no children — auto-confirm on tap.
const TREE = [
  {
    label: "Happy", emoji: "😊",
    children: [
      {
        label: "Playful", emoji: "😜",
        children: [
          { label: "Aroused", emoji: "🌶️" },
          { label: "Cheeky", emoji: "😏" },
        ],
      },
      {
        label: "Content", emoji: "☺️",
        children: [
          { label: "Free", emoji: "🕊️" },
          { label: "Joyful", emoji: "🥳" },
        ],
      },
      {
        label: "Interested", emoji: "👀",
        children: [
          { label: "Curious", emoji: "🤔" },
          { label: "Inquisitive", emoji: "🔍" },
        ],
      },
      {
        label: "Proud", emoji: "🏆",
        children: [
          { label: "Successful", emoji: "🥇" },
          { label: "Confident", emoji: "💪" },
        ],
      },
      {
        label: "Accepted", emoji: "🤗",
        children: [
          { label: "Respected", emoji: "🎖️" },
          { label: "Valued", emoji: "💎" },
        ],
      },
      {
        label: "Powerful", emoji: "⚡",
        children: [
          { label: "Courageous", emoji: "🦁" },
          { label: "Creative", emoji: "🎨" },
        ],
      },
      {
        label: "Peaceful", emoji: "😌",
        children: [
          { label: "Loving", emoji: "🥰" },
          { label: "Thankful", emoji: "🙏" },
        ],
      },
      {
        label: "Trusting", emoji: "🤝",
        children: [
          { label: "Sensitive", emoji: "🌸" },
          { label: "Intimate", emoji: "💞" },
        ],
      },
      {
        label: "Optimistic", emoji: "🌤️",
        children: [
          { label: "Hopeful", emoji: "🌱" },
          { label: "Inspired", emoji: "✨" },
        ],
      },
    ],
  },
  {
    label: "Surprised", emoji: "😲",
    children: [
      {
        label: "Startled", emoji: "🫨",
        children: [
          { label: "Shocked", emoji: "😵" },
          { label: "Dismayed", emoji: "😦" },
        ],
      },
      {
        label: "Confused", emoji: "😕",
        children: [
          { label: "Disillusioned", emoji: "💭" },
          { label: "Perplexed", emoji: "❓" },
        ],
      },
      {
        label: "Amazed", emoji: "🤩",
        children: [
          { label: "Astonished", emoji: "😮" },
          { label: "Awe", emoji: "🌌" },
        ],
      },
      {
        label: "Excited", emoji: "🎉",
        children: [
          { label: "Eager", emoji: "🙋" },
          { label: "Energetic", emoji: "🚀" },
        ],
      },
    ],
  },
  {
    label: "Bad", emoji: "😩",
    children: [
      {
        label: "Bored", emoji: "🥱",
        children: [
          { label: "Indifferent", emoji: "🤷" },
          { label: "Apathetic", emoji: "😑" },
        ],
      },
      {
        label: "Busy", emoji: "🏃",
        children: [
          { label: "Pressured", emoji: "🗜️" },
          { label: "Rushed", emoji: "⏱️" },
        ],
      },
      {
        label: "Stressed", emoji: "😫",
        children: [
          { label: "Overwhelmed", emoji: "🤯" },
          { label: "Out of control", emoji: "🌪️" },
        ],
      },
      {
        label: "Tired", emoji: "😴",
        children: [
          { label: "Sleepy", emoji: "💤" },
          { label: "Unfocused", emoji: "🌫️" },
        ],
      },
    ],
  },
  {
    label: "Fearful", emoji: "😨",
    children: [
      {
        label: "Scared", emoji: "😰",
        children: [
          { label: "Helpless", emoji: "🆘" },
          { label: "Frightened", emoji: "👻" },
        ],
      },
      {
        label: "Anxious", emoji: "😟",
        children: [
          { label: "Overwhelmed", emoji: "🌊" },
          { label: "Worried", emoji: "😥" },
        ],
      },
      {
        label: "Insecure", emoji: "😓",
        children: [
          { label: "Inadequate", emoji: "📉" },
          { label: "Inferior", emoji: "🐜" },
        ],
      },
      {
        label: "Weak", emoji: "🥀",
        children: [
          { label: "Worthless", emoji: "🕳️" },
          { label: "Insignificant", emoji: "🫥" },
        ],
      },
      {
        label: "Rejected", emoji: "🚫",
        children: [
          { label: "Excluded", emoji: "🚪" },
          { label: "Persecuted", emoji: "🎯" },
        ],
      },
      {
        label: "Threatened", emoji: "⚠️",
        children: [
          { label: "Nervous", emoji: "😬" },
          { label: "Exposed", emoji: "🫣" },
        ],
      },
    ],
  },
  {
    label: "Angry", emoji: "😠",
    children: [
      {
        label: "Let down", emoji: "😔",
        children: [
          { label: "Betrayed", emoji: "🗡️" },
          { label: "Resentful", emoji: "😒" },
        ],
      },
      {
        label: "Humiliated", emoji: "😖",
        children: [
          { label: "Disrespected", emoji: "👎" },
          { label: "Ridiculed", emoji: "🤡" },
        ],
      },
      {
        label: "Bitter", emoji: "🍋",
        children: [
          { label: "Indignant", emoji: "☝️" },
          { label: "Violated", emoji: "💢" },
        ],
      },
      {
        label: "Mad", emoji: "😡",
        children: [
          { label: "Furious", emoji: "🤬" },
          { label: "Jealous", emoji: "💚" },
        ],
      },
      {
        label: "Aggressive", emoji: "👊",
        children: [
          { label: "Provoked", emoji: "🐝" },
          { label: "Hostile", emoji: "⚔️" },
        ],
      },
      {
        label: "Frustrated", emoji: "😤",
        children: [
          { label: "Infuriated", emoji: "🌋" },
          { label: "Annoyed", emoji: "🙄" },
        ],
      },
      {
        label: "Distant", emoji: "🧊",
        children: [
          { label: "Withdrawn", emoji: "🐢" },
          { label: "Numb", emoji: "😶" },
        ],
      },
      {
        label: "Critical", emoji: "🧐",
        children: [
          { label: "Skeptical", emoji: "🤨" },
          { label: "Dismissive", emoji: "💁" },
        ],
      },
    ],
  },
  {
    label: "Disgusted", emoji: "🤢",
    children: [
      {
        label: "Disapproving", emoji: "🙅",
        children: [
          { label: "Judgmental", emoji: "⚖️" },
          { label: "Embarrassed", emoji: "😳" },
        ],
      },
      {
        label: "Disappointed", emoji: "😞",
        children: [
          { label: "Appalled", emoji: "😧" },
          { label: "Revolted", emoji: "🤮" },
        ],
      },
      {
        label: "Awful", emoji: "😣",
        children: [
          { label: "Nauseated", emoji: "🥴" },
          { label: "Detestable", emoji: "👿" },
        ],
      },
      {
        label: "Repelled", emoji: "🚷",
        children: [
          { label: "Horrified", emoji: "😱" },
          { label: "Hesitant", emoji: "🫤" },
        ],
      },
    ],
  },
  {
    label: "Sad", emoji: "😢",
    children: [
      {
        label: "Hurt", emoji: "🤕",
        children: [
          { label: "Embarrassed", emoji: "😳" },
          { label: "Disappointed", emoji: "😞" },
        ],
      },
      {
        label: "Depressed", emoji: "😔",
        children: [
          { label: "Inferior", emoji: "🐜" },
          { label: "Empty", emoji: "🫥" },
        ],
      },
      {
        label: "Guilty", emoji: "🙇",
        children: [
          { label: "Remorseful", emoji: "😞" },
          { label: "Ashamed", emoji: "🙈" },
        ],
      },
      {
        label: "Despair", emoji: "😩",
        children: [
          { label: "Powerless", emoji: "🪫" },
          { label: "Grief", emoji: "💔" },
        ],
      },
      {
        label: "Vulnerable", emoji: "🫣",
        children: [
          { label: "Fragile", emoji: "🥚" },
          { label: "Victimized", emoji: "🎯" },
        ],
      },
      {
        label: "Lonely", emoji: "🥺",
        children: [
          { label: "Abandoned", emoji: "🏚️" },
          { label: "Isolated", emoji: "🏝️" },
        ],
      },
    ],
  },
];

const playTap = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.setValueAtTime(520, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.06);
    g.gain.setValueAtTime(0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    o.start();
    o.stop(ctx.currentTime + 0.16);
  } catch {
    return;
  }
};

/** Walk the tree along a path of labels to find the current node's children */
function getNodesAtPath(path) {
  let nodes = TREE;
  for (const label of path) {
    const found = nodes.find((n) => n.label === label);
    if (!found || !found.children) return null;
    nodes = found.children;
  }
  return nodes;
}

export default function EmotionTree({ onSelect, colorClass = "mauve" }) {
  // path = array of labels chosen so far, e.g. ["Fearful", "Anxious"]
  const [path, setPath] = useState([]);

  const currentNodes = path.length === 0 ? TREE : getNodesAtPath(path);

  const handlePick = useCallback(
    (node) => {
      playTap();
      const newPath = [...path, node.label];

      // Leaf node (no children) — auto-confirm
      if (!node.children) {
        onSelect?.(node.label, newPath);
        return;
      }

      // Branch node — go deeper
      setPath(newPath);
    },
    [path, onSelect]
  );

  const handleCloseEnough = useCallback(() => {
    playTap();
    if (path.length === 0) return;
    const current = path[path.length - 1];
    onSelect?.(current, path);
  }, [path, onSelect]);

  const handleBack = useCallback(() => {
    playTap();
    setPath((prev) => prev.slice(0, -1));
  }, []);

  const handleBreadcrumb = useCallback(
    (index) => {
      playTap();
      setPath((prev) => prev.slice(0, index));
    },
    []
  );

  const color = `var(--${colorClass}, var(--mauve))`;

  return (
    <div className="emotion-tree">
      {/* Breadcrumb trail */}
      {path.length > 0 && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          marginBottom: "12px",
          flexWrap: "wrap",
        }}>
          <button
            onClick={() => handleBreadcrumb(0)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
              fontSize: "13px",
              color: "var(--brown-light, #9A7E7E)",
              padding: "2px 4px",
              borderRadius: "6px",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => e.target.style.background = "var(--tan-light, #EDE3CF)"}
            onMouseLeave={(e) => e.target.style.background = "none"}
          >
            Start
          </button>
          {path.map((label, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ color: "var(--brown-light, #9A7E7E)", fontSize: "12px" }}>›</span>
              <button
                onClick={() => handleBreadcrumb(i + 1)}
                style={{
                  background: i === path.length - 1
                    ? `color-mix(in srgb, ${color} 12%, transparent)`
                    : "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: "13px",
                  fontWeight: i === path.length - 1 ? 700 : 500,
                  color: i === path.length - 1 ? color : "var(--brown-light, #9A7E7E)",
                  padding: "2px 8px",
                  borderRadius: "8px",
                  transition: "background 0.15s",
                }}
              >
                {label}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Prompt text */}
      <p style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: "14px",
        color: "var(--brown-light, #9A7E7E)",
        margin: "0 0 10px 0",
        textAlign: "center",
      }}>
        {path.length === 0
          ? "How are you feeling?"
          : "Can you get more specific?"}
      </p>

      {/* Option buttons */}
      {currentNodes && (
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(currentNodes.length, 4)}, 1fr)`,
          gap: "10px",
          marginBottom: "12px",
        }}>
          {currentNodes.map((node) => (
            <button
              key={node.label}
              onClick={() => handlePick(node)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                padding: "14px 8px",
                border: "2px solid var(--tan-light, #EDE3CF)",
                borderRadius: "14px",
                background: "var(--white, #FFFDF8)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                WebkitTapHighlightColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = color;
                e.currentTarget.style.transform = "scale(1.04)";
                e.currentTarget.style.boxShadow = `0 2px 8px color-mix(in srgb, ${color} 20%, transparent)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--tan-light, #EDE3CF)";
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span style={{ fontSize: "28px", lineHeight: 1 }}>{node.emoji}</span>
              <span style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--brown, #3B2F2F)",
                textAlign: "center",
                lineHeight: 1.2,
              }}>
                {node.label}
              </span>
              {node.children && (
                <span style={{
                  fontSize: "9px",
                  color: "var(--brown-light, #9A7E7E)",
                  fontFamily: "'Nunito', sans-serif",
                }}>
                  tap to explore
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {path.length > 0 && (
        <div style={{
          display: "flex",
          gap: "8px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}>
          <button
            onClick={handleBack}
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--brown-light, #9A7E7E)",
              background: "none",
              border: "1.5px solid var(--tan, #D4C5A9)",
              borderRadius: "20px",
              padding: "6px 16px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            ← Back
          </button>
          <button
            onClick={handleCloseEnough}
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: "13px",
              fontWeight: 700,
              color: color,
              background: `color-mix(in srgb, ${color} 10%, transparent)`,
              border: `1.5px dashed ${color}`,
              borderRadius: "20px",
              padding: "6px 16px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            This is close enough ✓
          </button>
        </div>
      )}
    </div>
  );
}