const PLANS = {
    search_pass: {
        name: '90-Day Pass',
        price: 79,
        note: '90 days · one charge',
        popular: false,
        description: 'Fixed window for a launch sprint, pilot cohort, or focused outbound push.',
        checkout: 'https://api.polar.sh/v1/checkout-links/polar_cl_KTTV9epSEVqEQ29pqzBgJwnxetHRb65GfJf0Y3FPc3Y/redirect',
        highlights: ['Included AI answers', 'Live overlay', '2 devices'],
        features: ['Included AI answers', 'Local Whisper transcription', 'macOS desktop app', 'Always-on-top overlay + shortcuts'],
    },
    monthly: {
        name: 'Monthly',
        price: 39,
        note: 'Cancel anytime',
        popular: true,
        description: 'Ongoing access for daily calls, pipeline reviews, and live conversations.',
        checkout: 'https://api.polar.sh/v1/checkout-links/polar_cl_yFOI4SdXApw2w0phQZnhL8jThH50xuPIfL5Ah4LLmfG/redirect',
        highlights: ['Included AI answers', 'Live overlay', '2 devices'],
        features: ['Included AI answers', 'Local Whisper transcription', 'macOS desktop app', 'Renews until cancelled'],
    },
};

const PLAN_ORDER = ['search_pass', 'monthly'];

const BENTO_TAGS = [
    ['Sales calls', 'Objection handling', 'Pipeline reviews', 'Discovery calls', 'Demo day'],
    ['Meetings', 'Standups', '1:1s', 'Board prep', 'All-hands'],
    ['Interviews', 'Negotiations', 'Presentations', 'Q&A prep', 'Custom profiles'],
];

function initPlanPicker() {
    const root = document.querySelector('[data-plan-picker]');
    if (!root) return;

    let selectedSku = 'search_pass';
    const stack = root.querySelector('[data-plan-stack]');
    const ring = root.querySelector('[data-plan-ring]');
    const cards = [...root.querySelectorAll('[data-plan-card]')];
    const highlights = root.querySelector('[data-plan-highlights]');
    const detailPanel = root.querySelector('[data-plan-detail-panel]');
    const checkoutBtn = root.querySelector('[data-plan-checkout]');
    const checkoutLabel = root.querySelector('[data-checkout-label]');
    const heroLabels = [...document.querySelectorAll('[data-hero-label]')];

    function renderHighlights(plan) {
        if (!highlights) return;
        highlights.innerHTML = plan.highlights
            .map(
                item => `
            <div class="highlight-chip">
                <span class="highlight-dot" aria-hidden="true"></span>
                ${item}
            </div>
        `
            )
            .join('');
    }

    function renderDetailPanel(plan) {
        if (!detailPanel) return;

        detailPanel.classList.add('is-updating');

        window.setTimeout(() => {
            detailPanel.innerHTML = `
                <div class="plan-detail-head">
                    <span class="plan-detail-name">${plan.name}</span>
                    <span class="plan-detail-price">$${plan.price}</span>
                </div>
                <p class="plan-detail-note">${plan.description}</p>
                <ul class="plan-detail-list">
                    ${plan.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            `;
            detailPanel.classList.remove('is-updating');
        }, 120);
    }

    function updateCheckoutLabels(plan) {
        const label = `Checkout — ${plan.name} · $${plan.price}`;
        const heroLabel = `${plan.name} — $${plan.price}`;
        const bandLabel = `Get ${plan.name} — $${plan.price}`;

        if (checkoutBtn && checkoutLabel) {
            checkoutLabel.textContent = label;
            checkoutBtn.setAttribute('href', plan.checkout);
            checkoutBtn.setAttribute('aria-label', label);
        }

        heroLabels.forEach((node, index) => {
            node.textContent = index === 0 ? heroLabel : bandLabel;
            const button = node.closest('[data-hero-checkout]');
            if (button) button.setAttribute('href', plan.checkout);
        });
    }

    function syncRingPosition(index) {
        const card = cards[index];
        if (!ring || !stack || !card) return;

        const stackRect = stack.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const top = cardRect.top - stackRect.top;

        ring.style.transform = 'none';
        ring.style.top = `${top}px`;
        ring.style.height = `${cardRect.height}px`;
    }

    function syncRingForSelection() {
        syncRingPosition(PLAN_ORDER.indexOf(selectedSku));
    }

    function syncPlanCardLabels() {
        cards.forEach(card => {
            const plan = PLANS[card.dataset.sku];
            if (!plan) return;

            const nameEl = card.querySelector('.plan-card-name');
            if (nameEl) nameEl.textContent = plan.name;

            const titleRow = card.querySelector('.plan-card-title');
            if (!titleRow) return;

            const existingBadge = titleRow.querySelector('.plan-badge');
            if (existingBadge) existingBadge.remove();

            if (plan.popular) {
                const badge = document.createElement('span');
                badge.className = 'plan-badge';
                badge.textContent = 'Popular';
                titleRow.appendChild(badge);
            }
        });
    }

    function selectPlan(sku) {
        selectedSku = sku;
        const plan = PLANS[sku];
        const index = PLAN_ORDER.indexOf(sku);

        cards.forEach(card => {
            const isSelected = card.dataset.sku === sku;
            card.classList.toggle('selected', isSelected);
            card.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        });

        syncRingPosition(index);
        renderHighlights(plan);
        renderDetailPanel(plan);
        updateCheckoutLabels(plan);
    }

    cards.forEach(card => {
        card.addEventListener('click', () => selectPlan(card.dataset.sku));
    });

    syncPlanCardLabels();
    selectPlan(selectedSku);

    window.addEventListener('resize', syncRingForSelection);
    window.addEventListener('load', syncRingForSelection);

    if (typeof ResizeObserver !== 'undefined' && stack) {
        const observer = new ResizeObserver(() => syncRingForSelection());
        observer.observe(stack);
        cards.forEach(card => observer.observe(card));
    }

    window.requestAnimationFrame(syncRingForSelection);
}

function hasGsap() {
    return typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
}

function initReveal() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length || !('IntersectionObserver' in window)) {
        items.forEach(item => item.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    items.forEach(item => observer.observe(item));
}

function initBlockReveal() {
    const blocks = document.querySelectorAll('[data-block-reveal]');
    if (!blocks.length) return;

    if (hasGsap()) {
        const { gsap, ScrollTrigger } = window;
        gsap.registerPlugin(ScrollTrigger);

        blocks.forEach(block => {
            const text = block.querySelector('.block-reveal-text');
            const wipe = block.querySelector('.block-reveal-wipe');
            if (!text || !wipe) return;

            block.classList.add('gsap-ready');
            gsap.set(text, { opacity: 0, yPercent: 100 });
            gsap.set(wipe, { scaleX: 0, transformOrigin: 'left center' });

            gsap
                .timeline({
                    scrollTrigger: {
                        trigger: block,
                        start: 'top 85%',
                        once: true,
                    },
                })
                .to(wipe, { scaleX: 1, duration: 0.55, ease: 'expo.inOut' })
                .to(text, { opacity: 1, yPercent: 0, duration: 0.5, ease: 'expo.out' }, '-=0.28')
                .to(wipe, { scaleX: 0, transformOrigin: 'right center', duration: 0.5, ease: 'expo.inOut' }, '+=0.12');
        });
        return;
    }

    if (!('IntersectionObserver' in window)) {
        blocks.forEach(block => {
            block.classList.add('is-visible');
            window.setTimeout(() => block.classList.add('wipe-out'), 900);
        });
        return;
    }

    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                window.setTimeout(() => entry.target.classList.add('wipe-out'), 900);
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    blocks.forEach(block => observer.observe(block));
}

function initPlateFocus() {
    const plates = document.querySelectorAll('[data-plate]');
    plates.forEach(plate => {
        plate.addEventListener('mouseenter', () => {
            plates.forEach(other => other.classList.toggle('dimmed', other !== plate));
        });
        plate.addEventListener('mouseleave', () => {
            plates.forEach(other => other.classList.remove('dimmed'));
        });
    });
}

function initParallax() {
    const layer = document.querySelector('[data-hood-parallax]');
    if (!layer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    function handleMove(event) {
        const x = (event.clientX / window.innerWidth - 0.5) * 2;
        const y = (event.clientY / window.innerHeight - 0.5) * 2;
        targetX = x * 12;
        targetY = y * 8;
    }

    function tick() {
        currentX += (targetX - currentX) * 0.06;
        currentY += (targetY - currentY) * 0.06;
        layer.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        window.requestAnimationFrame(tick);
    }

    window.addEventListener('pointermove', handleMove, { passive: true });
    window.requestAnimationFrame(tick);
}

function initSterlingNav() {
    const btn = document.querySelector('[data-sterling-toggle]');
    const overlay = document.querySelector('[data-sterling-overlay]');
    const backdrop = overlay?.querySelector('.sterling-overlay-backdrop');
    const panels = overlay ? [...overlay.querySelectorAll('.sterling-panel')] : [];
    const linkTexts = overlay ? [...overlay.querySelectorAll('.sterling-menu-link-text')] : [];
    const cta = overlay?.querySelector('.sterling-menu-cta');
    const links = overlay ? [...overlay.querySelectorAll('.sterling-menu-link')] : [];
    const shapeItems = overlay ? [...overlay.querySelectorAll('[data-sterling-shape-target]')] : [];
    const shapes = overlay ? [...overlay.querySelectorAll('[data-sterling-shape]')] : [];

    if (!btn || !overlay) return;

    let menuOpen = false;
    let menuTimeline = null;
    const useGsap = hasGsap();

    if (useGsap) {
        overlay.classList.add('use-gsap');
        const { gsap } = window;
        gsap.set(overlay, { autoAlpha: 0, pointerEvents: 'none' });
        gsap.set(panels, { xPercent: 101 });
        gsap.set(backdrop, { autoAlpha: 0 });
        gsap.set(linkTexts, { yPercent: 110, rotate: 4, opacity: 0 });
        if (cta) gsap.set(cta, { y: 24, opacity: 0 });
    }

    function activateShape(index) {
        shapes.forEach(shape => {
            shape.classList.toggle('is-active', shape.getAttribute('data-sterling-shape') === index);
        });
    }

    shapeItems.forEach(item => {
        const index = item.getAttribute('data-sterling-shape-target');
        item.addEventListener('mouseenter', () => activateShape(index));
        item.addEventListener('focusin', () => activateShape(index));
        item.addEventListener('mouseleave', () => shapes.forEach(shape => shape.classList.remove('is-active')));
        item.addEventListener('focusout', () => shapes.forEach(shape => shape.classList.remove('is-active')));
    });

    function setOpen(open) {
        menuOpen = open;
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
        document.body.style.overflow = open ? 'hidden' : '';

        if (useGsap) {
            const { gsap } = window;
            menuTimeline?.kill();

            if (open) {
                overlay.classList.add('is-open');
                menuTimeline = gsap.timeline();
                menuTimeline
                    .set(overlay, { autoAlpha: 1, pointerEvents: 'auto' })
                    .to(backdrop, { autoAlpha: 1, duration: 0.4, ease: 'power2.out' }, 0)
                    .to(panels, { xPercent: 0, duration: 0.55, stagger: 0.08, ease: 'expo.inOut' }, 0)
                    .to(linkTexts, { yPercent: 0, rotate: 0, opacity: 1, duration: 0.65, stagger: 0.06, ease: 'expo.out' }, 0.2);
                if (cta) {
                    menuTimeline.to(cta, { y: 0, opacity: 1, duration: 0.5, ease: 'expo.out' }, 0.35);
                }
            } else {
                menuTimeline = gsap.timeline({
                    onComplete: () => overlay.classList.remove('is-open'),
                });
                menuTimeline
                    .to(linkTexts, { yPercent: 80, opacity: 0, duration: 0.25, stagger: 0.03, ease: 'power2.in' })
                    .to(cta, { y: 16, opacity: 0, duration: 0.2, ease: 'power2.in' }, '<')
                    .to(backdrop, { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, 0.05)
                    .to(panels, { xPercent: 101, duration: 0.45, stagger: 0.05, ease: 'expo.in' }, 0.08)
                    .set(overlay, { autoAlpha: 0, pointerEvents: 'none' });
                shapes.forEach(shape => shape.classList.remove('is-active'));
            }
            return;
        }

        overlay.classList.toggle('is-open', open);
    }

    function closeMenu() {
        if (menuOpen) setOpen(false);
    }

    btn.addEventListener('click', () => setOpen(!menuOpen));
    backdrop?.addEventListener('click', closeMenu);
    links.forEach(link => link.addEventListener('click', closeMenu));

    window.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeMenu();
    });
}

function initDemoVideo() {
    const frame = document.querySelector('[data-demo-frame]');
    const video = frame?.querySelector('[data-demo-video]');
    const placeholder = frame?.querySelector('[data-demo-placeholder]');
    const playBtn = frame?.querySelector('[data-demo-play]');
    const note = frame?.querySelector('[data-demo-note]');

    if (!frame || !video || !placeholder) return;

    let videoReady = false;

    function showVideo() {
        frame.classList.add('has-video');
        frame.classList.remove('is-loading');
        placeholder.hidden = true;
        video.hidden = false;
        video.controls = true;
        video.play().catch(() => {});
    }

    function markReady() {
        videoReady = true;
        frame.classList.add('has-video-ready');
        if (note) {
            note.textContent = 'Press play to watch Menace on a live call.';
        }
    }

    function markUnavailable() {
        videoReady = false;
        frame.classList.remove('has-video-ready', 'is-loading');
        if (note) {
            note.innerHTML = 'Add <code>site/demo.mp4</code> to enable playback.';
        }
    }

    video.addEventListener('loadedmetadata', markReady);
    video.addEventListener('canplay', markReady);
    video.addEventListener('error', markUnavailable);

    playBtn?.addEventListener('click', () => {
        if (videoReady || video.readyState >= 1) {
            showVideo();
            return;
        }

        frame.classList.add('is-loading');
        video.load();

        const onReady = () => {
            video.removeEventListener('canplay', onReady);
            video.removeEventListener('error', onFail);
            markReady();
            showVideo();
        };

        const onFail = () => {
            video.removeEventListener('canplay', onReady);
            video.removeEventListener('error', onFail);
            markUnavailable();
        };

        video.addEventListener('canplay', onReady, { once: true });
        video.addEventListener('error', onFail, { once: true });
    });

    video.load();
}

function buildTagRow(tags, className = '') {
    const tripled = [...tags, ...tags, ...tags];
    const items = tripled
        .map(
            tag => `
        <span class="bento-tag">
            <span class="highlight-dot" aria-hidden="true"></span>
            ${tag}
        </span>
    `
        )
        .join('');
    return `<div class="bento-tag-row ${className}">${items}</div>`;
}

function initMagnifiedBento() {
    const root = document.querySelector('[data-bento-lens]');
    if (!root) return;

    const viewport = root.querySelector('[data-bento-viewport]');
    const baseLayer = root.querySelector('[data-bento-base]');
    const revealLayer = root.querySelector('[data-bento-reveal]');
    const lens = root.querySelector('[data-bento-lens-handle]');

    if (!viewport || !baseLayer || !revealLayer || !lens) return;

    baseLayer.innerHTML = BENTO_TAGS.map((row, index) => {
        const classes = index === 1 ? 'reverse' : index === 2 ? 'slow' : '';
        return buildTagRow(row, classes);
    }).join('');

    revealLayer.innerHTML = BENTO_TAGS.map((row, index) => {
        const classes = index === 1 ? 'reverse' : index === 2 ? 'slow' : '';
        return buildTagRow(row, classes);
    }).join('');

    const lensRadius = 44;
    let lensX = viewport.clientWidth / 2;
    let lensY = viewport.clientHeight / 2;
    let isDragging = false;

    function updateLens(x, y) {
        const rect = viewport.getBoundingClientRect();
        lensX = Math.max(0, Math.min(rect.width, x));
        lensY = Math.max(0, Math.min(rect.height, y));

        lens.style.left = `${lensX}px`;
        lens.style.top = `${lensY}px`;
        revealLayer.style.clipPath = `circle(${lensRadius}px at ${lensX}px ${lensY}px)`;
        revealLayer.style.webkitClipPath = `circle(${lensRadius}px at ${lensX}px ${lensY}px)`;
    }

    function pointerToLocal(event) {
        const rect = viewport.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }

    viewport.addEventListener('pointerenter', () => {
        lens.classList.remove('is-hidden');
    });

    viewport.addEventListener('pointerleave', () => {
        if (!isDragging) lens.classList.add('is-hidden');
    });

    viewport.addEventListener('pointermove', event => {
        if (!isDragging && event.pointerType === 'mouse') {
            const point = pointerToLocal(event);
            updateLens(point.x, point.y);
        }
    });

    viewport.addEventListener('pointerdown', event => {
        isDragging = true;
        viewport.classList.add('is-dragging');
        viewport.setPointerCapture(event.pointerId);
        const point = pointerToLocal(event);
        updateLens(point.x, point.y);
    });

    viewport.addEventListener('pointermove', event => {
        if (!isDragging) return;
        const point = pointerToLocal(event);
        updateLens(point.x, point.y);
    });

    function endDrag(event) {
        if (!isDragging) return;
        isDragging = false;
        viewport.classList.remove('is-dragging');
        if (viewport.hasPointerCapture(event.pointerId)) {
            viewport.releasePointerCapture(event.pointerId);
        }
    }

    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    updateLens(lensX, lensY);
    lens.classList.add('is-hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    initPlanPicker();
    initReveal();
    initBlockReveal();
    initPlateFocus();
    initParallax();
    initSterlingNav();
    initMagnifiedBento();
    initDemoVideo();
});
