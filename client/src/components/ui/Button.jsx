const variants = {
  primary: 'bg-stone-900 text-white hover:bg-stone-700 disabled:bg-stone-400',
  secondary: 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50 disabled:text-stone-300',
  danger: 'bg-[#A32D2D] text-white hover:bg-[#791F1F] disabled:bg-red-300',
  ghost: 'text-stone-500 hover:bg-stone-100 hover:text-stone-700',
};

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
