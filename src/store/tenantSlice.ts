import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HospitalTenant } from '../types';

interface TenantState {
  currentTenant: HospitalTenant | null;
}

const initialState: TenantState = {
  currentTenant: null
};

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setCurrentTenant: (state, action: PayloadAction<HospitalTenant | null>) => {
      state.currentTenant = action.payload;
    },
    clearCurrentTenant: state => {
      state.currentTenant = null;
    }
  }
});

export const { setCurrentTenant, clearCurrentTenant } = tenantSlice.actions;
export default tenantSlice.reducer;
