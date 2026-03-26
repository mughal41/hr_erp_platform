import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

const initialState: Notification[] = [];

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<Notification>) {
      state.push(action.payload);
    },
    removeNotification(state, action: PayloadAction<string>) {
      return state.filter((n) => n.id !== action.payload);
    },
  },
});

export const { addNotification, removeNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
