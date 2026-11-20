import { UserProfileType } from "../../navigation/TypescriptTypes/UserType";
import { call, put, takeLatest } from "redux-saga/effects";
import { fetchUsersFailure, fetchUsersRequest, fetchUsersSuccess } from "../FilteredUsersSlice";
import { fetchVisibleProfiles } from "../../services/supabase/profiles";

const fetchUsersFromSupabase = async (): Promise<UserProfileType[]> => {
    // RLS returns the caller's own profile plus every discoverable profile.
    const profiles = await fetchVisibleProfiles();
    return profiles;
}


function* fetchUsersSaga() {
    try{
        const users:UserProfileType[] = yield call(fetchUsersFromSupabase);
        yield put(fetchUsersSuccess(users))
    }catch (error){
        yield put(fetchUsersFailure('Failed to fetch users.'));
    }
}


export function* FilteredUsersSaga(){
    yield takeLatest(fetchUsersRequest.type,fetchUsersSaga);
}