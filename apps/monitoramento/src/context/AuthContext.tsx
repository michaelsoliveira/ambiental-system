'use client'

import React, { createContext, ReactNode, useContext } from "react";
import useClient from "@/hooks/use-client";

type AuthContextType = {
    client: any;
}

type AuthContextProvider = {
    children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextType)

export const AuthProvider = ({ children }: AuthContextProvider) => {

    const client = useClient()

    return (
        <AuthContext.Provider value={{ client }}>
            { children }
        </AuthContext.Provider>
    )    
}

export const useAuthContext = () => useContext(AuthContext);