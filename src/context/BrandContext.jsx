import React, { createContext, useContext, useState } from 'react';

const BrandContext = createContext();
export const useBrand = () => useContext(BrandContext);

const DEFAULT_BRAND = {
  name: 'VÉRTICE FASHION',
  logo: null,
  theme: 'dark',
  nit: '',
  address: '',
  phone: '',
  email: '',
  slogan: 'ERP contable'
};

export const BrandProvider = ({ children }) => {
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const updateBrand = async (newConfig) => setBrand(prev => ({ ...prev, ...newConfig, name: 'VÉRTICE FASHION' }));

  return (
    <BrandContext.Provider value={{ brand, updateBrand, loading: false }}>
      {children}
    </BrandContext.Provider>
  );
};
