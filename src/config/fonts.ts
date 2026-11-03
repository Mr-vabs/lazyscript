export type FontOption = { id: string; label: string; family: string };

// Original eight options are retained; four handwriting styles are added.
export const FONT_OPTIONS: FontOption[] = [
  { id: 'default', label: 'Standard Script', family: "'Segoe Script', 'Caveat', cursive" },
  { id: 'hand', label: 'Just Another Hand', family: "'Just Another Hand', cursive" },
  { id: 'allura', label: 'Autography Style (Allura)', family: "'Allura', cursive" },
  { id: 'apple', label: 'Andelion Style (Homemade Apple)', family: "'Homemade Apple', cursive" },
  { id: 'cedar', label: 'Katalish Style (Cedarville)', family: "'Cedarville Cursive', cursive" },
  { id: 'indie', label: 'Student Messy (Indie Flower)', family: "'Indie Flower', cursive" },
  { id: 'dancing', label: 'Dancing Script', family: "'Dancing Script', cursive" },
  { id: 'shadows', label: 'Shadows Into Light', family: "'Shadows Into Light', cursive" },
  { id: 'patrick', label: 'Patrick Hand', family: "'Patrick Hand', cursive" },
  { id: 'kalam', label: 'Kalam', family: "'Kalam', cursive" },
  { id: 'architects', label: 'Architects Daughter', family: "'Architects Daughter', cursive" },
  { id: 'caveat-brush', label: 'Caveat Brush', family: "'Caveat Brush', cursive" },
];
