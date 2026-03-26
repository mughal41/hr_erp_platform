import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
    isAuthenticated: boolean;
    user: null | { id: string; email: string; name: string; role: string };
    token: string | null;
}

const initialState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: localStorage.getItem('access_token'),
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginSuccess(state, action: PayloadAction<{ user: any; token: string }>) {
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;
            localStorage.setItem('access_token', action.payload.token);
        },
        logout(state) {
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            localStorage.removeItem('access_token');
        },
    },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
