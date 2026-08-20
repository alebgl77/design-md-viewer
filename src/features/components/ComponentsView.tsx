import React, { useState } from 'react';
import { Component, Layers, Info, ShieldCheck, Code, Eye } from 'lucide-react';
import { clsx } from 'clsx';
import { ComponentSpec } from '../../schema/designSystem';
import { ProvenancePopover } from '../../components/common/ProvenancePopover';
import { Badge } from '../../components/common/Badge';
import { CopyButton } from '../../components/common/CopyButton';

interface ComponentsViewProps {
  components: ComponentSpec[];
  onNavigateToSource?: (lineNumber?: number) => void;
}

export const ComponentsView: React.FC<ComponentsViewProps> = ({
  components,
  onNavigateToSource,
}) => {
  const [selectedCompId, setSelectedCompId] = useState<string>(components[0]?.id || '');
  const [selectedVariant, setSelectedVariant] = useState<string>('Primary');
  const [selectedState, setSelectedState] = useState<string>('Default');
  const [selectedSize, setSelectedSize] = useState<string>('Medium (md)');
  const [activeTab, setActiveTab] = useState<'preview' | 'react' | 'html'>('preview');

  const activeComp = components.find(c => c.id === selectedCompId) || components[0];

  // NOTE: the two generators below emit source code for the CONSUMER's project. Their
  // literals are export payload, not this app's chrome, so they are deliberately left
  // untouched by the token migration — rewriting them would change what users copy out.
  const generateReactCode = (comp: ComponentSpec, variant: string, size: string): string => {
    if (comp.previewType === 'button' || comp.name.toLowerCase().includes('button')) {
      return `import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = '${variant.toLowerCase()}',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-[#0c6e4e] hover:bg-[#10b981] text-white shadow-md shadow-[#10b981]/20',
    secondary: 'bg-[#15221a] hover:bg-[#1a2a20] text-[#cbd5e1] border border-[#1b2b21]',
    outline: 'bg-transparent border border-[#10b981] text-[#34d399] hover:bg-[#10b981]/10',
    ghost: 'bg-transparent text-[#cbd5e1] hover:bg-[#15221a]',
    destructive: 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-xl',
  };

  return (
    <button
      className={\`font-semibold inline-flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#10b981]/30 disabled:opacity-50 disabled:cursor-not-allowed \${variantStyles[variant]} \${sizeStyles[size]} \${className}\`}
      {...props}
    >
      {children}
    </button>
  );
};
`;
    }

    if (comp.previewType === 'input' || comp.name.toLowerCase().includes('input')) {
      return `import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-[#cbd5e1]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={\`w-full px-3.5 py-2.5 rounded-lg bg-[#0e1611] border text-xs text-[#cbd5e1] placeholder-[#64748b] focus:outline-none focus:ring-2 transition-all \${
            error
              ? 'border-rose-500 focus:ring-rose-500/40'
              : 'border-[#1b2b21] focus:border-[#10b981] focus:ring-[#10b981]/30/40'
          } \${className}\`}
          {...props}
        />
        {error && <span className="text-[11px] text-rose-400 font-medium">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
`;
    }

    return `// React component snippet for ${comp.name}
export const ${comp.name.replace(/[^a-zA-Z0-9]/g, '')} = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="p-4 rounded-xl bg-[#0e1611] border border-[#1b2b21] text-[#cbd5e1]">
      {children || '${comp.name}'}
    </div>
  );
};
`;
  };

  const generateHtmlCode = (comp: ComponentSpec, variant: string): string => {
    if (comp.previewType === 'button' || comp.name.toLowerCase().includes('button')) {
      return `<!-- ${variant} Button -->
<button class="px-4 py-2 text-sm font-semibold rounded-lg bg-[#0c6e4e] hover:bg-[#10b981] text-white shadow-md shadow-[#10b981]/20 transition-all focus:outline-none focus:ring-2 focus:ring-[#10b981]/30 disabled:opacity-50">
  ${variant} Action
</button>`;
    }
    if (comp.previewType === 'input' || comp.name.toLowerCase().includes('input')) {
      return `<!-- Text Input -->
<div class="space-y-1.5">
  <label class="block text-xs font-semibold text-[#cbd5e1]">Email Address</label>
  <input type="email" placeholder="user@example.com" class="w-full px-3.5 py-2.5 rounded-lg bg-[#0e1611] border border-[#1b2b21] text-xs text-[#cbd5e1] placeholder-[#64748b] focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/30/40 outline-none" />
</div>`;
    }
    return `<div class="p-4 rounded-xl bg-[#0e1611] border border-[#1b2b21] text-[#cbd5e1]">
  ${comp.name} Content
</div>`;
  };

  const tabs: { id: 'preview' | 'react' | 'html'; label: string; icon: typeof Eye }[] = [
    { id: 'preview', label: 'Live Preview', icon: Eye },
    { id: 'react', label: 'React + Tailwind JSX', icon: Code },
    { id: 'html', label: 'HTML + Tailwind', icon: Code },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-line">
        <h1 className="text-xl font-bold text-content-primary flex items-center gap-2">
          <Component className="w-5 h-5 text-accent" />
          Component Specifications &amp; Code Generators
        </h1>
        <p className="text-xs text-content-muted mt-0.5">
          <span className="tabular-nums">{components.length}</span> UI components parsed with live preview controls
          and multi-framework code export.
        </p>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar - Component List */}
        <div className="lg:col-span-4 rounded-lg bg-surface-raised border border-line p-3 space-y-1">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-content-muted px-3 py-2">
            Available Components
          </h2>
          {components.map((comp) => {
            const isSelected = comp.id === (activeComp?.id || '');
            return (
              <button
                key={comp.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setSelectedCompId(comp.id);
                  if (comp.variants && comp.variants.length > 0) {
                    setSelectedVariant(comp.variants[0].name);
                  }
                }}
                className={clsx(
                  'w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-left text-xs font-semibold transition-colors border',
                  isSelected
                    ? 'bg-accent/15 text-accent border-accent/40'
                    : 'text-content-secondary hover:text-content-primary hover:bg-surface-overlay border-transparent'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={clsx(
                      'w-2 h-2 rounded-full shrink-0',
                      isSelected ? 'bg-accent' : 'bg-line-strong'
                    )}
                    aria-hidden="true"
                  />
                  <span className="truncate">{comp.name}</span>
                </div>
                {comp.variants && (
                  <span className="text-[10px] font-mono text-content-muted tabular-nums shrink-0 ml-2">
                    {comp.variants.length} var
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Content - Component Spec & Live Preview */}
        {activeComp && (
          <div className="lg:col-span-8 space-y-6">
            {/* Component Card */}
            <div className="p-6 rounded-lg bg-surface-raised border border-line shadow-deep space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-line-subtle">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <h2 className="text-xl font-bold text-content-primary">{activeComp.name}</h2>
                    <Badge variant="brand" size="sm">
                      Interactive Preview
                    </Badge>
                  </div>
                  <p className="text-xs text-content-secondary max-w-xl leading-relaxed">
                    {activeComp.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <ProvenancePopover
                    provenance={activeComp.provenance}
                    confidence={activeComp.confidence}
                    itemName={activeComp.name}
                    onNavigateToSource={onNavigateToSource}
                  />
                </div>
              </div>

              {/* Tab Selector (Preview vs React vs HTML) */}
              <div className="flex items-center justify-between border-b border-line-subtle pb-2">
                <div className="flex items-center gap-2">
                  {tabs.map(({ id, label, icon: TabIcon }) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={activeTab === id}
                      onClick={() => setActiveTab(id)}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors',
                        activeTab === id
                          ? 'bg-accent text-accent-contrast'
                          : 'text-content-secondary hover:text-content-primary'
                      )}
                    >
                      <TabIcon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === 'preview' ? (
                <>
                  {/* Controls Bar for Live Preview */}
                  <div className="flex flex-wrap items-center gap-4 p-3 rounded-md bg-surface-inset border border-line-subtle text-xs">
                    {activeComp.variants && activeComp.variants.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <label htmlFor="preview-variant" className="text-content-muted font-medium">
                          Variant:
                        </label>
                        <select
                          id="preview-variant"
                          value={selectedVariant}
                          onChange={(e) => setSelectedVariant(e.target.value)}
                          className="bg-surface-raised border border-line text-content-primary rounded-sm px-2 py-1 focus:outline-none focus:border-accent text-xs font-semibold"
                        >
                          {activeComp.variants.map((v) => (
                            <option key={v.name} value={v.name}>{v.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {activeComp.states && activeComp.states.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <label htmlFor="preview-state" className="text-content-muted font-medium">
                          State:
                        </label>
                        <select
                          id="preview-state"
                          value={selectedState}
                          onChange={(e) => setSelectedState(e.target.value)}
                          className="bg-surface-raised border border-line text-content-primary rounded-sm px-2 py-1 focus:outline-none focus:border-accent text-xs font-semibold"
                        >
                          {activeComp.states.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {activeComp.sizes && activeComp.sizes.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <label htmlFor="preview-size" className="text-content-muted font-medium">
                          Size:
                        </label>
                        <select
                          id="preview-size"
                          value={selectedSize}
                          onChange={(e) => setSelectedSize(e.target.value)}
                          className="bg-surface-raised border border-line text-content-primary rounded-sm px-2 py-1 focus:outline-none focus:border-accent text-xs font-semibold"
                        >
                          {activeComp.sizes.map((sz) => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Live Canvas Preview */}
                  <div className="min-h-[160px] p-8 rounded-md bg-surface-inset border border-line-subtle flex flex-col items-center justify-center relative">
                    <div className="absolute top-2.5 right-2.5">
                      <span className="text-[10px] font-mono text-content-muted bg-surface-raised px-2 py-0.5 rounded-sm border border-line">
                        Preview generated from specification
                      </span>
                    </div>

                    {renderLiveComponent(activeComp.previewType, selectedVariant, selectedState, selectedSize)}
                  </div>
                </>
              ) : (
                /* Code Output View */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-content-secondary">
                      {activeTab === 'react' ? `${activeComp.name}.tsx` : `${activeComp.name}.html`}
                    </span>
                    <CopyButton
                      text={activeTab === 'react' ? generateReactCode(activeComp, selectedVariant, selectedSize) : generateHtmlCode(activeComp, selectedVariant)}
                      label="Copy Component"
                      variant="secondary"
                    />
                  </div>
                  <pre className="p-4 rounded-md bg-surface-inset border border-line text-xs font-mono text-content-secondary overflow-x-auto max-h-[300px] leading-relaxed">
                    {activeTab === 'react' ? generateReactCode(activeComp, selectedVariant, selectedSize) : generateHtmlCode(activeComp, selectedVariant)}
                  </pre>
                </div>
              )}
            </div>

            {/* Anatomy, Tokens, Guidelines Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeComp.variants && (
                <section className="p-5 rounded-lg bg-surface-raised border border-line space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                    <span>Variants (<span className="tabular-nums">{activeComp.variants.length}</span>)</span>
                  </h3>
                  <div className="space-y-2">
                    {activeComp.variants.map((v, i) => (
                      <div key={i} className="p-2.5 rounded-md bg-surface-inset border border-line-subtle text-xs">
                        <div className="font-semibold text-content-primary">{v.name}</div>
                        {v.description && <div className="text-content-muted text-[11px] mt-0.5">{v.description}</div>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeComp.anatomy && activeComp.anatomy.length > 0 && (
                <section className="p-5 rounded-lg bg-surface-raised border border-line space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                    <span>Anatomy &amp; Structure</span>
                  </h3>
                  <ul className="space-y-1.5 text-xs text-content-secondary">
                    {activeComp.anatomy.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {activeComp.tokensUsed && activeComp.tokensUsed.length > 0 && (
                <section className="p-5 rounded-lg bg-surface-raised border border-line space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                    Design Tokens Used
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {activeComp.tokensUsed.map((token, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-sm bg-surface-inset border border-line-subtle text-[11px] font-mono text-accent"
                      >
                        {token}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {activeComp.a11yNotes && activeComp.a11yNotes.length > 0 && (
                <section className="p-5 rounded-lg bg-surface-raised border border-line space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Accessibility Notes</span>
                  </h3>
                  <ul className="space-y-1.5 text-xs text-content-secondary">
                    {activeComp.a11yNotes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" aria-hidden="true" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function renderLiveComponent(
  type?: ComponentSpec['previewType'],
  variant = 'Primary',
  state = 'Default',
  size = 'Medium (md)'
) {
  const isHover = state.toLowerCase().includes('hover');
  const isFocus = state.toLowerCase().includes('focus');
  const isActive = state.toLowerCase().includes('active');
  const isDisabled = state.toLowerCase().includes('disabled');
  const isLoading = state.toLowerCase().includes('loading');

  const isSmall = size.toLowerCase().includes('sm') || size.toLowerCase().includes('small');
  const isLarge = size.toLowerCase().includes('lg') || size.toLowerCase().includes('large');

  const sizeClasses = isSmall
    ? 'px-3 py-1.5 text-xs h-8'
    : isLarge
    ? 'px-6 py-3 text-base h-12'
    : 'px-4 py-2 text-sm h-10';

  if (type === 'button' || !type || type === 'custom') {
    // The spec carries no colour of its own, so the preview is painted in the app's own
    // tokens rather than a second, hardcoded palette.
    let variantClasses = 'bg-accent text-accent-contrast shadow-deep';

    if (variant.toLowerCase().includes('secondary')) {
      variantClasses = 'bg-surface-overlay text-content-primary border border-line hover:bg-surface-raised';
    } else if (variant.toLowerCase().includes('outline')) {
      variantClasses = 'bg-transparent text-accent border border-accent hover:bg-accent/10';
    } else if (variant.toLowerCase().includes('ghost')) {
      variantClasses = 'bg-transparent text-content-primary hover:bg-surface-overlay';
    } else if (variant.toLowerCase().includes('destruct') || variant.toLowerCase().includes('danger')) {
      variantClasses = 'bg-status-danger text-surface-base shadow-deep';
    }

    return (
      <button
        type="button"
        disabled={isDisabled}
        className={clsx(
          'rounded-md font-semibold inline-flex items-center justify-center gap-2 transition-all cursor-pointer',
          sizeClasses,
          variantClasses,
          isHover && 'scale-[1.03] ring-2 ring-accent/40',
          isFocus && 'ring-4 ring-accent/50 outline-none',
          isActive && 'scale-95',
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
      >
        {isLoading && (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        <span>{variant} Action</span>
      </button>
    );
  }

  if (type === 'input') {
    const hasError = state.toLowerCase().includes('error');

    return (
      <div className="w-full max-w-sm space-y-1.5">
        <label htmlFor="preview-input" className="block text-xs font-semibold text-content-primary">
          Email Address
        </label>
        <input
          id="preview-input"
          type="text"
          placeholder="user@example.com"
          disabled={isDisabled}
          defaultValue={hasError ? 'invalid-email' : ''}
          aria-invalid={hasError}
          className={clsx(
            'w-full rounded-sm px-3.5 py-2.5 bg-surface-raised border text-xs text-content-primary placeholder-content-muted transition-all',
            hasError
              ? 'border-status-danger focus:ring-2 focus:ring-status-danger/40'
              : isFocus
              ? 'border-accent ring-2 ring-accent/40'
              : 'border-line focus:border-accent',
            isDisabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        {hasError && (
          <span className="text-[11px] text-status-danger font-medium">Please provide a valid email format.</span>
        )}
      </div>
    );
  }

  if (type === 'badge') {
    let badgeVariant: any = 'brand';
    if (variant.toLowerCase().includes('success')) badgeVariant = 'success';
    else if (variant.toLowerCase().includes('warn')) badgeVariant = 'warning';
    else if (variant.toLowerCase().includes('danger') || variant.toLowerCase().includes('destruct')) badgeVariant = 'error';
    else if (variant.toLowerCase().includes('neutral') || variant.toLowerCase().includes('default')) badgeVariant = 'neutral';

    return (
      <Badge variant={badgeVariant} size={isLarge ? 'md' : 'sm'}>
        <span>{variant} Badge Status</span>
      </Badge>
    );
  }

  return (
    <div className="p-4 rounded-md bg-surface-raised border border-line text-xs text-content-secondary">
      Component preview for {variant}
    </div>
  );
}
