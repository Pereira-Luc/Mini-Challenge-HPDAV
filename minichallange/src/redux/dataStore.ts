import { configureStore } from "@reduxjs/toolkit";

const store = configureStore({
    reducer: {
        // DATA GOES HERE
    },
});
    
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;