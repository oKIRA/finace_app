import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  signInAnonymously as firebaseSignInAnonymously,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase/config';
import { categoriesService } from '../services/categoriesService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (e: string, p: string) => Promise<void>;
  signUpWithEmail: (e: string, p: string, displayName?: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  errorMessage: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'finance_app_demo_session';

const createDemoUser = (): User => {
  return {
    uid: 'guest-demo-user',
    email: 'convidado@financas.app',
    displayName: 'Usuário Convidado (Demo)',
    photoURL: null,
    isAnonymous: true,
    emailVerified: false,
    phoneNumber: null,
    providerId: 'demo',
    tenantId: null,
    metadata: {} as any,
    providerData: [],
    refreshToken: '',
    delete: async () => {},
    getIdToken: async () => 'demo-token',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
  } as unknown as User;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check if there was an active local demo session
    const hasDemoSession = localStorage.getItem(DEMO_STORAGE_KEY) === 'true';

    // Safety timeout: Ensure loading is never stuck if auth listener is delayed
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timer);
      if (currentUser) {
        setUser(currentUser);
        localStorage.removeItem(DEMO_STORAGE_KEY);
      } else if (hasDemoSession) {
        const demoUser = createDemoUser();
        setUser(demoUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const clearError = () => setErrorMessage(null);

  const signInWithGoogle = async () => {
    try {
      clearError();
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Login com Google cancelado pelo usuário.');
      } else if (err?.code === 'auth/popup-blocked') {
        setErrorMessage('Pop-up bloqueado pelo navegador. Permita pop-ups ou abra em uma nova aba.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setErrorMessage(
          'Domínio não autorizado no Firebase! Adicione "run.app" em Authentication > Settings > Authorized domains no Firebase Console.'
        );
      } else if (
        err?.code === 'auth/configuration-not-found' ||
        err?.code === 'auth/operation-not-allowed'
      ) {
        setErrorMessage(
          'Provedor Google não ativado no Firebase Console (Authentication > Sign-in method > Google).'
        );
      } else {
        const isIframe = typeof window !== 'undefined' && window.self !== window.top;
        if (isIframe) {
          setErrorMessage(
            'O navegador restringiu pop-ups dentro da janela de pré-visualização (COOP). Abra o aplicativo em uma nova aba do navegador ou entre com E-mail/Senha.'
          );
        } else {
          setErrorMessage(
            err?.message || 'Não foi possível autenticar com o Google. Utilize o "Modo Convidado" para testar o app.'
          );
        }
      }
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      clearError();
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.warn('Email sign-in error:', err);
      if (
        err?.code === 'auth/user-not-found' ||
        err?.code === 'auth/wrong-password' ||
        err?.code === 'auth/invalid-credential'
      ) {
        setErrorMessage('E-mail ou senha incorretos.');
      } else if (err?.code === 'auth/invalid-email') {
        setErrorMessage('Formato de e-mail inválido.');
      } else if (
        err?.code === 'auth/configuration-not-found' ||
        err?.code === 'auth/operation-not-allowed'
      ) {
        setErrorMessage(
          'Autenticação por E-mail/Senha não ativada no Firebase. Acesse via "Modo Convidado (Demonstração)".'
        );
      } else {
        setErrorMessage('Não foi possível entrar. Tente novamente mais tarde.');
      }
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName?: string) => {
    try {
      clearError();
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        setUser({ ...userCredential.user, displayName });
      }
    } catch (err: any) {
      console.warn('Email signup error:', err);
      if (err?.code === 'auth/email-already-in-use') {
        setErrorMessage('Este e-mail já está cadastrado.');
      } else if (err?.code === 'auth/weak-password') {
        setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      } else if (
        err?.code === 'auth/configuration-not-found' ||
        err?.code === 'auth/operation-not-allowed'
      ) {
        setErrorMessage(
          'Cadastro por E-mail/Senha não ativado no Firebase. Acesse via "Modo Convidado (Demonstração)".'
        );
      } else {
        setErrorMessage('Não foi possível criar a conta. Tente novamente.');
      }
      throw err;
    }
  };

  const signInAsGuest = async () => {
    clearError();
    try {
      await firebaseSignInAnonymously(auth);
      localStorage.removeItem(DEMO_STORAGE_KEY);
    } catch (err: any) {
      console.warn('Firebase anonymous auth unavailable, switching to local demo session:', err);
      // Seamless fallback to local guest demo session so user is NEVER blocked
      const demoUser = createDemoUser();
      localStorage.setItem(DEMO_STORAGE_KEY, 'true');
      setUser(demoUser);
      try {
        await categoriesService.getCategories(demoUser.uid);
      } catch {
        // Ignore
      }
    }
  };

  const signOut = async () => {
    try {
      clearError();
      localStorage.removeItem(DEMO_STORAGE_KEY);
      setUser(null);
      await firebaseSignOut(auth);
    } catch {
      setErrorMessage('Erro ao encerrar sessão.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInAsGuest,
        signInAnonymously: signInAsGuest,
        signOut,
        errorMessage,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
