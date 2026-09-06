const LOGIN_KEY = 'cb-logged-in';

export const LOGIN_USERNAME = 'n4cun1';
export const LOGIN_PASSWORD = 'nucant007';

export function isLoggedIn(): boolean {
  return localStorage.getItem(LOGIN_KEY) === 'true';
}

export function login(username: string, password: string): boolean {
  const ok = username.trim() === LOGIN_USERNAME && password === LOGIN_PASSWORD;
  if (ok) localStorage.setItem(LOGIN_KEY, 'true');
  return ok;
}

export function logout(): void {
  localStorage.removeItem(LOGIN_KEY);
}
