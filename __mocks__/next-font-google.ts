// Mock de next/font/google pour les tests : next/font est une transformation au build
// (plugin SWC) et n'est pas importable tel quel sous ts-jest. Chaque police renvoie un
// objet minimal compatible avec l'usage `.style.fontFamily`.
const make = () => ({ style: { fontFamily: 'mock-font' }, className: 'mock-font', variable: '--mock-font' });

export const Inter = make;
export const Bebas_Neue = make;
export const Plus_Jakarta_Sans = make;
export const Lato = make;
export const Playfair_Display = make;
