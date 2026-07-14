const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/Landing.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add Sun, Moon to lucide-react imports
content = content.replace('GraduationCap', 'GraduationCap,\n  Sun,\n  Moon');

// 2. Add TiltCard component after Animated component
const tiltCardStr = `
// ─── 3D Tilt Card ─────────────────────────────────────────────────────────────
function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;
    
    ref.current.style.transform = \`perspective(1000px) rotateX(\${rotateX}deg) rotateY(\${rotateY}deg) scale3d(1.02, 1.02, 1.02)\`;
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = \`perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)\`;
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: "transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
      className={\`will-change-transform \${className}\`}
    >
      {children}
    </div>
  );
}
`;
content = content.replace('// ─── Section wrapper ──────────────────────────────────────────────────────────', tiltCardStr + '\n// ─── Section wrapper ──────────────────────────────────────────────────────────');

// 3. Update Landing component definition to include state
content = content.replace(
  'export default function Landing() {\n  const navigate = useNavigate();',
  'export default function Landing() {\n  const navigate = useNavigate();\n  const [isDark, setIsDark] = useState(true);'
);

// 4. Update root div wrapper
content = content.replace(
  '<div className="font-poppins relative min-h-screen bg-[#081234] text-white selection:bg-emit-sky selection:text-emit-navy overflow-x-hidden">',
  '<div className={\`font-poppins relative \${isDark ? "dark" : ""}\`}>\n      <div className="relative min-h-screen bg-slate-50 dark:bg-[#081234] text-slate-900 dark:text-white selection:bg-emit-sky selection:text-white overflow-x-hidden transition-colors duration-500">'
);
content = content.replace('export default function Landing()', 'export default function Landing()');
// And add the closing div at the very end
content = content.replace(/    <\/div>\s*\);\s*}\s*$/, '      </div>\n    </div>\n  );\n}');

// 5. Replace general text and bg colors
// bg-[#081234]/60 -> bg-white/80 dark:bg-[#081234]/60
content = content.replace(/bg-\[#081234\]\/60/g, 'bg-white/80 dark:bg-[#081234]/60');
// bg-[#081234]/40 -> bg-slate-100/80 dark:bg-[#081234]/40
content = content.replace(/bg-\[#081234\]\/40/g, 'bg-slate-100/80 dark:bg-[#081234]/40');
// text-white -> dark:text-white text-slate-900 (except in selection and some explicit buttons)
// We'll be careful with text-white
content = content.replace(/text-white(?! selection| bg-)/g, 'text-slate-900 dark:text-white');
// text-slate-300 -> text-slate-600 dark:text-slate-300
content = content.replace(/text-slate-300/g, 'text-slate-600 dark:text-slate-300');
// text-slate-400 -> text-slate-500 dark:text-slate-400
content = content.replace(/text-slate-400/g, 'text-slate-500 dark:text-slate-400');
// text-slate-500 -> text-slate-400 dark:text-slate-500
content = content.replace(/text-slate-500/g, 'text-slate-400 dark:text-slate-500');

// bg-white/5 -> bg-white dark:bg-white/5 shadow-md dark:shadow-none
content = content.replace(/bg-white\/5(?! border| backdrop)/g, 'bg-white dark:bg-white/5 shadow-md dark:shadow-none');
// Wait, some bg-white/5 have " border". Let's just do:
content = content.replace(/bg-white\/5/g, 'bg-white dark:bg-white/5 shadow-md dark:shadow-none');
// border-white/10 -> border-slate-200 dark:border-white/10
content = content.replace(/border-white\/10/g, 'border-slate-200 dark:border-white/10');
// border-white/5 -> border-slate-200 dark:border-white/5
content = content.replace(/border-white\/5/g, 'border-slate-200 dark:border-white/5');

// bg-white/3 -> bg-white dark:bg-white/3 shadow-sm dark:shadow-none
content = content.replace(/bg-white\/3/g, 'bg-white dark:bg-white/3 shadow-sm dark:shadow-none');

// Update header toggle
const toggleStr = `
          <button
            onClick={() => setIsDark(!isDark)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/20 transition-all shadow-sm dark:shadow-none"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
`;
content = content.replace('<div className="flex items-center gap-3">\n          <Link to="/edt"', '<div className="flex items-center gap-3">\n' + toggleStr + '          <Link to="/edt"');

// Fix specific texts that were broken by regex (e.g., text-slate-900 dark:text-white inside Buttons)
// cta-connect-final and cta-connect-hero
content = content.replace(/className="bg-white text-slate-900 dark:text-white/g, 'className="bg-emit-navy dark:bg-white text-white dark:text-emit-navy');
content = content.replace(/text-emit-navy hover:bg-emit-sky hover:text-emit-navy/g, 'hover:bg-emit-sky hover:text-white dark:hover:text-emit-navy');
content = content.replace(/border-white\/20 text-slate-900 dark:text-white hover:bg-white dark:bg-white\/5 shadow-md dark:shadow-none/g, 'border-slate-300 dark:border-white/20 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5');

// 6. Wrap cards in TiltCard
// Problématique cards
content = content.replace(/<div className="group flex items-start gap-4/g, '<TiltCard><div className="group flex items-start gap-4');
content = content.replace(/desc}<\/p>\n                    <\/div>\n                  <\/div>\n                <\/Animated>/g, 'desc}</p>\n                    </div>\n                  </div></TiltCard>\n                </Animated>');

// Fonctionnalités cards
content = content.replace(/<div className={\`group rounded-xl border border-slate-200 dark:border-white\/10 bg-white\/4 p-5 space-y-2/g, '<TiltCard className="h-full"><div className={\`h-full group rounded-xl border border-slate-200 dark:border-white/10 bg-white/4 p-5 space-y-2');
content = content.replace(/desc}<\/p>\n                <\/div>\n              <\/Animated>/g, 'desc}</p>\n                </div></TiltCard>\n              </Animated>');

// Sécurité cards
content = content.replace(/<div key={title} className="group flex items-start gap-3/g, '<TiltCard><div key={title} className="group flex items-start gap-3');
content = content.replace(/desc}<\/p>\n                    <\/div>\n                  <\/div>\n                \)\)/g, 'desc}</p>\n                    </div>\n                  </div></TiltCard>\n                ))');

fs.writeFileSync(file, content);
console.log('Transform complete.');
