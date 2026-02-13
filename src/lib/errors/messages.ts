/**
 * Elderly-friendly error messages
 *
 * NEVER show technical jargon to users. Every message should:
 * - Be warm and reassuring
 * - Explain what happened in plain language
 * - Include a recovery action
 * - Emphasize that their stories are safe
 */

export const ERROR_MESSAGES = {
  // Network / connectivity
  network: "It seems we lost our connection. Your stories are safe — we'll try again in a moment.",
  networkRetry: "Still having trouble connecting. You can keep talking and we'll catch up when the connection returns.",

  // Authentication
  auth: "Let's get you signed in so we can save your stories safely.",
  sessionExpired: "Your session timed out. Let's get you signed back in to keep your stories safe.",

  // API / AI responses
  aiThinking: "I need a moment to collect my thoughts. Could you try that again?",
  aiOverloaded: "I'm getting a lot of visitors right now. Could you try again in a moment?",
  aiConfig: "Something needs fixing on our end. Your stories are safe — please try again later.",

  // Microphone / voice
  micNotFound: "I can't find a microphone. Please check that one is connected, or you can type instead.",
  micPermission: "I need permission to use your microphone. Please allow access when asked, or you can type instead.",
  micGeneral: "I'm having trouble hearing you right now. Try tapping the microphone button, or you can type instead.",

  // Speech recognition
  speechNotSupported: "Voice input isn't available in this browser. You can type your stories instead — I'm just as good a listener!",
  speechNetworkError: "I need an internet connection to hear you. Please check your connection, or type instead.",

  // TTS / voice playback
  ttsFailed: "I couldn't play that out loud, but you can read my response above.",
  ttsRetrying: "Having trouble speaking — let me try once more.",

  // Storage / saving
  saveFailed: "I had trouble saving, but your story is still here. Let's try again.",
  savePartial: "Your story is saved! The audio recording will upload when the connection improves.",
  storageLocal: "Your story is saved on this device. Sign in to keep it safe across all your devices.",

  // Draft recovery
  draftRecoveryFailed: "We found a draft but couldn't load it. Starting fresh — your previous stories are still safe.",
  draftCorrupted: "The saved draft seems to have an issue. Starting fresh is the safest option.",

  // Photos
  photoAnalysisFailed: "I couldn't look at that photo right now. Could you try sharing it again?",
  photoTooLarge: "That photo is a bit too large. Could you try a smaller one?",

  // Generic fallback
  generic: "Something went wrong, but your stories are safe. Could you try that again?",
  unexpectedCrash: "Something went wrong. Your stories are safe. Tap the button below to get back on track.",

  // Input validation
  invalidInput: "I didn't quite catch that. Could you try saying it differently?",
  tooManyRequests: "Let's slow down just a bit. Take a breath and try again in a moment.",
  messageTooLong: "That's quite a lot at once! Could you share it in smaller parts? I want to hear every detail.",
} as const

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES
