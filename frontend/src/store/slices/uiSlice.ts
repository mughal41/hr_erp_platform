import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
}

const initialState: UIState = {
  sidebarCollapsed: false,
  theme: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
    },
  },
});

export const { toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;
