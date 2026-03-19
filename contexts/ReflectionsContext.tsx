import React, { createContext, useContext, useState, useCallback } from "react";

type ReflectionsContextType = {
  /** Incrementa para forçar Histórico e Favoritos a recarregar. */
  refreshTrigger: number;
  /** Chame após salvar uma reflexão ou alternar favorito na Home. */
  refreshReflections: () => void;
};

const ReflectionsContext = createContext<ReflectionsContextType>({
  refreshTrigger: 0,
  refreshReflections: () => {},
});

export const useReflectionsRefresh = () => useContext(ReflectionsContext);

export function ReflectionsProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refreshReflections = useCallback(() => {
    setRefreshTrigger((n) => n + 1);
  }, []);
  return (
    <ReflectionsContext.Provider value={{ refreshTrigger, refreshReflections }}>
      {children}
    </ReflectionsContext.Provider>
  );
}
