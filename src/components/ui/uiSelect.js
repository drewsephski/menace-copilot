import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

const CHEVRON_ICON = html`
    <svg class="chevron" width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M6 8l4 4 4-4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
    </svg>
`;

const CHECK_ICON = html`
    <svg class="check" width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M16.5 5.5L8 14l-4.5-4.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" />
    </svg>
`;

export class UiSelect extends LitElement {
    static styles = css`
        :host {
            display: block;
            position: relative;
            width: var(--ui-select-width, 200px);
        }

        :host([full-width]) {
            width: 100%;
        }

        .trigger {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            width: 100%;
            min-height: 36px;
            padding: 8px 12px;
            background: var(--bg-elevated);
            color: var(--text-primary);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            font-family: var(--font);
            font-size: var(--font-size-sm);
            cursor: pointer;
            text-align: left;
            transition:
                border-color var(--transition),
                box-shadow var(--transition),
                background var(--transition);
        }

        .trigger:hover:not(:disabled) {
            border-color: var(--border-strong);
            background: var(--bg-hover);
        }

        .trigger:focus-visible {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 1px var(--accent);
        }

        .trigger:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .trigger.open {
            border-color: var(--accent);
            box-shadow: 0 0 0 1px var(--accent);
        }

        .trigger-label {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .trigger *,
        .option * {
            pointer-events: none;
            cursor: inherit;
        }

        .chevron {
            flex-shrink: 0;
            color: var(--text-muted);
            transition: transform 200ms ease;
        }

        .trigger.open .chevron {
            transform: rotate(180deg);
        }

        .content {
            position: fixed;
            z-index: 10000;
            max-height: 240px;
            overflow-y: auto;
            overflow-x: hidden;
            background: var(--bg-surface);
            border: 1px solid var(--border-strong);
            border-radius: var(--radius-sm);
            padding: 4px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
            opacity: 0;
            pointer-events: none;
            transition: opacity 180ms ease;
        }

        .content.open {
            opacity: 1;
            pointer-events: auto;
        }

        .content.open-down {
            transform: translateY(0) scale(1);
        }

        .content.open-down:not(.open) {
            transform: translateY(-4px) scale(0.98);
        }

        .content.open-up {
            transform: translateY(0) scale(1);
        }

        .content.open-up:not(.open) {
            transform: translateY(4px) scale(0.98);
        }

        .option {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            width: 100%;
            padding: 8px 10px;
            border: none;
            border-radius: calc(var(--radius-sm) - 1px);
            background: transparent;
            color: var(--text-primary);
            font-family: var(--font);
            font-size: var(--font-size-sm);
            text-align: left;
            cursor: pointer;
            transition: background var(--transition);
        }

        .option:hover,
        .option.highlighted {
            background: var(--bg-hover);
        }

        .option.selected {
            color: var(--text-primary);
        }

        .option-label {
            flex: 1;
            min-width: 0;
        }

        .check {
            flex-shrink: 0;
            color: var(--tally);
            opacity: 0;
            transition: opacity var(--transition);
        }

        .option.selected .check {
            opacity: 1;
        }

        @media (prefers-reduced-motion: reduce) {
            .trigger,
            .chevron,
            .content,
            .option,
            .check {
                transition: none;
            }
        }
    `;

    static properties = {
        value: { type: String },
        options: { type: Array },
        placeholder: { type: String },
        disabled: { type: Boolean },
        fullWidth: { type: Boolean, attribute: 'full-width', reflect: true },
        _open: { state: true },
        _highlightIndex: { state: true },
        _contentStyle: { state: true },
        _opensUp: { state: true },
    };

    constructor() {
        super();
        this.value = '';
        this.options = [];
        this.placeholder = 'Select…';
        this.disabled = false;
        this.fullWidth = false;
        this._open = false;
        this._highlightIndex = -1;
        this._contentStyle = {};
        this._opensUp = false;
        this._outsideHandler = null;
        this._positionHandler = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this._outsideHandler = event => {
            if (!this._open) return;
            const path = event.composedPath();
            if (!path.includes(this)) {
                this._close();
            }
        };
        document.addEventListener('pointerdown', this._outsideHandler);
        document.addEventListener('keydown', this._handleDocumentKeydown);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._outsideHandler) {
            document.removeEventListener('pointerdown', this._outsideHandler);
        }
        document.removeEventListener('keydown', this._handleDocumentKeydown);
        this._unbindPositionListeners();
    }

    _bindPositionListeners() {
        if (this._positionHandler) {
            return;
        }

        this._positionHandler = () => {
            if (this._open) {
                this._updateMenuPosition();
            }
        };

        window.addEventListener('scroll', this._positionHandler, true);
        window.addEventListener('resize', this._positionHandler);
    }

    _unbindPositionListeners() {
        if (!this._positionHandler) {
            return;
        }

        window.removeEventListener('scroll', this._positionHandler, true);
        window.removeEventListener('resize', this._positionHandler);
        this._positionHandler = null;
    }

    _estimateMenuHeight() {
        const optionCount = (this.options || []).length;
        const estimatedHeight = optionCount * 36 + 8;
        return Math.min(240, Math.max(estimatedHeight, 36));
    }

    _updateMenuPosition() {
        const trigger = this.shadowRoot?.querySelector('.trigger');
        if (!trigger) {
            return;
        }

        const rect = trigger.getBoundingClientRect();
        const gap = 4;
        const maxHeight = 240;
        const minMargin = 8;
        const estimatedHeight = this._estimateMenuHeight();
        const spaceBelow = window.innerHeight - rect.bottom - gap;
        const spaceAbove = rect.top - gap;
        const opensUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
        const menuHeight = Math.min(maxHeight, opensUp ? spaceAbove : spaceBelow);

        let left = rect.left;
        let width = rect.width;
        if (left + width > window.innerWidth - minMargin) {
            left = Math.max(minMargin, window.innerWidth - width - minMargin);
        }
        if (left < minMargin) {
            left = minMargin;
            width = Math.min(width, window.innerWidth - minMargin * 2);
        }

        this._opensUp = opensUp;
        this._contentStyle = {
            left: `${left}px`,
            width: `${width}px`,
            'max-height': `${Math.max(menuHeight, 36)}px`,
            ...(opensUp
                ? {
                      bottom: `${window.innerHeight - rect.top + gap}px`,
                      top: 'auto',
                  }
                : {
                      top: `${rect.bottom + gap}px`,
                      bottom: 'auto',
                  }),
        };
    }

    _handleDocumentKeydown = event => {
        if (!this._open) return;
        const path = event.composedPath();
        if (!path.includes(this)) return;

        const options = this.options || [];
        if (options.length === 0) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            this._close();
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            const next = this._highlightIndex < options.length - 1 ? this._highlightIndex + 1 : 0;
            this._highlightIndex = next;
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            const prev = this._highlightIndex > 0 ? this._highlightIndex - 1 : options.length - 1;
            this._highlightIndex = prev;
            return;
        }

        if (event.key === 'Enter' && this._highlightIndex >= 0) {
            event.preventDefault();
            const option = options[this._highlightIndex];
            if (option) {
                this._selectValue(option.value);
            }
        }
    };

    _selectedOption() {
        return (this.options || []).find(option => option.value === this.value);
    }

    _openMenu() {
        if (this.disabled) return;
        const selectedIndex = (this.options || []).findIndex(option => option.value === this.value);
        this._highlightIndex = selectedIndex >= 0 ? selectedIndex : 0;
        this._updateMenuPosition();
        this._open = true;
        this._bindPositionListeners();
    }

    _close() {
        this._open = false;
        this._highlightIndex = -1;
        this._contentStyle = {};
        this._opensUp = false;
        this._unbindPositionListeners();
    }

    _toggleMenu() {
        if (this._open) {
            this._close();
        } else {
            this._openMenu();
        }
    }

    _selectValue(nextValue) {
        if (this.disabled || nextValue === this.value) {
            this._close();
            return;
        }

        this.value = nextValue;
        this._close();
        this.dispatchEvent(
            new CustomEvent('change', {
                detail: { value: nextValue },
                bubbles: true,
                composed: true,
            })
        );
    }

    render() {
        const selected = this._selectedOption();
        const label = selected?.label || this.placeholder;

        return html`
            <button
                type="button"
                class="trigger ${this._open ? 'open' : ''}"
                ?disabled=${this.disabled}
                aria-haspopup="listbox"
                aria-expanded=${this._open ? 'true' : 'false'}
                @click=${() => this._toggleMenu()}
            >
                <span class="trigger-label">${label}</span>
                ${CHEVRON_ICON}
            </button>

            <div
                class="content ${this._open ? 'open' : ''} ${this._opensUp ? 'open-up' : 'open-down'}"
                style=${Object.entries(this._contentStyle)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('; ')}
                role="listbox"
            >
                ${(this.options || []).map(
                    (option, index) => html`
                        <button
                            type="button"
                            role="option"
                            class="option ${option.value === this.value ? 'selected' : ''} ${index === this._highlightIndex ? 'highlighted' : ''}"
                            aria-selected=${option.value === this.value}
                            @click=${() => this._selectValue(option.value)}
                            @mouseenter=${() => {
                                this._highlightIndex = index;
                            }}
                        >
                            <span class="option-label">${option.label}</span>
                            ${CHECK_ICON}
                        </button>
                    `
                )}
            </div>
        `;
    }
}

customElements.define('ui-select', UiSelect);
