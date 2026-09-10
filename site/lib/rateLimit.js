'use strict';

const buckets = new Map();

function checkRateLimit(key, { windowMs, maxRequests }) {
    const now = Date.now();
    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (now >= bucket.resetAt) {
        bucket.count = 0;
        bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > maxRequests) {
        const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
        return { allowed: false, retryAfterSec };
    }

    return { allowed: true, retryAfterSec: 0 };
}

module.exports = {
    checkRateLimit,
};
