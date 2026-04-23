import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { createContextualCan } from '@casl/react';
import { ability } from './ability';

export const AbilityContext = createContext(ability);
export const Can = createContextualCan(AbilityContext.Consumer);

interface AbilityProviderProps {
  children: ReactNode;
}

export const AbilityProvider = ({ children }: AbilityProviderProps) => {
  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
};

export const useAbility = () => {
  const context = useContext(AbilityContext);
  if (context === undefined) {
    throw new Error('useAbility must be used within an AbilityProvider');
  }
  return context;
};
