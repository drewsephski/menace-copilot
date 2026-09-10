/**
 * Single source of truth for live session profiles (conversation types).
 */

export const DEFAULT_SESSION_PROFILE_ID = 'sales';

/** @type {readonly string[]} */
export const SESSION_PROFILE_ORDER = ['sales', 'meeting', 'interview', 'negotiation', 'presentation', 'custom'];

/** Legacy profile ids that map to a supported profile at runtime. */
const LEGACY_PROFILE_ALIASES = {
    exam: 'custom',
};

/**
 * @typedef {Object} SessionProfile
 * @property {string} id
 * @property {string} label
 * @property {string} shortLabel
 * @property {string} description
 * @property {string} contextLabel
 * @property {string} contextPlaceholder
 * @property {string} listeningText
 * @property {string} startLabel
 * @property {string} recommendedAudioMode
 * @property {boolean} showInPicker
 */

/** @type {Record<string, SessionProfile>} */
export const SESSION_PROFILES = {
    sales: {
        id: 'sales',
        label: 'Sales Call',
        shortLabel: 'Sales',
        description: 'Handle objections, answer questions, and keep the conversation moving.',
        contextLabel: 'Give Menace the details it shouldn\u2019t guess.',
        contextPlaceholder:
            'Product, ICP, pricing, proof points, common objections, competitors, constraints...',
        listeningText: 'Listening \u00b7 Sales Call',
        startLabel: 'Start Sales Call',
        recommendedAudioMode: 'speaker_only',
        showInPicker: true,
    },
    meeting: {
        id: 'meeting',
        label: 'Meeting',
        shortLabel: 'Meeting',
        description: 'Stay sharp on questions, decisions, updates, and discussion.',
        contextLabel: 'Give Menace the room.',
        contextPlaceholder: 'Agenda, project context, stakeholders, current status, decisions...',
        listeningText: 'Listening \u00b7 Meeting',
        startLabel: 'Start Meeting',
        recommendedAudioMode: 'speaker_only',
        showInPicker: true,
    },
    interview: {
        id: 'interview',
        label: 'Interview',
        shortLabel: 'Interview',
        description: 'Turn your real experience and background into concise spoken answers.',
        contextLabel: 'Give Menace the background it should answer from.',
        contextPlaceholder: 'Resume, job description, company, relevant projects, experience...',
        listeningText: 'Listening \u00b7 Interview',
        startLabel: 'Start Interview',
        recommendedAudioMode: 'speaker_only',
        showInPicker: true,
    },
    negotiation: {
        id: 'negotiation',
        label: 'Negotiation',
        shortLabel: 'Negotiation',
        description: 'Respond strategically while protecting goals and constraints.',
        contextLabel: 'Give Menace your goals and limits.',
        contextPlaceholder: 'Target terms, walk-away points, constraints, counterpart context...',
        listeningText: 'Listening \u00b7 Negotiation',
        startLabel: 'Start Negotiation',
        recommendedAudioMode: 'speaker_only',
        showInPicker: true,
    },
    presentation: {
        id: 'presentation',
        label: 'Presentation',
        shortLabel: 'Presentation',
        description: 'Handle questions and explain material clearly.',
        contextLabel: 'Give Menace the material context.',
        contextPlaceholder: 'Deck outline, key claims, audience, Q&A prep, demo notes...',
        listeningText: 'Listening \u00b7 Presentation',
        startLabel: 'Start Presentation',
        recommendedAudioMode: 'speaker_only',
        showInPicker: true,
    },
    custom: {
        id: 'custom',
        label: 'Custom',
        shortLabel: 'Custom',
        description: 'Define what Menace should help you do.',
        contextLabel: 'Tell Menace what you\u2019re doing and how it should help.',
        contextPlaceholder: 'Session goals, tone, constraints, background...',
        listeningText: 'Listening \u00b7 Custom',
        startLabel: 'Start Session',
        recommendedAudioMode: 'speaker_only',
        showInPicker: true,
    },
};

export const AUDIO_MODE_OPTIONS = [
    { value: 'speaker_only', label: 'System Audio / Other Participants' },
    { value: 'mic_only', label: 'My Microphone' },
    { value: 'both', label: 'Both Sides' },
];

/**
 * Normalize a stored or runtime profile id (handles legacy `exam`).
 * @param {string | null | undefined} profileId
 * @returns {string}
 */
export function normalizeProfileId(profileId) {
    if (!profileId || typeof profileId !== 'string') {
        return DEFAULT_SESSION_PROFILE_ID;
    }

    const trimmed = profileId.trim();
    if (LEGACY_PROFILE_ALIASES[trimmed]) {
        return LEGACY_PROFILE_ALIASES[trimmed];
    }

    if (SESSION_PROFILES[trimmed]) {
        return trimmed;
    }

    return DEFAULT_SESSION_PROFILE_ID;
}

/**
 * @param {string | null | undefined} profileId
 * @returns {SessionProfile}
 */
export function getSessionProfile(profileId) {
    const id = normalizeProfileId(profileId);
    return SESSION_PROFILES[id] || SESSION_PROFILES[DEFAULT_SESSION_PROFILE_ID];
}

/**
 * Profiles shown in home/onboarding pickers (production live modes).
 * @returns {SessionProfile[]}
 */
export function getPickerProfiles() {
    return SESSION_PROFILE_ORDER.map(id => SESSION_PROFILES[id]).filter(profile => profile.showInPicker);
}

/**
 * @param {string | null | undefined} profileId
 * @returns {string}
 */
export function getProfileLabel(profileId) {
    return getSessionProfile(profileId).label;
}

/**
 * @param {string | null | undefined} profileId
 * @returns {string}
 */
export function getProfileShortLabel(profileId) {
    return getSessionProfile(profileId).shortLabel;
}

/**
 * Label for a legacy or unknown profile id (e.g. history sessions).
 * @param {string | null | undefined} profileId
 * @returns {string}
 */
export function getProfileLabelIncludingLegacy(profileId) {
    if (!profileId) {
        return 'Session';
    }
    if (profileId === 'exam') {
        return 'Custom';
    }
    return getProfileLabel(profileId);
}
