import { useTranslation } from 'react-i18next';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

function ArgFlag() {
  return (
    <svg viewBox="0 0 20 14" className="h-3.5 w-5 shrink-0 rounded-sm overflow-hidden">
      <rect width="20" height="14" fill="#74ACDF" />
      <rect y="4.67" width="20" height="4.67" fill="white" />
      <circle cx="10" cy="7" r="1.5" fill="#F6B40E" />
    </svg>
  );
}

function UsaFlag() {
  return (
    <svg viewBox="0 0 20 14" className="h-3.5 w-5 shrink-0 rounded-sm overflow-hidden">
      <rect width="20" height="14" fill="#B22234" />
      <rect y="1.08" width="20" height="1.08" fill="white" />
      <rect y="3.23" width="20" height="1.08" fill="white" />
      <rect y="5.38" width="20" height="1.08" fill="white" />
      <rect y="7.54" width="20" height="1.08" fill="white" />
      <rect y="9.69" width="20" height="1.08" fill="white" />
      <rect y="11.85" width="20" height="1.08" fill="white" />
      <rect width="8" height="7.54" fill="#3C3B6E" />
    </svg>
  );
}

const LANGUAGES = [
  { code: 'es', label: 'Español', Flag: ArgFlag },
  { code: 'en', label: 'English', Flag: UsaFlag },
] as const;

interface LanguageSwitcherProps {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function LanguageSwitcher({ align = 'end', side = 'bottom' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const current = LANGUAGES.find((l) => i18n.language.startsWith(l.code)) ?? LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs font-mono cursor-pointer">
          <current.Flag />
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} className="w-36">
        {LANGUAGES.map(({ code, label, Flag }) => (
          <DropdownMenuItem
            key={code}
            onClick={() => i18n.changeLanguage(code)}
            className="gap-2 cursor-pointer"
          >
            <Flag />
            <span className="flex-1 text-sm">{label}</span>
            {i18n.language.startsWith(code) && <Check className="h-3.5 w-3.5 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
