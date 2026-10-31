const ADJECTIVES = [
  "Neon", "Retro", "Lunar", "Cyber", "Cosmic", "Pixel", "Quantum", "Crypto",
  "Holo", "Astro", "Silent", "Shadow", "Hollow", "Static", "Velvet", "Rogue",
];
const NOUNS = [
  "Builder", "Crafter", "Hacker", "Coder", "Designer", "Maker", "Creator",
  "Smith", "Ninja", "Wizard", "Ghost", "Phantom", "Critic", "Fox", "Owl",
];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

// e.g. NeonFox#4821
function generateHandle() {
  return `${pick(ADJECTIVES)}${pick(NOUNS)}#${Math.floor(Math.random() * 9000) + 1000}`;
}

module.exports = { generateHandle };
