import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface ChatState {
  activeChatUserId: string | null;
}

const initialState: ChatState = {
  activeChatUserId: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChatUserId: (state, action: PayloadAction<string | null>) => {
      console.log('REDUX_CHAT: Setting active chat user ID:', action.payload);
      state.activeChatUserId = action.payload;
    },
    clearActiveChatUserId: state => {
      console.log(
        'REDUX_CHAT: Clearing active chat user ID (was:',
        state.activeChatUserId,
        ')',
      );
      state.activeChatUserId = null;
    },
  },
});

export const {setActiveChatUserId, clearActiveChatUserId} = chatSlice.actions;
export default chatSlice.reducer;
