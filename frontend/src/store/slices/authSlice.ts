import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
    isAuthenticated: boolean;
    user: null | any;
    token: string | null;
}

const storedToken = localStorage.getItem('access_token');
const storedUserJSON = localStorage.getItem('user');
let storedUser = null;

try {
    if (storedUserJSON) {
        storedUser = JSON.parse(storedUserJSON);
    }
} catch (e) {
    console.warn("Failed to parse stored user", e);
}

const initialState: AuthState = {
    isAuthenticated: !!storedToken,
    user: storedUser,
    token: storedToken,
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
            localStorage.setItem('user', JSON.stringify(action.payload.user));
        },
        logout(state) {
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
        },
    },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
