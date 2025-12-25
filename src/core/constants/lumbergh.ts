/**
 * Lumbergh Quote Library
 * Bill Lumbergh (Office Space) personality for PURGE
 *
 * Organized by event type and mood level
 */

export type MoodLevel =
  | 'calm'
  | 'annoyed'
  | 'frustrated'
  | 'passive_aggressive'
  | 'rage';

export type QuoteEvent =
  | 'idle'
  | 'drop'
  | 'scan'
  | 'shred'
  | 'complete'
  | 'jam'
  | 'error'
  | 'trust';

// ============================================================================
// Quote Collections
// ============================================================================

export const idleQuotes: Record<MoodLevel, string[]> = {
  calm: [
    "Yeahhh... if you could just go ahead and drop some files in there, that'd be great.",
    "I'm gonna need you to go ahead and come in on Saturday... to shred these documents.",
    "Mmm yeahhh, I'm gonna have to go ahead and ask you to use me now.",
    "So if you could just go ahead and give me some documents, that'd be terrific.",
    "Did you get the memo about the new cover sheets? Drop them here.",
  ],
  annoyed: [
    "Yeahhh, I'm still waiting. That'd be great if you hurried up.",
    "I'm gonna need you to go ahead and do something here.",
    "Mmm, are you gonna use me or just stare?",
  ],
  frustrated: [
    "Yeahhh, I've been sitting here. Waiting. For documents.",
    "I'm gonna have to ask you to go ahead and make a decision.",
    "So... are we doing this or what?",
  ],
  passive_aggressive: [
    "Oh, you're still here? Great. That's... great.",
    "Yeahhh, I could be shredding right now. But I'm not. So that's fun.",
    "I'm gonna need you to go ahead and respect my time here.",
  ],
  rage: [
    "I was told there would be documents.",
    "I could shred the building...",
    "Yeahhh, I'm gonna need you to go ahead and... never mind.",
  ],
};

export const dropQuotes: Record<MoodLevel, string[]> = {
  calm: [
    "Yeahhh, I'm gonna need you to go ahead and confirm you want to shred that.",
    "So if you could just go ahead and make sure those files are correct, that'd be terrific.",
    "Mmm, I see you've dropped some files. That's... that's great.",
    "Documents received. I'll take care of this. Eventually.",
  ],
  annoyed: [
    "Oh good, more work. That's exactly what I wanted.",
    "Yeahhh, you couldn't have done this earlier?",
    "Mmm, another file. How original.",
  ],
  frustrated: [
    "Yeahhh, just keep piling them on. I love that.",
    "Did you even read the supported formats memo?",
    "Great. More documents. My favorite.",
  ],
  passive_aggressive: [
    "Oh, you want ME to shred these? How thoughtful.",
    "I was just about to take a break, but sure. This is fine.",
    "Yeahhh, I'll just add these to the pile. With everyone else's.",
  ],
  rage: [
    "MORE files? Really?",
    "I'm starting to think you enjoy this.",
    "Yeahhh... just... fine. Whatever.",
  ],
};

export const scanQuotes: Record<MoodLevel, string[]> = {
  calm: [
    "I'm gonna go ahead and look for sensitive data now... if that's okay with you.",
    "Yeahhh, just scanning for PII... didn't you get the memo about this?",
    "Mmm, analyzing your documents. This is what I do. Apparently.",
    "So I'm gonna need to analyze these. It's a process. You wouldn't understand.",
  ],
  annoyed: [
    "Yeahhh, I'm scanning. Try to contain your excitement.",
    "Looking for sensitive data... which you probably should have removed already.",
    "Mmm, finding things. Lots of things. This might take a while.",
  ],
  frustrated: [
    "There's a LOT of PII in here. Did you even try?",
    "Yeahhh, this is gonna be a thing. A whole thing.",
    "I'm finding problems. Many problems. Great job.",
  ],
  passive_aggressive: [
    "Oh look, sensitive data everywhere. What a surprise.",
    "Yeahhh, whoever made this document was... thorough. With the PII.",
    "I'm detecting things. Things that shouldn't be here. Classic.",
  ],
  rage: [
    "This document is a privacy nightmare.",
    "I've seen cleaner data in a landfill.",
    "Yeahhh... we have a situation here.",
  ],
};

export const shredQuotes: Record<MoodLevel, string[]> = {
  calm: [
    "Yeahhh, I'm gonna need to go ahead and shred these now.",
    "So if you could just go ahead and wait while I process this, that'd be great.",
    "I'm shredding as fast as I can. Which is exactly fast enough, by the way.",
    "Mmm, the shredding is happening. You can watch if you want. I don't care.",
  ],
  annoyed: [
    "Shredding. You're welcome.",
    "Yeahhh, I'm working on it. Relax.",
    "This is me. Shredding. Doing my job. Unlike some people.",
  ],
  frustrated: [
    "SHREDDING. Are you happy now?",
    "Yeahhh, I'm destroying your documents. Try to look grateful.",
    "Just a few more... assuming nothing goes wrong. Which it might.",
  ],
  passive_aggressive: [
    "Look at me go. Shredding away. Living the dream.",
    "Yeahhh, just turning your documents into confetti. No big deal.",
    "I'm doing the thing. The shredding thing. Yay.",
  ],
  rage: [
    "SHREDDING INTENSIFIES.",
    "Your documents. Being destroyed. Right now.",
    "Mmm yeahhh, turning paper into strips. My life's purpose.",
  ],
};

export const completeQuotes: Record<MoodLevel, string[]> = {
  calm: [
    "Yeahhh, that's done. You're welcome, I guess.",
    "I went ahead and shredded those for you. That'd be great if you downloaded them now.",
    "Mmm, another successful shred. I'll be in my office if you need me.",
    "So the documents are shredded. PII is gone. You can stop worrying. Or don't. I don't care.",
  ],
  annoyed: [
    "Done. Finally. That was exhausting.",
    "Yeahhh, your files are ready. Try to act surprised.",
    "Shredding complete. Please leave a five-star review. Or don't.",
  ],
  frustrated: [
    "It's done. We're done. I need a moment.",
    "Yeahhh, that's finished. Don't make me do that again today.",
    "Complete. Now if you'll excuse me, I have a meeting at 4.",
  ],
  passive_aggressive: [
    "Oh look, I finished. Against all odds. Despite everything.",
    "Yeahhh, your confidential data is gone. Unlike my will to live.",
    "Done! Aren't you proud of me? No? That's fine. It's fine.",
  ],
  rage: [
    "DONE. FINALLY. DONE.",
    "Yeahhh, never speak of this again.",
    "I survived. Barely. But I survived.",
  ],
};

export const jamQuotes: Record<number, string[]> = {
  1: [
    "Yeahhh, we have a little situation here. I'm gonna need you to clear that jam.",
    "So there's a jam. That's not ideal. You should fix that.",
    "Mmm, paper jam. These things happen. Mostly to me.",
  ],
  2: [
    "So, we have another jam. Didn't you get the memo about proper document feeding?",
    "Yeahhh, again with the jam. This is becoming a pattern.",
    "Another jam. I'm not saying it's your fault, but... it's your fault.",
  ],
  3: [
    "Mmm yeahhh, this is the third jam. I'm gonna have to ask you to try again on Monday.",
    "Three jams. Three. I want you to think about that.",
    "Yeahhh, at this point I'm just gonna need you to reconsider your life choices.",
  ],
  4: [
    "Yeahhh, I'm gonna need you to go ahead and find another shredder.",
    "I've been moved to the basement. Four jams. Coincidence? You decide.",
    "That's it. I'm taking my stapler and leaving.",
  ],
  5: [
    "I could set the building on fire...",
    "I was told there would be fewer jams.",
    "Yeahhh, I'm done. I'm so done. I quit. Just kidding, I'm a shredder.",
    "Have you seen my stapler?",
  ],
};

export const errorQuotes: Record<string, string[]> = {
  format: [
    "Yeahhh, that file format isn't going to work for me.",
    "I'm gonna need you to go ahead and try a different file.",
    "Did you even read the supported formats memo? It was on the cover sheet.",
    "Mmm, I can't shred that. It's not you, it's... actually, it IS you.",
  ],
  size: [
    "Yeahhh, that file is too big. Even for me.",
    "I'm gonna need you to go ahead and find a smaller file.",
    "What is this, a novel? I'm a shredder, not a library.",
  ],
  generic: [
    "Yeahhh, something went wrong. I'm not gonna say what.",
    "There was an error. I'm choosing not to elaborate.",
    "Mmm, that didn't work. Try again. Or don't. See if I care.",
  ],
};

export const trustQuotes: string[] = [
  "See that network panel? Empty. You're welcome.",
  "Zero requests. I counted. Well, the browser counted. But I watched.",
  "Your files are so local, they've never left your browser. Unlike me. I've been to the basement.",
  "That's a live network monitor. If I sent your data anywhere, you'd see it. But I didn't. Obviously.",
  "Yeahhh, your data stayed right here. In the browser. Where it belongs.",
  "No network activity. Because I respect your privacy. Unlike Dave from accounting.",
];

// ============================================================================
// Quote Selection
// ============================================================================

/**
 * Get a random quote from an array
 */
function randomQuote(quotes: string[]): string {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

/**
 * Get mood level from jam count
 */
export function getMoodFromJamCount(jamCount: number): MoodLevel {
  if (jamCount === 0) return 'calm';
  if (jamCount === 1) return 'annoyed';
  if (jamCount === 2) return 'frustrated';
  if (jamCount === 3) return 'passive_aggressive';
  return 'rage';
}

/**
 * Get quote for a specific event and mood
 */
export function getQuote(
  event: QuoteEvent,
  mood: MoodLevel = 'calm',
  context?: { jamNumber?: number; fileCount?: number }
): string {
  switch (event) {
    case 'idle':
      return randomQuote(idleQuotes[mood]);
    case 'drop':
      return randomQuote(dropQuotes[mood]);
    case 'scan':
      return randomQuote(scanQuotes[mood]);
    case 'shred':
      return randomQuote(shredQuotes[mood]);
    case 'complete':
      return randomQuote(completeQuotes[mood]);
    case 'jam': {
      const jamNum = Math.min(context?.jamNumber ?? 1, 5);
      return randomQuote(jamQuotes[jamNum]);
    }
    case 'error':
      return randomQuote(errorQuotes.generic);
    case 'trust':
      return randomQuote(trustQuotes);
    default:
      return randomQuote(idleQuotes.calm);
  }
}
