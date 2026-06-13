import { validatePassword } from '@/lib/auth-rate-limit';

describe('validatePassword', () => {
  it('rejette les mots de passe trop courts', () => {
    expect(validatePassword('Ab1!')).toMatch(/8 caractères/);
  });
  it('exige une majuscule', () => {
    expect(validatePassword('password1!')).toMatch(/majuscule/);
  });
  it('exige un chiffre', () => {
    expect(validatePassword('Password!')).toMatch(/chiffre/);
  });
  it('exige un caractère spécial', () => {
    expect(validatePassword('Password1')).toMatch(/spécial/);
  });
  it('rejette les mots de passe trop courants', () => {
    expect(validatePassword('Password123!')).toMatch(/courant/);
  });
  it('accepte un mot de passe fort', () => {
    expect(validatePassword('Av3nir!Solide')).toBeNull();
  });
});
