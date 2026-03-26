import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface EmployeeState {
  list: any[];
  currentEmployee: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: EmployeeState = {
  list: [],
  currentEmployee: null,
  loading: false,
  error: null,
};

const employeeSlice = createSlice({
  name: 'employee',
  initialState,
  reducers: {
    setEmployees(state, action: PayloadAction<any[]>) {
      state.list = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setEmployees, setLoading, setError } = employeeSlice.actions;
export default employeeSlice.reducer;
