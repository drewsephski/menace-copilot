const PLANS = {
    search_pass: {
        name: '90-Day Pass',
        price: 79,
        note: '90 days · one charge',
        popular: false,
        description: 'Fixed window for a launch sprint, pilot cohort, or focused outbound push.',
        checkout: 'https://buy.polar.sh/polar_cl_KTTV9epSEVqEQ29pqzBgJwnxetHRb65GfJf0Y3FPc3Y',
        highlights: ['Included AI answers', 'Live overlay', '2 devices'],
        features: ['Included AI answers', 'Local Whisper transcription', 'macOS desktop app', 'Always-on-top overlay + shortcuts'],
    },
    monthly: {
        name: 'Monthly',
        price: 39,
        note: 'Cancel anytime',
        popular: true,
        description: 'Ongoing access for daily calls, pipeline reviews, and live conversations.',
        checkout: 'https://buy.polar.sh/polar_cl_yFOI4SdXApw2w0phQZnhL8jThH50xuPIfL5Ah4LLmfG',
        highlights: ['Included AI answers', 'Live overlay', '2 devices'],
        features: ['Included AI answers', 'Local Whisper transcription', 'macOS desktop app', 'Renews until cancelled'],
    },
};

const PLAN_ORDER = ['search_pass', 'monthly'];

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

document.addEventListener('DOMContentLoaded', () => {
    initPlanPicker();
    initReveal();
    initPlateFocus();
});
