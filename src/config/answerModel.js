'use strict';

const DEFAULT_ANSWER_MODEL = 'z-ai/glm-5.3-flash';

function getAnswerModelOptions(model) {
    // GLM defaults to maximum reasoning, which delays short spoken replies.
    return model === DEFAULT_ANSWER_MODEL ? { reasoning: { effort: 'low', exclude: true } } : {};
}

module.exports = { DEFAULT_ANSWER_MODEL, getAnswerModelOptions };
