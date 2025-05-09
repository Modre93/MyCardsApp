import React, {
  useState,
  useEffect,
  createContext,
  PropsWithChildren,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../utils/supabase";

type AuthProps = {
  user: User | null;
  session: Session | null;
  initialized?: boolean;
  signOut?: () => void;
  sID: string | null;
  setSID: (id: string) => void;
  pID: string | null;
  setPID: (id: string) => void;
  type?: string | null;
  setType?: (type: string) => void;
  filieres?: string[] | null;
  setFilieres?: (filiere: string[]) => void;
  grades?: string[] | null;
  setGrades?: (grades: string[]) => void;
};

export const AuthContext = createContext<Partial<AuthProps>>({});

// Custom hook to read the context values
export function useAuth() {
  return React.useContext(AuthContext);
}

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>();
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [sID, setSID] = useState<string | null>(null);
  const [pID, setPID] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [filieres, setFilieres] = useState<string[] | null>(null);
  const [grades, setGrades] = useState<string[] | null>(null);

  useEffect(() => {
    // Listen for changes to authentication state
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session ? session.user : null);
      setInitialized(true);
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // Log out the user
  const signOut = async () => {
    await supabase.auth.signOut();
    setSID(null);
    setPID(null);
  };

  const value = {
    user,
    session,
    initialized,
    signOut,
    sID,
    setSID,
    pID,
    setPID,
    type,
    setType,
    filieres,
    setFilieres,
    grades,
    setGrades,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
