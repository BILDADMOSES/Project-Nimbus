export interface Language {
  code: string;
  name: string;
}

export interface LanguageSelectProps {
  selectedLanguage: Language | null;
  onSelect: (language: Language) => void;
}
