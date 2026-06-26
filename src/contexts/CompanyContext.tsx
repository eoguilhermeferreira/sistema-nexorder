"use client";

import { createContext, useContext } from "react";

export interface Company {
  id: string;
  name: string;
  fantasy_name: string | null;
  slug: string;
}

const CompanyContext = createContext<Company | null>(null);

export function CompanyProvider({
  company,
  children,
}: {
  company: Company;
  children: React.ReactNode;
}) {
  return <CompanyContext.Provider value={company}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const company = useContext(CompanyContext);
  if (!company) throw new Error("useCompany must be used within CompanyProvider");
  return company;
}
