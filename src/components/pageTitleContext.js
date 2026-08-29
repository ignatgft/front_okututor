import { createContext, useContext } from "react";

const PageTitleContext = createContext(() => {});

export const PageTitleProvider = PageTitleContext.Provider;
export const usePageTitle = () => useContext(PageTitleContext);
