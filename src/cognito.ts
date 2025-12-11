import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

const userPoolId = import.meta.env.VITE_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_USER_POOL_CLIENT_ID;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!userPoolId || !userPoolClientId) {
  throw new Error(
    "Missing Cognito environment variables. Ensure VITE_USER_POOL_ID and VITE_USER_POOL_CLIENT_ID are set."
  );
}

const pool = new CognitoUserPool({
  UserPoolId: userPoolId,
  ClientId: userPoolClientId,
});

export function signUp(
  username: string,
  email: string,
  password: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const u = username.trim();
    const e = email.trim().toLowerCase();

    if (!u) return reject(new Error("Username is required"));
    if (!e) return reject(new Error("Email is required"));
    if (!emailPattern.test(e))
      return reject(new Error("Please enter a valid email address."));
    if (!password) return reject(new Error("Password is required"));

    const attrs = [new CognitoUserAttribute({ Name: "email", Value: e })];

    pool.signUp(u, password, attrs, [], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function confirmSignUp(username: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const u = username.trim();
    const c = code.trim();

    if (!u) return reject(new Error("Username is required"));
    if (!c) return reject(new Error("Confirmation code is required"));

    const user = new CognitoUser({ Username: u, Pool: pool });
    user.confirmRegistration(c, true, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function signIn(
  email: string,
  password: string
): Promise<CognitoUserSession> {
  return new Promise((resolve, reject) => {
    const e = email.trim().toLowerCase();

    if (!e) return reject(new Error("Email is required"));
    if (!emailPattern.test(e))
      return reject(new Error("Please enter a valid email address."));
    if (!password) return reject(new Error("Password is required"));

    const user = new CognitoUser({ Username: e, Pool: pool });
    const auth = new AuthenticationDetails({ Username: e, Password: password });

    user.authenticateUser(auth, {
      onSuccess: (session) => resolve(session),
      onFailure: (err) => reject(err),
      newPasswordRequired: () => reject(new Error("New password required")),
    });
  });
}

export function signOut(): void {
  pool.getCurrentUser()?.signOut();
}

export function getIdToken(): Promise<string | null> {
  return new Promise((resolve) => {
    const user = pool.getCurrentUser();
    if (!user) return resolve(null);

    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) return resolve(null);
      resolve(session.getIdToken().getJwtToken());
    });
  });
}
