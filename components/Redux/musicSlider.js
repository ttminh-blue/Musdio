import { createSlice } from "@reduxjs/toolkit";

const musicSlider = createSlice({
    name: "musics",
    initialState: [],
    reducers: {
        addMusic(state, action) {
            state.push(action.payload)
        },
        removeMusic(state, action) {
            state.splice(action.payload, 1)
        },
        setSongs(state, action) {
            return state = [...action.payload.data]
        }
    }
})

const { actions } = musicSlider
export const { addMusic, removeMusic, setSongs } = actions
export default musicSlider.reducer