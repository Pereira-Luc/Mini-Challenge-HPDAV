import { createSlice } from "@reduxjs/toolkit";
import { FirewallData } from "../util/interface";
import { fetchDataTemplate, fetchFirewallData } from "../util/fetchers";

interface ExampleState {
    dataTemplate: any;
    firewallData: FirewallData[];
    loading: boolean;
    error: string | null;
}

const initialState: ExampleState = {
    dataTemplate: null,
    firewallData: [],
    loading: false,
    error: null,
};

const exampleSlice = createSlice({
    name: "example",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDataTemplate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDataTemplate.fulfilled, (state, action) => {
                state.loading = false;
                state.dataTemplate = action.payload;
            })
            .addCase(fetchDataTemplate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchFirewallData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFirewallData.fulfilled, (state, action) => {
                state.loading = false;
                state.firewallData = action.payload;
            })
            .addCase(fetchFirewallData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default exampleSlice.reducer;
