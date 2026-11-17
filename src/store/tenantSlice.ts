import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HospitalTenant } from '../types';
import { SubscriptionSummary } from '../services/api';

interface TenantState {
  currentTenant: HospitalTenant | null;
  subscription: SubscriptionSummary | null;
}

const initialState: TenantState = {
  currentTenant: null,
  subscription: null
};

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setCurrentTenant: (state, action: PayloadAction<HospitalTenant | null>) => {
      state.currentTenant = action.payload;
    },
    setCurrentSubscription: (state, action: PayloadAction<SubscriptionSummary | null>) => {
      state.subscription = action.payload;
    },
    clearCurrentTenant: state => {
      state.currentTenant = null;
      state.subscription = null;
    }
  }
});

export const { setCurrentTenant, setCurrentSubscription, clearCurrentTenant } = tenantSlice.actions;
export default tenantSlice.reducer;
