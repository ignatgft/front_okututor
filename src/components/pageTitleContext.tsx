/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";

type SetTitleFn = (title: string) => void;

const PageTitleContext = createContext<SetTitleFn>(() => {});

export const PageTitleProvider = PageTitleContext.Provider;
export const usePageTitle = (): SetTitleFn => useContext(PageTitleContext);
