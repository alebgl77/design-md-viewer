import React, { useState } from 'react';
import { Component, Layers, Info, ShieldCheck, Code, Eye, Copy, Check } from 'lucide-react';
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-[#1b2b21]">
        <h2 className="text-xl font-bold text-[#cbd5e1] flex items-center gap-2">
          <Component className="w-5 h-5 text-pink-400" />
          Component Specifications & Code Generators
        </h2>
        <p className="text-xs text-[#94a3b8] mt-0.5">
          {components.length} UI components parsed with live preview controls and multi-framework code export.
        </p>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar - Component List */}
        <div className="lg:col-span-4 rounded-2xl bg-[#0e1611]/60 border border-[#1b2b21] p-3 space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] px-3 py-2">
            Available Components
          </div>
          {components.map((comp) => {
            const isSelected = comp.id === (activeComp?.id || '');
            return (
              <button
                key={comp.id}
                type="button"
                onClick={() => {
                  setSelectedCompId(comp.id);
                  if (comp.variants && comp.variants.length > 0) {
                    setSelectedVariant(comp.variants[0].name);
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/40 shadow-sm'
                    : 'text-[#94a3b8] hover:text-[#cbd5e1] hover:bg-[#111a14]/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-pink-400" />
                  <span>{comp.name}</span>
                </div>
                {comp.variants && (
                  <span className="text-[10px] font-mono text-[#64748b]">
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
            <div className="p-6 rounded-2xl bg-[#0e1611]/70 border border-[#1b2b21] shadow-xl space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#1b2b21]">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <h3 className="text-xl font-bold text-white">{activeComp.name}</h3>
                    <Badge variant="brand" size="sm">
                      Interactive Preview
                    </Badge>
                  </div>
                  <p className="text-xs text-[#cbd5e1] max-w-xl leading-relaxed">
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
              <div className="flex items-center justify-between border-b border-[#1b2b21] pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      activeTab === 'preview' ? 'bg-[#0c6e4e] text-white' : 'text-[#94a3b8] hover:text-[#cbd5e1]'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('react')}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      activeTab === 'react' ? 'bg-[#0c6e4e] text-white' : 'text-[#94a3b8] hover:text-[#cbd5e1]'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>React + Tailwind JSX</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('html')}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      activeTab === 'html' ? 'bg-[#0c6e4e] text-white' : 'text-[#94a3b8] hover:text-[#cbd5e1]'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>HTML + Tailwind</span>
                  </button>
                </div>
              </div>

              {activeTab === 'preview' ? (
                <>
                  {/* Controls Bar for Live Preview */}
                  <div className="flex flex-wrap items-center gap-4 p-3 rounded-xl bg-black/80 border border-[#1b2b21]/80 text-xs">
                    {activeComp.variants && activeComp.variants.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#64748b] font-medium">Variant:</span>
                        <select
                          value={selectedVariant}
                          onChange={(e) => setSelectedVariant(e.target.value)}
                          className="bg-[#0e1611] border border-[#1b2b21] text-[#cbd5e1] rounded px-2 py-1 focus:outline-none focus:border-[#10b981] text-xs font-semibold"
                        >
                          {activeComp.variants.map((v) => (
                            <option key={v.name} value={v.name}>{v.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {activeComp.states && activeComp.states.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#64748b] font-medium">State:</span>
                        <select
                          value={selectedState}
                          onChange={(e) => setSelectedState(e.target.value)}
                          className="bg-[#0e1611] border border-[#1b2b21] text-[#cbd5e1] rounded px-2 py-1 focus:outline-none focus:border-[#10b981] text-xs font-semibold"
                        >
                          {activeComp.states.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {activeComp.sizes && activeComp.sizes.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#64748b] font-medium">Size:</span>
                        <select
                          value={selectedSize}
                          onChange={(e) => setSelectedSize(e.target.value)}
                          className="bg-[#0e1611] border border-[#1b2b21] text-[#cbd5e1] rounded px-2 py-1 focus:outline-none focus:border-[#10b981] text-xs font-semibold"
                        >
                          {activeComp.sizes.map((sz) => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Live Canvas Preview */}
                  <div className="min-h-[160px] p-8 rounded-xl bg-[#0b0f0c] border border-[#1b2b21]/80 flex flex-col items-center justify-center relative shadow-inner">
                    <div className="absolute top-2.5 right-2.5">
                      <span className="text-[10px] font-mono text-[#64748b] bg-[#0e1611] px-2 py-0.5 rounded border border-[#1b2b21]">
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
                    <span className="text-xs font-mono text-[#94a3b8]">
                      {activeTab === 'react' ? `${activeComp.name}.tsx` : `${activeComp.name}.html`}
                    </span>
                    <CopyButton
                      text={activeTab === 'react' ? generateReactCode(activeComp, selectedVariant, selectedSize) : generateHtmlCode(activeComp, selectedVariant)}
                      label="Copy Component"
                      variant="secondary"
                    />
                  </div>
                  <pre className="p-4 rounded-xl bg-[#0b0f0c] border border-[#1b2b21] text-xs font-mono text-[#cbd5e1] overflow-x-auto max-h-[300px] leading-relaxed">
                    {activeTab === 'react' ? generateReactCode(activeComp, selectedVariant, selectedSize) : generateHtmlCode(activeComp, selectedVariant)}
                  </pre>
                </div>
              )}
            </div>

            {/* Anatomy, Tokens, Guidelines Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeComp.variants && (
                <div className="p-5 rounded-2xl bg-[#0e1611]/60 border border-[#1b2b21] space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[#34d399]" />
                    <span>Variants ({activeComp.variants.length})</span>
                  </div>
                  <div className="space-y-2">
                    {activeComp.variants.map((v, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-[#0b0f0c] border border-[#1b2b21]/80 text-xs">
                        <div className="font-semibold text-[#cbd5e1]">{v.name}</div>
                        {v.description && <div className="text-[#94a3b8] text-[11px] mt-0.5">{v.description}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeComp.anatomy && activeComp.anatomy.length > 0 && (
                <div className="p-5 rounded-2xl bg-[#0e1611]/60 border border-[#1b2b21] space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-sky-400" />
                    <span>Anatomy & Structure</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#cbd5e1]">
                    {activeComp.anatomy.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeComp.tokensUsed && activeComp.tokensUsed.length > 0 && (
                <div className="p-5 rounded-2xl bg-[#0e1611]/60 border border-[#1b2b21] space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
                    Design Tokens Used
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeComp.tokensUsed.map((token, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-[#0b0f0c] border border-[#1b2b21] text-[11px] font-mono text-[#34d399]">
                        {token}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeComp.a11yNotes && activeComp.a11yNotes.length > 0 && (
                <div className="p-5 rounded-2xl bg-[#0e1611]/60 border border-[#1b2b21] space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Accessibility Notes</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#cbd5e1]">
                    {activeComp.a11yNotes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
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
    let variantClasses = 'bg-[#0c6e4e] text-white shadow-md shadow-indigo-600/30';

    if (variant.toLowerCase().includes('secondary')) {
      variantClasses = 'bg-[#15221a] text-[#cbd5e1] border border-[#1b2b21] hover:bg-[#1a2a20]';
    } else if (variant.toLowerCase().includes('outline')) {
      variantClasses = 'bg-transparent text-[#34d399] border border-[#10b981]/80 hover:bg-[#10b981]/10';
    } else if (variant.toLowerCase().includes('ghost')) {
      variantClasses = 'bg-transparent text-[#cbd5e1] hover:bg-[#15221a]';
    } else if (variant.toLowerCase().includes('destruct') || variant.toLowerCase().includes('danger')) {
      variantClasses = 'bg-rose-600 text-white shadow-md shadow-rose-600/30 hover:bg-rose-500';
    }

    return (
      <button
        type="button"
        disabled={isDisabled}
        className={`rounded-lg font-semibold inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${sizeClasses} ${variantClasses} ${
          isHover ? 'scale-[1.03] ring-2 ring-indigo-400/40' : ''
        } ${isFocus ? 'ring-4 ring-indigo-500/50 outline-none' : ''} ${
          isActive ? 'scale-95' : ''
        } ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
      >
        {isLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        <span>{variant} Action</span>
      </button>
    );
  }

  if (type === 'input') {
    return (
      <div className="w-full max-w-sm space-y-1.5">
        <label className="block text-xs font-semibold text-[#cbd5e1]">
          Email Address
        </label>
        <input
          type="text"
          placeholder="user@example.com"
          disabled={isDisabled}
          defaultValue={state.toLowerCase().includes('error') ? 'invalid-email' : ''}
          className={`w-full rounded-lg px-3.5 py-2.5 bg-[#0e1611] border text-xs text-[#cbd5e1] placeholder-[#64748b] transition-all ${
            state.toLowerCase().includes('error')
              ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/40'
              : isFocus
              ? 'border-[#10b981] ring-2 ring-indigo-500/40'
              : 'border-[#1b2b21] focus:border-[#10b981]'
          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {state.toLowerCase().includes('error') && (
          <span className="text-[11px] text-rose-400 font-medium">Please provide a valid email format.</span>
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
    <div className="p-4 rounded-xl bg-[#0e1611] border border-[#1b2b21] text-xs text-[#cbd5e1]">
      Component preview for {variant}
    </div>
  );
}
